import type { Assignment } from '../types/assignment.types'
import type { Student } from '../types/student.types';

export interface DisplayStudentRow {
  id: string;
  name: string;
  calculatedScores: { [assignmentId: string]: number };
  averageOverallScore: number;
}

export interface AssignmentStatistics {
  assignmentId: string;
  min: number;
  max: number;
  average: number;
}

export const prepareStudentDataForDisplay = (
  students: Student[],
  assignments: Assignment[]
): DisplayStudentRow[] => {
  return students.map(student => {
    const name =
      student.fullName ||
      `${student.middleName || ''} ${student.firstName || ''}`.trim();

    const totalScore = 0;
    const calculatedScores: { [key: string]: number } = {};
    assignments.forEach(assignment => {
      // TODO: replace with real score data by assignment.
      calculatedScores[assignment.id] = 0;
    });
    // Average score across assignments
    const averageOverallScore =
      assignments.length > 0
        ? Math.round((totalScore / assignments.length) * 100) / 100
        : 0;

    return {
      id: student.id,
      name,
      calculatedScores,
      averageOverallScore,
    };
  });
};

export const calculateAssignmentStatistics = (
  students: Student[],
  assignments: Assignment[]
): AssignmentStatistics[] => {
  return assignments.map(assignment => {
    // Placeholder: per-student score for this assignment
    const scores: number[] = students.map(
      () => 0 // TODO: replace with real score data
    );
    const min = scores.length ? Math.min(...scores) : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    const avg =
      scores.length > 0
        ? Math.round((scores.reduce((acc, s) => acc + s, 0) / scores.length) * 100) / 100
        : 0;
    return {
      assignmentId: assignment.id,
      min,
      max,
      average: avg,
    };
  });
};



