import {
	Button,
	Checkbox,
	Icon,
	ProgressIndicator,
	Switch,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { Assignment } from "../../../../types/assignment.types";

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
	return (
		<div className="flex-1 overflow-y-auto p-6 bg-m3-surface">
			<Button
				type="button"
				colorStyle="text"
				onClick={onBack}
				className="mb-4 text-sm"
			>
				<Icon name="arrow_back" className="mr-1.5 text-base" /> Quay lại
			</Button>

			<div className="mb-3 flex items-center justify-between rounded-2xl bg-m3-surface-container-high px-4 py-3 shadow-xs border border-m3-outline-variant/20">
				<Switch
					checked={showInactiveAssignments}
					onCheckedChange={onToggleShowInactive}
					label="Hiển thị bài tập đã ẩn"
				/>
				<span className="text-xs text-m3-on-surface-variant/80">
					Khi tắt, danh sách chỉ hiển thị bài tập đang hoạt động.
				</span>
			</div>

			<div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-m3-surface-container px-4 py-3 shadow-xs border border-m3-outline-variant/20">
				<span className="text-sm font-semibold text-m3-on-surface">
					Đã chọn {manageSelectedAssignmentIds.length}/
					{manageableActiveAssignments.length} bài đang dùng
				</span>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						colorStyle="tonal"
						onClick={onSelectAllManage}
						disabled={
							assignmentSubmitLoading ||
							manageableActiveAssignments.length === 0 ||
							isAllManageActiveSelected
						}
						className="text-xs"
					>
						Chọn tất cả
					</Button>
					<Button
						type="button"
						colorStyle="tonal"
						onClick={onClearManage}
						disabled={
							assignmentSubmitLoading ||
							manageSelectedAssignmentIds.length === 0
						}
						className="text-xs"
					>
						Bỏ chọn
					</Button>
					<Button
						type="button"
						colorStyle="tonal"
						onClick={onDeactivateSelected}
						disabled={
							assignmentSubmitLoading ||
							manageSelectedAssignmentIds.length === 0
						}
						className="text-xs text-amber-900 dark:text-amber-100"
					>
						{assignmentSubmitLoading ? (
							<ProgressIndicator
								variant="circular"
								shape="wavy"
								size={14}
								aria-label="Đang xử lý..."
							/>
						) : (
							<Icon name="cancel" className="text-sm mr-1" />
						)}
						Bỏ hoạt động đã chọn
					</Button>
				</div>
			</div>

			<div className="rounded-3xl bg-m3-surface overflow-hidden shadow-xs border border-m3-outline-variant/30">
				<table className="min-w-full divide-y divide-m3-outline-variant/30">
					<thead className="bg-m3-surface-container-low">
						<tr>
							<th className="px-3 py-3 text-center text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider w-12">
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
							<th className="px-3 py-3 text-left text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								Tên bài tập
							</th>
							<th className="px-3 py-3 text-left text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								Loại
							</th>
							<th className="px-3 py-3 text-left text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								Endpoint
							</th>
							<th className="px-3 py-3 text-center text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								Điểm tối đa
							</th>
							<th className="px-3 py-3 text-center text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								Trạng thái
							</th>
							<th className="px-3 py-3 text-center text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								Hành động
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-m3-outline-variant/20 bg-m3-surface">
						{assignments.map((assignment) => (
							<tr
								key={assignment.id}
								className="hover:bg-m3-surface-container-high/40 transition-colors"
							>
								<td
									className="px-3 py-3 text-center"
									title={!assignment.isActive ? "Bài tập đã ẩn" : undefined}
								>
									<Checkbox
										aria-label={`Chọn bài tập ${assignment.name}`}
										checked={manageSelectedAssignmentIds.includes(
											assignment.id,
										)}
										onCheckedChange={() => onToggleSelectAssignment(assignment)}
										disabled={assignmentSubmitLoading || !assignment.isActive}
									/>
								</td>
								<td className="px-3 py-3 text-sm text-m3-on-surface">
									<div className="font-semibold">{assignment.name}</div>
									{assignment.description && (
										<div className="text-xs text-m3-on-surface-variant mt-0.5">
											{assignment.description}
										</div>
									)}
									<div className="text-[11px] text-m3-on-surface-variant/70 mt-0.5">
										{assignment.examType.toUpperCase()} •{" "}
										{assignment.subject.toUpperCase()}
										{assignment.isLockedForPublication
											? " • Đã dùng để tạo lịch thi"
											: ""}
									</div>
									{assignment.isPublishable === false && (
										<div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">
											{assignment.publishBlockReason ||
												"Chưa đủ điều kiện để tạo lịch thi."}
										</div>
									)}
								</td>
								<td className="px-3 py-3 text-sm text-m3-on-surface-variant">
									{assignment.gradingType === "auto" ? "Tự động" : "Thủ công"}
								</td>
								<td className="px-3 py-3 text-xs text-m3-on-surface-variant/70 font-mono">
									{assignment.gradingApiEndpoint || "-"}
								</td>
								<td className="px-3 py-3 text-sm text-center text-m3-on-surface font-semibold">
									{assignment.maxScore}
								</td>
								<td className="px-3 py-3 text-center">
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
												Không publish được
											</span>
										)}
									</div>
								</td>
								<td className="px-3 py-3 text-center">
									<div className="inline-flex gap-2">
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
						{assignments.length === 0 && (
							<tr>
								<td
									colSpan={7}
									className="px-3 py-8 text-center text-sm text-m3-on-surface-variant"
								>
									Chưa có bài tập nào trong lớp này.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
