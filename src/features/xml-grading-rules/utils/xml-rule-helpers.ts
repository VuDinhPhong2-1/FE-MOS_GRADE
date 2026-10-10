import type {
	GradingRuleSet,
	GradingRuleSetSummary,
	ProjectXmlRule,
	SpecialCondition,
	SpecialConditionType,
	TaskXmlRule,
	XmlConditionFeedback,
	XmlGradingCondition,
} from "../../../types/xml-grading-rules.types";
import {
	type SpecialConditionOption,
	type SpecialConditionOptionGroup,
	specialConditionGroups,
	specialConditionOptions,
} from "./xml-rule-presets";

export const normalizeEscapedNewlines = (value: string) =>
	value
		.replace(/\\r\\n/g, "\n")
		.replace(/\\n/g, "\n")
		.replace(/\\r/g, "\n");

export const normalizeSubject = (value: string) => {
	const s = value.trim().toLowerCase();
	if (s.includes("word") || s.includes("docx")) return "word";
	if (s.includes("excel") || s.includes("xlsx")) return "excel";
	if (s.includes("ppt") || s.includes("pptx") || s.includes("powerpoint"))
		return "ppt";
	return s;
};

export const getSubjectMeta = (subject: string) => {
	const norm = normalizeSubject(subject);
	if (norm === "excel") {
		return {
			label: "Excel",
			shortBadge: "XLSX",
			icon: "table_chart",
			className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
		};
	}
	if (norm === "word") {
		return {
			label: "Word",
			shortBadge: "DOCX",
			icon: "description",
			className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
		};
	}
	if (norm === "ppt") {
		return {
			label: "PowerPoint",
			shortBadge: "PPTX",
			icon: "slideshow",
			className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
		};
	}
	return {
		label: subject || "Khác",
		shortBadge: subject?.slice(0, 4)?.toUpperCase() || "MISC",
		icon: "code",
		className: "bg-m3-surface-container-high text-m3-on-surface-variant",
	};
};

export const specialConditionOptionsForSubject = (subject: string) => {
	const normalizedSubject = normalizeSubject(subject);
	return specialConditionOptions.filter((option) =>
		(option.subjects ?? ["word"]).includes(normalizedSubject),
	);
};

export const groupSpecialConditionOptions = (
	options: SpecialConditionOption[],
): SpecialConditionOptionGroup[] => {
	const remaining = new Set(options);
	const grouped: SpecialConditionOptionGroup[] = [];

	for (const group of specialConditionGroups) {
		const groupOptions = options.filter(
			(option) => remaining.has(option) && group.matches(option),
		);
		if (groupOptions.length === 0) continue;
		grouped.push({ label: group.label, options: groupOptions });
		for (const option of groupOptions) {
			remaining.delete(option);
		}
	}

	if (remaining.size > 0) {
		grouped.push({ label: "Khác", options: Array.from(remaining) });
	}

	return grouped;
};

export const splitTextareaLines = (value: string) =>
	value
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter(Boolean);

export const cleanTextareaLines = (values?: string[]) =>
	(values ?? []).map((item) => item.trim()).filter(Boolean);

export const cleanFormulaFragmentLines = (values?: string[]) =>
	(values ?? []).map((item) => item.trim()).filter(Boolean);

export const escapeInternalNewlinesForTextareaLine = (value: string) =>
	value.replace(/\r?\n/g, "\\n");

export const parseTextRotationExpectedTexts = (value: string) =>
	splitTextareaLines(value).map(normalizeEscapedNewlines);

export const emptyRuleSet = (defaultSubject = "excel"): GradingRuleSet => ({
	id: "",
	subject: defaultSubject,
	version: "v1",
	isActive: true,
	projects: [],
});

export const emptyProject = (): ProjectXmlRule => ({
	projectCode: "",
	projectName: "",
	maxScore: 125,
	tasks: [],
});

export const emptyTask = (): TaskXmlRule => ({
	taskId: "",
	taskName: "",
	maxScore: 1,
	conditions: [],
});

export const emptyCondition = (): XmlGradingCondition => ({
	conditionId: "",
	score: 1,
	sourceFile: "xl/worksheets/sheet1.xml",
	expectedVariants: [{ expectedValues: [""] }],
	ignoreAttributes: [],
	compareMode: "xmlContainsNormalized",
	matchPolicy: "all",
	feedback: { successDetail: "", errorMessage: "", fixAction: "" },
	stopTaskIfFailed: false,
});

export const emptyFeedback = (): XmlConditionFeedback => ({
	successDetail: "",
	errorMessage: "",
	fixAction: "",
});

export const defaultSpecialConditionFeedback = (
	type?: SpecialConditionType,
): XmlConditionFeedback => {
	const generic = {
		successDetail: "Đã hoàn thành đúng yêu cầu.",
		errorMessage: "Bạn chưa thực hiện đúng yêu cầu.",
		fixAction: "Mở file và thực hiện lại đúng yêu cầu của task.",
	};

	switch (type) {
		case "excelMergedRange":
			return {
				successDetail: "Đã gộp đúng vùng ô yêu cầu.",
				errorMessage: "Chưa gộp đúng vùng ô yêu cầu.",
				fixAction:
					"Chọn đúng vùng ô -> Home -> menu Merge & Center -> Merge Across; không dùng Merge & Center nếu task chỉ yêu cầu gộp ngang.",
			};
		case "excelCellHyperlink":
			return {
				successDetail: "Đã tạo đúng siêu liên kết cho ô yêu cầu.",
				errorMessage: "Siêu liên kết của ô yêu cầu chưa đúng.",
				fixAction:
					"Chọn ô cần liên kết -> Insert -> Link -> chọn đúng sheet và ô đích.",
			};
		case "excelIconSetConditionalFormatting":
			return {
				successDetail: "Đã áp dụng đúng Icon Set Conditional Formatting.",
				errorMessage:
					"Conditional Formatting Icon Set chưa đúng vùng ô hoặc loại biểu tượng.",
				fixAction:
					"Chọn đúng vùng ô -> Home -> Conditional Formatting -> Icon Sets -> chọn đúng icon set.",
			};
		case "excelChartDataRange":
			return {
				successDetail: "Đã mở rộng đúng vùng dữ liệu của biểu đồ.",
				errorMessage: "Biểu đồ chưa bao gồm đúng vùng dữ liệu yêu cầu.",
				fixAction:
					"Chọn biểu đồ -> Select Data -> mở rộng category/value range đến đúng hàng yêu cầu.",
			};
		case "excelChartStyle":
			return {
				successDetail: "Đã áp dụng đúng Chart Style.",
				errorMessage: "Chart Style của biểu đồ chưa đúng.",
				fixAction:
					"Chọn biểu đồ -> Chart Design -> Chart Styles -> chọn đúng style yêu cầu.",
			};
		case "excelTextReplacement":
			return {
				successDetail: "Đã thay thế đúng toàn bộ văn bản yêu cầu.",
				errorMessage:
					"Workbook vẫn còn văn bản cũ hoặc chưa có đủ văn bản mới.",
				fixAction:
					"Dùng Find and Replace để thay tất cả các lần xuất hiện của văn bản cũ bằng văn bản mới.",
			};
		case "excelPrintTitles":
			return {
				successDetail: "Đã thiết lập đúng Print Titles cho worksheet.",
				errorMessage:
					"Worksheet chưa lặp lại đúng hàng logo/tiêu đề trên các trang in.",
				fixAction:
					"Vào Page Layout -> Print Titles -> Rows to repeat at top và chọn đúng các hàng yêu cầu.",
			};
		case "excelNumberFormat":
			return {
				successDetail: "Các ô dữ liệu số đã dùng đúng định dạng Number.",
				errorMessage:
					"Một hoặc nhiều ô dữ liệu số trong vùng yêu cầu chưa dùng định dạng Number.",
				fixAction:
					"Chọn đúng cột/vùng dữ liệu -> Home -> Number Format -> Number.",
			};
		case "excelChartLegend":
			return {
				successDetail: "Legend của biểu đồ đã ở đúng vị trí yêu cầu.",
				errorMessage: "Legend của biểu đồ chưa ở đúng vị trí yêu cầu.",
				fixAction:
					"Chọn biểu đồ -> Chart Design -> Add Chart Element -> Legend -> chọn vị trí đúng.",
			};
		case "excelDefinedName":
			return {
				successDetail: "Đã tạo đúng named range với tên và các vùng ô yêu cầu.",
				errorMessage:
					"Named range chưa đúng tên, thiếu vùng ô hoặc có thêm vùng ngoài yêu cầu.",
				fixAction:
					"Chọn đúng các vùng ô không liền kề -> Formulas -> Define Name -> nhập đúng tên vùng.",
			};
		case "excelFormulaReferences":
			return {
				successDetail: "Công thức đã dùng đúng các named range yêu cầu.",
				errorMessage:
					"Công thức chưa dùng đủ named range hoặc đang tham chiếu trực tiếp ô/vùng.",
				fixAction:
					"Nhập lại công thức bằng đúng các named range được yêu cầu, không thay bằng địa chỉ ô nếu task yêu cầu dùng named range.",
			};
		case "excelNoConditionalFormatting":
			return {
				successDetail:
					"Đã xóa toàn bộ conditional formatting trên worksheet yêu cầu.",
				errorMessage: "Worksheet vẫn còn conditional formatting.",
				fixAction:
					"Chọn worksheet -> Home -> Conditional Formatting -> Clear Rules -> Clear Rules from Entire Sheet.",
			};
		case "excelTextRotation":
			return {
				successDetail:
					"Các tiêu đề đã được xoay chữ đúng Angle Counterclockwise.",
				errorMessage:
					"Một hoặc nhiều tiêu đề chưa được xoay chữ đúng Angle Counterclockwise.",
				fixAction:
					"Chọn các ô tiêu đề yêu cầu -> Home -> Orientation -> Angle Counterclockwise.",
			};
		case "excelMultiColumnSort":
			return {
				successDetail: "Dữ liệu đã được sắp xếp đúng theo các cột yêu cầu.",
				errorMessage: "Thứ tự dữ liệu chưa đúng theo các khóa sắp xếp yêu cầu.",
				fixAction:
					"Dùng Data -> Sort và thêm đúng thứ tự khóa sắp xếp, khóa trên trước rồi đến khóa phụ.",
			};
		case "excelFreezePanes":
			return {
				successDetail: "Đã cố định đúng các hàng cần giữ khi cuộn dọc.",
				errorMessage:
					"Worksheet chưa cố định đúng các hàng cần giữ khi cuộn dọc.",
				fixAction:
					"Chọn ô ngay bên dưới các hàng cần giữ -> View -> Freeze Panes -> Freeze Panes.",
			};
		case "excelDocumentProperty":
			return {
				successDetail: "Đã cập nhật đúng thuộc tính tài liệu yêu cầu.",
				errorMessage: "Thuộc tính tài liệu chưa có đúng giá trị yêu cầu.",
				fixAction:
					"Mở File -> Info -> Properties -> Advanced Properties hoặc Show All Properties, rồi nhập đúng giá trị thuộc tính.",
			};
		case "excelPrintArea":
			return {
				successDetail: "Đã thiết lập đúng vùng in cho worksheet yêu cầu.",
				errorMessage: "Worksheet chưa được thiết lập đúng vùng in yêu cầu.",
				fixAction:
					"Chọn đúng vùng ô -> Page Layout -> Print Area -> Set Print Area.",
			};
		case "excelTableColumnFormula":
			return {
				successDetail:
					"Đã thiết lập đúng công thức tính toán cho cột trong bảng.",
				errorMessage:
					"Cột trong bảng chưa có công thức hoặc công thức chưa đúng yêu cầu.",
				fixAction:
					"Nhập đúng công thức tính toán sử dụng tham chiếu bảng (ví dụ: =[@Total]-[@Commission] hoặc =RIGHT([@ID], 4)) cho cột yêu cầu.",
			};
		case "excelChartType":
			return {
				successDetail: "Đã tạo đúng loại biểu đồ yêu cầu trên trang tính.",
				errorMessage:
					"Chưa tìm thấy biểu đồ đúng loại trên trang tính yêu cầu.",
				fixAction:
					"Chọn vùng dữ liệu -> Insert -> Charts và chọn đúng loại biểu đồ (ví dụ: 3-D Clustered Bar). Hoặc chọn biểu đồ -> Chart Design -> Change Chart Type.",
			};
		case "excelWorksheetTabColor":
			return {
				successDetail: "Đã thiết lập đúng màu tab cho trang tính yêu cầu.",
				errorMessage: "Màu tab của trang tính chưa đúng màu yêu cầu.",
				fixAction:
					"Nhấp chuột phải vào tên tab trang tính -> Tab Color -> chọn đúng màu yêu cầu.",
			};
		case "textBoxContainsText":
			return {
				successDetail: "Đoạn văn đã được đưa vào hộp văn bản đúng yêu cầu.",
				errorMessage:
					"Hộp văn bản chưa chứa đúng nội dung hoặc đoạn văn chưa được chuyển khỏi thân tài liệu.",
				fixAction: "Bôi đen đoạn văn -> Cut -> Chọn vào hộp văn bản -> Paste.",
			};
		default:
			return generic;
	}
};

export const hasCustomFeedback = (feedback?: XmlConditionFeedback) =>
	!!feedback &&
	[feedback.successDetail, feedback.errorMessage, feedback.fixAction].some(
		(value) => value.trim().length > 0,
	);

export const cx = (...items: Array<string | false | null | undefined>) =>
	items.filter(Boolean).join(" ");

export const toRuleSetSummary = (
	ruleSet: GradingRuleSet,
): GradingRuleSetSummary => ({
	id: ruleSet.id,
	subject: ruleSet.subject,
	version: ruleSet.version,
	isActive: ruleSet.isActive,
	projectCount: ruleSet.projects.length,
	taskCount: ruleSet.projects.reduce(
		(sum, project) => sum + project.tasks.length,
		0,
	),
	conditionCount: ruleSet.projects.reduce(
		(sum, project) =>
			sum +
			project.tasks.reduce(
				(taskSum, task) => taskSum + task.conditions.length,
				0,
			),
		0,
	),
	maxScore: ruleSet.projects.reduce(
		(sum, project) => sum + Number(project.maxScore || 0),
		0,
	),
});

type LegacyXmlGradingCondition = XmlGradingCondition & {
	expectedValues?: string[];
};

export const expectedVariantsForEdit = (condition: XmlGradingCondition) => {
	const legacyCondition = condition as LegacyXmlGradingCondition;
	const rawVariants = condition.expectedVariants?.length
		? condition.expectedVariants
		: legacyCondition.expectedValues?.length
			? [{ expectedValues: legacyCondition.expectedValues }]
			: [{ expectedValues: [""] }];

	return rawVariants.map((variant) => ({
		expectedValues: Array.isArray(variant?.expectedValues)
			? variant.expectedValues
			: [""],
	}));
};

export const parseExpectedValuesInput = (value: string) =>
	value
		.replace(/\r\n/g, "\n")
		.split(/\n\s*\n/)
		.map((fragment) => fragment.trim())
		.filter(Boolean);

export const formatExpectedValuesInput = (values: string[]) =>
	(values ?? []).join("\n\n");

export const twipsPerInch = 1440;
export const centimetersPerInch = 2.54;

export const parseMarginInputToTwips = (value: string) => {
	const raw = value.trim().replace(",", ".");
	if (!raw) return undefined;

	const match = raw.match(
		/^(-?\d+(?:\.\d*)?|\.\d+)\s*(cm|centimeter|centimeters|in|inh|inch|inches|")?$/i,
	);
	if (!match) return undefined;

	const amount = Number(match[1]);
	if (!Number.isFinite(amount) || amount < 0) return undefined;

	const unit = (match[2] ?? "in").toLowerCase();
	const inches =
		unit === "cm" || unit === "centimeter" || unit === "centimeters"
			? amount / centimetersPerInch
			: amount;

	return Math.round(inches * twipsPerInch);
};

export const prepareCondition = (
	condition: XmlGradingCondition,
): XmlGradingCondition => ({
	...condition,
	expectedVariants: expectedVariantsForEdit(condition)
		.map((variant) => ({
			expectedValues: (variant.expectedValues ?? [])
				.map((value) => value.trim())
				.filter(Boolean),
		}))
		.filter((variant) => variant.expectedValues.length > 0),
	ignoreAttributes: (condition.ignoreAttributes ?? [])
		.map((value) => value.trim())
		.filter(Boolean),
	minOccurrences:
		condition.minOccurrences && condition.minOccurrences > 0
			? condition.minOccurrences
			: undefined,
	maxOccurrences:
		condition.maxOccurrences && condition.maxOccurrences > 0
			? condition.maxOccurrences
			: undefined,
});

const SPECIAL_CONDITION_CONFIG_PROP_MAP: Record<string, string> = {
	pictureBullet: "config",
	insertedImage: "imageInsertConfig",
};

export const getSpecialConditionConfigProp = (type?: string): string | null => {
	if (!type) return null;
	return SPECIAL_CONDITION_CONFIG_PROP_MAP[type] ?? `${type}Config`;
};

export const prepareSpecialCondition = (
	specialCondition?: SpecialCondition,
): SpecialCondition | undefined => {
	if (!specialCondition) return undefined;

	const next: SpecialCondition = { ...specialCondition };

	// Sanitize: chỉ giữ lại config của type hiện tại, loại bỏ các config thừa của các type khác
	const activeConfigProp = getSpecialConditionConfigProp(next.type);
	if (activeConfigProp) {
		const raw = next as unknown as Record<string, unknown>;
		for (const key of Object.keys(raw)) {
			if (key === "type" || key === "score" || key === "feedback") continue;
			if (
				key !== activeConfigProp &&
				(key === "config" || key.endsWith("Config"))
			) {
				delete raw[key];
			}
		}
	}

	if (next.excelChartDataRangeConfig) {
		next.excelChartDataRangeConfig = {
			...next.excelChartDataRangeConfig,
			expectedValueRanges: cleanTextareaLines(
				next.excelChartDataRangeConfig.expectedValueRanges,
			),
			expectedSeriesNames: cleanTextareaLines(
				next.excelChartDataRangeConfig.expectedSeriesNames,
			),
		};
	}

	if (next.excelDefinedNameConfig) {
		next.excelDefinedNameConfig = {
			...next.excelDefinedNameConfig,
			expectedRanges: cleanTextareaLines(
				next.excelDefinedNameConfig.expectedRanges,
			),
		};
	}

	if (next.excelFormulaReferencesConfig) {
		next.excelFormulaReferencesConfig = {
			...next.excelFormulaReferencesConfig,
			requiredReferences: cleanTextareaLines(
				next.excelFormulaReferencesConfig.requiredReferences,
			),
			requiredFunctions: cleanTextareaLines(
				next.excelFormulaReferencesConfig.requiredFunctions,
			),
			requiredFormulaFragments: cleanFormulaFragmentLines(
				next.excelFormulaReferencesConfig.requiredFormulaFragments,
			),
		};
	}

	if (next.excelTextRotationConfig) {
		next.excelTextRotationConfig = {
			...next.excelTextRotationConfig,
			expectedTexts: cleanTextareaLines(
				next.excelTextRotationConfig.expectedTexts,
			).map(normalizeEscapedNewlines),
		};
	}

	if (next.excelCompatibilityReportConfig) {
		next.excelCompatibilityReportConfig = {
			...next.excelCompatibilityReportConfig,
			expectedTexts: cleanTextareaLines(
				next.excelCompatibilityReportConfig.expectedTexts,
			),
		};
	}

	return next;
};

export const prepareRuleSet = (ruleSet: GradingRuleSet): GradingRuleSet => ({
	...ruleSet,
	projects: ruleSet.projects.map((project) => ({
		...project,
		tasks: project.tasks.map((task) => ({
			...task,
			specialCondition: prepareSpecialCondition(task.specialCondition),
			additionalSpecialConditions: task.additionalSpecialConditions?.map(
				(condition) => ({ ...prepareSpecialCondition(condition)!, score: 0 }),
			),
			conditions: task.conditions.map(prepareCondition),
		})),
	})),
});
