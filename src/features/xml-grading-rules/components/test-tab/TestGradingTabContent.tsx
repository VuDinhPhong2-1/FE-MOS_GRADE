import { Icon, ScrollArea, Text } from "@bug-on/m3-expressive";
import type React from "react";
import { useState } from "react";
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

const inputClass =
	"w-full rounded-2xl bg-m3-surface-container-high px-4 py-3 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest cursor-pointer";

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
	const [viewRawJson, setViewRawJson] = useState(false);

	let parsedResult: GradeResultView | null = null;
	if (gradeJson) {
		try {
			parsedResult = JSON.parse(gradeJson) as GradeResultView;
		} catch {
			parsedResult = null;
		}
	}

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
		link.download = `test-result-${gradeProjectCode || "report"}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
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
						chấm trước khi đưa ruleset vào sử dụng.
					</Text>
				</div>
			</div>

			{/* Form inputs */}
			<div className="grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Project cần chấm
					<select
						value={gradeProjectCode}
						onChange={(e) => onProjectCodeChange(e.target.value)}
						disabled={isTestGrading}
						className={inputClass}
					>
						<option value="">Chọn project...</option>
						{selected.projects.map((p) => (
							<option key={p.projectCode} value={p.projectCode}>
								{p.projectName || p.projectCode}
							</option>
						))}
					</select>
				</label>

				<label className="text-xs font-semibold text-m3-on-surface-variant">
					File bài làm{" "}
					{gradeFile && (
						<span className="font-bold text-m3-on-surface">
							({gradeFile.name})
						</span>
					)}
					{gradeAttachmentFile && (
						<span className="ml-1 font-bold text-m3-primary">
							(+ 1 đính kèm: {gradeAttachmentFile.name})
						</span>
					)}
					<input
						type="file"
						multiple
						accept=".xlsx,.xlsm,.docx,.pptx,.pdf"
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
						}}
						disabled={isTestGrading}
						className="mt-1 block w-full rounded-2xl bg-m3-surface-container-high px-4 py-2 text-xs text-m3-on-surface file:mr-3 file:rounded-xl file:border-0 file:bg-m3-surface-container-highest file:px-3 file:py-1 file:text-xs file:font-bold file:text-m3-on-surface"
					/>
				</label>

				<button
					type="button"
					onClick={onStartGrade}
					disabled={isTestGrading}
					className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-m3-primary px-5 text-sm font-bold text-m3-on-primary transition hover:bg-m3-primary/90 disabled:opacity-50"
				>
					<Icon
						name={isTestGrading ? "refresh" : "play_arrow"}
						className={`text-lg ${isTestGrading ? "animate-spin" : ""}`}
					/>
					<span>{isTestGrading ? "Đang chấm..." : "Chấm thử"}</span>
				</button>
			</div>

			{/* Loading banner */}
			{isTestGrading && (
				<div className="mt-4 flex items-center gap-3 rounded-2xl bg-m3-primary-container px-4 py-3 text-xs font-semibold text-m3-on-primary-container">
					<Icon name="refresh" className="animate-spin text-base" />
					<span>
						Đang giải nén và đối soát XML theo quy tắc, vui lòng chờ...
					</span>
				</div>
			)}

			{/* Result section */}
			{gradeJson && (
				<div className="mt-6 space-y-4 rounded-3xl bg-m3-surface-container-low p-6">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-m3-surface-container-high pb-4">
						<div className="flex items-center gap-2">
							<h4 className="text-base font-bold text-m3-on-surface">
								Kết quả chấm thử nghiệm
							</h4>
							{parsedResult && (
								<span
									className={`rounded-full px-3 py-1 text-xs font-bold ${
										parsedResult.isPassed
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
							<button
								type="button"
								onClick={() => setViewRawJson(!viewRawJson)}
								className="rounded-xl bg-m3-surface-container-high px-3 py-1.5 text-xs font-semibold text-m3-on-surface transition hover:bg-m3-surface-container-highest"
							>
								{viewRawJson ? "Giao diện Bảng" : "Xem JSON"}
							</button>
							<button
								type="button"
								onClick={copyJsonToClipboard}
								title="Sao chép JSON"
								aria-label="Sao chép JSON"
								className="rounded-xl bg-m3-surface-container-high p-2 text-m3-on-surface transition hover:bg-m3-surface-container-highest"
							>
								<Icon name="content_copy" className="text-sm" />
							</button>
							<button
								type="button"
								onClick={downloadJson}
								title="Tải xuống JSON"
								aria-label="Tải xuống JSON"
								className="rounded-xl bg-m3-surface-container-high p-2 text-m3-on-surface transition hover:bg-m3-surface-container-highest"
							>
								<Icon name="download" className="text-sm" />
							</button>
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
											(parsedResult.taskResults ?? []).filter((t) => t.isPassed)
												.length
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
													className={`text-lg ${
														t.isPassed ? "text-emerald-500" : "text-m3-error"
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
	);
};
