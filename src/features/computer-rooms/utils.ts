import type { ComputerRoomFormState } from "./types";

export const createDefaultRoomForm = (
	schoolId = "",
): ComputerRoomFormState => ({
	schoolId,
	name: "",
	studentMachineCount: "30",
	teacherMachineCount: "1",
	brokenMachineCount: "0",
	brokenMachinesDetail: "",
	netSupportStatus: "Tốt",
	audioStatus: "Tốt",
	coolingStatus: "Tốt",
	devicesPoweredOffStatus: "Rồi",
	seatingOrderStatus: "Tốt",
	roomHygieneStatus: "Tốt",
	isActive: true,
});

export const parseNonNegativeInt = (value: string, fallback = 0): number => {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed < 0) {
		return fallback;
	}
	return parsed;
};

export const getRoomConditionTone = (value: string): string => {
	const normalized = value.trim().toLowerCase();
	if (
		normalized === "tốt" ||
		normalized === "rồi" ||
		normalized === "hoạt động tốt"
	) {
		return "bg-m3-primary-container text-m3-on-primary-container";
	}
	if (
		normalized === "trung bình" ||
		normalized === "cần lưu ý" ||
		normalized === "đang kiểm tra"
	) {
		return "bg-m3-tertiary-container text-m3-on-tertiary-container";
	}
	if (
		normalized === "kém" ||
		normalized === "hỏng" ||
		normalized === "chưa" ||
		normalized === "chưa bật"
	) {
		return "bg-m3-error-container text-m3-on-error-container";
	}
	return "bg-m3-surface-container-highest text-m3-on-surface-variant";
};
