export const queryKeys = {
	schools: {
		all: ["schools"] as const,
		list: () => [...queryKeys.schools.all, "list"] as const,
	},
	classes: {
		all: ["classes"] as const,
		bySchool: (schoolId: string) =>
			[...queryKeys.classes.all, "school", schoolId] as const,
		teachers: () => [...queryKeys.classes.all, "teachers"] as const,
	},
	students: {
		all: ["students"] as const,
		byClass: (classId: string) =>
			[...queryKeys.students.all, "class", classId] as const,
		assignments: (classId: string) =>
			[...queryKeys.students.all, "assignments", classId] as const,
	},
	analytics: {
		all: ["analytics"] as const,
		classOverview: (classId: string) =>
			[...queryKeys.analytics.all, "class-overview", classId] as const,
		weakTasks: (
			classId: string,
			projectEndpoint?: string,
			top?: number,
			assignmentIds: string[] = [],
		) =>
			[
				...queryKeys.analytics.all,
				"weak-tasks",
				classId,
				projectEndpoint || "all",
				top ?? 10,
				[...new Set(assignmentIds)].sort(),
			] as const,
	},
	submissionPortals: {
		all: (userId: string) => ["submission-portals", userId] as const,
		list: (userId: string) =>
			[...queryKeys.submissionPortals.all(userId), "list"] as const,
		teacherClasses: (userId: string) =>
			[...queryKeys.submissionPortals.all(userId), "teacher-classes"] as const,
		schools: (userId: string) =>
			[...queryKeys.submissionPortals.all(userId), "schools"] as const,
		alerts: (userId: string, portalId: string) =>
			[...queryKeys.submissionPortals.all(userId), "alerts", portalId] as const,
		logs: (userId: string, portalId: string) =>
			[...queryKeys.submissionPortals.all(userId), "logs", portalId] as const,
	},
};
