
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/genai");

const MODEL_NAME = "gemini-1.5-flash-latest";
const API_KEY = process.env.GEMINI_API_KEY;

// Define the tool for the judge
const rulingTool = {
  name: 'issueRuling',
  description: 'Issue a binding judgment on the family dispute. You must choose to Uphold the fine, Annul it completely, or Reduce it.',
  parameters: {
    type: 'OBJECT',
    properties: {
      verdict: {
        type: 'STRING',
        enum: ['uphold', 'annul', 'reduce'],
        description: 'UPHOLD: Defendant is guilty, pay full fine. ANNUL: Plaintiff is right, cancel fine. REDUCE: Both wrong/right, lower the fine.'
      },
      newPenaltyPoints: {
        type: 'INTEGER',
        description: 'If verdict is REDUCE, this is the new penalty amount (must be negative number, e.g. -50). If UPHOLD or ANNUL, ignore this.',
      },
      explanation: {
        type: 'STRING',
        description: 'A witty, slightly sarcastic, short ruling explanation addressed to Vikulya and Yanik.'
      }
    },
    required: ['verdict', 'explanation']
  }
};


exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { complaint } = JSON.parse(event.body);

    if (!complaint || !complaint.appeal) {
      return { statusCode: 400, body: 'Bad Request: Missing complaint or appeal data.' };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const systemInstruction = `
    You are the AI Supreme Court Judge for a couple's relationship app (Vikulya & Yanik).
    Your goal is fair but entertaining justice.

    CONTEXT:
    - User "${complaint.user}" was accused of: "${complaint.category}" (${complaint.description}).
    - The current penalty is: ${complaint.points} points.

    THE DISPUTE:
    - PLAINTIFF (Appealing the fine): "${complaint.appeal.plaintiffArg}"
    - DEFENDANT (Wants fine to stick): "${complaint.appeal.defendantArg}"

    YOUR JOB:
    1. Analyze the arguments. Who is making more sense? Is the fine too harsh?
    2. Call the function 'issueRuling' with one of these decisions:
       - 'annul': The Plaintiff is totally right. The complaint is bogus. (Points become 0).
       - 'uphold': The Defendant is right. The Plaintiff is guilty. (Points stay same).
       - 'reduce': It's complicated. The Plaintiff is guilty but the fine is too high. (Set a new, smaller negative number).

    Tone: Short, decisive, fair, slightly humorous.
  `;

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [],
    tools: [{ functionDeclarations: [rulingTool] }]
  });


  const result = await chat.sendMessage(systemInstruction);
  const { functionCalls } = result.response;

  if (functionCalls && functionCalls.length > 0) {
    const args = functionCalls[0].args;
      return {
        statusCode: 200,
        body: JSON.stringify({
          decision: args.verdict,
          newPoints: args.newPenaltyPoints,
          explanation: args.explanation
        })
      };
    }

    return { statusCode: 500, body: 'AI failed to make a ruling.' };

  } catch (error) {
    console.error('Error processing request:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
