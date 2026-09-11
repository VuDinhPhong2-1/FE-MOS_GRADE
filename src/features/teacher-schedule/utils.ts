import type {
	ScheduleAttendanceResponse,
	ScheduleEndLessonReport,
	ScheduleProfessionalReport,
	ScheduleReportsPayload,
	ScheduleStartLessonReport,
} from "../../types/schedule.types";
import type {
	AttendanceDraftState,
	ComputerRoomFormState,
	LessonTimelineStatus,
	ScheduleFormState,
} from "./types";

export const weekdayLabels: Record<number, string> = {
	0: "CN",
	1: "Thứ 2",
	2: "Thứ 3",
	3: "Thứ 4",
	4: "Thứ 5",
	5: "Thứ 6",
	6: "Thứ 7",
};

export const vietnameseCollator = new Intl.Collator("vi", {
	sensitivity: "variant",
	numeric: true,
});

export const toYmd = (date: Date): string => {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const getWeekStart = (date: Date): Date => {
	const d = new Date(date);
	const day = d.getDay(); // 0..6
	const diff = (day + 6) % 7; // monday = 0
	d.setDate(d.getDate() - diff);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const parseApiDateToLocalYmd = (value: string): string => {
	if (!value) return "";

	const plainYmd = value.match(/^\d{4}-\d{2}-\d{2}$/);
	if (plainYmd) return plainYmd[0];

	const parsed = new Date(value);
	if (!Number.isNaN(parsed.getTime())) {
		return toYmd(parsed);
	}

	const fallback = value.slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(fallback) ? fallback : "";
};

export const formatDateViFromYmd = (ymd: string): string => {
	const [y, m, d] = ymd.split("-");
	if (!y || !m || !d) return ymd;
	return `${d}/${m}/${y}`;
};

export const ymdToUtcMs = (ymd: string): number => {
	const [y, m, d] = ymd.split("-").map(Number);
	return Date.UTC(y || 1970, (m || 1) - 1, d || 1);
};

export const utcMsToYmd = (ms: number): string => {
	const date = new Date(ms);
	const year = date.getUTCFullYear();
	const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
	const day = `${date.getUTCDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const getWeekdayLabelFromYmd = (ymd: string): string => {
	const date = new Date(`${ymd}T00:00:00`);
	if (Number.isNaN(date.getTime())) return "-";
	return weekdayLabels[date.getDay()] || "-";
};

export const normalizeTimeValue = (rawValue: string): string => {
	const value = rawValue.trim();
	if (!value) return value;

	// HH:mm or HH:mm:ss
	const hhmmss = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
	if (hhmmss) {
		const hour = Number(hhmmss[1]);
		const minute = Number(hhmmss[2]);
		if (
			!Number.isNaN(hour) &&
			!Number.isNaN(minute) &&
			hour >= 0 &&
			hour <= 23
		) {
			return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
		}
	}

	// h:mm AM/PM
	const ampm = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
	if (ampm) {
		let hour = Number(ampm[1]);
		const minute = Number(ampm[2]);
		const marker = ampm[3].toUpperCase();
		if (marker === "PM" && hour < 12) hour += 12;
		if (marker === "AM" && hour === 12) hour = 0;
		return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
	}

	return value;
};

export const parseTimeToMinutes = (timeValue: string): number | null => {
	const value = normalizeTimeValue(timeValue);
	const match = value.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return null;
	const hour = Number(match[1]);
	const minute = Number(match[2]);
	if (
		Number.isNaN(hour) ||
		Number.isNaN(minute) ||
		hour < 0 ||
		hour > 23 ||
		minute < 0 ||
		minute > 59
	) {
		return null;
	}
	return hour * 60 + minute;
};

export const getLessonTimelineStatus = (
	lessonYmd: string,
	todayYmd: string,
	nowMinutesInDay: number,
	startTime: string,
	endTime: string,
): LessonTimelineStatus => {
	if (lessonYmd && todayYmd) {
		if (lessonYmd < todayYmd) return "done";
		if (lessonYmd > todayYmd) return "upcoming";
	}

	const startMinutes = parseTimeToMinutes(startTime);
	const endMinutes = parseTimeToMinutes(endTime);

	if (startMinutes === null || endMinutes === null) {
		return "upcoming";
	}

	if (nowMinutesInDay > endMinutes) return "done";
	if (nowMinutesInDay >= startMinutes) return "ongoing";
	return "upcoming";
};

export const lessonTimelineStatusLabels: Record<LessonTimelineStatus, string> =
	{
		done: "Đã học",
		ongoing: "Đang học",
		upcoming: "Sắp tới",
	};

export const lessonTimelineStatusClasses: Record<LessonTimelineStatus, string> =
	{
		done: "bg-m3-surface-container-highest text-m3-on-surface-variant",
		ongoing: "bg-m3-primary-container text-m3-on-primary-container",
		upcoming: "bg-m3-secondary-container text-m3-on-secondary-container",
	};

export const parseNonNegativeInt = (value: string, fallback = 0): number => {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed)) return fallback;
	return Math.max(0, parsed);
};

export const createDefaultForm = (weekStart: string): ScheduleFormState => ({
	schoolId: "",
	classId: "",
	className: "",
	subject: "",
	roomName: "",
	roomId: "",
	periodLabel: "",
	date: weekStart,
	startTime: "07:00",
	endTime: "07:45",
	notes: "",
	isActive: true,
});

export const createDefaultRoomForm = (
	schoolId = "",
): ComputerRoomFormState => ({
	schoolId,
	name: "",
	studentMachineCount: "45",
	teacherMachineCount: "1",
	brokenMachineCount: "0",
	brokenMachinesDetail: "",
	netSupportStatus: "Tốt",
	audioStatus: "Tốt",
	coolingStatus: "Tốt",
	devicesPoweredOffStatus: "Rồi",
	seatingOrderStatus: "Tốt",
	roomHygieneStatus: "Tốt",
	isActive: true,
});

export const getRoomConditionTone = (value: string): string => {
	const normalized = value.trim().toLowerCase();

	if (!normalized) {
		return "border-m3-outline-variant/60 bg-m3-surface-container text-m3-on-surface-variant";
	}

	const positiveSignals = [
		"tốt",
		"tot",
		"rồi",
		"roi",
		"ổn",
		"on",
		"ok",
		"sạch",
		"sach",
		"gọn",
		"gon",
	];
	const warningSignals = [
		"trung bình",
		"tam",
		"tạm",
		"ít",
		"it",
		"thiếu",
		"thieu",
		"chậm",
		"cham",
	];
	const negativeSignals = [
		"lỗi",
		"loi",
		"hỏng",
		"hong",
		"không",
		"khong",
		"chưa",
		"chua",
		"kém",
		"kem",
	];

	if (negativeSignals.some((signal) => normalized.includes(signal))) {
		return "border-m3-error/40 bg-m3-error-container/20 text-m3-error";
	}

	if (warningSignals.some((signal) => normalized.includes(signal))) {
		return "border-m3-tertiary/40 bg-m3-tertiary-container/20 text-m3-tertiary";
	}

	if (positiveSignals.some((signal) => normalized.includes(signal))) {
		return "border-m3-primary/30 bg-m3-primary-container/20 text-m3-primary";
	}

	return "border-m3-secondary/30 bg-m3-secondary-container/20 text-m3-secondary";
};

export const resolveSnapshotValue = (
	snapshotValue: string | number | undefined | null,
	fallbackValue?: string,
): string => {
	if (snapshotValue === undefined || snapshotValue === null)
		return fallbackValue || "";
	const normalized = `${snapshotValue}`.trim();
	return normalized || fallbackValue || "";
};

export const calculateMissingMachinesByFormula = (
	data: ScheduleAttendanceResponse,
): number | null => {
	const roomSnapshot = data.computerRoom;
	if (!roomSnapshot) return null;

	const studentMachines = Math.max(0, roomSnapshot.studentMachineCount);
	const brokenMachines = Math.max(0, roomSnapshot.brokenMachineCount);
	const availableStudentMachines = Math.max(
		0,
		studentMachines - brokenMachines,
	);
	const classSizeFromSnapshot =
		Number.isFinite(roomSnapshot.currentClassStudents) &&
		roomSnapshot.currentClassStudents > 0
			? roomSnapshot.currentClassStudents
			: null;
	const classSize = Math.max(0, classSizeFromSnapshot ?? data.students.length);

	return Math.max(classSize - availableStudentMachines, 0);
};

export const formatBrokenMachinesSummary = (
	brokenMachineCount?: number,
	brokenMachinesDetail?: string,
): string => {
	if (
		typeof brokenMachineCount !== "number" ||
		!Number.isFinite(brokenMachineCount)
	) {
		return "";
	}

	const detail = brokenMachinesDetail?.trim();
	return detail
		? `${brokenMachineCount} (${detail})`
		: String(brokenMachineCount);
};

export const startLessonRoomAutoFields: (keyof ScheduleStartLessonReport)[] = [
	"roomName",
	"totalMachines",
	"brokenMachinesSummary",
	"missingMachinesForStudents",
	"netSupportStatus",
	"audioStatus",
	"coolingStatus",
	"hygieneStatus",
];

export const endLessonRoomAutoFields: (keyof ScheduleEndLessonReport)[] = [
	"roomName",
	"totalMachines",
	"brokenMachinesSummary",
	"missingMachinesForStudents",
	"netSupportStatus",
	"audioStatus",
	"coolingStatus",
	"devicesPoweredOffStatus",
	"seatingOrderStatus",
	"roomHygieneStatus",
];

export const buildAttendanceDraft = (
	data: ScheduleAttendanceResponse,
): Record<string, AttendanceDraftState> => {
	const next: Record<string, AttendanceDraftState> = {};
	data.students.forEach((student) => {
		next[student.studentId] = {
			status: student.attendanceStatus || "Present",
			note: student.note || "",
		};
	});
	return next;
};

export const emptyStartLessonReport = (): ScheduleStartLessonReport => ({
	teacherName: "",
	assistantName: "",
	roomName: "",
	totalMachines: "",
	brokenMachinesSummary: "",
	missingMachinesForStudents: "",
	netSupportStatus: "",
	audioStatus: "",
	coolingStatus: "",
	hygieneStatus: "",
});

export const emptyProfessionalReport = (): ScheduleProfessionalReport => ({
	teacherName: "",
	className: "",
	subjectName: "",
	teachingMaterials: "",
	teachingContent: "",
	plannedLessons: "",
	taughtLessons: "",
	ongoingPracticeCompletions: "",
	gmetrixResultRate: "",
});

export const emptyEndLessonReport = (): ScheduleEndLessonReport => ({
	teacherName: "",
	assistantName: "",
	roomName: "",
	totalMachines: "",
	classStudentCountSummary: "",
	studentMaterialCoverageRate: "",
	brokenMachinesSummary: "",
	missingMachinesForStudents: "",
	netSupportStatus: "",
	audioStatus: "",
	coolingStatus: "",
	devicesPoweredOffStatus: "",
	seatingOrderStatus: "",
	roomHygieneStatus: "",
	studentRuleComplianceStatus: "",
	violationListSummary: "",
});

export const emptyReportsPayload = (): ScheduleReportsPayload => ({
	startLesson: emptyStartLessonReport(),
	professional: emptyProfessionalReport(),
	endLesson: emptyEndLessonReport(),
});

export const buildReportsDraft = (
	data: ScheduleAttendanceResponse,
	teacherName: string,
): ScheduleReportsPayload => {
	const source = data.reports || emptyReportsPayload();
	const roomSnapshot = data.computerRoom;
	const roomNameDefault = roomSnapshot?.name || data.roomName || "";
	const totalMachinesDefault = roomSnapshot?.totalMachinesText || "";
	const brokenMachinesDefault = roomSnapshot
		? formatBrokenMachinesSummary(
				roomSnapshot.brokenMachineCount,
				roomSnapshot.brokenMachinesDetail,
			)
		: "";
	const missingMachinesByFormula = calculateMissingMachinesByFormula(data);
	const missingMachinesDefault =
		missingMachinesByFormula !== null
			? `${missingMachinesByFormula}`
			: roomSnapshot && Number.isFinite(roomSnapshot.missingMachinesForStudents)
				? `${roomSnapshot.missingMachinesForStudents}`
				: "";

	return {
		startLesson: {
			...emptyStartLessonReport(),
			...(source.startLesson || {}),
			teacherName: source.startLesson?.teacherName || teacherName || "",
			roomName: resolveSnapshotValue(
				roomNameDefault,
				source.startLesson?.roomName,
			),
			totalMachines: resolveSnapshotValue(
				totalMachinesDefault,
				source.startLesson?.totalMachines,
			),
			brokenMachinesSummary: resolveSnapshotValue(
				brokenMachinesDefault,
				source.startLesson?.brokenMachinesSummary,
			),
			missingMachinesForStudents: resolveSnapshotValue(
				missingMachinesDefault,
				source.startLesson?.missingMachinesForStudents,
			),
			netSupportStatus: resolveSnapshotValue(
				roomSnapshot?.netSupportStatus,
				source.startLesson?.netSupportStatus,
			),
			audioStatus: resolveSnapshotValue(
				roomSnapshot?.audioStatus,
				source.startLesson?.audioStatus,
			),
			coolingStatus: resolveSnapshotValue(
				roomSnapshot?.coolingStatus,
				source.startLesson?.coolingStatus,
			),
			hygieneStatus: resolveSnapshotValue(
				roomSnapshot?.roomHygieneStatus,
				source.startLesson?.hygieneStatus,
			),
		},
		professional: {
			...emptyProfessionalReport(),
			...(source.professional || {}),
			teacherName: source.professional?.teacherName || teacherName || "",
			className: source.professional?.className || data.className || "",
			subjectName: source.professional?.subjectName || data.subject || "",
		},
		endLesson: {
			...emptyEndLessonReport(),
			...(source.endLesson || {}),
			teacherName: source.endLesson?.teacherName || teacherName || "",
			roomName: resolveSnapshotValue(
				roomNameDefault,
				source.endLesson?.roomName,
			),
			totalMachines: resolveSnapshotValue(
				totalMachinesDefault,
				source.endLesson?.totalMachines,
			),
			brokenMachinesSummary: resolveSnapshotValue(
				brokenMachinesDefault,
				source.endLesson?.brokenMachinesSummary,
			),
			missingMachinesForStudents: resolveSnapshotValue(
				missingMachinesDefault,
				source.endLesson?.missingMachinesForStudents,
			),
			netSupportStatus: resolveSnapshotValue(
				roomSnapshot?.netSupportStatus,
				source.endLesson?.netSupportStatus,
			),
			audioStatus: resolveSnapshotValue(
				roomSnapshot?.audioStatus,
				source.endLesson?.audioStatus,
			),
			coolingStatus: resolveSnapshotValue(
				roomSnapshot?.coolingStatus,
				source.endLesson?.coolingStatus,
			),
			devicesPoweredOffStatus: resolveSnapshotValue(
				roomSnapshot?.devicesPoweredOffStatus,
				source.endLesson?.devicesPoweredOffStatus,
			),
			seatingOrderStatus: resolveSnapshotValue(
				roomSnapshot?.seatingOrderStatus,
				source.endLesson?.seatingOrderStatus,
			),
			roomHygieneStatus: resolveSnapshotValue(
				roomSnapshot?.roomHygieneStatus,
				source.endLesson?.roomHygieneStatus,
			),
			classStudentCountSummary:
				data.roomSessionContext?.sharedClassStudentSummary ||
				source.endLesson?.classStudentCountSummary ||
				"",
		},
	};
};

export const isDateInWeek = (dateYmd: string, weekStart: string): boolean => {
	const target = new Date(`${dateYmd}T00:00:00`);
	const start = new Date(`${weekStart}T00:00:00`);
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	return target >= start && target <= end;
};

export const buildScheduleKey = (
	dateYmd: string,
	className: string,
	subject: string,
	periodLabel?: string,
	startTime?: string,
	endTime?: string,
	roomName?: string,
	roomId?: string,
): string => {
	return [
		dateYmd,
		className.trim().toLowerCase(),
		subject.trim().toLowerCase(),
		(periodLabel || "").trim().toLowerCase(),
		(startTime || "").trim(),
		(endTime || "").trim(),
		(roomName || "").trim().toLowerCase(),
		(roomId || "").trim().toLowerCase(),
	].join("|");
};
