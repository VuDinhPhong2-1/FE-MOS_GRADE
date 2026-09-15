import { useCallback, useEffect } from "react";
import { showConfirm } from "./ConfirmDialog";

export interface UseUnsavedChangesGuardOptions {
	isDirty: boolean;
	isOpen?: boolean;
	isSubmitting?: boolean;
	title?: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}

/**
 * useUnsavedChangesGuard - Hook bảo vệ dữ liệu chưa lưu cho các Modal & Form.
 * Tự động đăng ký sự kiện beforeunload và cung cấp handleSafeClose với dialog xác nhận.
 */
export function useUnsavedChangesGuard({
	isDirty,
	isOpen = true,
	isSubmitting = false,
	title = "Thay đổi chưa lưu",
	message = "Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?",
	confirmLabel = "Đóng và bỏ thay đổi",
	cancelLabel = "Ở lại",
}: UseUnsavedChangesGuardOptions) {
	useEffect(() => {
		if (!isOpen || !isDirty) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isOpen, isDirty]);

	const handleSafeClose = useCallback(
		async (onConfirmClose: () => void) => {
			if (isSubmitting) return;

			if (isDirty) {
				const confirmed = await showConfirm({
					title,
					message,
					confirmLabel,
					cancelLabel,
					variant: "destructive",
					icon: "warning",
				});
				if (!confirmed) return;
			}

			onConfirmClose();
		},
		[isDirty, isSubmitting, title, message, confirmLabel, cancelLabel],
	);

	return { handleSafeClose };
}
