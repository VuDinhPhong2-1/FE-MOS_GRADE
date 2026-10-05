import { useCallback, useEffect, useMemo, useState } from "react";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type {
	PublicPortalAssignment,
	PublicPortalClass,
	PublicPortalInfo,
	PublicPortalStudent,
	SubmissionLeaderboardItem,
} from "../../../types/submission-portal.types";

export interface UsePortalDataReturn {
	info: PublicPortalInfo | null;
	loading: boolean;
	message: string;
	setMessage: (msg: string) => void;
	classId: string;
	setClassId: (id: string) => void;
	studentId: string;
	setStudentId: (id: string) => void;
	students: PublicPortalStudent[];
	loadingStudents: boolean;
	leaderboard: SubmissionLeaderboardItem[];
	loadingLeaderboard: boolean;
	selectedClass: PublicPortalClass | undefined;
	selectedStudent: PublicPortalStudent | undefined;
	visibleAssignments: PublicPortalAssignment[];
	loadLeaderboard: () => Promise<void>;
}

export const usePortalData = (
	token: string,
	onResetStudentSearch?: () => void,
): UsePortalDataReturn => {
	const [info, setInfo] = useState<PublicPortalInfo | null>(null);
	const [classId, setClassIdState] = useState(() => {
		try {
			return sessionStorage.getItem(`mos_portal_${token}_classId`) || "";
		} catch {
			return "";
		}
	});
	const [studentId, setStudentIdState] = useState(() => {
		try {
			return sessionStorage.getItem(`mos_portal_${token}_studentId`) || "";
		} catch {
			return "";
		}
	});
	const [students, setStudents] = useState<PublicPortalStudent[]>([]);
	const [leaderboard, setLeaderboard] = useState<SubmissionLeaderboardItem[]>(
		[],
	);
	const [loading, setLoading] = useState(false);
	const [loadingStudents, setLoadingStudents] = useState(false);
	const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
	const [message, setMessage] = useState("");

	const setClassId = useCallback(
		(id: string) => {
			setClassIdState(id);
			try {
				if (id) {
					sessionStorage.setItem(`mos_portal_${token}_classId`, id);
				} else {
					sessionStorage.removeItem(`mos_portal_${token}_classId`);
				}
			} catch {}
		},
		[token],
	);

	const setStudentId = useCallback(
		(id: string) => {
			setStudentIdState(id);
			try {
				if (id) {
					sessionStorage.setItem(`mos_portal_${token}_studentId`, id);
				} else {
					sessionStorage.removeItem(`mos_portal_${token}_studentId`);
				}
			} catch {}
		},
		[token],
	);

	const selectedStudent = useMemo(
		() => students.find((s) => s.id === studentId),
		[students, studentId],
	);

	const selectedClass = useMemo(
		() => info?.classes.find((c) => c.id === classId),
		[info?.classes, classId],
	);

	const visibleAssignments = useMemo(
		() =>
			(info?.assignments || []).filter(
				(a) => !classId || a.classId === classId,
			),
		[info?.assignments, classId],
	);

	const loadInfo = useCallback(async () => {
		setLoading(true);
		try {
			const data = await submissionPortalService.getPublicInfo(token);
			setInfo(data);
			if (data.classes.length === 1) {
				setClassId(data.classes[0].id);
			}
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Không tìm thấy link nộp bài",
			);
		} finally {
			setLoading(false);
		}
	}, [token, setClassId]);

	const loadStudents = useCallback(async () => {
		if (!classId) {
			setStudents([]);
			setStudentId("");
			onResetStudentSearch?.();
			return;
		}
		setLoadingStudents(true);
		try {
			const studentList = await submissionPortalService.getPublicStudents(
				token,
				classId,
			);
			setStudents(studentList);
			let savedStudentId = "";
			try {
				savedStudentId =
					sessionStorage.getItem(`mos_portal_${token}_studentId`) || "";
			} catch {}
			if (
				savedStudentId &&
				studentList.some((s) => s.id === savedStudentId)
			) {
				setStudentIdState(savedStudentId);
			} else {
				setStudentId("");
				onResetStudentSearch?.();
			}
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "Không thể lấy danh sách học sinh",
			);
		} finally {
			setLoadingStudents(false);
		}
	}, [classId, token, onResetStudentSearch, setStudentId]);

	const loadLeaderboard = useCallback(async () => {
		setLoadingLeaderboard(true);
		try {
			setLeaderboard(
				await submissionPortalService.getLeaderboard(
					token,
					classId || undefined,
				),
			);
		} catch {
			setLeaderboard([]);
		} finally {
			setLoadingLeaderboard(false);
		}
	}, [classId, token]);

	useEffect(() => {
		void loadInfo();
	}, [loadInfo]);

	useEffect(() => {
		void loadStudents();
	}, [loadStudents]);

	useEffect(() => {
		if (info?.showLeaderboard) {
			void loadLeaderboard();
		}
	}, [info?.showLeaderboard, loadLeaderboard]);

	return {
		info,
		loading,
		message,
		setMessage,
		classId,
		setClassId,
		studentId,
		setStudentId,
		students,
		loadingStudents,
		leaderboard,
		loadingLeaderboard,
		selectedClass,
		selectedStudent,
		visibleAssignments,
		loadLeaderboard,
	};
};
