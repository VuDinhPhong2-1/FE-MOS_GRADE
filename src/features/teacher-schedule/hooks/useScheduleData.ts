import { useCallback, useEffect, useMemo, useState } from "react";
import { classService } from "../../../services/class.service";
import { computerRoomService } from "../../../services/computer-room.service";
import { scheduleService } from "../../../services/schedule.service";
import { schoolService } from "../../../services/school.service";
import type { Class } from "../../../types/class.types";
import type { ComputerRoom } from "../../../types/computer-room.types";
import type { ScheduleItem } from "../../../types/schedule.types";
import type { School } from "../../../types/school.types";
import { notify } from "../../../utils/notify";
import {
	buildScheduleKey,
	getWeekStart,
	parseApiDateToLocalYmd,
	toYmd,
} from "../utils";

interface UseScheduleDataProps {
	getAccessToken: () => Promise<string | null>;
}

export const useScheduleData = ({ getAccessToken }: UseScheduleDataProps) => {
	const [weekStart, setWeekStart] = useState<string>(() =>
		toYmd(getWeekStart(new Date())),
	);
	const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
	const [classes, setClasses] = useState<Class[]>([]);
	const [schools, setSchools] = useState<School[]>([]);
	const [computerRooms, setComputerRooms] = useState<ComputerRoom[]>([]);
	const [computerRoomsLoading, setComputerRoomsLoading] = useState(false);
	const [loading, setLoading] = useState(false);
	const [copying, setCopying] = useState(false);
	const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

	const weekEnd = useMemo(() => {
		const start = new Date(`${weekStart}T00:00:00`);
		start.setDate(start.getDate() + 6);
		return toYmd(start);
	}, [weekStart]);

	const loadSchedules = useCallback(async () => {
		try {
			setLoading(true);
			const response = await scheduleService.getWeekSchedules(
				weekStart,
				getAccessToken,
			);
			setSchedules(response.data || []);
		} catch (error) {
			notify.error(
				error instanceof Error ? error.message : "Không thể tải thời khóa biểu",
			);
		} finally {
			setLoading(false);
		}
	}, [weekStart, getAccessToken]);

	const loadClasses = useCallback(async () => {
		try {
			const items = await classService.getAllClasses(getAccessToken, true);
			setClasses(items);
		} catch {
			// Không chặn màn hình nếu danh sách lớp lỗi
		}
	}, [getAccessToken]);

	const loadSchools = useCallback(async () => {
		try {
			const items = await schoolService.getSchools(getAccessToken);
			setSchools(items.filter((item) => item.isActive !== false));
		} catch {
			// Không chặn màn hình nếu danh sách trường lỗi
		}
	}, [getAccessToken]);

	const loadComputerRoomsForForm = useCallback(
		async (schoolId: string) => {
			if (!schoolId) {
				setComputerRooms([]);
				return;
			}
			try {
				setComputerRoomsLoading(true);
				const rows = await computerRoomService.getBySchool(
					schoolId,
					getAccessToken,
					false,
				);
				setComputerRooms(rows);
			} catch (error) {
				setComputerRooms([]);
				notify.error(
					error instanceof Error
						? error.message
						: "Không thể tải danh sách phòng máy",
				);
			} finally {
				setComputerRoomsLoading(false);
			}
		},
		[getAccessToken],
	);

	useEffect(() => {
		void loadClasses();
		void loadSchools();
	}, [loadClasses, loadSchools]);

	useEffect(() => {
		void loadSchedules();
	}, [loadSchedules]);

	useEffect(() => {
		setSelectedScheduleIds((prev) => {
			if (prev.length === 0) return prev;
			const validIds = new Set(schedules.map((item) => item.id));
			const filtered = prev.filter((id) => validIds.has(id));
			return filtered.length === prev.length ? prev : filtered;
		});
	}, [schedules]);

	const shiftWeek = useCallback(
		(offsetDays: number) => {
			const d = new Date(`${weekStart}T00:00:00`);
			d.setDate(d.getDate() + offsetDays);
			setWeekStart(toYmd(getWeekStart(d)));
		},
		[weekStart],
	);

	const selectedSchedules = useMemo(() => {
		if (selectedScheduleIds.length === 0) return [];
		const selectedIdSet = new Set(selectedScheduleIds);
		return schedules.filter((item) => selectedIdSet.has(item.id));
	}, [schedules, selectedScheduleIds]);

	const areAllSchedulesSelected = useMemo(
		() =>
			schedules.length > 0 && selectedScheduleIds.length === schedules.length,
		[schedules.length, selectedScheduleIds.length],
	);

	const toggleScheduleSelection = useCallback((scheduleId: string) => {
		setSelectedScheduleIds((prev) => {
			if (prev.includes(scheduleId)) {
				return prev.filter((id) => id !== scheduleId);
			}
			return [...prev, scheduleId];
		});
	}, []);

	const toggleSelectAllSchedules = useCallback(() => {
		if (areAllSchedulesSelected) {
			setSelectedScheduleIds([]);
			return;
		}
		setSelectedScheduleIds(schedules.map((item) => item.id));
	}, [areAllSchedulesSelected, schedules]);

	const handleDeleteSchedule = useCallback(
		async (item: ScheduleItem) => {
			const confirmed = window.confirm(
				`Xóa lịch "${item.subject} - ${item.className}"?`,
			);
			if (!confirmed) return;
			try {
				await scheduleService.delete(item.id, getAccessToken);
				notify.success("Đã xóa lịch dạy");
				await loadSchedules();
			} catch (error) {
				notify.error(
					error instanceof Error ? error.message : "Không thể xóa lịch dạy",
				);
			}
		},
		[getAccessToken, loadSchedules],
	);

	const handleDeleteSelected = useCallback(async () => {
		if (selectedSchedules.length === 0) {
			notify.info("Vui lòng chọn ít nhất 1 lịch để xóa.");
			return;
		}

		const confirmed = window.confirm(
			`Xóa ${selectedSchedules.length} lịch đã chọn?`,
		);
		if (!confirmed) return;

		const results = await Promise.allSettled(
			selectedSchedules.map((item) =>
				scheduleService.delete(item.id, getAccessToken),
			),
		);
		const deleted = results.filter(
			(result) => result.status === "fulfilled",
		).length;
		const failed = results.length - deleted;

		if (deleted > 0) {
			notify.success(
				failed > 0
					? `Đã xóa ${deleted} lịch, lỗi ${failed} lịch.`
					: `Đã xóa ${deleted} lịch dạy.`,
			);
			setSelectedScheduleIds([]);
			await loadSchedules();
			return;
		}

		notify.error("Không thể xóa các lịch đã chọn");
	}, [selectedSchedules, getAccessToken, loadSchedules]);

	const copySchedulesToNextWeek = useCallback(
		async (sourceSchedules: ScheduleItem[], sourceLabel: string) => {
			if (copying) return;

			if (sourceSchedules.length === 0) {
				notify.info("Không có lịch phù hợp để sao chép.");
				return;
			}

			const confirmed = window.confirm(
				`Sao chép ${sourceSchedules.length} lịch ${sourceLabel} sang tuần sau?`,
			);
			if (!confirmed) return;

			setCopying(true);
			try {
				const currentWeekDate = new Date(`${weekStart}T00:00:00`);
				const nextWeekDate = new Date(currentWeekDate);
				nextWeekDate.setDate(nextWeekDate.getDate() + 7);
				const nextWeekStart = toYmd(nextWeekDate);

				const nextWeekResponse = await scheduleService.getWeekSchedules(
					nextWeekStart,
					getAccessToken,
				);
				const existingKeys = new Set(
					(nextWeekResponse.data || []).map((item) =>
						buildScheduleKey(
							parseApiDateToLocalYmd(item.date),
							item.className,
							item.subject,
							item.periodLabel,
							item.startTime,
							item.endTime,
							item.roomName,
							item.roomId,
						),
					),
				);

				let created = 0;
				let skipped = 0;
				let failed = 0;

				for (const item of sourceSchedules) {
					const sourceDate = new Date(
						`${parseApiDateToLocalYmd(item.date)}T00:00:00`,
					);
					sourceDate.setDate(sourceDate.getDate() + 7);
					const targetYmd = toYmd(sourceDate);

					const targetKey = buildScheduleKey(
						targetYmd,
						item.className,
						item.subject,
						item.periodLabel,
						item.startTime,
						item.endTime,
						item.roomName,
						item.roomId,
					);

					if (existingKeys.has(targetKey)) {
						skipped++;
						continue;
					}

					try {
						await scheduleService.create(
							{
								schoolId: item.schoolId || undefined,
								classId: item.classId || undefined,
								className: item.className,
								subject: item.subject,
								roomName: item.roomName || undefined,
								roomId: item.roomId || undefined,
								periodLabel: item.periodLabel || undefined,
								date: targetYmd,
								startTime: item.startTime,
								endTime: item.endTime,
								notes: item.notes || undefined,
							},
							getAccessToken,
						);
						existingKeys.add(targetKey);
						created++;
					} catch {
						failed++;
					}
				}

				if (created > 0) {
					setWeekStart(nextWeekStart);
				}

				if (created === 0 && skipped > 0 && failed === 0) {
					notify.info(
						"Tuần sau đã có đủ lịch tương ứng, không tạo thêm lịch mới.",
					);
					return;
				}

				const message = `Đã sao chép ${created} lịch${skipped > 0 ? `, bỏ qua ${skipped} lịch trùng` : ""}${failed > 0 ? `, lỗi ${failed} lịch` : ""}.`;
				if (failed > 0) {
					notify.warning(message);
				} else {
					notify.success(message);
				}
				setSelectedScheduleIds([]);
			} catch (error) {
				notify.error(
					error instanceof Error
						? error.message
						: "Không thể sao chép lịch sang tuần sau",
				);
			} finally {
				setCopying(false);
			}
		},
		[copying, weekStart, getAccessToken],
	);

	const handleCopyToNextWeek = useCallback(async () => {
		if (schedules.length === 0) {
			notify.info("Tuần hiện tại chưa có lịch để sao chép.");
			return;
		}
		await copySchedulesToNextWeek(schedules, "trong tuần hiện tại");
	}, [copySchedulesToNextWeek, schedules]);

	const handleCopySelectedToNextWeek = useCallback(async () => {
		if (selectedSchedules.length === 0) {
			notify.info("Vui lòng chọn ít nhất 1 lịch để sao chép.");
			return;
		}
		await copySchedulesToNextWeek(selectedSchedules, "đã chọn");
	}, [copySchedulesToNextWeek, selectedSchedules]);

	const schoolNameById = useMemo(() => {
		return new Map(schools.map((item) => [item.id, item.name]));
	}, [schools]);

	const classById = useMemo(() => {
		return new Map(classes.map((item) => [item.id, item]));
	}, [classes]);

	const resolveSchoolNameForSchedule = useCallback(
		(item: ScheduleItem): string => {
			if (item.schoolId && schoolNameById.has(item.schoolId)) {
				return schoolNameById.get(item.schoolId) || "";
			}

			if (item.classId && classById.has(item.classId)) {
				const matchedClass = classById.get(item.classId);
				if (
					matchedClass?.schoolId &&
					schoolNameById.has(matchedClass.schoolId)
				) {
					return schoolNameById.get(matchedClass.schoolId) || "";
				}
			}

			return "";
		},
		[classById, schoolNameById],
	);

	return {
		weekStart,
		weekEnd,
		setWeekStart,
		shiftWeek,
		schedules,
		classes,
		schools,
		computerRooms,
		computerRoomsLoading,
		loading,
		copying,
		selectedScheduleIds,
		setSelectedScheduleIds,
		selectedSchedules,
		areAllSchedulesSelected,
		toggleScheduleSelection,
		toggleSelectAllSchedules,
		handleDeleteSchedule,
		handleDeleteSelected,
		handleCopyToNextWeek,
		handleCopySelectedToNextWeek,
		loadSchedules,
		loadClasses,
		loadSchools,
		loadComputerRoomsForForm,
		schoolNameById,
		classById,
		resolveSchoolNameForSchedule,
	};
};
