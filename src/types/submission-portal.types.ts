export interface SubmissionPortal {
	id: string;
	title: string;
	description?: string;
	publicToken: string;
	classIds: string[];
	assignmentIds: string[];
	startsAt?: string;
	endsAt?: string;
	maxSubmissionsPerStudent: number;
	scoringPolicy: "BestScore" | "LatestScore";
	showLeaderboard: boolean;
	showDetailedFeedback: boolean;
	isActive: boolean;
	createdAt: string;
	unreadAlertCount: number;
}

export interface CreateSubmissionPortalRequest {
	title: string;
	description?: string;
	classIds: string[];
	assignmentIds: string[];
	startsAt?: string;
	endsAt?: string;
	maxSubmissionsPerStudent: number;
	scoringPolicy: "BestScore" | "LatestScore";
	showLeaderboard: boolean;
	showDetailedFeedback: boolean;
}

export interface PublicPortalInfo {
	id: string;
	title: string;
	description?: string;
	startsAt?: string;
	endsAt?: string;
	maxSubmissionsPerStudent: number;
	scoringPolicy: "BestScore" | "LatestScore";
	showLeaderboard: boolean;
	showDetailedFeedback: boolean;
	classes: PublicPortalClass[];
	assignments: PublicPortalAssignment[];
}

export interface PublicPortalClass {
	id: string;
	name: string;
}

export interface PublicPortalStudent {
	id: string;
	fullName: string;
	classId: string;
}

export interface PublicPortalAssignment {
	id: string;
	name: string;
	description?: string;
	classId: string;
	maxScore: number;
	subject: "excel" | "word" | "ppt";
	gradingApiEndpoint?: string;
	hasTemplate: boolean;
	hasInstructions: boolean;
}

export interface PublicPortalSubmitResult {
	scoreValue?: number;
	maxScore: number;
	feedback?: string;
	autoGradingErrors: string[];
	autoGradingTaskResults?: PublicPortalAutoGradingTaskResult[];
	submittedAt: string;
	rank?: number;
	alerts: string[];
}

export interface PublicPortalAutoGradingTaskResult {
	taskId?: string;
	taskName?: string;
	score?: number;
	maxScore?: number;
	isPassed?: boolean;
	details?: string[];
	errors?: string[];
	fixActions?: string[];
}

export interface SubmissionLeaderboardItem {
	rank: number;
	studentId: string;
	studentName: string;
	classId: string;
	className: string;
	assignmentId?: string;
	assignmentName?: string;
	scoreValue: number;
	maxScore: number;
	gradedAt?: string;
	submissionCount: number;
}

export interface SubmissionAlert {
	id: string;
	alertType: string;
	severity: string;
	message: string;
	involvedStudentIds: string[];
	involvedSubmissionLogIds: string[];
	involvedStudents?: SubmissionAlertStudent[];
	isRead: boolean;
	isDismissed: boolean;
	createdAt: string;
}

export interface SubmissionAlertStudent {
	studentId: string;
	studentName: string;
	classId?: string;
	className?: string;
	assignmentId?: string;
	assignmentName?: string;
	fileName?: string;
	ipAddress?: string;
	scoreValue?: number;
	maxScore?: number;
	submittedAt?: string;
}

export interface SubmissionLog {
	id: string;
	studentName: string;
	className: string;
	assignmentName: string;
	scoreValue?: number;
	maxScore: number;
	ipAddress?: string;
	fileHash?: string;
	fileName?: string;
	alerts: string[];
	submittedAt: string;
}
