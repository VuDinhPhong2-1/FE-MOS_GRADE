import { Button, Card, Icon, List, Text } from "@bug-on/m3-expressive";
import type React from "react";
import type {
	GradingRuleSet,
	ProjectXmlRule,
	SpecialCondition,
	TaskXmlRule,
	XmlGradingCondition,
} from "../../../../types/xml-grading-rules.types";
import { ProjectCard } from "./ProjectCard";

export interface ProjectListSectionProps {
	selected: GradingRuleSet;
	expandedProjects: Record<number, boolean>;
	onToggleProject: (index: number) => void;
	expandedTasks: Record<string, boolean>;
	onToggleTask: (key: string) => void;
	expandedSpecialConditions: Record<string, boolean>;
	onToggleSpecialCondition: (key: string) => void;
	expandedConditionBasics: Record<string, boolean>;
	onToggleConditionBasics: (key: string) => void;
	showAdvanced: Record<string, boolean>;
	onToggleAdvanced: (key: string) => void;
	onMutateProject: (pi: number, patch: Partial<ProjectXmlRule>) => void;
	onMutateTask: (pi: number, ti: number, patch: Partial<TaskXmlRule>) => void;
	onMutateCondition: (
		pi: number,
		ti: number,
		ci: number,
		patch: Partial<XmlGradingCondition>,
	) => void;
	onUpdateSpecialCondition: (
		pi: number,
		ti: number,
		specialCondition?: SpecialCondition,
	) => void;
	onAddProject: () => void;
	onRemoveProject: (pi: number) => void;
	onAddTask: (pi: number) => void;
	onRemoveTask: (pi: number, ti: number) => void;
	onAddCondition: (pi: number, ti: number) => void;
	onRemoveCondition: (pi: number, ti: number, ci: number) => void;
	getAccessToken: () => Promise<string>;
}

export const ProjectListSection: React.FC<ProjectListSectionProps> = ({
	selected,
	expandedProjects,
	onToggleProject,
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
	onAddProject,
	onRemoveProject,
	onAddTask,
	onRemoveTask,
	onAddCondition,
	onRemoveCondition,
	getAccessToken,
}) => {
	return (
		<Card
			variant="filled"
			disableElevation
			className="min-w-0 rounded-3xl bg-m3-surface-container-highest p-6 text-m3-on-surface"
		>
			{/* Header */}
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<Text
						variant="title-md"
						as="h3"
						className="font-bold text-m3-on-surface"
					>
						Danh sách Projects ({selected.projects.length})
					</Text>
					<Text
						variant="body-sm"
						className="mt-1 text-xs text-m3-on-surface-variant"
					>
						Mỗi project chứa các Task và điều kiện chấm tương ứng.
					</Text>
				</div>

				<Button
					colorStyle="filled"
					size="sm"
					icon={<Icon name="add" />}
					onClick={onAddProject}
				>
					Thêm Project
				</Button>
			</div>

			{/* Project Cards / Segmented List */}
			{selected.projects.length === 0 ? (
				<Card
					variant="filled"
					disableElevation
					className="flex flex-col items-center justify-center rounded-3xl bg-m3-surface-container p-12 text-center text-m3-on-surface-variant"
				>
					<Icon name="folder_open" className="text-4xl opacity-50" />
					<Text variant="body-md" className="mt-3 text-sm font-semibold">
						Chưa có project nào trong ruleset này.
					</Text>
					<Text variant="body-sm" className="mt-1 text-xs">
						Nhấn 'Thêm Project' để bắt đầu thiết lập các bài tập và nhiệm vụ
						chấm.
					</Text>
				</Card>
			) : (
				<List
					variant="expressive"
					listStyle="segmented"
					selectionMode="multi-action"
					className="w-full min-w-0"
				>
					{selected.projects.map((project, pi) => (
						<ProjectCard
							key={project.projectCode ? `project-${project.projectCode}` : `project-${pi}`}
							project={project}
							projectIndex={pi}
							subject={selected.subject}
							expanded={expandedProjects[pi] ?? false}
							onToggleExpand={() => onToggleProject(pi)}
							expandedTasks={expandedTasks}
							onToggleTask={onToggleTask}
							expandedSpecialConditions={expandedSpecialConditions}
							onToggleSpecialCondition={onToggleSpecialCondition}
							expandedConditionBasics={expandedConditionBasics}
							onToggleConditionBasics={onToggleConditionBasics}
							showAdvanced={showAdvanced}
							onToggleAdvanced={onToggleAdvanced}
							onMutateProject={(patch) => onMutateProject(pi, patch)}
							onMutateTask={(ti, patch) => onMutateTask(pi, ti, patch)}
							onMutateCondition={(ti, ci, patch) =>
								onMutateCondition(pi, ti, ci, patch)
							}
							onUpdateSpecialCondition={(ti, specialCondition) =>
								onUpdateSpecialCondition(pi, ti, specialCondition)
							}
							onAddTask={() => onAddTask(pi)}
							onRemoveTask={(ti) => onRemoveTask(pi, ti)}
							onAddCondition={(ti) => onAddCondition(pi, ti)}
							onRemoveCondition={(ti, ci) => onRemoveCondition(pi, ti, ci)}
							onDeleteProject={() => onRemoveProject(pi)}
							getAccessToken={getAccessToken}
						/>
					))}
				</List>
			)}
		</Card>
	);
};
