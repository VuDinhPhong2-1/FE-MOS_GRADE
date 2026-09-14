import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
} from "@bug-on/m3-expressive";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";

export type AlertVariant = "info" | "warning" | "error" | "success";

export interface AlertOptions {
	title?: string;
	message: React.ReactNode;
	description?: string;
	variant?: AlertVariant;
	confirmLabel?: string;
	icon?: string;
}

type AlertHandler = (options: AlertOptions | string) => Promise<void>;

let globalAlertHandler: AlertHandler | null = null;

/**
 * Imperative helper để gọi AlertDialog từ bất kỳ đâu (hook, callback, utils).
 */
export const showAlert: AlertHandler = (options) => {
	if (globalAlertHandler) {
		return globalAlertHandler(options);
	}
	// Fallback nếu Provider chưa mount
	const text = typeof options === "string" ? options : String(options.message);
	window.alert(text);
	return Promise.resolve();
};

interface AlertDialogContextType {
	showAlert: AlertHandler;
}

const AlertDialogContext = createContext<AlertDialogContextType>({
	showAlert,
});

export const useAlertDialog = () => useContext(AlertDialogContext);

const variantStyles: Record<
	AlertVariant,
	{
		icon: string;
		iconContainerClass: string;
		titleClass: string;
		defaultTitle: string;
	}
> = {
	info: {
		icon: "info",
		iconContainerClass: "bg-m3-primary-container text-m3-primary",
		titleClass: "text-m3-on-surface",
		defaultTitle: "Thông báo",
	},
	warning: {
		icon: "warning",
		iconContainerClass:
			"bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
		titleClass: "text-amber-800 dark:text-amber-300",
		defaultTitle: "Cảnh báo",
	},
	error: {
		icon: "error",
		iconContainerClass: "bg-m3-error-container text-m3-error",
		titleClass: "text-m3-error",
		defaultTitle: "Đã xảy ra lỗi",
	},
	success: {
		icon: "check_circle",
		iconContainerClass:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
		titleClass: "text-emerald-800 dark:text-emerald-300",
		defaultTitle: "Thành công",
	},
};

export const AlertDialogProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<AlertOptions | null>(null);
	const resolveRef = useRef<(() => void) | null>(null);

	const handleClose = useCallback(() => {
		setOpen(false);
		if (resolveRef.current) {
			resolveRef.current();
			resolveRef.current = null;
		}
	}, []);

	const triggerAlert = useCallback<AlertHandler>((opts) => {
		const resolvedOpts: AlertOptions =
			typeof opts === "string" ? { message: opts } : opts;

		return new Promise<void>((resolve) => {
			resolveRef.current = resolve;
			setOptions(resolvedOpts);
			setOpen(true);
		});
	}, []);

	// Gán global handler
	globalAlertHandler = triggerAlert;

	const variant = options?.variant || "info";
	const style = variantStyles[variant];
	const iconName = options?.icon || style.icon;
	const title = options?.title || style.defaultTitle;
	const confirmLabel = options?.confirmLabel || "Đóng";

	const contextValue = useMemo(
		() => ({
			showAlert: triggerAlert,
		}),
		[triggerAlert],
	);

	return (
		<AlertDialogContext.Provider value={contextValue}>
			{children}
			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					if (!isOpen) handleClose();
				}}
			>
				<DialogPortal open={open}>
					<DialogOverlay />
					<DialogContent
						hideCloseButton
						className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-6 text-m3-on-surface shadow-2xl transform-gpu will-change-transform z-11000"
					>
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<div
									className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${style.iconContainerClass}`}
								>
									<Icon name={iconName} className="text-2xl" />
								</div>
								<div className="min-w-0 flex-1">
									<DialogTitle
										className={`text-lg font-bold leading-snug ${style.titleClass}`}
									>
										{title}
									</DialogTitle>
									{options?.description && (
										<DialogDescription className="text-xs text-m3-on-surface-variant">
											{options.description}
										</DialogDescription>
									)}
								</div>
							</div>

							<div className="max-h-[60vh] overflow-y-auto pr-1 text-sm leading-relaxed text-m3-on-surface-variant whitespace-pre-wrap">
								{options?.message}
							</div>

							<DialogFooter className="mt-2 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 pt-4">
								<Button
									colorStyle="filled"
									type="button"
									onClick={handleClose}
									className={
										variant === "error"
											? "bg-m3-error text-m3-on-error hover:bg-m3-error/90 shadow-xs"
											: undefined
									}
								>
									{confirmLabel}
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</DialogPortal>
			</Dialog>
		</AlertDialogContext.Provider>
	);
};

export default AlertDialogProvider;
