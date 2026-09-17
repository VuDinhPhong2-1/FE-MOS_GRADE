import { Button, Checkbox, Chip, Icon, Switch } from "@bug-on/m3-expressive";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import type { Assignment } from "../../../../types/assignment.types";
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
	onOpenEdit: (assignment: Assignment) => void;
	onDelete: (assignment: Assignment) => void;
	onBack: () => void;
}

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

	return (
		<div className="w-full max-w-7xl mx-auto space-y-6 pb-28">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/30 shadow-xs">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2.5">
						<div className="h-10 w-10 rounded-2xl bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center shadow-2xs">
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
			</div>

			{/* Filter Options Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/20 shadow-xs">
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
							Tìm thấy <strong>{filteredAssignments.length}</strong> bài phù hợp
						</span>
						<Button
							type="button"
							colorStyle="text"
							onClick={handleCloseSearch}
							className="h-7 text-xs px-2"
						>
							Xóa tìm kiếm
						</Button>
					</div>
				)}
			</div>

			{/* Table Content Card */}
			<div className="rounded-3xl bg-m3-surface-container-low overflow-hidden shadow-xs border border-m3-outline-variant/30">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-m3-outline-variant/30">
						<thead className="bg-m3-surface-container-high">
							<tr className="h-12 border-b border-m3-outline-variant/60 bg-m3-surface-container-high">
								<th className="h-12 px-4 py-3.5 text-center text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider w-14 align-middle">
									<Checkbox
										aria-label="Chọn tất cả bài tập đang dùng"
										checked={isAllManageActiveSelected}
										onCheckedChange={(checked) =>
											checked ? onSelectAllManage() : onClearManage()
										}
										disabled={
											assignmentSubmitLoading ||
											manageableActiveAssignments.length === 0
										}
									/>
								</th>
								<th className="h-12 px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider align-middle">
									Tên bài tập
								</th>
								<th className="h-12 px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider align-middle">
									Loại chấm
								</th>
								<th className="h-12 px-4 py-3.5 text-left text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider align-middle">
									Endpoint
								</th>
								<th className="h-12 px-4 py-3.5 text-center text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider align-middle">
									Điểm tối đa
								</th>
								<th className="h-12 px-4 py-3.5 text-center text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider align-middle">
									Trạng thái
								</th>
								<th className="h-12 px-4 py-3.5 text-center text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider align-middle">
									Hành động
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-m3-outline-variant/20 bg-m3-surface-container">
							{filteredAssignments.map((assignment, index) => (
								<tr
									key={assignment.id}
									className={`transition-colors ${
										index % 2 === 1
											? "bg-m3-surface-container-high/25"
											: "bg-transparent"
									} hover:bg-m3-surface-container-high/40`}
								>
									<td
										className="px-4 py-3.5 text-center align-middle"
										title={!assignment.isActive ? "Bài tập đã ẩn" : undefined}
									>
										<Checkbox
											aria-label={`Chọn bài tập ${assignment.name}`}
											checked={manageSelectedAssignmentIds.includes(
												assignment.id,
											)}
											onCheckedChange={() =>
												onToggleSelectAssignment(assignment)
											}
											disabled={assignmentSubmitLoading || !assignment.isActive}
										/>
									</td>
									<td className="px-4 py-3.5 text-sm text-m3-on-surface align-middle">
										<div className="font-semibold">{assignment.name}</div>
										{assignment.description && (
											<div className="text-xs text-m3-on-surface-variant mt-0.5 max-w-md">
												{assignment.description}
											</div>
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
									</td>
									<td className="px-4 py-3.5 text-xs text-m3-on-surface-variant align-middle">
										<span
											className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium ${
												assignment.gradingType === "auto"
													? "bg-m3-primary/10 text-m3-primary"
													: "bg-m3-secondary/10 text-m3-secondary"
											}`}
										>
											{assignment.gradingType === "auto"
												? "Tự động"
												: "Thủ công"}
										</span>
									</td>
									<td className="px-4 py-3.5 text-xs text-m3-on-surface-variant/70 font-mono align-middle">
										{assignment.gradingApiEndpoint || "-"}
									</td>
									<td className="px-4 py-3.5 text-sm text-center text-m3-on-surface font-bold align-middle">
										{assignment.maxScore}
									</td>
									<td className="px-4 py-3.5 text-center align-middle">
										<div className="flex flex-col items-center gap-1">
											<span
												className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
													assignment.isActive
														? "bg-m3-primary/10 text-m3-primary"
														: "bg-m3-error/15 text-m3-error"
												}`}
											>
												{assignment.isActive ? "Đang dùng" : "Đã ẩn"}
											</span>
											{assignment.isPublishable === false && (
												<span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
													Chưa publish
												</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3.5 text-center align-middle">
										<div className="inline-flex gap-1.5">
											<Button
												type="button"
												colorStyle="tonal"
												onClick={() => onOpenEdit(assignment)}
												className="h-8 px-2.5 text-xs"
											>
												<Icon name="edit" className="text-xs mr-1" />
												Sửa
											</Button>
											<Button
												type="button"
												colorStyle="tonal"
												onClick={() => onDelete(assignment)}
												disabled={assignmentSubmitLoading}
												className="h-8 px-2.5 text-xs text-m3-error hover:bg-m3-error/10"
											>
												<Icon
													name="delete"
													className="text-xs mr-1 text-m3-error"
												/>
												Xóa
											</Button>
										</div>
									</td>
								</tr>
							))}
							{filteredAssignments.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-12 text-center text-sm text-m3-on-surface-variant"
									>
										{searchQuery
											? "Không tìm thấy bài tập phù hợp với từ khóa."
											: "Chưa có bài tập nào trong lớp này."}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

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
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
				isSearchActive={isSearchActive}
				onOpenSearch={handleOpenSearch}
				onCloseSearch={handleCloseSearch}
			/>
		</div>
	);
};
