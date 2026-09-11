import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { assignmentService } from "../../../services/assignment.service";
import type {
	Assignment,
	GradingEndpointInfo,
} from "../../../types/assignment.types";

interface UseGradingDataProps {
	classId: string;
	isOpen?: boolean;
	showInactiveAssignments: boolean;
}

export const useGradingData = ({
	classId,
	isOpen = true,
	showInactiveAssignments,
}: UseGradingDataProps) => {
	const { getAccessToken } = useAuth();
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [gradingEndpoints, setGradingEndpoints] = useState<
		GradingEndpointInfo[]
	>([]);
	const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(false);
	const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

	const loadAssignments = useCallback(async () => {
		if (!classId) return;
		setIsLoadingAssignments(true);
		try {
			const data = await assignmentService.getByClass(classId, getAccessToken, {
				includeInactive: showInactiveAssignments,
			});
			setAssignments(data);
		} catch (error) {
			console.error("Lỗi khi tải danh sách bài tập:", error);
			alert("Không thể tải danh sách bài tập!");
		} finally {
			setIsLoadingAssignments(false);
		}
	}, [classId, getAccessToken, showInactiveAssignments]);

	const loadGradingEndpoints = useCallback(async () => {
		setIsLoadingEndpoints(true);
		try {
			const data = await assignmentService.getGradingEndpoints(getAccessToken);
			setGradingEndpoints(data);
		} catch (error) {
			console.error("Lỗi khi tải danh sách đầu chấm điểm:", error);
		} finally {
			setIsLoadingEndpoints(false);
		}
	}, [getAccessToken]);

	useEffect(() => {
		if (isOpen && classId) {
			void loadGradingEndpoints();
		}
	}, [isOpen, classId, loadGradingEndpoints]);

	useEffect(() => {
		if (isOpen && classId) {
			void loadAssignments();
		}
	}, [isOpen, classId, loadAssignments]);

	return {
		assignments,
		setAssignments,
		gradingEndpoints,
		loadAssignments,
		loadGradingEndpoints,
		isLoadingEndpoints,
		isLoadingAssignments,
	};
};
