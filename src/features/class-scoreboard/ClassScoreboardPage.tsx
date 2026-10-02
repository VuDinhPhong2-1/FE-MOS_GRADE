import { Icon } from "@bug-on/m3-expressive";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RouteLoadingFallback } from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import { usePageHeader } from "../../context/PageActionsContext";
import { assignmentService } from "../../services/assignment.service";
import { bonusPointService } from "../../services/bonus-point.service";
import { classService } from "../../services/class.service";
import { scoreService } from "../../services/score.service";
import studentService from "../../services/student.service";
import type { Assignment } from "../../types/assignment.types";
import type { ClassBonusSummaryResponse } from "../../types/bonus-point.types";
import type { Class } from "../../types/class.types";
import type { ScoreResponse } from "../../types/score.types";
import type { Student } from "../../types/student.types";
import ScoreboardActionToolbar from "../grading/components/ScoreboardActionToolbar";
import ScoreboardContent from "../grading/components/ScoreboardContent";
import { useScoreboardState } from "../grading/hooks/useScoreboardState";
import type { CompetencyLevel } from "../grading/utils/scoreboardUtils";
import { mapLoadError } from "./utils/classScoreboard.utils";

interface ClassScoreboardLocationState {
	className?: string;
	returnPath?: string;
}

const ClassScoreboardPage = () => {
	const { classId } = useParams<{ classId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { getAccessToken, user } = useAuth();
	const locationState =
		(location.state as ClassScoreboardLocationState | null) ?? null;

	const [classInfo, setClassInfo] = useState<Class | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [scores, setScores] = useState<ScoreResponse[]>([]);
	const [bonusSummary, setBonusSummary] =
		useState<ClassBonusSummaryResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleBack = useCallback(() => {
		if (locationState?.returnPath) {
			navigate(locationState.returnPath);
			return;
		}

		navigate("/schools");
	}, [locationState?.returnPath, navigate]);

	useEffect(() => {
		let active = true;

		const loadData = async () => {
			if (!classId) {
				setError("Thiếu mã lớp để xem bảng điểm.");
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const [classData, studentData, assignmentData, scoreData, bonusData] =
					await Promise.all([
						classService.getClassById(classId, getAccessToken),
						studentService.getStudentsByClassId(classId, getAccessToken),
						assignmentService.getByClass(classId, getAccessToken),
						scoreService.getByClass(classId, getAccessToken),
						bonusPointService
							.getByClass(classId, getAccessToken)
							.catch(() => null),
					]);

				if (!active) {
					return;
				}

				setClassInfo(classData);
				setStudents(studentData);
				setAssignments(assignmentData);
				setScores(scoreData);
				setBonusSummary(bonusData);
			} catch (err: unknown) {
				if (!active) {
					return;
				}

				setError(mapLoadError(err));
			} finally {
				if (active) {
					setIsLoading(false);
				}
			}
		};

		void loadData();
		return () => {
			active = false;
		};
	}, [classId, getAccessToken]);

	const canManageClass = useMemo(() => {
		if (!classInfo || !user) {
			return false;
		}

		if (user.role === "Admin") {
			return true;
		}

		const userId = user.userId || "";
		if (!userId) {
			return false;
		}

		return (
			classInfo.ownerId === userId ||
			Boolean(classInfo.managerTeacherIds?.includes(userId))
		);
	}, [classInfo, user]);

	const classDisplayName =
		locationState?.className || classInfo?.name || classId || "Lớp học";

	usePageHeader(
		{
			title: `Bảng điểm ${classDisplayName}`,
			subtitle: `${students.length} học sinh · ${assignments.length} bài tập`,
			disablePageScroll: true,
			actions: [
				{
					id: "bonus-points",
					label: "Điểm cộng",
					icon: "military_tech",
					onClick: () => navigate(`/classes/${classId}/bonus-points`),
				},
			],
		},
		[classDisplayName, students.length, assignments.length, classId, navigate],
	);

	const scoreboardScores = useMemo(
		() =>
			scores.map((s) => ({
				studentId: s.studentId,
				assignmentId: s.assignmentId,
				assignmentName: s.assignmentName,
				scoreValue: typeof s.scoreValue === "number" ? s.scoreValue : null,
				autoGradingErrors: s.autoGradingErrors || [],
				autoGradingTaskResults: s.autoGradingTaskResults || [],
			})),
		[scores],
	);

	const handleStudentClassificationUpdated = useCallback(
		(studentId: string, classification: CompetencyLevel) => {
			setStudents((prev) =>
				prev.map((student) =>
					student.id === studentId
						? { ...student, competencyLevel: classification }
						: student,
				),
			);
		},
		[],
	);

	const handleStudentNotesUpdated = useCallback(
		(studentId: string, notes: string) => {
			setStudents((prev) =>
				prev.map((student) =>
					student.id === studentId ? { ...student, notes } : student,
				),
			);
		},
		[],
	);

	const scoreboardState = useScoreboardState({
		isOpen: true,
		assignments,
		students,
		scores: scoreboardScores,
		bonusSummary,
		classDisplayName,
		title: `Bảng điểm lớp ${classDisplayName}`,
		onStudentClassificationUpdated: handleStudentClassificationUpdated,
		onStudentNotesUpdated: handleStudentNotesUpdated,
	});

	if (isLoading) {
		return <RouteLoadingFallback message="Đang tải bảng điểm lớp..." />;
	}

	if (error) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3 rounded-2xl bg-m3-error-container p-4 text-xs font-medium text-m3-on-error-container">
					<Icon name="warning" className="text-xl shrink-0" />
					<span>{error}</span>
				</div>
			</div>
		);
	}

	if (!canManageClass) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3 rounded-2xl bg-amber-500/15 p-4 text-xs font-medium text-amber-700 dark:text-amber-300">
					<Icon name="lock" className="text-xl shrink-0" />
					<span>
						Bạn chỉ có quyền xem lớp này, không có quyền mở bảng điểm đầy đủ.
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex-1 min-h-0 flex flex-col overflow-hidden p-3.5 sm:p-5 pb-24 sm:pb-24 lg:pb-22">
			<ScoreboardContent
				state={scoreboardState}
				hideInlineSearch
				tableMaxHeightClassName="flex-1 min-h-0"
			/>

			{/* FloatingActionToolbar hợp nhất với đầy đủ action buttons, sort, xuất file & tìm kiếm */}
			<ScoreboardActionToolbar state={scoreboardState} onBack={handleBack} />
		</div>
	);
};

export default ClassScoreboardPage;
