import {
	Card,
	Chip,
	Icon,
	IconButton,
	ScrollArea,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useCallback, useRef } from "react";
import type { Student } from "../../types/student.types";

interface ManualGradingTableProps {
	students: Student[];
	draftScores: Record<string, { score: string; feedback: string }>;
	savedScores: Record<string, number | null>;
	maxScore: number;
	onScoreChange: (studentId: string, score: string) => void;
	onFeedbackChange: (studentId: string, feedback: string) => void;
	onSaveSingleStudent: (studentId: string) => void;
	savingStudentId?: string | null;
}

export const ManualGradingTable: React.FC<ManualGradingTableProps> = ({
	students,
	draftScores,
	savedScores,
	maxScore,
	onScoreChange,
	onFeedbackChange,
	onSaveSingleStudent,
	savingStudentId,
}) => {
	const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	const handleKeyDown = useCallback(
		(currentIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" || e.key === "ArrowDown") {
				e.preventDefault();
				const nextStudent = students[currentIndex + 1];
				if (nextStudent) {
					inputRefs.current[nextStudent.id]?.focus();
					inputRefs.current[nextStudent.id]?.select();
				}
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				const prevStudent = students[currentIndex - 1];
				if (prevStudent) {
					inputRefs.current[prevStudent.id]?.focus();
					inputRefs.current[prevStudent.id]?.select();
				}
			}
		},
		[students],
	);

	if (students.length === 0) {
		return (
			<Card
				variant="outlined"
				className="p-12 text-center rounded-m3-xl border-dashed border-m3-outline-variant/60"
			>
				<Icon
					name="person_off"
					size={48}
					className="mx-auto text-m3-on-surface-variant/60 mb-3"
				/>
				<h3 className="text-lg font-semibold text-m3-on-surface mb-1">
					Không tìm thấy học sinh nào
				</h3>
				<Text variant="body-md" className="text-sm text-m3-on-surface-variant">
					Lớp học chưa có học sinh hoặc không có kết quả phù hợp với từ khóa tìm
					kiếm.
				</Text>
			</Card>
		);
	}

	return (
		<div className="rounded-m3-xl border border-m3-outline-variant/40 bg-m3-surface shadow-sm overflow-hidden">
			<ScrollArea orientation="both" className="w-full">
				<table className="min-w-225 w-full text-left border-collapse">
					<thead>
						<tr className="bg-m3-surface-container border-b border-m3-outline-variant/40 text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
							<th className="py-3 px-4 w-12 text-center">STT</th>
							<th className="py-3 px-4 min-w-50">Học sinh</th>
							<th className="py-3 px-4 w-44">Điểm số</th>
							<th className="py-3 px-4 min-w-55">Nhận xét / Ghi chú</th>
							<th className="py-3 px-4 w-32 text-center">Trạng thái</th>
							<th className="py-3 px-4 w-20 text-center">Lưu</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-m3-outline-variant/30 text-sm">
						{students.map((student, index) => {
							const draft = draftScores[student.id] ?? {
								score: "",
								feedback: "",
							};
							const saved = savedScores[student.id];
							const fullName =
								`${student.middleName || ""} ${student.firstName || ""}`.trim() ||
								"Chưa có tên";
							const initial = (
								student.firstName?.[0] ||
								fullName[0] ||
								"?"
							).toUpperCase();

							const hasDraftValue = draft.score.trim() !== "";
							const parsedDraftScore = hasDraftValue
								? parseFloat(draft.score)
								: null;
							const isScoreValid =
								!hasDraftValue ||
								(!Number.isNaN(parsedDraftScore!) &&
									parsedDraftScore! >= 0 &&
									parsedDraftScore! <= maxScore);

							const isDirty =
								(hasDraftValue && parsedDraftScore !== saved) ||
								(!hasDraftValue && saved !== null && saved !== undefined);

							const isSaved = !isDirty && saved !== null && saved !== undefined;

							const isRowSaving = savingStudentId === student.id;

							return (
								<tr
									key={student.id}
									className={`transition-colors hover:bg-m3-surface-container-low/60 ${
										isDirty ? "bg-m3-error-container/10" : ""
									}`}
								>
									{/* STT */}
									<td className="py-3 px-4 text-center font-medium text-m3-on-surface-variant/80">
										{index + 1}
									</td>

									{/* Student Info */}
									<td className="py-3 px-4">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
												{initial}
											</div>
											<div>
												<Text
													variant="body-md"
													className="font-semibold text-m3-on-surface leading-tight"
												>
													{fullName}
												</Text>
												{student.notes && (
													<Text
														variant="body-sm"
														className="text-xs text-m3-on-surface-variant truncate max-w-xs mt-0.5"
													>
														{student.notes}
													</Text>
												)}
											</div>
										</div>
									</td>

									{/* Score Input */}
									<td className="py-3 px-4">
										<div className="w-36">
											<TextField
												variant="outlined"
												type="number"
												value={draft.score}
												onChange={(val) => onScoreChange(student.id, val)}
												onKeyDown={(e) =>
													handleKeyDown(
														index,
														e as unknown as React.KeyboardEvent<HTMLInputElement>,
													)
												}
												suffixText={`/${maxScore}`}
												placeholder="Nhập..."
												error={!isScoreValid}
												errorText={
													!isScoreValid ? `0 - ${maxScore}` : undefined
												}
												fullWidth
											/>
										</div>
									</td>

									{/* Feedback Input */}
									<td className="py-3 px-4">
										<TextField
											variant="outlined"
											value={draft.feedback}
											onChange={(val) => onFeedbackChange(student.id, val)}
											placeholder="Nhận xét bài kiểm tra..."
											fullWidth
										/>
									</td>

									{/* Status Chip */}
									<td className="py-3 px-4 text-center">
										{isDirty ? (
											<Chip
												variant="assist"
												label="Chưa lưu"
												leadingIcon={
													<Icon
														name="error_outline"
														size={14}
														className="text-m3-error"
													/>
												}
												className="pointer-events-none h-6 px-2 text-xs font-semibold bg-m3-error-container/40 text-m3-error border-transparent"
											/>
										) : isSaved ? (
											<Chip
												variant="assist"
												label="Đã lưu"
												leadingIcon={
													<Icon
														name="check_circle"
														size={14}
														className="text-m3-primary"
													/>
												}
												className="pointer-events-none h-6 px-2 text-xs font-semibold bg-m3-primary-container/40 text-m3-primary border-transparent"
											/>
										) : (
											<span className="text-xs text-m3-on-surface-variant/60 font-medium">
												Chưa nhập
											</span>
										)}
									</td>

									{/* Actions: Quick Save single row */}
									<td className="py-3 px-4 text-center">
										<IconButton
											size="sm"
											onClick={() => onSaveSingleStudent(student.id)}
											disabled={!isDirty || !isScoreValid || isRowSaving}
											aria-label={`Lưu điểm cho ${fullName}`}
											className={
												isDirty && isScoreValid
													? "text-m3-primary hover:bg-m3-primary/10"
													: "text-m3-on-surface/30"
											}
										>
											<Icon
												name={isRowSaving ? "hourglass_empty" : "save"}
												size={20}
											/>
										</IconButton>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</ScrollArea>
		</div>
	);
};
