import {
	Button,
	Card,
	Icon,
	ProgressIndicator,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { Assignment } from "../../../../types/assignment.types";
import {
	type PracticeCode,
	QUICK_SELECT_PRACTICE_OPTIONS,
} from "../../types/gradingFeature.types";

interface MultiAssignmentSelectorProps {
	autoAssignments: Assignment[];
	filteredAutoAssignments: Assignment[];
	multiAssignmentDraftIds: string[];
	multiAssignmentIds: string[];
	multiAssignmentQuery: string;
	isSelectingAssignments: boolean;
	hasPendingChanges: boolean;
	activeAutoAssignmentIdsByPractice: Record<PracticeCode, string[]>;
	onQueryChange: (query: string) => void;
	onToggleAssignment: (assignmentId: string) => void;
	onTogglePractice: (practiceCode: PracticeCode) => void;
	onSelectAll: () => void;
	onClear: () => void;
	onCommit: () => void;
}

export const MultiAssignmentSelector: React.FC<
	MultiAssignmentSelectorProps
> = ({
	autoAssignments,
	filteredAutoAssignments,
	multiAssignmentDraftIds,
	multiAssignmentIds,
	multiAssignmentQuery,
	isSelectingAssignments,
	hasPendingChanges,
	activeAutoAssignmentIdsByPractice,
	onQueryChange,
	onToggleAssignment,
	onTogglePractice,
	onSelectAll,
	onClear,
	onCommit,
}) => {
	return (
		<div className="mb-6 p-5 bg-m3-surface-container-high rounded-3xl shadow-xs border border-m3-outline-variant/20">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h4 className="text-base font-bold text-m3-on-surface">
						Chọn các bài tập cần chấm trong ma trận
					</h4>
					<p className="text-xs text-m3-on-surface-variant mt-1">
						Đang chọn {multiAssignmentDraftIds.length}/{autoAssignments.length}{" "}
						bài tự động
					</p>
					<p className="text-xs text-m3-primary mt-1 font-semibold">
						Đã chốt {multiAssignmentIds.length} bài để hiển thị trong bảng
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						colorStyle="tonal"
						onClick={onSelectAll}
						disabled={isSelectingAssignments || autoAssignments.length === 0}
						className="text-xs"
					>
						Chọn tất cả
					</Button>
					<Button
						type="button"
						colorStyle="tonal"
						onClick={onClear}
						disabled={
							isSelectingAssignments || multiAssignmentDraftIds.length === 0
						}
						className="text-xs"
					>
						Bỏ chọn
					</Button>
					<Button
						type="button"
						colorStyle="filled"
						onClick={onCommit}
						disabled={isSelectingAssignments || !hasPendingChanges}
						className="text-xs"
					>
						<Icon name="check" className="text-sm mr-1.5" />
						Chốt danh sách
					</Button>
				</div>
			</div>

			<div className="mt-4">
				<TextField
					variant="outlined"
					placeholder="Tìm theo tên bài tập, mô tả, đường dẫn API..."
					value={multiAssignmentQuery}
					onChange={(val) => onQueryChange(val)}
					leadingIcon={<Icon name="search" />}
					fullWidth
				/>
			</div>

			<div className="mt-4">
				<p className="mb-2 text-xs font-semibold text-m3-on-surface-variant">
					Chọn nhanh theo phần
				</p>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
					{QUICK_SELECT_PRACTICE_OPTIONS.map((practice) => {
						const practiceCode = practice.code as PracticeCode;
						const practiceAssignmentIds =
							activeAutoAssignmentIdsByPractice[practiceCode] || [];
						const selectedCount = practiceAssignmentIds.filter((id) =>
							multiAssignmentDraftIds.includes(id),
						).length;
						const totalCount = practiceAssignmentIds.length;
						const hasAssignments = totalCount > 0;
						const isAllSelected =
							hasAssignments && selectedCount === totalCount;
						const isPartiallySelected = selectedCount > 0 && !isAllSelected;

						return (
							<button
								key={`quick-select-${practice.code}`}
								type="button"
								onClick={() => onTogglePractice(practiceCode)}
								disabled={isSelectingAssignments || !hasAssignments}
								className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-left text-xs transition ${
									isAllSelected
										? "border-m3-primary bg-m3-primary-container text-m3-on-primary-container font-semibold shadow-2xs"
										: isPartiallySelected
											? "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200 font-semibold"
											: "border-m3-outline-variant/60 bg-m3-surface text-m3-on-surface hover:bg-m3-surface-container-high"
								} ${isSelectingAssignments || !hasAssignments ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
							>
								<span className="font-semibold">{practice.label}</span>
								<span className="rounded-full bg-m3-surface-container px-2 py-0.5 text-[11px] font-medium text-m3-on-surface">
									{selectedCount}/{totalCount}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{isSelectingAssignments && (
				<div className="mt-3 text-xs text-m3-primary flex items-center gap-1.5 font-medium">
					<ProgressIndicator
						variant="circular"
						shape="wavy"
						size={14}
						aria-label="Đang chốt..."
					/>
					Đang nạp bảng điểm của danh sách bài đã chọn...
				</div>
			)}
			{!isSelectingAssignments && hasPendingChanges && (
				<div className="mt-3 text-xs text-amber-700 dark:text-amber-300 font-medium">
					Bạn vừa thay đổi danh sách chọn. Hãy bấm{" "}
					<span className="font-bold underline">Chốt danh sách</span> để cập
					nhật vào bảng ma trận.
				</div>
			)}

			<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
				{filteredAutoAssignments.map((assignment) => {
					const isSelected = multiAssignmentDraftIds.includes(assignment.id);
					return (
						<Card
							key={assignment.id}
							variant="outlined"
							role="button"
							tabIndex={isSelectingAssignments ? -1 : 0}
							onClick={() =>
								!isSelectingAssignments && onToggleAssignment(assignment.id)
							}
							onKeyDown={(e) => {
								if (
									!isSelectingAssignments &&
									(e.key === "Enter" || e.key === " ")
								) {
									e.preventDefault();
									onToggleAssignment(assignment.id);
								}
							}}
							className={`text-left rounded-2xl hover:rounded-xl border p-3.5 transition-all duration-200 ${
								isSelected
									? "border-m3-primary/60 bg-m3-primary/10 text-m3-on-surface"
									: "border-m3-outline-variant/60 bg-m3-surface hover:border-m3-primary/40 hover:bg-m3-surface-container-high"
							} ${isSelectingAssignments ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-sm font-semibold text-m3-on-surface truncate">
										{assignment.name}
									</p>
									{assignment.description && (
										<p className="text-xs text-m3-on-surface-variant mt-1 line-clamp-1">
											{assignment.description}
										</p>
									)}
								</div>
								<div className="flex flex-col items-end gap-1 shrink-0">
									<span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 font-medium">
										/{assignment.maxScore}
									</span>
									{isSelected && (
										<span className="inline-flex items-center gap-1 text-[11px] text-m3-primary font-semibold">
											<Icon name="check" className="text-sm" />
											Đã chọn
										</span>
									)}
								</div>
							</div>
						</Card>
					);
				})}
			</div>
		</div>
	);
};
