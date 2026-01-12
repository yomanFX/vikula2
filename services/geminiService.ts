
import { Complaint } from "../types";

export interface JudgeResult {
  decision: 'cancel' | 'keep';
  explanation: string;
}

export const judgeCase = async (complaint: Complaint): Promise<JudgeResult> => {
  if (!complaint.appeal) {
    throw new Error("Cannot judge a case without appeal data.");
  }

  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(complaint),
    });

    if (!response.ok) {
      // Try to parse the error response from the function, but fall back to a generic error.
      try {
        const errorResult = await response.json();
        return {
          decision: errorResult.decision || 'keep',
          explanation: errorResult.explanation || `The server-judge returned an error: ${response.statusText}`,
        };
      } catch (e) {
        return {
          decision: 'keep',
          explanation: `A non-JSON error occurred. The server responded with: ${response.status} ${response.statusText}. The original status stands.`,
        };
      }
    }

    const result: JudgeResult = await response.json();
    return result;

  } catch (error) {
    console.error("Error calling the judge function:", error);
    return {
      decision: 'keep',
      explanation: 'A network or client-side error occurred while trying to reach the high court. The original judgment stands by default.'
    };
  }
};
