import type {
	SpecialConditionType,
	XmlCompareMode,
	XmlMatchPolicy,
} from "../../../types/xml-grading-rules.types";

export const compareModes: XmlCompareMode[] = [
	"xmlContainsNormalized",
	"xmlContains",
	"xmlMinOccurrences",
	"xmlEquivalentWholeFile",
	"exactStringContains",
];

export const matchPolicies: XmlMatchPolicy[] = ["all", "any", "ordered"];

export const compareModesLabels: Record<XmlCompareMode, string> = {
	xmlContainsNormalized: "Tìm XML, bỏ qua khác biệt về khoảng trắng và format",
	xmlContains: "Tìm đúng đoạn XML đã nhập, chỉ bỏ khoảng trắng đầu và cuối",
	xmlMinOccurrences: "Đếm số lần xuất hiện tối thiểu sau khi chuẩn hóa XML",
	xmlEquivalentWholeFile:
		"Đọc XML và so sánh toàn bộ cấu trúc, không phụ thuộc format",
	exactStringContains:
		"Tìm đúng chuỗi ký tự, không thay đổi hoặc chuẩn hóa nội dung",
};

export const matchPoliciesLabels: Record<XmlMatchPolicy, string> = {
	all: "Tất cả điều kiện",
	any: "Bất kỳ điều kiện nào",
	ordered: "Theo thứ tự",
};

export const wordBulletCharacterOptions = [
	{ value: "•", label: "•  Bullet tròn đặc" },
	{ value: "○", label: "○  Bullet tròn rỗng" },
	{ value: "■", label: "■  Bullet vuông đặc" },
	{ value: "□", label: "□  Bullet vuông rỗng" },
	{ value: "◆", label: "◆  Bullet kim cương đặc" },
	{ value: "◇", label: "◇  Bullet kim cương rỗng" },
	{ value: "➢", label: "➢  Mũi tên" },
	{ value: "➤", label: "➤  Mũi tên đặc" },
	{ value: "✓", label: "✓  Dấu tích" },
	{ value: "✔", label: "✔  Dấu tích đậm" },
	{ value: "★", label: "★  Ngôi sao đặc" },
	{ value: "➔", label: "➔  Mũi tên phải" },
];

export const excelTextRotationPresets = [
	{ value: 45, label: "Angle Counterclockwise - 45" },
	{ value: 135, label: "Angle Clockwise - 135" },
	{ value: 90, label: "Rotate Text Up - 90" },
	{ value: 180, label: "Rotate Text Down - 180" },
	{ value: 255, label: "Vertical Text - 255" },
];

export const selectedExcelTextRotationPreset = (values?: number[]) => {
	if (values?.length !== 1) {
		return "custom";
	}

	return excelTextRotationPresets.some((preset) => preset.value === values[0])
		? String(values[0])
		: "custom";
};

export const excelColumnReferencePattern = /^[A-Za-z]{1,3}$/;

export interface SpecialConditionOption {
	value: SpecialConditionType;
	label: string;
	description: string;
	subjects?: string[];
}

export interface SpecialConditionOptionGroup {
	label: string;
	options: SpecialConditionOption[];
}

export const specialConditionOptions: SpecialConditionOption[] = [
	{
		value: "pictureBullet",
		label: "Dấu đầu dòng bằng hình ảnh",
		description:
			"Kiểm tra paragraph có sử dụng đúng hình ảnh làm dấu đầu dòng hay không.",
	},
	{
		value: "insertedImage",
		label: "Chèn đúng hình ảnh vào tài liệu",
		description:
			"Kiểm tra tài liệu có chèn đúng file ảnh yêu cầu (so khớp theo nội dung ảnh) và đúng chế độ ngắt dòng văn bản (Tight/Square/Through/Top and Bottom/Inline...) hay không.",
	},
	{
		value: "convertTableToText",
		label: "Chuyển bảng thành văn bản",
		description:
			"Kiểm tra bảng Word đã được chuyển thành các dòng văn bản và tách cột bằng tab.",
	},
	{
		value: "hyperlink",
		label: "Siêu liên kết Word",
		description:
			"Kiểm tra văn bản hiển thị và URL của siêu liên kết trong Word.",
	},
	{
		value: "sectionBreakBeforeText",
		label: "Ngắt phần trước văn bản",
		description:
			"Kiểm tra ngắt phần đúng loại nằm ngay trước đoạn văn bản mục tiêu trong Word.",
	},
	{
		value: "wordColumns",
		label: "Chia cột",
		description:
			"Kiểm tra số cột từ đoạn đầu đến hết đoạn cuối, không chia lấn ra ngoài phạm vi.",
	},
	{
		value: "wordMoveSmartArt",
		label: "Di chuyển SmartArt (Cut/Paste)",
		description:
			"Nhận diện bằng văn bản node, kiểm tra vị trí đích và bản sao SmartArt trong thân tài liệu.",
	},
	{
		value: "wordMoveText",
		label: "Di chuyển văn bản (Cut/Paste)",
		description:
			"Kiểm tra vị trí mới, bản sao còn lại và style đầu ra sau Paste.",
	},
	{
		value: "pictureStyle",
		label: "Kiểu ảnh Word",
		description:
			"Kiểm tra ảnh mục tiêu có viền/kiểu ảnh đúng theo XML DrawingML trong Word.",
	},
	{
		value: "textBoxContainsText",
		label: "Hộp văn bản chứa đúng nội dung",
		description:
			"Kiểm tra đoạn văn đã được đưa vào hộp văn bản, nội dung đúng đầy đủ và có thể bắt lỗi copy thay vì cut hoặc paste không mặc định.",
	},
	{
		value: "pageMargins",
		label: "Lề trang Word",
		description:
			"Kiểm tra lề trên/dưới/trái/phải của tài liệu Word. Có thể nhập inch hoặc cm.",
	},
	{
		value: "documentStyleSet",
		label: "Bộ kiểu tài liệu Word",
		description:
			"Kiểm tra style set của Word bằng các dấu hiệu XML ổn định trong word/styles.xml.",
	},
	{
		value: "pageBorder",
		label: "Đường viền trang Word",
		description:
			"Kiểm tra Page Border của Word: 4 cạnh Box, kiểu nét, màu và độ dày viền.",
	},
	{
		value: "wordTableSort",
		label: "Sắp xếp bảng Word",
		description:
			"Kiểm tra bảng Word đã được sắp xếp đúng theo một cột, ví dụ Flavor A-Z trong Project 03.",
	},
	{
		value: "wordParagraphList",
		label: "Danh sách Word",
		description:
			"Kiểm tra các đoạn văn đã được chuyển thành bullet/number list đúng item, level và numbering.",
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
		label: "Đánh dấu giải quyết comment Word",
		description:
			"Kiểm tra các comment trong tài liệu đã được đánh dấu resolved/done.",
	},
	{
		value: "wordCommentReply",
		label: "Phản hồi comment Word",
		description:
			"Kiểm tra comment trong tài liệu đã có phản hồi đúng nội dung yêu cầu.",
	},
	{
		value: "wordDocumentInspector",
		label: "Document Inspector Word",
		description:
			"Kiểm tra tài liệu đã được dọn dẹp header, footer, watermark hoặc metadata theo yêu cầu Document Inspector.",
	},
	{
		value: "wordParagraphStyle",
		label: "Kiểu đoạn văn Word",
		description:
			"Kiểm tra đoạn văn chứa nội dung mục tiêu đã áp dụng đúng style, ví dụ Heading, Quote hoặc Normal.",
	},
	{
		value: "wordTableAutoFit",
		label: "Tự động căn chỉnh bảng Word",
		description:
			'Kiểm tra chiều rộng từng cột bảng Word theo inch decimal. JSON mẫu: { "sourceFile": "word/document.xml", "tableIndex": 1, "expectedColumnWidthsInches": [1.5, 3.25], "toleranceInches": 0.05 }.',
	},
	{
		value: "wordViewSetting",
		label: "Thiết lập hiển thị Word",
		description:
			"Kiểm tra các thiết lập hiển thị được lưu trong word/settings.xml khi tệp Word có lưu thông tin này.",
	},
	{
		value: "wordEndnote",
		label: "Endnote Word",
		description:
			"Kiểm tra endnote gắn tại đoạn văn bản yêu cầu, nội dung endnote và định dạng đánh số.",
	},
	{
		value: "wordSmartArt",
		label: "SmartArt Word",
		description:
			"Kiểm tra SmartArt trong Word: màu, số node/shape, nội dung và vị trí tương đối trong tài liệu.",
	},
	{
		value: "wordSmartArtColors",
		label: "Đổi màu SmartArt (Change Colors)",
		description:
			"Kiểm tra riêng kiểu màu SmartArt, không kiểm tra nội dung, số hình hoặc vị trí.",
	},
	{
		value: "wordDocumentProperty",
		label: "Thuộc tính tài liệu Word",
		description:
			"Kiểm tra thuộc tính Status hoặc thuộc tính core/custom của tài liệu Word.",
	},
	{
		value: "wordInsertSymbol",
		label: "Chèn ký hiệu Word",
		description:
			"Kiểm tra ký hiệu Unicode hoặc Symbol xuất hiện sau văn bản mục tiêu.",
	},
	{
		value: "wordFontFormat",
		label: "Hiệu ứng phông chữ Word",
		description:
			"Kiểm tra Small Caps hoặc hiệu ứng run formatting trên nhiều tiêu đề.",
	},
	{
		value: "wordTrackChanges",
		label: "Theo dõi thay đổi Word",
		description: "Kiểm tra Track Changes và khóa chỉnh sửa tracked changes.",
	},
	{
		value: "wordInsertComment",
		label: "Chèn bình luận Word",
		description:
			"Kiểm tra comment có nội dung và được neo vào văn bản mục tiêu.",
	},
	{
		value: "excelTableName",
		label: "Tên bảng Excel",
		description:
			"Kiểm tra table trong Excel đã được đổi đúng tên, có thể giới hạn theo worksheet.",
		subjects: ["excel"],
	},
	{
		value: "excelWorksheetPageSetup",
		label: "Thiết lập trang Excel",
		description:
			"Kiểm tra thiết lập trang tính Excel, hiện hỗ trợ orientation portrait/landscape.",
		subjects: ["excel"],
	},
	{
		value: "excelClearCellFormatting",
		label: "Xóa định dạng ô Excel",
		description:
			"Kiểm tra một vùng ô trên worksheet đã được xóa định dạng về style mặc định.",
		subjects: ["excel"],
	},
	{
		value: "excelDataModelImport",
		label: "Nhập Data Model Excel",
		description:
			"Kiểm tra workbook có connection import từ file nguồn và dấu hiệu Data Model.",
		subjects: ["excel"],
	},
	{
		value: "excelCompatibilityReport",
		label: "Báo cáo tương thích Excel",
		description:
			"Kiểm tra workbook có worksheet/văn bản kết quả Compatibility Checker.",
		subjects: ["excel"],
	},
	{
		value: "excelMergedRange",
		label: "Gộp ô Excel",
		description:
			"Kiểm tra một vùng ô trên worksheet đã được gộp đúng, ví dụ A1:E1.",
		subjects: ["excel"],
	},
	{
		value: "excelCellHyperlink",
		label: "Siêu liên kết ô Excel",
		description:
			"Kiểm tra siêu liên kết nội bộ hoặc liên kết ngoài tại một ô Excel cụ thể.",
		subjects: ["excel"],
	},
	{
		value: "excelIconSetConditionalFormatting",
		label: "Định dạng có điều kiện Icon Set",
		description:
			"Kiểm tra vùng ô có Conditional Formatting dạng Icon Set đúng loại, ví dụ 3Flags.",
		subjects: ["excel"],
	},
	{
		value: "excelChartDataRange",
		label: "Vùng dữ liệu biểu đồ Excel",
		description:
			"Kiểm tra biểu đồ đã mở rộng đúng vùng category/value và số điểm dữ liệu.",
		subjects: ["excel"],
	},
	{
		value: "excelChartStyle",
		label: "Kiểu biểu đồ Excel",
		description:
			"Kiểm tra mã chart style trong xl/charts/style*.xml, ví dụ Style 4 thường là id 204.",
		subjects: ["excel"],
	},
	{
		value: "excelTextReplacement",
		label: "Thay thế văn bản Excel",
		description:
			"Kiểm tra đã thay toàn bộ một từ/cụm từ cũ bằng từ/cụm từ mới trong workbook.",
		subjects: ["excel"],
	},
	{
		value: "excelPrintTitles",
		label: "Tiêu đề in Excel",
		description:
			"Kiểm tra worksheet đã lặp lại đúng các hàng tiêu đề/logo khi in.",
		subjects: ["excel"],
	},
	{
		value: "excelNumberFormat",
		label: "Định dạng số Excel",
		description:
			"Kiểm tra các ô dữ liệu số trong vùng/cột đã dùng định dạng Number.",
		subjects: ["excel"],
	},
	{
		value: "excelChartLegend",
		label: "Vị trí chú giải biểu đồ",
		description: "Kiểm tra vị trí chú giải của biểu đồ, ví dụ Top.",
		subjects: ["excel"],
	},
	{
		value: "excelDefinedName",
		label: "Named range Excel",
		description:
			"Kiểm tra named range có đúng tên và trỏ đúng các vùng ô yêu cầu, kể cả vùng không liền kề.",
		subjects: ["excel"],
	},
	{
		value: "excelFormulaReferences",
		label: "Công thức dùng named range",
		description:
			"Kiểm tra ô có công thức dùng đủ các named range bắt buộc và không tham chiếu trực tiếp ô/vùng khi cần bắt chặt.",
		subjects: ["excel"],
	},
	{
		value: "excelNoConditionalFormatting",
		label: "Xóa Conditional Formatting",
		description:
			"Kiểm tra worksheet đã xóa toàn bộ conditional formatting, không chỉ xóa định dạng ô thường.",
		subjects: ["excel"],
	},
	{
		value: "excelTextRotation",
		label: "Xoay chữ Excel",
		description:
			"Kiểm tra các tiêu đề đã dùng đúng textRotation, ví dụ Angle Counterclockwise.",
		subjects: ["excel"],
	},
	{
		value: "excelMultiColumnSort",
		label: "Sắp xếp nhiều cột Excel",
		description:
			"Kiểm tra thứ tự dữ liệu thực tế sau khi sort theo nhiều khóa, ví dụ Wired Equipment rồi Port Size.",
		subjects: ["excel"],
	},
	{
		value: "excelFreezePanes",
		label: "Cố định ngăn Excel",
		description:
			"Kiểm tra worksheet đã cố định đúng hàng/cột khi cuộn, ví dụ giữ hàng 1 đến 3 khi cuộn dọc.",
		subjects: ["excel"],
	},
	{
		value: "excelDocumentProperty",
		label: "Thuộc tính tài liệu Excel",
		description:
			"Kiểm tra custom document property của workbook, ví dụ Status = Draft.",
		subjects: ["excel"],
	},
	{
		value: "excelPrintArea",
		label: "Vùng in Excel",
		description:
			"Kiểm tra worksheet đã đặt đúng vùng in, ví dụ Q1 Sales!A1:F17.",
		subjects: ["excel"],
	},
	{
		value: "excelTableColumnFormula",
		label: "Công thức cột bảng Excel",
		description:
			"Kiểm tra công thức tính toán của cột trong bảng Excel, hỗ trợ cú pháp có cấu trúc (ví dụ: =[@Total]-[@Commission] hoặc =RIGHT([@ID], 4)).",
		subjects: ["excel"],
	},
	{
		value: "excelChartType",
		label: "Loại biểu đồ Excel",
		description:
			"Kiểm tra loại biểu đồ đã tạo trên worksheet (ví dụ: 3-D Clustered Bar, 3-D Clustered Column, Clustered Bar).",
		subjects: ["excel"],
	},
	{
		value: "excelWorksheetTabColor",
		label: "Màu tab trang tính Excel",
		description:
			"Kiểm tra màu tab (tab color) của trang tính theo mã màu HEX (ví dụ: Blue #0070C0).",
		subjects: ["excel"],
	},
	{
		value: "excelTableTotalRow",
		label: "Hàng tổng bảng tính (Total Row)",
		description:
			"Kiểm tra bảng Excel đã bật hàng tổng (Total Row) và tùy chọn hàm/tên cột tổng.",
		subjects: ["excel"],
	},
	{
		value: "excelTableCreate",
		label: "Tạo bảng tính (Create Table)",
		description:
			"Kiểm tra vùng dữ liệu đã được chuyển thành bảng Excel đúng phạm vi, header và kiểu bảng.",
		subjects: ["excel"],
	},
	{
		value: "excelChartQuickLayout",
		label: "Bố cục nhanh biểu đồ (Quick Layout)",
		description:
			"Kiểm tra biểu đồ Excel đã áp dụng Quick Layout yêu cầu, ví dụ Layout 2 có nhãn dữ liệu.",
		subjects: ["excel"],
	},
	{
		value: "excelSparkline",
		label: "Biểu đồ Sparkline Excel",
		description:
			"Kiểm tra Sparkline đúng loại, vùng dữ liệu và vị trí ô/vùng đích.",
		subjects: ["excel"],
	},
	{
		value: "excelTableRowDelete",
		label: "Xóa hàng chứa dữ liệu trong bảng",
		description:
			"Kiểm tra hàng chứa văn bản yêu cầu đã được xóa khỏi worksheet/bảng Excel.",
		subjects: ["excel"],
	},
	{ value: "excelClearContents", label: "Xóa nội dung vùng ô", description: "Kiểm tra xóa nội dung và giữ ô trống.", subjects: ["excel"] },
	{ value: "excelRowHeight", label: "Chiều cao hàng", description: "Kiểm tra chiều cao hàng trên trang tính.", subjects: ["excel"] },
	{ value: "excelCellStyle", label: "Kiểu ô", description: "Kiểm tra kiểu ô tích hợp của Excel.", subjects: ["excel"] },
	{ value: "excelHeaderFooter", label: "Header và Footer", description: "Kiểm tra trường ngày ở footer bên phải.", subjects: ["excel"] },
	{ value: "excelTextImport", label: "Nhập dữ liệu văn bản", description: "Kiểm tra bảng được nhập từ tệp văn bản.", subjects: ["excel"] },
	{ value: "excelRemoveHyperlink", label: "Bỏ siêu liên kết", description: "Kiểm tra bỏ liên kết nhưng giữ nguyên chữ.", subjects: ["excel"] },
	{ value: "excelCellText", label: "Văn bản trong ô", description: "Kiểm tra văn bản được giữ lại trong ô.", subjects: ["excel"] },
	{ value: "excelCellFormatMatch", label: "Sao chép định dạng ô", description: "So sánh định dạng ô nguồn và đích.", subjects: ["excel"] },
	{ value: "excelAboveAverageFilter", label: "Lọc trên trung bình", description: "Kiểm tra bộ lọc Above Average của cột bảng.", subjects: ["excel"] },
	{ value: "excelQuickAccessEvidence", label: "Minh chứng Quick Access Toolbar", description: "Duyệt ảnh thanh công cụ truy cập nhanh.", subjects: ["excel"] },
	{ value: "excelWebExportEvidence", label: "Minh chứng xuất trang web", description: "Duyệt tệp HTML được xuất từ Excel.", subjects: ["excel"] },
	{ value: "excelWrapText", label: "Ngắt dòng trong ô", description: "Kiểm tra Wrap Text trong vùng ô.", subjects: ["excel"] },
	{ value: "excelInsertColumn", label: "Chèn cột", description: "Kiểm tra bảng dịch sang phải sau khi chèn cột.", subjects: ["excel"] },
	{ value: "excelSplitPanes", label: "Tách ngăn trang tính", description: "Kiểm tra vị trí Split pane.", subjects: ["excel"] },
	{ value: "excelChartSheetLocation", label: "Chuyển biểu đồ sang chart sheet", description: "Kiểm tra biểu đồ trên trang biểu đồ riêng.", subjects: ["excel"] },
	// PowerPoint Special Conditions
	{
		value: "pptPictureCropShape",
		label: "Cắt ảnh thành hình dạng (Crop to Shape)",
		description:
			"Kiểm tra hình ảnh được crop theo hình mẫu chỉ định (ví dụ: Oval/ellipse).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptShapeSize",
		label: "Kích thước hình dạng (Shape Size)",
		description:
			"Kiểm tra chiều cao và chiều rộng của hình dạng theo đơn vị inch hoặc cm.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptShapeGroup",
		label: "Nhóm hình dạng (Group Shapes)",
		description:
			"Kiểm tra các hình dạng đã được nhóm lại với nhau thành group và canh chỉnh lề.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptChartLegend",
		label: "Vị trí chú giải biểu đồ (Chart Legend)",
		description:
			"Kiểm tra vị trí hiển thị của chú giải biểu đồ (Top, Bottom, Left, Right).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSmartArt",
		label: "Bố cục và nội dung SmartArt (SmartArt Layout)",
		description: "Kiểm tra loại bố cục SmartArt và danh sách nội dung các nút.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptComment",
		label: "Bình luận Slide (Slide Comment)",
		description:
			"Kiểm tra sự tồn tại hoặc đã xóa bình luận của tác giả trên slide.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSlideTitles",
		label: "Thứ tự tiêu đề các Slide (Slide Titles Order)",
		description:
			"Kiểm tra thứ tự và nội dung tiêu đề các slide được tạo hoặc nhập từ outline.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptVideo",
		label: "Video và Screen Recording (Trim Video)",
		description:
			"Kiểm tra sự tồn tại của video/ghi màn hình và thời lượng cắt video (trim).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptTable",
		label: "Bảng trình chiếu (Table Rows/Cells)",
		description: "Kiểm tra xóa dòng trong bảng và các ô dữ liệu còn lại.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSection",
		label: "Phân mục Slide (Slide Section)",
		description: "Kiểm tra tên phân mục (section) trong bài trình chiếu.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptPictureStyle",
		label: "Kiểu hình ảnh trình chiếu (Picture Style)",
		description:
			"Kiểm tra phong cách ảnh được áp dụng (ví dụ: Bevel Rectangle).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptShapeArrange",
		label: "Sắp xếp đối tượng (Shape Arrange / Align)",
		description:
			"Kiểm tra thứ tự lớp hiển thị (Bring to Front) và canh chỉnh lề (Align Middle).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSummaryZoom",
		label: "Thu phóng tóm tắt (Summary Zoom)",
		description: "Kiểm tra slide tóm tắt có chứa các liên kết thu phóng slide.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptExportedFile",
		label: "File xuất đính kèm (Exported File - PDF/Handout)",
		description:
			"Kiểm tra file xuất đính kèm chính xác tên (ví dụ: Backcountry.pdf).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptMasterPicture",
		label: "Chèn ảnh vào Slide Master",
		description:
			"Kiểm tra hình ảnh được chèn vào Slide Master và vị trí hiển thị.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSlideTransition",
		label: "Hiệu ứng chuyển trang (Slide Transition)",
		description:
			"Kiểm tra hiệu ứng chuyển trang (Fade, Smoothly), thời lượng và áp dụng tất cả.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptAnimation",
		label: "Hiệu ứng hoạt họa (Animation / Motion Path)",
		description:
			"Kiểm tra hiệu ứng hoạt họa của đối tượng hoặc đường chuyển động.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptMarkAsFinal",
		label: "Đánh dấu hoàn tất (Mark as Final)",
		description:
			"Kiểm tra tài liệu đã được đánh dấu là bản cuối cùng trong thuộc tính.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptPrintSettings",
		label: "Thiết lập in trình chiếu (Print Settings)",
		description: "Kiểm tra cấu hình in (Notes Pages, Grayscale).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptTextColumns",
		label: "Chia cột văn bản trong Shape (Text Columns)",
		description:
			"Kiểm tra số cột và khoảng cách giữa các cột trong hộp văn bản.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptNotesMasterPlaceholders",
		label: "Trang ghi chú chính (Notes Master Placeholders)",
		description: "Kiểm tra ẩn hiện Header/Footer trên Notes Master.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSlideSize",
		label: "Kích thước slide (Slide Size Ratio)",
		description:
			"Kiểm tra tỷ lệ kích thước slide (16:9 widescreen, 4:3 standard).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptChartType",
		label: "Loại biểu đồ trình chiếu (Chart Type)",
		description: "Kiểm tra loại biểu đồ trên slide (ví dụ: Pareto).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptAltText",
		label: "Văn bản thay thế (Alt Text)",
		description: "Kiểm tra mô tả văn bản thay thế của hình ảnh hoặc hình dạng.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptHyperlink",
		label: "Siêu liên kết Slide (Hyperlink)",
		description: "Kiểm tra văn bản gắn link và địa chỉ URL liên kết ngoài.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptTextBox",
		label: "Hộp văn bản trình chiếu (Text Box)",
		description:
			"Kiểm tra hộp văn bản mới, nội dung, kích thước và vị trí đặt.",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSlideLayout",
		label: "Bố cục Slide (Slide Layout)",
		description:
			"Kiểm tra layout của slide (ví dụ: Two Content, Section Header).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptShapeStyle",
		label: "Kiểu hình dạng trình chiếu (Shape Style)",
		description:
			"Kiểm tra phong cách shape (ví dụ: Intense Effect - Blue-Gray, Accent 1).",
		subjects: ["ppt", "powerpoint"],
	},
	{
		value: "pptSlideBackground",
		label: "Màu nền Slide (Slide Background Color)",
		description:
			"Kiểm tra màu nền đơn sắc (Solid Color) của slide theo mã HEX.",
		subjects: ["ppt", "powerpoint"],
	},
];

export const specialConditionGroups: Array<{
	label: string;
	matches: (option: SpecialConditionOption) => boolean;
}> = [
	{
		label: "Word - Thẻ File",
		matches: (option) =>
			["wordDocumentInspector", "wordDocumentProperty"].includes(option.value),
	},
	{
		label: "Word - Thẻ Home",
		matches: (option) =>
			[
				"wordFontFormat",
				"pictureBullet",
				"wordParagraphStyle",
				"wordMoveText",
				"wordMoveSmartArt",
				"wordParagraphList",
				"wordBulletStyle",
				"wordViewSetting",
			].includes(option.value),
	},
	{
		label: "Word - Thẻ Insert",
		matches: (option) =>
			[
				"wordInsertSymbol",
				"insertedImage",
				"hyperlink",
				"wordTextToTable",
				"wordBookmark",
				"textBoxContainsText",
			].includes(option.value),
	},
	{
		label: "Word - Thẻ SmartArt Design",
		matches: (option) =>
			["wordSmartArt", "wordSmartArtColors"].includes(option.value),
	},
	{
		label: "Word - Thẻ Design",
		matches: (option) =>
			["documentStyleSet", "pageBorder"].includes(option.value),
	},
	{
		label: "Word - Thẻ Layout",
		matches: (option) =>
			["pageMargins", "sectionBreakBeforeText", "wordColumns"].includes(
				option.value,
			),
	},
	{
		label: "Word - Thẻ References",
		matches: (option) =>
			["wordCustomToc", "wordEndnote"].includes(option.value),
	},
	{
		label: "Word - Thẻ Review",
		matches: (option) =>
			[
				"wordResolveComment",
				"wordCommentReply",
				"wordTrackChanges",
				"wordInsertComment",
			].includes(option.value),
	},
	{
		label: "Word - Thẻ ngữ cảnh Bảng (Table Tools)",
		matches: (option) =>
			["convertTableToText", "wordTableSort", "wordTableAutoFit"].includes(
				option.value,
			),
	},
	{
		label: "Word - Thẻ ngữ cảnh Hình ảnh (Picture Format)",
		matches: (option) => option.value === "pictureStyle",
	},
	{
		label: "Excel - Thẻ File",
		matches: (option) =>
			["excelCompatibilityReport", "excelDocumentProperty"].includes(
				option.value,
			),
	},
	{
		label: "Excel - Thẻ Home",
		matches: (option) =>
			[
				"excelClearCellFormatting",
				"excelMergedRange",
				"excelIconSetConditionalFormatting",
				"excelNoConditionalFormatting",
				"excelNumberFormat",
				"excelTextRotation",
				"excelTextReplacement",
			].includes(option.value),
	},
	{
		label: "Excel - Thẻ Insert",
		matches: (option) => option.value === "excelCellHyperlink",
	},
	{
		label: "Excel - Thẻ Page Layout / Trang tính",
		matches: (option) =>
			[
				"excelWorksheetPageSetup",
				"excelPrintTitles",
				"excelPrintArea",
				"excelWorksheetTabColor",
			].includes(option.value),
	},
	{
		label: "Excel - Thẻ Formulas",
		matches: (option) =>
			["excelDefinedName", "excelFormulaReferences"].includes(option.value),
	},
	{
		label: "Excel - Thẻ Data",
		matches: (option) =>
			["excelDataModelImport", "excelMultiColumnSort"].includes(option.value),
	},
	{
		label: "Excel - Thẻ View",
		matches: (option) => option.value === "excelFreezePanes",
	},
	{
		label: "Excel - Thẻ ngữ cảnh Bảng (Table Design)",
		matches: (option) =>
			["excelTableName", "excelTableColumnFormula"].includes(option.value),
	},
	{
		label: "Excel - Thẻ ngữ cảnh Biểu đồ (Chart Design)",
		matches: (option) =>
			[
				"excelChartDataRange",
				"excelChartStyle",
				"excelChartLegend",
				"excelChartType",
			].includes(option.value),
	},
	{
		label: "PowerPoint - Thẻ File",
		matches: (option) =>
			["pptMarkAsFinal", "pptPrintSettings", "pptExportedFile"].includes(
				option.value,
			),
	},
	{
		label: "PowerPoint - Thẻ Home",
		matches: (option) =>
			["pptSlideLayout", "pptTextColumns", "pptShapeArrange"].includes(
				option.value,
			),
	},
	{
		label: "PowerPoint - Thẻ Insert",
		matches: (option) =>
			[
				"pptTable",
				"pptSmartArt",
				"pptSummaryZoom",
				"pptHyperlink",
				"pptVideo",
				"pptComment",
				"pptTextBox",
			].includes(option.value),
	},
	{
		label: "PowerPoint - Thẻ Design",
		matches: (option) =>
			["pptSlideSize", "pptSlideBackground"].includes(option.value),
	},
	{
		label: "PowerPoint - Thẻ Transitions",
		matches: (option) => option.value === "pptSlideTransition",
	},
	{
		label: "PowerPoint - Thẻ Animations",
		matches: (option) => option.value === "pptAnimation",
	},
	{
		label: "PowerPoint - Thẻ Review",
		matches: (option) => option.value === "pptComment",
	},
	{
		label: "PowerPoint - Thẻ View / Master",
		matches: (option) =>
			[
				"pptMasterPicture",
				"pptNotesMasterPlaceholders",
				"pptSlideTitles",
				"pptSection",
			].includes(option.value),
	},
	{
		label: "PowerPoint - Thẻ ngữ cảnh Hình dạng (Shape Format)",
		matches: (option) =>
			["pptShapeSize", "pptShapeGroup", "pptShapeStyle", "pptAltText"].includes(
				option.value,
			),
	},
	{
		label: "PowerPoint - Thẻ ngữ cảnh Hình ảnh (Picture Format)",
		matches: (option) =>
			["pptPictureCropShape", "pptPictureStyle"].includes(option.value),
	},
	{
		label: "PowerPoint - Thẻ ngữ cảnh Biểu đồ (Chart Design)",
		matches: (option) =>
			["pptChartLegend", "pptChartType"].includes(option.value),
	},
];
