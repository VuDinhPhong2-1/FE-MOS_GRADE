import {
	Card,
	CardContent,
	Icon,
	ProgressIndicator,
} from "@bug-on/m3-expressive";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageHeader } from "../context/PageActionsContext";
import {
	DeleteSchoolDialog,
	SchoolActionToolbar,
	SchoolFormModal,
	SchoolTable,
	useSchoolData,
	useSchoolFilter,
} from "../features/school-list";
import type { School } from "../types";
import ClassList from "./Classlist";

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
		openAddModal,
		openEditModal,
		closeModal,
		handleSaveSchool,
		openDeleteDialog,
		closeDeleteDialog,
		handleConfirmDelete,
	} = useSchoolData({ getAccessToken, user });

	const {
		searchQuery,
		setSearchQuery,
		statusFilter,
		setStatusFilter,
		isSearchActive,
		openSearch,
		closeSearch,
		resetFilters,
		filteredSchools,
		hasActiveFilters,
		totalCount,
		displayedCount,
	} = useSchoolFilter(schools);

	const schoolId = searchParams.get("schoolId");
	const selectedSchool = useMemo(
		() =>
			schoolId
				? (schools.find((school) => school.id === schoolId) ?? null)
				: null,
		[schools, schoolId],
	);

	const handleSelectSchool = useCallback(
		(school: School) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set("schoolId", school.id);
				next.delete("classId");
				return next;
			});
		},
		[setSearchParams],
	);

	const handleBackToSchools = useCallback(() => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.delete("schoolId");
			next.delete("classId");
			return next;
		});
	}, [setSearchParams]);

	const isViewingSchool = Boolean(selectedSchool || (schoolId && isLoading));

	const pageHeaderConfig = useMemo(() => {
		if (isViewingSchool) return null;
		return {
			title: "Quản lý trường học",
			subtitle:
				"Danh sách các trường và cơ sở đào tạo trong hệ thống MOS Grader",
			actions: [
				{
					id: "add-school",
					label: "Thêm trường",
					icon: "add",
					colorStyle: "filled" as const,
					disabled: isLoading,
					onClick: openAddModal,
				},
			],
		};
	}, [isViewingSchool, isLoading, openAddModal]);

	usePageHeader(pageHeaderConfig, [pageHeaderConfig]);

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
		<div className={!selectedSchool ? "pb-28" : undefined}>
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
						schools={filteredSchools}
						isLoading={isLoading}
						canDeleteSchool={canDeleteSchool}
						isDeleting={isDeleting}
						schoolToDelete={schoolToDelete}
						onSelectSchool={handleSelectSchool}
						onEditSchool={openEditModal}
						onDeleteSchool={openDeleteDialog}
						onOpenAddModal={openAddModal}
						hasActiveFilters={hasActiveFilters}
						onResetFilters={resetFilters}
					/>

					{/* Floating Action Toolbar */}
					<SchoolActionToolbar
						onOpenAddModal={openAddModal}
						statusFilter={statusFilter}
						onStatusFilterChange={setStatusFilter}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						isSearchActive={isSearchActive}
						onOpenSearch={openSearch}
						onCloseSearch={closeSearch}
						totalCount={totalCount}
						displayedCount={displayedCount}
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
				<ClassList
					selectedSchool={selectedSchool}
					onBackToSchools={handleBackToSchools}
				/>
			)}
		</div>
	);
};

export default SchoolList;
