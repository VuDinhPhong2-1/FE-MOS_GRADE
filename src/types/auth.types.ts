export interface User {
  userId: string;
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
  fullName?: string;
  phoneNumber?: string;
  avatar?: string;
  teacherApprovalStatus?: 'Pending' | 'Approved' | 'Rejected' | string;
  teacherApprovalRequestedAt?: string;
  teacherApprovalReviewedAt?: string;
  teacherApprovalReviewedBy?: string;
  teacherApprovalNote?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
  getRefreshToken: () => string | null;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData extends LoginFormData {
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
  fullName?: string;
  phoneNumber?: string;
  avatar?: string;
  teacherApprovalStatus?: 'Pending' | 'Approved' | 'Rejected' | string;
  teacherApprovalRequestedAt?: string;
  teacherApprovalReviewedAt?: string;
  teacherApprovalReviewedBy?: string;
  teacherApprovalNote?: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
  teacherApprovalStatus?: 'Pending' | 'Approved' | 'Rejected' | string;
  teacherApprovalRequestedAt?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  avatar?: string;
}

export interface ProfileResponse {
  userId: string;
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
  fullName?: string;
  phoneNumber?: string;
  avatar?: string;
  isActive?: boolean;
  teacherApprovalStatus?: 'Pending' | 'Approved' | 'Rejected' | string;
  teacherApprovalRequestedAt?: string;
  teacherApprovalReviewedAt?: string;
  teacherApprovalReviewedBy?: string;
  teacherApprovalNote?: string;
}

export interface TeacherSummary {
  userId: string;
  username: string;
  fullName?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
  teacherApprovalStatus?: 'Pending' | 'Approved' | 'Rejected' | string;
  teacherApprovalRequestedAt?: string;
  teacherApprovalReviewedAt?: string;
  teacherApprovalReviewedBy?: string;
  teacherApprovalNote?: string;
}

export interface PermissionCatalogResponse {
  permissions: string[];
  teacherDefaultPermissions?: string[];
}

export interface UpdateTeacherPermissionsRequest {
  permissions: string[];
}

export interface TeacherApprovalRequest extends TeacherSummary {
  teacherApprovalStatus?: 'Pending' | 'Approved' | 'Rejected' | string;
  teacherApprovalRequestedAt?: string;
  teacherApprovalReviewedAt?: string;
  teacherApprovalReviewedBy?: string;
  teacherApprovalNote?: string;
}

export interface TeacherApprovalDecisionRequest {
  decision: 'approve' | 'reject';
  note?: string;
}
