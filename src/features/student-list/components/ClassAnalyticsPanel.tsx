import {
	Card,
	Icon,
	IconButton,
	List,
	ListItem,
	ProgressIndicator,
	ScrollArea,
	Select,
	type SelectOption,
	Text,
} from "@bug-on/m3-expressive";
import { memo, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { Assignment } from "../../../types/assignment.types";
import {
	mapOverviewToGaugeData,
	mapWeakTasksToBarChart,
} from "../../../utils/analyticsMappers";
import { useAnalyticsQueries } from "../hooks/useAnalyticsQueries";

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

	const [selection, setSelection] = useState<{
		classId: string;
		ids: string[];
	}>({ classId, ids: [] });
	const assignmentIds = selection.classId === classId ? selection.ids : [];
	const [top, setTop] = useState<number>(10);
	const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

	const {
		overview,
		isOverviewLoading,
		isOverviewFetching,
		overviewError,
		weakTasks,
		isWeakTasksLoading,
		isWeakTasksFetching,
		weakTasksError,
		refetchOverview,
		refetchWeakTasks,
	} = useAnalyticsQueries({
		classId,
		assignmentIds,
		top,
		getAccessToken,
	});

	const gaugeData = useMemo(
		() => (overview ? mapOverviewToGaugeData(overview) : []),
		[overview],
	);

	const weakTaskChartRows = useMemo(
		() => mapWeakTasksToBarChart(weakTasks),
		[weakTasks],
	);

	const errorMessage = overviewError || weakTasksError;
	const isAnyFetching = isOverviewFetching || isWeakTasksFetching;

	return (
		<Card variant="filled" className="relative bg-transparent">
			<div className="relative">
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<h2 className="flex items-center gap-2 text-lg font-bold text-m3-on-surface">
							<Icon name="bar_chart" className="text-m3-primary text-xl" />
							Phân tích kết quả lớp học
						</h2>
						<Text
							variant="body-md"
							className="mt-1 text-sm text-m3-on-surface-variant"
						>
							Tổng hợp theo từng lượt chấm để xác định xu hướng học tập và câu
							hỏi cần củng cố.
						</Text>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="w-max">
							<Select
								variant="filled"
								options={TOP_OPTIONS}
								value={String(top)}
								onChange={(val) => setTop(Number(val) || 10)}
								fullWidth
								dense
								colorVariant="vibrant"
								showDividers={false}
							/>
						</div>
						<IconButton
							colorStyle="standard"
							size="sm"
							aria-label="Làm mới phân tích"
							title="Làm mới phân tích"
							disabled={isAnyFetching}
							onClick={() => {
								void refetchOverview();
								void refetchWeakTasks();
							}}
							className="self-end sm:self-center text-m3-on-surface-variant hover:text-m3-on-surface shrink-0"
						>
							<Icon
								name="refresh"
								size={20}
								className={isAnyFetching ? "animate-spin text-m3-primary" : ""}
							/>
						</IconButton>
					</div>
				</div>

				<div className="mb-4 rounded-full bg-m3-primary-container sm:px-4 px-3.5 py-2.5 text-xs text-m3-on-primary-container">
					Các chỉ số bên dưới được tính theo <strong>lượt chấm</strong> (mỗi lần
					nộp/chấm lại được tính là 1 lượt).
				</div>

				{errorMessage && (
					<div className="mb-4 flex items-center gap-2 rounded-2xl bg-m3-error-container/40 p-3.5 text-sm text-m3-on-error-container shadow-2xs">
						<Icon name="error" className="text-lg text-m3-error" />
						{errorMessage}
					</div>
				)}

				{/* 4 Summary Stat Cards - Zero Layout Shift */}
				<div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
					<Card
						variant="filled"
						className="p-4 bg-m3-surface-container-highest rounded-m3-md"
						title="Trung bình % của tất cả lượt chấm trong lớp"
					>
						<div className="text-xs font-medium text-m3-on-surface-variant">
							Điểm TB theo lượt chấm
						</div>
						{isOverviewLoading ? (
							<div className="my-1 h-8 w-24 animate-pulse rounded-lg bg-m3-surface-container-highest" />
						) : (
							<div className="text-2xl font-bold text-m3-primary">
								{pct(overview?.averagePercentage || 0)}
							</div>
						)}
						<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
							TB % của tất cả lượt chấm
						</div>
					</Card>

					<Card
						variant="filled"
						className="p-4 bg-m3-surface-container-highest rounded-m3-md"
						title="Tỷ lệ lượt chấm có điểm từ 60% trở lên"
					>
						<div className="text-xs font-medium text-m3-on-surface-variant">
							Tỷ lệ đạt (&gt;= 60%)
						</div>
						{isOverviewLoading ? (
							<div className="my-1 h-8 w-24 animate-pulse rounded-lg bg-m3-surface-container-highest" />
						) : (
							<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
								{pct(overview?.passRate || 0)}
							</div>
						)}
						<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
							Số lượt đạt / tổng lượt
						</div>
					</Card>

					<Card
						variant="filled"
						className="p-4 bg-m3-surface-container-highest rounded-m3-md"
						title="Tỷ lệ lượt chấm dưới 40%"
					>
						<div className="text-xs font-medium text-m3-on-surface-variant">
							Tỷ lệ cảnh báo (&lt; 40%)
						</div>
						{isOverviewLoading ? (
							<div className="my-1 h-8 w-24 animate-pulse rounded-lg bg-m3-surface-container-highest" />
						) : (
							<div className="text-2xl font-bold text-m3-error">
								{pct(overview?.warningRate || 0)}
							</div>
						)}
						<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
							Số lượt dưới 40%
						</div>
					</Card>

					<Card
						variant="filled"
						className="p-4 bg-m3-surface-container-highest rounded-m3-md"
						title="Tổng số lượt chấm đã được lưu"
					>
						<div className="text-xs font-medium text-m3-on-surface-variant">
							Tổng lượt chấm
						</div>
						{isOverviewLoading ? (
							<div className="my-1 h-8 w-16 animate-pulse rounded-lg bg-m3-surface-container-highest" />
						) : (
							<div className="text-2xl font-bold text-m3-on-surface">
								{overview?.totalAttempts || 0}
							</div>
						)}
						<div className="mt-1 text-[11px] text-m3-on-surface-variant/70">
							Không phải số học sinh
						</div>
					</Card>
				</div>

				{/* Weak Tasks Section */}
				<Card
					variant="filled"
					className="p-4 bg-m3-surface-container-highest rounded-m3-md"
				>
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-2 font-semibold text-m3-on-surface">
							<Icon name="warning" className="text-m3-error text-lg" />
							<span>Các câu yếu nhất (lần chấm mới nhất mỗi học sinh)</span>
						</div>
						{isWeakTasksFetching && !isWeakTasksLoading && (
							<div className="flex items-center gap-1.5 text-xs text-m3-primary animate-pulse">
								<ProgressIndicator
									variant="circular"
									size={14}
									aria-label="Đang cập nhật câu yếu..."
								/>
								<span className="hidden sm:inline">Đang cập nhật...</span>
							</div>
						)}
					</div>
					<div className="mb-3 text-[11px] text-m3-on-surface-variant">
						{assignmentIds.length > 0
							? "Chỉ tính lần chấm mới nhất của từng học sinh ở từng bài tập đã chọn. Học sinh chưa có kết quả không được tính vào tỷ lệ sai."
							: "Tất cả dự án: tính lần chấm mới nhất của từng học sinh theo dự án (chế độ tổng hợp cũ)."}{" "}
						Xếp hạng chung theo tỷ lệ sai, sau đó theo số học sinh sai. Bộ lọc
						không thay đổi bốn chỉ số tổng quan.
					</div>
					<List
						variant="expressive"
						outerRadius={12}
						listStyle="segmented"
						className="mb-4"
					>
						<ListItem
							value="assignment-filter-trigger"
							expandable
							expanded={isFilterExpanded}
							onExpandChange={setIsFilterExpanded}
							expandTrigger="row"
							leadingType="icon"
							leadingContent={
								<Icon name="tune" size={20} className="text-m3-primary" />
							}
							headline={
								<span className="text-sm font-semibold text-m3-on-surface">
									{assignmentIds.length
										? `Đã chọn ${assignmentIds.length} bài tập`
										: "Chọn bài tập (hiện xem tất cả dự án)"}
								</span>
							}
							supportingText={
								assignmentIds.length > 0
									? "Đang lọc câu yếu theo bài tập được chọn"
									: "Xem tất cả dự án. Nhấp để chọn lọc theo từng bài tập"
							}
							trailingText={
								assignmentIds.length > 0
									? `${assignmentIds.length}/${assignments.length}`
									: undefined
							}
							className="bg-m3-surface-container-lowest"
						>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: prevent accordion collapse when interacting with controls */}
							<div
								className="w-full space-y-2.5 p-2 bg-m3-surface-container-lowest rounded-xl"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => e.stopPropagation()}
							>
								<div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setSelection({
													classId,
													ids: assignments.map((a) => a.id),
												});
											}}
											className="cursor-pointer rounded-lg border-none bg-m3-primary/10 px-2.5 py-1 text-xs font-semibold text-m3-primary hover:bg-m3-primary/15 transition-colors"
										>
											Chọn tất cả bài tập
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setSelection({ classId, ids: [] });
											}}
											className="cursor-pointer rounded-lg border-none hover:bg-m3-surface-container-highest/60 px-2.5 py-1 text-xs font-semibold text-m3-on-surface-variant hover:text-m3-on-surface transition-colors"
										>
											Bỏ lọc
										</button>
									</div>
									<span className="text-xs text-m3-on-surface-variant/80">
										{assignmentIds.length > 0
											? `${assignmentIds.length} / ${assignments.length} bài tập đã chọn`
											: `0 / ${assignments.length} bài tập (xem tất cả)`}
									</span>
								</div>

								{assignments.length === 0 ? (
									<Text
										variant="body-md"
										className="py-3 text-center text-sm text-m3-on-surface-variant"
									>
										Lớp chưa có bài tập.
									</Text>
								) : (
									<ScrollArea
										type="hover"
										orientation="vertical"
										className="max-h-56 pr-1 overflow-hidden"
										viewportClassName="space-y-1"
									>
										<List
											variant="expressive"
											listStyle="segmented"
											selectionMode="multi-select"
											value={assignmentIds}
											onChange={(val) => {
												const newIds = Array.isArray(val) ? val : [val];
												setSelection({ classId, ids: newIds });
											}}
											className="border-none shadow-none"
										>
											{assignments.map((assignment) => (
												<ListItem
													key={assignment.id}
													value={assignment.id}
													leadingType="checkbox"
													headline={
														<span className="text-sm font-medium text-m3-on-surface">
															{assignment.name}
														</span>
													}
													className="border-none shadow-none bg-m3-surface-container-lowest/80 hover:bg-m3-surface-container-low transition-colors cursor-pointer"
												/>
											))}
										</List>
									</ScrollArea>
								)}
							</div>
						</ListItem>
					</List>

					<div className="space-y-2.5">
						{isWeakTasksLoading ? (
							[1, 2, 3].map((idx) => (
								<div
									key={idx}
									className="rounded-xl border border-m3-outline-variant/50 bg-m3-surface-container-low/40 p-3 space-y-2.5 animate-pulse"
								>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-center gap-2">
											<div className="h-5 w-28 rounded-md bg-m3-surface-container-highest" />
											<div className="h-5 w-16 rounded-md bg-m3-surface-container-highest" />
										</div>
										<div className="flex items-center gap-2">
											<div className="h-5 w-24 rounded-md bg-m3-surface-container-highest" />
											<div className="h-5 w-12 rounded-full bg-m3-surface-container-highest" />
										</div>
									</div>
									<div className="h-2 w-full rounded-full bg-m3-surface-container-highest" />
								</div>
							))
						) : weakTaskChartRows.length === 0 ? (
							<div className="py-2 text-sm text-m3-on-surface-variant">
								Không có dữ liệu câu yếu.
							</div>
						) : (
							<div
								className={`space-y-2.5 transition-opacity duration-200 ${
									isWeakTasksFetching ? "opacity-60" : "opacity-100"
								}`}
							>
								{weakTaskChartRows.map((row) => {
									const projectName =
										(row.assignmentId
											? assignments.find((a) => a.id === row.assignmentId)
													?.name || row.assignmentId
											: undefined) ||
										getProjectDisplayName(
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
											key={`${row.assignmentId || ""}_${row.projectEndpoint || ""}_${row.projectId || ""}_${row.x}_${row.label}`}
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
						)}
					</div>
				</Card>

				{/* Gauge / Score Conversion note */}
				{isOverviewLoading ? (
					<div className="mt-4 h-9 w-full rounded-full bg-m3-surface-container-low animate-pulse" />
				) : gaugeData.length > 0 ? (
					<div className="mt-4 rounded-full bg-m3-surface-container-low sm:px-4 px-3.5 py-2.5 text-xs text-m3-on-surface-variant">
						Chỉ số quy đổi (theo lượt chấm):{" "}
						{gaugeData.map((g) => `${g.label}: ${pct(g.value)}`).join(" | ")}
					</div>
				) : null}
			</div>
		</Card>
	);
};

export const ClassAnalyticsPanel = memo(ClassAnalyticsPanelComponent);
export default ClassAnalyticsPanel;
