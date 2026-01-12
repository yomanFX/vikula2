
const { GoogleGenAI, FunctionDeclaration, Type } = require("@google/genai");

// In Netlify, environment variables are set in the UI or netlify.toml.
// This is the secure way to handle API keys.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey });

const rulingTool = {
  name: 'makeRuling',
  description: 'Issue a final binding judgment on the family dispute.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      decision: {
        type: Type.STRING,
        enum: ['cancel', 'keep'],
        description: 'Whether to cancel (annul) the activity/complaint or keep it (uphold it).'
      },
      explanation: {
        type: Type.STRING,
        description: 'A witty, slightly sarcastic, but fair explanation of the ruling.'
      }
    },
    required: ['decision', 'explanation']
  }
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const complaint = JSON.parse(event.body);

    if (!complaint || !complaint.appeal) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing appeal data in request body." }) };
    }

    const prompt = `
      You are the "Family Supreme Court Judge" for a couple, Vikulya and Yanik.
      Your job is to resolve a dispute about a specific "Activity" logged in their relationship app.

      The Activity:
      Type: ${complaint.type}
      Category: ${complaint.category}
      Description: "${complaint.description}"
      Points involved: ${complaint.points}
      Original User (Accused/Doer): ${complaint.user}

      THE DISPUTE:
      Plaintiff (The one appealing): "${complaint.appeal.plaintiffArg}"
      Defendant (The original author): "${complaint.appeal.defendantArg}"

      Task:
      Analyze both sides. Be wise, fair, but also entertaining.
      If the appeal is valid (e.g., the complaint was unfair, or the good deed was fake), decide to 'cancel' it.
      If the original activity stands (e.g., the complaint is valid, or the good deed is real), decide to 'keep' it.

      Call the function 'makeRuling' with your decision.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [rulingTool] }],
        toolConfig: { functionCallingConfig: { mode: 'ANY' } }
      }
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const args = calls[0].args;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: args.decision,
          explanation: args.explanation
        })
      };
    }

    throw new Error("Judge fell asleep (No tool called).");

  } catch (error) {
    console.error("Gemini Judge Error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'keep',
        explanation: 'A technical error occurred in the high court. The original judgment stands by default.'
      })
    };
  }
};
