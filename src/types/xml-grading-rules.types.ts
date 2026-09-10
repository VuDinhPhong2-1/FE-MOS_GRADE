import type { GradingResult } from './grading.types';

export type XmlCompareMode = 'xmlContains' | 'xmlContainsNormalized' | 'xmlEquivalentWholeFile' | 'exactStringContains' | 'xmlMinOccurrences';
export type XmlMatchPolicy = 'all' | 'any' | 'ordered';

export interface XmlConditionFeedback {
  successDetail: string;
  errorMessage: string;
  fixAction: string;
}

export interface XmlExpectedVariant {
  expectedValues: string[];
}

export interface XmlGradingCondition {
  conditionId: string;
  score: number;
  sourceFile: string;
  expectedVariants: XmlExpectedVariant[];
  ignoreAttributes: string[];
  compareMode: XmlCompareMode;
  matchPolicy: XmlMatchPolicy;
  minOccurrences?: number;
  maxOccurrences?: number;
  feedback: XmlConditionFeedback;
  stopTaskIfFailed: boolean;
}

/**
 * Danh sách các loại điều kiện đặc biệt được hỗ trợ.
 * Thêm loại mới bằng cách mở rộng union này.
 */
export type SpecialConditionType =
  | 'pictureBullet'
  | 'insertedImage'
  | 'convertTableToText'
  | 'hyperlink'
  | 'sectionBreakBeforeText'
  | 'pictureStyle'
  | 'textBoxContainsText'
  | 'pageMargins'
  | 'documentStyleSet'
  | 'pageBorder'
  | 'excelTableName'
  | 'excelWorksheetPageSetup'
  | 'excelClearCellFormatting'
  | 'excelDataModelImport'
  | 'excelCompatibilityReport';

  export type ImageWrapType =
  | 'inline'
  | 'square'
  | 'tight'
  | 'through'
  | 'topAndBottom'
  | 'behind'
  | 'inFront';

  export interface ImageInsertConfig {
  sourceFile?: string;
  relsFile?: string;
  assetId?: string;
  imageHash?: string;
  perceptualHash?: string;
  /** Để trống nếu không cần kiểm tra chế độ ngắt dòng, chỉ kiểm tra đúng ảnh. */
  wrapType?: ImageWrapType;
  positionConfig?: ImagePositionConfig;
  sizeConfig?: ImageSizeConfig;
}

export interface ImagePositionConfig {
  afterText?: string;
  beforeText?: string;
  requireBetween?: boolean;
  caseSensitive?: boolean;
}

export interface ImageSizeConfig {
  expectedWidthEmu?: number;
  expectedHeightEmu?: number;
  toleranceEmu?: number;
}

export interface ConvertTableToTextConfig {
  sourceFile?: string;
  anchorText?: string;
  expectedRows?: string[];
  minRows?: number;
  minTabsPerRow?: number;
  requireNoTables?: boolean;
}

export interface HyperlinkConfig {
  sourceFile?: string;
  relsFile?: string;
  displayText?: string;
  anchorTextBefore?: string;
  url?: string;
  caseSensitiveText?: boolean;
}

export interface SectionBreakBeforeTextConfig {
  sourceFile?: string;
  targetText?: string;
  breakType?: string;
  targetOccurrence?: number;
  requireImmediateBefore?: boolean;
  allowSameParagraphSectPr?: boolean;
}

export interface PictureStyleConfig {
  sourceFile?: string;
  relsFile?: string;
  assetId?: string;
  imageHash?: string;
  perceptualHash?: string;
  targetImageIndex?: number;
  stylePreset?: string;
  requiredLineColor?: string;
  minLineWidth?: number;
  presetGeometry?: string;
}

export interface TextBoxContainsTextConfig {
  sourceFile?: string;
  expectedText?: string;
  matchMode?: 'exact' | 'contains';
  caseSensitive?: boolean;
  targetOccurrence?: number;
  requireDefaultPaste?: boolean;
  requireRemovedFromBody?: boolean;
  forbiddenTextColors?: string[];
  forbiddenRunProperties?: string[];
}

export interface PageMarginsConfig {
  sourceFile?: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  gutter?: number;
  requireAllSections?: boolean;
}

export interface DocumentStyleSetConfig {
  sourceFile?: string;
  styleSetName?: string;
  expectedFragments?: string[];
  ignoreAttributes?: string[];
  matchPolicy?: XmlMatchPolicy;
}

export interface PageBorderConfig {
  sourceFile?: string;
  requiredStyle?: string;
  requiredWidth?: number;
  minWidth?: number;
  requiredColor?: string;
  allowedColors?: string[];
  requireBox?: boolean;
  requireAllSections?: boolean;
}

export interface ExcelTableNameConfig {
  worksheetName?: string;
  sourceFile?: string;
  expectedName?: string;
  originalName?: string;
  requireOriginalNameAbsent?: boolean;
}

export interface ExcelWorksheetPageSetupConfig {
  worksheetName?: string;
  sourceFile?: string;
  orientation?: 'portrait' | 'landscape';
}

export interface ExcelClearCellFormattingConfig {
  worksheetName?: string;
  sourceFile?: string;
  range?: string;
  defaultStyleId?: number;
}

export interface ExcelDataModelImportConfig {
  sourceFileName?: string;
  expectedWorksheetName?: string;
  expectedConnectionName?: string;
  requireConnection?: boolean;
  requireDataModel?: boolean;
  requireImportedWorksheet?: boolean;
  requireQueryTable?: boolean;
}

export interface ExcelCompatibilityReportConfig {
  worksheetName?: string;
  expectedTexts?: string[];
  requireNewWorksheet?: boolean;
}

export interface SpecialCondition {
  type: SpecialConditionType;
  score: number;
  feedback?: XmlConditionFeedback;
  config?: PictureBulletConfig;
  imageInsertConfig?: ImageInsertConfig; // MỚI
  convertTableToTextConfig?: ConvertTableToTextConfig;
  hyperlinkConfig?: HyperlinkConfig;
  sectionBreakBeforeTextConfig?: SectionBreakBeforeTextConfig;
  pictureStyleConfig?: PictureStyleConfig;
  textBoxContainsTextConfig?: TextBoxContainsTextConfig;
  pageMarginsConfig?: PageMarginsConfig;
  documentStyleSetConfig?: DocumentStyleSetConfig;
  pageBorderConfig?: PageBorderConfig;
  excelTableNameConfig?: ExcelTableNameConfig;
  excelWorksheetPageSetupConfig?: ExcelWorksheetPageSetupConfig;
  excelClearCellFormattingConfig?: ExcelClearCellFormattingConfig;
  excelDataModelImportConfig?: ExcelDataModelImportConfig;
  excelCompatibilityReportConfig?: ExcelCompatibilityReportConfig;
}

export interface PictureBulletConfig {
  /**
   * Level của numbering trong Word.
   * 0 = cấp đầu tiên.
   */
  level?: number;

  /**
   * ID của image sau khi upload lên server.
   * FE chưa có thì để undefined.
   */
  assetId?: string;

  /**
   * SHA-256 của image chuẩn.
   * BE sẽ tạo sau khi upload.
   */
  imageHash?: string;
}

export interface SpecialCondition {
  type: SpecialConditionType;

  /**
   * Điểm riêng của điều kiện đặc biệt này.
   * Cộng vào điểm Task khi PASS, độc lập với tổng điểm các Conditions XML
   * thông thường (nếu Task có cả hai). Task cũng có thể chỉ dùng
   * specialCondition (0 Condition XML), miễn score = task.maxScore.
   */
  score: number;

  feedback?: XmlConditionFeedback;
  config?: PictureBulletConfig;
  imageInsertConfig?: ImageInsertConfig;
  convertTableToTextConfig?: ConvertTableToTextConfig;
  hyperlinkConfig?: HyperlinkConfig;
  sectionBreakBeforeTextConfig?: SectionBreakBeforeTextConfig;
  pictureStyleConfig?: PictureStyleConfig;
  textBoxContainsTextConfig?: TextBoxContainsTextConfig;
  pageMarginsConfig?: PageMarginsConfig;
  documentStyleSetConfig?: DocumentStyleSetConfig;
  pageBorderConfig?: PageBorderConfig;
  excelTableNameConfig?: ExcelTableNameConfig;
  excelWorksheetPageSetupConfig?: ExcelWorksheetPageSetupConfig;
  excelClearCellFormattingConfig?: ExcelClearCellFormattingConfig;
  excelDataModelImportConfig?: ExcelDataModelImportConfig;
  excelCompatibilityReportConfig?: ExcelCompatibilityReportConfig;
}

export interface TaskXmlRule {
  taskId: string;
  taskName: string;
  maxScore: number;
  conditions: XmlGradingCondition[];

  /**
   * Điều kiện đặc biệt của riêng Task này (không dùng chung toàn trang).
   */
  specialCondition?: SpecialCondition;
}

export interface ProjectXmlRule {
  projectCode: string;
  projectName: string;
  maxScore: number;
  tasks: TaskXmlRule[];
}

export interface GradingRuleSet {
  id: string;
  subject: string;
  version: string;
  isActive: boolean;
  projects: ProjectXmlRule[];
}

export interface GradingRuleSetSummary {
  id: string;
  subject: string;
  version: string;
  isActive: boolean;
  projectCount: number;
  taskCount: number;
  conditionCount: number;
  maxScore: number;
}

export interface XmlRuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type XmlRuleGradeResult = GradingResult;
