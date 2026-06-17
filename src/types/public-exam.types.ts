export type PublicExamStudent = {
  id: string;
  fullName: string;
};

export type PublicExamPublicationInfo = {
  id: string;
  name: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
  studentIds: string[];
  students: PublicExamStudent[];
  projectCount: number;
};
