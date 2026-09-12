import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryKeys } from "../../../lib/queryKeys";
import { authService } from "../../../services/auth.service";
import { classService } from "../../../services/class.service";
import type {
	Class,
	CreateClassRequest,
	UpdateClassRequest,
} from "../../../types/class.types";

interface UseClassQueriesOptions {
	schoolId: string;
	getAccessToken: () => Promise<string | null>;
	isHandoverModalOpen?: boolean;
}

export const useClassQueries = ({
	schoolId,
	getAccessToken,
	isHandoverModalOpen = false,
}: UseClassQueriesOptions) => {
	const queryClient = useQueryClient();
	const getAccessTokenRef = useRef(getAccessToken);

	useEffect(() => {
		getAccessTokenRef.current = getAccessToken;
	});

	// Query classes (đã fix N+1: không gọi getStudentsByClassId N lần)
	const classesQuery = useQuery({
		queryKey: queryKeys.classes.bySchool(schoolId),
		queryFn: async (): Promise<Class[]> => {
			const data = await classService.getClassesBySchool(
				schoolId,
				getAccessTokenRef.current,
				true,
			);
			// Ánh xạ số học sinh trực tiếp từ class object, loại bỏ hoàn toàn N+1 requests
			return data.map((cls) => ({
				...cls,
				currentStudents: cls.studentIds?.length ?? cls.currentStudents ?? 0,
			}));
		},
		enabled: Boolean(schoolId),
	});

	// Query teachers for handover modal (chỉ fetch khi modal mở)
	const teachersQuery = useQuery({
		queryKey: queryKeys.classes.teachers(),
		queryFn: () => authService.getTeachers(getAccessTokenRef.current),
		enabled: isHandoverModalOpen,
		staleTime: 60_000,
	});

	// Mutation: Create Class
	const createClassMutation = useMutation({
		mutationFn: (payload: CreateClassRequest) =>
			classService.createClass(payload, getAccessTokenRef.current),
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.classes.bySchool(schoolId),
			});
		},
	});

	// Mutation: Update Class
	const updateClassMutation = useMutation({
		mutationFn: ({
			classId,
			payload,
		}: {
			classId: string;
			payload: UpdateClassRequest;
		}) => classService.updateClass(classId, payload, getAccessTokenRef.current),
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.classes.bySchool(schoolId),
			});
		},
	});

	// Mutation: Delete Class
	const deleteClassMutation = useMutation({
		mutationFn: (classId: string) =>
			classService.deleteClass(classId, getAccessTokenRef.current),
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.classes.bySchool(schoolId),
			});
		},
	});

	// Mutation: Handover Grant / Revoke
	const toggleHandoverMutation = useMutation({
		mutationFn: ({
			classId,
			teacherId,
			granted,
		}: {
			classId: string;
			teacherId: string;
			granted: boolean;
		}) =>
			granted
				? classService.revokeClassManagement(
						classId,
						teacherId,
						getAccessTokenRef.current,
					)
				: classService.grantClassManagement(
						classId,
						teacherId,
						getAccessTokenRef.current,
					),
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.classes.bySchool(schoolId),
			});
		},
	});

	return {
		classes: classesQuery.data ?? [],
		isLoading: classesQuery.isLoading,
		classesError:
			classesQuery.error instanceof Error ? classesQuery.error.message : "",
		teachers: teachersQuery.data ?? [],
		isLoadingTeachers: teachersQuery.isLoading,
		teachersError:
			teachersQuery.error instanceof Error ? teachersQuery.error.message : "",
		createClassMutation,
		updateClassMutation,
		deleteClassMutation,
		toggleHandoverMutation,
	};
};
