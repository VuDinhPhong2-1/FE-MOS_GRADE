export const formatDateTime = (value?: string): string =>
	value ? new Date(value).toLocaleString("vi-VN") : "Không giới hạn";

export const formatFileSize = (size: number): string =>
	`${(size / 1024 / 1024).toFixed(2)} MB`;

export const formatScore = (value?: number): string => {
	if (typeof value !== "number" || !Number.isFinite(value)) return "0";
	return Number(value.toFixed(2)).toString();
};

export const formatShortTime = (value?: Date | string | null): string => {
	if (!value) return "";
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};
