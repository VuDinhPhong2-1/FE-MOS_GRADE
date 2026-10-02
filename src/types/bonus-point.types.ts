// src/types/bonus-point.types.ts
export type BonusPointCategory =
	| "participation"
	| "behavior"
	| "achievement"
	| string;

export interface BonusPointResponse {
	id: string;
	studentId: string;
	studentFirstName: string;
	studentMiddleName: string;
	studentFullName: string;
	classId: string;
	date: string; // ISO string
	points: number;
	category: BonusPointCategory;
	reason?: string;
	scheduleId?: string;
	createdAt: string;
	createdBy?: string;
	createdByName?: string;
	updatedAt?: string;
}

export interface StudentBonusPointSummary {
	studentId: string;
	studentFirstName: string;
	studentMiddleName: string;
	studentFullName: string;
	totalBonusPoints: number;
	details: BonusPointResponse[];
}

export interface ClassBonusSummaryResponse {
	classId: string;
	students: StudentBonusPointSummary[];
}

export interface CreateBonusPointRequest {
	studentId: string;
	classId: string;
	date: string;
	points: number;
	category?: BonusPointCategory;
	reason?: string;
	scheduleId?: string;
}

export interface UpdateBonusPointRequest {
	date?: string;
	points?: number;
	category?: BonusPointCategory;
	reason?: string;
	scheduleId?: string;
}

export interface BulkBonusPointItem {
	studentId: string;
	points: number;
	category?: BonusPointCategory;
	reason?: string;
}

export interface BulkBonusPointRequest {
	classId: string;
	date: string;
	scheduleId?: string;
	items: BulkBonusPointItem[];
}
