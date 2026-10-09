import { useSnackbar } from "@bug-on/m3-expressive";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { queryKeys } from "../../../lib/queryKeys";
import { assignmentService } from "../../../services/assignment.service";
import { classService } from "../../../services/class.service";
import { schoolService } from "../../../services/school.service";
import type { Assignment } from "../../../types/assignment.types";
import type { Class } from "../../../types/class.types";
import { hasAutoGradingEndpoint } from "../utils/portalFormatters";

export const usePortalFilters = (enabled = false) => {
	const { user, getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const assignmentCacheRef = useRef<Map<string, Assignment[]>>(new Map());
	const userId = user?.userId ?? "anonymous";

	const [classes, setClasses] = useState<Class[]>([]);
	const [assignments, setAssignments] = useState<Assignment[]>([]);

	const [selectedSchoolId, setSelectedSchoolId] = useState("");
	const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
	const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
		[],
	);

	const [loadingClasses, setLoadingClasses] = useState(false);
	const [loadingAssignments, setLoadingAssignments] = useState(false);

	const notifyError = useCallback(
		(error: unknown, fallback: string) => {
			void showSnackbar({
				message: error instanceof Error ? error.message : fallback,
				withDismissAction: true,
			});
		},
		[showSnackbar],
	);

	const schoolsQuery = useQuery({
		queryKey: queryKeys.submissionPortals.schools(userId),
		queryFn: async () => {
			const schoolList = await schoolService.getSchools(getAccessToken);
			return schoolList.filter((school) => school.isActive !== false);
		},
		enabled,
	});
	const schools = schoolsQuery.data ?? [];

	const loadClassesBySelectedSchool = useCallback(async () => {
		if (!selectedSchoolId) {
			setClasses([]);
			setSelectedClassIds([]);
			setAssignments([]);
			setSelectedAssignmentIds([]);
			return;
		}

		setLoadingClasses(true);
		try {
			const classList = await classService.getClassesBySchool(
				selectedSchoolId,
				getAccessToken,
				false,
			);
			setClasses(classList.filter((cls) => cls.isActive !== false));
		} catch (error) {
			notifyError(error, "Không thể tải danh sách lớp");
		} finally {
			setLoadingClasses(false);
		}
	}, [getAccessToken, selectedSchoolId, notifyError]);

	const loadAssignments = useCallback(async () => {
		if (selectedClassIds.length === 0) {
			setAssignments([]);
			setSelectedAssignmentIds([]);
			return;
		}

		const uncachedClassIds = selectedClassIds.filter(
			(id) => !assignmentCacheRef.current.has(id),
		);

		if (uncachedClassIds.length > 0) {
			setLoadingAssignments(true);
			try {
				const results = await Promise.all(
					uncachedClassIds.map((classId) =>
						assignmentService.getByClass(classId, getAccessToken),
					),
				);
				uncachedClassIds.forEach((classId, index) => {
					assignmentCacheRef.current.set(classId, results[index]);
				});
			} catch (error) {
				notifyError(error, "Không thể tải bài tập");
			} finally {
				setLoadingAssignments(false);
			}
		}

		const allAssignments = selectedClassIds.flatMap(
			(id) => assignmentCacheRef.current.get(id) ?? [],
		);
		setAssignments(
			allAssignments.filter((assignment) => hasAutoGradingEndpoint(assignment)),
		);
	}, [getAccessToken, selectedClassIds, notifyError]);

	useEffect(() => {
		void loadClassesBySelectedSchool();
	}, [loadClassesBySelectedSchool]);

	useEffect(() => {
		void loadAssignments();
	}, [loadAssignments]);

	const handleSchoolChange = useCallback((schoolId: string) => {
		setSelectedSchoolId(schoolId);
		setSelectedClassIds([]);
		setSelectedAssignmentIds([]);
		setAssignments([]);
		assignmentCacheRef.current.clear();
	}, []);

	const handleClassChange = useCallback((classId: string) => {
		setSelectedClassIds(classId ? [classId] : []);
		setSelectedAssignmentIds([]);
	}, []);

	const handleAssignmentChange = useCallback((assignmentId: string) => {
		setSelectedAssignmentIds(assignmentId ? [assignmentId] : []);
	}, []);

	const toggleClass = useCallback((classId: string) => {
		setSelectedClassIds((prev) =>
			prev.includes(classId)
				? prev.filter((id) => id !== classId)
				: [...prev, classId],
		);
	}, []);

	const toggleAssignment = useCallback((assignmentId: string) => {
		setSelectedAssignmentIds((prev) =>
			prev.includes(assignmentId)
				? prev.filter((id) => id !== assignmentId)
				: [...prev, assignmentId],
		);
	}, []);

	const selectAllAssignments = useCallback((allIds: string[]) => {
		setSelectedAssignmentIds(allIds);
	}, []);

	const clearAssignments = useCallback(() => {
		setSelectedAssignmentIds([]);
	}, []);

	const resetFilters = useCallback(() => {
		setSelectedSchoolId("");
		setSelectedClassIds([]);
		setSelectedAssignmentIds([]);
		setClasses([]);
		setAssignments([]);
		assignmentCacheRef.current.clear();
	}, []);

	const classNameById = useMemo(
		() => new Map(classes.map((cls) => [cls.id, cls.name])),
		[classes],
	);

	const selectedClassNames = useMemo(
		() =>
			selectedClassIds
				.map((classId) => classNameById.get(classId))
				.filter(Boolean)
				.join(", "),
		[classNameById, selectedClassIds],
	);

	const selectedSchoolName = useMemo(
		() => schools.find((school) => school.id === selectedSchoolId)?.name || "",
		[schools, selectedSchoolId],
	);

	const filteredAssignments = useMemo(
		() => assignments.filter((a) => selectedClassIds.includes(a.classId)),
		[assignments, selectedClassIds],
	);

	return {
		schools,
		classes,
		filteredAssignments,
		selectedSchoolId,
		selectedClassIds,
		selectedAssignmentIds,
		selectedSchoolName,
		selectedClassNames,
		classNameById,
		loadingSchools: schoolsQuery.isLoading,
		loadingClasses,
		loadingAssignments,
		loadSchools: schoolsQuery.refetch,
		handleSchoolChange,
		handleClassChange,
		handleAssignmentChange,
		toggleClass,
		toggleAssignment,
		selectAllAssignments,
		clearAssignments,
		resetFilters,
	};
};
