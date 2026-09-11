import type { School } from "../../types";
import type { Class, CreateClassRequest } from "../../types/class.types";

export interface ClassListProps {
	selectedSchool: School;
}

export type ClassFormData = CreateClassRequest;

export interface ClassPermissions {
	canCreateClass: boolean;
	canManageClass: (cls: Class) => boolean;
	canHandoverClass: (cls: Class) => boolean;
}
