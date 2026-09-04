import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import ViewAllScoresModal from '../components/ViewAllScoresModal';
import { useAuth } from '../context/AuthContext';
import studentService from '../services/student.service';
import { assignmentService } from '../services/assignment.service';
import { scoreService } from '../services/score.service';
import { ApiServiceError, classService } from '../services/class.service';
import type { Class } from '../types/class.types';
import type { Student } from '../types/student.types';
import type { Assignment } from '../types/assignment.types';
import type { ScoreResponse } from '../types/score.types';

interface ClassScoreboardLocationState {
  className?: string;
  returnPath?: string;
}

const mapLoadError = (error: unknown): string => {
  if (error instanceof ApiServiceError) {
    if (error.status === 403) {
      return 'Bạn chỉ có quyền xem lớp này.';
    }

    if (error.status === 404) {
      return 'Không tìm thấy lớp học.';
    }

    if (error.status >= 500) {
      return 'Hệ thống đang bận, vui lòng thử lại.';
    }

    return error.message || 'Không thể tải bảng điểm lớp.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể tải bảng điểm lớp.';
};

const ClassScoreboardPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessToken, user } = useAuth();
  const locationState = (location.state as ClassScoreboardLocationState | null) ?? null;

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [scores, setScores] = useState<ScoreResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (locationState?.returnPath) {
      navigate(locationState.returnPath);
      return;
    }

    navigate('/schools');
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!classId) {
        setError('Thiếu mã lớp để xem bảng điểm.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [classData, studentData, assignmentData, scoreData] = await Promise.all([
          classService.getClassById(classId, getAccessToken),
          studentService.getStudentsByClassId(classId, getAccessToken),
          assignmentService.getByClass(classId, getAccessToken),
          scoreService.getByClass(classId, getAccessToken),
        ]);

        if (!active) {
          return;
        }

        setClassInfo(classData);
        setStudents(studentData);
        setAssignments(assignmentData);
        setScores(scoreData);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setError(mapLoadError(err));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [classId, getAccessToken]);

  const canManageClass = useMemo(() => {
    if (!classInfo || !user) {
      return false;
    }

    if (user.role === 'Admin') {
      return true;
    }

    const userId = user.userId || '';
    if (!userId) {
      return false;
    }

    return classInfo.ownerId === userId || Boolean(classInfo.managerTeacherIds?.includes(userId));
  }, [classInfo, user]);

  const classDisplayName = locationState?.className || classInfo?.name || classId || 'Lớp học';

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <ProgressIndicator variant="circular" shape="wavy" size={36} aria-label="Đang tải bảng điểm" />
        <span className="text-sm font-medium text-m3-on-surface-variant">Đang tải dữ liệu bảng điểm lớp...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface px-4 py-2 text-xs font-bold text-m3-on-surface shadow-xs transition-all hover:bg-m3-surface-container hover:shadow-sm"
        >
          <Icon name="arrow_back" className="text-base" />
          <span>Quay lại</span>
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-m3-error bg-m3-error-container p-4 text-xs font-medium text-m3-on-error-container">
          <Icon name="warning" className="text-xl shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!canManageClass) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface px-4 py-2 text-xs font-bold text-m3-on-surface shadow-xs transition-all hover:bg-m3-surface-container hover:shadow-sm"
        >
          <Icon name="arrow_back" className="text-base" />
          <span>Quay lại</span>
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs font-medium text-amber-800 dark:text-amber-200">
          <Icon name="lock" className="text-xl shrink-0" />
          <span>Bạn chỉ có quyền xem lớp này, không có quyền mở bảng điểm đầy đủ.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface px-4 py-2 text-xs font-bold text-m3-on-surface shadow-xs transition-all hover:bg-m3-surface-container hover:shadow-sm"
        >
          <Icon name="arrow_back" className="text-base" />
          <span>Quay lại danh sách học sinh</span>
        </button>
        <div className="inline-flex items-center gap-2 rounded-full bg-m3-surface-container px-4 py-1.5 text-xs text-m3-on-surface-variant border border-m3-outline-variant/40">
          <span>Lớp:</span>
          <span className="font-bold text-m3-on-surface">{classDisplayName}</span>
          <span className="opacity-40">|</span>
          <span>{students.length} học sinh</span>
          <span className="opacity-40">|</span>
          <span className="font-medium text-m3-primary">{assignments.length} bài tập</span>
        </div>
      </div>

      <ViewAllScoresModal
        isOpen
        onClose={handleBack}
        displayMode="page"
        title={`Bảng điểm lớp ${classDisplayName}`}
        assignments={assignments}
        students={students}
        classDisplayName={classDisplayName}
        onStudentClassificationUpdated={(studentId, classification) => {
          setStudents((prev) =>
            prev.map((student) =>
              student.id === studentId ? { ...student, competencyLevel: classification } : student
            )
          );
        }}
        onStudentNotesUpdated={(studentId, notes) => {
          setStudents((prev) =>
            prev.map((student) => (student.id === studentId ? { ...student, notes } : student))
          );
        }}
        scores={scores.map((s) => ({
          studentId: s.studentId,
          assignmentId: s.assignmentId,
          assignmentName: s.assignmentName,
          scoreValue: typeof s.scoreValue === 'number' ? s.scoreValue : null,
          autoGradingErrors: s.autoGradingErrors || [],
          autoGradingTaskResults: s.autoGradingTaskResults || [],
        }))}
      />
    </div>
  );
};

export default ClassScoreboardPage;
