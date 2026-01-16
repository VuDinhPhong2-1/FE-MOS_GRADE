export interface Class {
  id: string;
  name: string;
  
  // Quan hệ với School
  schoolId: string;
  
  // Phân quyền
  ownerId: string;
  
  // Thông tin lớp
  description?: string;
  maxStudents?: number;
  currentStudents: number;
  academicYear?: string;
  grade?: string;
  studentIds: string[];
  
  // Metadata
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  isActive: boolean;
}

export interface CreateClassRequest {
  name: string;
  schoolId: string;
  description?: string;
  maxStudents?: number;
  academicYear?: string;
  grade?: string;
  teacherId?: string;
}

export interface UpdateClassRequest {
  name?: string;
  description?: string;
  maxStudents?: number;
  academicYear?: string;
  grade?: string;
  teacherId?: string;
  isActive?: boolean;
}
