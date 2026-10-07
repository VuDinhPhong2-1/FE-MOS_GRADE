import { useCallback, useState } from "react";
import type {
	GradingRuleSet,
	ProjectXmlRule,
	SpecialCondition,
	TaskXmlRule,
	XmlGradingCondition,
} from "../../../types/xml-grading-rules.types";
import {
	defaultSpecialConditionFeedback,
	emptyCondition,
	emptyProject,
	emptyTask,
	hasCustomFeedback,
} from "../utils/xml-rule-helpers";

export const useRuleEditor = (
	selected: GradingRuleSet,
	updateSelected: (
		updater: (current: GradingRuleSet) => GradingRuleSet,
	) => void,
) => {
	const [expandedProjects, setExpandedProjects] = useState<
		Record<number, boolean>
	>({});
	const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
		{},
	);
	const [expandedSpecialConditions, setExpandedSpecialConditions] = useState<
		Record<string, boolean>
	>({});
	const [expandedConditionBasics, setExpandedConditionBasics] = useState<
		Record<string, boolean>
	>({});
	const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});
	const [viewRawJson, setViewRawJson] = useState(false);

	const toggleProject = useCallback((index: number) => {
		setExpandedProjects((prev) => ({
			...prev,
			[index]: !(prev[index] ?? false),
		}));
	}, []);

	const toggleTask = useCallback((key: string) => {
		setExpandedTasks((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));
	}, []);

	const toggleSpecialCondition = useCallback((key: string) => {
		setExpandedSpecialConditions((prev) => ({
			...prev,
			[key]: !(prev[key] ?? true),
		}));
	}, []);

	const toggleConditionBasics = useCallback((key: string) => {
		setExpandedConditionBasics((prev) => ({
			...prev,
			[key]: !(prev[key] ?? false),
		}));
	}, []);

	const toggleAdvanced = useCallback((key: string) => {
		setShowAdvanced((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	const mutateProject = useCallback(
		(index: number, patch: Partial<ProjectXmlRule>) => {
			updateSelected((current) => ({
				...current,
				projects: current.projects.map((project, i) =>
					i === index ? { ...project, ...patch } : project,
				),
			}));
		},
		[updateSelected],
	);

	const mutateTask = useCallback(
		(pi: number, ti: number, patch: Partial<TaskXmlRule>) => {
			updateSelected((current) => ({
				...current,
				projects: current.projects.map((project, projectIndex) =>
					projectIndex !== pi
						? project
						: {
								...project,
								tasks: project.tasks.map((task, taskIndex) =>
									taskIndex === ti ? { ...task, ...patch } : task,
								),
							},
				),
			}));
		},
		[updateSelected],
	);

	const mutateCondition = useCallback(
		(
			pi: number,
			ti: number,
			ci: number,
			patch: Partial<XmlGradingCondition>,
		) => {
			updateSelected((current) => ({
				...current,
				projects: current.projects.map((project, projectIndex) =>
					projectIndex !== pi
						? project
						: {
								...project,
								tasks: project.tasks.map((task, taskIndex) =>
									taskIndex !== ti
										? task
										: {
												...task,
												conditions: task.conditions.map(
													(condition, conditionIndex) =>
														conditionIndex === ci
															? { ...condition, ...patch }
															: condition,
												),
											},
								),
							},
				),
			}));
		},
		[updateSelected],
	);

	const updateTaskSpecialCondition = useCallback(
		(pi: number, ti: number, specialCondition?: SpecialCondition) => {
			const nextSpecialCondition =
				specialCondition && !hasCustomFeedback(specialCondition.feedback)
					? {
							...specialCondition,
							feedback: defaultSpecialConditionFeedback(specialCondition.type),
						}
					: specialCondition;

			mutateTask(pi, ti, {
				specialCondition: nextSpecialCondition,
			});
		},
		[mutateTask],
	);

	const addProject = useCallback(() => {
		updateSelected((current) => {
			const newProjects = [...current.projects, emptyProject()];
			setExpandedProjects((prev) => ({
				...prev,
				[newProjects.length - 1]: true,
			}));
			return { ...current, projects: newProjects };
		});
	}, [updateSelected]);

	const removeProject = useCallback(
		(pi: number) => {
			updateSelected((current) => ({
				...current,
				projects: current.projects.filter((_, i) => i !== pi),
			}));
		},
		[updateSelected],
	);

	const addTask = useCallback(
		(pi: number) => {
			mutateProject(pi, {
				tasks: [...(selected.projects[pi]?.tasks ?? []), emptyTask()],
			});
		},
		[mutateProject, selected.projects],
	);

	const removeTask = useCallback(
		(pi: number, ti: number) => {
			mutateProject(pi, {
				tasks: (selected.projects[pi]?.tasks ?? []).filter((_, i) => i !== ti),
			});
		},
		[mutateProject, selected.projects],
	);

	const addCondition = useCallback(
		(pi: number, ti: number) => {
			const currentTask = selected.projects[pi]?.tasks[ti];
			if (!currentTask) return;
			mutateTask(pi, ti, {
				conditions: [...currentTask.conditions, emptyCondition()],
			});
		},
		[mutateTask, selected.projects],
	);

	const removeCondition = useCallback(
		(pi: number, ti: number, ci: number) => {
			const currentTask = selected.projects[pi]?.tasks[ti];
			if (!currentTask) return;
			mutateTask(pi, ti, {
				conditions: currentTask.conditions.filter((_, i) => i !== ci),
			});
		},
		[mutateTask, selected.projects],
	);

	return {
		expandedProjects,
		setExpandedProjects,
		expandedTasks,
		setExpandedTasks,
		expandedSpecialConditions,
		setExpandedSpecialConditions,
		expandedConditionBasics,
		setExpandedConditionBasics,
		showAdvanced,
		setShowAdvanced,
		viewRawJson,
		setViewRawJson,
		toggleProject,
		toggleTask,
		toggleSpecialCondition,
		toggleConditionBasics,
		toggleAdvanced,
		mutateProject,
		mutateTask,
		mutateCondition,
		updateTaskSpecialCondition,
		addProject,
		removeProject,
		addTask,
		removeTask,
		addCondition,
		removeCondition,
	};
};
