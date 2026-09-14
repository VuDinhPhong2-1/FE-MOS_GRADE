import type {
	TeacherApprovalRequest,
	TeacherSummary,
} from "../../types/auth.types";

export type PermissionInfo = {
	label: string;
	description: string;
};

export type TeacherRequestStatusFilter =
	| "pending"
	| "approved"
	| "rejected"
	| "all";
export type ActiveTab = "requests" | "permissions";

export const PERMISSION_INFO_MAP: Record<string, PermissionInfo> = {
	"users.view": {
		label: "Xem danh sách người dùng",
		description: "Cho phép xem danh sách tài khoản trong hệ thống.",
	},
	"users.create": {
		label: "Tạo người dùng",
		description: "Cho phép tạo tài khoản người dùng mới.",
	},
	"users.edit": {
		label: "Sửa người dùng",
		description: "Cho phép chỉnh sửa thông tin và quyền của người dùng.",
	},
	"users.delete": {
		label: "Xóa người dùng",
		description: "Cho phép xóa tài khoản người dùng.",
	},
	"grades.view": {
		label: "Xem điểm",
		description: "Cho phép xem điểm và kết quả chấm.",
	},
	"grades.create": {
		label: "Nhập điểm",
		description: "Cho phép tạo mới điểm và kết quả chấm.",
	},
	"grades.edit": {
		label: "Sửa điểm",
		description: "Cho phép chỉnh sửa điểm đã lưu.",
	},
	"grades.delete": {
		label: "Xóa điểm",
		description: "Cho phép xóa bản ghi điểm.",
	},
	"grades.export": {
		label: "Xuất điểm",
		description: "Cho phép xuất dữ liệu điểm ra file báo cáo.",
	},
	"projects.view": {
		label: "Xem project",
		description: "Cho phép xem danh sách project/bài tập chấm.",
	},
	"projects.create": {
		label: "Tạo project",
		description: "Cho phép tạo mới project/bài tập.",
	},
	"projects.edit": {
		label: "Sửa project",
		description: "Cho phép cập nhật thông tin project/bài tập.",
	},
	"projects.delete": {
		label: "Xóa project",
		description: "Cho phép xóa project/bài tập.",
	},
	"schools.view": {
		label: "Xem trường",
		description: "Cho phép xem danh sách và thông tin trường.",
	},
	"schools.create": {
		label: "Tạo trường",
		description: "Cho phép tạo mới trường học.",
	},
	"schools.edit": {
		label: "Sửa trường",
		description: "Cho phép chỉnh sửa thông tin trường.",
	},
	"schools.delete": {
		label: "Xóa trường",
		description: "Cho phép xóa trường học.",
	},
	"students.view": {
		label: "Danh sách học sinh",
		description: "Cho phép xem danh sách và hồ sơ học sinh.",
	},
	"students.create": {
		label: "Tạo học sinh",
		description: "Cho phép thêm học sinh mới.",
	},
	"students.edit": {
		label: "Sửa học sinh",
		description: "Cho phép chỉnh sửa thông tin học sinh.",
	},
	"students.delete": {
		label: "Xóa học sinh",
		description: "Cho phép xóa học sinh khỏi hệ thống.",
	},
	"students.import": {
		label: "Import học sinh",
		description: "Cho phép nhập học sinh từ file.",
	},
	"students.bulkimport": {
		label: "Bulk import học sinh",
		description: "Cho phép nhập hàng loạt học sinh.",
	},
	"system.logs.view": {
		label: "Xem log hệ thống",
		description: "Cho phép xem nhật ký hệ thống.",
	},
	"system.settings.manage": {
		label: "Quản lý cấu hình hệ thống",
		description: "Cho phép thay đổi cấu hình hệ thống.",
	},
	"xmlrules.view": {
		label: "Xem cấu hình chấm điểm XML",
		description: "Cho phép xem danh sách rule/điều kiện chấm điểm XML.",
	},
	"xmlrules.create": {
		label: "Tạo cấu hình chấm điểm XML",
		description: "Cho phép tạo mới bộ rule chấm điểm XML.",
	},
	"xmlrules.edit": {
		label: "Sửa cấu hình chấm điểm XML",
		description: "Cho phép chỉnh sửa rule/điều kiện chấm điểm XML.",
	},
	"xmlrules.delete": {
		label: "Xóa cấu hình chấm điểm XML",
		description: "Cho phép xóa rule/bộ chấm điểm XML.",
	},
};

export const getPermissionInfo = (permission: string): PermissionInfo => {
	const mapped = PERMISSION_INFO_MAP[permission];
	if (mapped) return mapped;

	return {
		label: permission,
		description: "Quyền hệ thống chưa có mô tả chi tiết.",
	};
};

export const formatDateTime = (value?: string) => {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString("vi-VN");
};

export const getStatusLabel = (status?: string) => {
	if (status === "Approved") return "Đã duyệt";
	if (status === "Rejected") return "Đã từ chối";
	return "Đang chờ";
};

export interface PermissionStatusBadgeProps {
	status?: string;
}

export interface TeacherRequestCardProps {
	request: TeacherApprovalRequest;
	decisionNote: string;
	isBusy: boolean;
	onNoteChange: (userId: string, note: string) => void;
	onDecide: (
		request: TeacherApprovalRequest,
		decision: "approve" | "reject",
	) => Promise<void>;
	value?: string;
	_listIndex?: number;
}

export interface TeacherRequestListProps {
	requests: TeacherApprovalRequest[];
	requestLoading: boolean;
	requestStatus: TeacherRequestStatusFilter;
	onRequestStatusChange: (status: TeacherRequestStatusFilter) => void;
	decisionNotes: Record<string, string>;
	decidingUserId: string;
	onNoteChange: (userId: string, note: string) => void;
	onDecide: (
		request: TeacherApprovalRequest,
		decision: "approve" | "reject",
	) => Promise<void>;
}

export interface TeacherListPanelProps {
	teachers: TeacherSummary[];
	selectedTeacherId: string;
	loading: boolean;
	searchKeyword: string;
	onSearchChange: (keyword: string) => void;
	onSelectTeacher: (teacherId: string) => void;
}

export interface PermissionItemProps {
	permission: string;
	checked: boolean;
	disabled?: boolean;
	onToggle: (permission: string) => void;
}

export interface PermissionPanelProps {
	selectedTeacher: TeacherSummary | null;
	permissionCatalog: string[];
	selectedPermissions: string[];
	loading: boolean;
	saving: boolean;
	onTogglePermission: (permission: string) => void;
	onSelectAll: () => void;
	onClearAll: () => void;
	onSave: () => Promise<void>;
}

export interface PermissionTabsProps {
	activeTab: ActiveTab;
	onTabChange: (tab: ActiveTab) => void;
	pendingRequestsCount?: number;
}
