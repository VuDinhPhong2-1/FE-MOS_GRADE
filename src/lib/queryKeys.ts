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
};
