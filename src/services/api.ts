import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { GradingResult } from '../types';

const API_URL = `${API_BASE_URL}/grading`;

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
