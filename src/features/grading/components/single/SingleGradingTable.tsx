import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import type React from "react";
import { useMemo } from "react";
import type { Assignment } from "../../../../types/assignment.types";
import type { StudentGradingState } from "../../../../types/grading.types";
import type { Student } from "../../../../types/student.types";
import type {
	PersistedScoreSnapshot,
	SingleUndoSnapshot,
} from "../../types/gradingFeature.types";
import { SingleGradingTableRow } from "./SingleGradingTableRow";

interface SingleGradingTableProps {
	gradingStudents: Student[];
	studentGradingStates: Map<string, StudentGradingState>;
	singlePersistedScores: Map<string, PersistedScoreSnapshot>;
	singleUndoSnapshots: Map<string, SingleUndoSnapshot>;
	selectedAssignmentData: Assignment | undefined;
	singleDragOverStudentId: string | null;
	undoingSingleStudentId: string | null;
	rowRefs: React.RefObject<Map<string, HTMLTableRowElement>>;
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

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Student>();

export const SingleGradingTable: React.FC<SingleGradingTableProps> = ({
	gradingStudents,
	studentGradingStates,
	singlePersistedScores,
	singleUndoSnapshots,
	selectedAssignmentData,
	singleDragOverStudentId,
	undoingSingleStudentId,
	rowRefs,
	onFileChange,
	onDragOver,
	onDragLeave,
	onDrop,
	onUndo,
}) => {
	const columns = useMemo(
		() =>
			helper.columns([
				helper.display({
					id: "index",
					header: "STT",
					meta: {
						headerClassName:
							"px-4 py-3 text-left text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider",
					},
				}),
				helper.display({
					id: "student",
					header: "Học sinh",
					meta: {
						headerClassName:
							"px-4 py-3 text-left text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider",
					},
				}),
				helper.display({
					id: "file",
					header: "File bài làm",
					meta: {
						headerClassName:
							"px-4 py-3 text-center text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider",
					},
				}),
				helper.display({
					id: "score",
					header: "Điểm",
					meta: {
						headerClassName:
							"px-4 py-3 text-center text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider",
					},
				}),
				helper.display({
					id: "status",
					header: "Trạng thái",
					meta: {
						headerClassName:
							"px-4 py-3 text-center text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider",
					},
				}),
			]),
		[],
	);

	const table = useTable({
		features,
		columns,
		data: gradingStudents,
		getRowId: (row) => row.id,
	});

	return (
		<div
			data-student-scroll-container="true"
			className="max-h-[60vh] overflow-auto rounded-2xl bg-m3-surface shadow-xs border border-m3-outline-variant/30"
		>
			<table className="min-w-full divide-y divide-m3-outline-variant/30">
				<caption className="caption-top px-4 py-3 text-left text-sm font-semibold text-m3-on-surface border-b border-m3-outline-variant/20">
					Bảng chấm điểm học sinh ({gradingStudents.length} học sinh)
				</caption>
				<thead className="sticky top-0 z-10 bg-m3-surface-container-high shadow-xs">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr
							key={headerGroup.id}
							className="h-12 border-b border-m3-outline-variant/60 bg-m3-surface-container-high text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant"
						>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className={
										header.column.columnDef.meta?.headerClassName ||
										"h-12 px-4 py-3.5 align-middle text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider"
									}
								>
									{header.isPlaceholder ? null : (
										<table.FlexRender header={header} />
									)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody className="divide-y divide-m3-outline-variant/20 bg-m3-surface-container">
					{table.getRowModel().rows.map((row, index) => {
						const student = row.original;
						const state = studentGradingStates.get(student.id);
						const persistedScore = singlePersistedScores.get(student.id);
						const canUndoSingle =
							singleUndoSnapshots.has(student.id) ||
							Boolean(
								state?.studentFile ||
									state?.gradingResult ||
									state?.error ||
									state?.manualScore !== null,
							);

						return (
							<SingleGradingTableRow
								key={student.id}
								student={student}
								index={index}
								state={state}
								persistedScore={persistedScore}
								selectedAssignmentData={selectedAssignmentData}
								canUndoSingle={canUndoSingle}
								isDragOver={singleDragOverStudentId === student.id}
								isUndoing={undoingSingleStudentId === student.id}
								onRowRef={(node) => {
									if (node) rowRefs.current?.set(student.id, node);
									else rowRefs.current?.delete(student.id);
								}}
								onFileChange={onFileChange}
								onDragOver={onDragOver}
								onDragLeave={onDragLeave}
								onDrop={onDrop}
								onUndo={onUndo}
							/>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
