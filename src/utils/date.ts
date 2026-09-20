export interface WeekProgressInfo {
	/** Ngày bắt đầu tuần (Thứ Hai) định dạng dd/MM/yyyy */
	weekStartFormatted: string;
	/** Ngày kết thúc tuần (Chủ Nhật) định dạng dd/MM/yyyy */
	weekEndFormatted: string;
	/** Tên thứ hiện tại (ví dụ: "Thứ Hai", "Thứ Sáu", "Chủ Nhật") */
	currentWeekday: string;
	/** Thứ tự ngày trong tuần (1 cho Thứ Hai, 7 cho Chủ Nhật) */
	dayInWeek: number;
	/** Tỷ lệ phần trăm tiến trình thời gian thực trong tuần (0 - 100) */
	percent: number;
	/** Chuỗi hiển thị khoảng ngày tuần: "Tuần: dd/MM/yyyy đến dd/MM/yyyy" */
	weekRangeText: string;
}

const VI_WEEKDAYS: Record<number, string> = {
	0: "Chủ Nhật",
	1: "Thứ Hai",
	2: "Thứ Ba",
	3: "Thứ Tư",
	4: "Thứ Năm",
	5: "Thứ Sáu",
	6: "Thứ Bảy",
};

/**
 * Tính toán thông tin và tiến trình tuần lễ (Thứ Hai 00:00:00 đến Chủ Nhật 23:59:59)
 */
export function getWeekProgressInfo(
	currentDate: Date = new Date(),
): WeekProgressInfo {
	const now = currentDate;
	const day = now.getDay(); // 0 = Chủ Nhật, 1 = Thứ Hai, ..., 6 = Thứ Bảy
	const diffToMonday = (day + 6) % 7; // 0 = Thứ Hai, ..., 6 = Chủ Nhật

	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - diffToMonday);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekStart.getDate() + 6);
	weekEnd.setHours(23, 59, 59, 999);

	const pad = (num: number) => String(num).padStart(2, "0");
	const formatViDate = (d: Date) =>
		`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

	const weekStartFormatted = formatViDate(weekStart);
	const weekEndFormatted = formatViDate(weekEnd);

	const totalWeekMs = 7 * 24 * 60 * 60 * 1000;
	const elapsedMs = Math.max(
		0,
		Math.min(totalWeekMs, now.getTime() - weekStart.getTime()),
	);
	const percent = Math.min(
		100,
		Math.max(0, Math.round((elapsedMs / totalWeekMs) * 100)),
	);

	return {
		weekStartFormatted,
		weekEndFormatted,
		currentWeekday: VI_WEEKDAYS[day] ?? "Hôm nay",
		dayInWeek: diffToMonday + 1,
		percent,
		weekRangeText: `Tuần: ${weekStartFormatted} đến ${weekEndFormatted}`,
	};
}
