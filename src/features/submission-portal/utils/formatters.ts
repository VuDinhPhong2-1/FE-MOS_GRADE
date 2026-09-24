export const formatDateTime = (value?: string): string =>
	value ? new Date(value).toLocaleString("vi-VN") : "Không giới hạn";

export const formatFileSize = (size: number): string =>
	`${(size / 1024 / 1024).toFixed(2)} MB`;

export const formatScore = (value?: number): string => {
	if (typeof value !== "number" || !Number.isFinite(value)) return "0";
	return Number(value.toFixed(2)).toString();
};
