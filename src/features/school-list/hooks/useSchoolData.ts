import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
	// Dùng ref để ổn định reference của getAccessToken (tránh trigger refetch không mong muốn khi context re-render)
	const getAccessTokenRef = useRef(getAccessToken);
	useEffect(() => {
		getAccessTokenRef.current = getAccessToken;
	});

	const isAdmin = user?.role === ADMIN_ROLE;
	const canDeleteSchool = useMemo(
		() => isAdmin || Boolean(user?.permissions?.includes("schools.delete")),
		[isAdmin, user?.permissions],
	);

	const [schools, setSchools] = useState<School[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	const [showModal, setShowModal] = useState(false);
	const [editingSchool, setEditingSchool] = useState<School | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchSchools = useCallback(async () => {
		setIsLoading(true);
		setError("");
		try {
			const data = await schoolService.getSchools(getAccessTokenRef.current);
			setSchools(data);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
			setError(msg);
			notify.error(msg);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchSchools();
	}, [fetchSchools]);

	const openAddModal = useCallback(() => {
		setEditingSchool(null);
		setShowModal(true);
	}, []);

	const openEditModal = useCallback((school: School) => {
		setEditingSchool(school);
		setShowModal(true);
	}, []);

	const closeModal = useCallback(() => {
		if (isSubmitting) return;
		setEditingSchool(null);
		setShowModal(false);
	}, [isSubmitting]);

	const handleSaveSchool = useCallback(
		async (payload: CreateSchoolRequest) => {
			setIsSubmitting(true);
			setError("");

			try {
				if (editingSchool) {
					await schoolService.updateSchool(
						editingSchool.id,
						payload,
						getAccessTokenRef.current,
					);
					notify.success("Cập nhật thông tin trường thành công");
				} else {
					await schoolService.createSchool(payload, getAccessTokenRef.current);
					notify.success("Thêm trường học mới thành công");
				}

				setShowModal(false);
				setEditingSchool(null);
				await fetchSchools();
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
				notify.error(msg);
			} finally {
				setIsSubmitting(false);
			}
		},
		[editingSchool, fetchSchools],
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
		if (isDeleting) return;
		setSchoolToDelete(null);
	}, [isDeleting]);

	const handleConfirmDelete = useCallback(async () => {
		if (!schoolToDelete) return;

		try {
			setIsDeleting(true);
			await schoolService.deleteSchool(
				schoolToDelete.id,
				getAccessTokenRef.current,
			);
			notify.success(`Đã xóa trường "${schoolToDelete.name}" thành công`);
			setSchoolToDelete(null);
			await fetchSchools();
		} catch (err) {
			notify.error(err instanceof Error ? err.message : "Không thể xóa trường");
		} finally {
			setIsDeleting(false);
		}
	}, [schoolToDelete, fetchSchools]);

	return {
		isAdmin,
		canDeleteSchool,
		schools,
		isLoading,
		error,
		showModal,
		editingSchool,
		isSubmitting,
		schoolToDelete,
		isDeleting,
		fetchSchools,
		openAddModal,
		openEditModal,
		closeModal,
		handleSaveSchool,
		openDeleteDialog,
		closeDeleteDialog,
		handleConfirmDelete,
	};
};
