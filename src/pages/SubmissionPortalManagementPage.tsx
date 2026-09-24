import { useCallback, useEffect, useMemo, useState } from "react";
import { RouteLoadingFallback, showConfirm } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { usePageHeader } from "../context/PageActionsContext";
import { assignmentService } from "../services/assignment.service";
import { classService } from "../services/class.service";
import { schoolService } from "../services/school.service";
import { submissionPortalService } from "../services/submission-portal.service";
import type { Assignment } from "../types/assignment.types";
import type { Class } from "../types/class.types";
import type { School } from "../types/school.types";
import type {
	SubmissionAlert,
	SubmissionLog,
	SubmissionPortal,
} from "../types/submission-portal.types";

type ScoringPolicy = "BestScore" | "LatestScore";

const formatDateTime = (value?: string) =>
	value ? new Date(value).toLocaleString("vi-VN") : "Không giới hạn";
const subjectBadge = (subject?: string) => subject?.toUpperCase() || "AUTO";
const hasAutoGradingEndpoint = (assignment: Assignment) => {
	const gradingType = String(assignment.gradingType || "")
		.trim()
		.toLowerCase();
	const endpoint = assignment.gradingApiEndpoint?.trim();

	return Boolean(endpoint) && (!gradingType || gradingType === "auto");
};
const severityTone = (severity: string) =>
	severity.toLowerCase().includes("high")
		? "border-rose-200 bg-rose-50 text-rose-800"
		: severity.toLowerCase().includes("medium")
			? "border-amber-200 bg-amber-50 text-amber-800"
			: "border-blue-200 bg-blue-50 text-blue-800";

const severityLabel = (severity: string) => {
	const normalized = severity.toLowerCase();
	if (normalized.includes("high")) return "Nghiêm trọng";
	if (normalized.includes("medium")) return "Cần kiểm tra";
	return "Thông tin";
};

type PageMessage = {
	type: "success" | "warning" | "error" | "info";
	text: string;
};

const messageTone: Record<PageMessage["type"], string> = {
	success: "border-emerald-200 bg-emerald-50 text-emerald-900",
	warning: "border-amber-200 bg-amber-50 text-amber-900",
	error: "border-rose-200 bg-rose-50 text-rose-900",
	info: "border-blue-200 bg-blue-50 text-blue-900",
};

const SubmissionPortalManagementPage = () => {
	const { getAccessToken } = useAuth();
	const [schools, setSchools] = useState<School[]>([]);
	const [classes, setClasses] = useState<Class[]>([]);
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [portals, setPortals] = useState<SubmissionPortal[]>([]);
	const [selectedSchoolId, setSelectedSchoolId] = useState("");
	const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
	const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
		[],
	);
	const [title, setTitle] = useState("Link nộp bài thực hành");
	const [description, setDescription] = useState("");
	const [maxSubmissions, setMaxSubmissions] = useState(0);
	const [scoringPolicy, setScoringPolicy] =
		useState<ScoringPolicy>("BestScore");
	const [showLeaderboard, setShowLeaderboard] = useState(true);
	const [showDetailedFeedback, setShowDetailedFeedback] = useState(true);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingPortal, setEditingPortal] = useState<SubmissionPortal | null>(null);
	const [selectedPortal, setSelectedPortal] = useState<SubmissionPortal | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [loadingClasses, setLoadingClasses] = useState(false);
	const [loadingAssignments, setLoadingAssignments] = useState(false);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [message, setMessage] = useState<PageMessage | null>(null);
	const [alerts, setAlerts] = useState<SubmissionAlert[]>([]);
	const [logs, setLogs] = useState<SubmissionLog[]>([]);
	const publicOrigin = window.location.origin;

	usePageHeader(
		{
			title: "Cổng nộp bài công khai",
			subtitle:
				"Tạo link nộp bài tự động chấm, chia sẻ cho học sinh và theo dõi cảnh báo.",
			actions: [
				{
					id: "create-submission-portal",
					label: "Tạo link",
					icon: "add_link",
					colorStyle: "filled",
					onClick: () => setIsCreateOpen(true),
				},
			],
		},
		[],
	);

	const filteredAssignments = useMemo(
		() => assignments.filter((a) => selectedClassIds.includes(a.classId)),
		[assignments, selectedClassIds],
	);
	const classNameById = useMemo(
		() => new Map(classes.map((cls) => [cls.id, cls.name])),
		[classes],
	);
	const selectedClassNames = useMemo(
		() =>
			selectedClassIds
				.map((classId) => classNameById.get(classId))
				.filter(Boolean)
				.join(", "),
		[classNameById, selectedClassIds],
	);
	const selectedSchoolName = useMemo(
		() => schools.find((school) => school.id === selectedSchoolId)?.name || "",
		[schools, selectedSchoolId],
	);
	const visiblePortals = useMemo(
		() => portals.filter((portal) => portal.isActive),
		[portals],
	);
	const stats = useMemo(
		() => ({
			active: visiblePortals.length,
			totalAlerts: visiblePortals.reduce(
				(s, p) => s + (p.unreadAlertCount || 0),
				0,
			),
			scopedAssignments: visiblePortals.reduce(
				(s, p) => s + p.assignmentIds.length,
				0,
			),
		}),
		[visiblePortals],
	);

	const loadInitial = useCallback(async () => {
		setLoading(true);
		try {
			const [schoolList, portalList] = await Promise.all([
				schoolService.getSchools(getAccessToken),
				submissionPortalService.getAll(getAccessToken),
			]);
			setSchools(schoolList.filter((school) => school.isActive !== false));
			setPortals(portalList);
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Không thể tải dữ liệu",
			});
		} finally {
			setLoading(false);
		}
	}, [getAccessToken]);

	const loadClassesBySelectedSchool = useCallback(async () => {
		if (!selectedSchoolId) {
			setClasses([]);
			setSelectedClassIds([]);
			setAssignments([]);
			setSelectedAssignmentIds([]);
			return;
		}

		setLoadingClasses(true);
		try {
			const classList = await classService.getClassesBySchool(
				selectedSchoolId,
				getAccessToken,
				false,
			);
			setClasses(classList.filter((cls) => cls.isActive !== false));
		} catch (error) {
			setMessage({
				type: "error",
				text:
					error instanceof Error ? error.message : "Không thể tải danh sách lớp",
			});
		} finally {
			setLoadingClasses(false);
		}
	}, [getAccessToken, selectedSchoolId]);

	const loadAssignments = useCallback(async () => {
		if (selectedClassIds.length === 0) {
			setAssignments([]);
			setSelectedAssignmentIds([]);
			return;
		}
		setLoadingAssignments(true);
		try {
			const results = await Promise.all(
				selectedClassIds.map((classId) =>
					assignmentService.getByClass(classId, getAccessToken),
				),
			);
			setAssignments(
				results
					.flat()
					.filter((assignment) => hasAutoGradingEndpoint(assignment)),
			);
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Không thể tải bài tập",
			});
		} finally {
			setLoadingAssignments(false);
		}
	}, [getAccessToken, selectedClassIds]);

	useEffect(() => {
		void loadInitial();
	}, [loadInitial]);
	useEffect(() => {
		void loadClassesBySelectedSchool();
	}, [loadClassesBySelectedSchool]);
	useEffect(() => {
		void loadAssignments();
	}, [loadAssignments]);

	const toggle = (
		id: string,
		items: string[],
		setter: (value: string[]) => void,
	) =>
		setter(items.includes(id) ? items.filter((x) => x !== id) : [...items, id]);

	const handleSchoolChange = (schoolId: string) => {
		setSelectedSchoolId(schoolId);
		setSelectedClassIds([]);
		setSelectedAssignmentIds([]);
		setAssignments([]);
	};

	const createPortal = async () => {
		if (
			!title.trim() ||
			!selectedSchoolId ||
			selectedClassIds.length === 0 ||
			selectedAssignmentIds.length === 0
		) {
			setMessage({
				type: "warning",
				text: "Vui lòng nhập tiêu đề, chọn trường, ít nhất một lớp và một bài tập.",
			});
			return;
		}
		setLoading(true);
		setMessage(null);
		try {
			await submissionPortalService.create(
				{
					title: title.trim(),
					description: description.trim(),
					classIds: selectedClassIds,
					assignmentIds: selectedAssignmentIds,
					maxSubmissionsPerStudent: maxSubmissions,
					scoringPolicy,
					showLeaderboard,
					showDetailedFeedback,
				},
				getAccessToken,
			);
			setSelectedAssignmentIds([]);
			setDescription("");
			setIsCreateOpen(false);
			setMessage({ type: "success", text: "Đã tạo link nộp bài." });
			setPortals(await submissionPortalService.getAll(getAccessToken));
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Không thể tạo link",
			});
		} finally {
			setLoading(false);
		}
	};

	const openEdit = (portal: SubmissionPortal) => {
		setEditingPortal(portal);
		setTitle(portal.title);
		setDescription(portal.description || "");
		setMaxSubmissions(portal.maxSubmissionsPerStudent);
		setScoringPolicy(portal.scoringPolicy);
		setShowLeaderboard(portal.showLeaderboard);
		setShowDetailedFeedback(portal.showDetailedFeedback);
		setMessage(null);
	};

	const closeEdit = () => {
		setEditingPortal(null);
		setTitle("Link nộp bài thực hành");
		setDescription("");
		setMaxSubmissions(0);
		setScoringPolicy("BestScore");
		setShowLeaderboard(true);
		setShowDetailedFeedback(true);
	};

	const updatePortal = async (isActive: boolean) => {
		if (!editingPortal) return;
		if (!title.trim()) {
			setMessage({ type: "warning", text: "Vui lòng nhập tiêu đề link nộp bài." });
			return;
		}

		setLoading(true);
		setMessage(null);
		try {
			await submissionPortalService.update(
				editingPortal.id,
				{
					title: title.trim(),
					description: description.trim(),
					classIds: editingPortal.classIds,
					assignmentIds: editingPortal.assignmentIds,
					startsAt: editingPortal.startsAt,
					endsAt: editingPortal.endsAt,
					maxSubmissionsPerStudent: maxSubmissions,
					scoringPolicy,
					showLeaderboard,
					showDetailedFeedback,
					isActive,
				},
				getAccessToken,
			);
			closeEdit();
			setMessage({ type: "success", text: "Đã cập nhật link nộp bài." });
			setPortals(await submissionPortalService.getAll(getAccessToken));
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Không thể cập nhật link",
			});
		} finally {
			setLoading(false);
		}
	};

	const deletePortal = async (portal: SubmissionPortal) => {
		const ok = await showConfirm({
			title: "Đóng link nộp bài?",
			message: `Đóng link "${portal.title}"? Học sinh sẽ không thể nộp bài qua link này nữa.`,
			description: "Dữ liệu lịch sử nộp và điểm đã lưu vẫn được giữ nguyên.",
			confirmLabel: "Đóng link",
			cancelLabel: "Hủy",
			variant: "destructive",
			icon: "link_off",
		});
		if (!ok) return;

		setLoading(true);
		setMessage(null);
		try {
			await submissionPortalService.delete(portal.id, getAccessToken);
			setMessage({ type: "success", text: "Đã đóng link nộp bài." });
			setPortals(await submissionPortalService.getAll(getAccessToken));
			if (selectedPortal?.id === portal.id) setSelectedPortal(null);
			if (editingPortal?.id === portal.id) closeEdit();
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Không thể đóng link",
			});
		} finally {
			setLoading(false);
		}
	};

	const copyText = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setMessage({ type: "success", text: "Đã sao chép link vào bộ nhớ tạm." });
		} catch {
			setMessage({
				type: "warning",
				text: "Trình duyệt không cho phép sao chép tự động. Hãy chọn link và sao chép thủ công.",
			});
		}
	};

	const openDetails = async (portal: SubmissionPortal) => {
		setSelectedPortal(portal);
		setLoadingDetails(true);
		try {
			const [portalAlerts, portalLogs] = await Promise.all([
				submissionPortalService.getAlerts(portal.id, getAccessToken),
				submissionPortalService.getLogs(portal.id, getAccessToken),
			]);
			setAlerts(portalAlerts);
			setLogs(portalLogs);
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Không thể mở chi tiết",
			});
		} finally {
			setLoadingDetails(false);
		}
	};

	const exportLogsCsv = () => {
		const header = [
			"Học sinh",
			"Lớp",
			"Bài tập",
			"Điểm",
			"IP",
			"Tệp",
			"Thời gian nộp",
		];
		const rows = logs.map((log) => [
			log.studentName,
			log.className,
			log.assignmentName,
			`${log.scoreValue ?? ""}/${log.maxScore}`,
			log.ipAddress || "",
			log.fileName || "",
			formatDateTime(log.submittedAt),
		]);
		const csv = [header, ...rows]
			.map((row) =>
				row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
			)
			.join("\n");
		const url = URL.createObjectURL(
			new Blob([csv], { type: "text/csv;charset=utf-8" }),
		);
		const a = document.createElement("a");
		a.href = url;
		a.download = `submission-logs-${selectedPortal?.publicToken || "portal"}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading && visiblePortals.length === 0)
		return <RouteLoadingFallback message="Đang tải cổng nộp bài..." />;

	return (
		<div className="space-y-6">
			{message && (
				<div
					className={`flex items-start justify-between gap-3 rounded-3xl border p-4 text-sm font-medium ${messageTone[message.type]}`}
				>
					<span>{message.text}</span>
					<button
						type="button"
						className="shrink-0 font-black opacity-70 hover:opacity-100"
						onClick={() => setMessage(null)}
						aria-label="Đóng thông báo"
					>
						×
					</button>
				</div>
			)}
			<section className="grid gap-4 md:grid-cols-3">
				<div className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">
					<p className="text-sm text-emerald-100">Link đang mở</p>
					<p className="mt-2 text-4xl font-black">{stats.active}</p>
				</div>
				<div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
					<p className="text-sm text-slate-300">Bài tập đã chia sẻ</p>
					<p className="mt-2 text-4xl font-black">{stats.scopedAssignments}</p>
				</div>
				<div className="rounded-3xl bg-rose-600 p-5 text-white shadow-sm">
					<p className="text-sm text-rose-100">Cảnh báo chưa đọc</p>
					<p className="mt-2 text-4xl font-black">{stats.totalAlerts}</p>
				</div>
			</section>
			<section className="rounded-3xl border bg-white p-5 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-black">Danh sách cổng nộp bài</h2>
						<p className="text-sm text-slate-500">
							Sao chép link, xem thử trang học sinh và kiểm tra cảnh báo.
						</p>
					</div>
					<button
						type="button"
						className="rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white"
						onClick={() => setIsCreateOpen(true)}
					>
						Tạo link
					</button>
				</div>
				<div className="mt-5 grid gap-4 xl:grid-cols-2">
					{visiblePortals.map((portal) => {
						const url = `${publicOrigin}/submit/${portal.publicToken}`;
						return (
							<article
								key={portal.id}
								className="rounded-3xl border border-slate-200 p-5"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div className="flex flex-wrap gap-2">
											<span
												className={`rounded-full px-3 py-1 text-xs font-bold ${portal.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
											>
												{portal.isActive ? "Đang mở" : "Đã đóng"}
											</span>
											{portal.unreadAlertCount > 0 && (
												<span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
													{portal.unreadAlertCount} cảnh báo
												</span>
											)}
										</div>
										<h3 className="mt-3 text-lg font-black">{portal.title}</h3>
										{portal.description && (
											<p className="mt-1 text-sm text-slate-600">
												{portal.description}
											</p>
										)}
									</div>
									<div className="text-right text-xs text-slate-500">
										Ngày tạo
										<br />
										{formatDateTime(portal.createdAt)}
									</div>
								</div>
								<div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
									<span>{portal.classIds.length} lớp</span>
									<span>{portal.assignmentIds.length} bài tập</span>
									<span>
										{portal.scoringPolicy === "BestScore"
											? "Điểm cao nhất"
											: "Điểm mới nhất"}
									</span>
								</div>
								<div className="mt-4 rounded-2xl bg-slate-50 p-3">
									<div className="break-all text-sm font-semibold text-slate-700">
										{url}
									</div>
									<div className="mt-3 flex flex-wrap gap-2">
										<button
											type="button"
											className="rounded-xl border px-3 py-2 text-sm font-bold"
											onClick={() => void copyText(url)}
										>
											Sao chép
										</button>
										<button
											type="button"
											className="rounded-xl border px-3 py-2 text-sm font-bold"
											onClick={() =>
												window.open(url, "_blank", "noopener,noreferrer")
											}
										>
											Xem thử
										</button>
										<button
											type="button"
											className="rounded-xl border px-3 py-2 text-sm font-bold"
											onClick={() => void copyText(url)}
										>
											Sao chép để tạo QR
										</button>
										<button
											type="button"
											className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white"
											onClick={() => void openDetails(portal)}
										>
											Chi tiết
										</button>
										<button
											type="button"
											className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700"
											onClick={() => openEdit(portal)}
										>
											Sửa
										</button>
										<button
											type="button"
											disabled={loading}
											className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 disabled:text-slate-400"
											onClick={() => void deletePortal(portal)}
										>
							Đóng link
										</button>
									</div>
								</div>
							</article>
						);
					})}
					{visiblePortals.length === 0 && (
						<div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 xl:col-span-2">
							<div className="text-4xl">🔗</div>
							<p className="mt-3 text-lg font-black text-slate-900">
								Chưa có link nộp bài đang mở
							</p>
							<p className="mt-1 text-sm">
								Tạo link mới để học sinh chọn lớp, chọn tên và nộp file tự chấm.
							</p>
							<button
								type="button"
								className="mt-4 rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white"
								onClick={() => setIsCreateOpen(true)}
							>
								Tạo link đầu tiên
							</button>
						</div>
					)}
				</div>
			</section>
			{selectedPortal && (
				<section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
					<div className="rounded-3xl border bg-white p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-lg font-black">Cảnh báo nghi vấn</h2>
								<p className="text-sm text-slate-500">{selectedPortal.title}</p>
							</div>
							<button
								type="button"
								className="rounded-xl border px-3 py-2 text-sm font-bold"
								onClick={() => setSelectedPortal(null)}
							>
								Đóng
							</button>
						</div>
						{loadingDetails && (
							<div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
								Đang tải cảnh báo và lịch sử nộp bài...
							</div>
						)}
						<div className="mt-4 space-y-3">
							{alerts.map((alert) => (
								<div
									key={alert.id}
									className={`rounded-2xl border p-4 ${severityTone(alert.severity)}`}
								>
									<div className="flex justify-between gap-2">
										<span className="text-xs font-black uppercase">
											{severityLabel(alert.severity)}
										</span>
										<span className="text-xs">
											{formatDateTime(alert.createdAt)}
										</span>
									</div>
									<p className="mt-2 text-sm font-medium">{alert.message}</p>
									{alert.involvedStudents?.length ? (
										<div className="mt-3 rounded-2xl bg-white/70 p-3 text-slate-800">
											<p className="text-xs font-black uppercase text-slate-500">
												Học sinh liên quan
											</p>
											<div className="mt-2 space-y-2">
												{alert.involvedStudents.map((student) => (
													<div
														key={`${alert.id}-${student.studentId}-${student.submittedAt || "latest"}`}
														className="rounded-xl border border-slate-200 bg-white p-3"
													>
														<div className="flex flex-wrap items-start justify-between gap-2">
															<div>
																<p className="font-black text-slate-950">
																	{student.studentName || "(Không rõ học sinh)"}
																</p>
																<p className="text-xs text-slate-500">
																	{student.className || "Chưa rõ lớp"}
																	{student.assignmentName
																		? ` · ${student.assignmentName}`
																		: ""}
																</p>
															</div>
															{student.scoreValue !== undefined && (
																<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
																	{student.scoreValue}/
																	{student.maxScore ?? "--"}
																</span>
															)}
														</div>
														<div className="mt-2 grid gap-1 text-xs text-slate-600">
															<p>Tệp: {student.fileName || "--"}</p>
															<p>IP: {student.ipAddress || "--"}</p>
															<p>
																Nộp lúc: {formatDateTime(student.submittedAt)}
															</p>
														</div>
													</div>
												))}
											</div>
										</div>
									) : (
										<p className="mt-3 rounded-xl bg-white/70 p-3 text-xs text-slate-700">
											Chưa có dữ liệu tên học sinh cho cảnh báo này. Vui lòng
											đối chiếu bảng “Lượt nộp gần đây” theo thời gian/IP/tệp.
										</p>
									)}
								</div>
							))}
							{alerts.length === 0 && !loadingDetails && (
								<p className="rounded-2xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-800">
									Không có cảnh báo.
								</p>
							)}
						</div>
					</div>
					<div className="rounded-3xl border bg-white p-5 shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-lg font-black">Lượt nộp gần đây</h2>
								<p className="text-sm text-slate-500">
									Xem lại tệp, IP và điểm số.
								</p>
							</div>
							<button
								type="button"
								disabled={logs.length === 0}
								className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300"
								onClick={exportLogsCsv}
							>
								Xuất CSV
							</button>
						</div>
						<div className="mt-4 overflow-auto">
							<table className="w-full min-w-[820px] text-left text-sm">
								<thead>
									<tr className="border-b bg-slate-50 text-slate-600">
										<th className="p-3">Học sinh</th>
										<th className="p-3">Lớp</th>
										<th className="p-3">Bài tập</th>
										<th className="p-3">Điểm</th>
										<th className="p-3">IP</th>
										<th className="p-3">Tệp</th>
										<th className="p-3">Thời gian nộp</th>
									</tr>
								</thead>
								<tbody>
									{logs.slice(0, 50).map((log) => (
										<tr key={log.id} className="border-b">
											<td className="p-3 font-semibold">{log.studentName}</td>
											<td className="p-3">{log.className}</td>
											<td className="p-3">{log.assignmentName}</td>
											<td className="p-3 font-bold">
												{log.scoreValue ?? "--"}/{log.maxScore}
											</td>
											<td className="p-3">{log.ipAddress || "--"}</td>
											<td className="p-3">{log.fileName || "--"}</td>
											<td className="p-3">{formatDateTime(log.submittedAt)}</td>
										</tr>
									))}
								</tbody>
							</table>
							{logs.length === 0 && (
								<p className="p-4 text-center text-sm text-slate-500">
									Chưa có lượt nộp.
								</p>
							)}
						</div>
					</div>
				</section>
			)}
			{isCreateOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
					<div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
									Tạo cổng nộp bài
								</p>
								<h2 className="mt-2 text-2xl font-black">
									Thiết lập link công khai
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Bài tập cho học sinh nộp chính là các bài chấm tự động đã tạo
									trong trang chấm điểm của từng lớp.
								</p>
							</div>
							<button
								type="button"
								className="rounded-2xl border px-4 py-2 font-bold"
								onClick={() => setIsCreateOpen(false)}
							>
								Đóng
							</button>
						</div>
						<div className="mt-6 grid gap-5 lg:grid-cols-2">
							<section className="rounded-3xl border border-slate-200 p-4">
								<h3 className="font-black">1. Thông tin chung</h3>
								<div className="mt-4 space-y-3">
									<label className="block">
										<span className="text-sm font-bold">Tiêu đề</span>
										<input
											className="mt-2 w-full rounded-2xl border p-3"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
										/>
									</label>
									<label className="block">
										<span className="text-sm font-bold">Giới hạn lượt nộp</span>
										<input
											className="mt-2 w-full rounded-2xl border p-3"
											type="number"
											min={0}
											value={maxSubmissions}
											onChange={(e) =>
												setMaxSubmissions(Number(e.target.value))
											}
										/>
									</label>
									<label className="block">
										<span className="text-sm font-bold">Mô tả</span>
										<textarea
											className="mt-2 min-h-24 w-full rounded-2xl border p-3"
											value={description}
											onChange={(e) => setDescription(e.target.value)}
										/>
									</label>
								</div>
							</section>
							<section className="rounded-3xl border border-slate-200 p-4">
								<h3 className="font-black">2. Cách tính điểm và hiển thị</h3>
								<div className="mt-4 space-y-3">
									<label className="block">
										<span className="text-sm font-bold">Cách tính điểm</span>
										<select
											className="mt-2 w-full rounded-2xl border p-3"
											value={scoringPolicy}
											onChange={(e) =>
												setScoringPolicy(e.target.value as ScoringPolicy)
											}
										>
											<option value="BestScore">Điểm cao nhất</option>
											<option value="LatestScore">Điểm mới nhất</option>
										</select>
									</label>
									<label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
										<span className="font-semibold">
											Hiển thị bảng xếp hạng
										</span>
										<input
											type="checkbox"
											checked={showLeaderboard}
											onChange={(e) => setShowLeaderboard(e.target.checked)}
										/>
									</label>
									<label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
										<span className="font-semibold">
											Hiển thị nhận xét chi tiết
										</span>
										<input
											type="checkbox"
											checked={showDetailedFeedback}
											onChange={(e) =>
												setShowDetailedFeedback(e.target.checked)
											}
										/>
									</label>
								</div>
							</section>
						</div>
						<section className="mt-5 rounded-3xl border border-slate-200 p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<h3 className="font-black">3. Chọn trường, lớp và bài tập</h3>
									<p className="mt-1 text-sm text-slate-500">
										Chọn trường trước, sau đó chọn lớp. Hệ thống sẽ tải các bài
										tập chấm tự động đã tạo ở trang chấm điểm của lớp đó.
									</p>
								</div>
								<p className="text-sm text-slate-500">
									Đã chọn {selectedClassIds.length} lớp,{" "}
									{selectedAssignmentIds.length} bài tập
								</p>
							</div>
							<div className="mt-4 grid gap-4 lg:grid-cols-3">
								<div>
									<h4 className="text-sm font-bold text-slate-700">Trường</h4>
									<select
										className="mt-2 w-full rounded-2xl border p-3"
										value={selectedSchoolId}
										onChange={(e) => handleSchoolChange(e.target.value)}
									>
										<option value="">Chọn trường trước</option>
										{schools.map((school) => (
											<option key={school.id} value={school.id}>
												{school.name}
												{school.code ? ` (${school.code})` : ""}
											</option>
										))}
									</select>
									{selectedSchoolName ? (
										<p className="mt-2 text-xs text-slate-500">
											Đang chọn trường: {selectedSchoolName}
										</p>
									) : (
										<p className="mt-2 rounded-2xl bg-blue-50 p-3 text-sm text-blue-800">
											Vui lòng chọn trường để hệ thống hiển thị đúng danh sách
											lớp thuộc trường đó.
										</p>
									)}
								</div>
								<div>
									<h4 className="text-sm font-bold text-slate-700">Lớp</h4>
									<div className="mt-2 max-h-72 space-y-2 overflow-auto rounded-2xl bg-slate-50 p-3">
										{loadingClasses && (
											<p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">
												Đang tải danh sách lớp...
											</p>
										)}
										{selectedSchoolId &&
											!loadingClasses &&
											classes.map((cls) => (
												<label
													key={cls.id}
													className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-xs"
												>
													<input
														type="checkbox"
														checked={selectedClassIds.includes(cls.id)}
														onChange={() =>
															toggle(
																cls.id,
																selectedClassIds,
																setSelectedClassIds,
															)
														}
													/>
													<span className="font-semibold">{cls.name}</span>
												</label>
											))}
										{!selectedSchoolId && (
											<p className="p-3 text-sm text-slate-500">
												Vui lòng chọn trường trước khi chọn lớp.
											</p>
										)}
										{selectedSchoolId && !loadingClasses && classes.length === 0 && (
											<p className="p-3 text-sm text-slate-500">
												Chưa có lớp hoạt động trong trường đã chọn.
											</p>
										)}
									</div>
								</div>
								<div>
									<h4 className="text-sm font-bold text-slate-700">
										Bài tập chấm tự động đã tạo
									</h4>
									{selectedClassNames && (
										<p className="mt-1 text-xs text-slate-500">
											Đang lấy bài tập từ lớp: {selectedClassNames}
										</p>
									)}
									<div className="mt-2 max-h-72 space-y-2 overflow-auto rounded-2xl bg-slate-50 p-3">
										{loadingAssignments && (
											<p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">
												Đang tải bài tập chấm tự động...
											</p>
										)}
										{!loadingAssignments && filteredAssignments.map((assignment) => (
											<label
												key={assignment.id}
												className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-xs"
											>
												<input
													className="mt-1"
													type="checkbox"
													checked={selectedAssignmentIds.includes(
														assignment.id,
													)}
													onChange={() =>
														toggle(
															assignment.id,
															selectedAssignmentIds,
															setSelectedAssignmentIds,
														)
													}
												/>
												<span>
													<span className="block font-semibold">
														{assignment.name}
													</span>
													<span className="text-xs text-slate-500">
														Lớp {classNameById.get(assignment.classId) || "--"}{" "}
														• {subjectBadge(assignment.subject)} •{" "}
														{assignment.maxScore} điểm
													</span>
													<span className="block text-[11px] text-slate-400">
														Endpoint: {assignment.gradingApiEndpoint}
													</span>
												</span>
											</label>
										))}
										{!selectedSchoolId && (
											<p className="p-3 text-sm text-slate-500">
												Vui lòng chọn trường trước.
											</p>
										)}
										{selectedSchoolId && selectedClassIds.length === 0 && (
											<p className="p-3 text-sm text-slate-500">
												Vui lòng chọn lớp sau khi đã chọn trường.
											</p>
										)}
										{!loadingAssignments && selectedClassIds.length > 0 &&
											filteredAssignments.length === 0 && (
												<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
													<p className="font-bold">
														Chưa có bài tập chấm tự động cho lớp đã chọn.
													</p>
													<p className="mt-1">
														Hãy mở trang chấm điểm của lớp, tạo bài tập chấm tự
														động, sau đó quay lại đây chọn lớp để tạo link nộp
														bài cho học sinh.
													</p>
												</div>
											)}
									</div>
								</div>
							</div>
						</section>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								className="rounded-2xl border px-5 py-3 font-bold"
								onClick={() => setIsCreateOpen(false)}
							>
								Hủy
							</button>
							<button
								type="button"
								disabled={loading}
								className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:bg-slate-300"
								onClick={createPortal}
							>
								Tạo link nộp bài
							</button>
						</div>
					</div>
				</div>
			)}
			{editingPortal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
					<div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
									Sửa link nộp bài
								</p>
								<h2 className="mt-2 text-2xl font-black">
									{editingPortal.title}
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Phạm vi lớp và bài tập được giữ nguyên để tránh thay đổi nhầm dữ liệu nộp bài đã có.
								</p>
							</div>
							<button
								type="button"
								className="rounded-2xl border px-4 py-2 font-bold"
								onClick={closeEdit}
							>
								Đóng
							</button>
						</div>
						<div className="mt-6 grid gap-4 sm:grid-cols-2">
							<label className="block sm:col-span-2">
								<span className="text-sm font-bold">Tiêu đề</span>
								<input
									className="mt-2 w-full rounded-2xl border p-3"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</label>
							<label className="block sm:col-span-2">
								<span className="text-sm font-bold">Mô tả</span>
								<textarea
									className="mt-2 min-h-24 w-full rounded-2xl border p-3"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</label>
							<label className="block">
								<span className="text-sm font-bold">Giới hạn lượt nộp</span>
								<input
									className="mt-2 w-full rounded-2xl border p-3"
									type="number"
									min={0}
									value={maxSubmissions}
									onChange={(e) => setMaxSubmissions(Number(e.target.value))}
								/>
							</label>
							<label className="block">
								<span className="text-sm font-bold">Cách tính điểm</span>
								<select
									className="mt-2 w-full rounded-2xl border p-3"
									value={scoringPolicy}
									onChange={(e) => setScoringPolicy(e.target.value as ScoringPolicy)}
								>
									<option value="BestScore">Điểm cao nhất</option>
									<option value="LatestScore">Điểm mới nhất</option>
								</select>
							</label>
							<label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
								<span className="font-semibold">Hiển thị bảng xếp hạng</span>
								<input
									type="checkbox"
									checked={showLeaderboard}
									onChange={(e) => setShowLeaderboard(e.target.checked)}
								/>
							</label>
							<label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
								<span className="font-semibold">Hiển thị nhận xét chi tiết</span>
								<input
									type="checkbox"
									checked={showDetailedFeedback}
									onChange={(e) => setShowDetailedFeedback(e.target.checked)}
								/>
							</label>
						</div>
						<div className="mt-6 flex flex-wrap justify-end gap-3">
							<button
								type="button"
								className="rounded-2xl border px-5 py-3 font-bold"
								onClick={closeEdit}
							>
								Hủy
							</button>
							<button
								type="button"
								disabled={loading}
								className="rounded-2xl border border-rose-200 px-5 py-3 font-bold text-rose-700 disabled:text-slate-400"
								onClick={() => void updatePortal(false)}
							>
								Đóng link
							</button>
							<button
								type="button"
								disabled={loading}
								className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:bg-slate-300"
								onClick={() => void updatePortal(true)}
							>
								Lưu và mở link
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SubmissionPortalManagementPage;
