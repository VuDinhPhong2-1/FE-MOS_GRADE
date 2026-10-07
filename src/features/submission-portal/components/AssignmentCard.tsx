import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { LoadingIndicator } from "@bug-on/m3-expressive/feedback";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import { useState } from "react";
import type {
	PublicPortalAssignment,
	PublicPortalSubmitResult,
} from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";
import { formatDateTime } from "../utils/formatters";
import { getFileExtensionWarning } from "../utils/grading";
import { subjectMeta } from "../utils/subjectMeta";
import { FileDropZone } from "./FileDropZone";
import { GradingResult } from "./GradingResult";

export interface AssignmentCardProps {
	assignment: PublicPortalAssignment;
	file?: File;
	attachmentFile?: File;
	result?: PublicPortalSubmitResult;
	isSubmitting: boolean;
	isPreviewing: boolean;
	isDragging: boolean;
	confirmedIdentity: boolean;
	hasAnySubmitting: boolean;
	showDetailedFeedback: boolean;
	onFileSelect: (
		assignment: PublicPortalAssignment,
		file?: File,
		attachmentFile?: File,
	) => void;
	onSubmit: (assignmentId: string) => void;
	onDragChange: (assignmentId: string | null) => void;
}

export const AssignmentCard = ({
	assignment,
	file,
	attachmentFile,
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
	const [showReupload, setShowReupload] = useState(false);
	const meta = subjectMeta[assignment.subject];
	const fileWarning = getFileExtensionWarning(assignment, file);

	const isCompleted = Boolean(result && !result.isPreview);
	const isPerfect =
		isCompleted &&
		typeof result?.scoreValue === "number" &&
		result.scoreValue >= assignment.maxScore;
	const hasErrors =
		isCompleted &&
		typeof result?.scoreValue === "number" &&
		result.scoreValue < assignment.maxScore;

	const projectMatch = assignment.name.match(
		/(Project\s*\d+|Bài\s*\d+|Proj\s*\d+)/i,
	);
	const projectTag = projectMatch ? projectMatch[0].toUpperCase() : null;

	const getButtonLabel = () => {
		if (isSubmitting) return "Đang ghi nhận điểm...";
		if (isPreviewing) return "Đang chấm thử...";
		if (result?.isPreview) return "Nộp bài để ghi nhận điểm";
		if (isCompleted) return "Xác nhận nộp lại bài";
		return file ? "Nộp bài làm" : "Chọn file để nộp";
	};

	return (
		<Card
			variant="filled"
			className={cn(
				"relative flex h-full flex-col bg-m3-surface-container-lowest p-5 text-m3-on-surface rounded-m3-xl transition-all duration-200",
				isPerfect &&
					"border-2 border-emerald-500/40 bg-emerald-500/1.5 shadow-xs",
				hasErrors && "border-2 border-amber-500/40 bg-amber-500/1.5 shadow-xs",
				!isCompleted &&
					"border border-m3-outline-variant/60 hover:border-m3-primary/50 shadow-xs",
				isSubmitting && "ring-2 ring-m3-primary shadow-md",
			)}
		>
			{isSubmitting && (
				<div className="absolute inset-x-0 top-0">
					<LoadingIndicator size={20} aria-label="Đang nộp bài" />
				</div>
			)}

			{/* Card Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-1.5">
						{projectTag && (
							<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-m3-surface-container-highest text-m3-on-surface">
								{projectTag}
							</span>
						)}
						<span
							className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.accent}`}
						>
							<span>{meta.icon}</span>
							<span>{meta.label}</span>
						</span>
					</div>

					<Text
						variant="title-md"
						className="mt-2.5 font-bold text-m3-on-surface line-clamp-2"
					>
						{assignment.name}
					</Text>
				</div>

				{/* Prominent Score / Points Badge */}
				<div className="shrink-0">
					{typeof result?.scoreValue === "number" ? (
						<div
							className={cn(
								"rounded-2xl text-center px-3 py-1.5 text-sm font-bold shadow-xs",
								result.isPreview
									? "bg-m3-tertiary-container text-m3-on-tertiary-container"
									: isPerfect
										? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950 font-black"
										: "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950 font-black",
							)}
							title={
								result.isPreview ? "Điểm chấm thử" : "Điểm đã lưu chính thức"
							}
						>
							{result.scoreValue}/{assignment.maxScore} đ
						</div>
					) : (
						<div className="rounded-2xl text-center bg-m3-surface-container px-3 py-1.5 text-xs font-bold text-m3-on-surface-variant">
							{assignment.maxScore} điểm
						</div>
					)}
				</div>
			</div>

			{assignment.description && (
				<Text
					variant="body-sm"
					className="mt-2 line-clamp-2 text-m3-on-surface-variant text-xs"
				>
					{assignment.description}
				</Text>
			)}

			{/* Materials Info Tags (only when available) */}
			{(assignment.hasInstructions || assignment.hasTemplate) && (
				<div className="mt-2 flex flex-wrap gap-2 text-xs">
					{assignment.hasInstructions && (
						<span className="inline-flex items-center gap-1 rounded-full bg-m3-surface-container px-2 py-0.5 font-medium text-m3-on-surface-variant text-[11px]">
							<Icon name="description" size={13} /> Có hướng dẫn
						</span>
					)}
					{assignment.hasTemplate && (
						<span className="inline-flex items-center gap-1 rounded-full bg-m3-surface-container px-2 py-0.5 font-medium text-m3-on-surface-variant text-[11px]">
							<Icon name="attachment" size={13} /> Có file mẫu
						</span>
					)}
				</div>
			)}

			{/* Conditional Dropzone / Submitted Summary */}
			{result && isCompleted && !showReupload && !file && !isDragging ? (
				<div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3">
					<div className="flex items-center gap-2.5 min-w-0">
						<Icon
							name="check_circle"
							size={22}
							className="text-emerald-600 dark:text-emerald-400 shrink-0"
						/>
						<div className="min-w-0">
							<Text
								variant="label-md"
								className="font-bold text-emerald-900 dark:text-emerald-100 truncate"
							>
								Đã nộp bài thành công
							</Text>
							<Text
								variant="body-sm"
								className="text-emerald-800/80 dark:text-emerald-200/80 text-[11px]"
							>
								{formatDateTime(result.submittedAt)}
								{result.submissionCount && result.submissionCount > 1
									? ` • Lần nộp #${result.submissionCount}`
									: ""}
							</Text>
						</div>
					</div>
					<Button
						size="sm"
						colorStyle="tonal"
						onClick={() => setShowReupload(true)}
						className="shrink-0 text-xs"
					>
						<Icon name="refresh" size={15} />
						Nộp lại
					</Button>
				</div>
			) : (
				<div className="mt-2 flex flex-col">
					{isCompleted && showReupload && !file && (
						<div className="flex items-center justify-between pb-1 text-xs">
							<span className="font-semibold text-m3-on-surface-variant flex items-center gap-1">
								<Icon name="upload_file" size={14} /> Chọn bài làm mới để thay
								thế
							</span>
							<button
								type="button"
								onClick={() => setShowReupload(false)}
								className="text-m3-primary hover:underline cursor-pointer font-bold"
							>
								Hủy nộp lại
							</button>
						</div>
					)}

					<FileDropZone
						file={file}
						attachmentFile={attachmentFile}
						disabled={isSubmitting || isPreviewing}
						isPreviewing={isPreviewing}
						isDragging={isDragging}
						onFileSelect={(f, att) => onFileSelect(assignment, f, att)}
						onDragChange={(drag) => onDragChange(drag ? assignment.id : null)}
					/>

					{fileWarning && (
						<Card
							variant="filled"
							className="mt-2 flex items-center gap-2 bg-m3-tertiary-container p-2.5 text-m3-on-tertiary-container rounded-xl"
						>
							<Icon name="warning" size={16} />
							<Text variant="body-sm" className="font-semibold text-xs">
								{fileWarning}
							</Text>
						</Card>
					)}

					<Button
						colorStyle="filled"
						fullWidth
						className="mt-3 font-bold"
						disabled={
							!confirmedIdentity || !file || hasAnySubmitting || isPreviewing
						}
						loading={isSubmitting}
						onClick={() => onSubmit(assignment.id)}
					>
						{getButtonLabel()}
					</Button>
				</div>
			)}

			{/* Grading Result Feedback */}
			{result && (
				<GradingResult
					result={result}
					showDetailedFeedback={showDetailedFeedback}
				/>
			)}
		</Card>
	);
};
