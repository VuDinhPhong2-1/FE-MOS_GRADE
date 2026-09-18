import {
	ButtonDistribute,
	Card,
	Checkbox,
	Chip,
	FAST_SPATIAL_SPRING,
	Icon,
	IconButton,
	PlainTooltip,
	Switch,
	TooltipBox,
} from "@bug-on/m3-expressive";
import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { DataTable, TableEmptyState } from "../../../../components/data-table";
import type { Assignment } from "../../../../types/assignment.types";
import { cn } from "../../../../utils/utils";
import { ManageAssignmentToolbar } from "./ManageAssignmentToolbar";

interface ManageAssignmentsPanelProps {
	assignments: Assignment[];
	manageableActiveAssignments: Assignment[];
	manageSelectedAssignmentIds: string[];
	isAllManageActiveSelected: boolean;
	showInactiveAssignments: boolean;
	assignmentSubmitLoading: boolean;
	onToggleShowInactive: (show: boolean) => void;
	onToggleSelectAssignment: (assignment: Assignment) => void;
	onSelectAllManage: () => void;
	onClearManage: () => void;
	onDeactivateSelected: () => void;
	onDeleteSelected: () => void;
	onOpenEdit: (assignment: Assignment) => void;
	onDelete: (assignment: Assignment) => void;
	onBack: () => void;
}

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Assignment>();

export const ManageAssignmentsPanel: React.FC<ManageAssignmentsPanelProps> = ({
	assignments,
	manageableActiveAssignments,
	manageSelectedAssignmentIds,
	isAllManageActiveSelected,
	showInactiveAssignments,
	assignmentSubmitLoading,
	onToggleShowInactive,
	onToggleSelectAssignment,
	onSelectAllManage,
	onClearManage,
	onDeactivateSelected,
	onDeleteSelected,
	onOpenEdit,
	onDelete,
	onBack,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);

	const handleOpenSearch = useCallback(() => setIsSearchActive(true), []);
	const handleCloseSearch = useCallback(() => {
		setIsSearchActive(false);
		setSearchQuery("");
	}, []);

	// Thống kê số lượng
	const totalCount = assignments.length;
	const activeCount = useMemo(
		() => assignments.filter((a) => a.isActive).length,
		[assignments],
	);
	const inactiveCount = totalCount - activeCount;

	// Lọc danh sách bài tập theo từ khóa tìm kiếm
	const filteredAssignments = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return assignments;

		return assignments.filter((a) => {
			const nameMatch = a.name.toLowerCase().includes(q);
			const descMatch = (a.description || "").toLowerCase().includes(q);
			const subjectMatch = a.subject.toLowerCase().includes(q);
			const endpointMatch = (a.gradingApiEndpoint || "")
				.toLowerCase()
				.includes(q);
			const examTypeMatch = a.examType.toLowerCase().includes(q);

			return (
				nameMatch || descMatch || subjectMatch || endpointMatch || examTypeMatch
			);
		});
	}, [assignments, searchQuery]);

	const columns = useMemo(
		() =>
			helper.columns([
				helper.display({
					id: "select",
					header: () => (
						<div className="flex items-center justify-center">
							<Checkbox
								aria-label={
									showInactiveAssignments
										? "Chọn tất cả bài tập"
										: "Chọn tất cả bài tập đang dùng"
								}
								checked={isAllManageActiveSelected}
								onCheckedChange={(checked) =>
									checked ? onSelectAllManage() : onClearManage()
								}
								disabled={
									assignmentSubmitLoading ||
									manageableActiveAssignments.length === 0
								}
							/>
						</div>
					),
					meta: {
						className: "w-14 text-center",
						align: "center",
					},
					cell: ({ row }) => {
						const assignment = row.original;
						return (
							<div
								className="flex items-center justify-center"
								title={!assignment.isActive ? "Bài tập đã ẩn" : undefined}
							>
								<Checkbox
									aria-label={`Chọn bài tập ${assignment.name}`}
									checked={manageSelectedAssignmentIds.includes(assignment.id)}
									onCheckedChange={() => onToggleSelectAssignment(assignment)}
									disabled={
										assignmentSubmitLoading ||
										(!showInactiveAssignments && !assignment.isActive)
									}
								/>
							</div>
						);
					},
				}),
				helper.accessor("name", {
					header: "Tên bài tập",
					cell: ({ row }) => {
						const assignment = row.original;
						return (
							<div className="flex flex-col">
								<span className="font-semibold text-m3-on-surface">
									{assignment.name}
								</span>
								{assignment.description && (
									<span className="text-xs text-m3-on-surface-variant mt-0.5 line-clamp-2 max-w-md">
										{assignment.description}
									</span>
								)}
								<div className="text-[11px] text-m3-on-surface-variant/70 mt-1 flex flex-wrap items-center gap-1.5">
									<span className="font-semibold text-m3-primary">
										{assignment.examType.toUpperCase()}
									</span>
									<span>•</span>
									<span>{assignment.subject.toUpperCase()}</span>
									{assignment.isLockedForPublication && (
										<>
											<span>•</span>
											<span className="text-amber-700 dark:text-amber-300">
												Đã dùng tạo lịch thi
											</span>
										</>
									)}
								</div>
								{assignment.isPublishable === false && (
									<div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 font-medium">
										{assignment.publishBlockReason ||
											"Chưa đủ điều kiện để tạo lịch thi."}
									</div>
								)}
							</div>
						);
					},
				}),
				helper.accessor("gradingType", {
					header: "Loại chấm",
					meta: {
						className: "w-32",
						align: "left",
					},
					cell: ({ getValue }) => {
						const type = getValue();
						const isAuto = type === "auto";
						return (
							<Chip
								variant="assist"
								label={isAuto ? "Tự động" : "Thủ công"}
								leadingIcon={
									<Icon
										name={isAuto ? "smart_toy" : "draw"}
										size={16}
										className={isAuto ? "text-m3-primary" : "text-m3-secondary"}
									/>
								}
								className="pointer-events-none h-6 px-2.5 text-xs font-medium"
							/>
						);
					},
				}),
				helper.accessor("gradingApiEndpoint", {
					header: "Endpoint",
					meta: {
						className: "w-44 text-xs font-mono",
						align: "left",
					},
					cell: ({ getValue }) => (
						<span className="font-mono text-xs text-m3-on-surface-variant/80">
							{getValue() || "-"}
						</span>
					),
				}),
				helper.accessor("maxScore", {
					header: "Điểm tối đa",
					meta: {
						className: "w-28 text-center",
						align: "center",
					},
					cell: ({ getValue }) => (
						<span className="text-sm font-bold text-m3-on-surface">
							{getValue()}
						</span>
					),
				}),
				helper.display({
					id: "status",
					header: "Trạng thái",
					meta: {
						className: "w-36 text-center",
						align: "center",
					},
					cell: ({ row }) => {
						const assignment = row.original;
						return (
							<div className="flex flex-col items-center gap-1">
								<Chip
									variant="assist"
									label={assignment.isActive ? "Đang dùng" : "Đã ẩn"}
									leadingIcon={
										<Icon
											name={assignment.isActive ? "check_circle" : "cancel"}
											size={16}
											className={
												assignment.isActive
													? "text-m3-primary"
													: "text-m3-error"
											}
										/>
									}
									className={cn(
										"pointer-events-none h-6 px-2.5 text-xs font-semibold",
										!assignment.isActive && "text-m3-error",
									)}
								/>
								{assignment.isPublishable === false && (
									<span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
										Chưa publish
									</span>
								)}
							</div>
						);
					},
				}),
				helper.display({
					id: "actions",
					header: "Hành động",
					meta: {
						className: "w-32 text-center",
						align: "center",
					},
					cell: ({ row }) => {
						const assignment = row.original;
						return (
							<div
								role="toolbar"
								aria-label="Thao tác"
								className="inline-flex items-center justify-center"
							>
								<ButtonDistribute
									mode="dynamic"
									size="sm"
									weights={[1, 1]}
									gap={4}
									expandRatio={0.1}
								>
									<TooltipBox
										tooltip={<PlainTooltip>Sửa bài tập</PlainTooltip>}
										placement="top"
									>
										<IconButton
											size="sm"
											onClick={() => onOpenEdit(assignment)}
											aria-label="Sửa bài tập"
										>
											<Icon name="edit" size={20} />
										</IconButton>
									</TooltipBox>
									<TooltipBox
										tooltip={<PlainTooltip>Xóa bài tập</PlainTooltip>}
										placement="top"
									>
										<IconButton
											size="sm"
											onClick={() => onDelete(assignment)}
											disabled={assignmentSubmitLoading}
											className="text-m3-error hover:bg-m3-error/10"
											aria-label="Xóa bài tập"
										>
											<Icon name="delete" size={20} className="text-m3-error" />
										</IconButton>
									</TooltipBox>
								</ButtonDistribute>
							</div>
						);
					},
				}),
			]),
		[
			isAllManageActiveSelected,
			onSelectAllManage,
			onClearManage,
			assignmentSubmitLoading,
			manageableActiveAssignments.length,
			manageSelectedAssignmentIds,
			onToggleSelectAssignment,
			onOpenEdit,
			onDelete,
			showInactiveAssignments,
		],
	);

	const table = useTable({
		features,
		columns,
		data: filteredAssignments,
		getRowId: (row) => row.id,
	});

	return (
		<div className="space-y-5">
			{/* Page Header */}
			<Card
				variant="filled"
				className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-m3-surface-container-low border-none shadow-none"
			>
				<div className="space-y-1.5">
					<div className="flex items-center gap-2.5">
						<div className="h-10 w-10 rounded-2xl bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center">
							<Icon name="tune" className="text-xl" />
						</div>
						<h3 className="text-2xl font-bold text-m3-on-surface font-md3-expressive">
							Quản lý bài tập
						</h3>
					</div>
					<p className="text-xs sm:text-sm text-m3-on-surface-variant max-w-2xl">
						Xem danh sách bài tập của lớp, chỉnh sửa điểm tối đa, cấu hình trạng
						thái hoạt động hoặc xóa bài tập không còn sử dụng.
					</p>
				</div>

				{/* Stats Chips */}
				<div className="flex flex-wrap items-center gap-2">
					<Chip
						variant="assist"
						leadingIcon={<Icon name="folder" size={16} />}
						label={`Tổng ${totalCount} bài`}
						className="h-7! px-3! rounded-full pointer-events-none text-xs font-semibold"
					/>
					<Chip
						variant="assist"
						leadingIcon={
							<Icon name="check_circle" size={16} className="text-m3-primary" />
						}
						label={`Đang dùng ${activeCount}`}
						className="h-7! px-3! rounded-full pointer-events-none text-xs font-semibold"
					/>
					{inactiveCount > 0 && (
						<Chip
							variant="assist"
							leadingIcon={
								<Icon
									name="visibility_off"
									size={16}
									className="text-m3-outline"
								/>
							}
							label={`Đã ẩn ${inactiveCount}`}
							className="h-7! px-3! rounded-full pointer-events-none text-xs font-semibold text-m3-outline"
						/>
					)}
				</div>
			</Card>

			{/* Filter Options Bar with smooth spring animation */}
			<AnimatePresence initial={false}>
				{!isSearchActive && (
					<motion.div
						key="manage-assignment-filter-bar"
						initial={{ opacity: 0, height: 0, scale: 0.98 }}
						animate={{ opacity: 1, height: "auto", scale: 1 }}
						exit={{ opacity: 0, height: 0, scale: 0.98 }}
						transition={FAST_SPATIAL_SPRING}
						className="overflow-hidden"
					>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-m3-surface-container-low border-none shadow-none">
							<div className="flex items-center gap-3">
								<Switch
									checked={showInactiveAssignments}
									onCheckedChange={onToggleShowInactive}
									label="Hiển thị bài tập đã ẩn"
								/>
								<span className="text-xs text-m3-on-surface-variant hidden md:inline">
									(Khi tắt, chỉ hiển thị bài tập đang hoạt động)
								</span>
							</div>

							{searchQuery && (
								<div className="flex items-center gap-2 text-xs text-m3-on-surface-variant">
									<span>
										Tìm thấy <strong>{filteredAssignments.length}</strong> bài
										phù hợp
									</span>
									<IconButton
										size="sm"
										colorStyle="standard"
										onClick={handleCloseSearch}
										aria-label="Xóa tìm kiếm"
									>
										<Icon name="close" size={18} />
									</IconButton>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Data Table Content */}
			<DataTable
				table={table}
				className="shadow-none border-none"
				minWidthClassName="min-w-220 w-full"
				headerSlot={
					<div className="flex items-center justify-between px-6 py-4 bg-m3-surface-container-high border-b border-m3-outline-variant/30">
						<div className="flex items-center gap-2">
							<Icon name="assignment" className="text-m3-primary" size={20} />
							<span className="text-sm font-bold text-m3-on-surface">
								Danh sách bài tập
							</span>
							<Chip
								variant="assist"
								label={`${filteredAssignments.length} bài`}
								className="h-6! px-2! rounded-full pointer-events-none text-xs font-semibold"
							/>
						</div>
						<span className="text-xs text-m3-on-surface-variant hidden sm:inline">
							Cấu hình điểm số và trạng thái hoạt động
						</span>
					</div>
				}
				getRowClassName={(row) =>
					!row.original.isActive
						? "opacity-65 bg-m3-surface-container-high/15"
						: ""
				}
				emptyState={
					<TableEmptyState
						icon={searchQuery ? "search_off" : "folder_open"}
						title={
							searchQuery
								? "Không tìm thấy bài tập phù hợp"
								: "Chưa có bài tập nào"
						}
						description={
							searchQuery
								? `Không tìm thấy bài tập nào khớp với từ khóa "${searchQuery}".`
								: "Chưa có bài tập nào trong lớp này."
						}
					/>
				}
			/>

			{/* Floating Action Toolbar */}
			<ManageAssignmentToolbar
				onBack={onBack}
				selectedCount={manageSelectedAssignmentIds.length}
				activeCount={manageableActiveAssignments.length}
				isAllSelected={isAllManageActiveSelected}
				isLoading={assignmentSubmitLoading}
				onSelectAll={onSelectAllManage}
				onClear={onClearManage}
				onDeactivateSelected={onDeactivateSelected}
				onDeleteSelected={onDeleteSelected}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
				isSearchActive={isSearchActive}
				onOpenSearch={handleOpenSearch}
				onCloseSearch={handleCloseSearch}
				onSearchActiveChange={setIsSearchActive}
			/>
		</div>
	);
};
