import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { LoadingIndicator } from "@bug-on/m3-expressive/feedback";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import type {
	PublicPortalAssignment,
	PublicPortalSubmitResult,
} from "../../../types/submission-portal.types";
import { getFileExtensionWarning } from "../utils/grading";
import { subjectMeta } from "../utils/subjectMeta";
import { FileDropZone } from "./FileDropZone";
import { GradingResult } from "./GradingResult";

export interface AssignmentCardProps {
	assignment: PublicPortalAssignment;
	file?: File;
	result?: PublicPortalSubmitResult;
	isSubmitting: boolean;
	isPreviewing: boolean;
	isDragging: boolean;
	confirmedIdentity: boolean;
	hasAnySubmitting: boolean;
	showDetailedFeedback: boolean;
	onFileSelect: (assignment: PublicPortalAssignment, file?: File) => void;
	onSubmit: (assignmentId: string) => void;
	onDragChange: (assignmentId: string | null) => void;
}

export const AssignmentCard = ({
	assignment,
	file,
	result,
	isSubmitting,
	isPreviewing,
	isDragging,
	confirmedIdentity,
	hasAnySubmitting,
	showDetailedFeedback,
	onFileSelect,
	onSubmit,
	onDragChange,
}: AssignmentCardProps) => {
	const meta = subjectMeta[assignment.subject];
	const fileWarning = getFileExtensionWarning(assignment, file);

	const getStatusLabel = () => {
		if (isSubmitting) return "Đang nộp";
		if (isPreviewing) return "Đang chấm thử";
		if (result?.isPreview) return "Đã chấm thử";
		if (result) return "Đã nộp";
		return "Chưa nộp";
	};

	const getButtonLabel = () => {
		if (isSubmitting) return "Đang ghi nhận điểm...";
		if (isPreviewing) return "Đang chấm thử...";
		if (result?.isPreview) return "Nộp bài để ghi nhận điểm";
		if (result) return "Nộp lại bài";
		return "Nộp bài";
	};

	return (
		<Card
			variant="filled"
			className={`relative flex h-full flex-col bg-m3-surface-container-lowest p-5 text-m3-on-surface transition-all ${
				isSubmitting ? "ring-2 ring-m3-primary" : ""
			}`}
		>
			{isSubmitting && (
				<div className="absolute inset-x-0 top-0">
					<LoadingIndicator size={20} aria-label="Đang nộp bài" />
				</div>
			)}

			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<span
							className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${meta.accent}`}
						>
							<span>{meta.icon}</span>
							<span>{meta.label}</span>
						</span>
						<span
							className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
								result
									? "bg-m3-primary-container text-m3-on-primary-container"
									: "bg-m3-surface-container-high text-m3-on-surface-variant"
							}`}
						>
							{getStatusLabel()}
						</span>
					</div>
					<Text
						variant="title-md"
						className="mt-3 font-bold text-m3-on-surface"
					>
						{assignment.name}
					</Text>
				</div>
				<span className="rounded-2xl text-center bg-m3-surface-container px-3 py-2 text-sm font-bold text-m3-on-surface">
					{assignment.maxScore} điểm
				</span>
			</div>

			{assignment.description && (
				<Text
					variant="body-sm"
					className="mt-3 line-clamp-3 text-m3-on-surface-variant"
				>
					{assignment.description}
				</Text>
			)}

			<div className="mt-4 grid grid-cols-2 gap-2">
				<Text variant="body-sm" className="text-m3-on-surface-variant">
					{assignment.hasInstructions ? "Có hướng dẫn" : "Không có hướng dẫn"}
				</Text>
				<Text variant="body-sm" className="text-m3-on-surface-variant">
					{assignment.hasTemplate ? "Có file mẫu" : "Không có file mẫu"}
				</Text>
			</div>

			<FileDropZone
				file={file}
				disabled={isSubmitting || isPreviewing}
				isPreviewing={isPreviewing}
				isDragging={isDragging}
				onFileSelect={(f) => onFileSelect(assignment, f)}
				onDragChange={(drag) => onDragChange(drag ? assignment.id : null)}
			/>

			{fileWarning && (
				<Card
					variant="filled"
					className="mt-2 flex items-center gap-2 bg-m3-tertiary-container p-3 text-m3-on-tertiary-container"
				>
					<Icon name="warning" size={18} />
					<Text variant="body-sm" className="font-semibold">
						{fileWarning}
					</Text>
				</Card>
			)}

			<Button
				colorStyle="filled"
				fullWidth
				className="mt-4"
				disabled={
					!confirmedIdentity || !file || hasAnySubmitting || isPreviewing
				}
				loading={isSubmitting}
				onClick={() => onSubmit(assignment.id)}
			>
				{getButtonLabel()}
			</Button>

			{result && (
				<GradingResult
					result={result}
					showDetailedFeedback={showDetailedFeedback}
				/>
			)}
		</Card>
	);
};
