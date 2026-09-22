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
	const [confirmAssignmentId, setConfirmAssignmentId] = useState<string | null>(
		null,
	);
	const [submittingAssignmentId, setSubmittingAssignmentId] = useState<
		string | null
	>(null);
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
		const keyword = studentSearch.trim().toLowerCase();
		if (!keyword) return students;
		return students.filter((student) =>
			student.fullName.toLowerCase().includes(keyword),
		);
	}, [studentSearch, students]);
	const confirmedIdentity = Boolean(classId && studentId);
	const completedCount = visibleAssignments.filter(
		(assignment) => results[assignment.id],
	).length;
	const topRows = leaderboard.slice(0, 3);
	const confirmAssignment = visibleAssignments.find(
		(assignment) => assignment.id === confirmAssignmentId,
	);
	const confirmFile = confirmAssignmentId
		? files[confirmAssignmentId]
		: undefined;

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
		}
	}, [classId, token]);

	const loadLeaderboard = useCallback(async () => {
		try {
			setLeaderboard(
				await submissionPortalService.getLeaderboard(
					token,
					classId || undefined,
				),
			);
		} catch {
			setLeaderboard([]);
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

	const submit = async () => {
		if (!confirmAssignmentId || !classId || !studentId) return;
		const file = files[confirmAssignmentId];
		if (!file) {
			setMessage("Vui lòng chọn file trước khi nộp.");
			setConfirmAssignmentId(null);
			return;
		}
		setSubmittingAssignmentId(confirmAssignmentId);
		setMessage("");
		try {
			const result = await submissionPortalService.submit(
				token,
				classId,
				studentId,
				confirmAssignmentId,
				file,
			);
			setResults((prev) => ({ ...prev, [confirmAssignmentId]: result }));
			setMessage("Đã nộp và chấm bài thành công.");
			await loadLeaderboard();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Không thể nộp bài");
		} finally {
			setSubmittingAssignmentId(null);
			setConfirmAssignmentId(null);
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
		const failedTaskResults = result ? getFailedTaskResults(result) : [];
		const fallbackErrors = result
			? uniqueNonEmpty(result.autoGradingErrors)
			: [];
		const meta = subjectMeta[assignment.subject];
		const isSubmitting = submittingAssignmentId === assignment.id;
		return (
			<article
				key={assignment.id}
				className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
			>
				<div className="flex items-start justify-between gap-3">
					<div>
						<span
							className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${meta.accent}`}
						>
							{meta.icon} {meta.label}
						</span>
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
				<label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center hover:border-emerald-400 hover:bg-emerald-50">
					<span className="text-3xl">⬆️</span>
					<span className="mt-2 text-sm font-semibold text-slate-800">
						{file ? file.name : "Chọn file bài làm"}
					</span>
					{file && (
						<span className="text-xs text-slate-500">
							{formatFileSize(file.size)}
						</span>
					)}
					<input
						className="hidden"
						type="file"
						onChange={(e) =>
							setFiles((prev) => ({
								...prev,
								[assignment.id]: e.target.files?.[0],
							}))
						}
					/>
				</label>
				<button
					type="button"
					disabled={
						!confirmedIdentity || !file || Boolean(submittingAssignmentId)
					}
					onClick={() => setConfirmAssignmentId(assignment.id)}
					className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					{isSubmitting
						? "Đang nộp và chấm..."
						: result
							? "Nộp lại bài"
							: "Nộp & chấm điểm"}
				</button>
				{result && (
					<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
						<div
							className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${getScoreTone(result.scoreValue, result.maxScore)}`}
						>
							Điểm: {result.scoreValue ?? "--"}/{result.maxScore}
							{result.rank ? ` • Hạng #${result.rank}` : ""}
						</div>
						<p className="mt-2 text-xs text-emerald-700">
							Đã nộp: {formatDateTime(result.submittedAt)}
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
										disabled={!classId}
									>
										<option value="">-- Chọn đúng tên --</option>
										{filteredStudents.map((s) => (
											<option key={s.id} value={s.id}>
												{s.fullName}
											</option>
										))}
									</select>
								</label>
							</div>
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
						<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{visibleAssignments.map(renderAssignmentCard)}
						</section>
					</>
				) : (
					<section className="rounded-3xl bg-white p-5 shadow-sm">
						<h2 className="text-2xl font-black">
							Bảng xếp hạng{selectedClass ? ` - ${selectedClass.name}` : ""}
						</h2>
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
			{confirmAssignmentId && selectedStudent && confirmAssignment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
					<div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
						<h2 className="text-2xl font-black">Xác nhận danh tính</h2>
						<p className="mt-3 text-slate-600">
							Bạn có chắc chắn muốn nộp file <b>{confirmFile?.name}</b> cho bài{" "}
							<b>{confirmAssignment.name}</b> dưới tên{" "}
							<b>{selectedStudent.fullName}</b> - lớp{" "}
							<b>{selectedClass?.name}</b> không?
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								className="rounded-2xl border px-5 py-3 font-bold"
								onClick={() => setConfirmAssignmentId(null)}
							>
								Hủy
							</button>
							<button
								type="button"
								className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white"
								onClick={submit}
							>
								Đúng, nộp bài
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PublicSubmissionPortalPage;
