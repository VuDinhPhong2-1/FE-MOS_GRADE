import { Icon } from "@bug-on/m3-expressive/core";
import { ProgressIndicator } from "@bug-on/m3-expressive/feedback";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import type { PublicPortalSubmitResult } from "../../../types/submission-portal.types";
import { formatDateTime } from "../utils/formatters";
import {
	getFailedTaskResults,
	getScoreTone,
	getTaskLabel,
	uniqueNonEmpty,
} from "../utils/grading";

export interface GradingResultProps {
	result: PublicPortalSubmitResult;
	showDetailedFeedback: boolean;
}

export const GradingResult = ({
	result,
	showDetailedFeedback,
}: GradingResultProps) => {
	const failedTaskResults = getFailedTaskResults(result);
	const fallbackErrors = uniqueNonEmpty(result.autoGradingErrors);
	const hasDetailedIssues =
		failedTaskResults.length > 0 || fallbackErrors.length > 0;
	const scoreRatio =
		result.scoreValue !== undefined && result.maxScore > 0
			? Math.round((result.scoreValue / result.maxScore) * 100)
			: 0;

	return (
		<Card
			variant="filled"
			className="mt-4 flex flex-col gap-3 bg-m3-surface-container p-4 text-m3-on-surface"
		>
			<ProgressIndicator
				variant="linear"
				trackShape="flat"
				shape="wavy"
				aria-label={`Điểm số đạt được: ${scoreRatio}%`}
				value={Math.min(100, Math.max(0, scoreRatio))}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<span
					className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${getScoreTone(
						result.scoreValue,
						result.maxScore,
					)}`}
				>
					<Icon name="grade" size={16} />
					Điểm: {result.scoreValue ?? "--"}/{result.maxScore}
					{result.rank ? ` • Hạng #${result.rank}` : ""}
				</span>
			</div>

			<Text variant="body-sm" className="text-m3-on-surface-variant">
				{result.isPreview
					? "Kết quả chấm thử chưa ghi nhận điểm. Bấm Nộp bài để lưu điểm chính thức."
					: `Đã nộp: ${formatDateTime(result.submittedAt)}`}
			</Text>

			{showDetailedFeedback && result.feedback && (
				<Text
					variant="body-md"
					className="mt-1 whitespace-pre-line text-m3-on-surface"
				>
					{result.feedback}
				</Text>
			)}

			{failedTaskResults.length > 0 && (
				<div className="mt-2 space-y-2">
					<Text variant="title-sm" className="font-bold text-m3-error">
						Các câu cần sửa:
					</Text>
					{failedTaskResults.map((task, index) => {
						const errors = uniqueNonEmpty(task.errors);
						const fixes = uniqueNonEmpty(task.fixActions);
						const taskKey = [
							task.taskId,
							task.taskName,
							errors.join("|"),
							fixes.join("|"),
						]
							.filter(Boolean)
							.join("-");

						return (
							<Card
								key={taskKey}
								variant="filled"
								className="bg-m3-surface-container-high p-3"
							>
								<div className="flex items-center justify-between">
									<Text
										variant="label-lg"
										className="font-bold text-m3-on-surface"
									>
										{getTaskLabel(task, index)}
									</Text>
									{typeof task.score === "number" &&
										typeof task.maxScore === "number" && (
											<Text
												variant="body-sm"
												className="font-semibold text-m3-on-surface-variant"
											>
												({task.score}/{task.maxScore} điểm)
											</Text>
										)}
								</div>

								{errors.map((error) => (
									<Text
										key={error}
										variant="body-sm"
										className="mt-1.5 text-m3-error"
									>
										<span className="font-bold">Câu sai:</span> {error}
									</Text>
								))}

								{fixes.map((fix) => (
									<Text
										key={fix}
										variant="body-sm"
										className="mt-1 text-m3-primary"
									>
										<span className="font-bold">Cách khắc phục:</span> {fix}
									</Text>
								))}
							</Card>
						);
					})}
				</div>
			)}

			{failedTaskResults.length === 0 && fallbackErrors.length > 0 && (
				<div className="mt-2 space-y-1">
					<Text variant="title-sm" className="font-bold text-m3-error">
						Các câu cần sửa:
					</Text>
					{fallbackErrors.map((error, index) => (
						<Text key={error} variant="body-sm" className="text-m3-error">
							<span className="font-bold">Câu sai {index + 1}:</span> {error}
						</Text>
					))}
				</div>
			)}

			{showDetailedFeedback && !hasDetailedIssues && (
				<Card
					variant="filled"
					className="flex items-center gap-2 bg-m3-primary-container px-3 py-2 text-m3-on-primary-container"
				>
					<Icon name="verified" size={20} className="text-m3-primary" />
					<Text variant="body-md" className="font-bold">
						🎉 Tuyệt vời! Bài nộp hiện không còn lỗi cần sửa.
					</Text>
				</Card>
			)}

			{result.alerts.length > 0 && (
				<Card
					variant="filled"
					className="mt-2 bg-m3-tertiary-container p-3 text-m3-on-tertiary-container"
				>
					<div className="flex items-center gap-1.5">
						<Icon name="warning" size={18} />
						<Text variant="label-lg" className="font-black">
							Cảnh báo cần lưu ý
						</Text>
					</div>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
						{result.alerts.map((alert) => (
							<li key={alert}>{alert}</li>
						))}
					</ul>
				</Card>
			)}
		</Card>
	);
};
