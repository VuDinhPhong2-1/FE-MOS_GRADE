import type { School } from "../../types";
import type { Class, CreateClassRequest } from "../../types/class.types";

export interface ClassListProps {
	selectedSchool: School;
	onBackToSchools?: () => void;
}

export type ClassFormData = CreateClassRequest;

export interface ClassPermissions {
	canCreateClass: boolean;
	canManageClass: (cls: Class) => boolean;
	canHandoverClass: (cls: Class) => boolean;
}

export type ClassStatusFilter = "all" | "active" | "inactive";

export interface ClassActionToolbarProps {
	onOpenAddModal: () => void;
	canCreateClass: boolean;
	statusFilter: ClassStatusFilter;
	onStatusFilterChange: (status: ClassStatusFilter) => void;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (isActive: boolean) => void;
	selectedGradeFilter: string;
	onGradeFilterChange: (grade: string) => void;
	onBackToSchools?: () => void;
	totalCount?: number;
	displayedCount?: number;
}
