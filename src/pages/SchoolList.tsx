// src/pages/SchoolList.tsx
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  Icon,
  ProgressIndicator,
} from '@bug-on/m3-expressive';
import ClassList from './Classlist';
import { useAuth } from '../context/AuthContext';
import { usePageHeader } from '../context/PageActionsContext';
import type { School } from '../types';
import {
  SchoolTable,
  SchoolFormModal,
  DeleteSchoolDialog,
  useSchoolData,
} from '../components/SchoolList';

const SchoolList = () => {
  const { getAccessToken, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    isAdmin,
    canDeleteSchool,
    schools,
    isLoading,
    error,
    showModal,
    editingSchool,
    isSubmitting,
    schoolToDelete,
    isDeleting,
    fetchSchools,
    openAddModal,
    openEditModal,
    closeModal,
    handleSaveSchool,
    openDeleteDialog,
    closeDeleteDialog,
    handleConfirmDelete,
  } = useSchoolData({ getAccessToken, user });

  const schoolId = searchParams.get('schoolId');
  const selectedSchool = useMemo(
    () => (schoolId ? schools.find((school) => school.id === schoolId) ?? null : null),
    [schools, schoolId]
  );

  const handleSelectSchool = useCallback((school: School) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('schoolId', school.id);
      next.delete('classId');
      return next;
    });
  }, [setSearchParams]);

  const handleBackToSchools = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('schoolId');
      next.delete('classId');
      return next;
    });
  }, [setSearchParams]);

  usePageHeader({
    title: selectedSchool ? selectedSchool.name : 'Quản lý trường học',
    subtitle: selectedSchool
      ? 'Danh sách lớp học trực thuộc'
      : 'Danh sách các trường và cơ sở đào tạo trong hệ thống MOS Grader',
    actions: selectedSchool
      ? []
      : [
        {
          id: 'refresh-schools',
          label: 'Làm mới',
          icon: 'refresh',
          colorStyle: 'outlined',
          disabled: isLoading,
          onClick: fetchSchools,
        },
        {
          id: 'add-school',
          label: 'Thêm trường',
          icon: 'add',
          colorStyle: 'filled',
          disabled: isLoading,
          onClick: openAddModal,
        },
      ],
  }, [selectedSchool, isLoading, handleBackToSchools, fetchSchools, openAddModal]);

  if (isLoading && schools.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <ProgressIndicator
          variant="circular"
          shape="wavy"
          size={64}
          aria-label="Đang tải danh sách trường"
        />
        <span className="text-sm font-medium text-m3-on-surface-variant">
          Đang tải danh sách trường học...
        </span>
      </div>
    );
  }

  return (
    <div>
      {!selectedSchool ? (
        <>
          {error && (
            <Card
              variant="outlined"
              className="mb-6 border-m3-error bg-m3-error-container text-m3-on-error-container"
            >
              <CardContent className="flex items-center gap-3 p-4 text-xs font-medium">
                <Icon name="warning" className="text-xl shrink-0" />
                <span>{error}</span>
              </CardContent>
            </Card>
          )}

          {/* School Table */}
          <SchoolTable
            schools={schools}
            isLoading={isLoading}
            canDeleteSchool={canDeleteSchool}
            isDeleting={isDeleting}
            schoolToDelete={schoolToDelete}
            onSelectSchool={handleSelectSchool}
            onEditSchool={openEditModal}
            onDeleteSchool={openDeleteDialog}
            onOpenAddModal={openAddModal}
          />

          {/* Add / Edit Modal Dialog */}
          <SchoolFormModal
            open={showModal}
            isSubmitting={isSubmitting}
            isAdmin={isAdmin}
            editingSchool={editingSchool}
            onClose={closeModal}
            onSubmit={handleSaveSchool}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteSchoolDialog
            open={Boolean(schoolToDelete)}
            isDeleting={isDeleting}
            schoolToDelete={schoolToDelete}
            onClose={closeDeleteDialog}
            onConfirmDelete={handleConfirmDelete}
          />
        </>
      ) : (
        <div className="space-y-4">
          <Button
            type="button"
            colorStyle="tonal"
            onClick={handleBackToSchools}
            icon={<Icon name="arrow_back" className="text-base" />}
            className="rounded-full shadow-xs"
          >
            Quay lại danh sách trường
          </Button>
          <ClassList selectedSchool={selectedSchool} />
        </div>
      )}
    </div>
  );
};

export default SchoolList;
