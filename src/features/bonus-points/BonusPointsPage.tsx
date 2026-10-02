// src/features/bonus-points/BonusPointsPage.tsx
import {
	Button,
	Card,
	Chip,
	Icon,
	IconButton,
	LoadingIndicator,
	Tab,
	Tabs,
	TabsContent,
	TabsList,
	useSnackbar,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { bonusPointService } from "../../services/bonus-point.service";
import { classService } from "../../services/class.service";
import studentService from "../../services/student.service";
import type {
	BonusPointResponse,
	StudentBonusPointSummary,
} from "../../types/bonus-point.types";
import type { Class } from "../../types/class.types";
import type { Student } from "../../types/student.types";
import { BonusEntryTable } from "./BonusEntryTable";
import { BonusSummaryTable } from "./BonusSummaryTable";
import { StudentBonusHistoryDialog } from "./StudentBonusHistoryDialog";

const getTodayYmd = () => {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

export const BonusPointsPage: React.FC = () => {
	const { classId } = useParams<{ classId: string }>();
	const navigate = useNavigate();
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const [activeTab, setActiveTab] = useState<string>("daily");
	const [selectedDate, setSelectedDate] = useState<string>(getTodayYmd());
	const [classInfo, setClassInfo] = useState<Class | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [classSummary, setClassSummary] = useState<StudentBonusPointSummary[]>(
		[],
	);

	// Daily items draft: studentId -> { points, category, reason }
	const [dailyDraft, setDailyDraft] = useState<
		Record<string, { points: number; category: string; reason: string }>
	>({});
	const [defaultCategory, setDefaultCategory] = useState("participation");
	const [dailySearchQuery, setDailySearchQuery] = useState("");
	const [summarySearchQuery, setSummarySearchQuery] = useState("");

	// History dialog state
	const [historyStudent, setHistoryStudent] =
		useState<StudentBonusPointSummary | null>(null);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [isDeletingEntry, setIsDeletingEntry] = useState(false);

	const [loading, setLoading] = useState(true);
	const [isSavingDaily, setIsSavingDaily] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Load class & student info & overall summary
	const loadClassData = useCallback(async () => {
		if (!classId) return;
		try {
			const [classRes, studentRes, summaryRes] = await Promise.all([
				classService.getClassById(classId, getAccessToken),
				studentService.getStudentsByClassId(classId, getAccessToken),
				bonusPointService.getByClass(classId, getAccessToken),
			]);

			setClassInfo(classRes);

			const activeStudents = Array.isArray(studentRes)
				? studentRes.filter(
						(s: Student) =>
							s.isActive !== false &&
							(s.status || "").toLowerCase() !== "inactive",
					)
				: [];
			setStudents(activeStudents);
			setClassSummary(summaryRes.students || []);
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Không thể tải thông tin lớp học.";
			setErrorMessage(msg);
		}
	}, [classId, getAccessToken]);

	// Load daily entries when date changes
	const loadDailyData = useCallback(async () => {
		if (!classId || !selectedDate) return;
		try {
			const existingPoints = await bonusPointService.getByClassAndDate(
				classId,
				selectedDate,
				getAccessToken,
			);

			const draftMap: Record<
				string,
				{ points: number; category: string; reason: string }
			> = {};

			(existingPoints || []).forEach((bp: BonusPointResponse) => {
				draftMap[bp.studentId] = {
					points: (draftMap[bp.studentId]?.points || 0) + bp.points,
					category: bp.category || "participation",
					reason: bp.reason || draftMap[bp.studentId]?.reason || "",
				};
			});

			setDailyDraft(draftMap);
		} catch {
			setDailyDraft({});
		}
	}, [classId, selectedDate, getAccessToken]);

	useEffect(() => {
		const init = async () => {
			setLoading(true);
			await loadClassData();
			await loadDailyData();
			setLoading(false);
		};
		void init();
	}, [loadClassData, loadDailyData]);

	// Update draft entry
	const handleChangeDailyItem = useCallback(
		(
			studentId: string,
			updates: Partial<{ points: number; category: string; reason: string }>,
		) => {
			setDailyDraft((prev) => ({
				...prev,
				[studentId]: {
					points:
						updates.points !== undefined
							? updates.points
							: (prev[studentId]?.points ?? 0),
					category:
						updates.category !== undefined
							? updates.category
							: (prev[studentId]?.category ?? defaultCategory),
					reason:
						updates.reason !== undefined
							? updates.reason
							: (prev[studentId]?.reason ?? ""),
				},
			}));
		},
		[defaultCategory],
	);

	// Save daily bonus entries
	const handleSaveDaily = useCallback(async () => {
		if (!classId) return;

		const itemsToSave = Object.entries(dailyDraft)
			.filter(([_, item]) => item.points !== 0 || item.reason.trim() !== "")
			.map(([studentId, item]) => ({
				studentId,
				points: item.points,
				category: item.category || defaultCategory,
				reason: item.reason.trim() || undefined,
			}));

		if (itemsToSave.length === 0) {
			showSnackbar({
				message: "Chưa có học sinh nào có điểm cộng để lưu.",
			});
			return;
		}

		setIsSavingDaily(true);
		try {
			await bonusPointService.bulkCreate(
				{
					classId,
					date: selectedDate,
					items: itemsToSave,
				},
				getAccessToken,
			);

			showSnackbar({
				message: `Đã lưu điểm cộng cho ${itemsToSave.length} học sinh thành công!`,
			});

			// Refresh summary & daily
			await Promise.all([loadClassData(), loadDailyData()]);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Lỗi khi lưu điểm cộng.";
			showSnackbar({
				message: msg,
			});
		} finally {
			setIsSavingDaily(false);
		}
	}, [
		classId,
		selectedDate,
		dailyDraft,
		defaultCategory,
		getAccessToken,
		showSnackbar,
		loadClassData,
		loadDailyData,
	]);

	// View student bonus history
	const handleViewHistory = useCallback((student: StudentBonusPointSummary) => {
		setHistoryStudent(student);
		setIsHistoryOpen(true);
	}, []);

	// Delete a bonus entry
	const handleDeleteEntry = useCallback(
		async (entryId: string) => {
			setIsDeletingEntry(true);
			try {
				await bonusPointService.delete(entryId, getAccessToken);
				showSnackbar({
					message: "Xóa bản ghi điểm cộng thành công!",
				});

				// Refresh summary and history dialog
				if (classId) {
					const updatedSummaryRes = await bonusPointService.getByClass(
						classId,
						getAccessToken,
					);
					setClassSummary(updatedSummaryRes.students || []);

					if (historyStudent) {
						const updated = updatedSummaryRes.students.find(
							(s) => s.studentId === historyStudent.studentId,
						);
						setHistoryStudent(updated || null);
					}
				}
				await loadDailyData();
			} catch (err: unknown) {
				const msg =
					err instanceof Error ? err.message : "Không thể xóa bản ghi.";
				showSnackbar({
					message: msg,
				});
			} finally {
				setIsDeletingEntry(false);
			}
		},
		[classId, getAccessToken, historyStudent, showSnackbar, loadDailyData],
	);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
				<LoadingIndicator size={40} aria-label="Đang tải điểm cộng" />
				<p className="text-sm font-medium text-m3-on-surface-variant">
					Đang tải dữ liệu điểm cộng...
				</p>
			</div>
		);
	}

	if (errorMessage || !classInfo) {
		return (
			<Card
				variant="filled"
				className="p-8 text-center max-w-lg mx-auto mt-12 rounded-m3-xl bg-m3-error-container/20 border border-m3-error/30"
			>
				<Icon name="error" size={48} className="mx-auto text-m3-error mb-3" />
				<h2 className="text-lg font-bold text-m3-on-surface mb-2">
					Không thể tải trang điểm cộng
				</h2>
				<p className="text-sm text-m3-on-surface-variant mb-6">
					{errorMessage || "Không tìm thấy thông tin lớp học."}
				</p>
				<Button colorStyle="filled" onClick={() => navigate(-1)}>
					Quay lại
				</Button>
			</Card>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6 max-w-7xl animate-fadeIn">
			{/* Top Header Card */}
			<Card
				variant="filled"
				className="p-4 sm:p-5 rounded-m3-xl mb-6 bg-m3-surface-container-low border border-m3-outline-variant/40"
			>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<IconButton
							size="md"
							onClick={() => navigate(-1)}
							aria-label="Quay lại"
							className="text-m3-on-surface-variant hover:bg-m3-surface-container-high"
						>
							<Icon name="arrow_back" size={24} />
						</IconButton>

						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="text-xl sm:text-2xl font-bold text-m3-on-surface">
									Quản lý Điểm cộng
								</h1>
								<Chip
									variant="assist"
									label={classInfo.name}
									leadingIcon={
										<Icon name="class" size={16} className="text-m3-primary" />
									}
									className="pointer-events-none h-6 px-2.5 text-xs font-semibold"
								/>
							</div>
							<p className="text-sm text-m3-on-surface-variant mt-0.5">
								Ghi nhận điểm cộng trực tiếp trên lớp và theo dõi bảng xếp hạng
								tổng hợp.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							colorStyle="tonal"
							onClick={() => navigate(`/scores/class/${classId}`)}
						>
							<Icon name="leaderboard" size={18} className="mr-1.5" />
							Bảng điểm & Xếp hạng
						</Button>
					</div>
				</div>
			</Card>

			{/* Tabs Section */}
			<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)}>
				<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
					<TabsList variant="primary">
						<Tab value="daily">
							<Icon name="edit_calendar" size={18} className="mr-1.5" />
							Nhập theo ngày
						</Tab>
						<Tab value="summary">
							<Icon name="summarize" size={18} className="mr-1.5" />
							Tổng hợp toàn lớp
						</Tab>
					</TabsList>

					{activeTab === "daily" && (
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold text-m3-on-surface-variant">
								Ngày:
							</span>
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								className="h-10 px-3 rounded-m3-md border border-m3-outline-variant bg-m3-surface text-m3-on-surface text-sm font-medium focus:outline-hidden focus:border-m3-primary"
							/>
						</div>
					)}
				</div>

				{/* Tab 1: Daily Entry */}
				<TabsContent value="daily">
					<BonusEntryTable
						students={students}
						items={dailyDraft}
						onChangeItem={handleChangeDailyItem}
						onSaveAll={handleSaveDaily}
						isSaving={isSavingDaily}
						searchQuery={dailySearchQuery}
						onSearchChange={setDailySearchQuery}
						defaultCategory={defaultCategory}
						onDefaultCategoryChange={setDefaultCategory}
					/>
				</TabsContent>

				{/* Tab 2: Summary */}
				<TabsContent value="summary">
					<BonusSummaryTable
						summary={classSummary}
						onViewHistory={handleViewHistory}
						searchQuery={summarySearchQuery}
						onSearchChange={setSummarySearchQuery}
					/>
				</TabsContent>
			</Tabs>

			{/* History Dialog */}
			<StudentBonusHistoryDialog
				open={isHistoryOpen}
				student={historyStudent}
				onClose={() => {
					setIsHistoryOpen(false);
					setHistoryStudent(null);
				}}
				onDeleteEntry={handleDeleteEntry}
				isDeleting={isDeletingEntry}
			/>
		</div>
	);
};
