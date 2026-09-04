import type { GradingResult } from './grading.types';

export type XmlCompareMode = 'xmlContains' | 'xmlContainsNormalized' | 'xmlEquivalentWholeFile' | 'exactStringContains';
export type XmlMatchPolicy = 'all' | 'any' | 'ordered';

export interface XmlConditionFeedback {
  successDetail: string;
  errorMessage: string;
  fixAction: string;
}

export interface XmlGradingCondition {
  conditionId: string;
  score: number;
  sourceFile: string;
  expectedValues: string[];
  compareMode: XmlCompareMode;
  matchPolicy: XmlMatchPolicy;
  feedback: XmlConditionFeedback;
  stopTaskIfFailed: boolean;
}

/**
 * Danh sách các loại điều kiện đặc biệt được hỗ trợ.
 * Thêm loại mới bằng cách mở rộng union này.
 */
export type SpecialConditionType =
  | 'pictureBullet';
  | 'insertedImage';

  export type ImageWrapType =
  | 'inline'
  | 'square'
  | 'tight'
  | 'through'
  | 'topAndBottom'
  | 'behind'
  | 'inFront';

  export interface ImageInsertConfig {
  assetId?: string;
  imageHash?: string;
  /** Để trống nếu không cần kiểm tra chế độ ngắt dòng, chỉ kiểm tra đúng ảnh. */
  wrapType?: ImageWrapType;
}

export interface SpecialCondition {
  type: SpecialConditionType;
  score: number;
  config?: PictureBulletConfig;
  imageInsertConfig?: ImageInsertConfig; // MỚI
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

  config?: PictureBulletConfig;
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

export interface XmlRuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type XmlRuleGradeResult = GradingResult;