import type { Student } from "../../../types/student.types";

export const detectHeader = (
	rows: Array<Array<string | number | undefined>>,
): boolean => {
	if (rows.length === 0) return false;
	const normalize = (value: string | number | undefined): string =>
		String(value ?? "")
			.trim()
			.toLowerCase();
	const firstCol = normalize(rows[0]?.[0]);
	const secondCol = normalize(rows[0]?.[1]);
	return (
		(firstCol.includes("ho") ||
			firstCol.includes("họ") ||
			firstCol.includes("middle")) &&
		(secondCol.includes("ten") ||
			secondCol.includes("tên") ||
			secondCol.includes("first"))
	);
};

export const mapRowsToTempStudents = (
	rows: Array<Array<string | number | undefined>>,
): Student[] => {
	const startRowIndex = detectHeader(rows) ? 1 : 0;
	return rows
		.slice(startRowIndex)
		.map((row, index) => {
			const middleName = String(row[0] ?? "").trim();
			const firstName = String(row[1] ?? "").trim();
			if (!firstName) return null;
			return {
				id: `temp-${Date.now()}-${index + 1}`,
				middleName,
				firstName,
				status: "Active",
				thi: false,
				isActive: true,
				gradingApiEndpoint: String(row[2] ?? "").trim(),
			} as Student;
		})
		.filter((student): student is Student => student !== null);
};

export const parsePastedRows = (rawText: string): string[][] =>
	rawText
		.split(/\r?\n/)
		.filter((line) => line.trim().length > 0)
		.map((line) => {
			if (line.includes("\t")) {
				return line.split("\t").map((cell) => cell.trim());
			}
			return line
				.trim()
				.split(/\s{2,}/)
				.map((cell) => cell.trim());
		});
