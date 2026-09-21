import {
	Button,
	Card,
	Chip,
	Icon,
	ProgressIndicator,
	ScrollArea,
	Select,
	type SelectOption,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import { useEffect, useMemo, useState } from "react";
import { showAlert, showConfirm } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { usePageHeader } from "../context/PageActionsContext";
import { ResultCard } from "../features/grading";
import { gradingService } from "../services/grading.service";
import type { GradingResult } from "../types";
import type {
	BugSeverity,
	CreateGradingTestBugNoteRequest,
	GradingTestBugNote,
} from "../types/grading-test-bug-note.types";

interface TestProjectOption {
	code: string;
	displayName: string;
	fileType: "excel" | "word";
}

const normalizeProjectOption = (project: {
	code: string;
	endpoint?: string;
	fileType?: string;
	displayName?: string;
}): TestProjectOption => {
	const rawCode = project.code.trim().toLowerCase();
	const endpoint = (project.endpoint || "").trim().toLowerCase();
	const displayName = (project.displayName || "").trim().toLowerCase();
	const normalizedFileType = (project.fileType || "").trim().toLowerCase();

	const directMatch = rawCode.match(/^project(\d{1,2})-(excel|word)$/);
	if (directMatch) {
		const fileType = directMatch[2] as "excel" | "word";
		return {
			code: `project${directMatch[1].padStart(2, "0")}-${fileType}`,
			displayName:
				project.displayName ||
				`Project ${directMatch[1].padStart(2, "0")} ${fileType.toUpperCase()}`,
			fileType,
		};
	}

	const legacyCodeMatch = rawCode.match(/^project(\d{1,2})$/);
	const endpointMatch = endpoint.match(/project(\d{1,2})$/);
	const projectNumber = legacyCodeMatch?.[1] || endpointMatch?.[1];
	if (!projectNumber) {
		const fallbackFileType: "excel" | "word" =
			normalizedFileType === "word" ? "word" : "excel";
		return {
			code: project.code,
			displayName: project.displayName || project.code,
			fileType: fallbackFileType,
		};
	}

	let fileType: "excel" | "word" | null = null;
	if (normalizedFileType === "word" || normalizedFileType === "excel") {
		fileType = normalizedFileType;
	} else if (
		rawCode.includes("word") ||
		endpoint.includes("/word/") ||
		displayName.includes("word")
	) {
		fileType = "word";
	} else if (
		rawCode.includes("excel") ||
		endpoint.includes("/excel/") ||
		displayName.includes("excel")
	) {
		fileType = "excel";
	}

	if (!fileType) {
		fileType = "excel";
	}

	return {
		code: `project${projectNumber.padStart(2, "0")}-${fileType}`,
		displayName:
			project.displayName ||
			`Project ${projectNumber.padStart(2, "0")} ${fileType.toUpperCase()}`,
		fileType,
	};
};

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

const GradingView = () => {
	const { getAccessToken } = useAuth();
	const [projectCode, setProjectCode] = useState("project01");
	const [projectOptions, setProjectOptions] = useState<TestProjectOption[]>([]);
	const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
	const [loadingProjects, setLoadingProjects] = useState(true);
	const [studentFile, setStudentFile] = useState<File | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<GradingResult | null>(null);
	const [error, setError] = useState<string | null>(null);

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

	useEffect(() => {
		let active = true;

		const loadProjects = async () => {
			setLoadingProjects(true);
			setProjectLoadError(null);

			try {
				const projects =
					await gradingService.getTestingProjects(getAccessToken);
				if (!active) {
					return;
				}

				const mapped = projects.map((project) =>
					normalizeProjectOption(project),
				);
				const defaultProject =
					mapped.find((project) => project.fileType === "excel") || mapped[0];

				setProjectOptions(mapped);
				if (defaultProject) {
					setProjectCode(defaultProject.code);
				}
			} catch (err: unknown) {
				if (!active) {
					return;
				}

				const message =
					err instanceof Error
						? err.message
						: "Không tải được danh sách project test.";
				setProjectLoadError(message);
			} finally {
				if (active) {
					setLoadingProjects(false);
				}
			}
		};

		void loadProjects();
		return () => {
			active = false;
		};
	}, [getAccessToken]);

	useEffect(() => {
		let active = true;

		const loadBugNotes = async () => {
			setIsLoadingBugNotes(true);
			try {
				const notes = await gradingService.getTestingBugNotes(getAccessToken);
				if (!active) {
					return;
				}

				setBugNotes(notes);
			} catch (err: unknown) {
				if (!active) {
					return;
				}

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
	}, [getAccessToken]);

	const excelProjectOptions = useMemo(
		() => projectOptions.filter((project) => project.fileType === "excel"),
		[projectOptions],
	);

	const wordProjectOptions = useMemo(
		() => projectOptions.filter((project) => project.fileType === "word"),
		[projectOptions],
	);

	const excelSelectOptions = useMemo<SelectOption[]>(
		() =>
			excelProjectOptions.map((project) => ({
				label: project.displayName,
				value: project.code,
			})),
		[excelProjectOptions],
	);

	const wordSelectOptions = useMemo<SelectOption[]>(
		() =>
			wordProjectOptions.map((project) => ({
				label: project.displayName,
				value: project.code,
			})),
		[wordProjectOptions],
	);

	const selectedProjectDisplayName = useMemo(
		() =>
			projectOptions.find((project) => project.code === projectCode)
				?.displayName || projectCode,
		[projectCode, projectOptions],
	);

	const currentProjectNotes = useMemo(
		() =>
			bugNotes
				.filter((note) => note.projectCode === projectCode)
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				),
		[bugNotes, projectCode],
	);

	const autoBugTitle = useMemo(
		() => selectedProjectDisplayName,
		[selectedProjectDisplayName],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset bug input state when projectCode changes
	useEffect(() => {
		setIsBugTitleDirty(false);
		setBugDescription("");
	}, [projectCode]);

	useEffect(() => {
		if (!isBugTitleDirty) {
			setBugTitle(autoBugTitle);
		}
	}, [autoBugTitle, isBugTitleDirty]);

	const isValidGradingFile = (file: File): boolean => {
		const fileName = file.name.toLowerCase();
		return (
			fileName.endsWith(".xls") ||
			fileName.endsWith(".xlsx") ||
			fileName.endsWith(".xlsm") ||
			fileName.endsWith(".docx") ||
			fileName.endsWith(".txt")
		);
	};

	const handleProjectChange = (nextProjectCode: string) => {
		setProjectCode(nextProjectCode);
		setError(null);
		setBugActionMessage(null);
		setResult(null);
	};

	const setSelectedFile = (file: File | null) => {
		if (!file) return;
		if (!isValidGradingFile(file)) {
			void showAlert({
				title: "Định dạng file không hỗ trợ",
				message: "File phải có định dạng .xls, .xlsx, .xlsm, .docx hoặc .txt",
				variant: "warning",
			});
			return;
		}
		setStudentFile(file);
		setError(null);
		setResult(null);
	};

	const handleGrade = async () => {
		if (!studentFile) {
			void showAlert({
				title: "Chưa chọn file",
				message: "Vui lòng chọn file bài làm của học sinh!",
				variant: "warning",
			});
			return;
		}

		setLoading(true);
		setError(null);
		setBugActionMessage(null);

		try {
			const data = await gradingService.gradeForTesting(
				projectCode,
				studentFile,
				getAccessToken,
			);
			setResult(data);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Có lỗi xảy ra khi chấm điểm.";
			setError(message);
			setResult(null);
		} finally {
			setLoading(false);
		}
	};

	const buildBugNoteClipboardText = (note: GradingTestBugNote): string => {
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

		return lines.join("\n");
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
			projectCode,
			projectDisplayName: selectedProjectDisplayName,
			title,
			description,
			severity: bugSeverity,
			scoreSummary: result
				? {
						totalScore: result.totalScore,
						maxScore: result.maxScore,
						percentage: result.percentage,
						status: result.status,
					}
				: undefined,
			gradingError: error || undefined,
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
			setBugActionMessage("Đã lưu bug note.");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Không lưu được bug note.";
			setBugActionMessage(message);
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
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Không xóa được bug note.";
			setBugActionMessage(message);
		} finally {
			setDeletingBugNoteId(null);
		}
	};

	const handleCopyBugNote = async (note: GradingTestBugNote) => {
		const text = buildBugNoteClipboardText(note);

		try {
			await navigator.clipboard.writeText(text);
			setCopiedNoteId(note.id);
			setTimeout(
				() => setCopiedNoteId((prev) => (prev === note.id ? null : prev)),
				1500,
			);
		} catch {
			setBugActionMessage(
				"Không copy được bug note. Hãy copy thủ công từ danh sách.",
			);
		}
	};

	const isExcelActive = excelProjectOptions.some(
		(project) => project.code === projectCode,
	);
	const isWordActive = wordProjectOptions.some(
		(project) => project.code === projectCode,
	);

	const pageHeaderConfig = useMemo(
		() => ({
			title: "Kiểm thử chấm điểm (Excel & Word)",
			subtitle:
				"Trang này để test nhanh lượng chấm điểm Excel và Word. Bạn có thể lưu bug note theo từng project để theo dõi.",
		}),
		[],
	);

	usePageHeader(pageHeaderConfig, [pageHeaderConfig]);

	return (
		<div className="mx-auto max-w-4xl p-4">
			{/* Main Grading Card - Zero Border & Shadow, Pure Tonal Depth */}
			<Card
				variant="filled"
				disableElevation
				className="rounded-m3-extra-large bg-m3-surface-container p-6"
			>
				<div className="mb-6 grid gap-4 md:grid-cols-2">
					<Select
						label="Chọn bài Excel"
						variant="filled"
						value={isExcelActive ? projectCode : ""}
						onChange={(val) => handleProjectChange(val)}
						options={excelSelectOptions}
						disabled={loadingProjects || excelSelectOptions.length === 0}
						placeholder={
							excelSelectOptions.length === 0
								? "Không có bài Excel"
								: "Chọn bài Excel"
						}
						fullWidth
					/>

					<Select
						label="Chọn bài Word"
						variant="filled"
						value={isWordActive ? projectCode : ""}
						onChange={(val) => handleProjectChange(val)}
						options={wordSelectOptions}
						disabled={loadingProjects || wordSelectOptions.length === 0}
						placeholder={
							wordSelectOptions.length === 0
								? "Không có bài Word"
								: "Chọn bài Word"
						}
						fullWidth
					/>

					{projectLoadError && (
						<Text variant="body-sm" className="text-m3-error md:col-span-2">
							{projectLoadError}
						</Text>
					)}
				</div>

				<div className="mb-6">
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop file upload container */}
					<div
						className={`flex flex-col items-center justify-center rounded-m3-large p-8 transition-colors ${
							isDragOver
								? "bg-m3-primary-container/40"
								: "bg-m3-surface-container-high hover:bg-m3-surface-container-highest"
						}`}
						onDragOver={(e) => {
							e.preventDefault();
							e.dataTransfer.dropEffect = "copy";
							setIsDragOver(true);
						}}
						onDragLeave={() => setIsDragOver(false)}
						onDrop={(e) => {
							e.preventDefault();
							setIsDragOver(false);
							const file = e.dataTransfer.files?.[0] || null;
							setSelectedFile(file);
						}}
					>
						<input
							type="file"
							accept=".xls,.xlsx,.xlsm,.docx,.dotx,.txt"
							onChange={(e) => {
								setSelectedFile(e.target.files?.[0] || null);
								e.target.value = "";
							}}
							className="hidden"
							id="student-upload"
						/>
						<label
							htmlFor="student-upload"
							className="flex cursor-pointer flex-col items-center text-center"
						>
							<Icon
								name="table_chart"
								variant="rounded"
								size={48}
								className="mb-2 text-m3-primary"
							/>
							<Text
								variant="title-sm"
								className="font-medium text-m3-on-surface"
							>
								File bài làm học sinh (Excel hoặc Word)
							</Text>
							<Text
								variant="body-sm"
								className="mt-1 text-m3-on-surface-variant"
							>
								Kéo thả file .xlsx, .xls, .xlsm, .docx hoặc .txt vào đây
							</Text>
						</label>

						{studentFile && (
							<div className="mt-3">
								<Chip
									variant="input"
									label={studentFile.name}
									leadingIcon={
										<Icon name="description" variant="rounded" size={18} />
									}
									onRemove={() => setStudentFile(null)}
								/>
							</div>
						)}
					</div>
				</div>

				{error && (
					<div className="mb-4 flex items-center gap-3 rounded-m3-medium bg-m3-error-container p-4 text-sm text-m3-on-error-container">
						<Icon
							name="error"
							variant="rounded"
							size={20}
							className="shrink-0"
						/>
						<span>{error}</span>
					</div>
				)}

				<Button
					type="button"
					fullWidth
					colorStyle="filled"
					size="md"
					onClick={handleGrade}
					disabled={loading || loadingProjects || projectOptions.length === 0}
					loading={loading}
					icon={
						!loading ? (
							<Icon name="upload" variant="rounded" size={20} />
						) : undefined
					}
				>
					{loading ? "Đang chấm điểm..." : "Bắt đầu chấm"}
				</Button>
			</Card>

			{result && (
				<div className="mt-6">
					<ResultCard result={result} />
				</div>
			)}

			{/* Bug Notes Section - Zero Border & Shadow */}
			<Card
				variant="filled"
				disableElevation
				className="mt-6 rounded-m3-extra-large bg-m3-surface-container p-6"
			>
				<div className="mb-5 flex flex-wrap items-center justify-between gap-2">
					<div>
						<div className="flex items-center gap-2">
							<Icon
								name="bug_report"
								variant="rounded"
								size={20}
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
							className="mt-0.5 text-m3-on-surface-variant"
						>
							Đang xem:{" "}
							<span className="font-semibold text-m3-on-surface">
								{selectedProjectDisplayName}
							</span>{" "}
							({currentProjectNotes.length} note)
						</Text>
					</div>
					<Chip
						variant="assist"
						label={`Tổng notes đã lưu: ${bugNotes.length}`}
						className="bg-m3-surface-container-high text-m3-on-surface-variant"
					/>
				</div>

				<div className="grid gap-5 md:grid-cols-2">
					{/* Create Bug Note Sub-Card */}
					<Card
						variant="filled"
						disableElevation
						className="space-y-4 rounded-m3-large bg-m3-surface-container-low p-4"
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
							placeholder="Ví dụ: Project 09 chấm sai task T4"
						/>

						<Select
							fullWidth
							variant="filled"
							label="Mức độ"
							value={bugSeverity}
							options={severityOptions}
							onChange={(val) => setBugSeverity(val as BugSeverity)}
						/>

						<TextField
							fullWidth
							type="textarea"
							variant="filled"
							label="Mô tả bug"
							rows={4}
							value={bugDescription}
							onChange={(val) => setBugDescription(val)}
							placeholder="Mô tả bước tái hiện, kết quả mong đợi, kết quả thực tế..."
						/>

						<Button
							type="button"
							fullWidth
							colorStyle="filled"
							size="sm"
							onClick={() => void handleSaveBugNote()}
							disabled={isSavingBugNote}
							loading={isSavingBugNote}
							icon={<Icon name="save" variant="rounded" size={18} />}
						>
							{isSavingBugNote ? "Đang lưu..." : "Lưu bug note"}
						</Button>

						{bugActionMessage && (
							<Text
								variant="body-sm"
								className="mt-2 block text-m3-on-surface-variant"
							>
								{bugActionMessage}
							</Text>
						)}
					</Card>

					{/* Bug Notes List Scroll Area */}
					<ScrollArea className="max-h-115 pr-2">
						<div className="space-y-3">
							{isLoadingBugNotes && (
								<div className="flex items-center justify-center rounded-m3-large bg-m3-surface-container-low p-8 text-center">
									<ProgressIndicator
										variant="circular"
										shape="wavy"
										showTrack
										size={32}
										aria-label="Đang tải bug notes..."
									/>
								</div>
							)}

							{!isLoadingBugNotes && currentProjectNotes.length === 0 && (
								<div className="flex flex-col items-center justify-center rounded-m3-large bg-m3-surface-container-low p-8 text-center">
									<Icon
										name="task_alt"
										variant="rounded"
										size={36}
										className="mb-2 text-m3-on-surface-variant/60"
									/>
									<Text
										variant="body-md"
										className="text-m3-on-surface-variant"
									>
										Chưa có bug note nào cho project này.
									</Text>
								</div>
							)}

							{!isLoadingBugNotes &&
								currentProjectNotes.map((note) => (
									<Card
										key={note.id}
										variant="filled"
										disableElevation
										className="rounded-m3-large bg-m3-surface-container-low p-4 transition-colors hover:bg-m3-surface-container-high"
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
													className="text-m3-on-surface-variant/80"
												>
													{new Date(note.createdAt).toLocaleString("vi-VN")}
												</Text>
											</div>
											<span
												className={`rounded-m3-full px-2.5 py-0.5 text-[11px] font-semibold ${
													severityMeta[note.severity].badgeClass
												}`}
											>
												{severityMeta[note.severity].label}
											</span>
										</div>

										{note.scoreSummary && (
											<div className="mb-2 rounded-m3-small bg-m3-surface-container px-2.5 py-1.5 text-xs text-m3-on-surface-variant">
												Score: {note.scoreSummary.totalScore}/
												{note.scoreSummary.maxScore} (
												{note.scoreSummary.percentage}%) -{" "}
												{note.scoreSummary.status}
											</div>
										)}

										{note.gradingError && (
											<div className="mb-2 rounded-m3-small bg-m3-error-container px-2.5 py-1.5 text-xs text-m3-on-error-container">
												{note.gradingError}
											</div>
										)}

										<Text
											variant="body-sm"
											className="mb-3 whitespace-pre-wrap text-m3-on-surface"
										>
											{note.description}
										</Text>

										<div className="flex items-center gap-2">
											<Button
												type="button"
												colorStyle="tonal"
												size="xs"
												onClick={() => void handleCopyBugNote(note)}
												icon={
													<Icon
														name={
															copiedNoteId === note.id
																? "check"
																: "content_copy"
														}
														variant="rounded"
														size={14}
													/>
												}
											>
												{copiedNoteId === note.id ? "Đã copy" : "Copy"}
											</Button>

											<Button
												type="button"
												colorStyle="text"
												size="xs"
												className="text-m3-error hover:bg-m3-error/10"
												onClick={() => void handleDeleteBugNote(note.id)}
												disabled={deletingBugNoteId === note.id}
												icon={
													<Icon name="delete" variant="rounded" size={14} />
												}
											>
												{deletingBugNoteId === note.id ? "Đang xóa..." : "Xóa"}
											</Button>
										</div>
									</Card>
								))}
						</div>
					</ScrollArea>
				</div>
			</Card>
		</div>
	);
};

export default GradingView;
