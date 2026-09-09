import {
  Button,
  Card,
  CardContent,
  Icon,
  IconButton,
  Menu,
  MenuContent,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuTrigger,
  ProgressIndicator,
  Search,
} from '@bug-on/m3-expressive';
import StudentList from './StudentList';
import { usePageHeader } from '../context/PageActionsContext';
import type { School } from '../types';
import {
  ClassFormModal,
  ClassGrid,
  ClassStatsGrid,
  DeleteClassDialog,
  HandoverModal,
  useClassList,
} from '../features/classlist';

interface ClassListProps {
  selectedSchool: School;
}

const ClassList: React.FC<ClassListProps> = ({ selectedSchool }) => {
  const {
    classes,
    visibleClasses,
    selectedClass,
    isLoading,
    error,
    canCreateClass,
    canManageClass,
    canHandoverClass,
    showInactive,
    setShowInactive,
    classSearch,
    setClassSearch,
    selectedGradeFilter,
    setSelectedGradeFilter,
    handleClearSearch,
    handleSelectClass,
    handleBackToClassList,
    showModal,
    editingClass,
    formData,
    setFormData,
    isActive,
    setIsActive,
    formError,
    setFormError,
    isSubmitting,
    isSubmitDisabled,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleSubmitForm,
    classToDelete,
    isDeletingClass,
    openDeleteDialog,
    closeDeleteDialog,
    handleConfirmDelete,
    showHandoverModal,
    handoverClass,
    teachers,
    isLoadingTeachers,
    handoverError,
    handoverBusyTeacherId,
    handoverSearch,
    setHandoverSearch,
    handleOpenHandoverModal,
    handleCloseHandoverModal,
    handleToggleHandover,
  } = useClassList(selectedSchool);

  usePageHeader(
    {
      title: selectedClass ? `Lớp ${selectedClass.name}` : selectedSchool.name,
      subtitle: selectedClass ? 'Danh sách học sinh' : 'Danh sách lớp học trực thuộc',
      searchSlot: !selectedClass ? (
        <Search
          id="classlist-search"
          query={classSearch}
          onQueryChange={setClassSearch}
          onSearch={setClassSearch}
          active={false}
          onActiveChange={() => { }}
          placeholder="Tìm theo tên lớp..."
          aria-label="Tìm kiếm lớp học"
          className="w-64 xl:w-72"
          styleType="contained"
        />
      ) : undefined,
      actions: !selectedClass
        ? [
          {
            id: 'filter-classes',
            label: 'Lọc',
            icon: 'tune',
            customNode: (
              <Menu variant='expressive' colorVariant='vibrant'>
                <MenuTrigger asChild>
                  <IconButton
                    colorStyle="tonal"
                    size="md"
                    aria-label="Bộ lọc lớp học"
                    title="Bộ lọc lớp học"
                  >
                    <Icon name="tune" size={20} />
                  </IconButton>
                </MenuTrigger>
                <MenuContent align="end" className="w-64" separatorStyle='gap'>
                  <MenuGroup label="Trạng thái lớp">
                    <MenuItem
                      selected={showInactive}
                      keepOpen
                      onClick={() => setShowInactive((prev) => !prev)}
                    >
                      Hiển thị lớp không hoạt động
                    </MenuItem>
                  </MenuGroup>
                  <MenuDivider isGapVariant className='bg-transparent' />
                  <MenuGroup label="Lọc theo khối">
                    <MenuItem
                      selected={selectedGradeFilter === ''}
                      keepOpen
                      onClick={() => setSelectedGradeFilter('')}
                    >
                      Tất cả các khối
                    </MenuItem>
                    <MenuItem
                      selected={selectedGradeFilter === '10'}
                      keepOpen
                      onClick={() => setSelectedGradeFilter('10')}
                    >
                      Khối 10
                    </MenuItem>
                    <MenuItem
                      selected={selectedGradeFilter === '11'}
                      keepOpen
                      onClick={() => setSelectedGradeFilter('11')}
                    >
                      Khối 11
                    </MenuItem>
                    <MenuItem
                      selected={selectedGradeFilter === '12'}
                      keepOpen
                      onClick={() => setSelectedGradeFilter('12')}
                    >
                      Khối 12
                    </MenuItem>
                  </MenuGroup>
                </MenuContent>
              </Menu >
            ),
            onClick: () => {
              setShowInactive((prev) => !prev);
            },
          },
          ...(canCreateClass
            ? [
              {
                id: 'add-class',
                label: 'Thêm lớp mới',
                icon: 'add',
                colorStyle: 'filled' as const,
                onClick: handleOpenAddModal,
              },
            ]
            : []),
        ]
        : [],
    },
    [
      selectedClass,
      selectedSchool.name,
      classSearch,
      showInactive,
      selectedGradeFilter,
      canCreateClass,
      handleOpenAddModal,
      setClassSearch,
      setShowInactive,
      setSelectedGradeFilter,
    ]
  );

  if (selectedClass) {
    const selectedClassReadOnly = !canManageClass(selectedClass);
    return (
      <div className="space-y-4">
        <Button
          type="button"
          colorStyle="tonal"
          onClick={handleBackToClassList}
          icon={<Icon name="arrow_back" className="text-base" />}
          className="rounded-full shadow-xs"
        >
          Quay lại danh sách lớp
        </Button>
        <StudentList selectedClass={selectedClass} readOnly={selectedClassReadOnly} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <ProgressIndicator variant="circular" shape="wavy" size={64} aria-label="Đang tải danh sách lớp..." />
        <span className="text-sm font-medium text-m3-on-surface-variant">Đang tải danh sách lớp...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thông báo lỗi nếu có */}
      {error && (
        <Card variant="outlined" className="border-m3-error bg-m3-error-container text-m3-on-error-container">
          <CardContent className="flex items-center gap-3 p-4 text-xs font-medium">
            <Icon name="warning" className="shrink-0 text-xl" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Thống kê 4 ô theo chuẩn M3 Card */}
      <ClassStatsGrid classes={classes} />

      {/* Danh sách lớp học theo MD3 Card */}
      <ClassGrid
        classes={visibleClasses}
        canManageClass={canManageClass}
        canHandoverClass={canHandoverClass}
        canCreateClass={canCreateClass}
        totalClassCount={classes.length}
        searchQuery={classSearch}
        onSelectClass={handleSelectClass}
        onEditClass={handleOpenEditModal}
        onDeleteClass={openDeleteDialog}
        onHandoverClass={handleOpenHandoverModal}
        onOpenAddModal={handleOpenAddModal}
        onClearSearch={handleClearSearch}
      />

      {/* Modal Bàn giao quyền lớp học */}
      <HandoverModal
        open={showHandoverModal}
        onClose={handleCloseHandoverModal}
        handoverClass={handoverClass}
        teachers={teachers}
        isLoadingTeachers={isLoadingTeachers}
        handoverError={handoverError}
        handoverBusyTeacherId={handoverBusyTeacherId}
        handoverSearch={handoverSearch}
        onSearchChange={setHandoverSearch}
        onToggleHandover={handleToggleHandover}
      />

      {/* Modal Thêm / Chỉnh sửa lớp học */}
      <ClassFormModal
        open={showModal}
        onClose={handleCloseFormModal}
        editingClass={editingClass}
        formData={formData}
        setFormData={setFormData}
        isActive={isActive}
        setIsActive={setIsActive}
        formError={formError}
        setFormError={setFormError}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitForm}
        attendanceSpreadsheetId={selectedSchool.attendanceSpreadsheetId}
        isSubmitDisabled={isSubmitDisabled}
      />

      {/* Modal Xác nhận xóa lớp học */}
      <DeleteClassDialog
        open={Boolean(classToDelete)}
        isDeleting={isDeletingClass}
        classToDelete={classToDelete}
        onClose={closeDeleteDialog}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default ClassList;
