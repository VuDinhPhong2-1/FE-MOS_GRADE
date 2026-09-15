import {
	Button,
	ButtonDistribute,
	Chip,
	Icon,
	IconButton,
} from "@bug-on/m3-expressive";
import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { memo, useMemo } from "react";
import { DataTable, TableEmptyState } from "../../components/data-table";
import type { School } from "../../types";
import type { SchoolTableProps } from "./types";

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, School>();

export const SchoolTable = memo(function SchoolTable({
	schools,
	isLoading,
	canDeleteSchool,
	isDeleting,
	schoolToDelete,
	onSelectSchool,
	onEditSchool,
	onDeleteSchool,
	onOpenAddModal,
	hasActiveFilters,
	onResetFilters,
}: SchoolTableProps) {
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
					cell: ({ row }) => row.index + 1,
				}),
				helper.accessor("code", {
					header: "Mã trường",
					meta: {
						className: "w-36",
					},
					cell: ({ getValue }) => (
						<Chip
							variant="assist"
							label={getValue() || "---"}
							className="pointer-events-none h-6 px-2.5 text-xs font-bold"
						/>
					),
				}),
				helper.accessor("name", {
					header: "Tên trường",
					cell: ({ row }) => (
						<div className="flex flex-col">
							<span className="font-bold text-m3-on-surface transition-colors group-hover:text-m3-primary">
								{row.original.name}
							</span>
							{row.original.address && (
								<span className="line-clamp-1 text-xs text-m3-on-surface-variant">
									{row.original.address}
								</span>
							)}
						</div>
					),
				}),
				helper.display({
					id: "actions",
					header: "Hành động",
					meta: {
						className: "w-36 text-center",
						align: "center",
					},
					cell: ({ row }) => (
						<ButtonDistribute
							mode="dynamic"
							size="sm"
							weights={[2, 1]}
							gap={4}
							expandRatio={0.1}
						>
							<IconButton
								type="button"
								size="sm"
								colorStyle="standard"
								disabled={isDeleting}
								onClick={(e) => {
									e.stopPropagation();
									onEditSchool(row.original);
								}}
								title="Chỉnh sửa trường"
								aria-label={`Chỉnh sửa trường ${row.original.name}`}
							>
								<Icon name="edit" className="text-base" />
							</IconButton>
							{canDeleteSchool && (
								<IconButton
									type="button"
									size="sm"
									colorStyle="standard"
									disabled={isDeleting}
									loading={isDeleting && schoolToDelete?.id === row.original.id}
									onClick={(e) => {
										e.stopPropagation();
										onDeleteSchool(row.original);
									}}
									className="text-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container"
									title="Xóa trường"
									aria-label={`Xóa trường ${row.original.name}`}
								>
									<Icon name="delete" className="text-base" />
								</IconButton>
							)}
						</ButtonDistribute>
					),
				}),
			]),
		[canDeleteSchool, isDeleting, schoolToDelete, onEditSchool, onDeleteSchool],
	);

	const table = useTable({
		features,
		columns,
		data: schools,
		getRowId: (row) => row.id,
	});

	return (
		<DataTable
			table={table}
			isLoading={isLoading}
			loadingAriaLabel="Đang tải dữ liệu trường học"
			minWidthClassName="min-w-140 w-full"
			onRowClick={(row) => onSelectSchool(row.original)}
			getRowClassName={() => "group"}
			emptyState={
				<TableEmptyState
					icon={hasActiveFilters ? "search_off" : "domain_disabled"}
					title={
						hasActiveFilters
							? "Không tìm thấy trường nào"
							: "Chưa có trường nào"
					}
					description={
						hasActiveFilters
							? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái."
							: 'Hãy bấm nút "Thêm trường" để bắt đầu thiết lập cơ sở đầu tiên.'
					}
					action={
						hasActiveFilters ? (
							<Button
								colorStyle="tonal"
								size="sm"
								icon={<Icon name="filter_alt_off" className="text-base" />}
								onClick={onResetFilters}
							>
								Đặt lại bộ lọc
							</Button>
						) : (
							<Button
								colorStyle="filled"
								size="sm"
								icon={<Icon name="add" className="text-base" />}
								onClick={onOpenAddModal}
							>
								Thêm trường mới
							</Button>
						)
					}
				/>
			}
		/>
	);
});
