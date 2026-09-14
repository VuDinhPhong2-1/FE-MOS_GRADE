import {
	Button,
	Icon,
	PlainTooltip,
	Switch,
	TooltipBox,
} from "@bug-on/m3-expressive";
import {
	createColumnHelper,
	createSortedRowModel,
	rowSortingFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { memo, useMemo } from "react";
import {
	DataTable,
	SortableHeader,
	TableEmptyState,
} from "../../components/data-table";
import type { Student } from "../../types/student.types";
import type { CompetencyLevel } from "./types";
import {
	competencyBadgeClass,
	isStudentActive,
	VALID_COMPETENCY_LEVELS,
	vietnameseCollator,
} from "./types";

export interface StudentTableProps {
	displayedStudents: Student[];
	totalStudentsCount: number;
	isLoading: boolean;
	readOnly: boolean;
	inlineSavingStudentId: string | null;
	onCompetencyChange: (student: Student, level: CompetencyLevel) => void;
	onExamToggle: (student: Student) => void;
	onEdit: (student: Student) => void;
	onDelete: (student: Student) => void;
}

const features = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
});

const helper = createColumnHelper<typeof features, Student>();

const StudentTableComponent = ({
	displayedStudents,
	totalStudentsCount,
	isLoading,
	readOnly,
	inlineSavingStudentId,
	onCompetencyChange,
	onExamToggle,
	onEdit,
	onDelete,
}: StudentTableProps) => {
	const columns = useMemo(
		() =>
			helper.columns([
				helper.display({
					id: "index",
					header: "STT",
					meta: {
						className: "w-16 text-center",
						align: "center",
					},
					cell: ({ row }) => (
						<span className="text-m3-on-surface-variant">{row.index + 1}</span>
					),
				}),
				helper.accessor("middleName", {
					header: "Họ và tên đệm",
					cell: ({ getValue }) => (
						<span className="font-medium text-m3-on-surface">{getValue()}</span>
					),
				}),
				helper.accessor("firstName", {
					header: ({ header }) => (
						<SortableHeader header={header} title="Tên" />
					),
					sortFn: (rowA, rowB) => {
						const byFirstName = vietnameseCollator.compare(
							rowA.original.firstName || "",
							rowB.original.firstName || "",
						);
						if (byFirstName !== 0) return byFirstName;
						return vietnameseCollator.compare(
							rowA.original.middleName || "",
							rowB.original.middleName || "",
						);
					},
					cell: ({ getValue }) => (
						<span className="font-medium text-m3-on-surface">{getValue()}</span>
					),
				}),
				helper.display({
					id: "competency",
					header: "Năng lực",
					meta: {
						align: "center",
					},
					cell: ({ row }) => {
						const student = row.original;
						const isSaving = inlineSavingStudentId === student.id;
						const isTemp = student.id.startsWith("temp-");

						return (
							<div className="flex flex-col items-center gap-1">
								<div className="relative inline-flex items-center">
									<select
										value={student.competencyLevel || ""}
										disabled={readOnly || isSaving}
										onChange={(event) =>
											onCompetencyChange(
												student,
												event.target.value as CompetencyLevel,
											)
										}
										className={`cursor-pointer appearance-none rounded-full border border-m3-outline-variant/60 py-1 pl-3 pr-7 text-center text-xs font-semibold outline-none transition ${competencyBadgeClass(
											student.competencyLevel,
										)} ${isSaving ? "cursor-not-allowed opacity-70" : "hover:brightness-95 focus:ring-2 focus:ring-m3-primary/30"}`}
										title={
											isTemp
												? "Học sinh tạm, sẽ lưu cùng danh sách học sinh."
												: "Cập nhật nhanh năng lực"
										}
									>
										<option value="">--</option>
										{VALID_COMPETENCY_LEVELS.map((level) => (
											<option key={level} value={level}>
												{level}
											</option>
										))}
									</select>
									<Icon
										name="expand_more"
										size={16}
										className="pointer-events-none absolute right-1.5 text-m3-on-surface-variant"
									/>
								</div>
								{isSaving && (
									<span className="text-[10px] text-m3-on-surface-variant">
										Đang lưu...
									</span>
								)}
							</div>
						);
					},
				}),
				helper.accessor("notes", {
					header: "Ghi chú",
					cell: ({ getValue }) => (
						<div
							className="max-w-65 truncate text-m3-on-surface-variant"
							title={getValue() || ""}
						>
							{getValue()?.trim() || "--"}
						</div>
					),
				}),
				helper.display({
					id: "status",
					header: ({ header }) => (
						<SortableHeader header={header} title="Trạng thái" align="center" />
					),
					meta: {
						align: "center",
					},
					sortFn: (rowA, rowB) =>
						Number(isStudentActive(rowB.original)) -
						Number(isStudentActive(rowA.original)),
					cell: ({ row }) => {
						const isActive = isStudentActive(row.original);
						return (
							<span
								className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
									isActive
										? "bg-m3-secondary-container text-m3-on-secondary-container"
										: "bg-m3-error-container text-m3-on-error-container"
								}`}
							>
								<Icon
									name={isActive ? "check_circle" : "cancel"}
									variant="rounded"
									size={13}
								/>
								{isActive ? "Hoạt động" : "Ngừng"}
							</span>
						);
					},
				}),
				helper.display({
					id: "exam",
					header: "Exam",
					meta: {
						align: "center",
						className: "w-44 text-center",
					},
					cell: ({ row }) => {
						const student = row.original;
						const isSaving = inlineSavingStudentId === student.id;

						return (
							<div className="inline-flex items-center justify-center gap-2.5">
								<Switch
									checked={Boolean(student.thi)}
									onCheckedChange={() => onExamToggle(student)}
									disabled={readOnly || isSaving}
									ariaLabel={
										student.thi ? "Học sinh dự thi" : "Học sinh không dự thi"
									}
								/>
								<span className="min-w-26.25 select-none whitespace-nowrap text-xs font-medium text-m3-on-surface-variant">
									{student.thi ? "Taking Exam" : "Not Taking Exam"}
								</span>
							</div>
						);
					},
				}),
				helper.display({
					id: "actions",
					header: "Hành động",
					meta: {
						className: "w-40 text-center",
						align: "center",
					},
					cell: ({ row }) => {
						const student = row.original;
						const isTemp = student.id.startsWith("temp-");

						if (readOnly) {
							return (
								<span className="text-xs text-m3-on-surface-variant">
									Chỉ xem
								</span>
							);
						}

						return (
							<div className="inline-flex items-center gap-1.5">
								<TooltipBox
									tooltip={<PlainTooltip>Sửa học sinh</PlainTooltip>}
									placement="top"
								>
									<Button
										colorStyle="tonal"
										size="xs"
										onClick={() => onEdit(student)}
										disabled={isTemp}
										icon={<Icon name="edit" variant="rounded" size={14} />}
									>
										Sửa
									</Button>
								</TooltipBox>
								<TooltipBox
									tooltip={<PlainTooltip>Xóa học sinh</PlainTooltip>}
									placement="top"
								>
									<Button
										colorStyle="text"
										size="xs"
										className="text-m3-error hover:bg-m3-error-container/40"
										onClick={() => onDelete(student)}
										icon={<Icon name="delete" variant="rounded" size={14} />}
									>
										Xóa
									</Button>
								</TooltipBox>
							</div>
						);
					},
				}),
			]),
		[
			readOnly,
			inlineSavingStudentId,
			onCompetencyChange,
			onExamToggle,
			onEdit,
			onDelete,
		],
	);

	const table = useTable({
		features,
		columns,
		data: displayedStudents,
		getRowId: (row) => row.id,
	});

	return (
		<DataTable
			table={table}
			isLoading={isLoading}
			loadingAriaLabel="Đang tải dữ liệu học sinh"
			minWidthClassName="min-w-245 w-full text-xs sm:text-sm"
			headerSlot={
				<div className="flex items-center justify-between border-b border-m3-outline-variant/40 bg-m3-surface-container-high px-4 py-3">
					<span className="text-sm font-semibold text-m3-on-surface">
						Danh sách học sinh
					</span>
					<span className="text-xs text-m3-on-surface-variant">
						Bảng dữ liệu chi tiết theo từng học sinh
					</span>
				</div>
			}
			getRowClassName={(row) => {
				const isActive = isStudentActive(row.original);
				return isActive
					? ""
					: "bg-m3-error-container/15 hover:bg-m3-error-container/25";
			}}
			emptyState={
				<TableEmptyState
					icon="people_outline"
					title={
						totalStudentsCount === 0
							? "Chưa có học sinh nào"
							: "Không tìm thấy học sinh nào"
					}
					description={
						totalStudentsCount === 0
							? "Vui lòng nhập file Excel để bắt đầu."
							: "Không có học sinh nào khớp từ khóa tìm kiếm."
					}
				/>
			}
		/>
	);
};

export const StudentTable = memo(StudentTableComponent);
