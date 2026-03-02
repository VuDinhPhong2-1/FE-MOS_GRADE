import axios from 'axios';
import type { GradingResult } from '../types';

const API_URL = 'https://localhost:7223/api/grading';

export const gradeProject = async (
  projectCode: string,
  studentFile: File
): Promise<GradingResult> => {
  const formData = new FormData();
  formData.append('studentFile', studentFile);

  const response = await axios.post<GradingResult>(
    `${API_URL}/${projectCode.toLowerCase()}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};
