import { useSnackbar } from "@bug-on/m3-expressive";
import { useEffect } from "react";
import {
	type NotifyPayload,
	type NotifyType,
	notifyEventName,
} from "../../utils/notify";

/**
 * Headless event bridge kết nối custom event `mos-grader:notify` (từ notify utility)
 * với useSnackbar() của @bug-on/m3-expressive.
 *
 * Lưu ý: Các thông báo loại 'error' được ErrorModal.tsx thụ lý riêng.
 */
const typePrefixMap: Partial<Record<NotifyType, string>> = {
	success: "✓  ",
	warning: "⚠️  ",
	info: "ℹ️  ",
};

const defaultDurationByType: Partial<Record<NotifyType, number>> = {
	success: 3200,
	warning: 3600,
	info: 3200,
};

const ToastCenter = () => {
	const { showSnackbar } = useSnackbar();

	useEffect(() => {
		const onNotify = (event: Event) => {
			const customEvent = event as CustomEvent<NotifyPayload>;
			const detail = customEvent.detail;
			if (!detail?.message) return;

			const nextType: NotifyType = detail.type ?? "info";

			// Error modal is handled by ErrorModal.tsx
			if (nextType === "error") return;

			const prefix = typePrefixMap[nextType] || "";
			const duration = detail.durationMs ?? defaultDurationByType[nextType];

			void showSnackbar({
				message: `${prefix}${detail.message}`,
				withDismissAction: true,
				duration,
			});
		};

		window.addEventListener(notifyEventName, onNotify as EventListener);
		return () => {
			window.removeEventListener(notifyEventName, onNotify as EventListener);
		};
	}, [showSnackbar]);

	// SnackbarHost is already rendered by MD3ThemeProvider (enableSnackbar={true})
	return null;
};

export default ToastCenter;
