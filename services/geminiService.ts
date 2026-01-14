import { Complaint } from "../types";

export interface JudgeResult {
  decision: 'uphold' | 'annul' | 'reduce';
  newPoints?: number;
  explanation: string;
}

export const judgeCase = async (complaint: Complaint): Promise<JudgeResult> => {
  if (!complaint.appeal) throw new Error("No appeal data");

  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ complaint }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Gemini Judge Error:", error);
    return {
      decision: 'uphold',
      explanation: 'Системная ошибка: Судья ушел на обед. Апелляция отклонена по умолчанию.'
    };
  }
};
