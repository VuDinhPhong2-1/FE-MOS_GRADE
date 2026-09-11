import { type FormEvent, useCallback, useMemo, useState } from "react";
import { computerRoomService } from "../../../services/computer-room.service";
import type {
	ComputerRoom,
	CreateComputerRoomRequest,
	UpdateComputerRoomRequest,
} from "../../../types/computer-room.types";
import type { School } from "../../../types/school.types";
import { notify } from "../../../utils/notify";
import type { ComputerRoomFormState } from "../types";
import { createDefaultRoomForm, parseNonNegativeInt } from "../utils";

interface UseRoomManagerProps {
	getAccessToken: () => Promise<string | null>;
	schools: School[];
	onRoomsChanged?: (schoolId: string) => Promise<void>;
}

export const useRoomManager = ({
	getAccessToken,
	schools,
	onRoomsChanged,
}: UseRoomManagerProps) => {
	const [roomManagerOpen, setRoomManagerOpen] = useState(false);
	const [roomManagerSchoolId, setRoomManagerSchoolId] = useState("");
	const [roomManagerRows, setRoomManagerRows] = useState<ComputerRoom[]>([]);
	const [roomManagerLoading, setRoomManagerLoading] = useState(false);
	const [editingRoomId, setEditingRoomId] = useState("");
	const [roomSubmitting, setRoomSubmitting] = useState(false);
	const [roomForm, setRoomForm] = useState<ComputerRoomFormState>(
		createDefaultRoomForm(),
	);

	const resetRoomForm = useCallback((schoolId: string) => {
		setEditingRoomId("");
		setRoomForm(createDefaultRoomForm(schoolId));
	}, []);

	const loadRoomManagerRows = useCallback(
		async (schoolId: string) => {
			if (!schoolId) {
				setRoomManagerRows([]);
				return;
			}
			try {
				setRoomManagerLoading(true);
				const rows = await computerRoomService.getBySchool(
					schoolId,
					getAccessToken,
					true,
				);
				setRoomManagerRows(rows);
			} catch (error) {
				setRoomManagerRows([]);
				notify.error(
					error instanceof Error
						? error.message
						: "Không thể tải dữ liệu quản lý phòng máy",
				);
			} finally {
				setRoomManagerLoading(false);
			}
		},
		[getAccessToken],
	);

	const openRoomManager = useCallback(
		(fallbackSchoolId?: string) => {
			const targetSchoolId =
				fallbackSchoolId || roomManagerSchoolId || schools[0]?.id || "";
			if (!targetSchoolId) {
				notify.warning("Chưa có trường học để quản lý phòng máy");
				return;
			}
			setRoomManagerSchoolId(targetSchoolId);
			resetRoomForm(targetSchoolId);
			setRoomManagerOpen(true);
			void loadRoomManagerRows(targetSchoolId);
		},
		[roomManagerSchoolId, schools, resetRoomForm, loadRoomManagerRows],
	);

	const closeRoomManager = useCallback(() => {
		setRoomManagerOpen(false);
		setEditingRoomId("");
	}, []);

	const handleEditRoom = useCallback((room: ComputerRoom) => {
		setEditingRoomId(room.id);
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
	}, []);

	const handleDeleteRoom = useCallback(
		async (
			room: ComputerRoom,
			currentScheduleRoomId?: string,
			onRoomCleared?: () => void,
		) => {
			const confirmed = window.confirm(`Xóa phòng máy "${room.name}"?`);
			if (!confirmed) return;
			try {
				await computerRoomService.delete(room.id, getAccessToken);
				notify.success("Đã xóa phòng máy");
				await loadRoomManagerRows(roomManagerSchoolId);
				if (onRoomsChanged) {
					await onRoomsChanged(room.schoolId);
				}
				if (currentScheduleRoomId === room.id && onRoomCleared) {
					onRoomCleared();
				}
			} catch (error) {
				notify.error(
					error instanceof Error ? error.message : "Không thể xóa phòng máy",
				);
			}
		},
		[getAccessToken, loadRoomManagerRows, roomManagerSchoolId, onRoomsChanged],
	);

	const handleSaveRoom = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const schoolId = roomForm.schoolId || roomManagerSchoolId;
			if (!schoolId) {
				notify.warning("Vui lòng chọn trường");
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
				setRoomSubmitting(true);
				if (editingRoomId) {
					const updatePayload: UpdateComputerRoomRequest = {
						...sharedPayload,
						isActive: roomForm.isActive,
					};
					await computerRoomService.update(
						editingRoomId,
						updatePayload,
						getAccessToken,
					);
					notify.success("Cập nhật phòng máy thành công");
				} else {
					const createPayload: CreateComputerRoomRequest = {
						schoolId,
						...sharedPayload,
					};
					await computerRoomService.create(createPayload, getAccessToken);
					notify.success("Tạo phòng máy thành công");
				}

				resetRoomForm(schoolId);
				await loadRoomManagerRows(schoolId);
				if (onRoomsChanged) {
					await onRoomsChanged(schoolId);
				}
			} catch (error) {
				notify.error(
					error instanceof Error ? error.message : "Không thể lưu phòng máy",
				);
			} finally {
				setRoomSubmitting(false);
			}
		},
		[
			roomForm,
			roomManagerSchoolId,
			editingRoomId,
			getAccessToken,
			resetRoomForm,
			loadRoomManagerRows,
			onRoomsChanged,
		],
	);

	const selectedRoomManagerSchool = useMemo(
		() => schools.find((item) => item.id === roomManagerSchoolId) || null,
		[roomManagerSchoolId, schools],
	);

	const roomManagerSummary = useMemo(
		() =>
			roomManagerRows.reduce(
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
		[roomManagerRows],
	);

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
		roomManagerOpen,
		roomManagerSchoolId,
		setRoomManagerSchoolId,
		roomManagerRows,
		roomManagerLoading,
		editingRoomId,
		roomSubmitting,
		roomForm,
		setRoomForm,
		openRoomManager,
		closeRoomManager,
		resetRoomForm,
		loadRoomManagerRows,
		handleEditRoom,
		handleDeleteRoom,
		handleSaveRoom,
		selectedRoomManagerSchool,
		roomManagerSummary,
		roomFormMachinePreview,
	};
};
