import {
	Card,
	Icon,
	ProgressIndicator,
	Select,
	type SelectOption,
} from "@bug-on/m3-expressive";
import { memo, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { analyticsService } from "../../services/analytics.service";
import type {
	ClassAnalyticsOverviewResponse,
	WeakTaskResponse,
} from "../../types/analytics.types";
import type { Assignment } from "../../types/assignment.types";
import {
	mapOverviewToGaugeData,
	mapWeakTasksToBarChart,
} from "../../utils/analyticsMappers";

interface ClassAnalyticsPanelProps {
	classId: string;
	assignments: Assignment[];
}

const pct = (v: number) => `${Number.isFinite(v) ? v.toFixed(2) : "0.00"}%`;

const getProjectDisplayName = (
	projectEndpoint?: string,
	projectId?: string,
	assignmentsList: Assignment[] = [],
) => {
	const cleanEp = (projectEndpoint || "").replace(/^\/?grading\/?/i, "").trim();
	if (cleanEp) {
		const matched = assignmentsList.find(
			(a) =>
				(a.gradingApiEndpoint || "")
					.replace(/^\/?grading\/?/i, "")
					.trim()
					.toLowerCase() === cleanEp.toLowerCase(),
		);
		if (matched?.name) return matched.name;

		const parts = cleanEp.split("/");
		if (parts.length === 2) {
			const subject = parts[0].toUpperCase();
			const proj = parts[1].replace(/project/i, "Project ");
			return `${subject} - ${proj.charAt(0).toUpperCase() + proj.slice(1)}`;
		}
		return cleanEp;
	}

	if (projectId) return projectId;
	return "Dự án chung";
};

const TOP_OPTIONS: SelectOption[] = [
	{ value: "5", label: "Top 5 câu sai nhiều" },
	{ value: "10", label: "Top 10 câu sai nhiều" },
	{ value: "15", label: "Top 15 câu sai nhiều" },
];

const ClassAnalyticsPanelComponent = ({
	classId,
	assignments,
}: ClassAnalyticsPanelProps) => {
	const { getAccessToken } = useAuth();

	const [overview, setOverview] =
		useState<ClassAnalyticsOverviewResponse | null>(null);
	const [weakTasks, setWeakTasks] = useState<WeakTaskResponse[]>([]);
	const [projectEndpoint, setProjectEndpoint] = useState<string>("");
	const [top, setTop] = useState<number>(10);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");

	const endpointOptions = useMemo(() => {
		const values = assignments
			.map((a) =>
				(a.gradingApiEndpoint || "").replace(/^\/?grading\/?/i, "").trim(),
			)
			.filter((x) => !!x);
		return Array.from(new Set(values));
	}, [assignments]);

	const endpointSelectOptions: SelectOption[] = useMemo(
		() => [
			{ value: "", label: "Tất cả dự án" },
			...endpointOptions.map((ep) => ({
				value: ep,
				label: getProjectDisplayName(ep, undefined, assignments),
			})),
		],
		[endpointOptions, assignments],
	);

	useEffect(() => {
		if (!classId) return;

		const load = async () => {
			setLoading(true);
			setError("");
			try {
				const [overviewData, weakTaskData] = await Promise.all([
					analyticsService.getClassOverview(classId, getAccessToken),
					analyticsService.getWeakTasks(
						classId,
						getAccessToken,
						projectEndpoint || undefined,
						top,
					),
				]);

				setOverview(overviewData);
				setWeakTasks(weakTaskData);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Không thể tải phân tích lớp học",
				);
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [classId, getAccessToken, projectEndpoint, top]);

	const gaugeData = useMemo(
		() => (overview ? mapOverviewToGaugeData(overview) : []),
		[overview],
	);
	const weakTaskChartRows = useMemo(
		() => mapWeakTasksToBarChart(weakTasks),
		[weakTasks],
	);

	return (
		<Card variant="filled" className="relative overflow-hidden p-4 sm:p-6">
			<div className="relative">
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<h2 className="flex items-center gap-2 text-lg font-bold text-m3-on-surface">
							<Icon name="bar_chart" className="text-m3-primary text-xl" />
							Phân tích kết quả lớp học
						</h2>
						<p className="mt-1 text-sm text-m3-on-surface-variant">
							Tổng hợp theo từng lượt chấm để xác định xu hướng học tập và câu
							hỏi cần củng cố.
						</p>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="w-full sm:w-48">
							<Select
								variant="outlined"
								options={endpointSelectOptions}
								value={projectEndpoint}
								onChange={(val) => setProjectEndpoint(val)}
								fullWidth
								dense
								colorVariant="vibrant"
								showDividers={false}
							/>
						</div>
						<div className="w-full sm:w-54">
							<Select
								variant="outlined"
								options={TOP_OPTIONS}
								value={String(top)}
								onChange={(val) => setTop(Number(val) || 10)}
								fullWidth
								dense
								colorVariant="vibrant"
								showDividers={false}
							/>
						</div>
					</div>
				</div>

				<div className="mb-4 rounded-full bg-m3-primary-container sm:px-4 px-3.5 py-2.5 text-xs text-m3-on-primary-container">
					Các chỉ số bên dưới được tính theo <strong>lượt chấm</strong> (mỗi lần
					nộp/chấm lại được tính là 1 lượt).
				</div>

				{error && (
					<div className="mb-4 flex items-center gap-2 rounded-2xl bg-m3-error-container/40 p-3.5 text-sm text-m3-on-error-container shadow-2xs">
						<Icon name="error" className="text-lg text-m3-error" />
						{error}
					</div>
				)}

				{loading ? (
					<div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-m3-surface-container-low px-4 py-8 text-sm text-m3-on-surface-variant">
						<ProgressIndicator
							variant="circular"
							shape="wavy"
							size={64}
							aria-label="Đang tải dữ liệu phân tích..."
						/>
						<span>Đang tải dữ liệu phân tích...</span>
					</div>
				) : (
					<>
						<div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
							<Card
								variant="outlined"
								className="p-4"
								title="Trung bình % của tất cả lượt chấm trong lớp"
							>
								<div className="text-xs font-medium text-m3-on-surface-variant">
									Điểm TB theo lượt chấm
								</div>
								<div className="text-2xl font-bold text-m3-primary">
									{pct(overview?.averagePercentage || 0)}
								</div>
								<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
									TB % của tất cả lượt chấm
								</div>
							</Card>
							<Card
								variant="outlined"
								className="p-4"
								title="Tỷ lệ lượt chấm có điểm từ 60% trở lên"
							>
								<div className="text-xs font-medium text-m3-on-surface-variant">
									Tỷ lệ đạt (&gt;= 60%)
								</div>
								<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
									{pct(overview?.passRate || 0)}
								</div>
								<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
									Số lượt đạt / tổng lượt
								</div>
							</Card>
							<Card
								variant="outlined"
								className="p-4"
								title="Tỷ lệ lượt chấm dưới 40%"
							>
								<div className="text-xs font-medium text-m3-on-surface-variant">
									Tỷ lệ cảnh báo (&lt; 40%)
								</div>
								<div className="text-2xl font-bold text-m3-error">
									{pct(overview?.warningRate || 0)}
								</div>
								<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
									Số lượt dưới 40%
								</div>
							</Card>
							<Card
								variant="outlined"
								className="p-4"
								title="Tổng số lượt chấm đã được lưu"
							>
								<div className="text-xs font-medium text-m3-on-surface-variant">
									Tổng lượt chấm
								</div>
								<div className="text-2xl font-bold text-m3-on-surface">
									{overview?.totalAttempts || 0}
								</div>
								<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
									Không phải số học sinh
								</div>
							</Card>
						</div>

						<Card variant="outlined" className="p-4">
							<div className="mb-3 flex items-center gap-2 font-semibold text-m3-on-surface">
								<Icon name="warning" className="text-m3-error text-lg" />
								Các câu yếu nhất (lần chấm mới nhất mỗi học sinh)
							</div>
							<div className="mb-3 text-[11px] text-m3-on-surface-variant">
								Chỉ tính lỗi từ lần chấm gần nhất của từng học sinh trong bộ lọc
								hiện tại. Phân tích chi tiết câu sai theo từng dự án.
							</div>
							<div className="space-y-2.5">
								{weakTaskChartRows.length === 0 && (
									<div className="text-sm text-m3-on-surface-variant">
										Không có dữ liệu câu yếu.
									</div>
								)}
								{weakTaskChartRows.map((row) => {
									const projectName = getProjectDisplayName(
										row.projectEndpoint,
										row.projectId,
										assignments,
									);
									const hasDifferentLabel =
										row.label &&
										row.label.trim().toLowerCase() !==
											row.x.trim().toLowerCase();

									return (
										<div
											key={`${row.projectEndpoint || ""}_${row.projectId || ""}_${row.x}`}
											className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface-container-low/50 p-3 space-y-2 hover:bg-m3-surface-container-low transition-colors"
										>
											<div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
												<div className="flex flex-wrap items-center gap-2">
													<span className="inline-flex items-center gap-1 rounded-md bg-m3-secondary-container/80 px-2 py-0.5 text-[11px] font-semibold text-m3-on-secondary-container">
														<Icon name="folder_open" size={13} />
														{projectName}
													</span>
													<span className="font-semibold text-sm text-m3-on-surface">
														{row.x}
													</span>
													{hasDifferentLabel && (
														<span className="text-xs text-m3-on-surface-variant line-clamp-1">
															- {row.label}
														</span>
													)}
												</div>
												<div className="flex items-center gap-2 text-xs">
													<span className="text-m3-on-surface-variant font-medium">
														Sai {row.failed}/{row.attempts} học sinh
													</span>
													<span className="font-bold text-m3-error bg-m3-error-container/40 px-2 py-0.5 rounded-full">
														{pct(row.y)}
													</span>
												</div>
											</div>
											<ProgressIndicator
												variant="linear"
												shape="flat"
												value={Math.max(0, Math.min(100, row.y))}
												aria-label={`Tỉ lệ sai ${projectName} câu ${row.x}: ${pct(row.y)}`}
												className="h-2 w-full rounded-full bg-m3-error-container/30 [&>div]:bg-m3-error"
											/>
										</div>
									);
								})}
							</div>
						</Card>

						{gaugeData.length > 0 && (
							<div className="mt-4 rounded-full bg-m3-surface-container-low sm:px-4 px-3.5 py-2.5 text-xs text-m3-on-surface-variant">
								Chỉ số quy đổi (theo lượt chấm):{" "}
								{gaugeData
									.map((g) => `${g.label}: ${pct(g.value)}`)
									.join(" | ")}
							</div>
						)}
					</>
				)}
			</div>
		</Card>
	);
};

export const ClassAnalyticsPanel = memo(ClassAnalyticsPanelComponent);
export default ClassAnalyticsPanel;
