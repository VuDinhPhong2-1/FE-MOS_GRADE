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

export type ConfirmVariant = "default" | "destructive";

export interface ConfirmOptions {
	title?: string;
	message: React.ReactNode;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: ConfirmVariant;
	icon?: string;
}

type ConfirmHandler = (options: ConfirmOptions | string) => Promise<boolean>;

let globalConfirmHandler: ConfirmHandler | null = null;

/**
 * Imperative helper để gọi ConfirmDialog từ bất kỳ đâu (hook, callback, utils).
 * Trả về Promise<boolean>: true nếu người dùng chọn Xác nhận, false nếu Hủy/đóng.
 */
export const showConfirm: ConfirmHandler = (options) => {
	if (globalConfirmHandler) {
		return globalConfirmHandler(options);
	}
	// Fallback nếu Provider chưa mount
	const text = typeof options === "string" ? options : String(options.message);
	return Promise.resolve(window.confirm(text));
};

interface ConfirmDialogContextType {
	showConfirm: ConfirmHandler;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType>({
	showConfirm,
});

export const useConfirmDialog = () => useContext(ConfirmDialogContext);

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	const handleAction = useCallback((confirmed: boolean) => {
		setOpen(false);
		if (resolveRef.current) {
			resolveRef.current(confirmed);
			resolveRef.current = null;
		}
	}, []);

	const triggerConfirm = useCallback<ConfirmHandler>((opts) => {
		const resolvedOpts: ConfirmOptions =
			typeof opts === "string" ? { message: opts } : opts;

		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve;
			setOptions(resolvedOpts);
			setOpen(true);
		});
	}, []);

	globalConfirmHandler = triggerConfirm;

	const isDestructive = options?.variant === "destructive";
	const defaultIcon = isDestructive ? "delete_forever" : "help_outline";
	const iconName = options?.icon || defaultIcon;
	const title =
		options?.title || (isDestructive ? "Xác nhận xóa" : "Xác nhận hành động");
	const confirmLabel =
		options?.confirmLabel || (isDestructive ? "Xác nhận xóa" : "Xác nhận");
	const cancelLabel = options?.cancelLabel || "Hủy";

	const contextValue = useMemo(
		() => ({
			showConfirm: triggerConfirm,
		}),
		[triggerConfirm],
	);

	return (
		<ConfirmDialogContext.Provider value={contextValue}>
			{children}
			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					if (!isOpen) handleAction(false);
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
									className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
										isDestructive
											? "bg-m3-error-container text-m3-error"
											: "bg-m3-primary-container text-m3-primary"
									}`}
								>
									<Icon name={iconName} className="text-2xl" />
								</div>
								<div className="min-w-0 flex-1">
									<DialogTitle className="text-lg font-bold text-m3-on-surface leading-snug">
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
									colorStyle="text"
									type="button"
									onClick={() => handleAction(false)}
								>
									{cancelLabel}
								</Button>
								<Button
									colorStyle="filled"
									type="button"
									onClick={() => handleAction(true)}
									className={
										isDestructive
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
		</ConfirmDialogContext.Provider>
	);
};

export default ConfirmDialogProvider;
