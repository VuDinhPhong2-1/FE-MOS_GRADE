import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import GradingModal from '../components/GradingModal';
import { useAuth } from '../context/AuthContext';
import { usePageHeader } from '../context/PageActionsContext';
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

  usePageHeader({
    title: `Chấm điểm: ${classDisplayName}`,
    subtitle: `Tổng ${students.length} học sinh · Hoạt động ${activeStudents.length}`,
    actions: [
      {
        id: 'back-to-classes',
        label: 'Quay lại',
        icon: 'arrow_back',
        colorStyle: 'outlined',
        onClick: handleBack,
      },
    ],
  }, [classDisplayName, students.length, activeStudents.length, handleBack]);

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <ProgressIndicator variant="circular" shape="wavy" size={36} aria-label="Đang tải màn hình chấm điểm" />
        <span className="text-sm font-medium text-m3-on-surface-variant">Đang tải màn hình chấm điểm...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-m3-error-container p-4 text-xs font-medium text-m3-on-error-container shadow-xs">
          <Icon name="warning" className="text-xl shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!canManageClass) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-amber-500/15 p-4 text-xs font-medium text-amber-700 dark:text-amber-300 shadow-xs">
          <Icon name="lock" className="text-xl shrink-0" />
          <span>Bạn chỉ có quyền xem lớp này, không có quyền thực hiện thao tác chấm điểm.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

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
