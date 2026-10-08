import type {
	TeacherApprovalRequest,
	TeacherSummary,
} from "../../types/auth.types";

export type PermissionInfo = {
	label: string;
	description: string;
};

export type PermissionGroup = {
	id: string;
	title: string;
	description: string;
	icon: string;
	permissions: string[];
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
	"classes.view": {
		label: "Xem lớp",
		description: "Cho phép xem danh sách và thông tin lớp học.",
	},
	"classes.create": {
		label: "Tạo lớp",
		description: "Cho phép tạo lớp học mới.",
	},
	"classes.edit": {
		label: "Sửa lớp",
		description: "Cho phép cập nhật thông tin, học sinh và bàn giao lớp.",
	},
	"classes.delete": {
		label: "Xóa lớp",
		description: "Cho phép xóa lớp học.",
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
	"bonuspoints.view": {
		label: "Xem điểm cộng",
		description: "Cho phép xem điểm cộng của học sinh/lớp.",
	},
	"bonuspoints.create": {
		label: "Tạo điểm cộng",
		description: "Cho phép thêm điểm cộng cho học sinh.",
	},
	"bonuspoints.edit": {
		label: "Sửa điểm cộng",
		description: "Cho phép chỉnh sửa bản ghi điểm cộng.",
	},
	"bonuspoints.delete": {
		label: "Xóa điểm cộng",
		description: "Cho phép xóa bản ghi điểm cộng.",
	},
	"computerrooms.view": {
		label: "Xem phòng máy",
		description: "Cho phép xem danh sách và chi tiết phòng máy.",
	},
	"computerrooms.create": {
		label: "Tạo phòng máy",
		description: "Cho phép thêm phòng máy mới.",
	},
	"computerrooms.edit": {
		label: "Sửa phòng máy",
		description: "Cho phép cập nhật thông tin phòng máy.",
	},
	"computerrooms.delete": {
		label: "Xóa phòng máy",
		description: "Cho phép xóa phòng máy.",
	},
	"schedules.view": {
		label: "Xem lịch dạy",
		description: "Cho phép xem lịch dạy theo tuần và chi tiết lịch.",
	},
	"schedules.create": {
		label: "Tạo lịch dạy",
		description: "Cho phép tạo lịch dạy mới.",
	},
	"schedules.edit": {
		label: "Sửa lịch dạy",
		description: "Cho phép cập nhật lịch dạy.",
	},
	"schedules.delete": {
		label: "Xóa lịch dạy",
		description: "Cho phép xóa lịch dạy.",
	},
	"attendance.manage": {
		label: "Quản lý điểm danh",
		description: "Cho phép xem và lưu điểm danh/báo cáo buổi học.",
	},
	"googlesheet.sync": {
		label: "Đồng bộ Google Sheet",
		description: "Cho phép đồng bộ điểm danh, xếp loại và ghi chú lên Google Sheet.",
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

export const PERMISSION_GROUPS: PermissionGroup[] = [
	{
		id: "users",
		title: "Quản lý người dùng",
		description: "Tài khoản, giáo viên, duyệt yêu cầu và phân quyền người dùng.",
		icon: "manage_accounts",
		permissions: ["users.view", "users.create", "users.edit", "users.delete"],
	},
	{
		id: "students",
		title: "Quản lý học sinh",
		description: "Hồ sơ học sinh, thêm/sửa/xóa và nhập dữ liệu học sinh.",
		icon: "school",
		permissions: [
			"students.view",
			"students.create",
			"students.edit",
			"students.delete",
			"students.import",
			"students.bulkimport",
		],
	},
	{
		id: "schools",
		title: "Quản lý trường học",
		description: "Danh sách trường, thông tin trường và cấu hình liên quan.",
		icon: "domain",
		permissions: [
			"schools.view",
			"schools.create",
			"schools.edit",
			"schools.delete",
		],
	},
	{
		id: "classes",
		title: "Quản lý lớp học",
		description: "Lớp học, học sinh trong lớp và bàn giao lớp cho giáo viên.",
		icon: "class",
		permissions: [
			"classes.view",
			"classes.create",
			"classes.edit",
			"classes.delete",
		],
	},
	{
		id: "computerrooms",
		title: "Quản lý phòng máy",
		description: "Danh sách phòng máy dùng cho lịch dạy và vận hành lớp.",
		icon: "desktop_windows",
		permissions: [
			"computerrooms.view",
			"computerrooms.create",
			"computerrooms.edit",
			"computerrooms.delete",
		],
	},
	{
		id: "schedules_attendance",
		title: "Lịch dạy & Điểm danh",
		description: "Lịch dạy theo tuần, báo cáo buổi học và điểm danh học sinh.",
		icon: "calendar_month",
		permissions: [
			"schedules.view",
			"schedules.create",
			"schedules.edit",
			"schedules.delete",
			"attendance.manage",
		],
	},
	{
		id: "bonuspoints",
		title: "Quản lý điểm cộng",
		description: "Xem, thêm, sửa và xóa điểm cộng của học sinh trong lớp.",
		icon: "stars",
		permissions: [
			"bonuspoints.view",
			"bonuspoints.create",
			"bonuspoints.edit",
			"bonuspoints.delete",
		],
	},
	{
		id: "grades",
		title: "Quản lý điểm số",
		description: "Điểm chấm bài, chỉnh sửa kết quả và xuất báo cáo điểm.",
		icon: "fact_check",
		permissions: [
			"grades.view",
			"grades.create",
			"grades.edit",
			"grades.delete",
			"grades.export",
		],
	},
	{
		id: "projects",
		title: "Quản lý bài tập & Project",
		description: "Bài tập, project chấm điểm và cổng nộp bài liên quan.",
		icon: "assignment",
		permissions: [
			"projects.view",
			"projects.create",
			"projects.edit",
			"projects.delete",
		],
	},
	{
		id: "integration",
		title: "Tích hợp & Đồng bộ",
		description: "Các thao tác ghi dữ liệu ra hệ thống bên ngoài như Google Sheet.",
		icon: "cloud_sync",
		permissions: ["googlesheet.sync"],
	},
	{
		id: "xmlrules",
		title: "Cấu hình chấm điểm XML",
		description: "Bộ rule XML, điều kiện chấm điểm và cấu hình chấm tự động.",
		icon: "code",
		permissions: [
			"xmlrules.view",
			"xmlrules.create",
			"xmlrules.edit",
			"xmlrules.delete",
		],
	},
	{
		id: "system",
		title: "Quản trị hệ thống",
		description: "Nhật ký hệ thống và cấu hình vận hành cấp quản trị.",
		icon: "settings",
		permissions: ["system.logs.view", "system.settings.manage"],
	},
];

export const ALL_KNOWN_PERMISSIONS = PERMISSION_GROUPS.flatMap(
	(group) => group.permissions,
);

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
	onToggleGroup: (permissions: string[], select: boolean) => void;
	onSelectAll: () => void;
	onClearAll: () => void;
	onSave: () => Promise<void>;
}

export interface PermissionTabsProps {
	activeTab: ActiveTab;
	onTabChange: (tab: ActiveTab) => void;
	pendingRequestsCount?: number;
}
