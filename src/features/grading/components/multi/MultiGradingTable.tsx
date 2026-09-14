import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import type React from "react";
import { useMemo } from "react";
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

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Student>();

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
	const columns = useMemo(
		() =>
			helper.columns([
				helper.display({
					id: "index",
					header: "STT",
					meta: {
						headerClassName:
							"sticky left-0 z-30 bg-m3-surface-container px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface uppercase tracking-wider w-16 border-r border-m3-outline-variant/20",
						cellClassName:
							"sticky left-0 z-10 bg-m3-surface px-4 py-3 text-sm text-m3-on-surface-variant font-medium border-r border-m3-outline-variant/20",
					},
					cell: ({ row }) => row.index + 1,
				}),
				helper.display({
					id: "student",
					header: "Học sinh",
					meta: {
						headerClassName:
							"sticky left-16 z-30 bg-m3-surface-container px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface uppercase tracking-wider min-w-50 border-r border-m3-outline-variant/20 shadow-xs",
						cellClassName:
							"sticky left-16 z-10 bg-m3-surface px-4 py-3 text-sm font-semibold text-m3-on-surface border-r border-m3-outline-variant/20 shadow-xs",
					},
					cell: ({ row }) =>
						`${row.original.middleName} ${row.original.firstName}`,
				}),
				...selectedAssignments.map((assignment) =>
					helper.display({
						id: `assignment_${assignment.id}`,
						header: () => (
							<>
								<div className="mx-auto max-w-42.5 truncate font-semibold">
									{assignment.name}
								</div>
								<div className="mt-0.5 text-[11px] font-normal text-m3-on-surface-variant/80">
									Max: {assignment.maxScore}đ •{" "}
									{assignment.gradingType === "auto" ? "Tự động" : "Thủ công"}
								</div>
							</>
						),
						meta: {
							headerClassName:
								"px-4 py-3.5 text-center text-xs font-bold text-m3-on-surface border-r border-m3-outline-variant/20 last:border-r-0 min-w-42.5",
							cellClassName:
								"border-r border-m3-outline-variant/20 last:border-r-0",
						},
						cell: ({ row }) => {
							const student = row.original;
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
						},
					}),
				),
			]),
		[
			selectedAssignments,
			multiScores,
			multiAutoStates,
			multiUndoSnapshots,
			multiDragOverCellKey,
			onScoreChange,
			onFileChange,
			onDragOver,
			onDragLeave,
			onDrop,
			onUndo,
		],
	);

	const table = useTable({
		features,
		columns,
		data: gradingStudents,
		getRowId: (row) => row.id,
	});

	if (selectedAssignments.length === 0) {
		return (
			<div className="rounded-3xl border border-m3-outline-variant/30 bg-m3-surface p-8 text-center text-sm text-m3-on-surface-variant">
				Chưa có bài tập nào được chốt trong ma trận. Hãy chọn các bài tập ở trên
				và bấm "Chốt danh sách".
			</div>
		);
	}

	return (
		<div
			data-student-scroll-container="true"
			className="max-h-[62vh] overflow-auto rounded-2xl border border-m3-outline-variant/30 bg-m3-surface shadow-xs"
		>
			<table className="min-w-full border-collapse divide-y divide-m3-outline-variant/30">
				<thead className="sticky top-0 z-20 bg-m3-surface-container-high shadow-xs">
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
										"h-12 px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant align-middle"
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
					{table.getRowModel().rows.map((row, index) => (
						<tr
							key={row.id}
							ref={(node) => {
								if (node) rowRefs.current?.set(row.original.id, node);
								else rowRefs.current?.delete(row.original.id);
							}}
							className={`transition-colors ${
								index % 2 === 1
									? "bg-m3-surface-container-high/25"
									: "bg-transparent"
							} hover:bg-m3-surface-container-high/40`}
						>
							{row.getAllCells().map((cell) => {
								const meta = cell.column.columnDef.meta;
								return (
									<td key={cell.id} className={meta?.cellClassName || ""}>
										<table.FlexRender cell={cell} />
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
