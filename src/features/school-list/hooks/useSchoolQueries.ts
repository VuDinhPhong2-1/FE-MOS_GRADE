import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { queryKeys } from "../../../lib/queryKeys";
import { schoolService } from "../../../services/school.service";
import type { CreateSchoolRequest, School, User } from "../../../types";
import { notify } from "../../../utils/notify";
import { ADMIN_ROLE } from "../types";

interface UseSchoolDataOptions {
	getAccessToken: () => Promise<string | null>;
	user: User | null;
}

export const useSchoolData = ({
	getAccessToken,
	user,
}: UseSchoolDataOptions) => {
	const queryClient = useQueryClient();
	const getAccessTokenRef = useRef(getAccessToken);

	useEffect(() => {
		getAccessTokenRef.current = getAccessToken;
	});

	const isAdmin = user?.role === ADMIN_ROLE;
	const canDeleteSchool = useMemo(
		() => isAdmin || Boolean(user?.permissions?.includes("schools.delete")),
		[isAdmin, user?.permissions],
	);

	// Fetch schools query với auto-refetch & caching
	const {
		data: schools = [],
		isLoading,
		error: queryError,
	} = useQuery({
		queryKey: queryKeys.schools.list(),
		queryFn: () => schoolService.getSchools(getAccessTokenRef.current),
	});

	const error = queryError instanceof Error ? queryError.message : "";

	// Modal / UI state
	const [showModal, setShowModal] = useState(false);
	const [editingSchool, setEditingSchool] = useState<School | null>(null);
	const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

	// Mutation: Save School (Create / Update)
	const saveMutation = useMutation({
		mutationFn: async ({
			payload,
			editingId,
		}: {
			payload: CreateSchoolRequest;
			editingId?: string;
		}): Promise<School> => {
			if (editingId) {
				return await schoolService.updateSchool(
					editingId,
					payload,
					getAccessTokenRef.current,
				);
			}
			return await schoolService.createSchool(
				payload,
				getAccessTokenRef.current,
			);
		},
		onMutate: async ({ payload, editingId }) => {
			// Hủy các query fetching để tránh race-condition ghi đè dữ liệu cũ
			await queryClient.cancelQueries({
				queryKey: queryKeys.schools.list(),
			});

			// Lưu snapshot cache hiện tại để rollback nếu phát sinh lỗi
			const previousSchools = queryClient.getQueryData<School[]>(
				queryKeys.schools.list(),
			);

			// Cập nhật Optimistic ngay lập tức (0ms latency UI)
			if (previousSchools && editingId) {
				queryClient.setQueryData<School[]>(
					queryKeys.schools.list(),
					previousSchools.map((sch) =>
						sch.id === editingId
							? {
									...sch,
									...payload,
									code: payload.code || sch.code,
								}
							: sch,
					),
				);
			}

			return { previousSchools };
		},
		onSuccess: (savedSchool, variables) => {
			// Cập nhật lại cache: kết hợp cả variables.payload và savedSchool từ server
			queryClient.setQueryData<School[]>(
				queryKeys.schools.list(),
				(old = []) => {
					if (variables.editingId) {
						return old.map((sch) => {
							if (sch.id !== variables.editingId) return sch;
							const hasSavedObj =
								savedSchool &&
								typeof savedSchool === "object" &&
								!Array.isArray(savedSchool);
							return {
								...sch,
								...variables.payload,
								...(hasSavedObj ? savedSchool : {}),
								code:
									hasSavedObj && "code" in savedSchool && savedSchool.code
										? savedSchool.code
										: variables.payload.code || sch.code,
								name:
									hasSavedObj && "name" in savedSchool && savedSchool.name
										? savedSchool.name
										: variables.payload.name || sch.name,
							};
						});
					}
					if (savedSchool) {
						const newSchool: School = {
							...(typeof savedSchool === "object" ? savedSchool : {}),
							...variables.payload,
							id: (savedSchool as School)?.id || `temp-${Date.now()}`,
						};
						return [newSchool, ...old.filter((s) => s.id !== newSchool.id)];
					}
					return old;
				},
			);

			notify.success(
				variables.editingId
					? "Cập nhật thông tin trường thành công"
					: "Thêm trường học mới thành công",
			);
			setShowModal(false);
			setEditingSchool(null);
		},
		onError: (err, _vars, context) => {
			// Rollback cache về dữ liệu trước khi mutate nếu gặp lỗi
			if (context?.previousSchools) {
				queryClient.setQueryData(
					queryKeys.schools.list(),
					context.previousSchools,
				);
			}
			const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
			notify.error(msg);
		},
		onSettled: async () => {
			return queryClient.invalidateQueries({
				queryKey: queryKeys.schools.all,
				refetchType: "all",
			});
		},
	});

	// Mutation: Delete School
	const deleteMutation = useMutation({
		mutationFn: async (school: School) => {
			await schoolService.deleteSchool(school.id, getAccessTokenRef.current);
			return school;
		},
		onSuccess: (deletedSchool) => {
			// Loại bỏ trường vừa xóa khỏi cache ngay lập tức
			queryClient.setQueryData<School[]>(queryKeys.schools.list(), (old = []) =>
				old.filter((sch) => sch.id !== deletedSchool.id),
			);
			notify.success(`Đã xóa trường "${deletedSchool.name}" thành công`);
			setSchoolToDelete(null);
		},
		onError: (err) => {
			notify.error(err instanceof Error ? err.message : "Không thể xóa trường");
		},
		onSettled: async () => {
			return queryClient.invalidateQueries({
				queryKey: queryKeys.schools.all,
				refetchType: "all",
			});
		},
	});

	const openAddModal = useCallback(() => {
		setEditingSchool(null);
		setShowModal(true);
	}, []);

	const openEditModal = useCallback((school: School) => {
		setEditingSchool(school);
		setShowModal(true);
	}, []);

	const closeModal = useCallback(() => {
		if (saveMutation.isPending) return;
		setEditingSchool(null);
		setShowModal(false);
	}, [saveMutation.isPending]);

	const handleSaveSchool = useCallback(
		async (payload: CreateSchoolRequest) => {
			await saveMutation.mutateAsync({
				payload,
				editingId: editingSchool?.id,
			});
		},
		[editingSchool, saveMutation],
	);

	const openDeleteDialog = useCallback(
		(school: School) => {
			if (!canDeleteSchool) {
				notify.warning("Chỉ Admin mới có quyền xóa trường.");
				return;
			}
			setSchoolToDelete(school);
		},
		[canDeleteSchool],
	);

	const closeDeleteDialog = useCallback(() => {
		if (deleteMutation.isPending) return;
		setSchoolToDelete(null);
	}, [deleteMutation.isPending]);

	const handleConfirmDelete = useCallback(async () => {
		if (!schoolToDelete) return;
		await deleteMutation.mutateAsync(schoolToDelete);
	}, [schoolToDelete, deleteMutation]);

	return {
		isAdmin,
		canDeleteSchool,
		schools,
		isLoading,
		error,
		showModal,
		editingSchool,
		isSubmitting: saveMutation.isPending,
		schoolToDelete,
		isDeleting: deleteMutation.isPending,
		openAddModal,
		openEditModal,
		closeModal,
		handleSaveSchool,
		openDeleteDialog,
		closeDeleteDialog,
		handleConfirmDelete,
	};
};
