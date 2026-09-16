import type { ComputerRoom } from "../../types/computer-room.types";
import type { School } from "../../types/school.types";

export interface ComputerRoomFormState {
	schoolId: string;
	name: string;
	studentMachineCount: string;
	teacherMachineCount: string;
	brokenMachineCount: string;
	brokenMachinesDetail: string;
	netSupportStatus: string;
	audioStatus: string;
	coolingStatus: string;
	devicesPoweredOffStatus: string;
	seatingOrderStatus: string;
	roomHygieneStatus: string;
	isActive: boolean;
}

export interface ComputerRoomSummary {
	totalRooms: number;
	activeRooms: number;
	totalMachines: number;
	availableMachines: number;
}

export type RoomFilterStatus = "all" | "active" | "inactive";

export interface RoomActionToolbarProps {
	onOpenAddModal: () => void;
	statusFilter: RoomFilterStatus;
	onStatusFilterChange: (status: RoomFilterStatus) => void;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
	isSearchActive: boolean;
	onOpenSearch: () => void;
	onCloseSearch: () => void;
	onSearchActiveChange: (active: boolean) => void;
	onBackToSchedule?: () => void;
}

export interface RoomFormModalProps {
	open: boolean;
	isEditing: boolean;
	roomForm: ComputerRoomFormState;
	roomFormMachinePreview: {
		totalMachines: number;
		availableMachines: number;
	};
	submitting: boolean;
	schools: School[];
	selectedSchool: School | null;
	onClose: () => void;
	onFieldChange: <K extends keyof ComputerRoomFormState>(
		field: K,
		value: ComputerRoomFormState[K],
	) => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export interface DeleteRoomDialogProps {
	open: boolean;
	room: ComputerRoom | null;
	isDeleting: boolean;
	onClose: () => void;
	onConfirm: () => void;
}
