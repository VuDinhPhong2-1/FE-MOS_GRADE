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
	if (level === "A")
		return "bg-m3-tertiary-container text-m3-on-tertiary-container";
	if (level === "B")
		return "bg-m3-secondary-container text-m3-on-secondary-container";
	if (level === "C")
		return "bg-m3-primary-container text-m3-on-primary-container";
	if (level === "D") return "bg-m3-error-container text-m3-on-error-container";
	return "bg-m3-surface-container-high text-m3-on-surface-variant";
};
