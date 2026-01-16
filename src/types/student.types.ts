// src/types/student.types.ts

export interface Student {
    id: string;
    middleName: string;
    firstName: string;
    fullName?: string;
    status?: string;
    teacherId?: string;
    classId?: string;
    createdAt?: string;
    updatedAt?: string;
    isActive?: boolean;
    gradingApiEndpoint: string;
}

export interface StudentImportItem {
    MiddleName: string;
    FirstName: string;
}

export interface BulkImportStudentRequest {
    Students: StudentImportItem[];
    ClassId?: string;
}

export interface BulkImportResult {
    TotalCount: number;
    SuccessCount: number;
    FailedCount: number;
    Errors: string[];
    ImportedStudents: Student[];
}

export interface StudentResponse {
    id: string;
    middleName: string;
    firstName: string;
    fullName?: string;
    status: string;
    teacherId?: string;
    classId?: string;
    createdAt: string;
    updatedAt?: string;
    isActive: boolean;
    gradingApiEndpoint: string;
}