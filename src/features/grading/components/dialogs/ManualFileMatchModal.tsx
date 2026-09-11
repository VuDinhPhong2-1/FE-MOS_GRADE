import {
	Button,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	IconButton,
	ProgressIndicator,
	Select,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { Assignment } from "../../../../types/assignment.types";
import type { Student } from "../../../../types/student.types";
import type { PendingManualMultiFileMatch } from "../../types/gradingFeature.types";

interface ManualFileMatchModalProps {
	isOpen: boolean;
	matches: PendingManualMultiFileMatch[];
	assignments: Assignment[];
	students: Student[];
	isApplying: boolean;
	onSelectAssignmentForMatch: (matchId: string, assignmentId: string) => void;
	onApplyMatch: (matchId: string) => void;
	onApplyAll: () => void;
	onRemoveMatch: (matchId: string) => void;
	onClose: () => void;
}

export const ManualFileMatchModal: React.FC<ManualFileMatchModalProps> = ({
	isOpen,
	matches,
	assignments,
	students,
	isApplying,
	onSelectAssignmentForMatch,
	onApplyMatch,
	onApplyAll,
	onRemoveMatch,
	onClose,
}) => {
	if (!isOpen || matches.length === 0) return null;

	const studentNameById = new Map(
		students.map((s) => [s.id, `${s.middleName} ${s.firstName}`.trim()]),
	);

	const assignmentNameById = new Map(assignments.map((a) => [a.id, a.name]));

	const selectedCount = matches.filter((m) => m.selectedAssignmentId).length;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogPortal>
				<DialogOverlay />
				<DialogContent className="max-w-4xl w-full rounded-3xl bg-m3-surface-container p-0 shadow-2xl border border-m3-outline-variant/30 overflow-hidden flex flex-col max-h-[85vh]">
					{/* Header */}
					<div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-m3-outline-variant/20">
						<DialogHeader>
							<DialogTitle className="text-lg font-bold text-m3-on-surface">
								Giải quyết file bài làm cần chọn tay
							</DialogTitle>
							<DialogDescription className="text-xs text-m3-on-surface-variant mt-0.5">
								Hệ thống chưa thể tự động gán cột bài tập cho {matches.length}{" "}
								file bên dưới. Vui lòng chọn bài tập tương ứng.
							</DialogDescription>
						</DialogHeader>
						<IconButton
							type="button"
							size="sm"
							colorStyle="standard"
							aria-label="Đóng"
							onClick={onClose}
						>
							<Icon name="close" />
						</IconButton>
					</div>

					{/* Body */}
					<DialogBody className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
						<div className="rounded-2xl border border-m3-outline-variant/20 overflow-hidden shadow-2xs">
							<table className="min-w-full divide-y divide-m3-outline-variant/20 bg-m3-surface">
								<thead className="bg-m3-surface-container-low">
									<tr>
										<th className="px-3 py-2.5 text-left text-xs font-semibold text-m3-on-surface-variant">
											Học sinh
										</th>
										<th className="px-3 py-2.5 text-left text-xs font-semibold text-m3-on-surface-variant">
											Tên file
										</th>
										<th className="px-3 py-2.5 text-left text-xs font-semibold text-m3-on-surface-variant">
											Lý do
										</th>
										<th className="px-3 py-2.5 text-left text-xs font-semibold text-m3-on-surface-variant min-w-50">
											Gán vào bài tập
										</th>
										<th className="px-3 py-2.5 text-center text-xs font-semibold text-m3-on-surface-variant">
											Hành động
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-m3-outline-variant/20">
									{matches.map((item) => {
										const studentName =
											studentNameById.get(item.studentId) || item.studentId;

										const candidateOptions = [
											{ value: "", label: "-- Chọn bài tập --" },
											...item.candidateAssignmentIds.map((assignId) => ({
												value: assignId,
												label: assignmentNameById.get(assignId) || assignId,
											})),
										];

										return (
											<tr
												key={item.id}
												className="hover:bg-m3-surface-container-high/30 transition-colors"
											>
												<td className="px-3 py-2.5 text-xs font-semibold text-m3-on-surface">
													{studentName}
												</td>
												<td className="px-3 py-2.5 text-xs text-m3-on-surface max-w-50 truncate">
													{item.file.name}
												</td>
												<td className="px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
													{item.reason}
												</td>
												<td className="px-3 py-2.5">
													<Select
														variant="outlined"
														options={candidateOptions}
														value={item.selectedAssignmentId || ""}
														onChange={(val) =>
															onSelectAssignmentForMatch(item.id, val)
														}
														disabled={isApplying}
														fullWidth
														className="text-xs"
													/>
												</td>
												<td className="px-3 py-2.5 text-center">
													<div className="inline-flex items-center gap-1.5">
														<Button
															type="button"
															colorStyle="tonal"
															onClick={() => onApplyMatch(item.id)}
															disabled={
																!item.selectedAssignmentId || isApplying
															}
															className="h-8 px-2.5 text-xs"
														>
															Gán
														</Button>
														<IconButton
															type="button"
															size="sm"
															colorStyle="standard"
															onClick={() => onRemoveMatch(item.id)}
															disabled={isApplying}
															aria-label="Bỏ qua file này"
															className="text-m3-error hover:bg-m3-error/10"
														>
															<Icon name="delete" className="text-sm" />
														</IconButton>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</DialogBody>

					{/* Footer */}
					<DialogFooter className="flex items-center justify-between border-t border-m3-outline-variant/20 px-6 py-4 bg-m3-surface-container-high/50">
						<span className="text-xs text-m3-on-surface-variant font-medium">
							{selectedCount}/{matches.length} file đã chọn bài tập
						</span>
						<div className="flex gap-2">
							<Button
								type="button"
								colorStyle="text"
								onClick={onClose}
								disabled={isApplying}
							>
								Đóng
							</Button>
							<Button
								type="button"
								colorStyle="filled"
								onClick={onApplyAll}
								disabled={isApplying || selectedCount === 0}
							>
								{isApplying ? (
									<>
										<ProgressIndicator
											variant="circular"
											shape="wavy"
											size={16}
											aria-label="Đang gán..."
										/>
										Đang gán...
									</>
								) : (
									<>
										<Icon name="done_all" className="text-base mr-1.5" />
										Gán tất cả đã chọn
									</>
								)}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
