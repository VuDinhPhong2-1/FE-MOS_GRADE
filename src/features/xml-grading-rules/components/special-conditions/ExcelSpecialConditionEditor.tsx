import type React from "react";
import type { SpecialCondition } from "../../../../types/xml-grading-rules.types";
import { cleanTextareaLines } from "../../utils/xml-rule-helpers";

export interface ExcelSpecialConditionEditorProps {
	specialCondition: SpecialCondition;
	onChange: (specialCondition: SpecialCondition) => void;
}

const inputClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest";
const selectClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest cursor-pointer";
const textareaClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest min-h-[96px] resize-y";

type Exam02Field = { key: string; label: string; numeric?: boolean };
const EXAM02_FIELDS: Record<string, Exam02Field[]> = {
	excelClearContents: [{ key: "worksheetName", label: "Trang tính" }, { key: "definedName", label: "Tên vùng" }, { key: "range", label: "Phạm vi" }],
	excelRowHeight: [{ key: "worksheetName", label: "Trang tính" }, { key: "row", label: "Hàng", numeric: true }, { key: "height", label: "Chiều cao", numeric: true }],
	excelCellStyle: [{ key: "worksheetName", label: "Trang tính" }, { key: "cell", label: "Ô" }, { key: "styleName", label: "Tên kiểu ô" }],
	excelHeaderFooter: [{ key: "worksheetName", label: "Trang tính" }, { key: "rightFooterToken", label: "Trường Footer bên phải" }],
	excelTextImport: [{ key: "worksheetName", label: "Trang tính mới" }, { key: "expectedRange", label: "Phạm vi bảng" }, { key: "sourceFileName", label: "Tên tệp nguồn" }],
	excelRemoveHyperlink: [{ key: "worksheetName", label: "Trang tính" }, { key: "cell", label: "Ô" }, { key: "expectedText", label: "Văn bản giữ lại (tùy chọn)" }],
	excelCellText: [{ key: "worksheetName", label: "Trang tính" }, { key: "cell", label: "Ô" }, { key: "expectedText", label: "Văn bản yêu cầu" }],
	excelCellFormatMatch: [{ key: "sourceWorksheet", label: "Trang tính nguồn" }, { key: "sourceCell", label: "Ô nguồn" }, { key: "targetWorksheet", label: "Trang tính đích" }, { key: "targetCell", label: "Ô đích" }],
	excelAboveAverageFilter: [{ key: "worksheetName", label: "Trang tính" }, { key: "columnName", label: "Tên cột" }],
	excelQuickAccessEvidence: [{ key: "command", label: "Lệnh cần thêm" }],
	excelWebExportEvidence: [{ key: "fileName", label: "Tên tệp xuất" }],
	excelWrapText: [{ key: "worksheetName", label: "Trang tính" }, { key: "range", label: "Phạm vi" }],
	excelInsertColumn: [{ key: "worksheetName", label: "Trang tính" }, { key: "shiftedTableRange", label: "Phạm vi bảng sau khi chèn" }],
	excelSplitPanes: [{ key: "worksheetName", label: "Trang tính" }, { key: "ySplit", label: "Vị trí tách dọc", numeric: true }],
	excelChartSheetLocation: [{ key: "chartSheetName", label: "Tên chart sheet" }, { key: "chartType", label: "Loại biểu đồ XML" }],
};

export const ExcelSpecialConditionEditor: React.FC<
	ExcelSpecialConditionEditorProps
> = ({ specialCondition, onChange }) => {
	const updateConfig = (configKey: keyof SpecialCondition, patch: object) => {
		const currentConfig =
			(specialCondition[configKey] as Record<string, unknown> | undefined) ??
			{};
		onChange({
			...specialCondition,
			[configKey]: {
				...currentConfig,
				...patch,
			},
		});
	};

	if (specialCondition.type === "excelTableName") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelTableNameConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableNameConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Rental Rates"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File nguồn
					<input
						value={specialCondition.excelTableNameConfig?.sourceFile ?? ""}
						onChange={(e) =>
							updateConfig("excelTableNameConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="xl/tables/table1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên yêu cầu
					<input
						value={specialCondition.excelTableNameConfig?.expectedName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableNameConfig", {
								expectedName: e.target.value,
							})
						}
						placeholder="Rates"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên ban đầu
					<input
						value={specialCondition.excelTableNameConfig?.originalName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableNameConfig", {
								originalName: e.target.value,
							})
						}
						placeholder="Table1"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelTableNameConfig
								?.requireOriginalNameAbsent ?? true
						}
						onChange={(e) =>
							updateConfig("excelTableNameConfig", {
								requireOriginalNameAbsent: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Bắt buộc không còn tên ban đầu
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelWorksheetPageSetup") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelWorksheetPageSetupConfig?.worksheetName ??
							""
						}
						onChange={(e) =>
							updateConfig("excelWorksheetPageSetupConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Rental Rates"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File nguồn
					<input
						value={
							specialCondition.excelWorksheetPageSetupConfig?.sourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelWorksheetPageSetupConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="xl/worksheets/sheet1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Hướng trang
					<select
						value={
							specialCondition.excelWorksheetPageSetupConfig?.orientation ??
							"landscape"
						}
						onChange={(e) =>
							updateConfig("excelWorksheetPageSetupConfig", {
								orientation: e.target.value as "portrait" | "landscape",
							})
						}
						className={selectClass}
					>
						<option value="landscape">Ngang (Landscape)</option>
						<option value="portrait">Dọc (Portrait)</option>
					</select>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelClearCellFormatting") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-4">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelClearCellFormattingConfig?.worksheetName ??
							""
						}
						onChange={(e) =>
							updateConfig("excelClearCellFormattingConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Rental Rates"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File nguồn
					<input
						value={
							specialCondition.excelClearCellFormattingConfig?.sourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelClearCellFormattingConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="xl/worksheets/sheet1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vùng ô
					<input
						value={specialCondition.excelClearCellFormattingConfig?.range ?? ""}
						onChange={(e) =>
							updateConfig("excelClearCellFormattingConfig", {
								range: e.target.value,
							})
						}
						placeholder="A4:D4"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Mã style mặc định
					<input
						type="number"
						min={0}
						value={
							specialCondition.excelClearCellFormattingConfig?.defaultStyleId ??
							0
						}
						onChange={(e) =>
							updateConfig("excelClearCellFormattingConfig", {
								defaultStyleId: Number(e.target.value),
							})
						}
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelDataModelImport") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên file nguồn
					<input
						value={
							specialCondition.excelDataModelImportConfig?.sourceFileName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelDataModelImportConfig", {
								sourceFileName: e.target.value,
							})
						}
						placeholder="Accessories.csv"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet yêu cầu
					<input
						value={
							specialCondition.excelDataModelImportConfig
								?.expectedWorksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelDataModelImportConfig", {
								expectedWorksheetName: e.target.value,
							})
						}
						placeholder="Accessories"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên connection yêu cầu
					<input
						value={
							specialCondition.excelDataModelImportConfig
								?.expectedConnectionName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelDataModelImportConfig", {
								expectedConnectionName: e.target.value,
							})
						}
						placeholder="Accessories"
						className={inputClass}
					/>
				</label>
				<div className="flex flex-col justify-end gap-2">
					<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant">
						<input
							type="checkbox"
							checked={
								specialCondition.excelDataModelImportConfig
									?.requireConnection ?? true
							}
							onChange={(e) =>
								updateConfig("excelDataModelImportConfig", {
									requireConnection: e.target.checked,
								})
							}
							className="h-4 w-4 accent-m3-primary"
						/>
						Bắt buộc có connection
					</label>
					<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant">
						<input
							type="checkbox"
							checked={
								specialCondition.excelDataModelImportConfig
									?.requireImportedWorksheet ?? true
							}
							onChange={(e) =>
								updateConfig("excelDataModelImportConfig", {
									requireImportedWorksheet: e.target.checked,
								})
							}
							className="h-4 w-4 accent-m3-primary"
						/>
						Bắt buộc có worksheet nhập
					</label>
				</div>
			</div>
		);
	}

	if (specialCondition.type === "excelMergedRange") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelMergedRangeConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelMergedRangeConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Fishing"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vùng ô
					<input
						value={specialCondition.excelMergedRangeConfig?.range ?? ""}
						onChange={(e) =>
							updateConfig("excelMergedRangeConfig", { range: e.target.value })
						}
						placeholder="A1:E1"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelMergedRangeConfig
								?.requireNoHorizontalCenter ?? true
						}
						onChange={(e) =>
							updateConfig("excelMergedRangeConfig", {
								requireNoHorizontalCenter: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Không cho phép căn giữa ngang sau khi gộp ô
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelCellHyperlink") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelCellHyperlinkConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelCellHyperlinkConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Tents"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Ô
					<input
						value={specialCondition.excelCellHyperlinkConfig?.cell ?? ""}
						onChange={(e) =>
							updateConfig("excelCellHyperlinkConfig", { cell: e.target.value })
						}
						placeholder="B13"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vị trí liên kết nội bộ
					<input
						value={specialCondition.excelCellHyperlinkConfig?.location ?? ""}
						onChange={(e) =>
							updateConfig("excelCellHyperlinkConfig", {
								location: e.target.value,
							})
						}
						placeholder="Fishing!A4"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Văn bản hiển thị
					<input
						value={specialCondition.excelCellHyperlinkConfig?.display ?? ""}
						onChange={(e) =>
							updateConfig("excelCellHyperlinkConfig", {
								display: e.target.value,
							})
						}
						placeholder="Không bắt buộc"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelIconSetConditionalFormatting") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelIconSetConditionalFormattingConfig
								?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelIconSetConditionalFormattingConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Tents"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vùng ô
					<input
						value={
							specialCondition.excelIconSetConditionalFormattingConfig?.range ??
							""
						}
						onChange={(e) =>
							updateConfig("excelIconSetConditionalFormattingConfig", {
								range: e.target.value,
							})
						}
						placeholder="C4:C11"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Bộ biểu tượng
					<input
						value={
							specialCondition.excelIconSetConditionalFormattingConfig
								?.iconSet ?? ""
						}
						onChange={(e) =>
							updateConfig("excelIconSetConditionalFormattingConfig", {
								iconSet: e.target.value,
							})
						}
						placeholder="3Flags"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelTextReplacement") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelTextReplacementConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelTextReplacementConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Để trống = toàn workbook"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File nguồn
					<input
						value={
							specialCondition.excelTextReplacementConfig?.sourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelTextReplacementConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="xl/worksheets/sheet1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Văn bản cũ
					<input
						value={specialCondition.excelTextReplacementConfig?.oldText ?? ""}
						onChange={(e) =>
							updateConfig("excelTextReplacementConfig", {
								oldText: e.target.value,
							})
						}
						placeholder="Choco"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Văn bản mới
					<input
						value={specialCondition.excelTextReplacementConfig?.newText ?? ""}
						onChange={(e) =>
							updateConfig("excelTextReplacementConfig", {
								newText: e.target.value,
							})
						}
						placeholder="Chocolate"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Số lần tối thiểu văn bản mới
					<input
						type="number"
						min={1}
						value={
							specialCondition.excelTextReplacementConfig
								?.minNewTextOccurrences ?? 1
						}
						onChange={(e) =>
							updateConfig("excelTextReplacementConfig", {
								minNewTextOccurrences: e.target.value
									? Number(e.target.value)
									: 1,
							})
						}
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelPrintTitles") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelPrintTitlesConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelPrintTitlesConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Tents"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Hàng lặp lại ở đầu trang
					<input
						value={specialCondition.excelPrintTitlesConfig?.expectedRows ?? ""}
						onChange={(e) =>
							updateConfig("excelPrintTitlesConfig", {
								expectedRows: e.target.value,
							})
						}
						placeholder="1:3"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelNumberFormat") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelNumberFormatConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Costs"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vùng ô
					<input
						value={specialCondition.excelNumberFormatConfig?.range ?? ""}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", { range: e.target.value })
						}
						placeholder="B:E"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Loại định dạng
					<select
						value={
							specialCondition.excelNumberFormatConfig?.category ?? "number"
						}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								category: e.target.value as
									| "general"
									| "number"
									| "currency"
									| "accounting"
									| "percentage"
									| "date"
									| "time"
									| "custom",
							})
						}
						className={selectClass}
					>
						<option value="number">Số (Number)</option>
						<option value="currency">Tiền tệ (Currency)</option>
						<option value="accounting">Kế toán (Accounting)</option>
						<option value="percentage">Phần trăm (Percentage)</option>
						<option value="date">Ngày (Date)</option>
						<option value="time">Thời gian (Time)</option>
						<option value="general">Chung (General)</option>
						<option value="custom">Tùy chỉnh (Custom)</option>
					</select>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Số chữ số thập phân
					<input
						type="number"
						min={0}
						value={
							specialCondition.excelNumberFormatConfig?.decimalPlaces ?? ""
						}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								decimalPlaces:
									e.target.value === "" ? undefined : Number(e.target.value),
							})
						}
						placeholder="2"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Ký hiệu
					<input
						value={specialCondition.excelNumberFormatConfig?.symbol ?? ""}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								symbol: e.target.value,
							})
						}
						placeholder="$ / VND / để trống"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					numFmtId hợp lệ
					<input
						value={(
							specialCondition.excelNumberFormatConfig
								?.allowedNumberFormatIds ?? [1, 2, 3, 4]
						).join(", ")}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								allowedNumberFormatIds: e.target.value
									.split(",")
									.map((item) => Number(item.trim()))
									.filter((item) => Number.isFinite(item) && item > 0),
							})
						}
						placeholder="1, 2, 3, 4"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-3">
					<input
						type="checkbox"
						checked={
							specialCondition.excelNumberFormatConfig
								?.requireThousandsSeparator ?? false
						}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								requireThousandsSeparator: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Bắt buộc có dấu phân tách hàng nghìn
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelChartDataRange") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File XML biểu đồ
					<input
						value={
							specialCondition.excelChartDataRangeConfig?.chartSourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								chartSourceFile: e.target.value,
							})
						}
						placeholder="xl/charts/chart1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vùng thể loại (Category Range)
					<input
						value={
							specialCondition.excelChartDataRangeConfig
								?.expectedCategoryRange ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedCategoryRange: e.target.value,
							})
						}
						placeholder="Sheet1!$A$2:$A$10"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Vùng dữ liệu giá trị mong đợi (mỗi dòng 1 vùng)
					<textarea
						rows={3}
						value={(
							specialCondition.excelChartDataRangeConfig?.expectedValueRanges ??
							[]
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedValueRanges: cleanTextareaLines(
									e.target.value.split("\n"),
								),
							})
						}
						placeholder={"Sheet1!$B$2:$B$10\nSheet1!$C$2:$C$10"}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Tên series (mỗi dòng 1 series chú giải)
					<textarea
						rows={2}
						value={(
							specialCondition.excelChartDataRangeConfig?.expectedSeriesNames ??
							[]
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedSeriesNames: cleanTextareaLines(
									e.target.value.split("\n"),
								),
							})
						}
						placeholder={"Expense\nIncome"}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Nội dung nhãn cần có
					<input
						value={
							specialCondition.excelChartDataRangeConfig
								?.expectedCategoryText ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedCategoryText: e.target.value,
							})
						}
						placeholder="Giant Truck Bed Tent"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelChartDataRangeConfig
								?.requireNoExtraSeries !== false
						}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								requireNoExtraSeries: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Không cho thêm series/range ngoài dữ liệu yêu cầu
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelChartLegend") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File XML biểu đồ
					<input
						value={
							specialCondition.excelChartLegendConfig?.chartSourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartLegendConfig", {
								chartSourceFile: e.target.value,
							})
						}
						placeholder="xl/charts/chart1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vị trí chú giải (Legend Position)
					<select
						value={specialCondition.excelChartLegendConfig?.position ?? "r"}
						onChange={(e) =>
							updateConfig("excelChartLegendConfig", {
								position: e.target.value as "t" | "b" | "l" | "r" | "tr",
							})
						}
						className={selectClass}
					>
						<option value="t">Trên (Top)</option>
						<option value="b">Dưới (Bottom)</option>
						<option value="l">Trái (Left)</option>
						<option value="r">Phải (Right)</option>
						<option value="tr">Góc trên phải (Top Right)</option>
					</select>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelDefinedName") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên Named Range
					<input
						value={specialCondition.excelDefinedNameConfig?.name ?? ""}
						onChange={(e) =>
							updateConfig("excelDefinedNameConfig", { name: e.target.value })
						}
						placeholder="Prices"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant">
					<input
						type="checkbox"
						checked={
							specialCondition.excelDefinedNameConfig?.requireExactRanges !==
							false
						}
						onChange={(e) =>
							updateConfig("excelDefinedNameConfig", {
								requireExactRanges: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Bắt đúng và không cho thêm vùng ngoài yêu cầu
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Vùng ô yêu cầu (mỗi dòng một vùng)
					<textarea
						rows={3}
						value={(
							specialCondition.excelDefinedNameConfig?.expectedRanges ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelDefinedNameConfig", {
								expectedRanges: cleanTextareaLines(e.target.value.split("\n")),
							})
						}
						placeholder={"D5:D15\nD18:D26"}
						className={textareaClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelFormulaReferences") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelFormulaReferencesConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Summary"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Ô chứa công thức
					<input
						value={specialCondition.excelFormulaReferencesConfig?.cell ?? ""}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								cell: e.target.value,
							})
						}
						placeholder="B15"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Named range bắt buộc (mỗi dòng 1 tên)
					<textarea
						rows={2}
						value={(
							specialCondition.excelFormulaReferencesConfig
								?.requiredReferences ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								requiredReferences: cleanTextareaLines(
									e.target.value.split("\n"),
								),
							})
						}
						placeholder={"SalesData\nRateTax"}
						className={textareaClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelNoConditionalFormatting") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelNoConditionalFormattingConfig
								?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelNoConditionalFormattingConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Sheet1"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelFreezePanes") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelFreezePanesConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelFreezePanesConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Catalog"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Ô góc trên bên trái sau khi cố định
					<input
						value={specialCondition.excelFreezePanesConfig?.topLeftCell ?? "A4"}
						onChange={(e) =>
							updateConfig("excelFreezePanesConfig", {
								topLeftCell: e.target.value,
							})
						}
						placeholder="A4"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Số hàng cố định (ySplit)
					<input
						type="number"
						min={0}
						value={specialCondition.excelFreezePanesConfig?.ySplit ?? 3}
						onChange={(e) =>
							updateConfig("excelFreezePanesConfig", {
								ySplit: e.target.value ? Number(e.target.value) : 3,
							})
						}
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-3">
					<input
						type="checkbox"
						checked={
							specialCondition.excelFreezePanesConfig?.requireNoColumnFreeze !==
							false
						}
						onChange={(e) =>
							updateConfig("excelFreezePanesConfig", {
								requireNoColumnFreeze: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Chỉ cố định hàng, không cố định thêm cột
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelDocumentProperty") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên thuộc tính
					<input
						value={
							specialCondition.excelDocumentPropertyConfig?.propertyName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelDocumentPropertyConfig", {
								propertyName: e.target.value,
							})
						}
						placeholder="Status"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Giá trị yêu cầu
					<input
						value={
							specialCondition.excelDocumentPropertyConfig?.expectedValue ?? ""
						}
						onChange={(e) =>
							updateConfig("excelDocumentPropertyConfig", {
								expectedValue: e.target.value,
							})
						}
						placeholder="Draft"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File nguồn
					<input
						value={
							specialCondition.excelDocumentPropertyConfig?.sourceFile ??
							"docProps/custom.xml"
						}
						onChange={(e) =>
							updateConfig("excelDocumentPropertyConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="docProps/custom.xml"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelPrintArea") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelPrintAreaConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelPrintAreaConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Q1 Sales"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vùng in (expectedRange)
					<input
						value={specialCondition.excelPrintAreaConfig?.expectedRange ?? ""}
						onChange={(e) =>
							updateConfig("excelPrintAreaConfig", {
								expectedRange: e.target.value,
							})
						}
						placeholder="A1:F17"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelPrintAreaConfig?.requireExactRange !== false
						}
						onChange={(e) =>
							updateConfig("excelPrintAreaConfig", {
								requireExactRange: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Bắt đúng vùng in, không cho thêm vùng khác
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelTextRotation") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelTextRotationConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelTextRotationConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Price List"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					textRotation hợp lệ (độ)
					<input
						value={(
							specialCondition.excelTextRotationConfig
								?.allowedTextRotationValues ?? [45]
						).join(", ")}
						onChange={(e) =>
							updateConfig("excelTextRotationConfig", {
								allowedTextRotationValues: e.target.value
									.split(",")
									.map((item) => Number(item.trim()))
									.filter((item) => Number.isFinite(item)),
							})
						}
						placeholder="45"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Tiêu đề cần xoay (mỗi dòng một tiêu đề)
					<textarea
						rows={3}
						value={(
							specialCondition.excelTextRotationConfig?.expectedTexts ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelTextRotationConfig", {
								expectedTexts: e.target.value
									.split(/\r?\n/)
									.map((item) => item.trim())
									.filter(Boolean),
							})
						}
						placeholder={"Port Size\nBand Size\nPrice\nInstall\nSupport"}
						className={textareaClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelTextRotationConfig?.requireAllTexts !==
							false
						}
						onChange={(e) =>
							updateConfig("excelTextRotationConfig", {
								requireAllTexts: e.target.checked,
							})
						}
						className="h-4 w-4 accent-m3-primary"
					/>
					Bắt buộc tất cả tiêu đề đều phải xoay đúng
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelMultiColumnSort") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelMultiColumnSortConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelMultiColumnSortConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Price List"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Hàng tiêu đề
					<input
						type="number"
						min={1}
						value={specialCondition.excelMultiColumnSortConfig?.headerRow ?? 4}
						onChange={(e) =>
							updateConfig("excelMultiColumnSortConfig", {
								headerRow: e.target.value ? Number(e.target.value) : 4,
							})
						}
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Vùng dữ liệu (không bắt buộc)
					<input
						value={specialCondition.excelMultiColumnSortConfig?.dataRange ?? ""}
						onChange={(e) =>
							updateConfig("excelMultiColumnSortConfig", {
								dataRange: e.target.value,
							})
						}
						placeholder="A5:H26"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Khóa sắp xếp (mỗi dòng: tiêu đề cột hoặc tiêu đề|desc)
					<textarea
						rows={3}
						value={(
							specialCondition.excelMultiColumnSortConfig?.keyColumns ?? []
						)
							.map(
								(key) =>
									`${key.headerName ?? key.column ?? ""}${
										key.descending ? "|desc" : ""
									}`,
							)
							.join("\n")}
						onChange={(e) =>
							updateConfig("excelMultiColumnSortConfig", {
								keyColumns: e.target.value
									.split(/\r?\n/)
									.map((line) => line.trim())
									.filter(Boolean)
									.map((line) => {
										const [name, direction] = line
											.split("|")
											.map((item) => item.trim());
										return {
											headerName: name,
											descending:
												direction?.toLowerCase() === "desc" ||
												direction?.toLowerCase() === "z-a",
										};
									}),
							})
						}
						placeholder={"Wired Equipment\nPort Size"}
						className={textareaClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelChartStyle") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File XML biểu đồ
					<input
						value={
							specialCondition.excelChartStyleConfig?.chartSourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartStyleConfig", {
								chartSourceFile: e.target.value,
							})
						}
						placeholder="xl/charts/chart1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File XML style
					<input
						value={
							specialCondition.excelChartStyleConfig?.styleSourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartStyleConfig", {
								styleSourceFile: e.target.value,
							})
						}
						placeholder="xl/charts/style1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Mã Style ID
					<input
						type="number"
						value={specialCondition.excelChartStyleConfig?.styleId ?? ""}
						onChange={(e) =>
							updateConfig("excelChartStyleConfig", {
								styleId: e.target.value ? Number(e.target.value) : undefined,
							})
						}
						placeholder="204"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelTableColumnFormula") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelTableColumnFormulaConfig?.worksheetName ??
							""
						}
						onChange={(e) =>
							updateConfig("excelTableColumnFormulaConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Sales"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên bảng (Table name)
					<input
						value={
							specialCondition.excelTableColumnFormulaConfig?.tableName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelTableColumnFormulaConfig", {
								tableName: e.target.value,
							})
						}
						placeholder="Table1"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên cột (Column name)
					<input
						value={
							specialCondition.excelTableColumnFormulaConfig?.columnName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelTableColumnFormulaConfig", {
								columnName: e.target.value,
							})
						}
						placeholder="Net"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Công thức kỳ vọng
					<input
						value={
							specialCondition.excelTableColumnFormulaConfig?.expectedFormula ??
							""
						}
						onChange={(e) =>
							updateConfig("excelTableColumnFormulaConfig", {
								expectedFormula: e.target.value,
							})
						}
						placeholder="=[@Total]-[@Commission]"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tham chiếu cột bắt buộc (mỗi dòng 1 tên)
					<textarea
						rows={2}
						value={(
							specialCondition.excelTableColumnFormulaConfig
								?.requiredReferences ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelTableColumnFormulaConfig", {
								requiredReferences: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder={"Total\nCommission"}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Hàm bắt buộc (mỗi dòng 1 tên)
					<textarea
						rows={2}
						value={(
							specialCondition.excelTableColumnFormulaConfig
								?.requiredFunctions ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelTableColumnFormulaConfig", {
								requiredFunctions: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder="RIGHT"
						className={textareaClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelChartType") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelChartTypeConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelChartTypeConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Sheet1"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Loại biểu đồ mong đợi
					<input
						value={
							specialCondition.excelChartTypeConfig?.expectedChartType ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartTypeConfig", {
								expectedChartType: e.target.value,
							})
						}
						placeholder="3-D Clustered Bar"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelWorksheetTabColor") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={
							specialCondition.excelWorksheetTabColorConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelWorksheetTabColorConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Qtr 1"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Mã màu HEX kỳ vọng
					<input
						value={
							specialCondition.excelWorksheetTabColorConfig?.expectedColor ?? ""
						}
						onChange={(e) =>
							updateConfig("excelWorksheetTabColorConfig", {
								expectedColor: e.target.value,
							})
						}
						placeholder="#0070C0"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Mã màu cho phép khác (mỗi dòng 1 mã)
					<textarea
						rows={2}
						value={(
							specialCondition.excelWorksheetTabColorConfig?.allowedColors ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelWorksheetTabColorConfig", {
								allowedColors: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder={"0070C0\nFF0070C0"}
						className={textareaClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelTableTotalRow") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelTableTotalRowConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableTotalRowConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Qtr 1"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên bảng (tùy chọn)
					<input
						value={specialCondition.excelTableTotalRowConfig?.tableName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableTotalRowConfig", {
								tableName: e.target.value,
							})
						}
						placeholder="Table1"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File bảng nguồn
					<input
						value={specialCondition.excelTableTotalRowConfig?.tableSourceFile ?? ""}
						onChange={(e) =>
							updateConfig("excelTableTotalRowConfig", {
								tableSourceFile: e.target.value,
							})
						}
						placeholder="xl/tables/table1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên cột kiểm tra
					<input
						value={specialCondition.excelTableTotalRowConfig?.columnName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableTotalRowConfig", {
								columnName: e.target.value,
							})
						}
						placeholder="Entries"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Hàm tính hàng tổng
					<input
						value={
							specialCondition.excelTableTotalRowConfig?.totalsRowFunction ?? ""
						}
						onChange={(e) =>
							updateConfig("excelTableTotalRowConfig", {
								totalsRowFunction: e.target.value,
							})
						}
						placeholder="sum, count, average..."
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Nhãn hàng tổng
					<input
						value={specialCondition.excelTableTotalRowConfig?.totalsRowLabel ?? ""}
						onChange={(e) =>
							updateConfig("excelTableTotalRowConfig", {
								totalsRowLabel: e.target.value,
							})
						}
						placeholder="Total"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={specialCondition.excelTableTotalRowConfig?.requireTotalRow !== false}
						onChange={(e) =>
							updateConfig("excelTableTotalRowConfig", {
								requireTotalRow: e.target.checked,
							})
						}
					/>
					Bắt buộc bật hàng tổng
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelTableCreate") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelTableCreateConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableCreateConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Qtr 1"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File bảng nguồn
					<input
						value={specialCondition.excelTableCreateConfig?.tableSourceFile ?? ""}
						onChange={(e) =>
							updateConfig("excelTableCreateConfig", {
								tableSourceFile: e.target.value,
							})
						}
						placeholder="xl/tables/table1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vùng bảng mong đợi
					<input
						value={specialCondition.excelTableCreateConfig?.expectedRange ?? ""}
						onChange={(e) =>
							updateConfig("excelTableCreateConfig", {
								expectedRange: e.target.value,
							})
						}
						placeholder="A2:E10"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Kiểu bảng mong đợi
					<input
						value={specialCondition.excelTableCreateConfig?.expectedTableStyle ?? ""}
						onChange={(e) =>
							updateConfig("excelTableCreateConfig", {
								expectedTableStyle: e.target.value,
							})
						}
						placeholder="TableStyleLight14 hoặc Red, Table Style Light 14"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={specialCondition.excelTableCreateConfig?.hasHeaderRow !== false}
						onChange={(e) =>
							updateConfig("excelTableCreateConfig", {
								hasHeaderRow: e.target.checked,
							})
						}
					/>
					Bảng có hàng tiêu đề
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelChartQuickLayout") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelChartQuickLayoutConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelChartQuickLayoutConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Qtr 1"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File biểu đồ nguồn
					<input
						value={
							specialCondition.excelChartQuickLayoutConfig?.chartSourceFile ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartQuickLayoutConfig", {
								chartSourceFile: e.target.value,
							})
						}
						placeholder="xl/charts/chart1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Số Quick Layout
					<input
						type="number"
						min={1}
						value={specialCondition.excelChartQuickLayoutConfig?.layoutNumber ?? 2}
						onChange={(e) =>
							updateConfig("excelChartQuickLayoutConfig", {
								layoutNumber: Number(e.target.value),
							})
						}
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vị trí nhãn dữ liệu
					<input
						value={
							specialCondition.excelChartQuickLayoutConfig?.dataLabelPosition ?? ""
						}
						onChange={(e) =>
							updateConfig("excelChartQuickLayoutConfig", {
								dataLabelPosition: e.target.value,
							})
						}
						placeholder="bestFit, outEnd..."
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelChartQuickLayoutConfig?.requireDataLabels !== false
						}
						onChange={(e) =>
							updateConfig("excelChartQuickLayoutConfig", {
								requireDataLabels: e.target.checked,
							})
						}
					/>
					Bắt buộc có nhãn dữ liệu
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelSparkline") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelSparklineConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelSparklineConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Parts"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File worksheet nguồn
					<input
						value={specialCondition.excelSparklineConfig?.sourceFile ?? ""}
						onChange={(e) =>
							updateConfig("excelSparklineConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="xl/worksheets/sheet1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Loại Sparkline
					<select
						value={specialCondition.excelSparklineConfig?.sparklineType ?? "line"}
						onChange={(e) =>
							updateConfig("excelSparklineConfig", {
								sparklineType: e.target.value,
							})
						}
						className={selectClass}
					>
						<option value="line">Line</option>
						<option value="column">Column</option>
						<option value="stacked">Win/Loss</option>
					</select>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Vị trí Sparkline
					<input
						value={specialCondition.excelSparklineConfig?.locationRange ?? ""}
						onChange={(e) =>
							updateConfig("excelSparklineConfig", {
								locationRange: e.target.value,
							})
						}
						placeholder="F4"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Vùng dữ liệu Sparkline
					<input
						value={specialCondition.excelSparklineConfig?.dataRange ?? ""}
						onChange={(e) =>
							updateConfig("excelSparklineConfig", {
								dataRange: e.target.value,
							})
						}
						placeholder="B4:D4"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelTableRowDelete") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên worksheet
					<input
						value={specialCondition.excelTableRowDeleteConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelTableRowDeleteConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Parts"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File worksheet nguồn
					<input
						value={specialCondition.excelTableRowDeleteConfig?.sourceFile ?? ""}
						onChange={(e) =>
							updateConfig("excelTableRowDeleteConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="xl/worksheets/sheet1.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Nội dung phải được xóa
					<input
						value={specialCondition.excelTableRowDeleteConfig?.deletedText ?? ""}
						onChange={(e) =>
							updateConfig("excelTableRowDeleteConfig", {
								deletedText: e.target.value,
							})
						}
						placeholder="Allen"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelTableRowDeleteConfig?.matchWholeWord !== false
						}
						onChange={(e) =>
							updateConfig("excelTableRowDeleteConfig", {
								matchWholeWord: e.target.checked,
							})
						}
					/>
					Khớp nguyên nội dung ô
				</label>
			</div>
		);
	}

	const fields = EXAM02_FIELDS[specialCondition.type];
	if (fields) {
		const configKey = `${specialCondition.type}Config` as keyof SpecialCondition;
		const config = (specialCondition[configKey] ?? {}) as Record<string, string | number | undefined>;
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				{fields.map((field) => (
					<label key={field.key} className="text-xs font-semibold text-m3-on-surface-variant">
						{field.label}
						<input
							type={field.numeric ? "number" : "text"}
							value={config[field.key] ?? ""}
							onChange={(event) => updateConfig(configKey, {
								[field.key]: field.numeric
									? event.target.value === "" ? undefined : Number(event.target.value)
									: event.target.value,
							})}
							className={inputClass}
						/>
					</label>
				))}
			</div>
		);
	}
	return null;
};
