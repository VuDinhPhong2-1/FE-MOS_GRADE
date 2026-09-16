import { Chip, Icon, Select, type SelectOption } from "@bug-on/m3-expressive";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageHeader } from "../context/PageActionsContext";
import {
	DeleteRoomDialog,
	RoomActionToolbar,
	RoomFormModal,
	RoomGrid,
	RoomStatsGrid,
	useComputerRooms,
	useRoomFilter,
} from "../features/computer-rooms";
import { schoolService } from "../services/school.service";
import type { School } from "../types/school.types";

const ComputerRoomsPage = () => {
	const { getAccessToken } = useAuth();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const urlSchoolId = searchParams.get("schoolId") || "";

	// Configure top page title and subtitle
	usePageHeader(
		useMemo(
			() => ({
				title: "Quản lý phòng máy",
				subtitle:
					"Cấu hình thiết bị, tình trạng vận hành và thông số phòng máy theo từng trường",
			}),
			[],
		),
	);

	// Load schools
	const [schools, setSchools] = useState<School[]>([]);
	const [schoolsLoading, setSchoolsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const fetchSchools = async () => {
			try {
				setSchoolsLoading(true);
				const data = await schoolService.getSchools(getAccessToken);
				if (isMounted) {
					setSchools(data.filter((item) => item.isActive !== false));
				}
			} catch {
				if (isMounted) setSchools([]);
			} finally {
				if (isMounted) setSchoolsLoading(false);
			}
		};
		void fetchSchools();
		return () => {
			isMounted = false;
		};
	}, [getAccessToken]);

	// Single source of truth for selected school: URL search params
	const selectedSchoolId = useMemo(() => {
		if (urlSchoolId && schools.some((s) => s.id === urlSchoolId)) {
			return urlSchoolId;
		}
		return schools[0]?.id || "";
	}, [urlSchoolId, schools]);

	// Auto-fill URL once if schools loaded and URL has no schoolId
	useEffect(() => {
		if (selectedSchoolId && !urlSchoolId) {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set("schoolId", selectedSchoolId);
					return next;
				},
				{ replace: true },
			);
		}
	}, [selectedSchoolId, urlSchoolId, setSearchParams]);

	const handleSchoolChange = useCallback(
		(newSchoolId: string) => {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set("schoolId", newSchoolId);
					return next;
				},
				{ replace: true },
			);
		},
		[setSearchParams],
	);

	// Computer Rooms Hook
	const {
		selectedSchool,
		rooms,
		isLoading: roomsLoading,
		showFormModal,
		editingRoom,
		isSubmitting,
		roomForm,
		roomToDelete,
		isDeleting,
		roomSummary,
		roomFormMachinePreview,
		handleFieldChange,
		openAddModal,
		openEditModal,
		closeFormModal,
		handleSaveRoom,
		openDeleteDialog,
		closeDeleteDialog,
		handleConfirmDelete,
	} = useComputerRooms({
		getAccessToken,
		schools,
		selectedSchoolId,
	});

	// Filter Hook (Search & Status)
	const {
		searchQuery,
		setSearchQuery,
		statusFilter,
		setStatusFilter,
		isSearchActive,
		openSearch,
		closeSearch,
		setIsSearchActive,
		filteredRooms,
		hasActiveFilters,
	} = useRoomFilter(rooms);

	const schoolOptions = useMemo<SelectOption[]>(
		() => schools.map((s) => ({ label: s.name, value: s.id })),
		[schools],
	);

	const handleBackToSchedule = useCallback(() => {
		navigate("/schedule");
	}, [navigate]);

	const handleClearFilters = useCallback(() => {
		setSearchQuery("");
		setStatusFilter("all");
	}, [setSearchQuery, setStatusFilter]);

	return (
		<main className="flex flex-col gap-5 pb-20">
			{/* School selector & Quick Badges */}
			<section className="rounded-2xl bg-m3-surface-container p-4 sm:p-5 transition-colors">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="w-full sm:max-w-md">
						<Select
							variant="filled"
							label="Trường áp dụng"
							options={schoolOptions}
							value={selectedSchoolId}
							onChange={handleSchoolChange}
							searchable
							showDividers={false}
							placeholder="Chọn trường để quản lý phòng máy"
							disabled={schoolsLoading || schools.length === 0}
						/>
					</div>

					{selectedSchool && (
						<div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
							<Chip
								variant="assist"
								leadingIcon={<Icon name="domain" size={16} />}
								label={selectedSchool.name}
							/>
							<Chip
								variant="assist"
								label={
									schoolsLoading || roomsLoading
										? "Đang tải..."
										: `${roomSummary.totalRooms} phòng máy`
								}
							/>
						</div>
					)}
				</div>
			</section>

			{/* Room statistics grid */}
			<section>
				<RoomStatsGrid
					summary={roomSummary}
					isLoading={schoolsLoading || roomsLoading}
				/>
			</section>

			{/* Room cards grid */}
			<section className="mt-1">
				<div className="mb-3 flex items-center justify-between px-1">
					<h3 className="text-base font-bold text-m3-on-surface font-md3-expressive">
						Danh sách phòng máy
					</h3>
					<span className="text-xs font-semibold text-m3-on-surface-variant">
						{filteredRooms.length} / {rooms.length} phòng
					</span>
				</div>

				<RoomGrid
					rooms={filteredRooms}
					isLoading={schoolsLoading || roomsLoading}
					hasActiveFilters={hasActiveFilters}
					onEdit={openEditModal}
					onDelete={openDeleteDialog}
					onOpenAdd={openAddModal}
					onClearFilters={handleClearFilters}
				/>
			</section>

			{/* Floating Action Toolbar */}
			<RoomActionToolbar
				onOpenAddModal={openAddModal}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
				isSearchActive={isSearchActive}
				onOpenSearch={openSearch}
				onCloseSearch={closeSearch}
				onSearchActiveChange={setIsSearchActive}
				onBackToSchedule={handleBackToSchedule}
			/>

			{/* Add/Edit Form Modal */}
			<RoomFormModal
				open={showFormModal}
				isEditing={Boolean(editingRoom)}
				roomForm={roomForm}
				roomFormMachinePreview={roomFormMachinePreview}
				submitting={isSubmitting}
				schools={schools}
				selectedSchool={selectedSchool}
				onClose={closeFormModal}
				onFieldChange={handleFieldChange}
				onSubmit={(e) => void handleSaveRoom(e)}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteRoomDialog
				open={Boolean(roomToDelete)}
				room={roomToDelete}
				isDeleting={isDeleting}
				onClose={closeDeleteDialog}
				onConfirm={() => void handleConfirmDelete()}
			/>
		</main>
	);
};

export default ComputerRoomsPage;
