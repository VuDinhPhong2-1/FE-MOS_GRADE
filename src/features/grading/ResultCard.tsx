import { Icon } from "@bug-on/m3-expressive";
import { clsx } from "clsx";
import React from "react";
import type { GradingResult } from "../../types";
import { stripGradingGuideSection } from "../../utils/gradingText";

interface Props {
	result: GradingResult;
}

const ResultCard: React.FC<Props> = ({ result }) => {
	const [expandedTasks, setExpandedTasks] = React.useState<string[]>([]);

	const toggleTask = (taskId: string) => {
		setExpandedTasks((prev) =>
			prev.includes(taskId)
				? prev.filter((id) => id !== taskId)
				: [...prev, taskId],
		);
	};

	return (
		<div className="mt-6 overflow-hidden rounded-4xl bg-m3-surface-container shadow-xs">
			<div className="bg-m3-surface-container-high p-6">
				<h2 className="text-xl font-bold text-m3-on-surface">
					{result.projectName} ({result.projectId})
				</h2>
				<div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
					<div className="rounded-2xl bg-m3-primary-container/40 p-3.5 shadow-2xs">
						<p className="text-xs font-semibold text-m3-primary">Tổng điểm</p>
						<p className="text-2xl font-bold text-m3-primary">
							{result.totalScore} / {result.maxScore}
						</p>
					</div>
					<div className="rounded-2xl bg-m3-secondary-container/40 p-3.5 shadow-2xs">
						<p className="text-xs font-semibold text-m3-secondary">Tỷ lệ</p>
						<p className="text-2xl font-bold text-m3-secondary">
							{result.percentage}%
						</p>
					</div>
					<div
						className={clsx(
							"rounded-2xl p-3.5 shadow-2xs",
							result.percentage >= 70 ? "bg-emerald-500/15" : "bg-amber-500/15",
						)}
					>
						<p
							className={clsx(
								"text-xs font-semibold",
								result.percentage >= 70
									? "text-emerald-600 dark:text-emerald-400"
									: "text-amber-600 dark:text-amber-400",
							)}
						>
							Trạng thái
						</p>
						<p
							className={clsx(
								"text-2xl font-bold",
								result.percentage >= 70
									? "text-emerald-600 dark:text-emerald-400"
									: "text-amber-600 dark:text-amber-400",
							)}
						>
							{result.status}
						</p>
					</div>
					<div className="rounded-2xl bg-m3-surface-container-highest p-3.5 shadow-2xs">
						<p className="text-xs font-semibold text-m3-on-surface-variant">
							Ngày chấm
						</p>
						<p className="mt-1 text-sm font-medium text-m3-on-surface">
							{new Date(result.gradedAt).toLocaleString("vi-VN")}
						</p>
					</div>
				</div>
			</div>

			<div className="divide-y divide-m3-outline-variant/40">
				{result.taskResults.map((task, index) => {
					const taskKey = `${task.taskId}-${index}`;
					const errors = (task.errors || [])
						.map((err) => stripGradingGuideSection(err))
						.filter(Boolean);
					const details = (task.details || [])
						.map((detail) => stripGradingGuideSection(detail))
						.filter(Boolean);

					return (
						<div key={taskKey} className="bg-m3-surface-container">
							<button
								type="button"
								className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-m3-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary/50"
								onClick={() => toggleTask(taskKey)}
								aria-expanded={expandedTasks.includes(taskKey)}
							>
								<div className="flex items-center gap-3">
									{task.isPassed ? (
										<Icon
											name="check_circle"
											className="text-emerald-500 text-xl"
										/>
									) : (
										<Icon name="cancel" className="text-rose-500 text-xl" />
									)}
									<div>
										<p className="font-medium text-m3-on-surface">
											{task.taskId}: {task.taskName}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<span
										className={clsx(
											"font-bold",
											task.score === task.maxScore
												? "text-emerald-600 dark:text-emerald-400"
												: "text-rose-600 dark:text-rose-400",
										)}
									>
										{task.score}/{task.maxScore}
									</span>
									{expandedTasks.includes(taskKey) ? (
										<Icon
											name="expand_less"
											className="text-lg text-m3-on-surface-variant"
										/>
									) : (
										<Icon
											name="expand_more"
											className="text-lg text-m3-on-surface-variant"
										/>
									)}
								</div>
							</button>

							{expandedTasks.includes(taskKey) && (
								<div className="px-12 pb-4 pt-0 text-sm">
									{errors.length > 0 && (
										<div className="mb-2">
											<p className="mb-1 font-semibold text-rose-600 dark:text-rose-400">
												Lỗi sai:
											</p>
											<ul className="list-disc space-y-1 pl-5 text-rose-500 dark:text-rose-300">
												{Array.from(new Set(errors)).map((err) => (
													<li key={`${taskKey}-err-${err}`}>
														{err
															.replace("â ’ ", "")
															.replace("✗ ", "")
															.replace("✖ ", "")}
													</li>
												))}
											</ul>
										</div>
									)}
									{details.length > 0 && (
										<div>
											<p className="mb-1 font-semibold text-emerald-600 dark:text-emerald-400">
												Chi tiết đúng:
											</p>
											<ul className="list-disc space-y-1 pl-5 text-emerald-500 dark:text-emerald-300">
												{Array.from(new Set(details)).map((detail) => (
													<li key={`${taskKey}-detail-${detail}`}>
														{detail
															.replace("âœ“ ", "")
															.replace("✓ ", "")
															.replace("✔ ", "")}
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ResultCard;
