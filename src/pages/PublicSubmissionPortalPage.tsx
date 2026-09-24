import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { RouteLoadingFallback } from "../components/common";
import { submissionPortalService } from "../services/submission-portal.service";
import type {
	PublicPortalAutoGradingTaskResult,
	PublicPortalAssignment,
	PublicPortalInfo,
	PublicPortalStudent,
	PublicPortalSubmitResult,
	SubmissionLeaderboardItem,
} from "../types/submission-portal.types";

const subjectMeta = {
	excel: {
		label: "Excel",
		icon: "📗",
		accent: "bg-emerald-100 text-emerald-800",
	},
	word: { label: "Word", icon: "📘", accent: "bg-blue-100 text-blue-800" },
	ppt: {
		label: "PowerPoint",
		icon: "📙",
		accent: "bg-orange-100 text-orange-800",
	},
};

const formatDateTime = (value?: string) =>
	value ? new Date(value).toLocaleString("vi-VN") : "Không giới hạn";
const formatFileSize = (size: number) =>
	`${(size / 1024 / 1024).toFixed(2)} MB`;

const normalizeText = (value: string) =>
	value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/đ/g, "d")
		.trim();

const expectedExtensionsBySubject: Record<
	PublicPortalAssignment["subject"],
	string[]
> = {
	excel: [".xlsx", ".xlsm", ".xls"],
	word: [".docx", ".docm", ".doc"],
	ppt: [".pptx", ".pptm", ".ppt"],
};

const getFileExtensionWarning = (
	assignment: PublicPortalAssignment,
	file?: File,
) => {
	if (!file) return "";
	const fileName = file.name.toLowerCase();
	const expectedExtensions = expectedExtensionsBySubject[assignment.subject] || [];
	if (expectedExtensions.some((extension) => fileName.endsWith(extension))) return "";

	return `File này có thể không đúng định dạng cho bài ${subjectMeta[assignment.subject].label}. Nên chọn file ${expectedExtensions.join(", ")}.`;
};

const getScoreTone = (score?: number, maxScore = 100) => {
	if (score === undefined) return "bg-slate-100 text-slate-700";
	const ratio = maxScore > 0 ? score / maxScore : 0;
	if (ratio >= 0.8) return "bg-emerald-100 text-emerald-800";
	if (ratio >= 0.5) return "bg-amber-100 text-amber-800";
	return "bg-rose-100 text-rose-800";
};

const uniqueNonEmpty = (items?: string[]) =>
	Array.from(new Set((items || []).map((item) => item.trim()).filter(Boolean)));

const getFailedTaskResults = (result: PublicPortalSubmitResult) =>
	(result.autoGradingTaskResults || []).filter((task) => {
		const errors = uniqueNonEmpty(task.errors);
		const fixes = uniqueNonEmpty(task.fixActions);
		return task.isPassed === false || errors.length > 0 || fixes.length > 0;
	});

const getTaskLabel = (task: PublicPortalAutoGradingTaskResult, index: number) =>
	task.taskName?.trim() || task.taskId?.trim() || `Câu ${index + 1}`;

const PublicSubmissionPortalPage = () => {
	const { token = "" } = useParams<{ token: string }>();
	const [info, setInfo] = useState<PublicPortalInfo | null>(null);
	const [classId, setClassId] = useState("");
	const [studentId, setStudentId] = useState("");
	const [students, setStudents] = useState<PublicPortalStudent[]>([]);
	const [studentSearch, setStudentSearch] = useState("");
	const [files, setFiles] = useState<Record<string, File | undefined>>({});
	const [results, setResults] = useState<
		Record<string, PublicPortalSubmitResult>
	>({});
	const [leaderboard, setLeaderboard] = useState<SubmissionLeaderboardItem[]>(
		[],
	);
	const [tab, setTab] = useState<"submit" | "leaderboard">("submit");
	const [submittingAssignmentId, setSubmittingAssignmentId] = useState<
		string | null
	>(null);
	const [previewingAssignmentId, setPreviewingAssignmentId] = useState<string | null>(
		null,
	);
	const [loadingStudents, setLoadingStudents] = useState(false);
	const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
	const [draggingAssignmentId, setDraggingAssignmentId] = useState<string | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const selectedStudent = students.find((s) => s.id === studentId);
	const selectedClass = info?.classes.find((c) => c.id === classId);
	const visibleAssignments = useMemo(
		() =>
			(info?.assignments || []).filter(
				(a) => !classId || a.classId === classId,
			),
		[info, classId],
	);
	const filteredStudents = useMemo(() => {
		const keyword = normalizeText(studentSearch);
		if (!keyword) return students;
		return students.filter((student) =>
			normalizeText(student.fullName).includes(keyword),
		);
	}, [studentSearch, students]);
	const confirmedIdentity = Boolean(classId && studentId);
	const completedCount = visibleAssignments.filter(
		(assignment) => results[assignment.id] && !results[assignment.id].isPreview,
	).length;
	const topRows = leaderboard.slice(0, 3);

	const loadInfo = useCallback(async () => {
		setLoading(true);
		try {
			const data = await submissionPortalService.getPublicInfo(token);
			setInfo(data);
			if (data.classes.length === 1) setClassId(data.classes[0].id);
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Không tìm thấy link nộp bài",
			);
		} finally {
			setLoading(false);
		}
	}, [token]);

	const loadStudents = useCallback(async () => {
		setStudentId("");
		setStudentSearch("");
		if (!classId) {
			setStudents([]);
			return;
		}
		setLoadingStudents(true);
		try {
			setStudents(
				await submissionPortalService.getPublicStudents(token, classId),
			);
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "Không thể lấy danh sách học sinh",
			);
		} finally {
			setLoadingStudents(false);
		}
	}, [classId, token]);

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
		if (info?.showLeaderboard) void loadLeaderboard();
	}, [info?.showLeaderboard, loadLeaderboard]);

	const submit = async (assignmentId: string) => {
		if (!assignmentId || !classId || !studentId) return;
		const file = files[assignmentId];
		if (!file) {
			setMessage("Vui lòng chọn file trước khi nộp.");
			return;
		}
		setSubmittingAssignmentId(assignmentId);
		setMessage("");
		setResults((prev) => {
			const next = { ...prev };
			delete next[assignmentId];
			return next;
		});
		try {
			const result = await submissionPortalService.submit(
				token,
				classId,
				studentId,
				assignmentId,
				file,
			);
			setResults((prev) => ({
				...prev,
				[assignmentId]: { ...result, isPreview: false },
			}));
			setMessage("Đã nộp và chấm bài thành công.");
			await loadLeaderboard();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Không thể nộp bài");
		} finally {
			setSubmittingAssignmentId(null);
		}
	};

	const handleFileSelected = async (
		assignment: PublicPortalAssignment,
		file?: File,
	) => {
		setFiles((prev) => ({ ...prev, [assignment.id]: file }));
		setResults((prev) => {
			const next = { ...prev };
			delete next[assignment.id];
			return next;
		});
		if (!file) return;
		if (!classId || !studentId) {
			setMessage("Vui lòng chọn lớp và học sinh trước khi chấm thử file.");
			return;
		}

		setPreviewingAssignmentId(assignment.id);
		setMessage("");
		try {
			const preview = await submissionPortalService.gradePreview(
				token,
				classId,
				studentId,
				assignment.id,
				file,
			);
			setResults((prev) => ({
				...prev,
				[assignment.id]: { ...preview, isPreview: true },
			}));
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Không thể chấm thử bài");
		} finally {
			setPreviewingAssignmentId(null);
		}
	};

	if (loading && !info)
		return (
			<RouteLoadingFallback fullScreen message="Đang mở cổng nộp bài..." />
		);

	if (!info) {
		return (
			<div className="min-h-screen bg-slate-950 p-6 text-white">
				<div className="mx-auto max-w-xl rounded-3xl bg-white/10 p-8 text-center">
					<h1 className="text-2xl font-bold">Không mở được cổng nộp bài</h1>
					<p className="mt-3 text-white/80">
						{message || "Link không tồn tại hoặc đã bị đóng."}
					</p>
				</div>
			</div>
		);
	}

	const renderAssignmentCard = (assignment: PublicPortalAssignment) => {
		const result = results[assignment.id];
		const file = files[assignment.id];
		const fileWarning = getFileExtensionWarning(assignment, file);
		const failedTaskResults = result ? getFailedTaskResults(result) : [];
		const fallbackErrors = result
			? uniqueNonEmpty(result.autoGradingErrors)
			: [];
		const hasDetailedIssues =
			failedTaskResults.length > 0 || fallbackErrors.length > 0;
		const meta = subjectMeta[assignment.subject];
		const isSubmitting = submittingAssignmentId === assignment.id;
		const isPreviewing = previewingAssignmentId === assignment.id;
		const isDragging = draggingAssignmentId === assignment.id;
		const scoreRatio =
			result?.scoreValue !== undefined && result.maxScore > 0
				? Math.round((result.scoreValue / result.maxScore) * 100)
				: 0;
		return (
			<article
				key={assignment.id}
				className={`relative flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isSubmitting ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"}`}
			>
				{isSubmitting && (
					<div className="absolute inset-x-5 top-0 h-1 overflow-hidden rounded-full bg-emerald-100">
						<div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
					</div>
				)}
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex flex-wrap gap-2">
							<span
								className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${meta.accent}`}
							>
								{meta.icon} {meta.label}
							</span>
							<span
								className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${result ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
							>
								{isSubmitting
									? "Đang nộp"
									: isPreviewing
										? "Đang chấm thử"
										: result?.isPreview
											? "Đã chấm thử"
											: result
												? "Đã nộp"
												: "Chưa nộp"}
							</span>
						</div>
						<h2 className="mt-3 text-lg font-bold text-slate-950">
							{assignment.name}
						</h2>
					</div>
					<span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
						{assignment.maxScore} điểm
					</span>
				</div>
				{assignment.description && (
					<p className="mt-3 line-clamp-3 text-sm text-slate-600">
						{assignment.description}
					</p>
				)}
				<div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
					<span>
						{assignment.hasInstructions ? "Có hướng dẫn" : "Không có hướng dẫn"}
					</span>
					<span>
						{assignment.hasTemplate ? "Có file mẫu" : "Không có file mẫu"}
					</span>
				</div>
				<label
					className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${isDragging ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100" : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50"} ${isSubmitting || isPreviewing ? "pointer-events-none opacity-70" : ""}`}
					onDragOver={(event) => {
						event.preventDefault();
						setDraggingAssignmentId(assignment.id);
					}}
					onDragLeave={() => setDraggingAssignmentId(null)}
					onDrop={(event) => {
						event.preventDefault();
						setDraggingAssignmentId(null);
						const droppedFile = event.dataTransfer.files?.[0];
						if (droppedFile) {
							void handleFileSelected(assignment, droppedFile);
						}
					}}
				>
					<span className="text-3xl">⬆️</span>
					<span className="mt-2 text-sm font-semibold text-slate-800">
						{isPreviewing
							? "Đang chấm thử file..."
							: file
								? file.name
								: "Chọn hoặc kéo thả file bài làm"}
					</span>
					{file && (
						<span className="text-xs text-slate-500">
							{formatFileSize(file.size)}
						</span>
					)}
					<input
						className="hidden"
						type="file"
						disabled={isSubmitting || isPreviewing}
						onChange={(e) =>
							void handleFileSelected(assignment, e.target.files?.[0])
						}
					/>
				</label>
				{file && (
					<div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
						<span>Đã chọn: {file.name}</span>
						<button
							type="button"
							disabled={isSubmitting || isPreviewing}
							className="font-bold text-rose-600 disabled:text-slate-400"
								onClick={() => void handleFileSelected(assignment, undefined)}
						>
							Xóa file
						</button>
					</div>
				)}
				{fileWarning && (
					<p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
						⚠️ {fileWarning}
					</p>
				)}
				<button
					type="button"
					disabled={
						!confirmedIdentity || !file || Boolean(submittingAssignmentId) || isPreviewing
					}
					onClick={() => void submit(assignment.id)}
					className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					{isSubmitting
						? "⏳ Đang ghi nhận điểm..."
						: isPreviewing
							? "Đang chấm thử..."
							: result?.isPreview
								? "Nộp bài để ghi nhận điểm"
								: result
									? "Nộp lại bài"
									: "Nộp bài"}
				</button>
				{result && (
					<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
						<div className="mb-3 h-2 overflow-hidden rounded-full bg-white">
							<div
								className="h-full rounded-full bg-emerald-500 transition-all"
								style={{ width: `${Math.min(100, Math.max(0, scoreRatio))}%` }}
							/>
						</div>
						<div
							className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${getScoreTone(result.scoreValue, result.maxScore)}`}
						>
							Điểm: {result.scoreValue ?? "--"}/{result.maxScore}
							{result.rank ? ` • Hạng #${result.rank}` : ""}
						</div>
						<p className="mt-2 text-xs text-emerald-700">
							{result.isPreview
								? "Kết quả chấm thử chưa ghi nhận điểm. Bấm Nộp bài để lưu điểm chính thức."
								: `Đã nộp: ${formatDateTime(result.submittedAt)}`}
						</p>
						{info.showDetailedFeedback && result.feedback && (
							<p className="mt-3 whitespace-pre-line text-sm text-slate-700">
								{result.feedback}
							</p>
						)}
						{failedTaskResults.length > 0 && (
							<div className="mt-3 space-y-3">
								<p className="text-sm font-bold text-rose-800">
									Các câu cần sửa:
								</p>
								{failedTaskResults.map((task, index) => {
									const errors = uniqueNonEmpty(task.errors);
									const fixes = uniqueNonEmpty(task.fixActions);
									const taskKey = [
										task.taskId,
										task.taskName,
										errors.join("|"),
										fixes.join("|"),
									]
										.filter(Boolean)
										.join("-");
									return (
										<div
											key={taskKey}
											className="rounded-2xl border border-rose-200 bg-white p-3 text-sm"
										>
											<p className="font-bold text-slate-900">
												{getTaskLabel(task, index)}
												{typeof task.score === "number" &&
													typeof task.maxScore === "number" && (
														<span className="ml-2 text-xs font-semibold text-slate-500">
															({task.score}/{task.maxScore} điểm)
														</span>
													)}
											</p>
											{errors.map((error) => (
												<p key={error} className="mt-2 text-rose-700">
													<span className="font-bold">Câu sai:</span> {error}
												</p>
											))}
											{fixes.map((fix) => (
												<p key={fix} className="mt-1 text-emerald-700">
													<span className="font-bold">Cách khắc phục:</span>{" "}
													{fix}
												</p>
											))}
										</div>
									);
								})}
							</div>
						)}
						{failedTaskResults.length === 0 && fallbackErrors.length > 0 && (
							<div className="mt-3 space-y-2 text-sm text-rose-700">
								<p className="font-bold text-rose-800">Các câu cần sửa:</p>
								{fallbackErrors.map((error, index) => (
									<p key={error}>
										<span className="font-bold">Câu sai {index + 1}:</span>{" "}
										{error}
									</p>
								))}
							</div>
						)}
						{info.showDetailedFeedback && !hasDetailedIssues && (
							<p className="mt-3 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700">
								🎉 Tuyệt vời! Bài nộp hiện không còn lỗi cần sửa.
							</p>
						)}
						{result.alerts.length > 0 && (
							<div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
								<p className="font-black">⚠️ Cảnh báo cần lưu ý</p>
								<ul className="mt-2 list-disc space-y-1 pl-5">
									{result.alerts.map((alert) => (
										<li key={alert}>{alert}</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</article>
		);
	};

	return (
		<div className="min-h-screen bg-slate-100 text-slate-950">
			<header className="bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900 px-4 py-8 text-white sm:px-6 lg:px-10">
				<div className="mx-auto max-w-7xl">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-100">
								MOS Submission Portal
							</p>
							<h1 className="mt-3 text-3xl font-black sm:text-5xl">
								{info.title}
							</h1>
							{info.description && (
								<p className="mt-4 max-w-3xl text-base text-emerald-50">
									{info.description}
								</p>
							)}
						</div>
						<div className="grid gap-3 rounded-3xl bg-white/10 p-4 text-sm backdrop-blur sm:grid-cols-3">
							<div>
								<b>{info.classes.length}</b>
								<br />
								Lớp
							</div>
							<div>
								<b>{info.assignments.length}</b>
								<br />
								Bài tập
							</div>
							<div>
								<b>{info.maxSubmissionsPerStudent || "∞"}</b>
								<br />
								Lần nộp
							</div>
						</div>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
				{message && (
					<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
						{message}
					</div>
				)}
				<nav className="flex rounded-3xl bg-white p-2 shadow-sm">
					<button
						type="button"
						onClick={() => setTab("submit")}
						className={`flex-1 rounded-2xl px-4 py-3 font-bold ${tab === "submit" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
					>
						📝 Nộp bài
					</button>
					{info.showLeaderboard && (
						<button
							type="button"
							onClick={() => setTab("leaderboard")}
							className={`flex-1 rounded-2xl px-4 py-3 font-bold ${tab === "leaderboard" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
						>
							🏆 Bảng xếp hạng
						</button>
					)}
				</nav>
				{tab === "submit" ? (
					<>
						<section className="rounded-3xl bg-white p-5 shadow-sm">
							<div className="mb-4 flex flex-wrap items-center gap-3">
								<span
									className={`rounded-full px-3 py-1 text-sm font-bold ${classId ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
								>
									1. Chọn lớp
								</span>
								<span
									className={`rounded-full px-3 py-1 text-sm font-bold ${studentId ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
								>
									2. Xác nhận học sinh
								</span>
								<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
									3. Nộp bài ({completedCount}/{visibleAssignments.length})
								</span>
							</div>
							<div className="grid gap-4 md:grid-cols-3">
								<label className="block">
									<span className="text-sm font-bold">Lớp học</span>
									<select
										className="mt-2 w-full rounded-2xl border border-slate-200 p-3"
										value={classId}
										onChange={(e) => setClassId(e.target.value)}
									>
										<option value="">-- Chọn lớp --</option>
										{info.classes.map((c) => (
											<option key={c.id} value={c.id}>
												{c.name}
											</option>
										))}
									</select>
								</label>
								<label className="block">
									<span className="text-sm font-bold">Tìm tên học sinh</span>
									<input
										className="mt-2 w-full rounded-2xl border border-slate-200 p-3"
										value={studentSearch}
										onChange={(e) => setStudentSearch(e.target.value)}
										disabled={!classId}
										placeholder="Gõ một phần họ tên..."
									/>
								</label>
								<label className="block">
									<span className="text-sm font-bold">Tên của bạn</span>
									<select
										className="mt-2 w-full rounded-2xl border border-slate-200 p-3"
										value={studentId}
										onChange={(e) => setStudentId(e.target.value)}
										disabled={!classId || loadingStudents}
									>
										<option value="">
											{loadingStudents ? "Đang tải danh sách..." : "-- Chọn đúng tên --"}
										</option>
										{filteredStudents.map((s) => (
											<option key={s.id} value={s.id}>
												{s.fullName}
											</option>
										))}
									</select>
								</label>
							</div>
							{classId && loadingStudents && (
								<div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
									Đang tải danh sách học sinh của lớp {selectedClass?.name || "đã chọn"}...
								</div>
							)}
							{classId && !loadingStudents && filteredStudents.length === 0 && (
								<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
									Không tìm thấy học sinh phù hợp. Hãy kiểm tra lại lớp hoặc từ khóa tìm kiếm.
								</div>
							)}
							{selectedStudent && (
								<div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
									Đang nộp bài cho <b>{selectedStudent.fullName}</b> - lớp{" "}
									<b>{selectedClass?.name}</b>.{" "}
									<button
										type="button"
										className="ml-2 font-bold underline"
										onClick={() => setStudentId("")}
									>
										Đổi học sinh
									</button>
								</div>
							)}
						</section>
						{visibleAssignments.length > 0 ? (
							<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								{visibleAssignments.map(renderAssignmentCard)}
							</section>
						) : (
							<section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
								<div className="text-4xl">📭</div>
								<h2 className="mt-3 text-xl font-black">Chưa có bài tập để nộp</h2>
								<p className="mt-2 text-sm text-slate-500">
									Lớp đã chọn chưa có bài tập trong cổng này. Hãy báo giáo viên kiểm tra lại phạm vi link.
								</p>
							</section>
						)}
					</>
				) : (
					<section className="rounded-3xl bg-white p-5 shadow-sm">
						<h2 className="text-2xl font-black">
							Bảng xếp hạng{selectedClass ? ` - ${selectedClass.name}` : ""}
						</h2>
						{loadingLeaderboard && (
							<div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
								Đang cập nhật bảng xếp hạng...
							</div>
						)}
						<div className="mt-5 grid gap-3 md:grid-cols-3">
							{topRows.map((row, index) => (
								<div
									key={`${row.studentId}-${row.assignmentId || "all"}-podium`}
									className="rounded-3xl bg-gradient-to-br from-amber-50 to-white p-5 text-center shadow-sm"
								>
									<div className="text-4xl">{["🥇", "🥈", "🥉"][index]}</div>
									<div className="mt-2 font-bold">{row.studentName}</div>
									<div className="text-sm text-slate-500">
										{row.scoreValue}/{row.maxScore} điểm
									</div>
								</div>
							))}
						</div>
						<div className="mt-5 overflow-auto">
							<table className="w-full min-w-[760px] text-left text-sm">
								<thead>
									<tr className="border-b bg-slate-50">
										<th className="p-3">Hạng</th>
										<th className="p-3">Học sinh</th>
										<th className="p-3">Lớp</th>
										<th className="p-3">Bài tập</th>
										<th className="p-3">Điểm</th>
										<th className="p-3">Số lần nộp</th>
										<th className="p-3">Thời gian</th>
									</tr>
								</thead>
								<tbody>
									{leaderboard.map((row) => (
										<tr
											key={`${row.studentId}-${row.assignmentId || "all"}`}
											className="border-b"
										>
											<td className="p-3 font-black">#{row.rank}</td>
											<td className="p-3 font-semibold">{row.studentName}</td>
											<td className="p-3">{row.className}</td>
											<td className="p-3">
												{row.assignmentName || "Tổng hợp"}
											</td>
											<td className="p-3 font-bold">
												{row.scoreValue}/{row.maxScore}
											</td>
											<td className="p-3">{row.submissionCount}</td>
											<td className="p-3">{formatDateTime(row.gradedAt)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				)}
			</main>
		</div>
	);
};

export default PublicSubmissionPortalPage;
