
const { GoogleGenAI, FunctionDeclaration, Type } = require("@google/genai");

// Securely access the API key from environment variables set in the Netlify UI.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // This will cause the function to fail safely if the key is not set.
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey });

// --- New, More Precise Tools for the AI Judge ---

const upholdTool = {
  name: 'uphold_complaint',
  description: 'Uphold the original complaint. The penalty stands as is.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      explanation: {
        type: Type.STRING,
        description: 'A witty, slightly sarcastic, but fair explanation for upholding the complaint.'
      }
    },
    required: ['explanation']
  }
};

const reducePenaltyTool = {
  name: 'reduce_penalty',
  description: 'The complaint is partially valid, but the penalty is too high. Reduce the penalty points.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      newPenalty: {
        type: Type.NUMBER,
        description: 'The new, reduced number of points for the penalty.'
      },
      explanation: {
        type: Type.STRING,
        description: 'A witty, slightly sarcastic, but fair explanation for reducing the penalty.'
      }
    },
    required: ['newPenalty', 'explanation']
  }
};

const dismissTool = {
  name: 'dismiss_complaint',
  description: 'Dismiss the complaint entirely. The appeal is successful, and all points are returned.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      explanation: {
        type: Type.STRING,
        description: 'A witty, slightly sarcastic, but fair explanation for dismissing the complaint.'
      }
    },
    required: ['explanation']
  }
};

// --- Main Serverless Function Handler ---

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const complaint = JSON.parse(event.body);

    if (!complaint || !complaint.appeal) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing appeal data in request body." }) };
    }

    // --- New, More Concise Prompt ---
    const prompt = `
      You are the "Family Supreme Court Judge" for a couple, Vikulya and Yanik, resolving a dispute from their app.

      DISPUTE DETAILS:
      - Complaint: "${complaint.description}"
      - Original Penalty: ${complaint.points} points
      - Plaintiff's Argument (appealing): "${complaint.appeal.plaintiffArg}"
      - Defendant's Argument (defending complaint): "${complaint.appeal.defendantArg}"

      YOUR TASK:
      Analyze the arguments and make a final ruling by calling ONE of the following functions:
      1. uphold_complaint: If the original complaint is fully justified.
      2. reduce_penalty: If the complaint has merit, but the penalty is excessive. You must specify the new, lower penalty.
      3. dismiss_complaint: If the appeal is successful and the complaint was unfair. The penalty is completely removed.

      Your explanation should be wise, fair, and slightly entertaining. You MUST call one of the three functions.
    `;

    // --- AI Model Call ---
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using the cost-effective model
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [upholdTool, reducePenaltyTool, dismissTool] }],
        toolConfig: { functionCallingConfig: { mode: 'ANY' } } // Force tool use
      }
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const call = calls[0];
      const args = call.args;
      let result;

      // --- Process the AI's Decision ---
      switch (call.name) {
        case 'uphold_complaint':
          result = {
            decision: 'uphold',
            explanation: args.explanation,
            points: complaint.points // Original points
          };
          break;
        case 'reduce_penalty':
          result = {
            decision: 'reduce',
            explanation: args.explanation,
            points: args.newPenalty // New, reduced points
          };
          break;
        case 'dismiss_complaint':
          result = {
            decision: 'dismiss',
            explanation: args.explanation,
            points: 0 // Penalty is removed
          };
          break;
        default:
          throw new Error(`Unknown tool called: ${call.name}`);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    // Fallback if the AI fails to call a function
    throw new Error("The judge failed to make a decision (no tool was called).");

  } catch (error) {
    console.error("Gemini Judge Error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'error',
        explanation: 'A technical error occurred in the high court. The original judgment stands by default.'
      })
    };
  }
};
