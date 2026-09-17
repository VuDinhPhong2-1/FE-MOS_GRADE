import { ApiServiceError } from "../../../services/class.service";

/**
 * Chuyển đổi lỗi khi tải dữ liệu bảng điểm lớp thành thông báo thân thiện với người dùng.
 */
export const mapLoadError = (error: unknown): string => {
	if (error instanceof ApiServiceError) {
		if (error.status === 403) {
			return "Bạn chỉ có quyền xem lớp này.";
		}

		if (error.status === 404) {
			return "Không tìm thấy lớp học.";
		}

		if (error.status >= 500) {
			return "Hệ thống đang bận, vui lòng thử lại.";
		}

		return error.message || "Không thể tải bảng điểm lớp.";
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Không thể tải bảng điểm lớp.";
};
