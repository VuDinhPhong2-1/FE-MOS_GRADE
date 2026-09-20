import { Icon } from "@bug-on/m3-expressive";
import type { ClipboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { showConfirm } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { usePageHeader } from "../context/PageActionsContext";
import {
	InsertedImageEditor,
	PictureBulletEditor,
	PictureStyleEditor,
} from "../features/xml-grading-rules";
import { xmlGradingRulesService } from "../services/xml-grading-rules.service";
import type {
	GradingRuleSet,
	GradingRuleSetSummary,
	ImageInsertConfig,
	PageBorderConfig,
	PictureBulletConfig,
	PictureStyleConfig,
	ProjectXmlRule,
	SpecialCondition,
	SpecialConditionType,
	TaskXmlRule,
	XmlCompareMode,
	XmlGradingCondition,
	XmlMatchPolicy,
	XmlRuleValidationResult,
} from "../types/xml-grading-rules.types";
import { notify } from "../utils/notify";
import { hasPermission } from "../utils/permissions";

const compareModes: XmlCompareMode[] = [
	"xmlContainsNormalized",
	"xmlContains",
	"xmlMinOccurrences",
	"xmlEquivalentWholeFile",
	"exactStringContains",
];
const matchPolicies: XmlMatchPolicy[] = ["all", "any", "ordered"];

const compareModesLabels: Record<XmlCompareMode, string> = {
	xmlContainsNormalized: "TÃ¬m XML, bá» qua khÃ¡c biá»‡t vá» khoáº£ng tráº¯ng vÃ  format",

	xmlContains: "TÃ¬m Ä‘Ãºng Ä‘oáº¡n XML Ä‘Ã£ nháº­p, chá»‰ bá» khoáº£ng tráº¯ng Ä‘áº§u vÃ  cuá»‘i",

	xmlMinOccurrences: "Äáº¿m sá»‘ láº§n xuáº¥t hiá»‡n tá»‘i thiá»ƒu sau khi chuáº©n hÃ³a XML",

	xmlEquivalentWholeFile:
		"Äá»c XML vÃ  so sÃ¡nh toÃ n bá»™ cáº¥u trÃºc, khÃ´ng phá»¥ thuá»™c format",

	exactStringContains:
		"TÃ¬m Ä‘Ãºng chuá»—i kÃ½ tá»±, khÃ´ng thay Ä‘á»•i hoáº·c chuáº©n hÃ³a ná»™i dung",
};

const matchPoliciesLabels: Record<XmlMatchPolicy, string> = {
	all: "Táº¥t cáº£ Ä‘iá»u kiá»‡n",
	any: "Báº¥t ká»³ Ä‘iá»u kiá»‡n nÃ o",
	ordered: "Theo thá»© tá»±",
};

// Danh sÃ¡ch cÃ¡c loáº¡i Ä‘iá»u kiá»‡n Ä‘áº·c biá»‡t há»— trá»£ theo tá»«ng Task.
// ThÃªm loáº¡i má»›i chá»‰ cáº§n bá»• sung thÃªm 1 pháº§n tá»­ vÃ o máº£ng nÃ y.
const specialConditionOptions: Array<{
	value: SpecialConditionType;
	label: string;
	description: string;
	subjects?: string[];
}> = [
	{
		value: "pictureBullet",
		label: "Dáº¥u Ä‘áº§u dÃ²ng báº±ng hÃ¬nh áº£nh",
		description:
			"Kiá»ƒm tra paragraph cÃ³ sá»­ dá»¥ng Ä‘Ãºng hÃ¬nh áº£nh lÃ m dáº¥u Ä‘áº§u dÃ²ng hay khÃ´ng.",
	},
	{
		value: "insertedImage",
		label: "ChÃ¨n Ä‘Ãºng hÃ¬nh áº£nh vÃ o tÃ i liá»‡u",
		description:
			"Kiá»ƒm tra tÃ i liá»‡u cÃ³ chÃ¨n Ä‘Ãºng file áº£nh yÃªu cáº§u (so khá»›p theo ná»™i dung áº£nh) vÃ  Ä‘Ãºng cháº¿ Ä‘á»™ ngáº¯t dÃ²ng vÄƒn báº£n (Tight/Square/Through/Top and Bottom/Inline...) hay khÃ´ng.",
	},
	{
		value: "convertTableToText",
		label: "Chuyá»ƒn báº£ng thÃ nh vÄƒn báº£n",
		description:
			"Kiá»ƒm tra báº£ng Word Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn thÃ nh cÃ¡c dÃ²ng vÄƒn báº£n vÃ  tÃ¡ch cá»™t báº±ng tab.",
	},
	{
		value: "hyperlink",
		label: "SiÃªu liÃªn káº¿t Word",
		description:
			"Kiá»ƒm tra vÄƒn báº£n hiá»ƒn thá»‹ vÃ  URL cá»§a siÃªu liÃªn káº¿t trong Word.",
	},
	{
		value: "sectionBreakBeforeText",
		label: "Ngáº¯t pháº§n trÆ°á»›c vÄƒn báº£n",
		description:
			"Kiá»ƒm tra ngáº¯t pháº§n Ä‘Ãºng loáº¡i náº±m ngay trÆ°á»›c Ä‘oáº¡n vÄƒn báº£n má»¥c tiÃªu trong Word.",
	},
	{
		value: "pictureStyle",
		label: "Kiá»ƒu áº£nh Word",
		description:
			"Kiá»ƒm tra áº£nh má»¥c tiÃªu cÃ³ viá»n/kiá»ƒu áº£nh Ä‘Ãºng theo XML DrawingML trong Word.",
	},
	{
		value: "textBoxContainsText",
		label: "Há»™p vÄƒn báº£n chá»©a Ä‘Ãºng ná»™i dung",
		description:
			"Kiá»ƒm tra Ä‘oáº¡n vÄƒn Ä‘Ã£ Ä‘Æ°á»£c Ä‘Æ°a vÃ o há»™p vÄƒn báº£n, ná»™i dung Ä‘Ãºng Ä‘áº§y Ä‘á»§ vÃ  cÃ³ thá»ƒ báº¯t lá»—i copy thay vÃ¬ cut hoáº·c paste khÃ´ng máº·c Ä‘á»‹nh.",
	},
	{
		value: "pageMargins",
		label: "Lá» trang Word",
		description:
			"Kiá»ƒm tra lá» trÃªn/dÆ°á»›i/trÃ¡i/pháº£i cá»§a tÃ i liá»‡u Word. CÃ³ thá»ƒ nháº­p inch hoáº·c cm.",
	},
	{
		value: "documentStyleSet",
		label: "Bá»™ kiá»ƒu tÃ i liá»‡u Word",
		description:
			"Kiá»ƒm tra style set cá»§a Word báº±ng cÃ¡c dáº¥u hiá»‡u XML á»•n Ä‘á»‹nh trong word/styles.xml.",
	},
	{
		value: "pageBorder",
		label: "ÄÆ°á»ng viá»n trang Word",
		description:
			"Kiá»ƒm tra Page Border cá»§a Word: 4 cáº¡nh Box, kiá»ƒu nÃ©t, mÃ u vÃ  Ä‘á»™ dÃ y viá»n.",
	},
	{
		value: "wordTableSort",
		label: "Sáº¯p xáº¿p báº£ng Word",
		description:
			"Kiá»ƒm tra báº£ng Word Ä‘Ã£ Ä‘Æ°á»£c sáº¯p xáº¿p Ä‘Ãºng theo má»™t cá»™t, vÃ­ dá»¥ Flavor A-Z trong Project 03.",
	},
	{
		value: "wordParagraphList",
		label: "Danh sÃ¡ch Word",
		description:
			"Kiá»ƒm tra cÃ¡c Ä‘oáº¡n vÄƒn Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn thÃ nh bullet/number list Ä‘Ãºng item, level vÃ  numbering.",
	},
	{
		value: "wordBookmark",
		label: "Bookmark Word",
		description:
			"Kiểm tra tài liệu có bookmark đúng tên và nằm ở đoạn văn bản mục tiêu.",
	},
	{
		value: "wordCustomToc",
		label: "Mục lục tùy chỉnh Word",
		description:
			"Kiểm tra TOC field có style-to-level mapping đúng, ví dụ Title=1, Heading 1=2.",
	},
	{
		value: "wordTextToTable",
		label: "Chuyển văn bản thành bảng Word",
		description:
			"Kiểm tra văn bản đã được chuyển thành bảng đúng số cột, số dòng tối thiểu và style bảng.",
	},
	{
		value: "wordBulletStyle",
		label: "Ký tự bullet Word",
		description:
			"Kiểm tra danh sách bullet dùng đúng ký tự bullet, ví dụ hình vuông đặc cho sidebar Ski Resorts.",
	},
	{
		value: "wordResolveComment",
		label: "Resolve comment Word",
		description:
			"Kiểm tra các comment trong tài liệu đã được đánh dấu resolved/done.",
	},
	{
		value: "excelTableName",
		label: "TÃªn báº£ng Excel",
		description:
			"Kiá»ƒm tra table trong Excel Ä‘Ã£ Ä‘Æ°á»£c Ä‘á»•i Ä‘Ãºng tÃªn, cÃ³ thá»ƒ giá»›i háº¡n theo worksheet.",
		subjects: ["excel"],
	},
	{
		value: "excelWorksheetPageSetup",
		label: "Thiáº¿t láº­p trang Excel",
		description:
			"Kiá»ƒm tra thiáº¿t láº­p trang tÃ­nh Excel, hiá»‡n há»— trá»£ orientation portrait/landscape.",
		subjects: ["excel"],
	},
	{
		value: "excelClearCellFormatting",
		label: "XÃ³a Ä‘á»‹nh dáº¡ng Ã´ Excel",
		description:
			"Kiá»ƒm tra má»™t vÃ¹ng Ã´ trÃªn worksheet Ä‘Ã£ Ä‘Æ°á»£c xÃ³a Ä‘á»‹nh dáº¡ng vá» style máº·c Ä‘á»‹nh.",
		subjects: ["excel"],
	},
	{
		value: "excelDataModelImport",
		label: "Nháº­p Data Model Excel",
		description:
			"Kiá»ƒm tra workbook cÃ³ connection import tá»« file nguá»“n vÃ  dáº¥u hiá»‡u Data Model.",
		subjects: ["excel"],
	},
	{
		value: "excelCompatibilityReport",
		label: "BÃ¡o cÃ¡o tÆ°Æ¡ng thÃ­ch Excel",
		description:
			"Kiá»ƒm tra workbook cÃ³ worksheet/vÄƒn báº£n káº¿t quáº£ Compatibility Checker.",
		subjects: ["excel"],
	},
	{
		value: "excelMergedRange",
		label: "Gá»™p Ã´ Excel",
		description:
			"Kiá»ƒm tra má»™t vÃ¹ng Ã´ trÃªn worksheet Ä‘Ã£ Ä‘Æ°á»£c gá»™p Ä‘Ãºng, vÃ­ dá»¥ A1:E1.",
		subjects: ["excel"],
	},
	{
		value: "excelCellHyperlink",
		label: "SiÃªu liÃªn káº¿t Ã´ Excel",
		description:
			"Kiá»ƒm tra siÃªu liÃªn káº¿t ná»™i bá»™ hoáº·c liÃªn káº¿t ngoÃ i táº¡i má»™t Ã´ Excel cá»¥ thá»ƒ.",
		subjects: ["excel"],
	},
	{
		value: "excelIconSetConditionalFormatting",
		label: "Äá»‹nh dáº¡ng cÃ³ Ä‘iá»u kiá»‡n Icon Set",
		description:
			"Kiá»ƒm tra vÃ¹ng Ã´ cÃ³ Conditional Formatting dáº¡ng Icon Set Ä‘Ãºng loáº¡i, vÃ­ dá»¥ 3Flags.",
		subjects: ["excel"],
	},
	{
		value: "excelChartDataRange",
		label: "VÃ¹ng dá»¯ liá»‡u biá»ƒu Ä‘á»“ Excel",
		description:
			"Kiá»ƒm tra biá»ƒu Ä‘á»“ Ä‘Ã£ má»Ÿ rá»™ng Ä‘Ãºng vÃ¹ng category/value vÃ  sá»‘ Ä‘iá»ƒm dá»¯ liá»‡u.",
		subjects: ["excel"],
	},
	{
		value: "excelChartStyle",
		label: "Kiá»ƒu biá»ƒu Ä‘á»“ Excel",
		description:
			"Kiá»ƒm tra mÃ£ chart style trong xl/charts/style*.xml, vÃ­ dá»¥ Style 4 thÆ°á»ng lÃ  id 204.",
		subjects: ["excel"],
	},
	{
		value: "excelTextReplacement",
		label: "Thay tháº¿ vÄƒn báº£n Excel",
		description:
			"Kiá»ƒm tra Ä‘Ã£ thay toÃ n bá»™ má»™t tá»«/cá»¥m tá»« cÅ© báº±ng tá»«/cá»¥m tá»« má»›i trong workbook.",
		subjects: ["excel"],
	},
	{
		value: "excelPrintTitles",
		label: "TiÃªu Ä‘á» in Excel",
		description:
			"Kiá»ƒm tra worksheet Ä‘Ã£ láº·p láº¡i Ä‘Ãºng cÃ¡c hÃ ng tiÃªu Ä‘á»/logo khi in.",
		subjects: ["excel"],
	},
	{
		value: "excelNumberFormat",
		label: "Äá»‹nh dáº¡ng sá»‘ Excel",
		description:
			"Kiá»ƒm tra cÃ¡c Ã´ dá»¯ liá»‡u sá»‘ trong vÃ¹ng/cá»™t Ä‘Ã£ dÃ¹ng Ä‘á»‹nh dáº¡ng Number.",
		subjects: ["excel"],
	},
	{
		value: "excelChartLegend",
		label: "Vá»‹ trÃ­ chÃº giáº£i biá»ƒu Ä‘á»“",
		description: "Kiá»ƒm tra vá»‹ trÃ­ chÃº giáº£i cá»§a biá»ƒu Ä‘á»“, vÃ­ dá»¥ Top.",
		subjects: ["excel"],
	},
	{
		value: "excelDefinedName",
		label: "Named range Excel",
		description:
			"Kiá»ƒm tra named range cÃ³ Ä‘Ãºng tÃªn vÃ  trá» Ä‘Ãºng cÃ¡c vÃ¹ng Ã´ yÃªu cáº§u, ká»ƒ cáº£ vÃ¹ng khÃ´ng liá»n ká».",
		subjects: ["excel"],
	},
	{
		value: "excelFormulaReferences",
		label: "CÃ´ng thá»©c dÃ¹ng named range",
		description:
			"Kiá»ƒm tra Ã´ cÃ³ cÃ´ng thá»©c dÃ¹ng Ä‘á»§ cÃ¡c named range báº¯t buá»™c vÃ  khÃ´ng tham chiáº¿u trá»±c tiáº¿p Ã´/vÃ¹ng khi cáº§n báº¯t cháº·t.",
		subjects: ["excel"],
	},
	{
		value: "excelNoConditionalFormatting",
		label: "XÃ³a Conditional Formatting",
		description:
			"Kiá»ƒm tra worksheet Ä‘Ã£ xÃ³a toÃ n bá»™ conditional formatting, khÃ´ng chá»‰ xÃ³a Ä‘á»‹nh dáº¡ng Ã´ thÆ°á»ng.",
		subjects: ["excel"],
	},
	{
		value: "excelTextRotation",
		label: "Xoay chá»¯ Excel",
		description:
			"Kiá»ƒm tra cÃ¡c tiÃªu Ä‘á» Ä‘Ã£ dÃ¹ng Ä‘Ãºng textRotation, vÃ­ dá»¥ Angle Counterclockwise.",
		subjects: ["excel"],
	},
	{
		value: "excelMultiColumnSort",
		label: "Sáº¯p xáº¿p nhiá»u cá»™t Excel",
		description:
			"Kiá»ƒm tra thá»© tá»± dá»¯ liá»‡u thá»±c táº¿ sau khi sort theo nhiá»u khÃ³a, vÃ­ dá»¥ Wired Equipment rá»“i Port Size.",
		subjects: ["excel"],
	},
	{
		value: "excelFreezePanes",
		label: "Cá»‘ Ä‘á»‹nh ngÄƒn Excel",
		description:
			"Kiá»ƒm tra worksheet Ä‘Ã£ cá»‘ Ä‘á»‹nh Ä‘Ãºng hÃ ng/cá»™t khi cuá»™n, vÃ­ dá»¥ giá»¯ hÃ ng 1 Ä‘áº¿n 3 khi cuá»™n dá»c.",
		subjects: ["excel"],
	},
	{
		value: "excelDocumentProperty",
		label: "Thuá»™c tÃ­nh tÃ i liá»‡u Excel",
		description:
			"Kiá»ƒm tra custom document property cá»§a workbook, vÃ­ dá»¥ Status = Draft.",
		subjects: ["excel"],
	},
	{
		value: "excelPrintArea",
		label: "VÃ¹ng in Excel",
		description:
			"Kiá»ƒm tra worksheet Ä‘Ã£ Ä‘áº·t Ä‘Ãºng vÃ¹ng in, vÃ­ dá»¥ Q1 Sales!A1:F17.",
		subjects: ["excel"],
	},
];

const normalizeSubject = (value: string) => value.trim().toLowerCase();

const specialConditionOptionsForSubject = (subject: string) => {
	const normalizedSubject = normalizeSubject(subject);
	return specialConditionOptions.filter((option) =>
		(option.subjects ?? ["word"]).includes(normalizedSubject),
	);
};

type SpecialConditionOption = (typeof specialConditionOptions)[number];
type GroupedSpecialConditionOption =
	| { type: "group"; label: string }
	| { type: "option"; option: SpecialConditionOption };

const specialConditionGroups: Array<{
	label: string;
	matches: (option: SpecialConditionOption) => boolean;
}> = [
	{
		label: "Word - VÄƒn báº£n vÃ  bá»‘ cá»¥c",
		matches: (option) =>
			[
				"convertTableToText",
				"hyperlink",
				"sectionBreakBeforeText",
				"textBoxContainsText",
				"pageMargins",
				"documentStyleSet",
				"pageBorder",
				"wordTableSort",
				"wordParagraphList",
			].includes(option.value),
	},
	{
		label: "Word - HÃ¬nh áº£nh",
		matches: (option) =>
			["pictureBullet", "insertedImage", "pictureStyle"].includes(option.value),
	},
	{
		label: "Excel - Biá»ƒu Ä‘á»“",
		matches: (option) =>
			["excelChartDataRange", "excelChartStyle", "excelChartLegend"].includes(
				option.value,
			),
	},
	{
		label: "Excel - Dá»¯ liá»‡u vÃ  cÃ´ng thá»©c",
		matches: (option) =>
			[
				"excelTableName",
				"excelDefinedName",
				"excelFormulaReferences",
				"excelTextReplacement",
				"excelMultiColumnSort",
				"excelDataModelImport",
			].includes(option.value),
	},
	{
		label: "Excel - Trang in vÃ  workbook",
		matches: (option) =>
			[
				"excelWorksheetPageSetup",
				"excelPrintTitles",
				"excelFreezePanes",
				"excelPrintArea",
				"excelDocumentProperty",
				"excelCompatibilityReport",
			].includes(option.value),
	},
	{
		label: "Excel - Äá»‹nh dáº¡ng",
		matches: (option) =>
			[
				"excelClearCellFormatting",
				"excelIconSetConditionalFormatting",
				"excelNumberFormat",
				"excelNoConditionalFormatting",
				"excelTextRotation",
				"excelMergedRange",
				"excelCellHyperlink",
			].includes(option.value),
	},
];

const groupSpecialConditionOptions = (
	options: SpecialConditionOption[],
): GroupedSpecialConditionOption[] => {
	const remaining = new Set(options);
	const grouped: GroupedSpecialConditionOption[] = [];

	for (const group of specialConditionGroups) {
		const groupOptions = options.filter(
			(option) => remaining.has(option) && group.matches(option),
		);
		if (groupOptions.length === 0) continue;
		grouped.push({ type: "group", label: group.label });
		grouped.push(
			...groupOptions.map((option) => ({ type: "option" as const, option })),
		);
		for (const option of groupOptions) {
			remaining.delete(option);
		}
	}

	if (remaining.size > 0) {
		grouped.push({ type: "group", label: "KhÃ¡c" });
		grouped.push(
			...Array.from(remaining).map((option) => ({
				type: "option" as const,
				option,
			})),
		);
	}

	return grouped;
};

const splitTextareaLines = (value: string) =>
	value.split(/\r?\n/).map((item) => item.trim());

const cleanTextareaLines = (values?: string[]) =>
	(values ?? []).map((item) => item.trim()).filter(Boolean);

const textareaValueAfterPaste = (
	event: ClipboardEvent<HTMLTextAreaElement>,
) => {
	const textarea = event.currentTarget;
	const pastedText = event.clipboardData.getData("text");
	return `${textarea.value.slice(0, textarea.selectionStart)}${pastedText}${textarea.value.slice(textarea.selectionEnd)}`;
};

const emptyRuleSet = (): GradingRuleSet => ({
	id: "",
	subject: "excel",
	version: "v1",
	isActive: false,
	projects: [],
});
const emptyProject = (): ProjectXmlRule => ({
	projectCode: "project22",
	projectName: "",
	maxScore: 125,
	tasks: [],
});
const emptyTask = (): TaskXmlRule => ({
	taskId: "",
	taskName: "",
	maxScore: 1,
	conditions: [],
});
const emptyCondition = (): XmlGradingCondition => ({
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

const emptyFeedback = () => ({
	successDetail: "",
	errorMessage: "",
	fixAction: "",
});

const defaultSpecialConditionFeedback = (
	type?: SpecialConditionType,
): ReturnType<typeof emptyFeedback> => {
	const generic = {
		successDetail: "ÄÃ£ hoÃ n thÃ nh Ä‘Ãºng yÃªu cáº§u.",
		errorMessage: "Báº¡n chÆ°a thá»±c hiá»‡n Ä‘Ãºng yÃªu cáº§u.",
		fixAction: "Má»Ÿ file vÃ  thá»±c hiá»‡n láº¡i Ä‘Ãºng yÃªu cáº§u cá»§a task.",
	};

	switch (type) {
		case "excelMergedRange":
			return {
				successDetail: "ÄÃ£ gá»™p Ä‘Ãºng vÃ¹ng Ã´ yÃªu cáº§u.",
				errorMessage: "ChÆ°a gá»™p Ä‘Ãºng vÃ¹ng Ã´ yÃªu cáº§u.",
				fixAction:
					"Chá»n Ä‘Ãºng vÃ¹ng Ã´ -> Home -> menu Merge & Center -> Merge Across; khÃ´ng dÃ¹ng Merge & Center náº¿u task chá»‰ yÃªu cáº§u gá»™p ngang.",
			};
		case "excelCellHyperlink":
			return {
				successDetail: "ÄÃ£ táº¡o Ä‘Ãºng siÃªu liÃªn káº¿t cho Ã´ yÃªu cáº§u.",
				errorMessage: "SiÃªu liÃªn káº¿t cá»§a Ã´ yÃªu cáº§u chÆ°a Ä‘Ãºng.",
				fixAction:
					"Chá»n Ã´ cáº§n liÃªn káº¿t -> Insert -> Link -> chá»n Ä‘Ãºng sheet vÃ  Ã´ Ä‘Ã­ch.",
			};
		case "excelIconSetConditionalFormatting":
			return {
				successDetail: "ÄÃ£ Ã¡p dá»¥ng Ä‘Ãºng Icon Set Conditional Formatting.",
				errorMessage:
					"Conditional Formatting Icon Set chÆ°a Ä‘Ãºng vÃ¹ng Ã´ hoáº·c loáº¡i biá»ƒu tÆ°á»£ng.",
				fixAction:
					"Chá»n Ä‘Ãºng vÃ¹ng Ã´ -> Home -> Conditional Formatting -> Icon Sets -> chá»n Ä‘Ãºng icon set.",
			};
		case "excelChartDataRange":
			return {
				successDetail: "ÄÃ£ má»Ÿ rá»™ng Ä‘Ãºng vÃ¹ng dá»¯ liá»‡u cá»§a biá»ƒu Ä‘á»“.",
				errorMessage: "Biá»ƒu Ä‘á»“ chÆ°a bao gá»“m Ä‘Ãºng vÃ¹ng dá»¯ liá»‡u yÃªu cáº§u.",
				fixAction:
					"Chá»n biá»ƒu Ä‘á»“ -> Select Data -> má»Ÿ rá»™ng category/value range Ä‘áº¿n Ä‘Ãºng hÃ ng yÃªu cáº§u.",
			};
		case "excelChartStyle":
			return {
				successDetail: "ÄÃ£ Ã¡p dá»¥ng Ä‘Ãºng Chart Style.",
				errorMessage: "Chart Style cá»§a biá»ƒu Ä‘á»“ chÆ°a Ä‘Ãºng.",
				fixAction:
					"Chá»n biá»ƒu Ä‘á»“ -> Chart Design -> Chart Styles -> chá»n Ä‘Ãºng style yÃªu cáº§u.",
			};
		case "excelTextReplacement":
			return {
				successDetail: "ÄÃ£ thay tháº¿ Ä‘Ãºng toÃ n bá»™ vÄƒn báº£n yÃªu cáº§u.",
				errorMessage:
					"Workbook váº«n cÃ²n vÄƒn báº£n cÅ© hoáº·c chÆ°a cÃ³ Ä‘á»§ vÄƒn báº£n má»›i.",
				fixAction:
					"DÃ¹ng Find and Replace Ä‘á»ƒ thay táº¥t cáº£ cÃ¡c láº§n xuáº¥t hiá»‡n cá»§a vÄƒn báº£n cÅ© báº±ng vÄƒn báº£n má»›i.",
			};
		case "excelPrintTitles":
			return {
				successDetail: "ÄÃ£ thiáº¿t láº­p Ä‘Ãºng Print Titles cho worksheet.",
				errorMessage:
					"Worksheet chÆ°a láº·p láº¡i Ä‘Ãºng hÃ ng logo/tiÃªu Ä‘á» trÃªn cÃ¡c trang in.",
				fixAction:
					"VÃ o Page Layout -> Print Titles -> Rows to repeat at top vÃ  chá»n Ä‘Ãºng cÃ¡c hÃ ng yÃªu cáº§u.",
			};
		case "excelNumberFormat":
			return {
				successDetail: "CÃ¡c Ã´ dá»¯ liá»‡u sá»‘ Ä‘Ã£ dÃ¹ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng Number.",
				errorMessage:
					"Má»™t hoáº·c nhiá»u Ã´ dá»¯ liá»‡u sá»‘ trong vÃ¹ng yÃªu cáº§u chÆ°a dÃ¹ng Ä‘á»‹nh dáº¡ng Number.",
				fixAction:
					"Chá»n Ä‘Ãºng cá»™t/vÃ¹ng dá»¯ liá»‡u -> Home -> Number Format -> Number.",
			};
		case "excelChartLegend":
			return {
				successDetail: "Legend cá»§a biá»ƒu Ä‘á»“ Ä‘Ã£ á»Ÿ Ä‘Ãºng vá»‹ trÃ­ yÃªu cáº§u.",
				errorMessage: "Legend cá»§a biá»ƒu Ä‘á»“ chÆ°a á»Ÿ Ä‘Ãºng vá»‹ trÃ­ yÃªu cáº§u.",
				fixAction:
					"Chá»n biá»ƒu Ä‘á»“ -> Chart Design -> Add Chart Element -> Legend -> chá»n vá»‹ trÃ­ Ä‘Ãºng.",
			};
		case "excelDefinedName":
			return {
				successDetail: "ÄÃ£ táº¡o Ä‘Ãºng named range vá»›i tÃªn vÃ  cÃ¡c vÃ¹ng Ã´ yÃªu cáº§u.",
				errorMessage:
					"Named range chÆ°a Ä‘Ãºng tÃªn, thiáº¿u vÃ¹ng Ã´ hoáº·c cÃ³ thÃªm vÃ¹ng ngoÃ i yÃªu cáº§u.",
				fixAction:
					"Chá»n Ä‘Ãºng cÃ¡c vÃ¹ng Ã´ khÃ´ng liá»n ká» -> Formulas -> Define Name -> nháº­p Ä‘Ãºng tÃªn vÃ¹ng.",
			};
		case "excelFormulaReferences":
			return {
				successDetail: "CÃ´ng thá»©c Ä‘Ã£ dÃ¹ng Ä‘Ãºng cÃ¡c named range yÃªu cáº§u.",
				errorMessage:
					"CÃ´ng thá»©c chÆ°a dÃ¹ng Ä‘á»§ named range hoáº·c Ä‘ang tham chiáº¿u trá»±c tiáº¿p Ã´/vÃ¹ng.",
				fixAction:
					"Nháº­p láº¡i cÃ´ng thá»©c báº±ng Ä‘Ãºng cÃ¡c named range Ä‘Æ°á»£c yÃªu cáº§u, khÃ´ng thay báº±ng Ä‘á»‹a chá»‰ Ã´ náº¿u task yÃªu cáº§u dÃ¹ng named range.",
			};
		case "excelNoConditionalFormatting":
			return {
				successDetail:
					"ÄÃ£ xÃ³a toÃ n bá»™ conditional formatting trÃªn worksheet yÃªu cáº§u.",
				errorMessage: "Worksheet váº«n cÃ²n conditional formatting.",
				fixAction:
					"Chá»n worksheet -> Home -> Conditional Formatting -> Clear Rules -> Clear Rules from Entire Sheet.",
			};
		case "excelTextRotation":
			return {
				successDetail:
					"CÃ¡c tiÃªu Ä‘á» Ä‘Ã£ Ä‘Æ°á»£c xoay chá»¯ Ä‘Ãºng Angle Counterclockwise.",
				errorMessage:
					"Má»™t hoáº·c nhiá»u tiÃªu Ä‘á» chÆ°a Ä‘Æ°á»£c xoay chá»¯ Ä‘Ãºng Angle Counterclockwise.",
				fixAction:
					"Chá»n cÃ¡c Ã´ tiÃªu Ä‘á» yÃªu cáº§u -> Home -> Orientation -> Angle Counterclockwise.",
			};
		case "excelMultiColumnSort":
			return {
				successDetail: "Dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c sáº¯p xáº¿p Ä‘Ãºng theo cÃ¡c cá»™t yÃªu cáº§u.",
				errorMessage: "Thá»© tá»± dá»¯ liá»‡u chÆ°a Ä‘Ãºng theo cÃ¡c khÃ³a sáº¯p xáº¿p yÃªu cáº§u.",
				fixAction:
					"DÃ¹ng Data -> Sort vÃ  thÃªm Ä‘Ãºng thá»© tá»± khÃ³a sáº¯p xáº¿p, khÃ³a trÃªn trÆ°á»›c rá»“i Ä‘áº¿n khÃ³a phá»¥.",
			};
		case "excelFreezePanes":
			return {
				successDetail: "ÄÃ£ cá»‘ Ä‘á»‹nh Ä‘Ãºng cÃ¡c hÃ ng cáº§n giá»¯ khi cuá»™n dá»c.",
				errorMessage:
					"Worksheet chÆ°a cá»‘ Ä‘á»‹nh Ä‘Ãºng cÃ¡c hÃ ng cáº§n giá»¯ khi cuá»™n dá»c.",
				fixAction:
					"Chá»n Ã´ ngay bÃªn dÆ°á»›i cÃ¡c hÃ ng cáº§n giá»¯ -> View -> Freeze Panes -> Freeze Panes.",
			};
		case "excelDocumentProperty":
			return {
				successDetail: "ÄÃ£ cáº­p nháº­t Ä‘Ãºng thuá»™c tÃ­nh tÃ i liá»‡u yÃªu cáº§u.",
				errorMessage: "Thuá»™c tÃ­nh tÃ i liá»‡u chÆ°a cÃ³ Ä‘Ãºng giÃ¡ trá»‹ yÃªu cáº§u.",
				fixAction:
					"Má»Ÿ File -> Info -> Properties -> Advanced Properties hoáº·c Show All Properties, rá»“i nháº­p Ä‘Ãºng giÃ¡ trá»‹ thuá»™c tÃ­nh.",
			};
		case "excelPrintArea":
			return {
				successDetail: "ÄÃ£ thiáº¿t láº­p Ä‘Ãºng vÃ¹ng in cho worksheet yÃªu cáº§u.",
				errorMessage: "Worksheet chÆ°a Ä‘Æ°á»£c thiáº¿t láº­p Ä‘Ãºng vÃ¹ng in yÃªu cáº§u.",
				fixAction:
					"Chá»n Ä‘Ãºng vÃ¹ng Ã´ -> Page Layout -> Print Area -> Set Print Area.",
			};
		default:
			return generic;
	}
};

const hasCustomFeedback = (feedback?: ReturnType<typeof emptyFeedback>) =>
	!!feedback &&
	[feedback.successDetail, feedback.errorMessage, feedback.fixAction].some(
		(value) => value.trim().length > 0,
	);

const cx = (...items: Array<string | false | null | undefined>) =>
	items.filter(Boolean).join(" ");

const toRuleSetSummary = (ruleSet: GradingRuleSet): GradingRuleSetSummary => ({
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

interface GradeTaskResultView {
	taskId?: string;
	taskName?: string;
	score?: number;
	maxScore?: number;
	isPassed?: boolean;
	details?: string[];
	errors?: string[];
	fixActions?: string[];
}

interface GradeResultView {
	projectId?: string;
	projectName?: string;
	totalScore?: number;
	maxScore?: number;
	percentage?: number;
	isPassed?: boolean;
	status?: string;
	taskResults?: GradeTaskResultView[];
}

type LegacyXmlGradingCondition = XmlGradingCondition & {
	expectedValues?: string[];
};

const expectedVariantsForEdit = (condition: XmlGradingCondition) => {
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

const parseExpectedValuesInput = (value: string) =>
	value
		.replace(/\r\n/g, "\n")
		.split(/\n\s*\n/)
		.map((fragment) => fragment.trim())
		.filter(Boolean);

const formatExpectedValuesInput = (values: string[]) =>
	(values ?? []).join("\n\n");

const twipsPerInch = 1440;
const centimetersPerInch = 2.54;

const parseMarginInputToTwips = (value: string) => {
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

const formatTwipsAsInches = (twips?: number) => {
	if (twips === undefined || twips === null) return "";
	const inches = twips / twipsPerInch;
	const value = Number.isInteger(inches)
		? `${inches}`
		: `${Number(inches.toFixed(3))}`;
	return `${value} in`;
};

interface MarginUnitInputProps {
	label: string;
	value?: number;
	placeholder: string;
	inputClass: string;
	onCommit: (value?: number) => void;
}

const MarginUnitInput = ({
	label,
	value,
	placeholder,
	inputClass,
	onCommit,
}: MarginUnitInputProps) => {
	const [draft, setDraft] = useState(formatTwipsAsInches(value));

	useEffect(() => {
		setDraft(formatTwipsAsInches(value));
	}, [value]);

	const commit = () => {
		if (!draft.trim()) {
			onCommit(undefined);
			return;
		}

		const twips = parseMarginInputToTwips(draft);
		if (twips === undefined) {
			notify.error(
				"GiÃ¡ trá»‹ lá» khÃ´ng há»£p lá»‡. HÃ£y nháº­p vÃ­ dá»¥: 1 in, 1.5 in, 2.54 cm.",
			);
			return;
		}

		onCommit(twips);
		setDraft(formatTwipsAsInches(twips));
	};

	return (
		<label className="text-xs font-semibold text-slate-600">
			{label}
			<input
				type="text"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.currentTarget.blur();
					}
				}}
				placeholder={placeholder}
				className={inputClass}
			/>
		</label>
	);
};

const pageBorderColorPresets = [
	{
		label: "Xanh nhat (Light Blue)",
		requiredColor: "00B0F0",
		allowedColors: ["00B0F0", "5B9BD5", "4F81BD", "accent1"],
	},
	{
		label: "Den",
		requiredColor: "000000",
		allowedColors: ["000000", "auto", "text1", "tx1", "dk1"],
	},
	{
		label: "Do",
		requiredColor: "FF0000",
		allowedColors: ["FF0000"],
	},
	{
		label: "Xanh la",
		requiredColor: "00B050",
		allowedColors: ["00B050"],
	},
];

const parsePageBorderWidthInput = (value: string) => {
	const raw = value
		.trim()
		.replace(",", ".")
		.replace(/Â½/g, " 1/2")
		.replace(/Â¼/g, " 1/4")
		.replace(/Â¾/g, " 3/4")
		.replace(/\b(wide|rá»™ng|rong)\b/gi, "")
		.replace(/\s+/g, " ")
		.toLowerCase()
		.trim();
	if (!raw) return undefined;

	const xmlMatch = raw.match(/^(\d+)\s*(xml|sz|eighth|eighths)?$/);
	if (xmlMatch?.[2]) {
		const width = Number(xmlMatch[1]);
		return Number.isFinite(width) && width > 0 ? width : undefined;
	}

	const fractionMatch = raw.match(
		/^(?:(\d+)\s*)?(\d+)\s*\/\s*(\d+)\s*(pt|point|points)?$/,
	);
	if (fractionMatch) {
		const whole = Number(fractionMatch[1] ?? 0);
		const numerator = Number(fractionMatch[2]);
		const denominator = Number(fractionMatch[3]);
		if (
			!Number.isFinite(whole) ||
			!Number.isFinite(numerator) ||
			!Number.isFinite(denominator) ||
			denominator <= 0
		) {
			return undefined;
		}

		return Math.round((whole + numerator / denominator) * 8);
	}

	const pointMatch = raw.match(/^(\d+(?:\.\d*)?|\.\d+)\s*(pt|point|points)?$/);
	if (!pointMatch) return undefined;

	const points = Number(pointMatch[1]);
	if (!Number.isFinite(points) || points <= 0) return undefined;

	return Math.round(points * 8);
};

const formatPageBorderWidth = (value?: number) => {
	if (!value) return "";
	const points = value / 8;
	return `${Number(points.toFixed(3))} pt`;
};

interface PageBorderWidthInputProps {
	value?: number;
	inputClass: string;
	onCommit: (value?: number) => void;
}

const PageBorderWidthInput = ({
	value,
	inputClass,
	onCommit,
}: PageBorderWidthInputProps) => {
	const [draft, setDraft] = useState(formatPageBorderWidth(value));

	useEffect(() => {
		setDraft(formatPageBorderWidth(value));
	}, [value]);

	const commit = () => {
		if (!draft.trim()) {
			onCommit(undefined);
			return;
		}

		const width = parsePageBorderWidthInput(draft);
		if (width === undefined) {
			notify.error(
				"Äá»™ dÃ y viá»n khÃ´ng há»£p lá»‡. HÃ£y nháº­p vÃ­ dá»¥: 1.5 pt, 1 1/2 pt, 1 1/2pt wide, 12 xml.",
			);
			return;
		}

		onCommit(width);
		setDraft(formatPageBorderWidth(width));
	};

	return (
		<label className="text-xs font-semibold text-slate-600">
			Äá»™ dÃ y viá»n
			<input
				type="text"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={commit}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.currentTarget.blur();
					}
				}}
				placeholder="1.5 pt hoáº·c 1 1/2 pt"
				className={inputClass}
			/>
		</label>
	);
};

const selectedPageBorderColorPreset = (config?: PageBorderConfig) => {
	const requiredColor = (config?.requiredColor ?? "").trim().toLowerCase();
	const allowedColors = (config?.allowedColors ?? [])
		.map((value) => value.trim().toLowerCase())
		.join("|");

	return (
		pageBorderColorPresets.find(
			(preset) =>
				requiredColor === preset.requiredColor.toLowerCase() ||
				preset.allowedColors.map((value) => value.toLowerCase()).join("|") ===
					allowedColors,
		)?.requiredColor ?? "custom"
	);
};

interface ExcelProject02SpecialConditionEditorProps {
	specialCondition: SpecialCondition;
	inputClass: string;
	onChange: (specialCondition: SpecialCondition) => void;
}

const ExcelProject02SpecialConditionEditor = ({
	specialCondition,
	inputClass,
	onChange,
}: ExcelProject02SpecialConditionEditorProps) => {
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
	const textareaClass = cx(inputClass, "min-h-[96px] resize-y");

	if (specialCondition.type === "excelMergedRange") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					VÃ¹ng Ã´
					<input
						value={specialCondition.excelMergedRangeConfig?.range ?? ""}
						onChange={(e) =>
							updateConfig("excelMergedRangeConfig", { range: e.target.value })
						}
						placeholder="A1:E1"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-slate-600 md:col-span-2">
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
						className="h-4 w-4 accent-blue-600"
					/>
					KhÃ´ng cho phÃ©p cÄƒn giá»¯a ngang sau khi gá»™p Ã´
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelCellHyperlink") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					Ã”
					<input
						value={specialCondition.excelCellHyperlinkConfig?.cell ?? ""}
						onChange={(e) =>
							updateConfig("excelCellHyperlinkConfig", { cell: e.target.value })
						}
						placeholder="B13"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Vá»‹ trÃ­ liÃªn káº¿t ná»™i bá»™
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
				<label className="text-xs font-semibold text-slate-600">
					VÄƒn báº£n hiá»ƒn thá»‹
					<input
						value={specialCondition.excelCellHyperlinkConfig?.display ?? ""}
						onChange={(e) =>
							updateConfig("excelCellHyperlinkConfig", {
								display: e.target.value,
							})
						}
						placeholder="KhÃ´ng báº¯t buá»™c"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelIconSetConditionalFormatting") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					VÃ¹ng Ã´
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
				<label className="text-xs font-semibold text-slate-600">
					Bá»™ biá»ƒu tÆ°á»£ng
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
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
					<input
						value={
							specialCondition.excelTextReplacementConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelTextReplacementConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Äá»ƒ trá»‘ng = toÃ n workbook"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					File nguá»“n
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
				<label className="text-xs font-semibold text-slate-600">
					VÄƒn báº£n cÅ©
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
				<label className="text-xs font-semibold text-slate-600">
					VÄƒn báº£n má»›i
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
				<label className="text-xs font-semibold text-slate-600">
					Sá»‘ láº§n tá»‘i thiá»ƒu vÄƒn báº£n má»›i
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
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={
							specialCondition.excelTextReplacementConfig
								?.requireOldTextAbsent !== false
						}
						onChange={(e) =>
							updateConfig("excelTextReplacementConfig", {
								requireOldTextAbsent: e.target.checked,
							})
						}
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					Báº¯t buá»™c khÃ´ng cÃ²n vÄƒn báº£n cÅ©
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelPrintTitles") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
					<input
						value={specialCondition.excelPrintTitlesConfig?.worksheetName ?? ""}
						onChange={(e) =>
							updateConfig("excelPrintTitlesConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Costs"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					HÃ ng láº·p láº¡i á»Ÿ Ä‘áº§u trang
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
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					VÃ¹ng Ã´
					<input
						value={specialCondition.excelNumberFormatConfig?.range ?? ""}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								range: e.target.value,
							})
						}
						placeholder="B:E"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Loáº¡i Ä‘á»‹nh dáº¡ng
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
						className={inputClass}
					>
						<option value="number">Sá»‘ (Number)</option>
						<option value="currency">Tiá»n tá»‡ (Currency)</option>
						<option value="accounting">Káº¿ toÃ¡n (Accounting)</option>
						<option value="percentage">Pháº§n trÄƒm (Percentage)</option>
						<option value="date">NgÃ y (Date)</option>
						<option value="time">Thá»i gian (Time)</option>
						<option value="general">Chung (General)</option>
						<option value="custom">TÃ¹y chá»‰nh (Custom)</option>
					</select>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Sá»‘ chá»¯ sá»‘ tháº­p phÃ¢n
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
				<label className="text-xs font-semibold text-slate-600">
					KÃ½ hiá»‡u
					<input
						value={specialCondition.excelNumberFormatConfig?.symbol ?? ""}
						onChange={(e) =>
							updateConfig("excelNumberFormatConfig", {
								symbol: e.target.value,
							})
						}
						placeholder="$ / VND / Ä‘á»ƒ trá»‘ng"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					numFmtId há»£p lá»‡ nÃ¢ng cao
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
				<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
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
						className="h-4 w-4 accent-blue-600"
					/>
					Báº¯t buá»™c cÃ³ dáº¥u phÃ¢n tÃ¡ch hÃ ng nghÃ¬n
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelChartDataRange") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					File XML biá»ƒu Ä‘á»“
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
				<label className="text-xs font-semibold text-slate-600">
					Sá»‘ Ä‘iá»ƒm dá»¯ liá»‡u yÃªu cáº§u
					<input
						type="number"
						min={1}
						value={
							specialCondition.excelChartDataRangeConfig?.expectedPointCount ??
							""
						}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedPointCount: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						placeholder="4"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					VÃ¹ng nhÃ£n trá»¥c
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
						placeholder="Tents!$B$4:$B$7"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					VÃ¹ng giÃ¡ trá»‹
					<input
						value={
							specialCondition.excelChartDataRangeConfig?.expectedValueRange ??
							""
						}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedValueRange: e.target.value,
							})
						}
						placeholder="Tents!$C$4:$C$7"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					CÃ¡c vÃ¹ng giÃ¡ trá»‹ (má»—i dÃ²ng má»™t series)
					<textarea
						value={(
							specialCondition.excelChartDataRangeConfig?.expectedValueRanges ??
							[]
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedValueRanges: splitTextareaLines(e.target.value),
							})
						}
						onPaste={(e) => {
							e.preventDefault();
							updateConfig("excelChartDataRangeConfig", {
								expectedValueRanges: splitTextareaLines(
									textareaValueAfterPaste(e),
								),
							});
						}}
						placeholder={"Profits!$B$4:$B$9\nProfits!$C$4:$C$9"}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					TÃªn series (má»—i dÃ²ng má»™t series chÃº giáº£i)
					<textarea
						value={(
							specialCondition.excelChartDataRangeConfig?.expectedSeriesNames ??
							[]
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelChartDataRangeConfig", {
								expectedSeriesNames: splitTextareaLines(e.target.value),
							})
						}
						onPaste={(e) => {
							e.preventDefault();
							updateConfig("excelChartDataRangeConfig", {
								expectedSeriesNames: splitTextareaLines(
									textareaValueAfterPaste(e),
								),
							});
						}}
						placeholder={"Expense\nIncome"}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Ná»™i dung nhÃ£n cáº§n cÃ³
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
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
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
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					KhÃ´ng cho thÃªm series/range ngoÃ i dá»¯ liá»‡u yÃªu cáº§u
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelChartLegend") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					File XML biá»ƒu Ä‘á»“
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
				<label className="text-xs font-semibold text-slate-600">
					Vá»‹ trÃ­ chÃº giáº£i
					<select
						value={specialCondition.excelChartLegendConfig?.position ?? "t"}
						onChange={(e) =>
							updateConfig("excelChartLegendConfig", {
								position: e.target.value as "t" | "b" | "l" | "r" | "tr",
							})
						}
						className={inputClass}
					>
						<option value="t">TrÃªn</option>
						<option value="b">DÆ°á»›i</option>
						<option value="l">TrÃ¡i</option>
						<option value="r">Pháº£i</option>
						<option value="tr">GÃ³c trÃªn bÃªn pháº£i</option>
					</select>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelDefinedName") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn named range
					<input
						value={specialCondition.excelDefinedNameConfig?.name ?? ""}
						onChange={(e) =>
							updateConfig("excelDefinedNameConfig", { name: e.target.value })
						}
						placeholder="Prices"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
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
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					Báº¯t Ä‘Ãºng vÃ  khÃ´ng cho thÃªm vÃ¹ng ngoÃ i yÃªu cáº§u
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					VÃ¹ng Ã´ yÃªu cáº§u (má»—i dÃ²ng má»™t vÃ¹ng)
					<textarea
						value={(
							specialCondition.excelDefinedNameConfig?.expectedRanges ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelDefinedNameConfig", {
								expectedRanges: e.target.value
									.split(/\r?\n/)
									.map((item) => item.trim())
									.filter(Boolean),
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
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
					<input
						value={
							specialCondition.excelFormulaReferencesConfig?.worksheetName ?? ""
						}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								worksheetName: e.target.value,
							})
						}
						placeholder="Price List"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Ã” cÃ´ng thá»©c
					<input
						value={specialCondition.excelFormulaReferencesConfig?.cell ?? ""}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								cell: e.target.value,
							})
						}
						placeholder="H5"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Named range báº¯t buá»™c (má»—i dÃ²ng má»™t tÃªn)
					<textarea
						value={(
							specialCondition.excelFormulaReferencesConfig
								?.requiredReferences ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								requiredReferences: e.target.value
									.split(/\r?\n/)
									.map((item) => item.trim())
									.filter(Boolean),
							})
						}
						placeholder={"Price_10G\nInstall_10G\nSupport_10G"}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					HÃ m báº¯t buá»™c (má»—i dÃ²ng má»™t hÃ m)
					<textarea
						value={(
							specialCondition.excelFormulaReferencesConfig
								?.requiredFunctions ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								requiredFunctions: e.target.value
									.split(/\r?\n/)
									.map((item) => item.trim())
									.filter(Boolean),
							})
						}
						placeholder={"SUM\nCONCAT"}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					Fragment cÃ´ng thá»©c báº¯t buá»™c
					<textarea
						value={(
							specialCondition.excelFormulaReferencesConfig
								?.requiredFormulaFragments ?? []
						).join("\n")}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								requiredFormulaFragments: e.target.value
									.split(/\r?\n/)
									.map((item) => item.trim())
									.filter(Boolean),
							})
						}
						placeholder={'" - "'}
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					CÃ´ng thá»©c chÃ­nh xÃ¡c (khÃ´ng báº¯t buá»™c)
					<input
						value={
							specialCondition.excelFormulaReferencesConfig?.expectedFormula ??
							""
						}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								expectedFormula: e.target.value,
							})
						}
						placeholder="=SUM(Price_10G,Install_10G,Support_10G)"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-slate-600">
					GiÃ¡ trá»‹ lÆ°u trong Ã´ (khÃ´ng báº¯t buá»™c)
					<input
						value={
							specialCondition.excelFormulaReferencesConfig?.expectedValue ?? ""
						}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								expectedValue: e.target.value,
							})
						}
						placeholder="KhÃ´ng báº¯t buá»™c"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
					<input
						type="checkbox"
						checked={
							specialCondition.excelFormulaReferencesConfig
								?.requireOnlyDefinedNameReferences !== false
						}
						onChange={(e) =>
							updateConfig("excelFormulaReferencesConfig", {
								requireOnlyDefinedNameReferences: e.target.checked,
							})
						}
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					KhÃ´ng cho tham chiáº¿u trá»±c tiáº¿p Ä‘á»‹a chá»‰ Ã´/vÃ¹ng
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelNoConditionalFormatting") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
						placeholder="Price List"
						className={inputClass}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<input
						type="checkbox"
						checked={
							specialCondition.excelNoConditionalFormattingConfig
								?.requireAllWorksheets ?? false
						}
						onChange={(e) =>
							updateConfig("excelNoConditionalFormattingConfig", {
								requireAllWorksheets: e.target.checked,
							})
						}
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					Kiá»ƒm tra toÃ n bá»™ workbook
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelFreezePanes") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					Ã” gÃ³c trÃªn bÃªn trÃ¡i sau khi cá»‘ Ä‘á»‹nh
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
				<label className="text-xs font-semibold text-slate-600">
					Sá»‘ hÃ ng cá»‘ Ä‘á»‹nh (ySplit)
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
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-3">
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
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					Chá»‰ cá»‘ Ä‘á»‹nh hÃ ng, khÃ´ng cá»‘ Ä‘á»‹nh thÃªm cá»™t
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelDocumentProperty") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn thuá»™c tÃ­nh
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
				<label className="text-xs font-semibold text-slate-600">
					GiÃ¡ trá»‹ yÃªu cáº§u
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
				<label className="text-xs font-semibold text-slate-600">
					File nguá»“n
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
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					VÃ¹ng in
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
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
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
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					Báº¯t Ä‘Ãºng vÃ¹ng in, khÃ´ng cho thÃªm vÃ¹ng khÃ¡c
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelTextRotation") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					textRotation há»£p lá»‡
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
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					TiÃªu Ä‘á» cáº§n xoay (má»—i dÃ²ng má»™t tiÃªu Ä‘á»)
					<textarea
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
				<label className="flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-2">
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
						className="h-4 w-4 rounded border-slate-300 text-blue-600"
					/>
					Báº¯t buá»™c táº¥t cáº£ tiÃªu Ä‘á» Ä‘á»u pháº£i xoay Ä‘Ãºng
				</label>
			</div>
		);
	}

	if (specialCondition.type === "excelMultiColumnSort") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600">
					TÃªn worksheet
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
				<label className="text-xs font-semibold text-slate-600">
					HÃ ng tiÃªu Ä‘á»
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
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					VÃ¹ng dá»¯ liá»‡u (khÃ´ng báº¯t buá»™c)
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
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					KhÃ³a sáº¯p xáº¿p (má»—i dÃ²ng: tiÃªu Ä‘á» cá»™t hoáº·c tiÃªu Ä‘á»|desc)
					<textarea
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
			<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-3">
				<label className="text-xs font-semibold text-slate-600">
					File XML biá»ƒu Ä‘á»“
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
				<label className="text-xs font-semibold text-slate-600">
					File XML chart style
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
				<label className="text-xs font-semibold text-slate-600">
					MÃ£ style biá»ƒu Ä‘á»“
					<input
						type="number"
						min={1}
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

	return null;
};

const prepareCondition = (
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

const prepareSpecialCondition = (
	specialCondition?: SpecialCondition,
): SpecialCondition | undefined => {
	if (!specialCondition) return undefined;

	const next: SpecialCondition = { ...specialCondition };

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
			requiredFormulaFragments: cleanTextareaLines(
				next.excelFormulaReferencesConfig.requiredFormulaFragments,
			),
		};
	}

	if (next.excelTextRotationConfig) {
		next.excelTextRotationConfig = {
			...next.excelTextRotationConfig,
			expectedTexts: cleanTextareaLines(
				next.excelTextRotationConfig.expectedTexts,
			),
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

const prepareRuleSet = (ruleSet: GradingRuleSet): GradingRuleSet => ({
	...ruleSet,
	projects: ruleSet.projects.map((project) => ({
		...project,
		tasks: project.tasks.map((task) => ({
			...task,
			specialCondition: prepareSpecialCondition(task.specialCondition),
			conditions: task.conditions.map(prepareCondition),
		})),
	})),
});

const XmlGradingRulesPage = () => {
	const { getAccessToken, user } = useAuth();
	const [ruleSets, setRuleSets] = useState<GradingRuleSetSummary[]>([]);
	const [selected, setSelected] = useState<GradingRuleSet>(emptyRuleSet());
	const [subjectFilter, setSubjectFilter] = useState("");
	const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">(
		"all",
	);
	const [loading, setLoading] = useState(false);
	const [loadingRuleSetId, setLoadingRuleSetId] = useState("");
	const [saving, setSaving] = useState(false);
	const [validation, setValidation] = useState<XmlRuleValidationResult | null>(
		null,
	);
	const [gradeProjectCode, setGradeProjectCode] = useState("");
	const [gradeFile, setGradeFile] = useState<File | null>(null);
	const [gradeJson, setGradeJson] = useState("");
	const [isTestGrading, setIsTestGrading] = useState(false);

	// State quáº£n lÃ½ xem JSON thÃ´ hoáº·c Giao diá»‡n trá»±c quan
	const [viewRawJson, setViewRawJson] = useState(false);
	const [expandedProjects, setExpandedProjects] = useState<
		Record<number, boolean>
	>({});
	const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
		{},
	);
	// áº¨n/hiá»‡n riÃªng khá»‘i "Äiá»u kiá»‡n Ä‘áº·c biá»‡t" cá»§a tá»«ng Task, Ä‘á»™c láº­p vá»›i
	// viá»‡c Task Ä‘ang expand/collapse. Máº·c Ä‘á»‹nh má»Ÿ (true) Ä‘á»ƒ giá»¯ hÃ nh vi cÅ©.
	const [expandedSpecialConditions, setExpandedSpecialConditions] = useState<
		Record<string, boolean>
	>({});
	const [expandedConditionBasics, setExpandedConditionBasics] = useState<
		Record<string, boolean>
	>({});
	const [activeTab, setActiveTab] = useState<"editor" | "validation" | "test">(
		"editor",
	);
	const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});
	const [saveError, setSaveError] = useState("");
	const selectedRef = useRef(selected);
	const saveScrollYRef = useRef(0);
	const savingRef = useRef(false);
	const saveRuleSetRef = useRef<() => Promise<void>>(async () => undefined);

	// LuÃ´n giá»¯ snapshot má»›i nháº¥t Ä‘á»ƒ thao tÃ¡c Save khÃ´ng dÃ¹ng state cÅ©
	// trong trÆ°á»ng há»£p ngÆ°á»i dÃ¹ng vá»«a nháº­p Condition rá»“i click Save ngay.
	useEffect(() => {
		selectedRef.current = selected;
	}, [selected]);

	const startNewRuleSet = () => {
		const next = emptyRuleSet();
		selectedRef.current = next;
		setSelected(next);
		setValidation(null);
	};

	usePageHeader(
		{
			title: "XML Grading Rules",
			subtitle: `Quáº£n lÃ½ ruleset Â· project Â· task Â· Ä‘iá»u kiá»‡n cháº¥m (${selected.isActive ? "ACTIVE" : "INACTIVE"})`,
			actions: [
				{
					id: "create-ruleset",
					label: "Táº¡o ruleset",
					icon: "add",
					colorStyle: "filled",
					onClick: startNewRuleSet,
				},
			],
		},
		[selected.isActive],
	);

	const canUsePage = hasPermission(user, "xmlrules.view");

	const loadRuleSets = useCallback(async () => {
		setLoading(true);
		try {
			const data = await xmlGradingRulesService.listSummaries(getAccessToken, {
				subject: subjectFilter.trim() || undefined,
				isActive: activeFilter === "all" ? undefined : activeFilter === "true",
			});

			setRuleSets(data);

			// DÃ¹ng ref thay vÃ¬ selected.id tá»« closure cÅ©.
			// TrÃ¡nh viá»‡c request reload sau Save láº¥y láº¡i state cÅ© vÃ  lÃ m UI nháº£y/ghi Ä‘Ã¨.
		} catch (error) {
			notify.error(
				error instanceof Error
					? error.message
					: "KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch XML rules.",
			);
		} finally {
			setLoading(false);
		}
	}, [activeFilter, getAccessToken, subjectFilter]);

	useEffect(() => {
		void loadRuleSets();
	}, [loadRuleSets]);

	const replaceSelected = (next: GradingRuleSet) => {
		selectedRef.current = next;
		setSelected(next);
		setValidation(null);
		setRuleSets((items) => {
			if (!next.id) return items;
			const summary = toRuleSetSummary(next);
			const exists = items.some((item) => item.id === next.id);
			return exists
				? items.map((item) => (item.id === next.id ? summary : item))
				: [summary, ...items];
		});
	};

	// Update state theo kiá»ƒu functional + cáº­p nháº­t ref ngay láº­p tá»©c.
	// ÄÃ¢y lÃ  pháº§n quan trá»ng Ä‘á»ƒ trÃ¡nh máº¥t kÃ½ tá»±/field khi ngÆ°á»i dÃ¹ng
	// vá»«a nháº­p Condition rá»“i báº¥m Save ngay.
	const openRuleSet = async (summary: GradingRuleSetSummary) => {
		setLoadingRuleSetId(summary.id);
		try {
			const detail = await xmlGradingRulesService.get(
				summary.id,
				getAccessToken,
			);
			replaceSelected(detail);
		} catch (error) {
			notify.error(
				error instanceof Error
					? error.message
					: "KhÃ´ng táº£i Ä‘Æ°á»£c chi tiáº¿t XML ruleset.",
			);
		} finally {
			setLoadingRuleSetId("");
		}
	};

	const updateSelected = (
		updater: (current: GradingRuleSet) => GradingRuleSet,
	) => {
		const next = updater(selectedRef.current);
		selectedRef.current = next;
		setSelected(next);
		setValidation(null);
		const summary = toRuleSetSummary(next);
		setRuleSets((items) =>
			next.id
				? items.map((item) => (item.id === next.id ? summary : item))
				: items,
		);
	};

	const saveRuleSet = async () => {
		if (savingRef.current) return;
		savingRef.current = true;

		// Giá»¯ nguyÃªn vá»‹ trÃ­ scroll: Save khÃ´ng Ä‘Æ°á»£c kÃ©o ngÆ°á»i dÃ¹ng vá» input
		// hoáº·c nháº£y Ä‘áº¿n Condition vá»«a sá»­a.
		saveScrollYRef.current = window.scrollY;
		setSaveError("");

		const current = selectedRef.current;

		// KhÃ´ng tá»± thÃªm validation HTML/required á»Ÿ Ä‘Ã¢y.
		// Backend/service hiá»‡n táº¡i váº«n lÃ  nguá»“n xÃ¡c thá»±c chÃ­nh.
		// Äiá»u nÃ y trÃ¡nh browser tá»± focus + scroll vá» má»™t input Condition.

		setSaving(true);

		try {
			// Chuáº©n hÃ³a tá»« snapshot má»›i nháº¥t, khÃ´ng láº¥y selected tá»« closure cÅ©.
			const payload = prepareRuleSet(current);

			const saved = current.id
				? await xmlGradingRulesService.update(
						current.id,
						payload,
						getAccessToken,
					)
				: await xmlGradingRulesService.create(payload, getAccessToken);

			replaceSelected(saved);
			selectedRef.current = saved;

			// Reload danh sÃ¡ch á»Ÿ background; selectedRef Ä‘Ã£ trá» tá»›i saved
			// nÃªn request reload khÃ´ng thá»ƒ quay láº¡i state cÅ©.
			await loadRuleSets();
			notify.success("ÄÃ£ lÆ°u ruleset XML.");

			// Sau khi save thÃ nh cÃ´ng váº«n giá»¯ nguyÃªn vá»‹ trÃ­ ngÆ°á»i dÃ¹ng Ä‘ang lÃ m viá»‡c.
			requestAnimationFrame(() => {
				window.scrollTo({ top: saveScrollYRef.current, behavior: "auto" });
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "LÆ°u ruleset tháº¥t báº¡i.";
			setSaveError(message);
			notify.error(message);

			// API lá»—i khÃ´ng Ä‘Æ°á»£c lÃ m UI nháº£y xuá»‘ng Condition.
			requestAnimationFrame(() => {
				window.scrollTo({ top: saveScrollYRef.current, behavior: "auto" });
			});
		} finally {
			setSaving(false);
			savingRef.current = false;
		}
	};

	useEffect(() => {
		saveRuleSetRef.current = saveRuleSet;
	});

	useEffect(() => {
		const isSaveShortcut = (event: KeyboardEvent) =>
			(event.ctrlKey || event.metaKey) &&
			(event.key.toLowerCase() === "s" || event.code === "KeyS");

		const handleSaveShortcut = (event: KeyboardEvent) => {
			if (!isSaveShortcut(event)) return;

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			void saveRuleSetRef.current();
		};

		window.addEventListener("keydown", handleSaveShortcut, {
			capture: true,
			passive: false,
		});
		window.addEventListener("keypress", handleSaveShortcut, {
			capture: true,
			passive: false,
		});
		document.addEventListener("keydown", handleSaveShortcut, {
			capture: true,
			passive: false,
		});
		document.addEventListener("keypress", handleSaveShortcut, {
			capture: true,
			passive: false,
		});

		return () => {
			window.removeEventListener("keydown", handleSaveShortcut, {
				capture: true,
			});
			window.removeEventListener("keypress", handleSaveShortcut, {
				capture: true,
			});
			document.removeEventListener("keydown", handleSaveShortcut, {
				capture: true,
			});
			document.removeEventListener("keypress", handleSaveShortcut, {
				capture: true,
			});
		};
	}, []);

	const deleteRuleSet = async (id: string) => {
		const confirmed = await showConfirm({
			title: "XÃ¡c nháº­n xÃ³a ruleset",
			message: "Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a ruleset nÃ y?",
			confirmLabel: "XÃ¡c nháº­n xÃ³a",
			variant: "destructive",
		});
		if (!confirmed) return;
		await xmlGradingRulesService.delete(id, getAccessToken);
		startNewRuleSet();
		await loadRuleSets();
		notify.success("ÄÃ£ xÃ³a ruleset.");
	};

	const validateRuleSet = async () => {
		try {
			const result = await xmlGradingRulesService.validate(
				prepareRuleSet(selectedRef.current),
				getAccessToken,
			);
			setValidation(result);
			notify.success("Ruleset há»£p lá»‡.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Validate tháº¥t báº¡i.";
			setValidation({ isValid: false, errors: [message], warnings: [] });
			notify.error(message);
		}
	};

	const gradeWithXmlRules = async () => {
		if (!gradeFile)
			return notify.warning("Vui lÃ²ng chá»n file Office cáº§n test cháº¥m.");
		const projectCode = gradeProjectCode || selected.projects[0]?.projectCode;
		if (!projectCode) return notify.warning("Vui lÃ²ng nháº­p/chá»n projectCode.");
		if (!selected.isActive)
			return notify.warning(
				"Ruleset hiá»‡n táº¡i chÆ°a báº­t Active. Backend chá»‰ dÃ¹ng ruleset Active Ä‘á»ƒ cháº¥m thá»­ XML.",
			);
		if (isTestGrading) return;
		setIsTestGrading(true);
		setGradeJson("");
		try {
			const result = await xmlGradingRulesService.grade(
				selected.subject,
				projectCode,
				gradeFile,
				getAccessToken,
			);
			setGradeJson(JSON.stringify(result, null, 2));
			notify.success("Test cháº¥m XML hoÃ n táº¥t.");
		} catch (error) {
			notify.error(
				error instanceof Error ? error.message : "Test cháº¥m tháº¥t báº¡i.",
			);
		} finally {
			setIsTestGrading(false);
		}
	};

	const mutateProject = (index: number, patch: Partial<ProjectXmlRule>) => {
		updateSelected((current) => ({
			...current,
			projects: current.projects.map((project, i) =>
				i === index ? { ...project, ...patch } : project,
			),
		}));
	};

	const mutateTask = (pi: number, ti: number, patch: Partial<TaskXmlRule>) => {
		updateSelected((current) => ({
			...current,
			projects: current.projects.map((project, projectIndex) =>
				projectIndex !== pi
					? project
					: {
							...project,
							tasks: project.tasks.map((task, taskIndex) =>
								taskIndex === ti ? { ...task, ...patch } : task,
							),
						},
			),
		}));
	};

	const mutateCondition = (
		pi: number,
		ti: number,
		ci: number,
		patch: Partial<XmlGradingCondition>,
	) => {
		updateSelected((current) => ({
			...current,
			projects: current.projects.map((project, projectIndex) =>
				projectIndex !== pi
					? project
					: {
							...project,
							tasks: project.tasks.map((task, taskIndex) =>
								taskIndex !== ti
									? task
									: {
											...task,
											conditions: task.conditions.map(
												(condition, conditionIndex) =>
													conditionIndex === ci
														? { ...condition, ...patch }
														: condition,
											),
										},
							),
						},
			),
		}));
	};

	// Cáº­p nháº­t Special Condition cá»§a riÃªng 1 Task (khÃ´ng dÃ¹ng chung toÃ n trang).
	const updateTaskSpecialCondition = (
		pi: number,
		ti: number,
		specialCondition?: SpecialCondition,
	) => {
		const nextSpecialCondition =
			specialCondition && !hasCustomFeedback(specialCondition.feedback)
				? {
						...specialCondition,
						feedback: defaultSpecialConditionFeedback(specialCondition.type),
					}
				: specialCondition;

		mutateTask(pi, ti, {
			specialCondition: nextSpecialCondition,
		});
	};

	// áº¨n/hiá»‡n riÃªng khá»‘i "Äiá»u kiá»‡n Ä‘áº·c biá»‡t" â€” máº·c Ä‘á»‹nh má»Ÿ (true) náº¿u
	// chÆ°a tá»«ng báº¥m toggle, Ä‘á»ƒ khÃ´ng thay Ä‘á»•i hÃ nh vi hiá»ƒn thá»‹ hiá»‡n táº¡i.
	const toggleSpecialCondition = (key: string) =>
		setExpandedSpecialConditions((prev) => ({
			...prev,
			[key]: !(prev[key] ?? true),
		}));

	usePageHeader(
		{
			title: "XML Grading Rules",
			subtitle: `Quáº£n lÃ½ ruleset Â· project Â· task Â· Ä‘iá»u kiá»‡n cháº¥m (${selected.isActive ? "ACTIVE" : "INACTIVE"})`,
			actions: [
				{
					id: "create-ruleset",
					label: "Táº¡o ruleset",
					icon: "add",
					colorStyle: "filled",
					onClick: startNewRuleSet,
				},
			],
		},
		[selected.isActive],
	);

	if (!canUsePage) {
		return (
			<div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
				Chá»‰ tÃ i khoáº£n Admin Ä‘Æ°á»£c quáº£n lÃ½ XML grading rules.
			</div>
		);
	}

	const copyJsonToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(gradeJson);
			notify.success("ÄÃ£ sao chÃ©p JSON káº¿t quáº£ vÃ o clipboard.");
		} catch {
			notify.error("Sao chÃ©p tháº¥t báº¡i.");
		}
	};

	const downloadJson = (filename = "grade-result.json") => {
		const blob = new Blob([gradeJson], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	// -GIAO DIá»†N HIá»‚N THá»Š Káº¾T QUáº¢ CHáº¤M ÄIá»‚M CHI TIáº¾T ---
	const renderGradeResult = () => {
		if (!gradeJson) return null;

		let parsed: GradeResultView | null = null;
		try {
			parsed = JSON.parse(gradeJson) as GradeResultView;
		} catch {
			parsed = null;
		}

		if (!parsed) {
			return (
				<div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-100">
					<pre className="max-h-96 overflow-auto font-mono text-slate-300">
						{gradeJson}
					</pre>
				</div>
			);
		}

		// TrÃ­ch xuáº¥t dá»¯ liá»‡u tá»•ng quan
		const totalScore = parsed.totalScore ?? 0;
		const maxScore = parsed.maxScore ?? 125;
		const percentage =
			parsed.percentage ??
			(maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0);
		const isPassed =
			typeof parsed.isPassed === "boolean"
				? parsed.isPassed
				: parsed.status === "Excellent" ||
					parsed.status === "PASSED" ||
					percentage >= 70;

		const tasksList = parsed.taskResults ?? [];

		return (
			<div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
				{/* Thanh cÃ´ng cá»¥ / Header */}
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
					<div className="flex items-center gap-2">
						<h3 className="text-base font-bold text-slate-800">
							Káº¿t Quáº£ Cháº¥m Äiá»ƒm
						</h3>
						<span
							className={cx(
								"rounded-full px-2.5 py-0.5 text-xs font-semibold",
								isPassed
									? "bg-emerald-100 text-emerald-800"
									: "bg-rose-100 text-rose-800",
							)}
						>
							{isPassed ? "Äáº T (PASSED)" : "KHÃ”NG Äáº T (FAILED)"}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setViewRawJson(!viewRawJson)}
							className="rounded-lg border border-m3-outline-variant bg-m3-surface px-3 py-1 text-xs font-medium text-m3-on-surface hover:bg-m3-surface-container"
						>
							{viewRawJson ? "Giao diá»‡n Báº£ng" : "Xem JSON"}
						</button>
						<button
							type="button"
							onClick={copyJsonToClipboard}
							title="Sao chÃ©p JSON"
							className="rounded-lg border border-m3-outline-variant bg-m3-surface p-1.5 text-m3-on-surface-variant hover:bg-m3-surface-container"
						>
							<Icon name="content_copy" className="text-sm" />
						</button>
						<button
							type="button"
							onClick={() => downloadJson()}
							title="Táº£i xuá»‘ng JSON"
							className="rounded-lg border border-m3-outline-variant bg-m3-surface p-1.5 text-m3-on-surface-variant hover:bg-m3-surface-container"
						>
							<Icon name="download" className="text-sm" />
						</button>
					</div>
				</div>

				{viewRawJson ? (
					<div className="rounded-lg border border-slate-900 bg-slate-950 p-3 text-xs text-slate-100">
						<pre className="max-h-96 overflow-auto font-mono">
							{JSON.stringify(parsed, null, 2)}
						</pre>
					</div>
				) : (
					<>
						{/* CÃ¡c Ã´ tháº» thÃ´ng sá»‘ tá»•ng quan */}
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
								<div className="text-xs font-medium text-emerald-800">
									Tá»•ng Ä‘iá»ƒm
								</div>
								<div className="mt-1 text-2xl font-black text-emerald-700">
									{totalScore}{" "}
									<span className="text-sm font-normal text-emerald-600">
										/ {maxScore}
									</span>
								</div>
							</div>

							<div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
								<div className="text-xs font-medium text-blue-800">
									Tá»· lá»‡ Ä‘áº¡t
								</div>
								<div className="mt-1 text-2xl font-black text-blue-700">
									{percentage}%
								</div>
								<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
									<div
										className="h-full bg-blue-600 transition-all duration-500"
										style={{ width: `${Math.min(percentage, 100)}%` }}
									/>
								</div>
							</div>

							<div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
								<div className="text-xs font-medium text-slate-500">
									MÃ£ bÃ i kiá»ƒm tra
								</div>
								<div className="mt-1 font-mono text-sm font-bold text-slate-800">
									{parsed.projectId || "N/A"}
								</div>
								<div className="text-xs text-slate-500">
									{parsed.projectName}
								</div>
							</div>
						</div>

						{/* Báº¢NG Káº¾T QUáº¢ CHáº¤M ÄIá»‚M CHI TIáº¾T */}
						<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
							<table className="w-full text-left text-xs text-slate-600">
								<thead className="border-b border-slate-200 bg-slate-100/80 text-xs font-bold uppercase tracking-wider text-slate-700">
									<tr className="h-12">
										<th className="h-12 px-3 py-3.5 w-12 text-center align-middle">
											STT
										</th>
										<th className="h-12 px-3 py-3.5 w-32 align-middle">
											MÃ£ Task
										</th>
										<th className="h-12 px-4 py-3.5 align-middle">
											Nhiá»‡m vá»¥ (Task Name)
										</th>
										<th className="h-12 px-3 py-3.5 w-24 text-center align-middle">
											Tráº¡ng thÃ¡i
										</th>
										<th className="h-12 px-3 py-3.5 w-28 text-right align-middle">
											Äiá»ƒm sá»‘
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{Array.isArray(tasksList) && tasksList.length > 0 ? (
										tasksList.map(
											(task: GradeTaskResultView, index: number) => {
												const taskPassed =
													task.isPassed ?? (task.score ?? 0) > 0;
												return (
													<tr
														key={
															task.taskId ||
															task.taskName ||
															`task-${task.score}`
														}
														className={`transition-colors ${
															index % 2 === 1 ? "bg-slate-50/70" : "bg-white"
														} hover:bg-slate-100/80`}
													>
														<td className="px-3 py-3 text-center font-medium text-slate-400">
															{task.taskId}
														</td>
														<td className="px-3 py-3 font-mono font-medium text-slate-800">
															{task.taskId}
														</td>
														<td className="px-4 py-3">
															<div className="font-medium text-slate-900 leading-snug">
																{task.taskName}
															</div>

															{/* Chi tiáº¿t Ä‘iá»u kiá»‡n XML / Details */}
															{Array.isArray(task.details) &&
																task.details.length > 0 && (
																	<div className="mt-1.5 space-y-1">
																		{task.details.map((detail: string) => (
																			<div
																				key={detail}
																				className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 p-1 rounded"
																			>
																				{detail}
																			</div>
																		))}
																	</div>
																)}

															{/* Lá»—i (náº¿u cÃ³) */}
															{Array.isArray(task.errors) &&
																task.errors.length > 0 && (
																	<div className="mt-1.5 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 p-1 rounded">
																		{task.errors.join(", ")}
																	</div>
																)}
															{Array.isArray(task.errors) &&
																task.errors.length > 0 && (
																	<div className="mt-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-1 rounded">
																		{(task.fixActions ?? []).join(", ")}
																	</div>
																)}
														</td>
														<td className="px-3 py-3 text-center">
															<span
																className={cx(
																	"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
																	taskPassed
																		? "bg-emerald-100 text-emerald-800"
																		: "bg-rose-100 text-rose-800",
																)}
															>
																{taskPassed ? (
																	<Icon
																		name="check_circle"
																		className="text-xs"
																	/>
																) : (
																	<Icon name="cancel" className="text-xs" />
																)}
																{taskPassed ? "Äáº¡t" : "Sai"}
															</span>
														</td>
														<td className="px-3 py-3 text-right font-bold text-slate-800">
															<span
																className={
																	taskPassed
																		? "text-emerald-700"
																		: "text-rose-600"
																}
															>
																{task.score ?? 0}
															</span>
															<span className="text-slate-400 font-normal">
																{" "}
																/ {task.maxScore ?? 0}
															</span>
														</td>
													</tr>
												);
											},
										)
									) : (
										<tr>
											<td
												colSpan={5}
												className="py-6 text-center text-slate-400"
											>
												KhÃ´ng cÃ³ dá»¯ liá»‡u task trong káº¿t quáº£.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</>
				)}
			</div>
		);
	};

	const toggleProject = (index: number) =>
		setExpandedProjects((prev) => ({
			...prev,
			[index]: !(prev[index] ?? false),
		}));

	const toggleTask = (key: string) =>
		setExpandedTasks((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));

	const toggleConditionBasics = (key: string) =>
		setExpandedConditionBasics((prev) => ({
			...prev,
			[key]: !(prev[key] ?? false),
		}));

	const toggleAdvanced = (key: string) =>
		setShowAdvanced((prev) => ({ ...prev, [key]: !prev[key] }));

	const projectCount = selected.projects.length;
	const taskCount = selected.projects.reduce(
		(sum, project) => sum + project.tasks.length,
		0,
	);
	const conditionCount = selected.projects.reduce(
		(sum, project) =>
			sum +
			project.tasks.reduce(
				(taskSum, task) => taskSum + task.conditions.length,
				0,
			),
		0,
	);
	const selectedMaxScore = selected.projects.reduce(
		(sum, project) => sum + Number(project.maxScore || 0),
		0,
	);

	const statusBadge = selected.isActive
		? "border-emerald-200 bg-emerald-50 text-emerald-700"
		: "border-slate-200 bg-slate-100 text-slate-600";

	const inputClass =
		"mt-1 w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2 text-sm text-m3-on-surface outline-none transition placeholder:text-m3-on-surface-variant/60 focus:ring-2 focus:ring-m3-primary/30 shadow-2xs";

	const iconButtonClass =
		"inline-flex h-9 w-9 items-center justify-center rounded-full bg-m3-surface-container-high text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-highest hover:text-m3-on-surface shadow-xs";

	return (
		<div className="min-h-full space-y-5 bg-m3-surface pb-10">
			<div className="grid gap-5 xl:grid-cols-[292px_minmax(0,1fr)]">
				{/* Sidebar */}
				<aside className="h-fit rounded-3xl bg-m3-surface-container p-4 shadow-xs xl:sticky xl:top-24 mb-2">
					<div className="mb-3 flex items-center justify-between px-1">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
								Rulesets
							</p>
							<p className="text-sm font-bold text-m3-on-surface">
								{ruleSets.length} bá»™ luáº­t
							</p>
						</div>
						<button
							type="button"
							onClick={loadRuleSets}
							className={iconButtonClass}
							title="LÃ m má»›i"
						>
							<Icon
								name="refresh"
								className={cx("text-base", loading && "animate-spin")}
							/>
						</button>
					</div>

					<div className="mb-3 space-y-2">
						<input
							value={subjectFilter}
							onChange={(e) => setSubjectFilter(e.target.value)}
							placeholder="TÃ¬m theo mÃ´n..."
							className="w-full rounded-2xl bg-m3-surface-container-high px-3 py-2 text-xs text-m3-on-surface outline-none transition focus:ring-2 focus:ring-m3-primary/30"
						/>
						<select
							value={activeFilter}
							onChange={(e) =>
								setActiveFilter(e.target.value as "all" | "true" | "false")
							}
							className="w-full rounded-2xl bg-m3-surface-container-high px-3 py-2 text-xs text-m3-on-surface outline-none transition focus:ring-2 focus:ring-m3-primary/30"
						>
							<option value="all">Táº¥t cáº£ tráº¡ng thÃ¡i</option>
							<option value="true">Äang báº­t</option>
							<option value="false">Äang táº¯t</option>
						</select>
					</div>

					<div className="max-h-[calc(100vh-280px)] space-y-1 overflow-y-auto pr-1">
						{ruleSets.map((item) => {
							const isSelected = selected.id === item.id;
							const isLoadingDetail = loadingRuleSetId === item.id;
							return (
								<button
									type="button"
									key={item.id}
									onClick={() => void openRuleSet(item)}
									disabled={isLoadingDetail}
									className={cx(
										"w-full rounded-2xl border p-3 text-left transition",
										isSelected
											? "border-m3-primary/50 bg-m3-primary/10 shadow-xs"
											: "border-transparent hover:border-m3-outline-variant/60 hover:bg-m3-surface-container-high",
									)}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<div className="truncate text-xs font-bold text-m3-on-surface">
												{item.subject} Â· {item.version}
											</div>
											<div className="mt-0.5 text-[11px] text-m3-on-surface-variant">
												{item.projectCount} project Â· {item.taskCount} task
											</div>
										</div>
										{isLoadingDetail ? (
											<Icon
												name="refresh"
												className="mt-0.5 shrink-0 animate-spin text-sm text-m3-primary"
											/>
										) : (
											<span
												className={cx(
													"mt-1 h-2 w-2 shrink-0 rounded-full",
													item.isActive
														? "bg-emerald-500"
														: "bg-m3-outline-variant",
												)}
											/>
										)}
									</div>
								</button>
							);
						})}

						{!loading && ruleSets.length === 0 && (
							<div className="rounded-2xl border border-dashed border-m3-outline-variant/60 px-4 py-8 text-center">
								<Icon
									name="code"
									className="mx-auto mb-2 text-m3-on-surface-variant text-2xl"
								/>
								<p className="text-xs font-bold text-m3-on-surface">
									ChÆ°a cÃ³ ruleset
								</p>
								<p className="mt-1 text-[11px] text-m3-on-surface-variant">
									Táº¡o ruleset Ä‘áº§u tiÃªn Ä‘á»ƒ báº¯t Ä‘áº§u.
								</p>
							</div>
						)}
					</div>
				</aside>

				{/* Main */}
				<main className="min-w-0 space-y-5">
					{/* Ruleset overview */}
					<section className="rounded-3xl bg-m3-surface-container p-5 shadow-xs">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<div className="mb-1 flex flex-wrap items-center gap-2">
									<h2 className="text-lg font-black text-m3-on-surface">
										{selected.subject || "ChÆ°a Ä‘áº·t tÃªn"} Â·{" "}
										{selected.version || "v1"}
									</h2>
									<span
										className={cx(
											"rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
											statusBadge,
										)}
									>
										{selected.isActive ? "Äang hoáº¡t Ä‘á»™ng" : "Äang táº¯t"}
									</span>
								</div>
								<p className="text-xs text-m3-on-surface-variant">
									{selected.id
										? `ID: ${selected.id}`
										: "Ruleset má»›i chÆ°a Ä‘Æ°á»£c lÆ°u"}
								</p>
							</div>

							<div className="flex items-center gap-2">
								{selected.id && (
									<button
										type="button"
										onClick={() => deleteRuleSet(selected.id)}
										title="XÃ³a ruleset"
										className="inline-flex h-9 w-9 items-center justify-center rounded-full text-m3-error transition-colors hover:bg-m3-error-container"
									>
										<Icon name="delete" className="text-base" />
									</button>
								)}
							</div>
						</div>

						{/* Stats */}
						<div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
							{[
								["Projects", projectCount],
								["Tasks", taskCount],
								["Conditions", conditionCount],
								["Max score", selectedMaxScore],
							].map(([label, value]) => (
								<div
									key={label}
									className="group rounded-2xl bg-m3-surface-container-low px-4 py-3 transition-[border-radius,background-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:rounded-lg hover:bg-m3-surface-container-high"
								>
									<p className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
										{label}
									</p>
									<p className="mt-1 text-xl font-black text-m3-on-surface">
										{value}
									</p>
								</div>
							))}
						</div>

						{/* Tabs */}
						<div className="mt-5 flex gap-1 overflow-x-auto border-b border-m3-outline-variant/40">
							{[
								["editor", "Rules editor"],
								["validation", "Validation"],
								["test", "Test XML"],
							].map(([key, label]) => (
								<button
									type="button"
									key={key}
									onClick={() => setActiveTab(key as typeof activeTab)}
									className={cx(
										"border-b-2 px-3.5 py-2.5 text-xs font-bold transition",
										activeTab === key
											? "border-m3-primary text-m3-primary"
											: "border-transparent text-m3-on-surface-variant hover:text-m3-on-surface",
									)}
								>
									{label}
									{key === "validation" && validation && (
										<span
											className={cx(
												"ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
												validation.isValid
													? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
													: "bg-m3-error-container text-m3-on-error-container",
											)}
										>
											{validation.isValid
												? "OK"
												: `${validation.errors?.length || 0}`}
										</span>
									)}
								</button>
							))}
						</div>
					</section>

					{activeTab === "editor" && (
						<>
							{/* Ruleset settings */}
							<section className="rounded-3xl bg-m3-surface-container p-5 shadow-xs text-m3-on-surface">
								<div className="mb-4">
									<h3 className="text-sm font-bold text-m3-on-surface">
										ThÃ´ng tin ruleset
									</h3>
									<p className="mt-1 text-xs text-m3-on-surface-variant">
										CÃ¡c thiáº¿t láº­p chung cho toÃ n bá»™ bá»™ luáº­t.
									</p>
								</div>

								<div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
									<label className="text-xs font-semibold text-m3-on-surface-variant">
										MÃ´n / loáº¡i file
										<input
											value={selected.subject}
											onChange={(e) =>
												replaceSelected({
													...selected,
													subject: e.target.value,
												})
											}
											placeholder="excel"
											className={inputClass}
										/>
									</label>
									<label className="text-xs font-semibold text-m3-on-surface-variant">
										PhiÃªn báº£n bá»™ luáº­t
										<input
											value={selected.version}
											onChange={(e) =>
												replaceSelected({
													...selected,
													version: e.target.value,
												})
											}
											placeholder="v1"
											className={inputClass}
										/>
									</label>
									<label className="flex items-center gap-3 rounded-xl bg-m3-surface-container-high px-4 py-3 text-sm font-semibold text-m3-on-surface md:self-end shadow-xs">
										<input
											type="checkbox"
											checked={selected.isActive}
											onChange={(e) =>
												replaceSelected({
													...selected,
													isActive: e.target.checked,
												})
											}
											className="h-4 w-4 rounded-sm accent-m3-primary"
										/>
										KÃ­ch hoáº¡t
									</label>
								</div>
							</section>

							{/* Projects */}
							<section className="rounded-3xl bg-m3-surface-container p-5 shadow-xs text-m3-on-surface">
								<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
									<div>
										<h3 className="text-sm font-bold text-m3-on-surface">
											Projects
										</h3>
										<p className="mt-1 text-xs text-m3-on-surface-variant">
											Má»—i project chá»©a cÃ¡c Task vÃ  Ä‘iá»u kiá»‡n cháº¥m tÆ°Æ¡ng á»©ng.
										</p>
									</div>
									<button
										type="button"
										onClick={() => {
											const next = {
												...selected,
												projects: [...selected.projects, emptyProject()],
											};
											replaceSelected(next);
											setExpandedProjects((prev) => ({
												...prev,
												[next.projects.length - 1]: true,
											}));
										}}
										className="inline-flex items-center gap-2 rounded-xl bg-m3-surface-container-high px-3 py-2 text-xs font-bold text-m3-primary transition hover:bg-m3-surface-container-highest shadow-xs"
									>
										<Icon name="add" className="text-base" /> ThÃªm project
									</button>
								</div>

								<div className="space-y-4">
									{selected.projects.map((project, pi) => {
										const projectExpanded = expandedProjects[pi] ?? false;
										return (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: Projects are not reorderable in this editor, and editable projectCode cannot be used as a stable key.
												key={`project-${pi}`}
												className="group overflow-hidden rounded-3xl bg-m3-surface-container-low shadow-xs transition hover:shadow-md p-4 text-m3-on-surface"
											>
												{/* Project header */}
												<div className="flex items-center gap-3 bg-m3-surface-container px-4 py-3.5 rounded-2xl shadow-xs">
													<button
														type="button"
														onClick={() => toggleProject(pi)}
														className="flex min-w-0 flex-1 items-center gap-3 text-left p-2"
													>
														<span className="text-slate-400">
															{projectExpanded ? "â–¼" : "â–¶"}
														</span>
														<div className="min-w-0">
															<div className="truncate text-sm font-bold text-slate-900">
																{project.projectName || "Project chÆ°a Ä‘áº·t tÃªn"}
															</div>
															<div className="mt-0.5 text-xs text-slate-500">
																{project.projectCode || "project22"} Â·{" "}
																{project.tasks.length} task Â· {project.maxScore}{" "}
																Ä‘iá»ƒm
															</div>
														</div>
													</button>
													<button
														type="button"
														onClick={() =>
															replaceSelected({
																...selected,
																projects: selected.projects.filter(
																	(_, i) => i !== pi,
																),
															})
														}
														title="XÃ³a project"
														className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
													>
														<Icon name="delete" className="text-base" />
													</button>
												</div>

												{projectExpanded && (
													<div className="space-y-4 bg-transparent p-4">
														{/* Project fields */}
														<div className="grid gap-3 md:grid-cols-[1fr_1.5fr_130px]">
															<label className="text-xs font-semibold text-m3-on-surface-variant">
																MÃ£ project
																<input
																	value={project.projectCode}
																	onChange={(e) =>
																		mutateProject(pi, {
																			projectCode: e.target.value,
																		})
																	}
																	className={inputClass}
																/>
															</label>
															<label className="text-xs font-semibold text-m3-on-surface-variant">
																TÃªn project
																<input
																	value={project.projectName}
																	onChange={(e) =>
																		mutateProject(pi, {
																			projectName: e.target.value,
																		})
																	}
																	className={inputClass}
																/>
															</label>
															<label className="text-xs font-semibold text-m3-on-surface-variant">
																Äiá»ƒm tá»‘i Ä‘a
																<input
																	type="number"
																	value={project.maxScore}
																	onChange={(e) =>
																		mutateProject(pi, {
																			maxScore: Number(e.target.value) || 0,
																		})
																	}
																	className={inputClass}
																/>
															</label>
														</div>

														{/* Tasks */}
														<div className="rounded-2xl bg-m3-surface-container p-5 shadow-xs">
															<div className="mb-3 flex items-center justify-between gap-2">
																<div>
																	<p className="text-sm font-bold text-slate-800">
																		Tasks
																	</p>
																	<p className="text-xs text-slate-500">
																		{project.tasks.length} nhiá»‡m vá»¥ trong
																		project
																	</p>
																</div>
																<button
																	type="button"
																	onClick={() =>
																		mutateProject(pi, {
																			tasks: [...project.tasks, emptyTask()],
																		})
																	}
																	className="inline-flex items-center gap-1.5 rounded-xl bg-m3-surface-container-high px-3 py-1.5 text-xs font-semibold text-m3-on-surface transition hover:bg-m3-surface-container-highest shadow-xs"
																>
																	<Icon name="add" className="text-sm" /> ThÃªm
																	Task
																</button>
															</div>

															<div className="space-y-2">
																{project.tasks.map((task, ti) => {
																	const taskKey = `${pi}-${ti}`;
																	const taskExpanded =
																		expandedTasks[taskKey] ?? false;
																	const specialConditionExpanded =
																		expandedSpecialConditions[taskKey] ?? true;
																	const availableSpecialConditionOptions =
																		specialConditionOptionsForSubject(
																			selected.subject,
																		);
																	const groupedSpecialConditionOptions =
																		groupSpecialConditionOptions(
																			availableSpecialConditionOptions,
																		);
																	const currentSpecialConditionSupported =
																		!task.specialCondition?.type ||
																		availableSpecialConditionOptions.some(
																			(option) =>
																				option.value ===
																				task.specialCondition?.type,
																		);

																	return (
																		<div
																			key={taskKey}
																			className="overflow-hidden rounded-2xl bg-m3-surface-container-high shadow-xs transition hover:shadow-md text-m3-on-surface"
																		>
																			<div className="flex items-center gap-2 px-3.5 py-3">
																				<button
																					type="button"
																					onClick={() => toggleTask(taskKey)}
																					className="flex min-w-0 flex-1 items-center gap-3 text-left"
																				>
																					<span className="text-xs text-m3-on-surface-variant">
																						{taskExpanded ? "â–¼" : "â–¶"}
																					</span>
																					<span className="rounded-lg bg-m3-surface-container px-2 py-1 font-mono text-[11px] font-bold text-m3-on-surface shadow-2xs">
																						{task.taskId || `TASK-${ti + 1}`}
																					</span>
																					<span className="min-w-0 truncate text-sm font-semibold text-m3-on-surface">
																						{task.taskName ||
																							"Task chÆ°a Ä‘áº·t tÃªn"}
																					</span>
																					<span className="ml-auto shrink-0 text-xs font-semibold text-m3-on-surface-variant">
																						{task.conditions.length} Ä‘iá»u kiá»‡n Â·{" "}
																						{task.maxScore} Ä‘iá»ƒm
																					</span>
																				</button>
																				<button
																					type="button"
																					onClick={() =>
																						mutateProject(pi, {
																							tasks: project.tasks.filter(
																								(_, i) => i !== ti,
																							),
																						})
																					}
																					title="XÃ³a Task"
																					className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-m3-error hover:bg-m3-error-container"
																				>
																					<Icon
																						name="delete"
																						className="text-sm"
																					/>
																				</button>
																			</div>

																			{taskExpanded && (
																				<div className="bg-m3-surface-container-high/40 p-4">
																					<div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_140px]">
																						<label className="text-xs font-semibold text-slate-600">
																							MÃ£ Task
																							<input
																								value={task.taskId}
																								onChange={(e) =>
																									mutateTask(pi, ti, {
																										taskId: e.target.value,
																									})
																								}
																								className={inputClass}
																								placeholder="TASK-01"
																							/>
																						</label>

																						<label className="text-xs font-semibold text-slate-600">
																							TÃªn nhiá»‡m vá»¥
																							<input
																								value={task.taskName}
																								onChange={(e) =>
																									mutateTask(pi, ti, {
																										taskName: e.target.value,
																									})
																								}
																								className={inputClass}
																								placeholder="Nháº­p tÃªn nhiá»‡m vá»¥..."
																							/>
																						</label>

																						<label className="text-xs font-semibold text-slate-600">
																							Äiá»ƒm tá»‘i Ä‘a
																							<input
																								type="number"
																								value={task.maxScore}
																								onChange={(e) =>
																									mutateTask(pi, ti, {
																										maxScore: Number(
																											e.target.value,
																										),
																									})
																								}
																								className={inputClass}
																							/>
																						</label>
																					</div>

																					{/* =========================================================
                                              SPECIAL CONDITION (thuá»™c riÃªng Task nÃ y, khÃ´ng pháº£i state global)
                                              Header cÃ³ thá»ƒ báº¥m Ä‘á»ƒ áº©n/hiá»‡n toÃ n bá»™ ná»™i dung bÃªn trong
                                              (select loáº¡i, Ä‘iá»ƒm, mÃ´ táº£, PictureBulletEditor), Ä‘á»™c láº­p
                                              vá»›i viá»‡c Task Ä‘ang má»Ÿ hay Ä‘Ã³ng.
                                              ========================================================= */}
																					<div className="mt-5 rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm">
																						<div className="flex items-start gap-3">
																							{/* Icon */}
																							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
																								<span className="text-base">
																									âœ¦
																								</span>
																							</div>

																							{/* Title â€” báº¥m Ä‘á»ƒ áº©n/hiá»‡n */}
																							<button
																								type="button"
																								onClick={() =>
																									toggleSpecialCondition(
																										taskKey,
																									)
																								}
																								className="flex min-w-0 flex-1 items-start gap-2 text-left"
																							>
																								<div className="min-w-0 flex-1">
																									<div className="flex flex-wrap items-center gap-2">
																										<p className="text-sm font-bold text-slate-800">
																											Äiá»u kiá»‡n Ä‘áº·c biá»‡t
																										</p>

																										{task.specialCondition && (
																											<span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
																												ÄANG Sá»¬ Dá»¤NG
																											</span>
																										)}
																									</div>

																									<p className="mt-1 text-xs leading-5 text-slate-500">
																										Chá»‰ sá»­ dá»¥ng khi Task cáº§n
																										kiá»ƒm tra thÃ nh pháº§n Ä‘áº·c biá»‡t
																										trong file Word mÃ  Condition
																										XML thÃ´ng thÆ°á»ng khÃ´ng Ä‘á»§ Ä‘á»ƒ
																										xÃ¡c Ä‘á»‹nh. Task cÃ³ thá»ƒ chá»‰
																										dÃ¹ng riÃªng Ä‘iá»u kiá»‡n Ä‘áº·c
																										biá»‡t (khÃ´ng cáº§n Condition
																										XML nÃ o khÃ¡c), hoáº·c káº¿t há»£p
																										cáº£ hai â€” miá»…n tá»•ng Ä‘iá»ƒm báº±ng
																										Äiá»ƒm tá»‘i Ä‘a cá»§a Task.
																									</p>
																								</div>

																								<span className="mt-1 shrink-0 text-xs text-slate-400">
																									{specialConditionExpanded
																										? "â–¼"
																										: "â–¶"}
																								</span>
																							</button>
																						</div>

																						{specialConditionExpanded && (
																							<>
																								{/* Select */}
																								<div className="mt-4">
																									<label className="block text-xs font-semibold text-slate-600">
																										Loáº¡i kiá»ƒm tra Ä‘áº·c biá»‡t
																										<div className="relative">
																											<select
																												value={
																													task.specialCondition
																														?.type ?? ""
																												}
																												onChange={(e) => {
																													const value =
																														e.target.value;

																													if (!value) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															undefined,
																														);
																														return;
																													}

																													if (
																														value ===
																														"pictureBullet"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "pictureBullet",
																																// Giá»¯ láº¡i score náº¿u ngÆ°á»i dÃ¹ng Ä‘Ã£ nháº­p trÆ°á»›c Ä‘Ã³
																																// (VD: Ä‘á»•i qua Ä‘á»•i láº¡i giá»¯a cÃ¡c loáº¡i), máº·c Ä‘á»‹nh 0.
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																config: task
																																	.specialCondition
																																	?.config ?? {
																																	level: 0,
																																},
																															},
																														);
																													}
																													if (
																														value ===
																														"insertedImage"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "insertedImage",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																imageInsertConfig:
																																	task
																																		.specialCondition
																																		?.imageInsertConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		relsFile:
																																			"word/_rels/document.xml.rels",
																																		wrapType:
																																			"tight",
																																		positionConfig:
																																			{
																																				afterText:
																																					"",
																																				beforeText:
																																					"",
																																				requireBetween: false,
																																				caseSensitive: false,
																																			},
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"convertTableToText"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "convertTableToText",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																convertTableToTextConfig:
																																	task
																																		.specialCondition
																																		?.convertTableToTextConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		anchorText:
																																			"",
																																		expectedRows:
																																			[],
																																		minRows: 1,
																																		minTabsPerRow: 1,
																																		requireNoTables: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"hyperlink"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "hyperlink",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																hyperlinkConfig:
																																	task
																																		.specialCondition
																																		?.hyperlinkConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		relsFile:
																																			"word/_rels/document.xml.rels",
																																		displayText:
																																			"",
																																		anchorTextBefore:
																																			"",
																																		url: "",
																																		caseSensitiveText: false,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"sectionBreakBeforeText"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "sectionBreakBeforeText",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																sectionBreakBeforeTextConfig:
																																	task
																																		.specialCondition
																																		?.sectionBreakBeforeTextConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		targetText:
																																			"",
																																		breakType:
																																			"continuous",
																																		targetOccurrence: 1,
																																		requireImmediateBefore: true,
																																		allowSameParagraphSectPr: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"pictureStyle"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "pictureStyle",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																pictureStyleConfig:
																																	task
																																		.specialCondition
																																		?.pictureStyleConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		relsFile:
																																			"word/_rels/document.xml.rels",
																																		targetImageIndex: 1,
																																		stylePreset:
																																			"simpleFrameBlack",
																																		requiredLineColor:
																																			"000000",
																																		presetGeometry:
																																			"rect",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"textBoxContainsText"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "textBoxContainsText",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																textBoxContainsTextConfig:
																																	task
																																		.specialCondition
																																		?.textBoxContainsTextConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		expectedText:
																																			"",
																																		matchMode:
																																			"exact",
																																		caseSensitive: false,
																																		targetOccurrence: 1,
																																		requireDefaultPaste: true,
																																		requireRemovedFromBody: true,
																																		forbiddenTextColors:
																																			[
																																				"FFFFFF",
																																				"background1",
																																				"bg1",
																																				"lt1",
																																			],
																																		forbiddenRunProperties:
																																			[],
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"wordTableSort"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "wordTableSort",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																wordTableSortConfig:
																																	task
																																		.specialCondition
																																		?.wordTableSortConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		anchorText:
																																			"Our Most Popular Flavors!",
																																		tableIndexAfterAnchor: 1,
																																		sortColumnIndex: 1,
																																		hasHeaderRow: true,
																																		descending: false,
																																		expectedFirstColumnValues:
																																			[
																																				"Chocolate Heaven Splurge",
																																				"Fruit Heaven Splurge",
																																				"Jawbreaker Mint",
																																				"Pecan and Peanut Truffle",
																																				"Whole Vanilla Bean Chunk",
																																			],
																																		requireExactOrder: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"wordParagraphList"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "wordParagraphList",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																wordParagraphListConfig:
																																	task
																																		.specialCondition
																																		?.wordParagraphListConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		anchorText:
																																			"Below is a list of our biggest clients.",
																																		expectedItems:
																																			[
																																				"The Party People",
																																				"Birthdays R Us",
																																				"Did You Say Party?",
																																				"I Scream, U Scream",
																																			],
																																		listType:
																																			"bullet",
																																		level: 0,
																																		requireSameNumbering: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"pageMargins"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "pageMargins",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																pageMarginsConfig:
																																	task
																																		.specialCondition
																																		?.pageMarginsConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		top: 1440,
																																		bottom: 1440,
																																		left: 2160,
																																		right: 2160,
																																		gutter: 0,
																																		requireAllSections: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"documentStyleSet"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "documentStyleSet",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																documentStyleSetConfig:
																																	task
																																		.specialCondition
																																		?.documentStyleSetConfig ?? {
																																		sourceFile:
																																			"word/styles.xml",
																																		styleSetName:
																																			"Lines (Simple)",
																																		expectedFragments:
																																			[],
																																		ignoreAttributes:
																																			[
																																				"rsid*",
																																				"id",
																																			],
																																		matchPolicy:
																																			"all",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"pageBorder"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "pageBorder",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																pageBorderConfig:
																																	task
																																		.specialCondition
																																		?.pageBorderConfig ?? {
																																		sourceFile:
																																			"word/document.xml",
																																		requiredStyle:
																																			"single",
																																		requiredWidth: 12,
																																		requiredColor:
																																			"00B0F0",
																																		allowedColors:
																																			[
																																				"00B0F0",
																																				"5B9BD5",
																																				"4F81BD",
																																				"accent1",
																																			],
																																		requireBox: true,
																																		requireAllSections: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelTableName"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelTableName",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelTableNameConfig:
																																	task
																																		.specialCondition
																																		?.excelTableNameConfig ?? {
																																		worksheetName:
																																			"",
																																		expectedName:
																																			"",
																																		originalName:
																																			"",
																																		requireOriginalNameAbsent: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelWorksheetPageSetup"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelWorksheetPageSetup",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelWorksheetPageSetupConfig:
																																	task
																																		.specialCondition
																																		?.excelWorksheetPageSetupConfig ?? {
																																		worksheetName:
																																			"",
																																		orientation:
																																			"landscape",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelClearCellFormatting"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelClearCellFormatting",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelClearCellFormattingConfig:
																																	task
																																		.specialCondition
																																		?.excelClearCellFormattingConfig ?? {
																																		worksheetName:
																																			"",
																																		range:
																																			"A4:D4",
																																		defaultStyleId: 0,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelDataModelImport"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelDataModelImport",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelDataModelImportConfig:
																																	task
																																		.specialCondition
																																		?.excelDataModelImportConfig ?? {
																																		sourceFileName:
																																			"",
																																		expectedWorksheetName:
																																			"",
																																		expectedConnectionName:
																																			"",
																																		requireConnection: true,
																																		requireDataModel: true,
																																		requireImportedWorksheet: true,
																																		requireQueryTable: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelCompatibilityReport"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelCompatibilityReport",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelCompatibilityReportConfig:
																																	task
																																		.specialCondition
																																		?.excelCompatibilityReportConfig ?? {
																																		worksheetName:
																																			"",
																																		expectedTexts:
																																			[],
																																		requireNewWorksheet: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelMergedRange"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelMergedRange",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelMergedRangeConfig:
																																	task
																																		.specialCondition
																																		?.excelMergedRangeConfig ?? {
																																		worksheetName:
																																			"",
																																		range:
																																			"A1:E1",
																																		requireNoHorizontalCenter: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelCellHyperlink"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelCellHyperlink",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelCellHyperlinkConfig:
																																	task
																																		.specialCondition
																																		?.excelCellHyperlinkConfig ?? {
																																		worksheetName:
																																			"",
																																		cell: "B13",
																																		location:
																																			"Fishing!A4",
																																		target: "",
																																		display: "",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelIconSetConditionalFormatting"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelIconSetConditionalFormatting",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelIconSetConditionalFormattingConfig:
																																	task
																																		.specialCondition
																																		?.excelIconSetConditionalFormattingConfig ?? {
																																		worksheetName:
																																			"",
																																		range:
																																			"C4:C11",
																																		iconSet:
																																			"3Flags",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelChartDataRange"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelChartDataRange",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelChartDataRangeConfig:
																																	task
																																		.specialCondition
																																		?.excelChartDataRangeConfig ?? {
																																		chartSourceFile:
																																			"xl/charts/chart1.xml",
																																		expectedCategoryRange:
																																			"Tents!$B$4:$B$7",
																																		expectedValueRange:
																																			"Tents!$C$4:$C$7",
																																		expectedPointCount: 4,
																																		expectedCategoryText:
																																			"Giant Truck Bed Tent",
																																		requireNoExtraSeries: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelTextReplacement"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelTextReplacement",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelTextReplacementConfig:
																																	task
																																		.specialCondition
																																		?.excelTextReplacementConfig ?? {
																																		worksheetName:
																																			"",
																																		sourceFile:
																																			"",
																																		oldText:
																																			"Choco",
																																		newText:
																																			"Chocolate",
																																		minNewTextOccurrences: 1,
																																		requireOldTextAbsent: true,
																																		matchWholeWord: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelPrintTitles"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelPrintTitles",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelPrintTitlesConfig:
																																	task
																																		.specialCondition
																																		?.excelPrintTitlesConfig ?? {
																																		worksheetName:
																																			"Costs",
																																		expectedRows:
																																			"1:3",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelNumberFormat"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelNumberFormat",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelNumberFormatConfig:
																																	task
																																		.specialCondition
																																		?.excelNumberFormatConfig ?? {
																																		worksheetName:
																																			"Costs",
																																		range:
																																			"B:E",
																																		category:
																																			"number",
																																		decimalPlaces: 2,
																																		symbol: "",
																																		requireThousandsSeparator: false,
																																		allowedNumberFormatIds:
																																			[
																																				1, 2, 3,
																																				4,
																																			],
																																		requireEveryNumericCell: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelChartLegend"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelChartLegend",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelChartLegendConfig:
																																	task
																																		.specialCondition
																																		?.excelChartLegendConfig ?? {
																																		chartSourceFile:
																																			"xl/charts/chart1.xml",
																																		position:
																																			"t",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelDefinedName"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelDefinedName",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelDefinedNameConfig:
																																	task
																																		.specialCondition
																																		?.excelDefinedNameConfig ?? {
																																		name: "Prices",
																																		expectedRanges:
																																			[
																																				"D5:D15",
																																				"D18:D26",
																																			],
																																		requireExactRanges: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelFormulaReferences"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelFormulaReferences",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelFormulaReferencesConfig:
																																	task
																																		.specialCondition
																																		?.excelFormulaReferencesConfig ?? {
																																		worksheetName:
																																			"Price List",
																																		cell: "H5",
																																		requiredReferences:
																																			[
																																				"Price_10G",
																																				"Install_10G",
																																				"Support_10G",
																																			],
																																		requiredFunctions:
																																			[],
																																		requiredFormulaFragments:
																																			[],
																																		expectedFormula:
																																			"",
																																		expectedValue:
																																			"",
																																		requireOnlyDefinedNameReferences: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelNoConditionalFormatting"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelNoConditionalFormatting",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelNoConditionalFormattingConfig:
																																	task
																																		.specialCondition
																																		?.excelNoConditionalFormattingConfig ?? {
																																		worksheetName:
																																			"Price List",
																																		requireAllWorksheets: false,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelTextRotation"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelTextRotation",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelTextRotationConfig:
																																	task
																																		.specialCondition
																																		?.excelTextRotationConfig ?? {
																																		worksheetName:
																																			"Price List",
																																		expectedTexts:
																																			[
																																				"Port Size",
																																				"Band Size",
																																				"Price",
																																				"Install",
																																				"Support",
																																			],
																																		allowedTextRotationValues:
																																			[45],
																																		requireAllTexts: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelMultiColumnSort"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelMultiColumnSort",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelMultiColumnSortConfig:
																																	task
																																		.specialCondition
																																		?.excelMultiColumnSortConfig ?? {
																																		worksheetName:
																																			"Price List",
																																		headerRow: 4,
																																		dataRange:
																																			"",
																																		keyColumns:
																																			[
																																				{
																																					headerName:
																																						"Wired Equipment",
																																					descending: false,
																																				},
																																				{
																																					headerName:
																																						"Port Size",
																																					descending: false,
																																				},
																																			],
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelFreezePanes"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelFreezePanes",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelFreezePanesConfig:
																																	task
																																		.specialCondition
																																		?.excelFreezePanesConfig ?? {
																																		worksheetName:
																																			"Catalog",
																																		topLeftCell:
																																			"A4",
																																		ySplit: 3,
																																		xSplit: 0,
																																		requireNoColumnFreeze: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelDocumentProperty"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelDocumentProperty",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelDocumentPropertyConfig:
																																	task
																																		.specialCondition
																																		?.excelDocumentPropertyConfig ?? {
																																		propertyName:
																																			"Status",
																																		expectedValue:
																																			"Draft",
																																		sourceFile:
																																			"docProps/custom.xml",
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelPrintArea"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelPrintArea",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelPrintAreaConfig:
																																	task
																																		.specialCondition
																																		?.excelPrintAreaConfig ?? {
																																		worksheetName:
																																			"Q1 Sales",
																																		expectedRange:
																																			"A1:F17",
																																		requireExactRange: true,
																																	},
																															},
																														);
																													}
																													if (
																														value ===
																														"excelChartStyle"
																													) {
																														updateTaskSpecialCondition(
																															pi,
																															ti,
																															{
																																type: "excelChartStyle",
																																score:
																																	task
																																		.specialCondition
																																		?.score ??
																																	0,
																																feedback:
																																	task
																																		.specialCondition
																																		?.feedback ??
																																	defaultSpecialConditionFeedback(
																																		value as SpecialConditionType,
																																	),
																																excelChartStyleConfig:
																																	task
																																		.specialCondition
																																		?.excelChartStyleConfig ?? {
																																		chartSourceFile:
																																			"xl/charts/chart1.xml",
																																		styleSourceFile:
																																			"xl/charts/style1.xml",
																																		styleId: 204,
																																	},
																															},
																														);
																													}
																					if (value === "wordBookmark") {
																						updateTaskSpecialCondition(pi, ti, {
																							type: "wordBookmark",
																							score: task.specialCondition?.score ?? 0,
																							feedback: task.specialCondition?.feedback ?? defaultSpecialConditionFeedback(value as SpecialConditionType),
																							wordBookmarkConfig: task.specialCondition?.wordBookmarkConfig ?? {
																								sourceFile: "word/document.xml",
																								bookmarkName: "Resorts",
																								targetText: "WORLD-CLASS SKI RESORTS",
																								caseSensitiveName: true,
																							},
																						});
																					}
																					if (value === "wordCustomToc") {
																						updateTaskSpecialCondition(pi, ti, {
																							type: "wordCustomToc",
																							score: task.specialCondition?.score ?? 0,
																							feedback: task.specialCondition?.feedback ?? defaultSpecialConditionFeedback(value as SpecialConditionType),
																							wordCustomTocConfig: task.specialCondition?.wordCustomTocConfig ?? {
																								sourceFile: "word/document.xml",
																								anchorText: "TABLE OF CONTENTS",
																								requireUnderAnchorText: true,
																								requiredStyles: [
																									{ styleName: "Title", level: 1 },
																									{ styleName: "Heading 1", level: 2 },
																									{ styleName: "Heading 2", level: 3 },
																									{ styleName: "Caption", level: 4 },
																								],
																							},
																						});
																					}
																					if (value === "wordTextToTable") {
																						updateTaskSpecialCondition(pi, ti, {
																							type: "wordTextToTable",
																							score: task.specialCondition?.score ?? 0,
																							feedback: task.specialCondition?.feedback ?? defaultSpecialConditionFeedback(value as SpecialConditionType),
																							wordTextToTableConfig: task.specialCondition?.wordTextToTableConfig ?? {
																								sourceFile: "word/document.xml",
																								anchorText: "Resort Name",
																								expectedColumns: 5,
																								minRows: 2,
																								expectedTableStyle: "Grid Table 5 Dark - Accent 1",
																							},
																						});
																					}
																					if (value === "wordBulletStyle") {
																						updateTaskSpecialCondition(pi, ti, {
																							type: "wordBulletStyle",
																							score: task.specialCondition?.score ?? 0,
																							feedback: task.specialCondition?.feedback ?? defaultSpecialConditionFeedback(value as SpecialConditionType),
																							wordBulletStyleConfig: task.specialCondition?.wordBulletStyleConfig ?? {
																								sourceFile: "word/document.xml",
																								numberingFile: "word/numbering.xml",
																								anchorText: "SKI RESORTS",
																								expectedBulletChar: "■",
																								level: 0,
																								minItems: 1,
																							},
																						});
																					}
																					if (value === "wordResolveComment") {
																						updateTaskSpecialCondition(pi, ti, {
																							type: "wordResolveComment",
																							score: task.specialCondition?.score ?? 0,
																							feedback: task.specialCondition?.feedback ?? defaultSpecialConditionFeedback(value as SpecialConditionType),
																							wordResolveCommentConfig: task.specialCondition?.wordResolveCommentConfig ?? {
																								commentsExtendedFile: "word/commentsExtended.xml",
																								requireAllResolved: true,
																							},
																						});
																					}
																												}}
																												className="mt-1 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
																											>
																												<option value="">
																													KhÃ´ng sá»­ dá»¥ng
																												</option>

																												{groupedSpecialConditionOptions.map(
																													(item) =>
																														item.type ===
																														"group" ? (
																															<option
																																key={`group-${item.label}`}
																																disabled
																															>
																																{`â”€â”€â”€â”€ ${item.label} â”€â”€â”€â”€`}
																															</option>
																														) : (
																															<option
																																key={
																																	item.option
																																		.value
																																}
																																value={
																																	item.option
																																		.value
																																}
																															>
																																{`  ${item.option.label}`}
																															</option>
																														),
																												)}
																											</select>

																											<svg
																												aria-hidden="true"
																												className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
																												viewBox="0 0 20 20"
																												fill="currentColor"
																											>
																												<path
																													fillRule="evenodd"
																													d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
																													clipRule="evenodd"
																												/>
																											</svg>
																										</div>
																									</label>
																								</div>

																								{!currentSpecialConditionSupported && (
																									<div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
																										Äiá»u kiá»‡n Ä‘áº·c biá»‡t nÃ y khÃ´ng
																										há»— trá»£ cho subject{" "}
																										{selected.subject ||
																											"unknown"}
																										.
																									</div>
																								)}

																								{/* Score input cho Special Condition */}
																								{task.specialCondition
																									?.type && (
																									<div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr] md:items-end">
																										<label className="text-xs font-semibold text-slate-600">
																											Äiá»ƒm Ä‘iá»u kiá»‡n Ä‘áº·c biá»‡t
																											<input
																												type="number"
																												min={0}
																												value={
																													task.specialCondition
																														.score ?? 0
																												}
																												onChange={(e) =>
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															score: Number(
																																e.target.value,
																															),
																														},
																													)
																												}
																												className={inputClass}
																											/>
																										</label>
																										<p className="text-[11px] leading-4 text-slate-400">
																											Tá»•ng Ä‘iá»ƒm (cÃ¡c Conditions
																											XML + Äiá»u kiá»‡n Ä‘áº·c biá»‡t)
																											pháº£i báº±ng Äiá»ƒm tá»‘i Ä‘a cá»§a
																											Task ({task.maxScore}). CÃ³
																											thá»ƒ Ä‘á»ƒ 0 Condition XML náº¿u
																											Ä‘iá»u kiá»‡n Ä‘áº·c biá»‡t chiáº¿m
																											trá»n Ä‘iá»ƒm Task.
																										</p>
																									</div>
																								)}

																								{task.specialCondition
																									?.type && (
																									<div className="mt-3 grid gap-3 md:grid-cols-2">
																										<label className="text-xs font-semibold text-slate-600">
																											ThÃ´ng bÃ¡o khi Ä‘Ãºng
																											<input
																												value={
																													task.specialCondition
																														.feedback
																														?.successDetail ??
																													""
																												}
																												onChange={(e) =>
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															feedback: {
																																...(task
																																	.specialCondition
																																	?.feedback ??
																																	emptyFeedback()),
																																successDetail:
																																	e.target
																																		.value,
																															},
																														},
																													)
																												}
																												placeholder="ÄÃ£ hoÃ n thÃ nh Ä‘Ãºng yÃªu cáº§u."
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											ThÃ´ng bÃ¡o khi sai
																											<input
																												value={
																													task.specialCondition
																														.feedback
																														?.errorMessage ?? ""
																												}
																												onChange={(e) =>
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															feedback: {
																																...(task
																																	.specialCondition
																																	?.feedback ??
																																	emptyFeedback()),
																																errorMessage:
																																	e.target
																																		.value,
																															},
																														},
																													)
																												}
																												placeholder="Báº¡n chÆ°a thá»±c hiá»‡n Ä‘Ãºng yÃªu cáº§u."
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600 md:col-span-2">
																											Gá»£i Ã½ cÃ¡ch sá»­a
																											<input
																												value={
																													task.specialCondition
																														.feedback
																														?.fixAction ?? ""
																												}
																												onChange={(e) =>
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															feedback: {
																																...(task
																																	.specialCondition
																																	?.feedback ??
																																	emptyFeedback()),
																																fixAction:
																																	e.target
																																		.value,
																															},
																														},
																													)
																												}
																												placeholder="VÃ­ dá»¥: Chá»n text -> Insert -> Link -> nháº­p URL Ä‘Ãºng."
																												className={inputClass}
																											/>
																										</label>
																									</div>
																								)}

																								{/* Description */}
																								{task.specialCondition
																									?.type && (
																									<div className="mt-3 flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
																										<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
																											<Icon
																												name="lightbulb"
																												className="text-base"
																											/>
																										</div>

																										<div>
																											<p className="text-xs font-bold text-violet-900">
																												{
																													availableSpecialConditionOptions.find(
																														(option) =>
																															option.value ===
																															task
																																.specialCondition
																																?.type,
																													)?.label
																												}
																											</p>

																											<p className="mt-0.5 text-xs leading-5 text-violet-700/80">
																												{
																													availableSpecialConditionOptions.find(
																														(option) =>
																															option.value ===
																															task
																																.specialCondition
																																?.type,
																													)?.description
																												}
																											</p>
																										</div>
																									</div>
																								)}

																								{/* Picture Bullet configuration */}
																								{task.specialCondition?.type ===
																									"pictureBullet" && (
																									<PictureBulletEditor
																										config={
																											task.specialCondition
																												.config
																										}
																										getAccessToken={
																											getAccessToken
																										}
																										onChange={(
																											config: PictureBulletConfig,
																										) => {
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "pictureBullet",
																													config,
																												},
																											);
																										}}
																									/>
																								)}
																							</>
																						)}

																						{task.specialCondition?.type ===
																							"insertedImage" && (
																							<InsertedImageEditor
																								config={
																									task.specialCondition
																										.imageInsertConfig
																								}
																								getAccessToken={getAccessToken}
																								onChange={(
																									imageInsertConfig: ImageInsertConfig,
																								) => {
																									updateTaskSpecialCondition(
																										pi,
																										ti,
																										{
																											...task.specialCondition!,
																											type: "insertedImage",
																											imageInsertConfig,
																										},
																									);
																								}}
																							/>
																						)}
																						{task.specialCondition?.type ===
																							"convertTableToText" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600">
																										Tá»‡p nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.convertTableToTextConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.convertTableToTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "convertTableToText",
																														convertTableToTextConfig:
																															{
																																...currentConfig,
																																sourceFile:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Anchor text
																										<input
																											value={
																												task.specialCondition
																													.convertTableToTextConfig
																													?.anchorText ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.convertTableToTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "convertTableToText",
																														convertTableToTextConfig:
																															{
																																...currentConfig,
																																anchorText:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="Weekly Rental:"
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<div className="mt-3 grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600">
																										Min rows
																										<input
																											type="number"
																											min={1}
																											step={1}
																											value={
																												task.specialCondition
																													.convertTableToTextConfig
																													?.minRows ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.convertTableToTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "convertTableToText",
																														convertTableToTextConfig:
																															{
																																...currentConfig,
																																minRows: e
																																	.target.value
																																	? Number(
																																			e.target
																																				.value,
																																		)
																																	: undefined,
																															},
																													},
																												);
																											}}
																											placeholder="6"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Min tabs per row
																										<input
																											type="number"
																											min={1}
																											step={1}
																											value={
																												task.specialCondition
																													.convertTableToTextConfig
																													?.minTabsPerRow ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.convertTableToTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "convertTableToText",
																														convertTableToTextConfig:
																															{
																																...currentConfig,
																																minTabsPerRow: e
																																	.target.value
																																	? Number(
																																			e.target
																																				.value,
																																		)
																																	: undefined,
																															},
																													},
																												);
																											}}
																											placeholder="5"
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<label className="mt-3 block text-xs font-semibold text-slate-600">
																									Expected rows
																									<textarea
																										value={(
																											task.specialCondition
																												.convertTableToTextConfig
																												?.expectedRows ?? []
																										).join("\n")}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.convertTableToTextConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "convertTableToText",
																													convertTableToTextConfig:
																														{
																															...currentConfig,
																															expectedRows:
																																e.target.value.split(
																																	"\n",
																																),
																														},
																												},
																											);
																										}}
																										rows={5}
																										placeholder={
																											"Sleeps\tLog Cabin\tSpring\tSummer\tFall\tWinter\n2\tAspen\t3240\t4320\t3450\t2240"
																										}
																										className={cx(
																											inputClass,
																											"resize-y font-mono",
																										)}
																									/>
																								</label>
																								<label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
																									<input
																										type="checkbox"
																										checked={
																											task.specialCondition
																												.convertTableToTextConfig
																												?.requireNoTables ??
																											true
																										}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.convertTableToTextConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "convertTableToText",
																													convertTableToTextConfig:
																														{
																															...currentConfig,
																															requireNoTables:
																																e.target
																																	.checked,
																														},
																												},
																											);
																										}}
																										className="h-4 w-4 accent-blue-600"
																									/>
																									KhÃ´ng yÃªu cáº§u báº£ng Word
																								</label>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"hyperlink" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600">
																										VÄƒn báº£n hiá»ƒn thá»‹
																										<input
																											value={
																												task.specialCondition
																													.hyperlinkConfig
																													?.displayText ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.hyperlinkConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "hyperlink",
																														hyperlinkConfig: {
																															...currentConfig,
																															displayText:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											placeholder="log cabin"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										VÄƒn báº£n Ä‘á»©ng trÆ°á»›c
																										<input
																											value={
																												task.specialCondition
																													.hyperlinkConfig
																													?.anchorTextBefore ??
																												""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.hyperlinkConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "hyperlink",
																														hyperlinkConfig: {
																															...currentConfig,
																															anchorTextBefore:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											placeholder="Nháº­p cá»¥m text Ä‘á»©ng trÆ°á»›c vá»‹ trÃ­ cáº§n link"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										URL
																										<input
																											value={
																												task.specialCondition
																													.hyperlinkConfig
																													?.url ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.hyperlinkConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "hyperlink",
																														hyperlinkConfig: {
																															...currentConfig,
																															url: e.target
																																.value,
																														},
																													},
																												);
																											}}
																											placeholder="https://en.wikipedia.org/wiki/Log_cabin"
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<div className="mt-3 grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600">
																										Tá»‡p nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.hyperlinkConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.hyperlinkConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "hyperlink",
																														hyperlinkConfig: {
																															...currentConfig,
																															sourceFile:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Rels file
																										<input
																											value={
																												task.specialCondition
																													.hyperlinkConfig
																													?.relsFile ??
																												"word/_rels/document.xml.rels"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.hyperlinkConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "hyperlink",
																														hyperlinkConfig: {
																															...currentConfig,
																															relsFile:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											placeholder="word/_rels/document.xml.rels"
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
																									<input
																										type="checkbox"
																										checked={
																											task.specialCondition
																												.hyperlinkConfig
																												?.caseSensitiveText ??
																											false
																										}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.hyperlinkConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "hyperlink",
																													hyperlinkConfig: {
																														...currentConfig,
																														caseSensitiveText:
																															e.target.checked,
																													},
																												},
																											);
																										}}
																										className="h-4 w-4 accent-blue-600"
																									/>
																									VÄƒn báº£n hiá»ƒn thá»‹ phÃ¢n biá»‡t chá»¯
																									hoa/thÆ°á»ng
																								</label>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"sectionBreakBeforeText" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600">
																										File nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.sectionBreakBeforeTextConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.sectionBreakBeforeTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "sectionBreakBeforeText",
																														sectionBreakBeforeTextConfig:
																															{
																																...currentConfig,
																																sourceFile:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										VÄƒn báº£n má»¥c tiÃªu
																										<input
																											value={
																												task.specialCondition
																													.sectionBreakBeforeTextConfig
																													?.targetText ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.sectionBreakBeforeTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "sectionBreakBeforeText",
																														sectionBreakBeforeTextConfig:
																															{
																																...currentConfig,
																																targetText:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="Affordable Pricing"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Loáº¡i ngáº¯t pháº§n
																										<select
																											value={
																												task.specialCondition
																													.sectionBreakBeforeTextConfig
																													?.breakType ??
																												"continuous"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.sectionBreakBeforeTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "sectionBreakBeforeText",
																														sectionBreakBeforeTextConfig:
																															{
																																...currentConfig,
																																breakType:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											className={inputClass}
																										>
																											<option value="continuous">
																												Continuous
																											</option>
																											<option value="nextPage">
																												Next Page
																											</option>
																											<option value="evenPage">
																												Even Page
																											</option>
																											<option value="oddPage">
																												Odd Page
																											</option>
																											<option value="nextColumn">
																												Next Column
																											</option>
																										</select>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Táº§n suáº¥t xuáº¥t hiá»‡n má»¥c tiÃªu
																										<input
																											type="number"
																											min={1}
																											step={1}
																											value={
																												task.specialCondition
																													.sectionBreakBeforeTextConfig
																													?.targetOccurrence ??
																												1
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.sectionBreakBeforeTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "sectionBreakBeforeText",
																														sectionBreakBeforeTextConfig:
																															{
																																...currentConfig,
																																targetOccurrence:
																																	e.target.value
																																		? Number(
																																				e.target
																																					.value,
																																			)
																																		: undefined,
																															},
																													},
																												);
																											}}
																											placeholder="1"
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<div className="mt-3 grid gap-3 md:grid-cols-2">
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.sectionBreakBeforeTextConfig
																													?.requireImmediateBefore ??
																												true
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.sectionBreakBeforeTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "sectionBreakBeforeText",
																														sectionBreakBeforeTextConfig:
																															{
																																...currentConfig,
																																requireImmediateBefore:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										YÃªu cáº§u thá»±c hiá»‡n ngay trÆ°á»›c
																										Ä‘Ã³
																									</label>
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.sectionBreakBeforeTextConfig
																													?.allowSameParagraphSectPr ??
																												true
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.sectionBreakBeforeTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "sectionBreakBeforeText",
																														sectionBreakBeforeTextConfig:
																															{
																																...currentConfig,
																																allowSameParagraphSectPr:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										Cho phÃ©p cÃ¹ng má»™t Ä‘oáº¡n
																										vÄƒn/pháº§n
																									</label>
																								</div>
																							</div>
																						)}
																						{task.specialCondition?.type === "wordBookmark" && (
																							<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
																								{[
																									["sourceFile", "File nguồn", "word/document.xml"],
																									["bookmarkName", "Tên bookmark", "Resorts"],
																									["targetText", "Văn bản mục tiêu", "WORLD-CLASS SKI RESORTS"],
																								].map(([field, label, placeholder]) => (
																									<label key={field} className="text-xs font-semibold text-slate-600">
																										{label}
																										<input value={(task.specialCondition?.wordBookmarkConfig as Record<string, string | undefined> | undefined)?.[field] ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordBookmark", wordBookmarkConfig: { ...(task.specialCondition?.wordBookmarkConfig ?? {}), [field]: e.target.value } })} placeholder={placeholder} className={inputClass} />
																									</label>
																								))}
																								<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																									<input type="checkbox" checked={task.specialCondition.wordBookmarkConfig?.caseSensitiveName ?? true} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordBookmark", wordBookmarkConfig: { ...(task.specialCondition?.wordBookmarkConfig ?? {}), caseSensitiveName: e.target.checked } })} className="h-4 w-4 accent-blue-600" />
																									Phân biệt hoa/thường tên bookmark
																								</label>
																							</div>
																						)}
																						{task.specialCondition?.type === "wordCustomToc" && (
																							<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
																								<label className="text-xs font-semibold text-slate-600">File nguồn<input value={task.specialCondition.wordCustomTocConfig?.sourceFile ?? "word/document.xml"} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordCustomToc", wordCustomTocConfig: { ...(task.specialCondition?.wordCustomTocConfig ?? {}), sourceFile: e.target.value } })} className={inputClass} /></label>
																								<label className="text-xs font-semibold text-slate-600">Anchor text<input value={task.specialCondition.wordCustomTocConfig?.anchorText ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordCustomToc", wordCustomTocConfig: { ...(task.specialCondition?.wordCustomTocConfig ?? {}), anchorText: e.target.value } })} placeholder="TABLE OF CONTENTS" className={inputClass} /></label>
																								<label className="text-xs font-semibold text-slate-600 md:col-span-2">Style=level, mỗi dòng một mapping<textarea value={(task.specialCondition.wordCustomTocConfig?.requiredStyles ?? []).map((item) => `${item.styleName ?? ""}=${item.level ?? ""}`).join("\n")} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordCustomToc", wordCustomTocConfig: { ...(task.specialCondition?.wordCustomTocConfig ?? {}), requiredStyles: e.target.value.split("\\n").map((line) => line.trim()).filter(Boolean).map((line: string) => { const [styleName, level] = line.split("="); return { styleName: styleName?.trim(), level: Number(level) || undefined }; }) } })} placeholder="Title=1&#10;Heading 1=2&#10;Heading 2=3&#10;Caption=4" className={`${inputClass} min-h-28`} /></label>
																								<label className="text-xs font-semibold text-slate-600">Định dạng kỳ vọng<input value={task.specialCondition.wordCustomTocConfig?.expectedFormat ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordCustomToc", wordCustomTocConfig: { ...(task.specialCondition?.wordCustomTocConfig ?? {}), expectedFormat: e.target.value } })} placeholder="classic/simple/... nếu cần" className={inputClass} /></label>
																								<label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={task.specialCondition.wordCustomTocConfig?.requireUnderAnchorText ?? true} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordCustomToc", wordCustomTocConfig: { ...(task.specialCondition?.wordCustomTocConfig ?? {}), requireUnderAnchorText: e.target.checked } })} className="h-4 w-4 accent-blue-600" />TOC nằm dưới anchor text</label>
																							</div>
																						)}
																						{task.specialCondition?.type === "wordTextToTable" && (
																							<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
																								{[["sourceFile", "File nguồn", "word/document.xml"], ["anchorText", "Anchor text", "Resort Name"], ["expectedTableStyle", "Table style", "Grid Table 5 Dark - Accent 1"]].map(([field, label, placeholder]) => (<label key={field} className="text-xs font-semibold text-slate-600">{label}<input value={(task.specialCondition?.wordTextToTableConfig as Record<string, string | undefined> | undefined)?.[field] ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordTextToTable", wordTextToTableConfig: { ...(task.specialCondition?.wordTextToTableConfig ?? {}), [field]: e.target.value } })} placeholder={placeholder} className={inputClass} /></label>))}
																								<label className="text-xs font-semibold text-slate-600">Số cột<input type="number" min={1} value={task.specialCondition.wordTextToTableConfig?.expectedColumns ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordTextToTable", wordTextToTableConfig: { ...(task.specialCondition?.wordTextToTableConfig ?? {}), expectedColumns: e.target.value ? Number(e.target.value) : undefined } })} placeholder="5" className={inputClass} /></label>
																								<label className="text-xs font-semibold text-slate-600">Số dòng tối thiểu<input type="number" min={1} value={task.specialCondition.wordTextToTableConfig?.minRows ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordTextToTable", wordTextToTableConfig: { ...(task.specialCondition?.wordTextToTableConfig ?? {}), minRows: e.target.value ? Number(e.target.value) : undefined } })} placeholder="2" className={inputClass} /></label>
																							</div>
																						)}
																						{task.specialCondition?.type === "wordBulletStyle" && (
																							<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
																								{[["sourceFile", "File nguồn", "word/document.xml"], ["numberingFile", "Numbering file", "word/numbering.xml"], ["anchorText", "Anchor text", "SKI RESORTS"], ["expectedBulletChar", "Ký tự bullet", "■"]].map(([field, label, placeholder]) => (<label key={field} className="text-xs font-semibold text-slate-600">{label}<input value={(task.specialCondition?.wordBulletStyleConfig as Record<string, string | undefined> | undefined)?.[field] ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordBulletStyle", wordBulletStyleConfig: { ...(task.specialCondition?.wordBulletStyleConfig ?? {}), [field]: e.target.value } })} placeholder={placeholder} className={inputClass} /></label>))}
																								<label className="text-xs font-semibold text-slate-600">Level<input type="number" min={0} value={task.specialCondition.wordBulletStyleConfig?.level ?? 0} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordBulletStyle", wordBulletStyleConfig: { ...(task.specialCondition?.wordBulletStyleConfig ?? {}), level: Number(e.target.value) } })} className={inputClass} /></label>
																								<label className="text-xs font-semibold text-slate-600">Số item tối thiểu<input type="number" min={1} value={task.specialCondition.wordBulletStyleConfig?.minItems ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordBulletStyle", wordBulletStyleConfig: { ...(task.specialCondition?.wordBulletStyleConfig ?? {}), minItems: e.target.value ? Number(e.target.value) : undefined } })} placeholder="1" className={inputClass} /></label>
																							</div>
																						)}
																						{task.specialCondition?.type === "wordResolveComment" && (
																							<div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2">
																								<label className="text-xs font-semibold text-slate-600">commentsExtended file<input value={task.specialCondition.wordResolveCommentConfig?.commentsExtendedFile ?? "word/commentsExtended.xml"} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordResolveComment", wordResolveCommentConfig: { ...(task.specialCondition?.wordResolveCommentConfig ?? {}), commentsExtendedFile: e.target.value } })} className={inputClass} /></label>
																								<label className="text-xs font-semibold text-slate-600">Target text<input value={task.specialCondition.wordResolveCommentConfig?.targetText ?? ""} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordResolveComment", wordResolveCommentConfig: { ...(task.specialCondition?.wordResolveCommentConfig ?? {}), targetText: e.target.value } })} placeholder="Để trống = mọi comment" className={inputClass} /></label>
																								<label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={task.specialCondition.wordResolveCommentConfig?.requireAllResolved ?? true} onChange={(e) => updateTaskSpecialCondition(pi, ti, { ...task.specialCondition!, type: "wordResolveComment", wordResolveCommentConfig: { ...(task.specialCondition?.wordResolveCommentConfig ?? {}), requireAllResolved: e.target.checked } })} className="h-4 w-4 accent-blue-600" />Yêu cầu tất cả comment resolved</label>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"textBoxContainsText" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600">
																										File nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.textBoxContainsTextConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.textBoxContainsTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "textBoxContainsText",
																														textBoxContainsTextConfig:
																															{
																																...currentConfig,
																																sourceFile:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Cháº¿ Ä‘á»™ so khá»›p
																										<select
																											value={
																												task.specialCondition
																													.textBoxContainsTextConfig
																													?.matchMode ?? "exact"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.textBoxContainsTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "textBoxContainsText",
																														textBoxContainsTextConfig:
																															{
																																...currentConfig,
																																matchMode: e
																																	.target
																																	.value as
																																	| "exact"
																																	| "contains",
																															},
																													},
																												);
																											}}
																											className={inputClass}
																										>
																											<option value="exact">
																												ÄÃºng nguyÃªn Ä‘oáº¡n
																											</option>
																											<option value="contains">
																												Chá»‰ cáº§n chá»©a Ä‘oáº¡n nÃ y
																											</option>
																										</select>
																									</label>
																									<label className="text-xs font-semibold text-slate-600 md:col-span-2">
																										VÄƒn báº£n yÃªu cáº§u
																										<textarea
																											value={
																												task.specialCondition
																													.textBoxContainsTextConfig
																													?.expectedText ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.textBoxContainsTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "textBoxContainsText",
																														textBoxContainsTextConfig:
																															{
																																...currentConfig,
																																expectedText:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="Nháº­p nguyÃªn Ä‘oáº¡n vÄƒn báº¯t Ä‘áº§u báº±ng Note:"
																											rows={5}
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Láº§n xuáº¥t hiá»‡n má»¥c tiÃªu
																										<input
																											type="number"
																											min={1}
																											step={1}
																											value={
																												task.specialCondition
																													.textBoxContainsTextConfig
																													?.targetOccurrence ??
																												1
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.textBoxContainsTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "textBoxContainsText",
																														textBoxContainsTextConfig:
																															{
																																...currentConfig,
																																targetOccurrence:
																																	e.target.value
																																		? Number(
																																				e.target
																																					.value,
																																			)
																																		: undefined,
																															},
																													},
																												);
																											}}
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<div className="mt-3 grid gap-3 md:grid-cols-3">
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.textBoxContainsTextConfig
																													?.caseSensitive ??
																												false
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.textBoxContainsTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "textBoxContainsText",
																														textBoxContainsTextConfig:
																															{
																																...currentConfig,
																																caseSensitive:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										PhÃ¢n biá»‡t hoa/thÆ°á»ng
																									</label>
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.textBoxContainsTextConfig
																													?.requireDefaultPaste ??
																												true
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.textBoxContainsTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "textBoxContainsText",
																														textBoxContainsTextConfig:
																															{
																																...currentConfig,
																																requireDefaultPaste:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										Báº¯t paste máº·c Ä‘á»‹nh
																									</label>
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.textBoxContainsTextConfig
																													?.requireRemovedFromBody ??
																												true
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.textBoxContainsTextConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "textBoxContainsText",
																														textBoxContainsTextConfig:
																															{
																																...currentConfig,
																																requireRemovedFromBody:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										KhÃ´ng cÃ²n ngoÃ i há»™p vÄƒn báº£n
																									</label>
																								</div>
																								<label className="mt-3 block text-xs font-semibold text-slate-600">
																									Run properties cáº¥m khi báº¯t
																									paste máº·c Ä‘á»‹nh
																									<textarea
																										value={(
																											task.specialCondition
																												.textBoxContainsTextConfig
																												?.forbiddenRunProperties ??
																											[]
																										).join("\n")}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.textBoxContainsTextConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "textBoxContainsText",
																													textBoxContainsTextConfig:
																														{
																															...currentConfig,
																															forbiddenRunProperties:
																																e.target.value
																																	.split(
																																		/\r?\n/,
																																	)
																																	.map((line) =>
																																		line.trim(),
																																	)
																																	.filter(
																																		Boolean,
																																	),
																														},
																												},
																											);
																										}}
																										rows={5}
																										placeholder={
																											"Äá»ƒ trá»‘ng náº¿u khÃ´ng cÃ³ dáº¥u hiá»‡u XML sai á»•n Ä‘á»‹nh"
																										}
																										className={inputClass}
																									/>
																								</label>
																								<label className="mt-3 block text-xs font-semibold text-slate-600">
																									MÃ u chá»¯ cáº¥m khi báº¯t paste máº·c
																									Ä‘á»‹nh
																									<textarea
																										value={(
																											task.specialCondition
																												.textBoxContainsTextConfig
																												?.forbiddenTextColors ?? [
																												"FFFFFF",
																												"background1",
																												"bg1",
																												"lt1",
																											]
																										).join("\n")}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.textBoxContainsTextConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "textBoxContainsText",
																													textBoxContainsTextConfig:
																														{
																															...currentConfig,
																															forbiddenTextColors:
																																e.target.value
																																	.split(
																																		/\r?\n/,
																																	)
																																	.map((line) =>
																																		line.trim(),
																																	)
																																	.filter(
																																		Boolean,
																																	),
																														},
																												},
																											);
																										}}
																										rows={4}
																										placeholder={
																											"FFFFFF\nbackground1\nbg1\nlt1"
																										}
																										className={inputClass}
																									/>
																								</label>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"wordTableSort" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-3">
																									<label className="text-xs font-semibold text-slate-600">
																										File nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.wordTableSortConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordTableSortConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordTableSort",
																														wordTableSortConfig:
																															{
																																...currentConfig,
																																sourceFile:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Anchor trÆ°á»›c báº£ng
																										<input
																											value={
																												task.specialCondition
																													.wordTableSortConfig
																													?.anchorText ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordTableSortConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordTableSort",
																														wordTableSortConfig:
																															{
																																...currentConfig,
																																anchorText:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="Our Most Popular Flavors!"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Cá»™t sort
																										<input
																											type="number"
																											min={1}
																											value={
																												task.specialCondition
																													.wordTableSortConfig
																													?.sortColumnIndex ?? 1
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordTableSortConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordTableSort",
																														wordTableSortConfig:
																															{
																																...currentConfig,
																																sortColumnIndex:
																																	Number(
																																		e.target
																																			.value,
																																	),
																															},
																													},
																												);
																											}}
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<label className="mt-3 block text-xs font-semibold text-slate-600">
																									Thá»© tá»± giÃ¡ trá»‹ mong Ä‘á»£i
																									<textarea
																										value={(
																											task.specialCondition
																												.wordTableSortConfig
																												?.expectedFirstColumnValues ??
																											[]
																										).join("\n")}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.wordTableSortConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "wordTableSort",
																													wordTableSortConfig: {
																														...currentConfig,
																														expectedFirstColumnValues:
																															e.target.value
																																.split(/\r?\n/)
																																.map((line) =>
																																	line.trim(),
																																)
																																.filter(
																																	Boolean,
																																),
																													},
																												},
																											);
																										}}
																										rows={5}
																										className={inputClass}
																									/>
																								</label>
																								<div className="mt-3 grid gap-3 md:grid-cols-3">
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.wordTableSortConfig
																													?.hasHeaderRow !==
																												false
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordTableSortConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordTableSort",
																														wordTableSortConfig:
																															{
																																...currentConfig,
																																hasHeaderRow:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										CÃ³ hÃ ng tiÃªu Ä‘á»
																									</label>
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.wordTableSortConfig
																													?.descending ?? false
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordTableSortConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordTableSort",
																														wordTableSortConfig:
																															{
																																...currentConfig,
																																descending:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										Z-A
																									</label>
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.wordTableSortConfig
																													?.requireExactOrder !==
																												false
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordTableSortConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordTableSort",
																														wordTableSortConfig:
																															{
																																...currentConfig,
																																requireExactOrder:
																																	e.target
																																		.checked,
																															},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										Báº¯t Ä‘Ãºng thá»© tá»± cáº¥u hÃ¬nh
																									</label>
																								</div>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"wordParagraphList" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-3">
																									<label className="text-xs font-semibold text-slate-600">
																										File nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.wordParagraphListConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordParagraphListConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordParagraphList",
																														wordParagraphListConfig:
																															{
																																...currentConfig,
																																sourceFile:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Anchor trÆ°á»›c danh sÃ¡ch
																										<input
																											value={
																												task.specialCondition
																													.wordParagraphListConfig
																													?.anchorText ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordParagraphListConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordParagraphList",
																														wordParagraphListConfig:
																															{
																																...currentConfig,
																																anchorText:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="Below is a list..."
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Loáº¡i list
																										<select
																											value={
																												task.specialCondition
																													.wordParagraphListConfig
																													?.listType ?? "bullet"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.wordParagraphListConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "wordParagraphList",
																														wordParagraphListConfig:
																															{
																																...currentConfig,
																																listType: e
																																	.target
																																	.value as
																																	| "any"
																																	| "bullet"
																																	| "number",
																															},
																													},
																												);
																											}}
																											className={inputClass}
																										>
																											<option value="bullet">
																												Bullet
																											</option>
																											<option value="number">
																												Number
																											</option>
																											<option value="any">
																												Báº¥t ká»³
																											</option>
																										</select>
																									</label>
																								</div>
																								<label className="mt-3 block text-xs font-semibold text-slate-600">
																									CÃ¡c item mong Ä‘á»£i
																									<textarea
																										value={(
																											task.specialCondition
																												.wordParagraphListConfig
																												?.expectedItems ?? []
																										).join("\n")}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.wordParagraphListConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "wordParagraphList",
																													wordParagraphListConfig:
																														{
																															...currentConfig,
																															expectedItems:
																																e.target.value
																																	.split(
																																		/\r?\n/,
																																	)
																																	.map((line) =>
																																		line.trim(),
																																	)
																																	.filter(
																																		Boolean,
																																	),
																														},
																												},
																											);
																										}}
																										rows={5}
																										className={inputClass}
																									/>
																								</label>
																								<label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
																									<input
																										type="checkbox"
																										checked={
																											task.specialCondition
																												.wordParagraphListConfig
																												?.requireSameNumbering !==
																											false
																										}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.wordParagraphListConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "wordParagraphList",
																													wordParagraphListConfig:
																														{
																															...currentConfig,
																															requireSameNumbering:
																																e.target
																																	.checked,
																														},
																												},
																											);
																										}}
																										className="h-4 w-4 accent-blue-600"
																									/>
																									CÃ¡c item dÃ¹ng cÃ¹ng numbering
																								</label>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"pageMargins" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-3">
																									<label className="text-xs font-semibold text-slate-600 md:col-span-3">
																										File nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.pageMarginsConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageMarginsConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageMargins",
																														pageMarginsConfig: {
																															...currentConfig,
																															sourceFile:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									{[
																										["top", "Lá» trÃªn"],
																										["bottom", "Lá» dÆ°á»›i"],
																										["left", "Lá» trÃ¡i"],
																										["right", "Lá» pháº£i"],
																										["gutter", "Gutter"],
																									].map(([field, label]) => (
																										<MarginUnitInput
																											key={field}
																											label={label}
																											value={
																												(
																													task.specialCondition
																														?.pageMarginsConfig as
																														| Record<
																																string,
																																| number
																																| undefined
																														  >
																														| undefined
																												)?.[field]
																											}
																											placeholder={
																												field === "top" ||
																												field === "bottom"
																													? "1 in hoáº·c 2.54 cm"
																													: field === "left" ||
																															field === "right"
																														? "1.5 in hoáº·c 3.81 cm"
																														: "0"
																											}
																											inputClass={inputClass}
																											onCommit={(twips) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageMarginsConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageMargins",
																														pageMarginsConfig: {
																															...currentConfig,
																															[field]: twips,
																														},
																													},
																												);
																											}}
																										/>
																									))}
																								</div>
																								<p className="mt-2 text-xs text-slate-500">
																									Nháº­p sá»‘ máº·c Ä‘á»‹nh lÃ  inch. VÃ­
																									dá»¥: 1, 1 in, 1.5 in, 2.54 cm,
																									3.81 cm.
																								</p>
																								<label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
																									<input
																										type="checkbox"
																										checked={
																											task.specialCondition
																												.pageMarginsConfig
																												?.requireAllSections ??
																											true
																										}
																										onChange={(e) => {
																											const currentConfig =
																												task.specialCondition
																													?.pageMarginsConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "pageMargins",
																													pageMarginsConfig: {
																														...currentConfig,
																														requireAllSections:
																															e.target.checked,
																													},
																												},
																											);
																										}}
																										className="h-4 w-4 accent-blue-600"
																									/>
																									Ãp dá»¥ng cho táº¥t cáº£ section
																								</label>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"pageBorder" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600 md:col-span-2">
																										File nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.pageBorderConfig
																													?.sourceFile ??
																												"word/document.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageBorderConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageBorder",
																														pageBorderConfig: {
																															...currentConfig,
																															sourceFile:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											placeholder="word/document.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Kiá»ƒu Ä‘Æ°á»ng viá»n
																										<select
																											value={
																												task.specialCondition
																													.pageBorderConfig
																													?.requiredStyle ??
																												"single"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageBorderConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageBorder",
																														pageBorderConfig: {
																															...currentConfig,
																															requiredStyle:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											className={inputClass}
																										>
																											<option value="single">
																												ÄÆ°á»ng liá»n
																											</option>
																											<option value="double">
																												ÄÆ°á»ng Ä‘Ã´i
																											</option>
																											<option value="dotted">
																												Cháº¥m trÃ²n
																											</option>
																											<option value="dashed">
																												NÃ©t Ä‘á»©t
																											</option>
																											<option value="dashSmallGap">
																												NÃ©t Ä‘á»©t ngáº¯n
																											</option>
																										</select>
																									</label>
																									<PageBorderWidthInput
																										value={
																											task.specialCondition
																												.pageBorderConfig
																												?.requiredWidth ?? 12
																										}
																										inputClass={inputClass}
																										onCommit={(width) => {
																											const currentConfig =
																												task.specialCondition
																													?.pageBorderConfig ??
																												{};
																											updateTaskSpecialCondition(
																												pi,
																												ti,
																												{
																													...task.specialCondition!,
																													type: "pageBorder",
																													pageBorderConfig: {
																														...currentConfig,
																														requiredWidth:
																															width,
																													},
																												},
																											);
																										}}
																									/>
																									<label className="text-xs font-semibold text-slate-600">
																										MÃ u viá»n
																										<select
																											value={selectedPageBorderColorPreset(
																												task.specialCondition
																													.pageBorderConfig,
																											)}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageBorderConfig ??
																													{};
																												const preset =
																													pageBorderColorPresets.find(
																														(item) =>
																															item.requiredColor ===
																															e.target.value,
																													);
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageBorder",
																														pageBorderConfig: {
																															...currentConfig,
																															requiredColor:
																																preset?.requiredColor ??
																																currentConfig.requiredColor,
																															allowedColors:
																																preset?.allowedColors ??
																																currentConfig.allowedColors,
																														},
																													},
																												);
																											}}
																											className={inputClass}
																										>
																											{pageBorderColorPresets.map(
																												(preset) => (
																													<option
																														key={
																															preset.requiredColor
																														}
																														value={
																															preset.requiredColor
																														}
																													>
																														{preset.label}
																													</option>
																												),
																											)}
																											<option value="custom">
																												TÃ¹y chá»‰nh
																											</option>
																										</select>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										MÃ£ mÃ u tÃ¹y chá»‰nh
																										<input
																											value={
																												task.specialCondition
																													.pageBorderConfig
																													?.requiredColor ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageBorderConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageBorder",
																														pageBorderConfig: {
																															...currentConfig,
																															requiredColor:
																																e.target.value,
																														},
																													},
																												);
																											}}
																											placeholder="00B0F0 hoáº·c Light Blue"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600 md:col-span-2">
																										MÃ u cháº¥p nháº­n thÃªm
																										<textarea
																											value={(
																												task.specialCondition
																													.pageBorderConfig
																													?.allowedColors ?? []
																											).join("\n")}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageBorderConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageBorder",
																														pageBorderConfig: {
																															...currentConfig,
																															allowedColors:
																																e.target.value
																																	.split(
																																		/\r?\n/,
																																	)
																																	.map((line) =>
																																		line.trim(),
																																	)
																																	.filter(
																																		Boolean,
																																	),
																														},
																													},
																												);
																											}}
																											rows={4}
																											placeholder={
																												"00B0F0\n5B9BD5\n4F81BD\naccent1"
																											}
																											className={inputClass}
																										/>
																									</label>
																								</div>
																								<div className="mt-3 flex flex-wrap gap-4">
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.pageBorderConfig
																													?.requireBox ?? true
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageBorderConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageBorder",
																														pageBorderConfig: {
																															...currentConfig,
																															requireBox:
																																e.target
																																	.checked,
																														},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										Báº¯t buá»™c Ä‘á»§ 4 cáº¡nh Box
																									</label>
																									<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																										<input
																											type="checkbox"
																											checked={
																												task.specialCondition
																													.pageBorderConfig
																													?.requireAllSections ??
																												true
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.pageBorderConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "pageBorder",
																														pageBorderConfig: {
																															...currentConfig,
																															requireAllSections:
																																e.target
																																	.checked,
																														},
																													},
																												);
																											}}
																											className="h-4 w-4 accent-blue-600"
																										/>
																										Ãp dá»¥ng cho táº¥t cáº£ section
																									</label>
																								</div>
																								<p className="mt-2 text-xs text-slate-500">
																									Trong OpenXML, Ä‘á»™ dÃ y page
																									border lÆ°u theo 1/8 pt: 1.5 pt
																									= 12.
																								</p>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"documentStyleSet" && (
																							<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
																								<div className="grid gap-3 md:grid-cols-2">
																									<label className="text-xs font-semibold text-slate-600">
																										File nguá»“n
																										<input
																											value={
																												task.specialCondition
																													.documentStyleSetConfig
																													?.sourceFile ??
																												"word/styles.xml"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.documentStyleSetConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "documentStyleSet",
																														documentStyleSetConfig:
																															{
																																...currentConfig,
																																sourceFile:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="word/styles.xml"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Style set name
																										<input
																											value={
																												task.specialCondition
																													.documentStyleSetConfig
																													?.styleSetName ?? ""
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.documentStyleSetConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "documentStyleSet",
																														documentStyleSetConfig:
																															{
																																...currentConfig,
																																styleSetName:
																																	e.target
																																		.value,
																															},
																													},
																												);
																											}}
																											placeholder="Lines (Simple)"
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Match policy
																										<select
																											value={
																												task.specialCondition
																													.documentStyleSetConfig
																													?.matchPolicy ?? "all"
																											}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.documentStyleSetConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "documentStyleSet",
																														documentStyleSetConfig:
																															{
																																...currentConfig,
																																matchPolicy: e
																																	.target
																																	.value as XmlMatchPolicy,
																															},
																													},
																												);
																											}}
																											className={inputClass}
																										>
																											<option value="all">
																												Táº¥t cáº£ fragment
																											</option>
																											<option value="any">
																												Báº¥t ká»³ fragment nÃ o
																											</option>
																										</select>
																									</label>
																									<label className="text-xs font-semibold text-slate-600">
																										Thuá»™c tÃ­nh bá» qua
																										<textarea
																											value={(
																												task.specialCondition
																													.documentStyleSetConfig
																													?.ignoreAttributes ??
																												[]
																											).join("\n")}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.documentStyleSetConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "documentStyleSet",
																														documentStyleSetConfig:
																															{
																																...currentConfig,
																																ignoreAttributes:
																																	e.target.value
																																		.split(
																																			/\r?\n/,
																																		)
																																		.map(
																																			(line) =>
																																				line.trim(),
																																		)
																																		.filter(
																																			Boolean,
																																		),
																															},
																													},
																												);
																											}}
																											rows={3}
																											placeholder={"rsid*\nid"}
																											className={inputClass}
																										/>
																									</label>
																									<label className="text-xs font-semibold text-slate-600 md:col-span-2">
																										CÃ¡c fragment yÃªu cáº§u
																										<textarea
																											value={(
																												task.specialCondition
																													.documentStyleSetConfig
																													?.expectedFragments ??
																												[]
																											).join(
																												"\n---FRAGMENT---\n",
																											)}
																											onChange={(e) => {
																												const currentConfig =
																													task.specialCondition
																														?.documentStyleSetConfig ??
																													{};
																												updateTaskSpecialCondition(
																													pi,
																													ti,
																													{
																														...task.specialCondition!,
																														type: "documentStyleSet",
																														documentStyleSetConfig:
																															{
																																...currentConfig,
																																expectedFragments:
																																	e.target.value
																																		.split(
																																			/\n---FRAGMENT---\n/,
																																		)
																																		.map(
																																			(
																																				fragment,
																																			) =>
																																				fragment.trim(),
																																		)
																																		.filter(
																																			Boolean,
																																		),
																															},
																													},
																												);
																											}}
																											rows={8}
																											placeholder="DÃ¡n cÃ¡c Ä‘oáº¡n XML á»•n Ä‘á»‹nh trong word/styles.xml cá»§a file Ä‘Ã¡p Ã¡n Lines (Simple). TÃ¡ch nhiá»u fragment báº±ng dÃ²ng ---FRAGMENT---"
																											className={inputClass}
																										/>
																									</label>
																								</div>
																							</div>
																						)}
																						{task.specialCondition?.type ===
																							"pictureStyle" && (
																							<PictureStyleEditor
																								config={
																									task.specialCondition
																										.pictureStyleConfig
																								}
																								getAccessToken={getAccessToken}
																								onChange={(
																									pictureStyleConfig: PictureStyleConfig,
																								) => {
																									updateTaskSpecialCondition(
																										pi,
																										ti,
																										{
																											...task.specialCondition!,
																											type: "pictureStyle",
																											pictureStyleConfig,
																										},
																									);
																								}}
																							/>
																						)}
																						{task.specialCondition?.type?.startsWith(
																							"excel",
																						) && (
																							<div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
																								{task.specialCondition.type ===
																									"excelTableName" && (
																									<div className="grid gap-3 md:grid-cols-2">
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn worksheet
																											<input
																												value={
																													task.specialCondition
																														.excelTableNameConfig
																														?.worksheetName ??
																													""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelTableNameConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelTableName",
																															excelTableNameConfig:
																																{
																																	...currentConfig,
																																	worksheetName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Rental Rates"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											File nguá»“n
																											<input
																												value={
																													task.specialCondition
																														.excelTableNameConfig
																														?.sourceFile ?? ""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelTableNameConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelTableName",
																															excelTableNameConfig:
																																{
																																	...currentConfig,
																																	sourceFile:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="xl/tables/table1.xml"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn yÃªu cáº§u
																											<input
																												value={
																													task.specialCondition
																														.excelTableNameConfig
																														?.expectedName ?? ""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelTableNameConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelTableName",
																															excelTableNameConfig:
																																{
																																	...currentConfig,
																																	expectedName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Rates"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn ban Ä‘áº§u
																											<input
																												value={
																													task.specialCondition
																														.excelTableNameConfig
																														?.originalName ?? ""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelTableNameConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelTableName",
																															excelTableNameConfig:
																																{
																																	...currentConfig,
																																	originalName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Table1"
																												className={inputClass}
																											/>
																										</label>
																										<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																											<input
																												type="checkbox"
																												checked={
																													task.specialCondition
																														.excelTableNameConfig
																														?.requireOriginalNameAbsent ??
																													true
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelTableNameConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelTableName",
																															excelTableNameConfig:
																																{
																																	...currentConfig,
																																	requireOriginalNameAbsent:
																																		e.target
																																			.checked,
																																},
																														},
																													);
																												}}
																											/>
																											Báº¯t buá»™c khÃ´ng cÃ²n tÃªn ban
																											Ä‘áº§u
																										</label>
																									</div>
																								)}

																								{task.specialCondition.type ===
																									"excelWorksheetPageSetup" && (
																									<div className="grid gap-3 md:grid-cols-3">
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn worksheet
																											<input
																												value={
																													task.specialCondition
																														.excelWorksheetPageSetupConfig
																														?.worksheetName ??
																													""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelWorksheetPageSetupConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelWorksheetPageSetup",
																															excelWorksheetPageSetupConfig:
																																{
																																	...currentConfig,
																																	worksheetName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Rental Rates"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											File nguá»“n
																											<input
																												value={
																													task.specialCondition
																														.excelWorksheetPageSetupConfig
																														?.sourceFile ?? ""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelWorksheetPageSetupConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelWorksheetPageSetup",
																															excelWorksheetPageSetupConfig:
																																{
																																	...currentConfig,
																																	sourceFile:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="xl/worksheets/sheet1.xml"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											HÆ°á»›ng trang
																											<select
																												value={
																													task.specialCondition
																														.excelWorksheetPageSetupConfig
																														?.orientation ??
																													"landscape"
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelWorksheetPageSetupConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelWorksheetPageSetup",
																															excelWorksheetPageSetupConfig:
																																{
																																	...currentConfig,
																																	orientation: e
																																		.target
																																		.value as
																																		| "portrait"
																																		| "landscape",
																																},
																														},
																													);
																												}}
																												className={inputClass}
																											>
																												<option value="landscape">
																													Ngang (Landscape)
																												</option>
																												<option value="portrait">
																													Dá»c (Portrait)
																												</option>
																											</select>
																										</label>
																									</div>
																								)}

																								{task.specialCondition.type ===
																									"excelClearCellFormatting" && (
																									<div className="grid gap-3 md:grid-cols-4">
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn worksheet
																											<input
																												value={
																													task.specialCondition
																														.excelClearCellFormattingConfig
																														?.worksheetName ??
																													""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelClearCellFormattingConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelClearCellFormatting",
																															excelClearCellFormattingConfig:
																																{
																																	...currentConfig,
																																	worksheetName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Rental Rates"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											File nguá»“n
																											<input
																												value={
																													task.specialCondition
																														.excelClearCellFormattingConfig
																														?.sourceFile ?? ""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelClearCellFormattingConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelClearCellFormatting",
																															excelClearCellFormattingConfig:
																																{
																																	...currentConfig,
																																	sourceFile:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="xl/worksheets/sheet1.xml"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											VÃ¹ng Ã´
																											<input
																												value={
																													task.specialCondition
																														.excelClearCellFormattingConfig
																														?.range ?? ""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelClearCellFormattingConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelClearCellFormatting",
																															excelClearCellFormattingConfig:
																																{
																																	...currentConfig,
																																	range:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="A4:D4"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											MÃ£ style máº·c Ä‘á»‹nh
																											<input
																												type="number"
																												min={0}
																												value={
																													task.specialCondition
																														.excelClearCellFormattingConfig
																														?.defaultStyleId ??
																													0
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelClearCellFormattingConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelClearCellFormatting",
																															excelClearCellFormattingConfig:
																																{
																																	...currentConfig,
																																	defaultStyleId:
																																		Number(
																																			e.target
																																				.value,
																																		),
																																},
																														},
																													);
																												}}
																												className={inputClass}
																											/>
																										</label>
																									</div>
																								)}

																								{task.specialCondition.type ===
																									"excelDataModelImport" && (
																									<div className="grid gap-3 md:grid-cols-2">
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn file nguá»“n
																											<input
																												value={
																													task.specialCondition
																														.excelDataModelImportConfig
																														?.sourceFileName ??
																													""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelDataModelImportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelDataModelImport",
																															excelDataModelImportConfig:
																																{
																																	...currentConfig,
																																	sourceFileName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Accessories.csv"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn worksheet yÃªu cáº§u
																											<input
																												value={
																													task.specialCondition
																														.excelDataModelImportConfig
																														?.expectedWorksheetName ??
																													""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelDataModelImportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelDataModelImport",
																															excelDataModelImportConfig:
																																{
																																	...currentConfig,
																																	expectedWorksheetName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Accessories"
																												className={inputClass}
																											/>
																										</label>
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn connection yÃªu cáº§u
																											<input
																												value={
																													task.specialCondition
																														.excelDataModelImportConfig
																														?.expectedConnectionName ??
																													""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelDataModelImportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelDataModelImport",
																															excelDataModelImportConfig:
																																{
																																	...currentConfig,
																																	expectedConnectionName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Accessories"
																												className={inputClass}
																											/>
																										</label>
																										<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																											<input
																												type="checkbox"
																												checked={
																													task.specialCondition
																														.excelDataModelImportConfig
																														?.requireConnection ??
																													true
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelDataModelImportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelDataModelImport",
																															excelDataModelImportConfig:
																																{
																																	...currentConfig,
																																	requireConnection:
																																		e.target
																																			.checked,
																																},
																														},
																													);
																												}}
																											/>
																											Báº¯t buá»™c cÃ³ connection
																										</label>
																										<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																											<input
																												type="checkbox"
																												checked={
																													task.specialCondition
																														.excelDataModelImportConfig
																														?.requireImportedWorksheet ??
																													true
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelDataModelImportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelDataModelImport",
																															excelDataModelImportConfig:
																																{
																																	...currentConfig,
																																	requireImportedWorksheet:
																																		e.target
																																			.checked,
																																},
																														},
																													);
																												}}
																											/>
																											Báº¯t buá»™c cÃ³ worksheet Ä‘Ã£
																											import
																										</label>
																										<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																											<input
																												type="checkbox"
																												checked={
																													task.specialCondition
																														.excelDataModelImportConfig
																														?.requireQueryTable ??
																													true
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelDataModelImportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelDataModelImport",
																															excelDataModelImportConfig:
																																{
																																	...currentConfig,
																																	requireQueryTable:
																																		e.target
																																			.checked,
																																},
																														},
																													);
																												}}
																											/>
																											Báº¯t buá»™c cÃ³ query table
																										</label>
																										<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																											<input
																												type="checkbox"
																												checked={
																													task.specialCondition
																														.excelDataModelImportConfig
																														?.requireDataModel ??
																													true
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelDataModelImportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelDataModelImport",
																															excelDataModelImportConfig:
																																{
																																	...currentConfig,
																																	requireDataModel:
																																		e.target
																																			.checked,
																																},
																														},
																													);
																												}}
																											/>
																											Báº¯t buá»™c cÃ³ Data Model
																										</label>
																									</div>
																								)}

																								{task.specialCondition.type ===
																									"excelCompatibilityReport" && (
																									<div className="grid gap-3 md:grid-cols-2">
																										<label className="text-xs font-semibold text-slate-600">
																											TÃªn worksheet
																											<input
																												value={
																													task.specialCondition
																														.excelCompatibilityReportConfig
																														?.worksheetName ??
																													""
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelCompatibilityReportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelCompatibilityReport",
																															excelCompatibilityReportConfig:
																																{
																																	...currentConfig,
																																	worksheetName:
																																		e.target
																																			.value,
																																},
																														},
																													);
																												}}
																												placeholder="Compatibility Report"
																												className={inputClass}
																											/>
																										</label>
																										<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
																											<input
																												type="checkbox"
																												checked={
																													task.specialCondition
																														.excelCompatibilityReportConfig
																														?.requireNewWorksheet ??
																													true
																												}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelCompatibilityReportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelCompatibilityReport",
																															excelCompatibilityReportConfig:
																																{
																																	...currentConfig,
																																	requireNewWorksheet:
																																		e.target
																																			.checked,
																																},
																														},
																													);
																												}}
																											/>
																											Báº¯t buá»™c cÃ³ worksheet má»›i
																										</label>
																										<label className="text-xs font-semibold text-slate-600 md:col-span-2">
																											CÃ¡c vÄƒn báº£n yÃªu cáº§u
																											<textarea
																												value={(
																													task.specialCondition
																														.excelCompatibilityReportConfig
																														?.expectedTexts ??
																													[]
																												).join("\n")}
																												onChange={(e) => {
																													const currentConfig =
																														task
																															.specialCondition
																															?.excelCompatibilityReportConfig ??
																														{};
																													updateTaskSpecialCondition(
																														pi,
																														ti,
																														{
																															...task.specialCondition!,
																															type: "excelCompatibilityReport",
																															excelCompatibilityReportConfig:
																																{
																																	...currentConfig,
																																	expectedTexts:
																																		e.target.value
																																			.split(
																																				/\r?\n/,
																																			)
																																			.map(
																																				(
																																					line,
																																				) =>
																																					line.trim(),
																																			)
																																			.filter(
																																				Boolean,
																																			),
																																},
																														},
																													);
																												}}
																												rows={4}
																												placeholder={
																													"Compatibility Checker\nSignificant loss of functionality"
																												}
																												className={cx(
																													inputClass,
																													"resize-y",
																												)}
																											/>
																										</label>
																									</div>
																								)}
																								<ExcelProject02SpecialConditionEditor
																									specialCondition={
																										task.specialCondition
																									}
																									inputClass={inputClass}
																									onChange={(
																										specialCondition,
																									) =>
																										updateTaskSpecialCondition(
																											pi,
																											ti,
																											specialCondition,
																										)
																									}
																								/>
																							</div>
																						)}
																					</div>
																					<div className="mt-5">
																						<div className="mb-3 flex items-center justify-between gap-2">
																							<div>
																								<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
																									Äiá»u kiá»‡n
																								</p>
																								<p className="mt-1 text-xs text-slate-400">
																									{task.conditions.length} Ä‘iá»u
																									kiá»‡n cháº¥m Ä‘iá»ƒm
																								</p>
																							</div>
																							<button
																								type="button"
																								onClick={() =>
																									mutateTask(pi, ti, {
																										conditions: [
																											...task.conditions,
																											emptyCondition(),
																										],
																									})
																								}
																								className="inline-flex items-center gap-1.5 rounded-xl bg-m3-primary px-3 py-1.5 text-xs font-semibold text-m3-on-primary hover:bg-m3-primary/90"
																							>
																								<Icon
																									name="add"
																									className="text-sm"
																								/>{" "}
																								ThÃªm Ä‘iá»u kiá»‡n
																							</button>
																						</div>

																						<div className="space-y-3">
																							{task.conditions.map(
																								(condition, ci) => {
																									const conditionKey = `${pi}-${ti}-${ci}`;
																									const advanced =
																										showAdvanced[
																											conditionKey
																										] ?? false;
																									const basicsExpanded =
																										expandedConditionBasics[
																											conditionKey
																										] ?? false;

																									return (
																										<div
																											key={conditionKey}
																											className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface p-4"
																										>
																											<div className="flex items-start justify-between gap-3">
																												<div className="flex min-w-0 items-center gap-2">
																													<span className="rounded-md bg-m3-primary/10 px-2 py-1 font-mono text-[11px] font-bold text-m3-primary">
																														{condition.conditionId ||
																															`C${String(ci + 1).padStart(2, "0")}`}
																													</span>
																													<span className="text-xs text-m3-on-surface-variant">
																														{condition.score}{" "}
																														Ä‘iá»ƒm
																													</span>
																												</div>
																												<button
																													type="button"
																													onClick={() =>
																														mutateTask(pi, ti, {
																															conditions:
																																task.conditions.filter(
																																	(_, i) =>
																																		i !== ci,
																																),
																														})
																													}
																													title="XÃ³a Ä‘iá»u kiá»‡n"
																													className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-m3-on-surface-variant/60 hover:bg-m3-error/10 hover:text-m3-error"
																												>
																													<Icon
																														name="delete"
																														className="text-sm"
																													/>
																												</button>
																											</div>

																											<div className="mt-3 rounded-lg border border-m3-outline-variant/60 bg-m3-surface-container-lowest">
																												<button
																													type="button"
																													onClick={() =>
																														toggleConditionBasics(
																															conditionKey,
																														)
																													}
																													className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
																												>
																													<Icon
																														name="expand_more"
																														className={cx(
																															"text-lg text-m3-on-surface-variant transition-transform duration-200",
																															basicsExpanded &&
																																"rotate-180",
																														)}
																													/>
																													<span className="shrink-0 text-xs font-semibold text-m3-on-surface">
																														ThÃ´ng tin Ä‘iá»u kiá»‡n
																													</span>
																													<span className="min-w-0 truncate font-mono text-[11px] text-m3-on-surface-variant">
																														{condition.conditionId ||
																															`C${String(ci + 1).padStart(2, "0")}`}{" "}
																														Â· {condition.score}{" "}
																														Ä‘iá»ƒm Â·{" "}
																														{condition.sourceFile ||
																															"ChÆ°a chá»n file XML"}
																													</span>
																												</button>

																												{basicsExpanded && (
																													<div className="border-t border-m3-outline-variant/50 px-3 pb-3 pt-1">
																														<div className="grid gap-3 md:grid-cols-[1fr_120px]">
																															<label className="text-xs font-semibold text-slate-600">
																																MÃ£ Ä‘iá»u kiá»‡n
																																<input
																																	value={
																																		condition.conditionId
																																	}
																																	onChange={(
																																		e,
																																	) =>
																																		mutateCondition(
																																			pi,
																																			ti,
																																			ci,
																																			{
																																				conditionId:
																																					e
																																						.target
																																						.value,
																																			},
																																		)
																																	}
																																	className={
																																		inputClass
																																	}
																																/>
																															</label>
																															<label className="text-xs font-semibold text-slate-600">
																																Äiá»ƒm
																																<input
																																	type="number"
																																	value={
																																		condition.score
																																	}
																																	onChange={(
																																		e,
																																	) =>
																																		mutateCondition(
																																			pi,
																																			ti,
																																			ci,
																																			{
																																				score:
																																					Number(
																																						e
																																							.target
																																							.value,
																																					),
																																			},
																																		)
																																	}
																																	className={
																																		inputClass
																																	}
																																/>
																															</label>
																														</div>

																														<label className="mt-3 block text-xs font-semibold text-slate-600">
																															File XML cáº§n kiá»ƒm
																															tra
																															<input
																																value={
																																	condition.sourceFile
																																}
																																onChange={(e) =>
																																	mutateCondition(
																																		pi,
																																		ti,
																																		ci,
																																		{
																																			sourceFile:
																																				e.target
																																					.value,
																																		},
																																	)
																																}
																																placeholder="xl/worksheets/sheet1.xml"
																																className={cx(
																																	inputClass,
																																	"font-mono",
																																)}
																															/>
																														</label>
																													</div>
																												)}
																											</div>

																											<label className="mt-3 block text-xs font-semibold text-slate-600">
																												GiÃ¡ trá»‹ cáº§n tÃ¬m trong
																												XML
																												<textarea
																													value={formatExpectedValuesInput(
																														expectedVariantsForEdit(
																															condition,
																														)[0].expectedValues,
																													)}
																													onChange={(e) => {
																														const variants =
																															expectedVariantsForEdit(
																																condition,
																															);
																														mutateCondition(
																															pi,
																															ti,
																															ci,
																															{
																																expectedVariants:
																																	[
																																		{
																																			expectedValues:
																																				parseExpectedValuesInput(
																																					e
																																						.target
																																						.value,
																																				),
																																		},
																																		...variants.slice(
																																			1,
																																		),
																																	],
																															},
																														);
																													}}
																													rows={3}
																													placeholder="Mot cum XML lien nhau la 1 gia tri. Cach nhau bang 1 dong trong de them gia tri khac..."
																													className={cx(
																														inputClass,
																														"resize-y font-mono",
																													)}
																												/>
																											</label>

																											<div className="mt-3 rounded-lg border border-blue-100 bg-white/70 p-3">
																												<div className="mb-2 flex items-center justify-between gap-3">
																													<span className="text-xs font-semibold text-slate-600">
																														CÃ¡c biáº¿n thá»ƒ dá»± kiáº¿n
																													</span>
																													<button
																														type="button"
																														onClick={() => {
																															const variants =
																																expectedVariantsForEdit(
																																	condition,
																																);
																															mutateCondition(
																																pi,
																																ti,
																																ci,
																																{
																																	expectedVariants:
																																		[
																																			...variants,
																																			{
																																				expectedValues:
																																					[""],
																																			},
																																		],
																																},
																															);
																														}}
																														className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
																													>
																														<Icon
																															name="add"
																															className="text-sm"
																														/>{" "}
																														ThÃªm biáº¿n thá»ƒ
																													</button>
																												</div>

																												<div className="space-y-3">
																													{expectedVariantsForEdit(
																														condition,
																													)
																														.slice(1)
																														.map(
																															(
																																variant,
																																sliceIndex,
																															) => {
																																const variantIndex =
																																	sliceIndex +
																																	1;
																																return (
																																	<div
																																		key={
																																			variantIndex
																																		}
																																		className="rounded-lg border border-slate-200 bg-slate-50 p-3"
																																	>
																																		<div className="mb-2 flex items-center justify-between gap-3">
																																			<span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
																																				Variant{" "}
																																				{variantIndex +
																																					1}
																																			</span>
																																			<button
																																				type="button"
																																				onClick={() => {
																																					const variants =
																																						expectedVariantsForEdit(
																																							condition,
																																						);
																																					mutateCondition(
																																						pi,
																																						ti,
																																						ci,
																																						{
																																							expectedVariants:
																																								variants.filter(
																																									(
																																										_,
																																										index,
																																									) =>
																																										index !==
																																										variantIndex,
																																								),
																																						},
																																					);
																																				}}
																																				title="Xoa variant"
																																				className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
																																			>
																																				<Icon
																																					name="delete"
																																					className="text-sm"
																																				/>
																																			</button>
																																		</div>
																																		<textarea
																																			value={formatExpectedValuesInput(
																																				variant.expectedValues,
																																			)}
																																			onChange={(
																																				e,
																																			) => {
																																				const variants =
																																					expectedVariantsForEdit(
																																						condition,
																																					).map(
																																						(
																																							item,
																																							index,
																																						) =>
																																							index ===
																																							variantIndex
																																								? {
																																										expectedValues:
																																											parseExpectedValuesInput(
																																												e
																																													.target
																																													.value,
																																											),
																																									}
																																								: item,
																																					);
																																				mutateCondition(
																																					pi,
																																					ti,
																																					ci,
																																					{
																																						expectedVariants:
																																							variants,
																																					},
																																				);
																																			}}
																																			rows={3}
																																			placeholder="Mot cum XML lien nhau la 1 gia tri. Cach nhau bang 1 dong trong de them gia tri khac..."
																																			className={cx(
																																				inputClass,
																																				"resize-y font-mono",
																																			)}
																																		/>
																																	</div>
																																);
																															},
																														)}
																												</div>
																											</div>

																											<div className="mt-3 grid gap-3 md:grid-cols-2">
																												<label className="text-xs font-semibold text-slate-600">
																													CÃ¡ch so khá»›p
																													<select
																														value={
																															condition.compareMode
																														}
																														onChange={(e) =>
																															mutateCondition(
																																pi,
																																ti,
																																ci,
																																{
																																	compareMode: e
																																		.target
																																		.value as XmlCompareMode,
																																},
																															)
																														}
																														className={
																															inputClass
																														}
																													>
																														{compareModes.map(
																															(m) => (
																																<option
																																	key={m}
																																	value={m}
																																>
																																	{
																																		compareModesLabels[
																																			m
																																		]
																																	}
																																</option>
																															),
																														)}
																													</select>
																												</label>
																												<label className="text-xs font-semibold text-slate-600">
																													Quy táº¯c nhiá»u giÃ¡ trá»‹
																													<select
																														value={
																															condition.matchPolicy
																														}
																														onChange={(e) =>
																															mutateCondition(
																																pi,
																																ti,
																																ci,
																																{
																																	matchPolicy: e
																																		.target
																																		.value as XmlMatchPolicy,
																																},
																															)
																														}
																														className={
																															inputClass
																														}
																													>
																														{matchPolicies.map(
																															(m) => (
																																<option
																																	key={m}
																																	value={m}
																																>
																																	{
																																		matchPoliciesLabels[
																																			m
																																		]
																																	}
																																</option>
																															),
																														)}
																													</select>
																												</label>
																											</div>

																											<button
																												type="button"
																												onClick={() =>
																													toggleAdvanced(
																														conditionKey,
																													)
																												}
																												className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700"
																											>
																												{advanced
																													? "â–² áº¨n cÃ i Ä‘áº·t nÃ¢ng cao"
																													: "â–¼ CÃ i Ä‘áº·t nÃ¢ng cao"}
																											</button>

																											{advanced && (
																												<div className="mt-3 rounded-xl bg-m3-surface-container p-3.5 shadow-xs text-m3-on-surface">
																													<div className="grid gap-3 md:grid-cols-2">
																														<label className="text-xs font-semibold text-slate-600">
																															ThÃ´ng bÃ¡o khi Ä‘Ãºng
																															<input
																																value={
																																	condition
																																		.feedback
																																		?.successDetail ||
																																	""
																																}
																																onChange={(e) =>
																																	mutateCondition(
																																		pi,
																																		ti,
																																		ci,
																																		{
																																			feedback:
																																				{
																																					...(condition.feedback ||
																																						{}),
																																					successDetail:
																																						e
																																							.target
																																							.value,
																																				},
																																		},
																																	)
																																}
																																placeholder="ThÃ nh cÃ´ng..."
																																className={
																																	inputClass
																																}
																															/>
																														</label>
																														<label className="text-xs font-semibold text-slate-600">
																															ThÃ´ng bÃ¡o khi sai
																															<input
																																value={
																																	condition
																																		.feedback
																																		?.errorMessage ||
																																	""
																																}
																																onChange={(e) =>
																																	mutateCondition(
																																		pi,
																																		ti,
																																		ci,
																																		{
																																			feedback:
																																				{
																																					...(condition.feedback ||
																																						{}),
																																					errorMessage:
																																						e
																																							.target
																																							.value,
																																				},
																																		},
																																	)
																																}
																																placeholder="Lá»—i..."
																																className={
																																	inputClass
																																}
																															/>
																														</label>
																													</div>
																													<label className="mt-3 block text-xs font-semibold text-slate-600">
																														Gá»£i Ã½ cÃ¡ch sá»­a
																														<input
																															value={
																																condition
																																	.feedback
																																	?.fixAction ||
																																""
																															}
																															onChange={(e) =>
																																mutateCondition(
																																	pi,
																																	ti,
																																	ci,
																																	{
																																		feedback: {
																																			...(condition.feedback ||
																																				{}),
																																			fixAction:
																																				e.target
																																					.value,
																																		},
																																	},
																																)
																															}
																															placeholder="VÃ­ dá»¥: Kiá»ƒm tra láº¡i Ä‘á»‹nh dáº¡ng Ã´..."
																															className={
																																inputClass
																															}
																														/>
																													</label>
																													<label className="mt-3 block text-xs font-semibold text-slate-600">
																														Bá» qua cÃ¡c thuá»™c
																														tÃ­nh
																														<textarea
																															value={(
																																condition.ignoreAttributes ??
																																[]
																															).join("\n")}
																															onChange={(e) =>
																																mutateCondition(
																																	pi,
																																	ti,
																																	ci,
																																	{
																																		ignoreAttributes:
																																			e.target.value.split(
																																				"\n",
																																			),
																																	},
																																)
																															}
																															rows={3}
																															placeholder={
																																"id\nr:id\nrsid*\nwp:docPr@id"
																															}
																															className={cx(
																																inputClass,
																																"resize-y font-mono",
																															)}
																														/>
																													</label>
																													{condition.compareMode ===
																														"xmlMinOccurrences" && (
																														<div className="mt-3 grid gap-3 md:grid-cols-2">
																															<label className="block text-xs font-semibold text-slate-600">
																																Sá»‘ láº§n xuáº¥t hiá»‡n
																																tá»‘i thiá»ƒu
																																<input
																																	type="number"
																																	min={1}
																																	step={1}
																																	value={
																																		condition.minOccurrences ??
																																		""
																																	}
																																	onChange={(
																																		e,
																																	) =>
																																		mutateCondition(
																																			pi,
																																			ti,
																																			ci,
																																			{
																																				minOccurrences:
																																					e
																																						.target
																																						.value
																																						? Number(
																																								e
																																									.target
																																									.value,
																																							)
																																						: undefined,
																																			},
																																		)
																																	}
																																	placeholder="1"
																																	className={
																																		inputClass
																																	}
																																/>
																															</label>
																															<label className="block text-xs font-semibold text-slate-600">
																																Sá»‘ láº§n xuáº¥t hiá»‡n
																																tá»‘i Ä‘a
																																<input
																																	type="number"
																																	min={1}
																																	step={1}
																																	value={
																																		condition.maxOccurrences ??
																																		""
																																	}
																																	onChange={(
																																		e,
																																	) =>
																																		mutateCondition(
																																			pi,
																																			ti,
																																			ci,
																																			{
																																				maxOccurrences:
																																					e
																																						.target
																																						.value
																																						? Number(
																																								e
																																									.target
																																									.value,
																																							)
																																						: undefined,
																																			},
																																		)
																																	}
																																	placeholder="Äá»ƒ trá»‘ng náº¿u khÃ´ng giá»›i háº¡n"
																																	className={
																																		inputClass
																																	}
																																/>
																															</label>
																														</div>
																													)}
																													<label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
																														<input
																															type="checkbox"
																															checked={
																																condition.stopTaskIfFailed
																															}
																															onChange={(e) =>
																																mutateCondition(
																																	pi,
																																	ti,
																																	ci,
																																	{
																																		stopTaskIfFailed:
																																			e.target
																																				.checked,
																																	},
																																)
																															}
																															className="h-4 w-4 accent-blue-600"
																														/>
																														Dá»«ng Task náº¿u Ä‘iá»u
																														kiá»‡n tháº¥t báº¡i
																													</label>
																												</div>
																											)}
																										</div>
																									);
																								},
																							)}

																							{task.conditions.length === 0 && (
																								<div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center">
																									<p className="text-sm font-medium text-slate-500">
																										{task.specialCondition
																											? "KhÃ´ng cÃ³ Ä‘iá»u kiá»‡n XML â€” Task chá»‰ dÃ¹ng Ä‘iá»u kiá»‡n Ä‘áº·c biá»‡t."
																											: "ChÆ°a cÃ³ Ä‘iá»u kiá»‡n"}
																									</p>
																									<p className="mt-1 text-xs text-slate-400">
																										{task.specialCondition
																											? "Há»£p lá»‡ náº¿u Ä‘iá»ƒm Äiá»u kiá»‡n Ä‘áº·c biá»‡t báº±ng Äiá»ƒm tá»‘i Ä‘a cá»§a Task."
																											: "ThÃªm condition hoáº·c báº­t Äiá»u kiá»‡n Ä‘áº·c biá»‡t Ä‘á»ƒ ruleset cÃ³ thá»ƒ cháº¥m Task nÃ y."}
																									</p>
																								</div>
																							)}
																						</div>
																					</div>
																				</div>
																			)}
																		</div>
																	);
																})}

																{project.tasks.length === 0 && (
																	<div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
																		<p className="text-sm font-medium text-slate-500">
																			Project chÆ°a cÃ³ Task
																		</p>
																		<button
																			type="button"
																			onClick={() =>
																				mutateProject(pi, {
																					tasks: [emptyTask()],
																				})
																			}
																			className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
																		>
																			+ ThÃªm Task Ä‘áº§u tiÃªn
																		</button>
																	</div>
																)}
															</div>
														</div>
													</div>
												)}
											</div>
										);
									})}

									{selected.projects.length === 0 && (
										<div className="rounded-2xl border border-dashed border-m3-outline-variant/60 px-6 py-12 text-center bg-m3-surface">
											<Icon
												name="code"
												className="mx-auto mb-3 text-4xl text-m3-on-surface-variant/40"
											/>
											<p className="font-semibold text-m3-on-surface">
												ChÆ°a cÃ³ Project
											</p>
											<p className="mt-1 text-sm text-m3-on-surface-variant">
												Táº¡o project Ä‘áº§u tiÃªn Ä‘á»ƒ xÃ¢y ruleset.
											</p>
											<button
												type="button"
												onClick={() =>
													replaceSelected({
														...selected,
														projects: [emptyProject()],
													})
												}
												className="mt-4 inline-flex items-center gap-2 rounded-xl bg-m3-primary px-3.5 py-2 text-sm font-semibold text-m3-on-primary hover:bg-m3-primary/90"
											>
												<Icon name="add" className="text-base" /> ThÃªm project
											</button>
										</div>
									)}
								</div>
							</section>
						</>
					)}

					{/* Validation tab */}
					{activeTab === "validation" && (
						<section className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-5 shadow-xs">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<h3 className="text-sm font-bold text-m3-on-surface">
										Validation
									</h3>
									<p className="mt-1 text-xs text-m3-on-surface-variant">
										Kiá»ƒm tra cáº¥u trÃºc ruleset trÆ°á»›c khi báº­t Active.
									</p>
								</div>
								<button
									type="button"
									onClick={validateRuleSet}
									className="inline-flex items-center gap-2 rounded-xl bg-m3-primary px-3.5 py-2 text-sm font-semibold text-m3-on-primary hover:bg-m3-primary/90"
								>
									<Icon name="check_circle" className="text-base" /> Cháº¡y
									Validate
								</button>
							</div>

							{!validation && (
								<div className="mt-5 rounded-2xl border border-dashed border-m3-outline-variant/60 bg-m3-surface px-6 py-10 text-center">
									<Icon
										name="check_circle"
										className="mx-auto mb-2 text-3xl text-m3-on-surface-variant/40"
									/>
									<p className="text-sm font-medium text-m3-on-surface">
										ChÆ°a cháº¡y validation
									</p>
									<p className="mt-1 text-xs text-m3-on-surface-variant">
										NÃªn Validate trÆ°á»›c khi báº­t Active.
									</p>
								</div>
							)}

							{validation && (
								<div className="mt-5 space-y-3">
									<div
										className={cx(
											"flex items-center gap-3 rounded-xl border p-4",
											validation.isValid
												? "border-emerald-200 bg-emerald-50"
												: "border-red-200 bg-red-50",
										)}
									>
										{validation.isValid ? (
											<Icon
												name="check_circle"
												className="text-emerald-600 text-2xl"
											/>
										) : (
											<Icon name="cancel" className="text-m3-error text-2xl" />
										)}
										<div>
											<p
												className={cx(
													"text-sm font-bold",
													validation.isValid
														? "text-emerald-800"
														: "text-m3-error",
												)}
											>
												{validation.isValid
													? "Ruleset há»£p lá»‡"
													: "Ruleset cÃ³ lá»—i"}
											</p>
											<p className="text-xs text-m3-on-surface-variant">
												{validation.errors?.length || 0} lá»—i Â·{" "}
												{validation.warnings?.length || 0} cáº£nh bÃ¡o
											</p>
										</div>
									</div>

									{(validation.errors || []).length > 0 && (
										<div className="rounded-2xl border border-m3-error/20 bg-m3-surface overflow-hidden">
											<div className="border-b border-m3-error/10 bg-m3-error-container/40 px-4 py-3 text-xs font-bold text-m3-on-error-container">
												Lá»—i cáº§n sá»­a
											</div>
											<div className="divide-y divide-m3-outline-variant/40">
												{(validation.errors || []).map((err) => (
													<div
														key={err}
														className="flex gap-3 px-4 py-3 text-xs text-m3-error"
													>
														<Icon
															name="cancel"
															className="text-sm mt-0.5 shrink-0"
														/>
														<span>{err}</span>
													</div>
												))}
											</div>
										</div>
									)}

									{(validation.warnings || []).length > 0 && (
										<div className="rounded-2xl border border-amber-200/60 bg-m3-surface overflow-hidden">
											<div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
												Cáº£nh bÃ¡o
											</div>
											<div className="divide-y divide-m3-outline-variant/40">
												{(validation.warnings || []).map((warning) => (
													<div
														key={warning}
														className="flex gap-3 px-4 py-3 text-xs text-amber-700"
													>
														<Icon
															name="warning"
															className="text-sm mt-0.5 shrink-0"
														/>
														<span>{warning}</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</section>
					)}

					{/* Test tab */}
					{activeTab === "test" && (
						<section className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-5 shadow-xs">
							<div className="mb-5 flex items-start justify-between gap-3">
								<div>
									<div className="flex items-center gap-2">
										<div className="rounded-xl bg-m3-surface p-2 text-m3-on-surface">
											<Icon name="code" className="text-lg" />
										</div>
										<h3 className="text-sm font-bold text-m3-on-surface">
											Test cháº¥m XML
										</h3>
									</div>
									<p className="mt-1 text-xs text-m3-on-surface-variant">
										Chá»n project vÃ  file Office Ä‘á»ƒ kiá»ƒm tra káº¿t quáº£ cháº¥m trÆ°á»›c
										khi Ä‘Æ°a ruleset vÃ o sá»­ dá»¥ng.
									</p>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
								<label className="text-xs font-semibold text-slate-600">
									Project
									<select
										value={gradeProjectCode}
										onChange={(e) => setGradeProjectCode(e.target.value)}
										disabled={isTestGrading}
										className={inputClass}
									>
										<option value="">Chá»n project</option>
										{selected.projects.map((p) => (
											<option key={p.projectCode} value={p.projectCode}>
												{p.projectName || p.projectCode}
											</option>
										))}
									</select>
								</label>

								<label className="text-xs font-semibold text-slate-600">
									File bÃ i lÃ m
									<input
										type="file"
										accept=".xlsx,.xlsm,.docx"
										onChange={(e) => setGradeFile(e.target.files?.[0] || null)}
										disabled={isTestGrading}
										className="mt-1 block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold"
									/>
								</label>

								<button
									type="button"
									onClick={gradeWithXmlRules}
									disabled={isTestGrading}
									className={cx(
										"inline-flex items-center justify-center gap-2 rounded-xl bg-m3-primary px-4 py-2 text-sm font-semibold text-m3-on-primary hover:bg-m3-primary/90",
										isTestGrading && "cursor-wait opacity-70",
									)}
								>
									{isTestGrading ? (
										<>
											<Icon name="refresh" className="animate-spin text-base" />{" "}
											Dang cham...
										</>
									) : (
										<>
											<Icon name="upload" className="text-base" /> Cháº¥m thá»­
										</>
									)}
								</button>
							</div>

							{isTestGrading && (
								<div className="mt-4 flex items-center gap-2 rounded-2xl border border-m3-primary/20 bg-m3-primary/10 px-4 py-3 text-xs font-semibold text-m3-primary">
									<Icon name="refresh" className="animate-spin text-base" />
									<span>Dang cham file, vui long cho...</span>
								</div>
							)}

							{renderGradeResult()}
						</section>
					)}

					{saveError && (
						<div className="rounded-2xl border border-m3-error/20 bg-m3-error-container/20 px-4 py-3 text-xs text-m3-on-error-container shadow-xs">
							<div className="flex items-start gap-2">
								<Icon
									name="cancel"
									className="mt-0.5 shrink-0 text-base text-m3-error"
								/>
								<div className="min-w-0">
									<p className="font-bold">KhÃ´ng thá»ƒ lÆ°u ruleset</p>
									<p className="mt-0.5">{saveError}</p>
								</div>
								<button
									type="button"
									onClick={() => setSaveError("")}
									className="ml-auto shrink-0 text-m3-on-error-container/60 hover:text-m3-error"
									title="ÄÃ³ng"
								>
									<Icon name="close" className="text-base" />
								</button>
							</div>
						</div>
					)}

					<div className="flex items-center gap-2 rounded-2xl border border-amber-200/60 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
						<Icon
							name="warning"
							className="shrink-0 text-base text-amber-600"
						/>
						<span>
							HÃ£y cháº¡y <strong>Validate</strong> Ä‘áº§y Ä‘á»§ trÆ°á»›c khi báº­t{" "}
							<strong>Active</strong>.
						</span>
					</div>

					{/* Sticky action bar: Save ngay táº¡i vá»‹ trÃ­ Ä‘ang nháº­p, khÃ´ng cáº§n cuá»™n vá» Ä‘áº§u trang. */}
					<div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-m3-outline-variant/60 bg-m3-surface/90 px-4 py-3.5 shadow-xl backdrop-blur-xl p-4">
						<div className="flex min-w-0 items-center gap-2 text-xs text-m3-on-surface-variant ">
							<span
								className={cx(
									"h-2 w-2 shrink-0 rounded-full",
									saving
										? "animate-pulse bg-m3-primary"
										: saveError
											? "bg-m3-error"
											: "bg-emerald-500",
								)}
							/>
							<span className="truncate">
								{saving
									? "Äang lÆ°u thay Ä‘á»•i..."
									: saveError
										? "CÃ³ lá»—i cáº§n kiá»ƒm tra"
										: selected.id
											? "ÄÃ£ táº£i ruleset Â· sáºµn sÃ ng lÆ°u"
											: "Ruleset má»›i Â· chÆ°a lÆ°u"}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={validateRuleSet}
								disabled={saving}
								className="inline-flex items-center gap-2 rounded-xl border border-m3-outline-variant bg-m3-surface-container px-3.5 py-2.5 text-sm font-bold text-m3-primary transition hover:bg-m3-surface-container-high disabled:opacity-50"
							>
								<Icon name="check_circle" className="text-base " /> Validate
							</button>
							<button
								type="button"
								onMouseDown={(e) => e.preventDefault()}
								onClick={saveRuleSet}
								disabled={saving}
								className="inline-flex items-center gap-2 rounded-xl bg-m3-primary px-4 py-2.5 text-sm font-bold text-m3-on-primary shadow-sm transition hover:bg-m3-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<Icon
									name="save"
									className={cx("text-base", saving && "animate-pulse")}
								/>
								{saving ? "Äang lÆ°u..." : "LÆ°u thay Ä‘á»•i"}
							</button>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default XmlGradingRulesPage;



