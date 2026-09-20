import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showAlert } from "../../../components/common";
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
	const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
	const [gradingEndpoints, setGradingEndpoints] = useState<
		GradingEndpointInfo[]
	>([]);
	const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(false);
	const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

	const showInactiveRef = useRef(showInactiveAssignments);
	useEffect(() => {
		showInactiveRef.current = showInactiveAssignments;
	}, [showInactiveAssignments]);

	const loadAssignments = useCallback(
		async (includeInactive?: boolean) => {
			if (!classId) return;
			setIsLoadingAssignments(true);
			try {
				const shouldIncludeInactive =
					includeInactive !== undefined
						? includeInactive
						: showInactiveRef.current;
				const data = await assignmentService.getByClass(
					classId,
					getAccessToken,
					{
						includeInactive: shouldIncludeInactive,
					},
				);
				setAllAssignments(data);
			} catch (error) {
				console.error("Lỗi khi tải danh sách bài tập:", error);
				void showAlert({
					title: "Lỗi tải dữ liệu",
					message: "Không thể tải danh sách bài tập!",
					variant: "error",
				});
			} finally {
				setIsLoadingAssignments(false);
			}
		},
		[classId, getAccessToken],
	);

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

	// Initial load
	useEffect(() => {
		if (isOpen && classId) {
			void loadAssignments(showInactiveRef.current);
		}
	}, [isOpen, classId, loadAssignments]);

	// When user turns on showInactiveAssignments: refetch to get inactive records from server
	// When user turns off: only local filter is applied via useMemo (no refetch)
	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		if (isOpen && classId && showInactiveAssignments) {
			void loadAssignments(true);
		}
	}, [isOpen, classId, showInactiveAssignments, loadAssignments]);

	// Derived assignments based on toggle filter
	const assignments = useMemo(() => {
		if (showInactiveAssignments) {
			return allAssignments;
		}
		return allAssignments.filter((a) => a.isActive);
	}, [allAssignments, showInactiveAssignments]);

	return {
		assignments,
		allAssignments,
		setAssignments: setAllAssignments,
		setAllAssignments,
		gradingEndpoints,
		loadAssignments,
		loadGradingEndpoints,
		isLoadingEndpoints,
		isLoadingAssignments,
	};
};
