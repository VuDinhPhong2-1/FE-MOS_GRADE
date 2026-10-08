import { Button, IconButton } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { TextField } from "@bug-on/m3-expressive/forms";
import {
	ListItem,
	type ListItemComponent,
	Text,
} from "@bug-on/m3-expressive/layout";
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
	_listIndex?: number;
	position?: "solo" | "leading" | "middle" | "trailing";
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

const selectClass =
	"w-full rounded-xl bg-m3-surface-container px-3.5 py-2.5 text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest cursor-pointer";

export const TaskCard: React.FC<TaskCardProps> & ListItemComponent = ({
	task,
	projectIndex,
	taskIndex,
	subject,
	expanded,
	onToggleExpand,
	_listIndex,
	position,
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

	const taskKey = task.taskId
		? `task-${task.taskId}-${taskIndex}`
		: `task-idx-${taskIndex}`;

	return (
		<ListItem
			_listIndex={_listIndex}
			position={position}
			value={taskKey}
			expandable
			expanded={expanded}
			onExpandChange={onToggleExpand}
			expandTrigger="row"
			leadingType="icon"
			leadingContent={
				<Icon name="task_alt" className="text-xl text-m3-secondary" />
			}
			headline={
				<span className="truncate text-sm font-bold text-m3-on-surface">
					{task.taskName || "Task chưa đặt tên"}
				</span>
			}
			supportingText={`${task.taskId || `TASK-${taskIndex + 1}`} · ${task.conditions.length} điều kiện · ${task.maxScore} điểm`}
			trailingType="custom"
			trailingContent={
				// biome-ignore lint/a11y/useKeyWithClickEvents: inner buttons handle interactions
				// biome-ignore lint/a11y/noStaticElementInteractions: stops click propagation from triggering expand
				<div
					className="flex items-center gap-1.5"
					onClick={(e) => e.stopPropagation()}
				>
					{task.taskId && (
						<span className="hidden sm:inline-block rounded-lg bg-m3-surface-container px-2 py-0.5 font-mono text-[11px] font-bold text-m3-on-surface">
							{task.taskId}
						</span>
					)}
					<IconButton
						type="button"
						size="sm"
						colorStyle="standard"
						aria-label="Xóa nhiệm vụ"
						onClick={onDeleteTask}
					>
						<Icon name="delete" className="text-base text-m3-error" />
					</IconButton>
					<Icon
						name="expand_more"
						className={`text-lg text-m3-on-surface-variant transition-transform duration-200 ${
							expanded ? "rotate-180" : ""
						}`}
					/>
				</div>
			}
		>
			{/* Task Body */}
			<div className="w-full min-w-0 overflow-hidden space-y-4 p-4 pt-2">
				{/* Basic Task metadata fields */}
				<div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_120px]">
					<TextField
						label="Mã Task"
						placeholder={`TASK-${taskIndex + 1}`}
						value={task.taskId}
						onChange={(val) => onMutateTask({ taskId: val })}
						fullWidth
					/>
					<TextField
						label="Tên Task"
						placeholder="Nhập tên mô tả task..."
						value={task.taskName}
						onChange={(val) => onMutateTask({ taskName: val })}
						fullWidth
					/>
					<TextField
						label="Điểm tối đa"
						type="number"
						value={String(task.maxScore ?? 0)}
						onChange={(val) =>
							onMutateTask({ maxScore: Number(val) || 0 })
						}
						fullWidth
					/>
				</div>

				{/* Special Condition Section */}
				<div className="min-w-0 rounded-2xl bg-m3-surface-container-low p-4">
					<div className="flex min-w-0 items-center justify-between gap-2">
						<button
							type="button"
							onClick={onToggleSpecialCondition}
							className="flex min-w-0 flex-1 items-center justify-between overflow-hidden text-left"
						>
							<div className="flex min-w-0 items-center gap-2">
								<Icon
									name="auto_fix_high"
									className="shrink-0 text-base text-m3-primary"
								/>
								<span className="truncate text-xs font-bold text-m3-on-surface">
									Điều kiện chấm đặc biệt (Special Condition)
								</span>
								{task.specialCondition?.type && (
									<span className="shrink-0 rounded-full bg-m3-primary/10 px-2 py-0.5 text-[10px] font-bold text-m3-primary">
										{task.specialCondition.type}
									</span>
								)}
							</div>
							<Icon
								name="expand_more"
								className={`shrink-0 text-base text-m3-on-surface-variant transition-transform duration-200 ${
									specialConditionExpanded ? "rotate-180" : ""
								}`}
							/>
						</button>
					</div>

					{specialConditionExpanded && (
						<div className="mt-3 min-w-0 space-y-3">
							<div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
								<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
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
									<TextField
										label="Điểm đặc biệt"
										type="number"
										value={String(task.specialCondition.score ?? 0)}
										onChange={(val) =>
											onUpdateSpecialCondition({
												...task.specialCondition!,
												score: Number(val) || 0,
											})
										}
										fullWidth
									/>
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
				<div className="min-w-0 space-y-3">
					<div className="flex min-w-0 items-center justify-between gap-2">
						<div className="min-w-0 truncate">
							<span className="text-xs font-bold text-m3-on-surface">
								Điều kiện XML thông thường ({task.conditions.length})
							</span>
						</div>

						<Button
							colorStyle="filled"
							size="xs"
							icon={<Icon name="add" />}
							onClick={onAddCondition}
						>
							Thêm điều kiện XML
						</Button>
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
						<div className="min-w-0 space-y-3">
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
		</ListItem>
	);
};

TaskCard._m3ListItem = true;

