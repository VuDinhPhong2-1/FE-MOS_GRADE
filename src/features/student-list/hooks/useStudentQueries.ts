import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryKeys } from "../../../lib/queryKeys";
import { assignmentService } from "../../../services/assignment.service";
import studentService from "../../../services/student.service";
import type { Assignment } from "../../../types/assignment.types";
import type {
	BulkImportStudentRequest,
	Student,
} from "../../../types/student.types";

interface UseStudentQueriesOptions {
	classId: string;
	schoolId?: string;
	getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export const useStudentQueries = ({
	classId,
	schoolId,
	getAccessToken,
}: UseStudentQueriesOptions) => {
	const queryClient = useQueryClient();
	const getAccessTokenRef = useRef(getAccessToken);

	useEffect(() => {
		getAccessTokenRef.current = getAccessToken;
	});

	// Query students by classId
	const studentsQuery = useQuery({
		queryKey: queryKeys.students.byClass(classId),
		queryFn: async (): Promise<Student[]> => {
			return studentService.getStudentsByClassId(
				classId,
				getAccessTokenRef.current,
			);
		},
		enabled: Boolean(classId),
	});

	// Query assignments by classId
	const assignmentsQuery = useQuery({
		queryKey: queryKeys.students.assignments(classId),
		queryFn: async (): Promise<Assignment[]> => {
			try {
				return await assignmentService.getByClass(
					classId,
					getAccessTokenRef.current,
				);
			} catch {
				return [];
			}
		},
		enabled: Boolean(classId),
	});

	// Invalidate helpers
	const invalidateStudentData = () => {
		void queryClient.invalidateQueries({
			queryKey: queryKeys.students.byClass(classId),
		});
		if (schoolId) {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.classes.bySchool(schoolId),
			});
		}
	};

	// Mutation: Bulk import students
	const bulkImportMutation = useMutation({
		mutationFn: (payload: BulkImportStudentRequest) =>
			studentService.bulkImportStudents(payload, getAccessTokenRef.current),
		onSettled: invalidateStudentData,
	});

	// Mutation: Delete student
	const deleteStudentMutation = useMutation({
		mutationFn: (studentId: string) =>
			studentService.deleteStudent(studentId, getAccessTokenRef.current),
		onSettled: invalidateStudentData,
	});

	// Mutation: Update student (inline competency, exam toggle, etc.)
	const updateStudentMutation = useMutation({
		mutationFn: ({
			studentId,
			payload,
		}: {
			studentId: string;
			payload: Partial<Student>;
		}) =>
			studentService.updateStudent(
				studentId,
				payload,
				getAccessTokenRef.current,
			),
		onSettled: invalidateStudentData,
	});

	// Mutation: Sync student metadata to Google Sheet
	const syncMetadataMutation = useMutation({
		mutationFn: () =>
			studentService.syncStudentMetadataToGoogleSheet(
				classId,
				getAccessTokenRef.current,
			),
	});

	return {
		students: studentsQuery.data ?? [],
		isLoadingStudents: studentsQuery.isLoading,
		isFetchingStudents: studentsQuery.isFetching,
		assignments: assignmentsQuery.data ?? [],
		refetchStudents: studentsQuery.refetch,
		bulkImportMutation,
		deleteStudentMutation,
		updateStudentMutation,
		syncMetadataMutation,
	};
};
