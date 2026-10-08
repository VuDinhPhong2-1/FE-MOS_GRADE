import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { ProgressIndicator } from "@bug-on/m3-expressive/feedback";
import {
	Chip,
	Select,
	type SelectOption,
	TextField,
} from "@bug-on/m3-expressive/forms";
import { Card, ScrollArea, Text } from "@bug-on/m3-expressive/layout";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { showAlert, showConfirm } from "../../../../components/common";
import { useAuth } from "../../../../context/AuthContext";
import { gradingService } from "../../../../services/grading.service";
import type {
	BugSeverity,
	CreateGradingTestBugNoteRequest,
	GradingTestBugNote,
} from "../../../../types/grading-test-bug-note.types";
import type { GradingRuleSet } from "../../../../types/xml-grading-rules.types";
import { notify } from "../../../../utils/notify";

export interface TestGradingTabContentProps {
	selected: GradingRuleSet;
	gradeProjectCode: string;
	onProjectCodeChange: (code: string) => void;
	gradeFile: File | null;
	onFileChange: (file: File | null) => void;
	gradeAttachmentFile: File | null;
	onAttachmentFileChange: (file: File | null) => void;
	gradeJson: string;
	isTestGrading: boolean;
	onStartGrade: () => void;
}

interface GradeTaskResultView {
	taskId?: string;
	taskName?: string;
	score?: number;
	maxScore?: number;
	isPassed?: boolean;
	details?: string[];
	errors?: string[];
	fixActions?: string[];
}

interface GradeResultView {
	projectId?: string;
	projectName?: string;
	totalScore?: number;
	maxScore?: number;
	percentage?: number;
	isPassed?: boolean;
	status?: string;
	taskResults?: GradeTaskResultView[];
}

const severityMeta: Record<BugSeverity, { label: string; badgeClass: string }> =
{
	low: {
		label: "Low",
		badgeClass: "bg-m3-surface-container-highest text-m3-on-surface-variant",
	},
	medium: {
		label: "Medium",
		badgeClass: "bg-m3-secondary-container text-m3-on-secondary-container",
	},
	high: {
		label: "High",
		badgeClass: "bg-m3-tertiary-container text-m3-on-tertiary-container",
	},
	critical: {
		label: "Critical",
		badgeClass: "bg-m3-error-container text-m3-on-error-container",
	},
};

const severityOptions: SelectOption[] = [
	{ label: "Low", value: "low" },
	{ label: "Medium", value: "medium" },
	{ label: "High", value: "high" },
	{ label: "Critical", value: "critical" },
];

export const TestGradingTabContent: React.FC<TestGradingTabContentProps> = ({
	selected,
	gradeProjectCode,
	onProjectCodeChange,
	gradeFile,
	onFileChange,
	gradeAttachmentFile,
	onAttachmentFileChange,
	gradeJson,
	isTestGrading,
	onStartGrade,
}) => {
	const { getAccessToken } = useAuth();
	const [viewRawJson, setViewRawJson] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);

	// Bug Notes State
	const [bugNotes, setBugNotes] = useState<GradingTestBugNote[]>([]);
	const [isLoadingBugNotes, setIsLoadingBugNotes] = useState(false);
	const [isSavingBugNote, setIsSavingBugNote] = useState(false);
	const [deletingBugNoteId, setDeletingBugNoteId] = useState<string | null>(
		null,
	);
	const [bugTitle, setBugTitle] = useState("");
	const [bugDescription, setBugDescription] = useState("");
	const [bugSeverity, setBugSeverity] = useState<BugSeverity>("medium");
	const [bugActionMessage, setBugActionMessage] = useState<string | null>(null);
	const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
	const [isBugTitleDirty, setIsBugTitleDirty] = useState(false);

	const effectiveProjectCode = useMemo(
		() => gradeProjectCode || selected.projects[0]?.projectCode || "",
		[gradeProjectCode, selected.projects],
	);

	const selectedProjectObj = useMemo(
		() => selected.projects.find((p) => p.projectCode === effectiveProjectCode),
		[selected.projects, effectiveProjectCode],
	);

	const selectedProjectDisplayName = useMemo(
		() =>
			selectedProjectObj?.projectName ||
			effectiveProjectCode ||
			"Chưa chọn project",
		[selectedProjectObj, effectiveProjectCode],
	);

	let parsedResult: GradeResultView | null = null;
	if (gradeJson) {
		try {
			parsedResult = JSON.parse(gradeJson) as GradeResultView;
		} catch {
			parsedResult = null;
		}
	}

	// Auto-update bug title based on project name if not touched
	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset bug title dirty flag on project change
	useEffect(() => {
		setIsBugTitleDirty(false);
		setBugDescription("");
	}, [effectiveProjectCode]);

	useEffect(() => {
		if (!isBugTitleDirty) {
			setBugTitle(selectedProjectDisplayName);
		}
	}, [selectedProjectDisplayName, isBugTitleDirty]);

	// Load bug notes for the effective project
	useEffect(() => {
		let active = true;

		const loadBugNotes = async () => {
			if (!effectiveProjectCode) {
				setBugNotes([]);
				return;
			}
			setIsLoadingBugNotes(true);
			try {
				const notes = await gradingService.getTestingBugNotes(
					getAccessToken,
					effectiveProjectCode,
				);
				if (!active) return;
				setBugNotes(notes);
			} catch (err: unknown) {
				if (!active) return;
				setBugNotes([]);
				const message =
					err instanceof Error ? err.message : "Không tải được bug notes.";
				setBugActionMessage(message);
			} finally {
				if (active) {
					setIsLoadingBugNotes(false);
				}
			}
		};

		void loadBugNotes();
		return () => {
			active = false;
		};
	}, [effectiveProjectCode, getAccessToken]);

	const copyJsonToClipboard = () => {
		if (!gradeJson) return;
		void navigator.clipboard.writeText(gradeJson);
		notify.success("Đã sao chép kết quả JSON vào clipboard.");
	};

	const downloadJson = () => {
		if (!gradeJson) return;
		const blob = new Blob([gradeJson], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `test-result-${effectiveProjectCode || "report"}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleSaveBugNote = async () => {
		const title = bugTitle.trim();
		const description = bugDescription.trim();

		if (!title) {
			setBugActionMessage("Vui lòng nhập tiêu đề bug.");
			return;
		}

		if (!description) {
			setBugActionMessage("Vui lòng nhập mô tả bug.");
			return;
		}

		const request: CreateGradingTestBugNoteRequest = {
			projectCode: effectiveProjectCode,
			projectDisplayName: selectedProjectDisplayName,
			title,
			description,
			severity: bugSeverity,
			scoreSummary: parsedResult
				? {
					totalScore: parsedResult.totalScore ?? 0,
					maxScore: parsedResult.maxScore ?? 0,
					percentage: parsedResult.percentage ?? 0,
					status: parsedResult.isPassed ? "Passed" : "Failed",
				}
				: undefined,
			gradingError: parsedResult?.taskResults?.some(
				(t) => (t.errors || []).length > 0,
			)
				? parsedResult.taskResults
					.flatMap((t) => t.errors || [])
					.slice(0, 3)
					.join("; ")
				: undefined,
		};

		setIsSavingBugNote(true);
		try {
			const savedNote = await gradingService.createTestingBugNote(
				request,
				getAccessToken,
			);
			setBugNotes((prev) => [
				savedNote,
				...prev.filter((item) => item.id !== savedNote.id),
			]);
			setIsBugTitleDirty(false);
			setBugDescription("");
			setBugActionMessage("Đã lưu bug note thành công.");
			notify.success("Đã lưu bug note.");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Không lưu được bug note.";
			setBugActionMessage(message);
			notify.error(message);
		} finally {
			setIsSavingBugNote(false);
		}
	};

	const handleDeleteBugNote = async (noteId: string) => {
		const confirmed = await showConfirm({
			title: "Xác nhận xóa bug note",
			message: "Bạn có chắc chắn muốn xóa bug note này?",
			confirmLabel: "Xác nhận xóa",
			variant: "destructive",
		});
		if (!confirmed) {
			return;
		}

		setDeletingBugNoteId(noteId);
		try {
			await gradingService.deleteTestingBugNote(noteId, getAccessToken);
			setBugNotes((prev) => prev.filter((item) => item.id !== noteId));
			setCopiedNoteId((prev) => (prev === noteId ? null : prev));
			notify.success("Đã xóa bug note.");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Không xóa được bug note.";
			setBugActionMessage(message);
			notify.error(message);
		} finally {
			setDeletingBugNoteId(null);
		}
	};

	const handleCopyBugNote = async (note: GradingTestBugNote) => {
		const lines = [
			`[${note.severity.toUpperCase()}] ${note.title}`,
			`Project: ${note.projectDisplayName} (${note.projectCode})`,
			`Time: ${new Date(note.createdAt).toLocaleString("vi-VN")}`,
			note.scoreSummary
				? `Score: ${note.scoreSummary.totalScore}/${note.scoreSummary.maxScore} (${note.scoreSummary.percentage}%) - ${note.scoreSummary.status}`
				: "",
			note.gradingError ? `Grading error: ${note.gradingError}` : "",
			"Description:",
			note.description,
		].filter(Boolean);

		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			setCopiedNoteId(note.id);
			notify.success("Đã sao chép bug note vào clipboard.");
			setTimeout(
				() => setCopiedNoteId((prev) => (prev === note.id ? null : prev)),
				1500,
			);
		} catch {
			setBugActionMessage("Không thể copy tự động.");
		}
	};

	const projectSelectOptions = useMemo<SelectOption[]>(
		() =>
			selected.projects.map((p) => ({
				label: p.projectName
					? `${p.projectName} (${p.projectCode})`
					: p.projectCode,
				value: p.projectCode,
			})),
		[selected.projects],
	);

	const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
		const filesList = Array.from(e.dataTransfer.files || []);
		if (filesList.length === 0) return;

		const primary =
			filesList.find((f) => /\.(xlsx|xlsm|docx|pptx)$/i.test(f.name)) ||
			filesList[0] ||
			null;
		const secondary = filesList.find((f) => f !== primary) || null;

		if (
			primary &&
			!/\.(xlsx|xlsm|docx|pptx|dotx|txt)$/i.test(primary.name.toLowerCase())
		) {
			void showAlert({
				title: "Định dạng file không hỗ trợ",
				message:
					"File phải có định dạng .xlsx, .xlsm, .docx, .pptx hoặc văn bản .txt.",
				variant: "warning",
			});
			return;
		}

		onFileChange(primary);
		onAttachmentFileChange(secondary);
	};

	return (
		<div className="space-y-6">
			{/* Main Test Grading Section */}
			<section className="rounded-3xl bg-m3-surface-container p-6 text-m3-on-surface">
				{/* Header */}
				<div className="mb-6 flex items-start justify-between gap-3">
					<div>
						<div className="flex items-center gap-2">
							<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-m3-surface-container-high text-m3-primary">
								<Icon name="science" className="text-xl" />
							</div>
							<h3 className="text-base font-bold text-m3-on-surface">
								Chấm thử nghiệm XML Rules
							</h3>
						</div>
						<Text
							variant="body-sm"
							className="mt-1 text-xs text-m3-on-surface-variant"
						>
							Chọn project và tải lên file bài làm thực tế để kiểm tra kết quả
							chấm theo ruleset hiện tại trước khi công bố.
						</Text>
					</div>
				</div>

				<div className="flex flex-row gap-3 items-center w-full justify-between">
					{/* Project selector */}
					<Select
						dense
						menuVariant="expressive"
						colorVariant="vibrant"
						showDividers={false}
						label="Project cần chấm"
						variant="filled"
						value={effectiveProjectCode}
						onChange={(val) => onProjectCodeChange(val)}
						options={projectSelectOptions}
						disabled={isTestGrading || projectSelectOptions.length === 0}
						placeholder={
							projectSelectOptions.length === 0
								? "Ruleset chưa có project nào"
								: "Chọn project..."
						}
						fullWidth
					/>

					{/* Grade button */}
					<Button
						colorStyle="filled"
						size="sm"
						onClick={onStartGrade}
						disabled={isTestGrading || !gradeFile || !effectiveProjectCode}
						loading={isTestGrading}
						icon={
							!isTestGrading ? (
								<Icon name="play_arrow" variant="rounded" size={20} />
							) : undefined
						}
					>
						{isTestGrading ? "Đang chấm thử..." : "Bắt đầu chấm thử"}
					</Button>
				</div>

				{/* Drag & drop file area */}
				<div className="my-4">
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop container */}
					<div
						className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 transition-colors ${isDragOver
							? "border-m3-primary bg-m3-primary-container/30"
							: "border-m3-surface-container-highest bg-m3-surface/60 hover:bg-m3-surface"
							}`}
						onDragOver={(e) => {
							e.preventDefault();
							e.dataTransfer.dropEffect = "copy";
							setIsDragOver(true);
						}}
						onDragLeave={() => setIsDragOver(false)}
						onDrop={handleFileDrop}
					>
						<input
							type="file"
							multiple
							accept=".xlsx,.xlsm,.docx,.pptx,.pdf,.dotx,.txt"
							onChange={(e) => {
								const filesList = Array.from(e.target.files || []);
								const primary =
									filesList.find((f) =>
										/\.(xlsx|xlsm|docx|pptx)$/i.test(f.name),
									) ||
									filesList[0] ||
									null;
								const secondary = filesList.find((f) => f !== primary) || null;
								onFileChange(primary);
								onAttachmentFileChange(secondary);
								e.target.value = "";
							}}
							disabled={isTestGrading}
							className="hidden"
							id="xml-test-upload"
						/>
						<label
							htmlFor="xml-test-upload"
							className="flex cursor-pointer flex-col items-center text-center"
						>
							<Icon
								name="cloud_upload"
								variant="rounded"
								size={40}
								className="mb-2 text-m3-primary"
							/>
							<Text
								variant="title-sm"
								className="font-medium text-m3-on-surface"
							>
								Kéo thả file bài làm vào đây hoặc nhấn để chọn
							</Text>
							<Text
								variant="body-sm"
								className="mt-1 text-xs text-m3-on-surface-variant"
							>
								Hỗ trợ file Office (.xlsx, .xlsm, .docx, .pptx) và file đính kèm
							</Text>
						</label>

						{(gradeFile || gradeAttachmentFile) && (
							<div className="mt-4 flex flex-wrap items-center justify-center gap-2">
								{gradeFile && (
									<Chip
										variant="input"
										label={`Bài làm: ${gradeFile.name}`}
										leadingIcon={
											<Icon name="description" variant="rounded" size={16} />
										}
										onRemove={() => onFileChange(null)}
									/>
								)}
								{gradeAttachmentFile && (
									<Chip
										variant="input"
										label={`Đính kèm: ${gradeAttachmentFile.name}`}
										leadingIcon={
											<Icon name="attach_file" variant="rounded" size={16} />
										}
										onRemove={() => onAttachmentFileChange(null)}
									/>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Result section */}
				{gradeJson && (
					<div className="space-y-4 rounded-m3-md bg-m3-surface-container-lowest p-6">
						<div className="flex flex-wrap items-center justify-between gap-3 pb-4">
							<div className="flex items-center gap-2">
								<h4 className="text-base font-bold text-m3-on-surface">
									Kết quả chấm thử nghiệm
								</h4>
								{parsedResult && (
									<span
										className={`rounded-full px-3 py-1 text-xs font-bold ${parsedResult.isPassed
											? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
											: "bg-m3-error-container text-m3-on-error-container"
											}`}
									>
										{parsedResult.isPassed
											? "ĐẠT (PASSED)"
											: "KHÔNG ĐẠT (FAILED)"}
									</span>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Button
									colorStyle="tonal"
									size="sm"
									onClick={() => setViewRawJson(!viewRawJson)}
								>
									{viewRawJson ? "Giao diện Bảng" : "Xem JSON"}
								</Button>
								<Button
									colorStyle="tonal"
									size="sm"
									onClick={copyJsonToClipboard}
									icon={<Icon name="content_copy" size={16} />}
								>
									Sao chép
								</Button>
								<Button
									colorStyle="tonal"
									size="sm"
									onClick={downloadJson}
									icon={<Icon name="download" size={16} />}
								>
									Tải JSON
								</Button>
							</div>
						</div>

						{viewRawJson || !parsedResult ? (
							<div className="rounded-2xl bg-m3-surface-container-high p-4 text-xs font-mono text-m3-on-surface">
								<ScrollArea type="hover" className="max-h-96">
									<pre>{gradeJson}</pre>
								</ScrollArea>
							</div>
						) : (
							<div className="space-y-4">
								{/* Overview score cards */}
								<div className="grid gap-3 sm:grid-cols-3">
									<div className="rounded-2xl bg-m3-surface-container px-4 py-3">
										<Text
											variant="label-sm"
											className="text-[11px] font-bold uppercase text-m3-on-surface-variant"
										>
											Tổng điểm
										</Text>
										<div className="mt-1 text-2xl font-black text-m3-on-surface">
											{parsedResult.totalScore ?? 0}{" "}
											<span className="text-sm font-normal opacity-60">
												/ {parsedResult.maxScore ?? 125}
											</span>
										</div>
									</div>

									<div className="rounded-2xl bg-m3-surface-container px-4 py-3">
										<Text
											variant="label-sm"
											className="text-[11px] font-bold uppercase text-m3-on-surface-variant"
										>
											Tỷ lệ đạt
										</Text>
										<div className="mt-1 text-2xl font-black text-m3-on-surface">
											{parsedResult.percentage ?? 0}%
										</div>
									</div>

									<div className="rounded-2xl bg-m3-surface-container px-4 py-3">
										<Text
											variant="label-sm"
											className="text-[11px] font-bold uppercase text-m3-on-surface-variant"
										>
											Số Task đạt
										</Text>
										<div className="mt-1 text-2xl font-black text-m3-on-surface">
											{
												(parsedResult.taskResults ?? []).filter(
													(t) => t.isPassed,
												).length
											}{" "}
											<span className="text-sm font-normal opacity-60">
												/ {(parsedResult.taskResults ?? []).length}
											</span>
										</div>
									</div>
								</div>

								{/* Task details table/list */}
								<div className="space-y-2">
									{(parsedResult.taskResults ?? []).map((t, i) => (
										<div
											key={t.taskId || i}
											className="rounded-2xl bg-m3-surface-container p-4 transition hover:bg-m3-surface-container-high"
										>
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<Icon
														name={t.isPassed ? "check_circle" : "cancel"}
														className={`text-lg ${t.isPassed ? "text-emerald-500" : "text-m3-error"
															}`}
													/>
													<span className="font-mono text-xs font-bold text-m3-primary">
														{t.taskId}
													</span>
													<span className="text-xs font-semibold text-m3-on-surface">
														{t.taskName || `Task ${i + 1}`}
													</span>
												</div>
												<span className="text-xs font-bold text-m3-on-surface">
													{t.score ?? 0} / {t.maxScore ?? 0} đ
												</span>
											</div>

											{(t.errors || []).length > 0 && (
												<div className="mt-2 space-y-1 pl-6">
													{t.errors?.map((err) => (
														<p
															key={`err-${t.taskId || "task"}-${err}`}
															className="text-xs text-m3-error"
														>
															• {err}
														</p>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</section>

			{/* Bug Notes Section (Integrated from previous testing module) */}
			<Card
				variant="filled"
				disableElevation
				className="bg-m3-surface-container p-6"
			>
				<div className="mb-5 flex flex-wrap items-center justify-between gap-2">
					<div>
						<div className="flex items-center gap-2">
							<Icon
								name="bug_report"
								variant="rounded"
								size={22}
								className="text-m3-tertiary"
							/>
							<Text
								variant="title-lg"
								className="font-semibold text-m3-on-surface"
							>
								Bug Notes
							</Text>
						</div>
						<Text
							variant="body-sm"
							className="mt-0.5 text-xs text-m3-on-surface-variant"
						>
							Ghi chú theo dõi bug cho:{" "}
							<span className="font-semibold text-m3-on-surface">
								{selectedProjectDisplayName}
							</span>{" "}
							({bugNotes.length} ghi chú)
						</Text>
					</div>

					<Chip
						variant="assist"
						label={`Tổng bug notes: ${bugNotes.length}`}
						className="bg-m3-surface-container-high text-m3-on-surface-variant text-xs"
					/>
				</div>

				<div className="grid gap-5 lg:grid-cols-2">
					{/* Create Bug Note Sub-Card */}
					<Card
						variant="filled"
						disableElevation
						className="space-y-4 rounded-2xl bg-m3-surface-container-low p-5"
					>
						<TextField
							fullWidth
							variant="filled"
							label="Tiêu đề bug"
							value={bugTitle}
							onChange={(val) => {
								setBugTitle(val);
								setIsBugTitleDirty(true);
							}}
							placeholder="Ví dụ: Task 03 chấm sai bảng tính biểu đồ"
						/>

						<Select
							fullWidth
							variant="filled"
							label="Mức độ nghiêm trọng"
							value={bugSeverity}
							options={severityOptions}
							onChange={(val) => setBugSeverity(val as BugSeverity)}
						/>

						<TextField
							fullWidth
							type="textarea"
							variant="filled"
							label="Mô tả bug chi tiết"
							rows={4}
							value={bugDescription}
							onChange={(val) => setBugDescription(val)}
							placeholder="Mô tả bước tái hiện, điều kiện quy tắc bị sai lệch, kết quả mong đợi..."
						/>

						<Button
							fullWidth
							colorStyle="filled"
							size="sm"
							onClick={() => void handleSaveBugNote()}
							disabled={isSavingBugNote || !effectiveProjectCode}
							loading={isSavingBugNote}
							icon={<Icon name="save" variant="rounded" size={18} />}
						>
							{isSavingBugNote ? "Đang lưu..." : "Lưu bug note"}
						</Button>

						{bugActionMessage && (
							<Text
								variant="body-sm"
								className="mt-2 block text-xs text-m3-on-surface-variant"
							>
								{bugActionMessage}
							</Text>
						)}
					</Card>

					{/* Bug Notes List Scroll Area */}
					<ScrollArea
						type="hover"
						orientation="vertical"
						className="max-h-120 pr-2"
					>
						<div className="space-y-3">
							{isLoadingBugNotes && (
								<div className="flex items-center justify-center rounded-2xl bg-m3-surface-container-low p-8 text-center">
									<ProgressIndicator
										variant="circular"
										shape="wavy"
										showTrack
										size={32}
										aria-label="Đang tải bug notes..."
									/>
								</div>
							)}

							{!isLoadingBugNotes && bugNotes.length === 0 && (
								<div className="flex flex-col items-center justify-center rounded-2xl bg-m3-surface-container-low p-8 text-center">
									<Icon
										name="task_alt"
										variant="rounded"
										size={36}
										className="mb-2 text-m3-on-surface-variant/60"
									/>
									<Text
										variant="body-md"
										className="text-xs text-m3-on-surface-variant"
									>
										Chưa có bug note nào cho project này.
									</Text>
								</div>
							)}

							{!isLoadingBugNotes &&
								bugNotes.map((note) => {
									const sev =
										severityMeta[note.severity] || severityMeta.medium;
									return (
										<Card
											key={note.id}
											variant="filled"
											disableElevation
											className="rounded-2xl bg-m3-surface-container-low p-4 transition-colors hover:bg-m3-surface-container-high"
										>
											<div className="mb-2 flex items-start justify-between gap-2">
												<div>
													<Text
														variant="title-sm"
														className="font-semibold text-m3-on-surface"
													>
														{note.title}
													</Text>
													<Text
														variant="label-sm"
														className="text-xs text-m3-on-surface-variant/80"
													>
														{new Date(note.createdAt).toLocaleString("vi-VN")}
													</Text>
												</div>
												<span
													className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sev.badgeClass}`}
												>
													{sev.label}
												</span>
											</div>

											{note.scoreSummary && (
												<div className="mb-2 rounded-xl bg-m3-surface-container px-3 py-1.5 text-xs text-m3-on-surface-variant">
													Điểm: {note.scoreSummary.totalScore}/
													{note.scoreSummary.maxScore} (
													{note.scoreSummary.percentage}%) -{" "}
													{note.scoreSummary.status}
												</div>
											)}

											<Text
												variant="body-sm"
												className="whitespace-pre-wrap text-xs text-m3-on-surface"
											>
												{note.description}
											</Text>

											{note.gradingError && (
												<p className="mt-2 text-xs text-m3-error">
													Lỗi: {note.gradingError}
												</p>
											)}

											<div className="mt-3 flex items-center justify-end gap-2 border-t border-m3-surface-container-high pt-2">
												<Button
													colorStyle="text"
													size="sm"
													onClick={() => void handleCopyBugNote(note)}
													icon={
														<Icon
															name={
																copiedNoteId === note.id
																	? "check"
																	: "content_copy"
															}
															size={16}
														/>
													}
												>
													{copiedNoteId === note.id ? "Đã copy" : "Copy"}
												</Button>
												<Button
													colorStyle="text"
													size="sm"
													onClick={() => void handleDeleteBugNote(note.id)}
													disabled={deletingBugNoteId === note.id}
													loading={deletingBugNoteId === note.id}
													icon={<Icon name="delete" size={16} />}
													className="text-m3-error hover:bg-m3-error/10"
												>
													Xóa
												</Button>
											</div>
										</Card>
									);
								})}
						</div>
					</ScrollArea>
				</div>
			</Card>
		</div>
	);
};
