import { Icon, Text } from "@bug-on/m3-expressive";
import type React from "react";
import type {
	SpecialCondition,
	SpecialConditionType,
	TaskXmlRule,
	XmlGradingCondition,
} from "../../../../types/xml-grading-rules.types";
import {
	defaultSpecialConditionFeedback,
	groupSpecialConditionOptions,
	specialConditionOptionsForSubject,
} from "../../utils/xml-rule-helpers";
import { SpecialConditionDispatcher } from "../special-conditions/SpecialConditionDispatcher";
import { ConditionItemCard } from "./ConditionItemCard";

export interface TaskCardProps {
	task: TaskXmlRule;
	projectIndex: number;
	taskIndex: number;
	subject: string;
	expanded: boolean;
	onToggleExpand: () => void;
	specialConditionExpanded: boolean;
	onToggleSpecialCondition: () => void;
	expandedConditionBasics: Record<string, boolean>;
	onToggleConditionBasics: (key: string) => void;
	showAdvanced: Record<string, boolean>;
	onToggleAdvanced: (key: string) => void;
	onMutateTask: (patch: Partial<TaskXmlRule>) => void;
	onMutateCondition: (ci: number, patch: Partial<XmlGradingCondition>) => void;
	onUpdateSpecialCondition: (specialCondition?: SpecialCondition) => void;
	onAddCondition: () => void;
	onRemoveCondition: (ci: number) => void;
	onDeleteTask: () => void;
	getAccessToken: () => Promise<string>;
}

const inputClass =
	"w-full rounded-xl bg-m3-surface-container px-3.5 py-2.5 text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest";
const selectClass =
	"w-full rounded-xl bg-m3-surface-container px-3.5 py-2.5 text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest cursor-pointer";

export const TaskCard: React.FC<TaskCardProps> = ({
	task,
	projectIndex,
	taskIndex,
	subject,
	expanded,
	onToggleExpand,
	specialConditionExpanded,
	onToggleSpecialCondition,
	expandedConditionBasics,
	onToggleConditionBasics,
	showAdvanced,
	onToggleAdvanced,
	onMutateTask,
	onMutateCondition,
	onUpdateSpecialCondition,
	onAddCondition,
	onRemoveCondition,
	onDeleteTask,
	getAccessToken,
}) => {
	const availableSpecialOptions = specialConditionOptionsForSubject(subject);
	const groupedSpecialOptions = groupSpecialConditionOptions(
		availableSpecialOptions,
	);

	return (
		<div className="overflow-hidden rounded-2xl bg-m3-surface-container-high transition hover:bg-m3-surface-container-high/90">
			{/* Task Header */}
			<div className="flex items-center gap-2 px-4 py-3">
				<button
					type="button"
					onClick={onToggleExpand}
					className="flex min-w-0 flex-1 items-center gap-3 text-left"
				>
					<Icon
						name="expand_more"
						className={`text-base text-m3-on-surface-variant transition-transform duration-200 ${
							expanded ? "rotate-180" : ""
						}`}
					/>
					<span className="rounded-lg bg-m3-surface-container px-2 py-0.5 font-mono text-[11px] font-bold text-m3-on-surface">
						{task.taskId || `TASK-${taskIndex + 1}`}
					</span>
					<span className="min-w-0 truncate text-sm font-bold text-m3-on-surface">
						{task.taskName || "Task chưa đặt tên"}
					</span>
					<span className="ml-auto shrink-0 text-xs font-semibold text-m3-on-surface-variant">
						{task.conditions.length} điều kiện · {task.maxScore} điểm
					</span>
				</button>

				<button
					type="button"
					onClick={onDeleteTask}
					aria-label="Xóa nhiệm vụ"
					title="Xóa nhiệm vụ"
					className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-m3-on-surface-variant transition hover:bg-m3-error-container hover:text-m3-error"
				>
					<Icon name="delete" className="text-base" />
				</button>
			</div>

			{/* Task Body */}
			{expanded && (
				<div className="space-y-4 p-4 pt-1">
					{/* Basic Task metadata fields */}
					<div className="grid gap-3 sm:grid-cols-[1fr_2fr_120px]">
						<label className="text-xs font-semibold text-m3-on-surface-variant">
							Mã Task
							<input
								value={task.taskId}
								onChange={(e) => onMutateTask({ taskId: e.target.value })}
								placeholder={`TASK-${taskIndex + 1}`}
								className={inputClass}
							/>
						</label>
						<label className="text-xs font-semibold text-m3-on-surface-variant">
							Tên Task
							<input
								value={task.taskName}
								onChange={(e) => onMutateTask({ taskName: e.target.value })}
								placeholder="Nhập tên mô tả task..."
								className={inputClass}
							/>
						</label>
						<label className="text-xs font-semibold text-m3-on-surface-variant">
							Điểm tối đa
							<input
								type="number"
								value={task.maxScore}
								onChange={(e) =>
									onMutateTask({ maxScore: Number(e.target.value) || 0 })
								}
								className={inputClass}
							/>
						</label>
					</div>

					{/* Special Condition Section */}
					<div className="rounded-2xl bg-m3-surface-container-low p-4">
						<div className="flex items-center justify-between gap-2">
							<button
								type="button"
								onClick={onToggleSpecialCondition}
								className="flex flex-1 items-center justify-between text-left"
							>
								<div className="flex items-center gap-2">
									<Icon
										name="auto_fix_high"
										className="text-base text-m3-primary"
									/>
									<span className="text-xs font-bold text-m3-on-surface">
										Điều kiện chấm đặc biệt (Special Condition)
									</span>
									{task.specialCondition?.type && (
										<span className="rounded-full bg-m3-primary/10 px-2 py-0.5 text-[10px] font-bold text-m3-primary">
											{task.specialCondition.type}
										</span>
									)}
								</div>
								<Icon
									name="expand_more"
									className={`text-base text-m3-on-surface-variant transition-transform duration-200 ${
										specialConditionExpanded ? "rotate-180" : ""
									}`}
								/>
							</button>
						</div>

						{specialConditionExpanded && (
							<div className="mt-3 space-y-3">
								<div className="grid gap-3 sm:grid-cols-[1fr_120px]">
									<label className="text-xs font-semibold text-m3-on-surface-variant">
										Loại kiểm tra đặc biệt
										<select
											value={task.specialCondition?.type ?? ""}
											onChange={(e) => {
												const val = e.target.value as SpecialConditionType;
												if (!val) {
													onUpdateSpecialCondition(undefined);
													return;
												}
												onUpdateSpecialCondition({
													type: val,
													score: task.specialCondition?.score ?? task.maxScore,
													feedback: defaultSpecialConditionFeedback(val),
												});
											}}
											className={selectClass}
										>
											<option value="">Không sử dụng điều kiện đặc biệt</option>
											{groupedSpecialOptions.map((group) => (
												<optgroup key={group.label} label={group.label}>
													{group.options.map((opt) => (
														<option key={opt.value} value={opt.value}>
															{opt.label}
														</option>
													))}
												</optgroup>
											))}
										</select>
									</label>

									{task.specialCondition?.type && (
										<label className="text-xs font-semibold text-m3-on-surface-variant">
											Điểm đặc biệt
											<input
												type="number"
												value={task.specialCondition.score ?? 0}
												onChange={(e) =>
													onUpdateSpecialCondition({
														...task.specialCondition!,
														score: Number(e.target.value) || 0,
													})
												}
												className={inputClass}
											/>
										</label>
									)}
								</div>

								{/* Special condition body rendered via dispatcher */}
								{task.specialCondition?.type && (
									<SpecialConditionDispatcher
										specialCondition={task.specialCondition}
										getAccessToken={getAccessToken}
										onChange={(next) => onUpdateSpecialCondition(next)}
									/>
								)}
							</div>
						)}
					</div>

					{/* XML Conditions List Section */}
					<div className="space-y-3">
						<div className="flex items-center justify-between gap-2">
							<div>
								<span className="text-xs font-bold text-m3-on-surface">
									Điều kiện XML thông thường ({task.conditions.length})
								</span>
							</div>

							<button
								type="button"
								onClick={onAddCondition}
								className="inline-flex items-center gap-1.5 rounded-xl bg-m3-primary px-3 py-1.5 text-xs font-semibold text-m3-on-primary transition hover:bg-m3-primary/90"
							>
								<Icon name="add" className="text-sm" />
								<span>Thêm điều kiện XML</span>
							</button>
						</div>

						{task.conditions.length === 0 ? (
							<div className="rounded-2xl bg-m3-surface-container-low p-6 text-center text-m3-on-surface-variant">
								<Text variant="body-sm" className="text-xs">
									{task.specialCondition
										? "Task này chỉ sử dụng Điều kiện đặc biệt."
										: "Chưa có điều kiện nào. Nhấn 'Thêm điều kiện XML' hoặc chọn 'Điều kiện đặc biệt'."}
								</Text>
							</div>
						) : (
							<div className="space-y-3">
								{task.conditions.map((condition, ci) => {
									const conditionKey = `${projectIndex}-${taskIndex}-${ci}`;
									return (
										<ConditionItemCard
											key={conditionKey}
											condition={condition}
											index={ci}
											basicsExpanded={
												expandedConditionBasics[conditionKey] ?? false
											}
											onToggleBasics={() =>
												onToggleConditionBasics(conditionKey)
											}
											advancedExpanded={showAdvanced[conditionKey] ?? false}
											onToggleAdvanced={() => onToggleAdvanced(conditionKey)}
											onMutate={(patch) => onMutateCondition(ci, patch)}
											onDelete={() => onRemoveCondition(ci)}
										/>
									);
								})}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
