
import { Complaint } from "../types";

export interface JudgeResult {
  decision: 'uphold' | 'annul' | 'reduce';
  newPoints?: number;
  explanation: string;
}

export const judgeCase = async (complaint: Complaint): Promise<JudgeResult> => {
  if (!complaint.appeal) {
    throw new Error("No appeal data");
  }

  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ complaint }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Netlify function error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Gemini Judge Error:", error);
    return {
      decision: 'uphold',
      explanation: 'System Error: The AI Judge is on coffee break. Appeal rejected by default.'
    };
  }
};
