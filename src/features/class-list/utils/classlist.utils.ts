import { ApiServiceError } from "../../../services/class.service";

export const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;
export const VIETNAMESE_TONE_MARKS_REGEX = /[\u0300-\u036f]/g;

export const GRADE_OPTIONS = [
	{ label: "-- Không chọn khối --", value: "" },
	{ label: "Khối 10", value: "10" },
	{ label: "Khối 11", value: "11" },
	{ label: "Khối 12", value: "12" },
];

export const normalizeSearchText = (value: string): string =>
	value
		.normalize("NFD")
		.replace(VIETNAMESE_TONE_MARKS_REGEX, "")
		.toLowerCase()
		.trim();

export const getGradeOrderValue = (grade?: string): number | null => {
	if (!grade) return null;
	const match = grade.match(/\d+/);
	if (!match) return null;

	const gradeValue = Number.parseInt(match[0], 10);
	return Number.isNaN(gradeValue) ? null : gradeValue;
};

export const mapClassApiError = (
	err: unknown,
	onUnauthorized?: () => void,
): string => {
	if (err instanceof ApiServiceError) {
		if (err.status === 401) {
			if (onUnauthorized) {
				onUnauthorized();
			} else {
				window.location.href = "/login";
			}
			return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
		}
		if (err.status === 403) return "Bạn chỉ có quyền xem lớp này.";
		if (err.status === 404) return "Không tìm thấy trường.";
		if (err.status === 400) return err.message || "Dữ liệu không hợp lệ.";
		if (err.status >= 500) return "Có lỗi hệ thống, vui lòng thử lại.";
		return err.message || "Có lỗi xảy ra.";
	}

	if (err instanceof Error) return err.message;
	return "Có lỗi xảy ra.";
};
