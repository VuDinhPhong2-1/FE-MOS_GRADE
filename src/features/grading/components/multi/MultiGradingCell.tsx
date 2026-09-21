import {
	Button,
	Icon,
	ProgressIndicator,
	TextField,
} from "@bug-on/m3-expressive";
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
					className="h-auto p-0 text-[11px] text-m3-error hover:underline cursor-pointer border-none shadow-none"
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
		<div className="px-3 py-3 align-top min-w-44">
			<div className="flex flex-col items-center">
				<TextField
					type="number"
					aria-label={`Điểm bài ${assignment.name} của ${student.middleName} ${student.firstName}`}
					value={
						currentScore?.scoreValue !== undefined &&
						currentScore?.scoreValue !== null
							? String(currentScore.scoreValue)
							: ""
					}
					onChange={(valStr) => {
						const trimmed = valStr.trim();
						if (trimmed === "") {
							onScoreChange(null);
							return;
						}
						const num = Number(trimmed);
						onScoreChange(Number.isNaN(num) ? null : num);
					}}
					min="0"
					max={String(assignment.maxScore)}
					step="0.01"
					placeholder="0"
					dense
					fullWidth={false}
					noSpinner
					className="w-24 text-center [&_input]:text-center [&_input]:font-semibold [&_input]:text-sm border-none shadow-none"
				/>

				{assignment.gradingType === "auto" && (
					<section
						aria-label={`Vùng nộp bài ${assignment.name} cho ${student.middleName} ${student.firstName}`}
						className={`mt-2 w-full space-y-1.5 rounded-2xl p-2.5 transition-colors text-center ${
							isDragOver
								? "bg-m3-primary-container/40"
								: "bg-m3-surface-container-low"
						} ${autoState?.isGrading ? "opacity-60 cursor-not-allowed" : ""}`}
						onDragEnter={(e) => onDragOver(Boolean(autoState?.isGrading), e)}
						onDragOver={(e) => onDragOver(Boolean(autoState?.isGrading), e)}
						onDragLeave={(e) => {
							const nextTarget = e.relatedTarget;
							if (
								nextTarget instanceof Node &&
								e.currentTarget.contains(nextTarget)
							) {
								return;
							}
							onDragLeave();
						}}
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
						<Button
							asChild
							colorStyle="tonal"
							size="sm"
							disabled={Boolean(autoState?.isGrading)}
							className="h-7 px-2.5 text-[11px] rounded-lg border-none shadow-none cursor-pointer"
						>
							<label
								htmlFor={`multi-file-${assignment.id}-${student.id}`}
								className={
									autoState?.isGrading
										? "cursor-not-allowed opacity-60"
										: "cursor-pointer"
								}
							>
								{autoState?.studentFile ? "Đổi file" : "Chọn file"}
							</label>
						</Button>

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
							<p className="text-[11px] text-m3-tertiary font-medium">
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
									className="mt-1 h-6 px-1.5 text-[10px] border-none shadow-none"
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
		</div>
	);
};

export const MultiGradingCell = memo(MultiGradingCellComponent);
