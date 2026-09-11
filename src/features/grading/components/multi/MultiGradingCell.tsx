import { Button, Icon, ProgressIndicator } from "@bug-on/m3-expressive";
import type React from "react";
import { memo } from "react";
import type { Assignment } from "../../../../types/assignment.types";
import type { Student } from "../../../../types/student.types";
import { getNotifyIssuesFromTaskResults } from "../../../../utils/gradingIssues";
import { notify } from "../../../../utils/notify";
import type {
	MultiAutoCellState,
	MultiScoreCellValue,
} from "../../types/gradingFeature.types";
import {
	extractAutoGradingErrors,
	getAcceptedSubmissionFileTypes,
} from "../../utils/gradingUtils";

interface MultiGradingCellProps {
	assignment: Assignment;
	student: Student;
	currentScore: MultiScoreCellValue | undefined;
	autoState: MultiAutoCellState | undefined;
	canUndoCell: boolean;
	isDragOver: boolean;
	onScoreChange: (value: number | null) => void;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDragOver: (isDisabled: boolean, e: React.DragEvent<HTMLElement>) => void;
	onDragLeave: () => void;
	onDrop: (isDisabled: boolean, e: React.DragEvent<HTMLElement>) => void;
	onUndo: () => void;
}

const MultiGradingCellComponent: React.FC<MultiGradingCellProps> = ({
	assignment,
	student,
	currentScore,
	autoState,
	canUndoCell,
	isDragOver,
	onScoreChange,
	onFileChange,
	onDragOver,
	onDragLeave,
	onDrop,
	onUndo,
}) => {
	const autoErrors = extractAutoGradingErrors(autoState?.gradingResult || null);

	const renderAutoErrorDropdown = () => {
		const issues = autoState?.gradingResult
			? getNotifyIssuesFromTaskResults(
					autoState.gradingResult.taskResults || [],
				)
			: (() => {
					if (autoErrors.length === 0) return [];
					return autoErrors
						.map((message) => message.trim())
						.filter((message) => message.length > 0)
						.map((message) => ({
							heading: "Lỗi chấm tự động",
							message,
							fixAction: "",
						}));
				})();

		const issueCount = issues.length;
		if (issueCount === 0) return null;

		return (
			<div className="mt-1 text-left">
				<Button
					type="button"
					colorStyle="text"
					className="h-auto p-0 text-[11px] text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
					onClick={() => {
						try {
							notify.custom({
								message: "Lỗi chấm tự động",
								type: "error",
								issues,
								title: "Lỗi chấm tự động",
							});
						} catch {
							// ignore
						}
					}}
				>
					Xem lỗi ({issueCount})
				</Button>
			</div>
		);
	};

	return (
		<td className="px-3 py-3 align-top border-r border-m3-outline-variant/10 last:border-r-0 min-w-42.5">
			<div className="flex flex-col items-center">
				<input
					type="number"
					aria-label={`Điểm bài ${assignment.name} của ${student.middleName} ${student.firstName}`}
					value={currentScore?.scoreValue ?? ""}
					onChange={(e) => {
						const val = e.target.value === "" ? null : Number(e.target.value);
						onScoreChange(val);
					}}
					className="w-20 border border-m3-outline-variant rounded-lg px-2 py-1 text-center bg-m3-surface-container-low text-m3-on-surface text-sm font-medium"
					min="0"
					max={assignment.maxScore}
					step="0.01"
					placeholder="0"
				/>

				{assignment.gradingType === "auto" && (
					<section
						aria-label={`Vùng nộp bài ${assignment.name} cho ${student.middleName} ${student.firstName}`}
						className={`mt-2 w-full space-y-1 rounded-xl border border-dashed p-2 transition text-center ${
							isDragOver
								? "border-m3-primary bg-m3-primary/10"
								: "border-m3-outline-variant bg-m3-surface-container-low"
						} ${autoState?.isGrading ? "opacity-60 cursor-not-allowed" : ""}`}
						onDragOver={(e) => onDragOver(Boolean(autoState?.isGrading), e)}
						onDragLeave={onDragLeave}
						onDrop={(e) => onDrop(Boolean(autoState?.isGrading), e)}
					>
						<input
							id={`multi-file-${assignment.id}-${student.id}`}
							type="file"
							accept={getAcceptedSubmissionFileTypes(
								assignment.gradingApiEndpoint,
							)}
							onChange={onFileChange}
							disabled={autoState?.isGrading}
							className="hidden"
						/>
						<label
							htmlFor={`multi-file-${assignment.id}-${student.id}`}
							className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
								autoState?.isGrading
									? "bg-m3-surface-container text-m3-on-surface-variant/40 border-m3-outline-variant/40 cursor-not-allowed"
									: "bg-m3-primary-container text-m3-on-primary-container border-m3-primary/20 cursor-pointer hover:opacity-90"
							}`}
						>
							{autoState?.studentFile ? "Đổi file" : "Chọn file"}
						</label>

						<p className="text-[10px] text-m3-on-surface-variant/70">
							Kéo thả file vào đây
						</p>

						{autoState?.studentFile && (
							<p className="text-[11px] text-m3-on-surface truncate max-w-37.5 mx-auto">
								{autoState.studentFile.name}
							</p>
						)}

						{autoState?.isGrading && (
							<div className="flex items-center justify-center gap-1 py-1">
								<ProgressIndicator
									variant="circular"
									shape="wavy"
									size={14}
									aria-label="Đang chấm"
								/>
								<span className="text-[11px] text-m3-primary font-medium">
									Đang chấm...
								</span>
							</div>
						)}

						{autoState?.gradingResult && (
							<p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
								Đã chấm tự động
							</p>
						)}

						{autoState?.error && (
							<p className="text-[11px] text-m3-error font-medium">
								Lỗi: {autoState.error}
							</p>
						)}

						{canUndoCell && (
							<div>
								<Button
									type="button"
									colorStyle="tonal"
									onClick={onUndo}
									disabled={Boolean(autoState?.isGrading)}
									className="mt-1 h-6 px-1.5 text-[10px]"
								>
									<Icon name="undo" className="text-xs mr-0.5" />
									Hoàn tác
								</Button>
							</div>
						)}

						{renderAutoErrorDropdown()}
					</section>
				)}
			</div>
		</td>
	);
};

export const MultiGradingCell = memo(MultiGradingCellComponent);
