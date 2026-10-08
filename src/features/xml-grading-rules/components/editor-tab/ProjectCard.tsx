import { Button, IconButton } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { TextField } from "@bug-on/m3-expressive/forms";
import {
	List,
	ListItem,
	type ListItemComponent,
	Text,
} from "@bug-on/m3-expressive/layout";
import type React from "react";
import type {
	ProjectXmlRule,
	SpecialCondition,
	TaskXmlRule,
	XmlGradingCondition,
} from "../../../../types/xml-grading-rules.types";
import { TaskCard } from "./TaskCard";

export interface ProjectCardProps {
	project: ProjectXmlRule;
	projectIndex: number;
	subject: string;
	expanded: boolean;
	onToggleExpand: () => void;
	_listIndex?: number;
	position?: "solo" | "leading" | "middle" | "trailing";
	expandedTasks: Record<string, boolean>;
	onToggleTask: (key: string) => void;
	expandedSpecialConditions: Record<string, boolean>;
	onToggleSpecialCondition: (key: string) => void;
	expandedConditionBasics: Record<string, boolean>;
	onToggleConditionBasics: (key: string) => void;
	showAdvanced: Record<string, boolean>;
	onToggleAdvanced: (key: string) => void;
	onMutateProject: (patch: Partial<ProjectXmlRule>) => void;
	onMutateTask: (ti: number, patch: Partial<TaskXmlRule>) => void;
	onMutateCondition: (
		ti: number,
		ci: number,
		patch: Partial<XmlGradingCondition>,
	) => void;
	onUpdateSpecialCondition: (
		ti: number,
		specialCondition?: SpecialCondition,
	) => void;
	onAddTask: () => void;
	onRemoveTask: (ti: number) => void;
	onAddCondition: (ti: number) => void;
	onRemoveCondition: (ti: number, ci: number) => void;
	onDeleteProject: () => void;
	getAccessToken: () => Promise<string>;
}

export const ProjectCard: React.FC<ProjectCardProps> & ListItemComponent = ({
	project,
	projectIndex,
	subject,
	expanded,
	onToggleExpand,
	_listIndex,
	position,
	expandedTasks,
	onToggleTask,
	expandedSpecialConditions,
	onToggleSpecialCondition,
	expandedConditionBasics,
	onToggleConditionBasics,
	showAdvanced,
	onToggleAdvanced,
	onMutateProject,
	onMutateTask,
	onMutateCondition,
	onUpdateSpecialCondition,
	onAddTask,
	onRemoveTask,
	onAddCondition,
	onRemoveCondition,
	onDeleteProject,
	getAccessToken,
}) => {
	const projectKey = project.projectCode
		? `project-${project.projectCode}-${projectIndex}`
		: `project-idx-${projectIndex}`;

	return (
		<ListItem
			_listIndex={_listIndex}
			position={position}
			value={projectKey}
			expandable
			expanded={expanded}
			onExpandChange={onToggleExpand}
			expandTrigger="row"
			leadingType="icon"
			leadingContent={<Icon name="folder" className="text-xl text-m3-primary" />}
			headline={project.projectName || "Project chưa đặt tên"}
			supportingText={`${project.projectCode || "project"} · ${project.tasks.length} task · ${project.maxScore} điểm`}
			trailingType="custom"
			trailingContent={
				<IconButton
					type="button"
					size="sm"
					colorStyle="standard"
					aria-label="Xóa project"
					onClick={(e) => {
						e.stopPropagation();
						onDeleteProject();
					}}
				>
					<Icon name="delete" className="text-base text-m3-error" />
				</IconButton>
			}
		>
			{/* Project Body */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: prevent accordion collapse when interacting with inner controls */}
			<div
				className="w-full min-w-0 overflow-hidden space-y-4 p-4 pt-2"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Project fields */}
				<div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_130px]">
					<TextField
						label="Mã project"
						placeholder="VD: project01"
						value={project.projectCode}
						onChange={(val) => onMutateProject({ projectCode: val })}
						fullWidth
					/>

					<TextField
						label="Tên project"
						placeholder="Nhập tên mô tả project..."
						value={project.projectName}
						onChange={(val) => onMutateProject({ projectName: val })}
						fullWidth
					/>

					<TextField
						label="Điểm tối đa"
						type="number"
						value={String(project.maxScore ?? 0)}
						onChange={(val) =>
							onMutateProject({ maxScore: Number(val) || 0 })
						}
						fullWidth
					/>
				</div>

				{/* Tasks section */}
				<div className="min-w-0 rounded-2xl bg-m3-surface-container p-4">
					<div className="mb-4 flex items-center justify-between gap-3">
						<div>
							<Text
								variant="title-sm"
								as="span"
								className="font-bold text-m3-on-surface"
							>
								Tasks ({project.tasks.length})
							</Text>
							<Text
								variant="body-sm"
								className="mt-0.5 text-xs text-m3-on-surface-variant"
							>
								Các nhiệm vụ con trong project
							</Text>
						</div>

						<Button
							colorStyle="tonal"
							size="xs"
							icon={<Icon name="add" />}
							onClick={onAddTask}
						>
							Thêm Task
						</Button>
					</div>

					{project.tasks.length === 0 ? (
						<div className="rounded-2xl bg-m3-surface-container-high/50 p-6 text-center text-m3-on-surface-variant">
							<Text variant="body-sm" className="text-xs">
								Chưa có task nào trong project này. Nhấn 'Thêm Task' để bắt
								đầu.
							</Text>
						</div>
					) : (
						<List
							variant="expressive"
							listStyle="segmented"
							selectionMode="multi-action"
							className="w-full min-w-0"
						>
							{project.tasks.map((task, ti) => {
								const taskKey = `${projectIndex}-${ti}`;
								return (
									<TaskCard
										key={taskKey}
										task={task}
										projectIndex={projectIndex}
										taskIndex={ti}
										subject={subject}
										expanded={expandedTasks[taskKey] ?? false}
										onToggleExpand={() => onToggleTask(taskKey)}
										specialConditionExpanded={
											expandedSpecialConditions[taskKey] ?? true
										}
										onToggleSpecialCondition={() =>
											onToggleSpecialCondition(taskKey)
										}
										expandedConditionBasics={expandedConditionBasics}
										onToggleConditionBasics={onToggleConditionBasics}
										showAdvanced={showAdvanced}
										onToggleAdvanced={onToggleAdvanced}
										onMutateTask={(patch) => onMutateTask(ti, patch)}
										onMutateCondition={(ci, patch) =>
											onMutateCondition(ti, ci, patch)
										}
										onUpdateSpecialCondition={(specialCondition) =>
											onUpdateSpecialCondition(ti, specialCondition)
										}
										onAddCondition={() => onAddCondition(ti)}
										onRemoveCondition={(ci) => onRemoveCondition(ti, ci)}
										onDeleteTask={() => onRemoveTask(ti)}
										getAccessToken={getAccessToken}
									/>
								);
							})}
						</List>
					)}
				</div>
			</div>
		</ListItem>
	);
};

ProjectCard._m3ListItem = true;
