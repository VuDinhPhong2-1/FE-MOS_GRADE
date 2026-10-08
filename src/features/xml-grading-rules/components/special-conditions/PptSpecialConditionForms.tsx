import type React from "react";
import type {
	PptAltTextConfig,
	PptAnimationConfig,
	PptChartLegendConfig,
	PptChartTypeConfig,
	PptCommentConfig,
	PptExportedFileConfig,
	PptMasterPictureConfig,
	PptNotesMasterPlaceholdersConfig,
	PptPictureCropShapeConfig,
	PptPictureStyleConfig,
	PptPrintSettingsConfig,
	PptSectionConfig,
	PptShapeArrangeConfig,
	PptShapeGroupConfig,
	PptShapeSelector,
	PptShapeSizeConfig,
	PptShapeStyleConfig,
	PptSlideBackgroundConfig,
	PptSlideLayoutConfig,
	PptSlideRef,
	PptSlideTitlesConfig,
	PptSlideTransitionConfig,
	PptSmartArtConfig,
	PptSummaryZoomConfig,
	PptTableConfig,
	PptTextBoxConfig,
	PptTextColumnsConfig,
	PptVideoConfig,
	SpecialCondition,
} from "../../../../types/xml-grading-rules.types";

export interface PptSpecialConditionEditorProps {
	specialCondition: SpecialCondition;
	inputClass: string;
	onChange: (specialCondition: SpecialCondition) => void;
}

const SlideRefFields: React.FC<{
	value?: PptSlideRef;
	onChange: (ref: PptSlideRef) => void;
	inputClass: string;
	title?: string;
}> = ({ value, onChange, inputClass, title = "Vị trí Slide mục tiêu" }) => {
	const current = value ?? {};
	return (
		<div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-3 md:col-span-2">
			<div className="mb-2 text-xs font-bold text-blue-900">{title}</div>
			<div className="grid gap-2 sm:grid-cols-3">
				<label className="text-xs font-semibold text-slate-600">
					Thứ tự Slide (1-based)
					<input
						type="number"
						min={1}
						value={current.slideIndex ?? ""}
						onChange={(e) =>
							onChange({
								...current,
								slideIndex: e.target.value ? Number(e.target.value) : undefined,
							})
						}
						placeholder="Ví dụ: 1, 2, 3..."
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Tiêu đề Slide (nếu có)
					<input
						type="text"
						value={current.slideTitle ?? ""}
						onChange={(e) =>
							onChange({
								...current,
								slideTitle: e.target.value || undefined,
							})
						}
						placeholder="Tên slide"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Chữ neo trên Slide (Anchor Text)
					<input
						type="text"
						value={current.anchorText ?? ""}
						onChange={(e) =>
							onChange({
								...current,
								anchorText: e.target.value || undefined,
							})
						}
						placeholder="Văn bản nhận diện"
						className={inputClass}
					/>
				</label>
			</div>
		</div>
	);
};

const ShapeSelectorFields: React.FC<{
	value?: PptShapeSelector;
	onChange: (sel: PptShapeSelector) => void;
	inputClass: string;
	title?: string;
}> = ({
	value,
	onChange,
	inputClass,
	title = "Nhận diện Hình / Đối tượng (Shape Selector)",
}) => {
	const current = value ?? {};
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-3 md:col-span-2">
			<div className="mb-2 text-xs font-bold text-slate-800">{title}</div>
			<div className="grid gap-2 sm:grid-cols-3">
				<label className="text-xs font-semibold text-slate-600">
					Tên đối tượng / Shape
					<input
						type="text"
						value={current.shapeName ?? ""}
						onChange={(e) =>
							onChange({
								...current,
								shapeName: e.target.value || undefined,
							})
						}
						placeholder="Picture 1 / Rectangle 3"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Văn bản trong Shape
					<input
						type="text"
						value={current.targetText ?? ""}
						onChange={(e) =>
							onChange({
								...current,
								targetText: e.target.value || undefined,
							})
						}
						placeholder="Chữ bên trong shape"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Thứ tự đối tượng (1-based)
					<input
						type="number"
						min={1}
						value={current.ordinal ?? ""}
						onChange={(e) =>
							onChange({
								...current,
								ordinal: e.target.value ? Number(e.target.value) : undefined,
							})
						}
						placeholder="1"
						className={inputClass}
					/>
				</label>
			</div>
		</div>
	);
};

export const PptSpecialConditionEditor: React.FC<
	PptSpecialConditionEditorProps
> = ({ specialCondition, inputClass, onChange }) => {
	const updateConfig = <K extends keyof SpecialCondition>(
		configKey: K,
		patch: Partial<NonNullable<SpecialCondition[K]>>,
	) => {
		const currentConfig = (specialCondition[configKey] ?? {}) as Record<
			string,
			unknown
		>;
		onChange({
			...specialCondition,
			[configKey]: {
				...currentConfig,
				...patch,
			},
		});
	};

	// 1. pptPictureCropShape
	if (specialCondition.type === "pptPictureCropShape") {
		const cfg: PptPictureCropShapeConfig =
			specialCondition.pptPictureCropShapeConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) =>
						updateConfig("pptPictureCropShapeConfig", { slide })
					}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) =>
						updateConfig("pptPictureCropShapeConfig", { shape })
					}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Kiểu cắt hình (Preset Crop Geometry)
					<input
						value={cfg.expectedShapePreset ?? "ellipse"}
						onChange={(e) =>
							updateConfig("pptPictureCropShapeConfig", {
								expectedShapePreset: e.target.value,
							})
						}
						placeholder="ellipse (Oval)"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 2. pptShapeSize
	if (specialCondition.type === "pptShapeSize") {
		const cfg: PptShapeSizeConfig = specialCondition.pptShapeSizeConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptShapeSizeConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptShapeSizeConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600">
					Chiều cao kỳ vọng (Inches)
					<input
						type="number"
						step="0.01"
						value={cfg.expectedHeightInches ?? ""}
						onChange={(e) =>
							updateConfig("pptShapeSizeConfig", {
								expectedHeightInches: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						placeholder="2.0"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Chiều rộng kỳ vọng (Inches)
					<input
						type="number"
						step="0.01"
						value={cfg.expectedWidthInches ?? ""}
						onChange={(e) =>
							updateConfig("pptShapeSizeConfig", {
								expectedWidthInches: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						placeholder="3.5"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Dung sai (Inches)
					<input
						type="number"
						step="0.01"
						value={cfg.toleranceInches ?? 0.15}
						onChange={(e) =>
							updateConfig("pptShapeSizeConfig", {
								toleranceInches: e.target.value ? Number(e.target.value) : 0.15,
							})
						}
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 3. pptShapeGroup
	if (specialCondition.type === "pptShapeGroup") {
		const cfg: PptShapeGroupConfig = specialCondition.pptShapeGroupConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptShapeGroupConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.requireGrouped !== false}
						onChange={(e) =>
							updateConfig("pptShapeGroupConfig", {
								requireGrouped: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Bắt buộc các hình đã được Group (p:grpSp)
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.checkAlignCenter === true}
						onChange={(e) =>
							updateConfig("pptShapeGroupConfig", {
								checkAlignCenter: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Kiểm tra canh giữa (Align Center)
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Số lượng hình con tối thiểu trong nhóm
					<input
						type="number"
						value={cfg.minChildCount ?? 2}
						onChange={(e) =>
							updateConfig("pptShapeGroupConfig", {
								minChildCount: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 4. pptChartLegend
	if (specialCondition.type === "pptChartLegend") {
		const cfg: PptChartLegendConfig =
			specialCondition.pptChartLegendConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptChartLegendConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Vị trí chú giải (Legend Position)
					<select
						value={cfg.expectedPosition ?? "t"}
						onChange={(e) =>
							updateConfig("pptChartLegendConfig", {
								expectedPosition: e.target.value,
							})
						}
						className={inputClass}
					>
						<option value="t">Trên cùng (Top - t)</option>
						<option value="b">Dưới cùng (Bottom - b)</option>
						<option value="l">Bên trái (Left - l)</option>
						<option value="r">Bên phải (Right - r)</option>
						<option value="tr">Góc trên phải (Top-Right - tr)</option>
					</select>
				</label>
			</div>
		);
	}

	// 5. pptSmartArt
	if (specialCondition.type === "pptSmartArt") {
		const cfg: PptSmartArtConfig = specialCondition.pptSmartArtConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptSmartArtConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Tên bố cục SmartArt kỳ vọng
					<input
						value={cfg.expectedLayoutName ?? ""}
						onChange={(e) =>
							updateConfig("pptSmartArtConfig", {
								expectedLayoutName: e.target.value,
							})
						}
						placeholder="Target List / Upward Arrow / Vertical Block List"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Danh sách văn bản các nút (mỗi dòng 1 nút)
					<textarea
						rows={3}
						value={(cfg.expectedNodeTexts ?? []).join("\n")}
						onChange={(e) =>
							updateConfig("pptSmartArtConfig", {
								expectedNodeTexts: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder={"Giai đoạn 1\nGiai đoạn 2\nGiai đoạn 3"}
						className={`${inputClass} resize-y`}
					/>
				</label>
			</div>
		);
	}

	// 6. pptComment
	if (specialCondition.type === "pptComment") {
		const cfg: PptCommentConfig = specialCondition.pptCommentConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptCommentConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600">
					Tác giả bình luận (nếu cần lọc)
					<input
						value={cfg.author ?? ""}
						onChange={(e) =>
							updateConfig("pptCommentConfig", { author: e.target.value })
						}
						placeholder="Jane Doe"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Nội dung bình luận
					<input
						value={cfg.targetCommentText ?? ""}
						onChange={(e) =>
							updateConfig("pptCommentConfig", {
								targetCommentText: e.target.value,
							})
						}
						placeholder="Nội dung cần xóa hoặc kiểm tra"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
					<input
						type="checkbox"
						checked={cfg.expectAbsent !== false}
						onChange={(e) =>
							updateConfig("pptCommentConfig", {
								expectAbsent: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Kỳ vọng đã bị xóa (Delete Comment)
				</label>
			</div>
		);
	}

	// 7. pptSlideTitles
	if (specialCondition.type === "pptSlideTitles") {
		const cfg: PptSlideTitlesConfig =
			specialCondition.pptSlideTitlesConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					Slide bắt đầu so khớp (1-based)
					<input
						type="number"
						min={1}
						value={cfg.startSlideIndex ?? 1}
						onChange={(e) =>
							updateConfig("pptSlideTitlesConfig", {
								startSlideIndex: e.target.value ? Number(e.target.value) : 1,
							})
						}
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Danh sách tiêu đề các slide theo đúng thứ tự (mỗi dòng 1 tiêu đề)
					<textarea
						rows={4}
						value={(cfg.expectedTitlesInOrder ?? []).join("\n")}
						onChange={(e) =>
							updateConfig("pptSlideTitlesConfig", {
								expectedTitlesInOrder: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder={"Slide Title 1\nSlide Title 2\nSlide Title 3"}
						className={`${inputClass} resize-y`}
					/>
				</label>
			</div>
		);
	}

	// 8. pptVideo
	if (specialCondition.type === "pptVideo") {
		const cfg: PptVideoConfig = specialCondition.pptVideoConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptVideoConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptVideoConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
					<input
						type="checkbox"
						checked={cfg.requireVideoOnly !== false}
						onChange={(e) =>
							updateConfig("pptVideoConfig", {
								requireVideoOnly: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Bắt buộc đối tượng là Video / Screen Recording
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Cắt video tại thời điểm (giây) - Trim End Seconds
					<input
						type="number"
						step="0.1"
						value={cfg.expectedTrimEndSeconds ?? ""}
						onChange={(e) =>
							updateConfig("pptVideoConfig", {
								expectedTrimEndSeconds: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						placeholder="10.5"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 9. pptTable
	if (specialCondition.type === "pptTable") {
		const cfg: PptTableConfig = specialCondition.pptTableConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptTableConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Các dòng cấm xuất hiện (đã bị xóa, mỗi dòng 1 văn bản)
					<textarea
						rows={2}
						value={(cfg.disallowedRowTexts ?? []).join("\n")}
						onChange={(e) =>
							updateConfig("pptTableConfig", {
								disallowedRowTexts: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder="Dòng đã bị xóa"
						className={`${inputClass} resize-y`}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Các ô bắt buộc còn lại (mỗi dòng 1 ô)
					<textarea
						rows={2}
						value={(cfg.requiredCellTexts ?? []).join("\n")}
						onChange={(e) =>
							updateConfig("pptTableConfig", {
								requiredCellTexts: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder="Nội dung ô giữ lại"
						className={`${inputClass} resize-y`}
					/>
				</label>
			</div>
		);
	}

	// 10. pptSection
	if (specialCondition.type === "pptSection") {
		const cfg: PptSectionConfig = specialCondition.pptSectionConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Tên Section mới kỳ vọng
					<input
						value={cfg.expectedSectionName ?? ""}
						onChange={(e) =>
							updateConfig("pptSectionConfig", {
								expectedSectionName: e.target.value,
							})
						}
						placeholder="Introduction"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Tên các Section cũ cấm xuất hiện (mỗi dòng 1 tên)
					<textarea
						rows={2}
						value={(cfg.disallowedSectionNames ?? []).join("\n")}
						onChange={(e) =>
							updateConfig("pptSectionConfig", {
								disallowedSectionNames: e.target.value
									.split(/\r?\n/)
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder="Default Section"
						className={`${inputClass} resize-y`}
					/>
				</label>
			</div>
		);
	}

	// 11. pptPictureStyle
	if (specialCondition.type === "pptPictureStyle") {
		const cfg: PptPictureStyleConfig =
			specialCondition.pptPictureStyleConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptPictureStyleConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptPictureStyleConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Tên kiểu ảnh kỳ vọng (Picture Style)
					<input
						value={cfg.expectedStyleName ?? "Bevel Rectangle"}
						onChange={(e) =>
							updateConfig("pptPictureStyleConfig", {
								expectedStyleName: e.target.value,
							})
						}
						placeholder="Bevel Rectangle / Simple White"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 12. pptShapeArrange
	if (specialCondition.type === "pptShapeArrange") {
		const cfg: PptShapeArrangeConfig =
			specialCondition.pptShapeArrangeConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptShapeArrangeConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptShapeArrangeConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.checkAlignMiddle === true}
						onChange={(e) =>
							updateConfig("pptShapeArrangeConfig", {
								checkAlignMiddle: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Kiểm tra canh giữa theo chiều dọc (Align Middle)
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.checkBringToFront === true}
						onChange={(e) =>
							updateConfig("pptShapeArrangeConfig", {
								checkBringToFront: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Kiểm tra đưa lên trên cùng (Bring to Front)
				</label>
			</div>
		);
	}

	// 13. pptSummaryZoom
	if (specialCondition.type === "pptSummaryZoom") {
		const cfg: PptSummaryZoomConfig =
			specialCondition.pptSummaryZoomConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptSummaryZoomConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.requireZoomItems !== false}
						onChange={(e) =>
							updateConfig("pptSummaryZoomConfig", {
								requireZoomItems: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Bắt buộc có các Zoom Slide items
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.excludeFirstSlide !== false}
						onChange={(e) =>
							updateConfig("pptSummaryZoomConfig", {
								excludeFirstSlide: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Không chứa slide đầu tiên trong Zoom
				</label>
			</div>
		);
	}

	// 14. pptExportedFile
	if (specialCondition.type === "pptExportedFile") {
		const cfg: PptExportedFileConfig =
			specialCondition.pptExportedFileConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					Tên file xuất kỳ vọng
					<input
						value={cfg.expectedFileName ?? "Backcountry.pdf"}
						onChange={(e) =>
							updateConfig("pptExportedFileConfig", {
								expectedFileName: e.target.value,
							})
						}
						placeholder="Backcountry.pdf"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.caseSensitive !== false}
						onChange={(e) =>
							updateConfig("pptExportedFileConfig", {
								caseSensitive: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Phân biệt chính xác chữ hoa/chữ thường (Case-sensitive)
				</label>
			</div>
		);
	}

	// 15. pptMasterPicture
	if (specialCondition.type === "pptMasterPicture") {
		const cfg: PptMasterPictureConfig =
			specialCondition.pptMasterPictureConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					Tên hình ảnh chèn vào Slide Master
					<input
						value={cfg.expectedImageName ?? "Badge.png"}
						onChange={(e) =>
							updateConfig("pptMasterPictureConfig", {
								expectedImageName: e.target.value,
							})
						}
						placeholder="Badge.png"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Vị trí đặt trên Master
					<select
						value={cfg.expectedPlacement ?? "bottom-right"}
						onChange={(e) =>
							updateConfig("pptMasterPictureConfig", {
								expectedPlacement: e.target.value,
							})
						}
						className={inputClass}
					>
						<option value="bottom-right">
							Góc dưới bên phải (Bottom Right)
						</option>
						<option value="bottom-left">Góc dưới bên trái (Bottom Left)</option>
						<option value="top-right">Góc trên bên phải (Top Right)</option>
						<option value="top-left">Góc trên bên trái (Top Left)</option>
					</select>
				</label>
			</div>
		);
	}

	// 16. pptSlideTransition
	if (specialCondition.type === "pptSlideTransition") {
		const cfg: PptSlideTransitionConfig =
			specialCondition.pptSlideTransitionConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) =>
						updateConfig("pptSlideTransitionConfig", { slide })
					}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600">
					Hiệu ứng chuyển trang (Transition)
					<input
						value={cfg.expectedTransition ?? "Fade"}
						onChange={(e) =>
							updateConfig("pptSlideTransitionConfig", {
								expectedTransition: e.target.value,
							})
						}
						placeholder="Fade / Push / Wipe / Split"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Thời lượng (Giây)
					<input
						type="number"
						step="0.05"
						value={cfg.expectedDurationSeconds ?? 0.75}
						onChange={(e) =>
							updateConfig("pptSlideTransitionConfig", {
								expectedDurationSeconds: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
					<input
						type="checkbox"
						checked={cfg.applyToAll === true}
						onChange={(e) =>
							updateConfig("pptSlideTransitionConfig", {
								applyToAll: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Áp dụng cho tất cả slide (Apply to All)
				</label>
			</div>
		);
	}

	// 17. pptAnimation
	if (specialCondition.type === "pptAnimation") {
		const cfg: PptAnimationConfig = specialCondition.pptAnimationConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptAnimationConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptAnimationConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600">
					Tên hiệu ứng (Effect)
					<input
						value={cfg.expectedEffect ?? "Fly In"}
						onChange={(e) =>
							updateConfig("pptAnimationConfig", {
								expectedEffect: e.target.value,
							})
						}
						placeholder="Fly In / Fade / Zoom / Motion Path"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Loại Motion Path (nếu là đường chuyển động)
					<input
						value={cfg.motionPathType ?? ""}
						onChange={(e) =>
							updateConfig("pptAnimationConfig", {
								motionPathType: e.target.value,
							})
						}
						placeholder="Square / Circle / Line"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 18. pptMarkAsFinal
	if (specialCondition.type === "pptMarkAsFinal") {
		const cfg = specialCondition.pptMarkAsFinalConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
					<input
						type="checkbox"
						checked={cfg.expectedMarkAsFinal !== false}
						onChange={(e) =>
							updateConfig("pptMarkAsFinalConfig", {
								expectedMarkAsFinal: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Kiểm tra bài trình chiếu đã được đánh dấu Mark as Final
				</label>
			</div>
		);
	}

	// 19. pptPrintSettings
	if (specialCondition.type === "pptPrintSettings") {
		const cfg: PptPrintSettingsConfig =
			specialCondition.pptPrintSettingsConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					Chế độ in (Print What)
					<select
						value={cfg.expectedPrintWhat ?? "notes"}
						onChange={(e) =>
							updateConfig("pptPrintSettingsConfig", {
								expectedPrintWhat: e.target.value,
							})
						}
						className={inputClass}
					>
						<option value="notes">Trang ghi chú (Notes Pages)</option>
						<option value="slides">Các trang chiếu (Slides)</option>
						<option value="handouts">Tài liệu phát tay (Handouts)</option>
						<option value="outline">Dàn ý (Outline)</option>
					</select>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Chế độ màu in (Color Mode)
					<select
						value={cfg.expectedColorMode ?? "gray"}
						onChange={(e) =>
							updateConfig("pptPrintSettingsConfig", {
								expectedColorMode: e.target.value,
							})
						}
						className={inputClass}
					>
						<option value="gray">Thang độ xám (Grayscale)</option>
						<option value="color">Màu đầy đủ (Color)</option>
						<option value="pureBlackAndWhite">
							Trắng đen thuần (Pure B&W)
						</option>
					</select>
				</label>
			</div>
		);
	}

	// 20. pptTextColumns
	if (specialCondition.type === "pptTextColumns") {
		const cfg: PptTextColumnsConfig =
			specialCondition.pptTextColumnsConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptTextColumnsConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptTextColumnsConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600">
					Số cột văn bản kỳ vọng
					<input
						type="number"
						min={1}
						value={cfg.expectedColumnCount ?? 2}
						onChange={(e) =>
							updateConfig("pptTextColumnsConfig", {
								expectedColumnCount: e.target.value
									? Number(e.target.value)
									: 2,
							})
						}
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Khoảng cách giữa các cột (Inches)
					<input
						type="number"
						step="0.1"
						value={cfg.expectedSpacingInches ?? 0.5}
						onChange={(e) =>
							updateConfig("pptTextColumnsConfig", {
								expectedSpacingInches: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 21. pptNotesMasterPlaceholders
	if (specialCondition.type === "pptNotesMasterPlaceholders") {
		const cfg: PptNotesMasterPlaceholdersConfig =
			specialCondition.pptNotesMasterPlaceholdersConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.requireHeaderDisabled !== false}
						onChange={(e) =>
							updateConfig("pptNotesMasterPlaceholdersConfig", {
								requireHeaderDisabled: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Bỏ chọn Đầu trang (Disable Header)
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={cfg.requireFooterDisabled !== false}
						onChange={(e) =>
							updateConfig("pptNotesMasterPlaceholdersConfig", {
								requireFooterDisabled: e.target.checked,
							})
						}
						className="h-4 w-4 rounded text-blue-600"
					/>
					Bỏ chọn Chân trang (Disable Footer)
				</label>
			</div>
		);
	}

	// 22. pptSlideSize
	if (specialCondition.type === "pptSlideSize") {
		const cfg = specialCondition.pptSlideSizeConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Tỷ lệ kích thước Slide
					<select
						value={cfg.expectedRatio ?? "16:9"}
						onChange={(e) =>
							updateConfig("pptSlideSizeConfig", {
								expectedRatio: e.target.value,
							})
						}
						className={inputClass}
					>
						<option value="16:9">Màn hình rộng (Widescreen 16:9)</option>
						<option value="4:3">Tiêu chuẩn (Standard 4:3)</option>
						<option value="16:10">Widescreen (16:10)</option>
					</select>
				</label>
			</div>
		);
	}

	// 23. pptChartType
	if (specialCondition.type === "pptChartType") {
		const cfg: PptChartTypeConfig = specialCondition.pptChartTypeConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptChartTypeConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Loại biểu đồ kỳ vọng
					<input
						value={cfg.expectedChartType ?? "Pareto"}
						onChange={(e) =>
							updateConfig("pptChartTypeConfig", {
								expectedChartType: e.target.value,
							})
						}
						placeholder="Pareto / Clustered Column / Pie / Line"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 24. pptAltText
	if (specialCondition.type === "pptAltText") {
		const cfg: PptAltTextConfig = specialCondition.pptAltTextConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptAltTextConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptAltTextConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Văn bản thay thế (Alt Text) kỳ vọng
					<input
						value={cfg.expectedAltText ?? ""}
						onChange={(e) =>
							updateConfig("pptAltTextConfig", {
								expectedAltText: e.target.value,
							})
						}
						placeholder="Nội dung mô tả hình ảnh"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 25. pptHyperlink
	if (specialCondition.type === "pptHyperlink") {
		const cfg = specialCondition.pptHyperlinkConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptHyperlinkConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600">
					Văn bản hiển thị liên kết
					<input
						value={cfg.targetText ?? ""}
						onChange={(e) =>
							updateConfig("pptHyperlinkConfig", { targetText: e.target.value })
						}
						placeholder="Nhấp vào đây"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Địa chỉ liên kết (URL)
					<input
						value={cfg.expectedUrl ?? ""}
						onChange={(e) =>
							updateConfig("pptHyperlinkConfig", {
								expectedUrl: e.target.value,
							})
						}
						placeholder="https://example.com"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 26. pptTextBox
	if (specialCondition.type === "pptTextBox") {
		const cfg: PptTextBoxConfig = specialCondition.pptTextBoxConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptTextBoxConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Văn bản bên trong Text Box
					<input
						value={cfg.expectedText ?? ""}
						onChange={(e) =>
							updateConfig("pptTextBoxConfig", { expectedText: e.target.value })
						}
						placeholder="Nội dung hộp văn bản"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Chiều rộng (Inches)
					<input
						type="number"
						step="0.1"
						value={cfg.expectedWidthInches ?? 2.5}
						onChange={(e) =>
							updateConfig("pptTextBoxConfig", {
								expectedWidthInches: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Vị trí đặt trên Slide
					<select
						value={cfg.expectedPlacement ?? "bottom-right"}
						onChange={(e) =>
							updateConfig("pptTextBoxConfig", {
								expectedPlacement: e.target.value,
							})
						}
						className={inputClass}
					>
						<option value="bottom-right">Góc dưới bên phải</option>
						<option value="bottom-left">Góc dưới bên trái</option>
						<option value="top-right">Góc trên bên phải</option>
						<option value="top-left">Góc trên bên trái</option>
					</select>
				</label>
			</div>
		);
	}

	// 27. pptSlideLayout
	if (specialCondition.type === "pptSlideLayout") {
		const cfg: PptSlideLayoutConfig =
			specialCondition.pptSlideLayoutConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptSlideLayoutConfig", { slide })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Tên bố cục Slide kỳ vọng
					<input
						value={cfg.expectedLayoutName ?? "Two Content"}
						onChange={(e) =>
							updateConfig("pptSlideLayoutConfig", {
								expectedLayoutName: e.target.value,
							})
						}
						placeholder="Two Content / Title and Content / Section Header"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 28. pptShapeStyle
	if (specialCondition.type === "pptShapeStyle") {
		const cfg: PptShapeStyleConfig = specialCondition.pptShapeStyleConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) => updateConfig("pptShapeStyleConfig", { slide })}
					inputClass={inputClass}
				/>
				<ShapeSelectorFields
					value={cfg.shape}
					onChange={(shape) => updateConfig("pptShapeStyleConfig", { shape })}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Tên kiểu Shape kỳ vọng
					<input
						value={
							cfg.expectedStyleName ?? "Intense Effect - Blue-Gray, Accent 1"
						}
						onChange={(e) =>
							updateConfig("pptShapeStyleConfig", {
								expectedStyleName: e.target.value,
							})
						}
						placeholder="Intense Effect - Blue-Gray, Accent 1 / Moderate Effect"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	// 29. pptSlideBackground
	if (specialCondition.type === "pptSlideBackground") {
		const cfg: PptSlideBackgroundConfig =
			specialCondition.pptSlideBackgroundConfig ?? {};
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 md:grid-cols-2">
				<SlideRefFields
					value={cfg.slide}
					onChange={(slide) =>
						updateConfig("pptSlideBackgroundConfig", { slide })
					}
					inputClass={inputClass}
				/>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Mã màu nền HEX (Solid Fill Color)
					<input
						value={cfg.expectedColorHex ?? "0070C0"}
						onChange={(e) =>
							updateConfig("pptSlideBackgroundConfig", {
								expectedColorHex: e.target.value,
							})
						}
						placeholder="0070C0 (Blue)"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	return null;
};
