import { Icon } from "@bug-on/m3-expressive/core";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import type {
	PublicPortalAssignment,
	PublicPortalSubmitResult,
} from "../../../types/submission-portal.types";
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

export const AssignmentGrid = ({
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
	if (assignments.length === 0) {
		return (
			<Card
				variant="filled"
				className="flex flex-col items-center justify-center bg-m3-surface-container-low p-10 text-center text-m3-on-surface"
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
		<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{assignments.map((assignment) => (
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
	);
};
