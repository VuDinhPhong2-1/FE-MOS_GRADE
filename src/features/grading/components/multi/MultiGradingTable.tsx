import { Card } from "@bug-on/m3-expressive";
import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import type React from "react";
import { useMemo } from "react";
import { DataTable, TableEmptyState } from "../../../../components/data-table";
import type { Assignment } from "../../../../types/assignment.types";
import type { Student } from "../../../../types/student.types";
import { cn } from "../../../../utils/utils";
import type {
	MultiAutoCellState,
	MultiScoreCellValue,
	MultiUndoSnapshot,
} from "../../types/gradingFeature.types";
import { getShortAssignmentName } from "../../utils/gradingUtils";
import { MultiGradingCell } from "./MultiGradingCell";

interface MultiGradingTableProps {
	selectedAssignments: Assignment[];
	gradingStudents: Student[];
	multiScores: Map<string, Map<string, MultiScoreCellValue>>;
	multiAutoStates: Map<string, Map<string, MultiAutoCellState>>;
	multiUndoSnapshots: Map<string, MultiUndoSnapshot>;
	multiDragOverCellKey: string | null;
	highlightedStudentId: string | null;
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
	highlightedStudentId,
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
							"sticky left-0 z-30 bg-m3-surface-container-high px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface uppercase tracking-wider w-16",
						cellClassName:
							"sticky left-0 z-10 bg-m3-surface-container px-4 py-3 text-sm text-m3-on-surface-variant font-medium",
					},
					cell: ({ row }) => row.index + 1,
				}),
				helper.display({
					id: "student",
					header: "Học sinh",
					meta: {
						headerClassName:
							"sticky left-16 z-30 bg-m3-surface-container-high px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface uppercase tracking-wider min-w-50",
						cellClassName:
							"sticky left-16 z-10 bg-m3-surface-container px-4 py-3 text-sm font-semibold text-m3-on-surface",
					},
					cell: ({ row }) =>
						`${row.original.middleName} ${row.original.firstName}`,
				}),
				...selectedAssignments.map((assignment) =>
					helper.display({
						id: `assignment_${assignment.id}`,
						header: () => (
							<>
								<div
									className="mx-auto max-w-42.5 truncate font-semibold"
									title={assignment.name}
								>
									{getShortAssignmentName(
										assignment.name,
										assignment.gradingApiEndpoint,
									)}
								</div>
								<div className="mt-0.5 text-[11px] font-normal text-m3-on-surface-variant/80">
									{assignment.gradingType === "auto" ? "Tự động" : "Thủ công"}
								</div>
							</>
						),
						meta: {
							headerClassName:
								"px-4 py-3.5 text-center text-xs font-bold text-m3-on-surface min-w-44",
							cellClassName: "min-w-44",
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
			<Card
				variant="filled"
				disableElevation
				className="p-8 text-center text-sm border-none shadow-none"
			>
				Chưa có bài tập nào được chốt trong ma trận. Hãy chọn các bài tập ở trên
				và bấm "Chốt danh sách".
			</Card>
		);
	}

	return (
		<section
			aria-label="Bang cham diem nhieu bai"
			onDragOver={(event) => {
				event.preventDefault();
				event.dataTransfer.dropEffect = "copy";
			}}
			onDrop={(event) => {
				event.preventDefault();
			}}
		>
			<DataTable
				table={table}
				data-student-scroll-container="true"
				className="max-h-[62vh] overflow-auto rounded-2xl border-none shadow-none bg-m3-surface"
				minWidthClassName="min-w-full"
				tableClassName="border-collapse"
				headerRowClassName="sticky top-0 z-20 bg-m3-surface-container-high shadow-none"
				bodyClassName="bg-m3-surface-container"
				banded={false}
				renderRow={(row, index) => {
					const isHighlighted = highlightedStudentId === row.original.id;
					return (
						<tr
							key={row.id}
							ref={(node) => {
								if (node) rowRefs.current?.set(row.original.id, node);
								else rowRefs.current?.delete(row.original.id);
							}}
							className={cn(
								"transition-colors",
								isHighlighted
									? "bg-m3-secondary-container/80 text-m3-on-secondary-container font-medium"
									: index % 2 === 1
										? "bg-m3-surface-container-high/40"
										: "bg-transparent",
								"hover:bg-m3-surface-container-highest/50",
							)}
						>
							{row.getAllCells().map((cell) => {
								const meta = cell.column.columnDef.meta;
								return (
									<td
										key={cell.id}
										className={cn(
											meta?.cellClassName || "",
											isHighlighted &&
												"bg-m3-secondary-container! text-m3-on-secondary-container",
										)}
									>
										<table.FlexRender cell={cell} />
									</td>
								);
							})}
						</tr>
					);
				}}
				emptyState={
					<TableEmptyState
						icon="fact_check"
						title="Không có học sinh nào"
						description="Chưa có học sinh phù hợp trong danh sách chấm điểm."
					/>
				}
			/>
		</section>
	);
};
