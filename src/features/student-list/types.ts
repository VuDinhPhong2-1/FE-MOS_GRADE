import type { Class } from "../../types/class.types";
import type { Student } from "../../types/student.types";

export interface StudentListProps {
	selectedClass: Class;
	readOnly?: boolean;
	onBack?: () => void;
}

export type CompetencyLevel = "" | "A" | "B" | "C" | "D";

export interface EditStudentForm {
	middleName: string;
	firstName: string;
	status: string;
	competencyLevel: CompetencyLevel;
	notes: string;
	thi: boolean;
	classId: string;
}

export interface AddStudentForm {
	middleName: string;
	firstName: string;
	status: string;
	competencyLevel: CompetencyLevel;
	notes: string;
	thi: boolean;
}

export type NameSortDirection = "none" | "asc" | "desc";
export type StatusSortDirection = "none" | "active-first" | "inactive-first";

export const VALID_STATUSES = ["Active", "Inactive"] as const;
export const VALID_COMPETENCY_LEVELS = ["A", "B", "C", "D"] as const;

export const vietnameseCollator = new Intl.Collator("vi", {
	sensitivity: "variant",
	numeric: true,
});

export const normalizeText = (value?: string): string =>
	(value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();

export const isStudentActive = (student: Student): boolean => {
	const normalizedStatus = normalizeText(student.status);
	if (normalizedStatus) {
		return normalizedStatus === "active";
	}
	return Boolean(student.isActive);
};

export const competencyBadgeClass = (level?: string): string => {
	if (level === "A") return "bg-emerald-100 text-emerald-700";
	if (level === "B") return "bg-blue-100 text-blue-700";
	if (level === "C") return "bg-amber-100 text-amber-700";
	if (level === "D") return "bg-rose-100 text-rose-700";
	return "bg-gray-100 text-gray-600";
};
