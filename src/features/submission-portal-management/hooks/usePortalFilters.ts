import { useSnackbar } from "@bug-on/m3-expressive";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { assignmentService } from "../../../services/assignment.service";
import { classService } from "../../../services/class.service";
import { schoolService } from "../../../services/school.service";
import type { Assignment } from "../../../types/assignment.types";
import type { Class } from "../../../types/class.types";
import type { School } from "../../../types/school.types";
import { hasAutoGradingEndpoint } from "../utils/portalFormatters";

export const usePortalFilters = () => {
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const assignmentCacheRef = useRef<Map<string, Assignment[]>>(new Map());

	const [schools, setSchools] = useState<School[]>([]);
	const [classes, setClasses] = useState<Class[]>([]);
	const [assignments, setAssignments] = useState<Assignment[]>([]);

	const [selectedSchoolId, setSelectedSchoolId] = useState("");
	const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
	const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
		[],
	);

	const [loadingSchools, setLoadingSchools] = useState(false);
	const [loadingClasses, setLoadingClasses] = useState(false);
	const [loadingAssignments, setLoadingAssignments] = useState(false);

	const loadSchools = useCallback(async () => {
		setLoadingSchools(true);
		try {
			const schoolList = await schoolService.getSchools(getAccessToken);
			setSchools(schoolList.filter((school) => school.isActive !== false));
		} catch (error) {
			void showSnackbar({
				message:
					error instanceof Error
						? error.message
						: "Không thể tải danh sách trường",
				withDismissAction: true,
			});
		} finally {
			setLoadingSchools(false);
		}
	}, [getAccessToken, showSnackbar]);

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
			void showSnackbar({
				message:
					error instanceof Error
						? error.message
						: "Không thể tải danh sách lớp",
				withDismissAction: true,
			});
		} finally {
			setLoadingClasses(false);
		}
	}, [getAccessToken, selectedSchoolId, showSnackbar]);

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
				void showSnackbar({
					message:
						error instanceof Error ? error.message : "Không thể tải bài tập",
					withDismissAction: true,
				});
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
	}, [getAccessToken, selectedClassIds, showSnackbar]);

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
		assignments,
		filteredAssignments,
		selectedSchoolId,
		selectedClassIds,
		selectedAssignmentIds,
		selectedSchoolName,
		selectedClassNames,
		classNameById,
		loadingSchools,
		loadingClasses,
		loadingAssignments,
		loadSchools,
		handleSchoolChange,
		toggleClass,
		toggleAssignment,
		resetFilters,
		setSelectedSchoolId,
		setSelectedClassIds,
		setSelectedAssignmentIds,
	};
};
