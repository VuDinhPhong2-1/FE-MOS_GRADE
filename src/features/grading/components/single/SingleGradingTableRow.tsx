import { Button, Icon, ProgressIndicator } from "@bug-on/m3-expressive";
import type React from "react";
import { memo } from "react";
import type { Assignment } from "../../../../types/assignment.types";
import type {
	GradingResult,
	StudentGradingState,
} from "../../../../types/grading.types";
import type { Student } from "../../../../types/student.types";
import { getNotifyIssuesFromTaskResults } from "../../../../utils/gradingIssues";
import { notify } from "../../../../utils/notify";
import type { PersistedScoreSnapshot } from "../../types/gradingFeature.types";
import {
	extractAutoGradingErrors,
	getAcceptedSubmissionFileTypes,
} from "../../utils/gradingUtils";

interface SingleGradingTableRowProps {
	student: Student;
	index: number;
	state: StudentGradingState | undefined;
	persistedScore: PersistedScoreSnapshot | undefined;
	selectedAssignmentData: Assignment | undefined;
	canUndoSingle: boolean;
	isDragOver: boolean;
	isUndoing: boolean;
	onRowRef: (node: HTMLTableRowElement | null) => void;
	onFileChange: (
		studentId: string,
		e: React.ChangeEvent<HTMLInputElement>,
	) => void;
	onDragOver: (
		studentId: string,
		isDisabled: boolean,
		e: React.DragEvent<HTMLElement>,
	) => void;
	onDragLeave: (studentId: string) => void;
	onDrop: (
		studentId: string,
		isDisabled: boolean,
		e: React.DragEvent<HTMLElement>,
	) => void;
	onUndo: (studentId: string) => void;
}

const SingleGradingTableRowComponent: React.FC<SingleGradingTableRowProps> = ({
	student,
	index,
	state,
	persistedScore,
	selectedAssignmentData,
	canUndoSingle,
	isDragOver,
	isUndoing,
	onRowRef,
	onFileChange,
	onDragOver,
	onDragLeave,
	onDrop,
	onUndo,
}) => {
	const autoErrors =
		state?.autoGradingErrors ||
		extractAutoGradingErrors(state?.gradingResult || null);

	const renderAutoErrorDropdown = (
		errors: string[] | undefined,
		gradingResult?: GradingResult | null,
	) => {
		const issues = gradingResult
			? getNotifyIssuesFromTaskResults(gradingResult.taskResults)
			: (() => {
					const taskResultIssues = getNotifyIssuesFromTaskResults(
						persistedScore?.autoGradingTaskResults,
					);
					if (taskResultIssues.length > 0) return taskResultIssues;

					return (errors || [])
						.map((message) => (message || "").trim())
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
					Xem lỗi chấm ({issueCount})
				</Button>
			</div>
		);
	};

	return (
		<tr
			ref={onRowRef}
			className="hover:bg-m3-surface-container-high/40 transition-colors"
		>
			<td className="px-4 py-3 text-sm text-m3-on-surface-variant">
				{index + 1}
			</td>
			<td className="px-4 py-3 text-sm font-medium text-m3-on-surface">
				{student.middleName} {student.firstName}
			</td>
			<td className="px-4 py-3 text-center">
				<section
					aria-label={`Vùng tải file cho học sinh ${student.middleName} ${student.firstName}`}
					className={`rounded-xl border border-dashed p-2.5 transition ${
						isDragOver
							? "border-m3-primary bg-m3-primary/10"
							: "border-m3-outline-variant bg-m3-surface-container-low"
					} ${state?.isGrading ? "opacity-60 cursor-not-allowed" : ""}`}
					onDragOver={(e) =>
						onDragOver(student.id, Boolean(state?.isGrading), e)
					}
					onDragLeave={() => onDragLeave(student.id)}
					onDrop={(e) => onDrop(student.id, Boolean(state?.isGrading), e)}
				>
					<input
						id={`single-file-${student.id}`}
						type="file"
						accept={getAcceptedSubmissionFileTypes(
							selectedAssignmentData?.gradingApiEndpoint,
						)}
						onChange={(e) => onFileChange(student.id, e)}
						disabled={state?.isGrading}
						className="hidden"
					/>
					<label
						htmlFor={`single-file-${student.id}`}
						className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
							state?.isGrading
								? "bg-m3-surface-container text-m3-on-surface-variant/40 border-m3-outline-variant/40 cursor-not-allowed"
								: "bg-m3-primary-container text-m3-on-primary-container border-m3-primary/20 cursor-pointer hover:opacity-90"
						}`}
					>
						{state?.studentFile ? "Đổi file bài làm" : "Chọn file bài làm"}
					</label>
					<p className="mt-1 text-[11px] text-m3-on-surface-variant/70">
						Kéo thả file vào đây
					</p>
					{state?.studentFile && (
						<p className="text-xs text-m3-on-surface mt-1 truncate max-w-50 mx-auto">
							{state.studentFile.name}
						</p>
					)}
					{canUndoSingle && (
						<div className="mt-2">
							<Button
								type="button"
								colorStyle="tonal"
								onClick={() => onUndo(student.id)}
								disabled={Boolean(state?.isGrading) || isUndoing}
								className="h-7 px-2 text-[11px]"
							>
								<Icon name="undo" className="text-xs mr-1" />
								{isUndoing ? "Đang hoàn tác..." : "Hoàn tác file vừa chọn"}
							</Button>
						</div>
					)}
					{renderAutoErrorDropdown(autoErrors, state?.gradingResult || null)}
				</section>
			</td>
			<td className="px-4 py-3 text-center">
				{state?.isGrading ? (
					<div className="flex items-center justify-center py-1">
						<ProgressIndicator
							variant="circular"
							shape="wavy"
							size={20}
							aria-label="Đang chấm"
						/>
					</div>
				) : (
					<input
						type="number"
						aria-label={`Điểm học sinh ${student.middleName} ${student.firstName}`}
						value={state?.manualScore ?? ""}
						readOnly
						className="w-20 border border-m3-outline-variant rounded-lg px-2 py-1 text-center bg-m3-surface-container-low text-m3-on-surface"
						min="0"
						max={selectedAssignmentData?.maxScore || 10}
						step="0.01"
						placeholder="0"
					/>
				)}
				{state?.gradingResult && (
					<p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
						Đã chấm tự động
					</p>
				)}
			</td>
			<td className="px-4 py-3 text-center">
				{state?.isGrading ? (
					<span className="text-m3-primary text-sm font-medium">
						Đang chấm...
					</span>
				) : state?.error ? (
					<span className="text-m3-error text-sm flex items-center gap-1 justify-center font-medium">
						<Icon name="cancel" className="text-base text-m3-error" />
						Lỗi
					</span>
				) : state?.gradingResult ? (
					<span className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1 justify-center font-medium">
						<Icon
							name="check_circle"
							className="text-base text-emerald-600 dark:text-emerald-400"
						/>
						Hoàn thành
					</span>
				) : (
					<span className="text-m3-on-surface-variant/60 text-sm">
						Chờ file
					</span>
				)}
			</td>
		</tr>
	);
};

export const SingleGradingTableRow = memo(SingleGradingTableRowComponent);
