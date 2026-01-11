
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Complaint, AppealData } from "../types";

// NOTE: In a real build, this comes from process.env.API_KEY. 
// Ensuring it is accessed safely.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const rulingTool: FunctionDeclaration = {
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

export interface JudgeResult {
  decision: 'cancel' | 'keep';
  explanation: string;
}

export const judgeCase = async (complaint: Complaint): Promise<JudgeResult> => {
  if (!complaint.appeal) throw new Error("No appeal data");

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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [rulingTool] }],
        toolConfig: { functionCallingConfig: { mode: 'ANY' } } // Force tool use
      }
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const args = calls[0].args as any;
      return {
        decision: args.decision,
        explanation: args.explanation
      };
    }
    
    throw new Error("Judge fell asleep (No tool called).");

  } catch (error) {
    console.error("Gemini Judge Error:", error);
    return {
      decision: 'keep',
      explanation: 'Technical error in the court. The original status stands by default.'
    };
  }
};
