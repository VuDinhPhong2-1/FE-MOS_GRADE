import type React from "react";
import type { Assignment } from "../../../../types/assignment.types";
import type { Student } from "../../../../types/student.types";
import type {
	MultiAutoCellState,
	MultiScoreCellValue,
	MultiUndoSnapshot,
} from "../../types/gradingFeature.types";
import { MultiGradingCell } from "./MultiGradingCell";

interface MultiGradingTableProps {
	selectedAssignments: Assignment[];
	gradingStudents: Student[];
	multiScores: Map<string, Map<string, MultiScoreCellValue>>;
	multiAutoStates: Map<string, Map<string, MultiAutoCellState>>;
	multiUndoSnapshots: Map<string, MultiUndoSnapshot>;
	multiDragOverCellKey: string | null;
	rowRefs: React.RefObject<Map<string, HTMLTableRowElement>>;
	onScoreChange: (
		assignmentId: string,
		studentId: string,
		value: number | null,
	) => void;
	onFileChange: (
		assignmentId: string,
		studentId: string,
		e: React.ChangeEvent<HTMLInputElement>,
	) => void;
	onDragOver: (
		assignmentId: string,
		studentId: string,
		isDisabled: boolean,
		e: React.DragEvent<HTMLElement>,
	) => void;
	onDragLeave: (assignmentId: string, studentId: string) => void;
	onDrop: (
		assignmentId: string,
		studentId: string,
		isDisabled: boolean,
		e: React.DragEvent<HTMLElement>,
	) => void;
	onUndo: (assignmentId: string, studentId: string) => void;
}

export const MultiGradingTable: React.FC<MultiGradingTableProps> = ({
	selectedAssignments,
	gradingStudents,
	multiScores,
	multiAutoStates,
	multiUndoSnapshots,
	multiDragOverCellKey,
	rowRefs,
	onScoreChange,
	onFileChange,
	onDragOver,
	onDragLeave,
	onDrop,
	onUndo,
}) => {
	if (selectedAssignments.length === 0) {
		return (
			<div className="p-8 text-center rounded-3xl bg-m3-surface border border-m3-outline-variant/30 text-m3-on-surface-variant text-sm">
				Chưa có bài tập nào được chốt trong ma trận. Hãy chọn các bài tập ở trên
				và bấm "Chốt danh sách".
			</div>
		);
	}

	return (
		<div
			data-student-scroll-container="true"
			className="max-h-[62vh] overflow-auto rounded-3xl bg-m3-surface border border-m3-outline-variant/30 shadow-xs"
		>
			<table className="min-w-full divide-y divide-m3-outline-variant/30 border-collapse">
				<thead className="sticky top-0 z-20 bg-m3-surface-container shadow-xs">
					<tr>
						<th className="sticky left-0 z-30 bg-m3-surface-container px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface uppercase tracking-wider w-16 border-r border-m3-outline-variant/20">
							STT
						</th>
						<th className="sticky left-16 z-30 bg-m3-surface-container px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface uppercase tracking-wider min-w-50 border-r border-m3-outline-variant/20 shadow-xs">
							Học sinh
						</th>
						{selectedAssignments.map((assignment) => (
							<th
								key={assignment.id}
								className="px-4 py-3.5 text-center text-xs font-bold text-m3-on-surface border-r border-m3-outline-variant/20 last:border-r-0 min-w-42.5"
							>
								<div className="truncate max-w-42.5 mx-auto font-semibold">
									{assignment.name}
								</div>
								<div className="text-[11px] text-m3-on-surface-variant/80 font-normal mt-0.5">
									Max: {assignment.maxScore}đ •{" "}
									{assignment.gradingType === "auto" ? "Tự động" : "Thủ công"}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-m3-outline-variant/20 bg-m3-surface">
					{gradingStudents.map((student, index) => (
						<tr
							key={student.id}
							ref={(node) => {
								if (node) rowRefs.current?.set(student.id, node);
								else rowRefs.current?.delete(student.id);
							}}
							className="hover:bg-m3-surface-container-high/30 transition-colors"
						>
							<td className="sticky left-0 z-10 bg-m3-surface px-4 py-3 text-sm text-m3-on-surface-variant font-medium border-r border-m3-outline-variant/20">
								{index + 1}
							</td>
							<td className="sticky left-16 z-10 bg-m3-surface px-4 py-3 text-sm font-semibold text-m3-on-surface border-r border-m3-outline-variant/20 shadow-xs">
								{student.middleName} {student.firstName}
							</td>
							{selectedAssignments.map((assignment) => {
								const current = multiScores.get(assignment.id)?.get(student.id);
								const autoState = multiAutoStates
									.get(assignment.id)
									?.get(student.id);
								const undoKey = `${assignment.id}::${student.id}`;
								const canUndoCell = multiUndoSnapshots.has(undoKey);
								const isDragOver =
									multiDragOverCellKey === `${assignment.id}:${student.id}`;

								return (
									<MultiGradingCell
										key={`${assignment.id}-${student.id}`}
										assignment={assignment}
										student={student}
										currentScore={current}
										autoState={autoState}
										canUndoCell={canUndoCell}
										isDragOver={isDragOver}
										onScoreChange={(val) =>
											onScoreChange(assignment.id, student.id, val)
										}
										onFileChange={(e) =>
											onFileChange(assignment.id, student.id, e)
										}
										onDragOver={(isDisabled, e) =>
											onDragOver(assignment.id, student.id, isDisabled, e)
										}
										onDragLeave={() => onDragLeave(assignment.id, student.id)}
										onDrop={(isDisabled, e) =>
											onDrop(assignment.id, student.id, isDisabled, e)
										}
										onUndo={() => onUndo(assignment.id, student.id)}
									/>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
