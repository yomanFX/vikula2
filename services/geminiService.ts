import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Complaint } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the tool for the judge
const rulingTool: FunctionDeclaration = {
  name: 'issueRuling',
  description: 'Issue a binding judgment on the family dispute. You must choose to Uphold the fine, Annul it completely, or Reduce it.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      verdict: {
        type: Type.STRING,
        enum: ['uphold', 'annul', 'reduce'],
        description: 'UPHOLD: Defendant is guilty, pay full fine. ANNUL: Plaintiff is right, cancel fine. REDUCE: Both wrong/right, lower the fine.'
      },
      newPenaltyPoints: {
        type: Type.INTEGER,
        description: 'If verdict is REDUCE, this is the new penalty amount (must be negative number, e.g. -50). If UPHOLD or ANNUL, ignore this.',
      },
      explanation: {
        type: Type.STRING,
        description: 'A witty, slightly sarcastic, short ruling explanation addressed to Vikulya and Yanik in Russian language.'
      }
    },
    required: ['verdict', 'explanation']
  }
};

export interface JudgeResult {
  decision: 'uphold' | 'annul' | 'reduce';
  newPoints?: number;
  explanation: string;
}

export const judgeCase = async (complaint: Complaint): Promise<JudgeResult> => {
  if (!complaint.appeal) throw new Error("No appeal data");

  const systemInstruction = `
    You are the AI Supreme Court Judge for a couple's relationship app (Vikulya & Yanik).
    Your goal is fair but entertaining justice.
    
    IMPORTANT: You must respond entirely in RUSSIAN language.
    
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
    
    Tone: Short, decisive, fair, slightly humorous, strictly in Russian.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: "Review the case arguments and issue a ruling immediately.",
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [rulingTool] }],
        toolConfig: { functionCallingConfig: { mode: 'ANY' } } // Force tool use
      }
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const args = calls[0].args as any;
      return {
        decision: args.verdict,
        newPoints: args.newPenaltyPoints,
        explanation: args.explanation
      };
    }
    
    throw new Error("Judge refused to issue a formal ruling (Tool not called).");

  } catch (error) {
    console.error("Gemini Judge Error:", error);
    return {
      decision: 'uphold',
      explanation: 'Системная ошибка: Судья ушел на обед. Апелляция отклонена по умолчанию.'
    };
  }
};
