// src/features/bonus-points/StudentBonusHistoryDialog.tsx
import {
	Button,
	Card,
	Chip,
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Icon,
	IconButton,
	Text,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { StudentBonusPointSummary } from "../../types/bonus-point.types";

interface StudentBonusHistoryDialogProps {
	open: boolean;
	student: StudentBonusPointSummary | null;
	onClose: () => void;
	onDeleteEntry: (entryId: string) => Promise<void>;
	isDeleting: boolean;
}

const getCategoryLabel = (category: string) => {
	switch (category) {
		case "participation":
			return "Tham gia / Phát biểu";
		case "behavior":
			return "Ý thức / Tác phong";
		case "achievement":
			return "Thành tích xuất sắc";
		default:
			return category || "Khác";
	}
};

const formatDate = (dateStr: string) => {
	try {
		const d = new Date(dateStr);
		return d.toLocaleDateString("vi-VN", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	} catch {
		return dateStr;
	}
};

export const StudentBonusHistoryDialog: React.FC<
	StudentBonusHistoryDialogProps
> = ({ open, student, onClose, onDeleteEntry, isDeleting }) => {
	if (!student) return null;

	const details = student.details || [];

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-2xl w-full rounded-m3-xl p-0 overflow-hidden bg-m3-surface">
				<DialogHeader className="p-6 pb-4 border-b border-m3-outline-variant/30">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center font-bold text-base shrink-0">
							<Icon name="military_tech" size={24} />
						</div>
						<div>
							<DialogTitle className="text-xl font-bold text-m3-on-surface">
								Lịch sử điểm cộng
							</DialogTitle>
							<Text variant="body-md" className="text-sm text-m3-on-surface-variant mt-0.5">
								Học sinh:{" "}
								<span className="font-semibold text-m3-on-surface">
									{student.studentFullName}
								</span>{" "}
								• Tổng điểm:{" "}
								<span className="font-bold text-m3-primary">
									{student.totalBonusPoints > 0
										? `+${student.totalBonusPoints}`
										: student.totalBonusPoints}
								</span>
							</Text>
						</div>
					</div>
				</DialogHeader>

				<DialogBody className="p-6 max-h-[60vh] overflow-y-auto">
					{details.length === 0 ? (
						<div className="py-12 text-center text-m3-on-surface-variant">
							<Icon
								name="history_toggle_off"
								size={48}
								className="mx-auto mb-2 text-m3-on-surface-variant/50"
							/>
							<Text variant="body-md" className="text-sm font-medium">
								Chưa có lịch sử điểm cộng nào.
							</Text>
						</div>
					) : (
						<div className="space-y-3">
							{details.map((entry) => (
								<Card
									key={entry.id}
									variant="outlined"
									className="p-4 rounded-m3-lg border-m3-outline-variant/40 flex items-center justify-between gap-3 hover:bg-m3-surface-container-low/50 transition-colors"
								>
									<div className="flex items-start gap-3">
										<div
											className={`px-3 py-1.5 rounded-m3-md font-bold text-sm shrink-0 flex items-center gap-1 ${
												entry.points >= 0
													? "bg-m3-primary-container/60 text-m3-on-primary-container"
													: "bg-m3-error-container/60 text-m3-error"
											}`}
										>
											<Icon
												name={entry.points >= 0 ? "add" : "remove"}
												size={16}
											/>
											{Math.abs(entry.points)}
										</div>

										<div>
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-xs font-semibold text-m3-on-surface-variant">
													{formatDate(entry.date)}
												</span>
												<Chip
													variant="assist"
													label={getCategoryLabel(entry.category)}
													className="pointer-events-none h-5 px-2 text-[11px] font-medium"
												/>
											</div>

											{entry.reason && (
												<Text variant="body-md" className="text-sm text-m3-on-surface mt-1 font-medium">
													{entry.reason}
												</Text>
											)}

											<Text variant="body-sm" className="text-xs text-m3-on-surface-variant/70 mt-1">
												Người ghi: {entry.createdByName || "Giáo viên"}
											</Text>
										</div>
									</div>

									<IconButton
										size="sm"
										onClick={() => onDeleteEntry(entry.id)}
										disabled={isDeleting}
										aria-label="Xóa bản ghi điểm cộng"
										className="text-m3-error hover:bg-m3-error/10 shrink-0"
									>
										<Icon name="delete" size={18} />
									</IconButton>
								</Card>
							))}
						</div>
					)}
				</DialogBody>

				<DialogFooter className="p-4 border-t border-m3-outline-variant/30 flex justify-end">
					<DialogClose asChild>
						<Button colorStyle="tonal">Đóng</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
