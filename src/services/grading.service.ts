// src/services/grading.service.ts

import type { GradingResult } from '../types/grading.types';

const API_BASE_URL = 'https://localhost:7223/api';

export const gradingService = {
    /**
     * Chấm điểm Project 09
     * @param studentFile - File bài làm của học sinh
     * @param answerFile - File đáp án chung
     * @param getAccessToken - Hàm lấy token xác thực
     */
    async gradeProject09(
        studentFile: File,
        answerFile: File,
        getAccessToken: () => Promise<string | null>
    ): Promise<GradingResult> {
        const accessToken = await getAccessToken();

        const formData = new FormData();
        formData.append('studentFile', studentFile);
        formData.append('answerFile', answerFile);

        const response = await fetch(`${API_BASE_URL}/grading/project09`, {
            method: 'POST',
            headers: {
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: Không thể chấm điểm`);
        }

        return response.json();
    },
};
