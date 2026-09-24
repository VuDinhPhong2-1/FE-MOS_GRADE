import type { PublicPortalAssignment } from "../../../types/submission-portal.types";

export interface SubjectMetaItem {
	label: string;
	icon: string;
	accent: string;
}

export const subjectMeta: Record<
	PublicPortalAssignment["subject"],
	SubjectMetaItem
> = {
	excel: {
		label: "Excel",
		icon: "📗",
		accent: "bg-m3-primary-container text-m3-on-primary-container",
	},
	word: {
		label: "Word",
		icon: "📘",
		accent: "bg-m3-secondary-container text-m3-on-secondary-container",
	},
	ppt: {
		label: "PowerPoint",
		icon: "📙",
		accent: "bg-m3-tertiary-container text-m3-on-tertiary-container",
	},
};

export const expectedExtensionsBySubject: Record<
	PublicPortalAssignment["subject"],
	string[]
> = {
	excel: [".xlsx", ".xlsm", ".xls"],
	word: [".docx", ".docm", ".doc"],
	ppt: [".pptx", ".pptm", ".ppt"],
};
