import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	ScrollArea,
} from "@bug-on/m3-expressive";
import { useCallback, useEffect, useState } from "react";
import { type NotifyPayload, notifyEventName } from "../../utils/notify";

const ErrorModal: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [payload, setPayload] = useState<NotifyPayload | null>(null);

	useEffect(() => {
		const handler = (event: Event) => {
			const customEvent = event as CustomEvent<NotifyPayload>;
			const detail = customEvent.detail;
			if (detail?.type !== "error") return;

			setPayload(detail);
			setOpen(true);
		};

		window.addEventListener(notifyEventName, handler as EventListener);
		return () =>
			window.removeEventListener(notifyEventName, handler as EventListener);
	}, []);

	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	const issues = (payload?.issues || []).filter(
		(issue) =>
			issue.heading.trim().length > 0 && issue.message.trim().length > 0,
	);
	const message = (payload?.message || "").trim();

	const handleCopy = useCallback(() => {
		if (!payload) return;
		const combined = issues
			.map(
				(issue) =>
					`${issue.heading}\n${issue.message}${issue.fixAction ? `\n\nHướng dẫn:\n${issue.fixAction}` : ""}`,
			)
			.join("\n\n");
		navigator.clipboard?.writeText(
			[payload.title ?? "Lỗi", message, combined].filter(Boolean).join("\n\n"),
		);
	}, [payload, issues, message]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogPortal open={open}>
				<DialogOverlay className="z-11000" />
				<DialogContent
					hideCloseButton
					className="z-11000 flex max-h-[86vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container p-0 text-m3-on-surface shadow-2xl"
				>
					{/* Header */}
					<div className="flex items-start gap-3.5 px-6 pt-6 pb-2 pr-14">
						<div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-m3-error-container text-m3-on-error-container">
							<Icon name="error" className="text-2xl" />
						</div>

						<div className="min-w-0 flex-1">
							<DialogHeader className="p-0 text-left">
								<DialogTitle className="text-xl font-bold text-m3-error">
									{payload?.title ?? "Lỗi"}
								</DialogTitle>
								<DialogDescription className="text-xs text-m3-on-surface-variant">
									Chi tiết sự cố và hướng dẫn khắc phục
								</DialogDescription>
							</DialogHeader>
						</div>
					</div>

					{/* Body Content */}
					<ScrollArea
						type="scroll"
						orientation="vertical"
						className="min-h-0 flex-1"
						viewportClassName="px-6 py-3"
					>
						<div className="space-y-3 text-sm">
							{message && (
								<div className="whitespace-pre-wrap rounded-2xl bg-m3-error-container p-3.5 font-medium text-m3-on-error-container">
									{message}
								</div>
							)}

							{issues.map((issue) => (
								<div
									key={`${issue.heading}-${issue.message}-${issue.fixAction || ""}`}
									className="rounded-2xl bg-m3-surface-container-lowest p-3.5"
								>
									<div className="flex items-start gap-2.5">
										<Icon
											name="warning"
											className="mt-0.5 shrink-0 text-amber-500 text-lg"
										/>
										<div className="min-w-0 flex-1 space-y-1">
											<div className="whitespace-pre-wrap font-semibold text-m3-primary">
												{issue.heading}
											</div>
											<div className="whitespace-pre-wrap font-medium text-amber-600 dark:text-amber-400">
												{issue.message}
											</div>

											{issue.fixAction && (
												<div className="flex items-start gap-2 pt-1 text-emerald-600 dark:text-emerald-400">
													<Icon
														name="lightbulb"
														className="mt-0.5 shrink-0 text-base"
													/>
													<span className="whitespace-pre-wrap font-medium">
														Hướng dẫn sửa: {issue.fixAction}
													</span>
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>

					{/* Footer Actions */}
					<DialogFooter className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 px-6 py-4">
						<Button colorStyle="outlined" size="sm" onClick={handleCopy}>
							Sao chép nội dung
						</Button>
						<Button
							size="sm"
							colorStyle="filled"
							onClick={handleClose}
							className="bg-m3-error text-m3-on-error hover:bg-m3-error/90"
						>
							Đóng
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default ErrorModal;
