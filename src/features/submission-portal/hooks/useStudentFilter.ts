import { useDeferredValue, useMemo, useState } from "react";
import type { PublicPortalStudent } from "../../../types/submission-portal.types";
import { normalizeText } from "../utils/grading";

export interface UseStudentFilterReturn {
	studentSearch: string;
	setStudentSearch: (search: string) => void;
	filteredStudents: PublicPortalStudent[];
	resetSearch: () => void;
}

export const useStudentFilter = (
	students: PublicPortalStudent[],
): UseStudentFilterReturn => {
	const [studentSearch, setStudentSearch] = useState("");
	const deferredSearch = useDeferredValue(studentSearch);

	const filteredStudents = useMemo(() => {
		const keyword = normalizeText(deferredSearch);
		if (!keyword) return students;
		return students.filter((student) =>
			normalizeText(student.fullName).includes(keyword),
		);
	}, [deferredSearch, students]);

	const resetSearch = () => setStudentSearch("");

	return {
		studentSearch,
		setStudentSearch,
		filteredStudents,
		resetSearch,
	};
};
