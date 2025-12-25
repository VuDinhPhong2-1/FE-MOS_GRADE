import axios from 'axios';
import type { GradingResult } from '../types';

// Lưu ý: Cần đảm bảo Backend đã Enable CORS cho port của Frontend (thường là 5173)
const API_URL = 'http://localhost:5293/api/grading';

export const gradeProject = async (
  projectCode: string, 
  studentFile: File, 
  answerFile: File
): Promise<GradingResult> => {
  const formData = new FormData();
  formData.append('studentFile', studentFile);
  formData.append('answerFile', answerFile);

  // Hiện tại chỉ có project09, sau này có thể mở rộng projectCode dynamic
  const response = await axios.post<GradingResult>(`${API_URL}/${projectCode.toLowerCase()}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
