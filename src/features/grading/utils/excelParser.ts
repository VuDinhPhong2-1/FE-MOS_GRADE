import * as XLSX from "xlsx-js-style";

export const isWorkbookTitleReadable = (fileName: string): boolean => {
	const normalized = fileName.toLowerCase();
	return normalized.endsWith(".xlsx") || normalized.endsWith(".xlsm");
};

export const readWorkbookTitle = async (file: File): Promise<string> => {
	if (!isWorkbookTitleReadable(file.name)) return "";

	try {
		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer, {
			type: "array",
			bookProps: true,
			bookSheets: true,
		});
		const title = workbook.Props?.Title;
		return typeof title === "string" ? title.trim() : "";
	} catch {
		return "";
	}
};
