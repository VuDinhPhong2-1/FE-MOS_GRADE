import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { computerRoomService } from "../../../services/computer-room.service";
import type {
	ComputerRoom,
	CreateComputerRoomRequest,
	UpdateComputerRoomRequest,
} from "../../../types/computer-room.types";
import type { School } from "../../../types/school.types";
import { notify } from "../../../utils/notify";
import type { ComputerRoomFormState, ComputerRoomSummary } from "../types";
import { createDefaultRoomForm, parseNonNegativeInt } from "../utils";

interface UseComputerRoomsProps {
	getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
	schools: School[];
	selectedSchoolId: string;
}

export const useComputerRooms = ({
	getAccessToken,
	schools,
	selectedSchoolId,
}: UseComputerRoomsProps) => {
	const [rooms, setRooms] = useState<ComputerRoom[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [prevSelectedSchoolId, setPrevSelectedSchoolId] =
		useState(selectedSchoolId);

	// Immediately activate loading state and clear rooms when switching school to avoid stale flash
	if (selectedSchoolId !== prevSelectedSchoolId) {
		setPrevSelectedSchoolId(selectedSchoolId);
		setIsLoading(Boolean(selectedSchoolId));
		setRooms([]);
	}

	// Form Modal State (Add/Edit)
	const [showFormModal, setShowFormModal] = useState(false);
	const [editingRoom, setEditingRoom] = useState<ComputerRoom | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [roomForm, setRoomForm] = useState<ComputerRoomFormState>(() =>
		createDefaultRoomForm(selectedSchoolId),
	);

	// Delete Dialog State
	const [roomToDelete, setRoomToDelete] = useState<ComputerRoom | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const selectedSchool = useMemo(
		() => schools.find((school) => school.id === selectedSchoolId) ?? null,
		[schools, selectedSchoolId],
	);

	// Fetch rooms with race-condition guard
	const loadRooms = useCallback(
		async (schoolId: string) => {
			if (!schoolId) {
				setRooms([]);
				return;
			}
			try {
				setIsLoading(true);
				const data = await computerRoomService.getBySchool(
					schoolId,
					getAccessToken,
					true,
				);
				setRooms(data);
			} catch (error) {
				setRooms([]);
				notify.error(
					error instanceof Error
						? error.message
						: "Không thể tải danh sách phòng máy",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[getAccessToken],
	);

	// Fetch rooms on schoolId change
	useEffect(() => {
		let isCurrent = true;

		if (!selectedSchoolId) {
			setRooms([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		computerRoomService
			.getBySchool(selectedSchoolId, getAccessToken, true)
			.then((data) => {
				if (isCurrent) {
					setRooms(data);
				}
			})
			.catch((error) => {
				if (isCurrent) {
					setRooms([]);
					notify.error(
						error instanceof Error
							? error.message
							: "Không thể tải danh sách phòng máy",
					);
				}
			})
			.finally(() => {
				if (isCurrent) {
					setIsLoading(false);
				}
			});

		return () => {
			isCurrent = false;
		};
	}, [selectedSchoolId, getAccessToken]);

	// Form field change handler
	const handleFieldChange = useCallback(
		<K extends keyof ComputerRoomFormState>(
			field: K,
			value: ComputerRoomFormState[K],
		) => {
			setRoomForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	// Open Add Modal
	const openAddModal = useCallback(() => {
		setEditingRoom(null);
		setRoomForm(createDefaultRoomForm(selectedSchoolId));
		setShowFormModal(true);
	}, [selectedSchoolId]);

	// Open Edit Modal
	const openEditModal = useCallback((room: ComputerRoom) => {
		setEditingRoom(room);
		setRoomForm({
			schoolId: room.schoolId,
			name: room.name,
			studentMachineCount: `${room.studentMachineCount}`,
			teacherMachineCount: `${room.teacherMachineCount}`,
			brokenMachineCount: `${room.brokenMachineCount}`,
			brokenMachinesDetail: room.brokenMachinesDetail || "",
			netSupportStatus: room.netSupportStatus || "Tốt",
			audioStatus: room.audioStatus || "Tốt",
			coolingStatus: room.coolingStatus || "Tốt",
			devicesPoweredOffStatus: room.devicesPoweredOffStatus || "Rồi",
			seatingOrderStatus: room.seatingOrderStatus || "Tốt",
			roomHygieneStatus: room.roomHygieneStatus || "Tốt",
			isActive: room.isActive,
		});
		setShowFormModal(true);
	}, []);

	const closeFormModal = useCallback(() => {
		setShowFormModal(false);
		setEditingRoom(null);
	}, []);

	// Submit Add / Edit
	const handleSaveRoom = useCallback(
		async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const targetSchoolId = roomForm.schoolId || selectedSchoolId;
			if (!targetSchoolId) {
				notify.warning("Vui lòng chọn trường áp dụng");
				return;
			}
			if (!roomForm.name.trim()) {
				notify.warning("Vui lòng nhập tên phòng máy");
				return;
			}

			const sharedPayload = {
				name: roomForm.name.trim(),
				studentMachineCount: parseNonNegativeInt(
					roomForm.studentMachineCount,
					0,
				),
				teacherMachineCount: parseNonNegativeInt(
					roomForm.teacherMachineCount,
					1,
				),
				brokenMachineCount: parseNonNegativeInt(roomForm.brokenMachineCount, 0),
				brokenMachinesDetail: roomForm.brokenMachinesDetail.trim() || undefined,
				netSupportStatus: roomForm.netSupportStatus.trim() || "Tốt",
				audioStatus: roomForm.audioStatus.trim() || "Tốt",
				coolingStatus: roomForm.coolingStatus.trim() || "Tốt",
				devicesPoweredOffStatus:
					roomForm.devicesPoweredOffStatus.trim() || "Rồi",
				seatingOrderStatus: roomForm.seatingOrderStatus.trim() || "Tốt",
				roomHygieneStatus: roomForm.roomHygieneStatus.trim() || "Tốt",
			};

			try {
				setIsSubmitting(true);
				if (editingRoom) {
					const updatePayload: UpdateComputerRoomRequest = {
						...sharedPayload,
						isActive: roomForm.isActive,
					};
					await computerRoomService.update(
						editingRoom.id,
						updatePayload,
						getAccessToken,
					);
					notify.success("Cập nhật phòng máy thành công");
				} else {
					const createPayload: CreateComputerRoomRequest = {
						schoolId: targetSchoolId,
						...sharedPayload,
					};
					await computerRoomService.create(createPayload, getAccessToken);
					notify.success("Tạo phòng máy thành công");
				}

				setShowFormModal(false);
				setEditingRoom(null);
				await loadRooms(targetSchoolId);
			} catch (error) {
				notify.error(
					error instanceof Error ? error.message : "Không thể lưu phòng máy",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
		[roomForm, selectedSchoolId, editingRoom, getAccessToken, loadRooms],
	);

	// Delete dialog handlers
	const openDeleteDialog = useCallback((room: ComputerRoom) => {
		setRoomToDelete(room);
	}, []);

	const closeDeleteDialog = useCallback(() => {
		setRoomToDelete(null);
	}, []);

	const handleConfirmDelete = useCallback(async () => {
		if (!roomToDelete) return;
		try {
			setIsDeleting(true);
			await computerRoomService.delete(roomToDelete.id, getAccessToken);
			notify.success(`Đã xóa phòng máy "${roomToDelete.name}"`);
			closeDeleteDialog();
			await loadRooms(selectedSchoolId);
		} catch (error) {
			notify.error(
				error instanceof Error ? error.message : "Không thể xóa phòng máy",
			);
		} finally {
			setIsDeleting(false);
		}
	}, [
		roomToDelete,
		getAccessToken,
		closeDeleteDialog,
		loadRooms,
		selectedSchoolId,
	]);

	// Summary statistics
	const roomSummary = useMemo<ComputerRoomSummary>(
		() =>
			rooms.reduce<ComputerRoomSummary>(
				(acc, room) => {
					acc.totalRooms += 1;
					acc.activeRooms += room.isActive ? 1 : 0;
					acc.totalMachines += room.totalMachineCount;
					acc.availableMachines += room.availableStudentMachines;
					return acc;
				},
				{
					totalRooms: 0,
					activeRooms: 0,
					totalMachines: 0,
					availableMachines: 0,
				},
			),
		[rooms],
	);

	// Live preview for form machine counts
	const roomFormMachinePreview = useMemo(() => {
		const studentMachines = Math.max(
			0,
			Number.parseInt(roomForm.studentMachineCount, 10) || 0,
		);
		const teacherMachines = Math.max(
			0,
			Number.parseInt(roomForm.teacherMachineCount, 10) || 0,
		);
		const brokenMachines = Math.max(
			0,
			Number.parseInt(roomForm.brokenMachineCount, 10) || 0,
		);

		return {
			totalMachines: studentMachines + teacherMachines,
			availableMachines: Math.max(0, studentMachines - brokenMachines),
		};
	}, [
		roomForm.brokenMachineCount,
		roomForm.studentMachineCount,
		roomForm.teacherMachineCount,
	]);

	return {
		selectedSchoolId,
		selectedSchool,
		rooms,
		isLoading,
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
		reloadRooms: () => loadRooms(selectedSchoolId),
	};
};
