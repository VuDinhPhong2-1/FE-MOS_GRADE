import {
	Card,
	CardContent,
	Icon,
	ProgressIndicator,
} from "@bug-on/m3-expressive";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageHeader } from "../context/PageActionsContext";
import {
	ClassActionToolbar,
	ClassFormModal,
	ClassGrid,
	type ClassListProps,
	ClassStatsGrid,
	DeleteClassDialog,
	HandoverModal,
	useClassList,
} from "../features/class-list";
import StudentList from "./StudentList";

const ClassList: React.FC<ClassListProps> = ({
	selectedSchool,
	onBackToSchools,
}) => {
	const {
		classes,
		visibleClasses,
		selectedClass,
		isLoading,
		error,
		canCreateClass,
		canManageClass,
		canHandoverClass,
		classStatusFilter,
		setClassStatusFilter,
		classSearch,
		setClassSearch,
		classSearchActive,
		setClassSearchActive,
		openClassSearch,
		closeClassSearch,
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

	const [, setSearchParams] = useSearchParams();

	const handleBackToSchools = useCallback(() => {
		if (onBackToSchools) {
			onBackToSchools();
			return;
		}
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.delete("schoolId");
			next.delete("classId");
			return next;
		});
	}, [onBackToSchools, setSearchParams]);

	usePageHeader(
		{
			title: selectedClass ? `Lớp ${selectedClass.name}` : selectedSchool.name,
			subtitle: selectedClass
				? "Danh sách học sinh"
				: "Danh sách lớp học trực thuộc",
		},
		[selectedClass, selectedSchool.name],
	);

	if (selectedClass) {
		const selectedClassReadOnly = !canManageClass(selectedClass);
		return (
			<StudentList
				selectedClass={selectedClass}
				readOnly={selectedClassReadOnly}
				onBack={handleBackToClassList}
			/>
		);
	}

	if (isLoading) {
		return (
			<div className="flex h-64 flex-col items-center justify-center gap-3">
				<ProgressIndicator
					variant="circular"
					shape="wavy"
					size={64}
					aria-label="Đang tải danh sách lớp..."
				/>
				<span className="text-sm font-medium text-m3-on-surface-variant">
					Đang tải danh sách lớp...
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-28">
			{/* Thông báo lỗi nếu có */}
			{error && (
				<Card
					variant="outlined"
					className="border-m3-error bg-m3-error-container text-m3-on-error-container"
				>
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

			{/* Floating Action Toolbar */}
			<ClassActionToolbar
				onOpenAddModal={handleOpenAddModal}
				canCreateClass={canCreateClass}
				statusFilter={classStatusFilter}
				onStatusFilterChange={setClassStatusFilter}
				searchQuery={classSearch}
				onSearchQueryChange={setClassSearch}
				isSearchActive={classSearchActive}
				onOpenSearch={openClassSearch}
				onCloseSearch={closeClassSearch}
				onSearchActiveChange={setClassSearchActive}
				selectedGradeFilter={selectedGradeFilter}
				onGradeFilterChange={setSelectedGradeFilter}
				onBackToSchools={handleBackToSchools}
				totalCount={classes.length}
				displayedCount={visibleClasses.length}
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
