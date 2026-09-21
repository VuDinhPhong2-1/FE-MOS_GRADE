import { Card, Chip, Icon, LoadingIndicator } from "@bug-on/m3-expressive";
import type React from "react";
import type { Assignment } from "../../../../types/assignment.types";
import {
	type PracticeCode,
	QUICK_SELECT_PRACTICE_OPTIONS,
} from "../../types/gradingFeature.types";

interface MultiAssignmentSelectorProps {
	filteredAutoAssignments: Assignment[];
	multiAssignmentDraftIds: string[];
	isSelectingAssignments: boolean;
	activeAutoAssignmentIdsByPractice: Record<PracticeCode, string[]>;
	onToggleAssignment: (assignmentId: string) => void;
	onTogglePractice: (practiceCode: PracticeCode) => void;
}

export const MultiAssignmentSelector: React.FC<
	MultiAssignmentSelectorProps
> = ({
	filteredAutoAssignments,
	multiAssignmentDraftIds,
	isSelectingAssignments,
	activeAutoAssignmentIdsByPractice,
	onToggleAssignment,
	onTogglePractice,
}) => {
	return (
		<div className="mb-6 p-5 bg-m3-surface-container-high rounded-3xl">
			{/* Quick select by practice section */}
			<div>
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
							<Chip
								key={`quick-select-${practice.code}`}
								variant="filter"
								selected={isAllSelected}
								disabled={isSelectingAssignments || !hasAssignments}
								onClick={() => onTogglePractice(practiceCode)}
								label={
									<span className="flex items-center justify-between w-full gap-2">
										<span className="font-semibold">{practice.label}</span>
										<span className="rounded-full bg-m3-surface-container-high/70 px-2 py-0.5 text-[11px] font-medium text-m3-on-surface">
											{selectedCount}/{totalCount}
										</span>
									</span>
								}
								className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 h-auto text-left text-xs transition border-none shadow-none w-full ${
									isAllSelected
										? "bg-m3-primary-container text-m3-on-primary-container font-semibold"
										: isPartiallySelected
											? "bg-m3-secondary-container/60 text-m3-on-secondary-container font-semibold"
											: "bg-m3-surface text-m3-on-surface hover:bg-m3-surface-container"
								} ${isSelectingAssignments || !hasAssignments ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
							/>
						);
					})}
				</div>
			</div>

			{isSelectingAssignments && (
				<div className="mt-3 text-xs text-m3-primary flex items-center gap-1.5 font-medium">
					<LoadingIndicator size={14} aria-label="Đang chốt..." />
					Đang nạp bảng điểm của danh sách bài đã chọn...
				</div>
			)}

			{/* Assignment card list */}
			<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
				{filteredAutoAssignments.length === 0 ? (
					<div className="col-span-full py-8 text-center text-xs text-m3-on-surface-variant">
						Không tìm thấy bài tập nào phù hợp với bộ lọc
					</div>
				) : (
					filteredAutoAssignments.map((assignment) => {
						const isSelected = multiAssignmentDraftIds.includes(assignment.id);
						return (
							<Card
								key={assignment.id}
								variant={isSelected ? "filled" : "elevated"}
								disableElevation
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
								className={`text-left rounded-2xl hover:rounded-xl p-3.5 transition-all duration-200 border-none shadow-none ${
									isSelected
										? "bg-m3-primary-container/25 text-m3-on-surface"
										: "bg-m3-surface hover:bg-m3-surface-container"
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
										<span className="text-[11px] px-2 py-0.5 rounded-full bg-m3-tertiary-container/30 text-m3-on-tertiary-container font-medium">
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
					})
				)}
			</div>
		</div>
	);
};
