import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "../config/api";
import type { GradingResult } from "../types";

const API_URL = `${API_BASE_URL}/grading`;

export interface GradeProjectPayload {
	projectCode: string;
	studentFile: File;
}

export const gradeProject = async (
	projectCode: string,
	studentFile: File,
): Promise<GradingResult> => {
	const formData = new FormData();
	formData.append("studentFile", studentFile);

	const response = await fetch(`${API_URL}/${projectCode.toLowerCase()}`, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		let errorMessage = `Grading request failed with status: ${response.status}`;
		try {
			const errorData = await response.json();
			if (errorData?.message) {
				errorMessage = errorData.message;
			}
		} catch {
			// Response was not JSON
		}
		throw new Error(errorMessage);
	}

	return response.json();
};

export const useGradeProjectMutation = (
	options?: Omit<
		UseMutationOptions<GradingResult, Error, GradeProjectPayload>,
		"mutationFn"
	>,
) => {
	return useMutation<GradingResult, Error, GradeProjectPayload>({
		mutationFn: ({ projectCode, studentFile }) =>
			gradeProject(projectCode, studentFile),
		...options,
	});
};
