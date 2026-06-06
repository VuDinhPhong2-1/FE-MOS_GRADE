import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import GradingModal from '../components/GradingModal';
import { useAuth } from '../context/AuthContext';
import studentService from '../services/student.service';
import { ApiServiceError, classService } from '../services/class.service';
import type { Class } from '../types/class.types';
import type { Student } from '../types/student.types';

interface ClassGradingLocationState {
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
      return 'Hệ thống đang bảo trì, vui lòng thử lại.';
    }

    return error.message || 'Không thể tải dữ liệu chấm điểm.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể tải dữ liệu chấm điểm.';
};

const normalizeText = (value?: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isStudentActive = (student: Student): boolean => {
  const normalizedStatus = normalizeText(student.status);
  if (normalizedStatus) {
    return normalizedStatus === 'active';
  }

  return Boolean(student.isActive);
};

const ClassGradingPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessToken, user } = useAuth();
  const locationState = (location.state as ClassGradingLocationState | null) ?? null;

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
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
        setError('Thiếu mã lớp để chấm điểm.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [classData, studentData] = await Promise.all([
          classService.getClassById(classId, getAccessToken),
          studentService.getStudentsByClassId(classId, getAccessToken),
        ]);

        if (!active) {
          return;
        }

        setClassInfo(classData);
        setStudents(studentData);
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

  const activeStudents = useMemo(
    () => students.filter((student) => isStudentActive(student)),
    [students]
  );

  const classDisplayName = locationState?.className || classInfo?.name || classId || 'Lớp học';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-600">
        <Loader2 size={20} className="mr-2 animate-spin" />
        Đang tải màn hình chấm điểm...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
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
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bạn chỉ có quyền xem lớp này, không thể chấm điểm.
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
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách học sinh
        </button>
        <div className="text-sm text-slate-600">
          Lớp: <span className="font-semibold text-slate-800">{classDisplayName}</span> · Tổng {students.length} học
          sinh · Hoạt động {activeStudents.length}
        </div>
      </div>

      <GradingModal
        isOpen
        onClose={handleBack}
        classId={classId || ''}
        students={students}
        displayMode="page"
        title={`Chấm điểm - ${classDisplayName}`}
      />
    </div>
  );
};

export default ClassGradingPage;
