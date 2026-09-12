import type { CreateSchoolRequest, School } from "../../types";

export const ADMIN_ROLE = "Admin" as const;

export const EMPTY_FORM: CreateSchoolRequest = {
	name: "",
	code: "",
	address: "",
	phoneNumber: "",
	email: "",
	website: "",
	description: "",
	attendanceSpreadsheetId: "",
};

export interface SchoolRowProps {
	school: School;
	index: number;
	canDeleteSchool: boolean;
	isDeleting: boolean;
	isCurrentDeleting: boolean;
	onSelect: (school: School) => void;
	onEdit: (school: School) => void;
	onDelete: (school: School) => void;
}

export interface SchoolTableProps {
	schools: School[];
	isLoading: boolean;
	canDeleteSchool: boolean;
	isDeleting: boolean;
	schoolToDelete: School | null;
	onSelectSchool: (school: School) => void;
	onEditSchool: (school: School) => void;
	onDeleteSchool: (school: School) => void;
	onOpenAddModal: () => void;
	hasActiveFilters?: boolean;
	onResetFilters?: () => void;
}

export interface SchoolFormModalProps {
	open: boolean;
	isSubmitting: boolean;
	isAdmin: boolean;
	editingSchool: School | null;
	onClose: () => void;
	onSubmit: (data: CreateSchoolRequest) => Promise<void> | void;
}

export interface DeleteSchoolDialogProps {
	open: boolean;
	isDeleting: boolean;
	schoolToDelete: School | null;
	onClose: () => void;
	onConfirmDelete: () => Promise<void> | void;
}

export type SchoolStatusFilter = "all" | "active" | "inactive";

export interface SchoolActionToolbarProps {
	onOpenAddModal: () => void;
	statusFilter: SchoolStatusFilter;
	onStatusFilterChange: (status: SchoolStatusFilter) => void;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (isActive: boolean) => void;
	totalCount?: number;
	displayedCount?: number;
}
