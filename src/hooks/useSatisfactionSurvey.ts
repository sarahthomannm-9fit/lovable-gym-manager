
import { useState } from "react";

export interface SurveyResponse {
  id: number;
  studentId: number;
  studentName: string;
  date: string;
  clarity: number; // 1-5
  teacherAttention: number; // 1-5
  communication: number; // 1-5
  overallSatisfaction: number; // 1-5
  comments?: string;
}

export function useSatisfactionSurvey() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);

  const addResponse = (response: Omit<SurveyResponse, 'id' | 'date'>) => {
    const newResponse: SurveyResponse = {
      id: responses.length + 1,
      date: new Date().toISOString().split('T')[0],
      ...response
    };
    setResponses([...responses, newResponse]);
    return newResponse;
  };

  const getAverageRatings = () => {
    if (responses.length === 0) return null;
    
    const totals = responses.reduce((acc, response) => ({
      clarity: acc.clarity + response.clarity,
      teacherAttention: acc.teacherAttention + response.teacherAttention,
      communication: acc.communication + response.communication,
      overallSatisfaction: acc.overallSatisfaction + response.overallSatisfaction
    }), { clarity: 0, teacherAttention: 0, communication: 0, overallSatisfaction: 0 });

    const count = responses.length;
    return {
      clarity: (totals.clarity / count).toFixed(1),
      teacherAttention: (totals.teacherAttention / count).toFixed(1),
      communication: (totals.communication / count).toFixed(1),
      overallSatisfaction: (totals.overallSatisfaction / count).toFixed(1)
    };
  };

  return {
    responses,
    addResponse,
    getAverageRatings
  };
}
