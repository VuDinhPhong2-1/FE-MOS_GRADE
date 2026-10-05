import { Icon } from "@bug-on/m3-expressive/core";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import { memo, useMemo, useState } from "react";
import type {
	PublicPortalAssignment,
	PublicPortalSubmitResult,
} from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";
import { AssignmentCard } from "./AssignmentCard";

export interface AssignmentGridProps {
	assignments: PublicPortalAssignment[];
	files: Record<string, File | undefined>;
	results: Record<string, PublicPortalSubmitResult>;
	submittingAssignmentId: string | null;
	previewingAssignmentId: string | null;
	draggingAssignmentId: string | null;
	confirmedIdentity: boolean;
	showDetailedFeedback: boolean;
	onFileSelect: (assignment: PublicPortalAssignment, file?: File) => void;
	onSubmit: (assignmentId: string) => void;
	onDragChange: (assignmentId: string | null) => void;
}

type FilterMode = "all" | "pending" | "completed";

const AssignmentGridComponent = ({
	assignments,
	files,
	results,
	submittingAssignmentId,
	previewingAssignmentId,
	draggingAssignmentId,
	confirmedIdentity,
	showDetailedFeedback,
	onFileSelect,
	onSubmit,
	onDragChange,
}: AssignmentGridProps) => {
	const [filter, setFilter] = useState<FilterMode>("all");

	const { completedCount, pendingCount } = useMemo(() => {
		let completed = 0;
		for (const a of assignments) {
			if (results[a.id] && !results[a.id].isPreview) {
				completed++;
			}
		}
		return {
			completedCount: completed,
			pendingCount: assignments.length - completed,
		};
	}, [assignments, results]);

	const filteredAssignments = useMemo(() => {
		if (filter === "completed") {
			return assignments.filter(
				(a) => results[a.id] && !results[a.id].isPreview,
			);
		}
		if (filter === "pending") {
			return assignments.filter(
				(a) => !results[a.id] || results[a.id].isPreview,
			);
		}
		return assignments;
	}, [assignments, results, filter]);
	if (assignments.length === 0) {
		return (
			<Card
				variant="filled"
				className="flex flex-col items-center justify-center bg-m3-surface-container-low p-10 text-center rounded-m3-xl text-m3-on-surface"
			>
				<Icon name="inbox" size={48} className="text-m3-on-surface-variant" />
				<Text variant="title-lg" className="mt-3 font-bold">
					Chưa có bài tập để nộp
				</Text>
				<Text
					variant="body-md"
					className="mt-2 max-w-md text-m3-on-surface-variant"
				>
					Lớp đã chọn chưa có bài tập trong cổng này. Hãy báo giáo viên kiểm tra
					lại phạm vi link.
				</Text>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Filter Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3 px-1">
				<div className="flex items-center gap-2">
					<Text variant="title-md" className="font-bold text-m3-on-surface">
						Danh sách bài tập
					</Text>
					<span className="rounded-full bg-m3-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-m3-on-surface-variant">
						{assignments.length} bài
					</span>
				</div>

				{/* Filter Chips */}
				<div className="flex items-center gap-1.5 rounded-2xl bg-m3-surface-container-high p-1 text-xs font-semibold">
					<button
						type="button"
						onClick={() => setFilter("all")}
						className={cn(
							"flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer",
							filter === "all"
								? "bg-m3-surface-container-lowest text-m3-on-surface shadow-xs font-bold"
								: "text-m3-on-surface-variant hover:text-m3-on-surface",
						)}
					>
						<span>Tất cả</span>
						<span
							className={cn(
								"rounded-full px-1.5 py-0.2 text-[11px]",
								filter === "all"
									? "bg-m3-surface-container text-m3-on-surface"
									: "bg-m3-surface-container-highest text-m3-on-surface-variant",
							)}
						>
							{assignments.length}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setFilter("pending")}
						className={cn(
							"flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer",
							filter === "pending"
								? "bg-m3-surface-container-lowest text-amber-700 dark:text-amber-300 shadow-xs font-bold"
								: "text-m3-on-surface-variant hover:text-m3-on-surface",
						)}
					>
						<span
							className={cn(
								"h-2 w-2 rounded-full",
								pendingCount > 0 ? "bg-amber-500" : "bg-m3-outline-variant",
							)}
						/>
						<span>Cần làm</span>
						<span
							className={cn(
								"rounded-full px-1.5 py-0.2 text-[11px]",
								filter === "pending"
									? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
									: "bg-m3-surface-container-highest text-m3-on-surface-variant",
							)}
						>
							{pendingCount}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setFilter("completed")}
						className={cn(
							"flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer",
							filter === "completed"
								? "bg-m3-surface-container-lowest text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
								: "text-m3-on-surface-variant hover:text-m3-on-surface",
						)}
					>
						<Icon
							name="check_circle"
							size={14}
							className={
								completedCount > 0
									? "text-emerald-600 dark:text-emerald-400"
									: "text-m3-outline-variant"
							}
						/>
						<span>Đã nộp</span>
						<span
							className={cn(
								"rounded-full px-1.5 py-0.2 text-[11px]",
								filter === "completed"
									? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
									: "bg-m3-surface-container-highest text-m3-on-surface-variant",
							)}
						>
							{completedCount}
						</span>
					</button>
				</div>
			</div>

			{/* Empty state for specific filter */}
			{filteredAssignments.length === 0 ? (
				<Card
					variant="filled"
					className="flex flex-col items-center justify-center bg-m3-surface-container-lowest p-10 text-center rounded-m3-xl text-m3-on-surface border border-m3-outline-variant/40"
				>
					<Icon
						name={filter === "pending" ? "celebration" : "assignment_late"}
						size={44}
						className={
							filter === "pending"
								? "text-emerald-500"
								: "text-m3-on-surface-variant"
						}
					/>
					<Text variant="title-md" className="mt-3 font-bold">
						{filter === "pending"
							? "🎉 Tuyệt vời! Bạn đã hoàn thành tất cả các bài tập."
							: "Chưa có bài tập nào được nộp."}
					</Text>
					<Text variant="body-sm" className="mt-1 text-m3-on-surface-variant">
						{filter === "pending"
							? "Bạn có thể chuyển sang mục 'Đã nộp' để xem lại điểm số hoặc nộp lại bài nếu cần cải thiện."
							: "Hãy chuyển sang mục 'Cần làm' để bắt đầu làm bài và nộp nhé!"}
					</Text>
				</Card>
			) : (
				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredAssignments.map((assignment) => (
						<AssignmentCard
							key={assignment.id}
							assignment={assignment}
							file={files[assignment.id]}
							result={results[assignment.id]}
							isSubmitting={submittingAssignmentId === assignment.id}
							isPreviewing={previewingAssignmentId === assignment.id}
							isDragging={draggingAssignmentId === assignment.id}
							confirmedIdentity={confirmedIdentity}
							hasAnySubmitting={Boolean(submittingAssignmentId)}
							showDetailedFeedback={showDetailedFeedback}
							onFileSelect={onFileSelect}
							onSubmit={onSubmit}
							onDragChange={onDragChange}
						/>
					))}
				</section>
			)}
		</div>
	);
};

export const AssignmentGrid = memo(AssignmentGridComponent);
