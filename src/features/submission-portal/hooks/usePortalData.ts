import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type {
	PublicPortalAssignment,
	PublicPortalClass,
	PublicPortalInfo,
	PublicPortalStudent,
	SubmissionLeaderboardItem,
} from "../../../types/submission-portal.types";

export interface UsePortalDataOptions {
	onResetStudentSearch?: () => void;
	isLeaderboardActive?: boolean;
}

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
	isRefreshingLeaderboard: boolean;
	lastLeaderboardUpdated: Date | null;
	autoRefreshLeaderboard: boolean;
	setAutoRefreshLeaderboard: (enabled: boolean) => void;
	selectedClass: PublicPortalClass | undefined;
	selectedStudent: PublicPortalStudent | undefined;
	visibleAssignments: PublicPortalAssignment[];
	loadLeaderboard: (silent?: boolean) => Promise<void>;
}

/**
 * Fast item-level diffing to avoid unnecessary state mutations and component re-renders
 * when polling fetches identical leaderboard data.
 */
const isLeaderboardEqual = (
	prev: SubmissionLeaderboardItem[],
	next: SubmissionLeaderboardItem[],
): boolean => {
	if (prev === next) return true;
	if (prev.length !== next.length) return false;
	for (let i = 0; i < prev.length; i++) {
		const a = prev[i];
		const b = next[i];
		if (
			a.studentId !== b.studentId ||
			a.scoreValue !== b.scoreValue ||
			a.rank !== b.rank ||
			a.submissionCount !== b.submissionCount ||
			a.gradedAt !== b.gradedAt
		) {
			return false;
		}
	}
	return true;
};

export const usePortalData = (
	token: string,
	optionsOrReset?: (() => void) | UsePortalDataOptions,
): UsePortalDataReturn => {
	const options: UsePortalDataOptions =
		typeof optionsOrReset === "function"
			? { onResetStudentSearch: optionsOrReset }
			: optionsOrReset || {};
	const { onResetStudentSearch, isLeaderboardActive = true } = options;

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
	const leaderboardRef = useRef<SubmissionLeaderboardItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingStudents, setLoadingStudents] = useState(false);
	const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
	const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false);
	const [lastLeaderboardUpdated, setLastLeaderboardUpdated] =
		useState<Date | null>(null);
	const [autoRefreshLeaderboard, setAutoRefreshLeaderboard] = useState(true);
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
			if (savedStudentId && studentList.some((s) => s.id === savedStudentId)) {
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

	const loadLeaderboard = useCallback(
		async (silent = false) => {
			if (silent) {
				setIsRefreshingLeaderboard(true);
			} else {
				setLoadingLeaderboard(true);
			}
			try {
				const data = await submissionPortalService.getLeaderboard(
					token,
					classId || undefined,
				);
				// Client optimization: only update state if leaderboard data actually changed
				if (!isLeaderboardEqual(leaderboardRef.current, data)) {
					leaderboardRef.current = data;
					setLeaderboard(data);
					setLastLeaderboardUpdated(new Date());
				} else if (!silent) {
					// Manual user refresh triggered: update timestamp so user knows fresh sync happened
					setLastLeaderboardUpdated(new Date());
				}
			} catch {
				if (!silent) {
					leaderboardRef.current = [];
					setLeaderboard([]);
				}
			} finally {
				if (silent) {
					setIsRefreshingLeaderboard(false);
				} else {
					setLoadingLeaderboard(false);
				}
			}
		},
		[classId, token],
	);

	useEffect(() => {
		void loadInfo();
	}, [loadInfo]);

	useEffect(() => {
		void loadStudents();
	}, [loadStudents]);

	// Initial load of leaderboard
	useEffect(() => {
		if (info?.showLeaderboard) {
			void loadLeaderboard(false);
		}
	}, [info?.showLeaderboard, loadLeaderboard]);

	// Fetch immediately when user switches to the leaderboard tab
	useEffect(() => {
		if (info?.showLeaderboard && isLeaderboardActive) {
			void loadLeaderboard(true);
		}
	}, [info?.showLeaderboard, isLeaderboardActive, loadLeaderboard]);

	// Real-time silent background auto-polling (every 6s) ONLY when leaderboard is active, visible, and enabled
	useEffect(() => {
		if (
			!info?.showLeaderboard ||
			!autoRefreshLeaderboard ||
			!isLeaderboardActive
		) {
			return;
		}

		const intervalId = window.setInterval(() => {
			if (document.visibilityState === "visible") {
				void loadLeaderboard(true);
			}
		}, 6000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [
		info?.showLeaderboard,
		autoRefreshLeaderboard,
		isLeaderboardActive,
		loadLeaderboard,
	]);

	// Refresh immediately on tab visibility switch or cross-tab submission broadcast
	useEffect(() => {
		if (!info?.showLeaderboard) {
			return;
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible" && isLeaderboardActive) {
				void loadLeaderboard(true);
			}
		};

		let channel: BroadcastChannel | null = null;
		try {
			channel = new BroadcastChannel("mos_portal_realtime");
			channel.onmessage = (event) => {
				if (event.data?.type === "SUBMISSION_COMPLETED") {
					void loadLeaderboard(true);
				}
			};
		} catch {}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (channel) {
				channel.close();
			}
		};
	}, [info?.showLeaderboard, isLeaderboardActive, loadLeaderboard]);

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
		isRefreshingLeaderboard,
		lastLeaderboardUpdated,
		autoRefreshLeaderboard,
		setAutoRefreshLeaderboard,
		selectedClass,
		selectedStudent,
		visibleAssignments,
		loadLeaderboard,
	};
};
