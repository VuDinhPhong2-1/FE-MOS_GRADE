import { Button, Checkbox, Icon, TextField } from "@bug-on/m3-expressive";
import {
	columnPinningFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	createColumnHelper,
	flexRender,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { useMemo, useRef } from "react";
import { notify } from "../../../utils/notify";
import type { ScoreboardState } from "../hooks/useScoreboardState";
import {
	type CompetencyLevel,
	classificationClassMap,
	formatScore,
	getPercentagePillClass,
	getPracticeColumnTheme,
	getPracticeCompletionHeaderLabel,
	getPracticeScoreHeaderLabel,
	getScorePillClass,
	getSummaryColumnKey,
} from "../utils/scoreboardUtils";

export interface ScoreboardContentProps {
	state: ScoreboardState;
	hideControls?: boolean;
	hideInlineSearch?: boolean;
	tableMaxHeightClassName?: string;
	onCloseModal?: () => void;
}

const features = tableFeatures({
	columnSizingFeature,
	columnPinningFeature,
	columnVisibilityFeature,
});

const helper = createColumnHelper<
	typeof features,
	ScoreboardState["sortedDisplayRows"][number]
>();

interface PinnableColumn {
	getIsPinned: () => "start" | "end" | false;
	getStart: (position: "start") => number;
	getAfter: (position: "end") => number;
	getSize: () => number;
}

const getCommonPinningStyles = (
	column: PinnableColumn,
	isHeader = false,
): React.CSSProperties | undefined => {
	const isPinned = column.getIsPinned();
	if (!isPinned) return undefined;
	return {
		position: "sticky",
		insetInlineStart:
			isPinned === "start" ? `${column.getStart("start")}px` : undefined,
		insetInlineEnd:
			isPinned === "end" ? `${column.getAfter("end")}px` : undefined,
		width: `${column.getSize()}px`,
		minWidth: `${column.getSize()}px`,
		maxWidth: `${column.getSize()}px`,
		zIndex: isHeader ? 50 : 30,
	};
};

export const ScoreboardContent: React.FC<ScoreboardContentProps> = ({
	state,
	hideControls = false,
	hideInlineSearch = false,
	tableMaxHeightClassName = "min-h-72 max-h-[calc(100vh-20rem)]",
}) => {
	const tableContainerRef = useRef<HTMLDivElement>(null);

	const columns = useMemo(() => {
		const cols: Parameters<typeof helper.columns>[0] = [
			helper.display({
				id: "stt",
				header: () => (
					<span className="text-center text-xs font-bold uppercase tracking-wide">
						STT
					</span>
				),
				size: 70,
				cell: (info) => (
					<span className="font-medium text-m3-on-surface-variant">
						{info.row.index + 1}
					</span>
				),
			}),
			helper.accessor("middleName", {
				id: "middleName",
				header: () => (
					<span className="text-left text-xs font-bold uppercase tracking-wide">
						Họ và tên đệm
					</span>
				),
				size: 220,
				cell: (info) => (
					<span className="font-medium text-m3-on-surface">
						{info.getValue() || "--"}
					</span>
				),
			}),
			helper.accessor("firstName", {
				id: "firstName",
				header: () => (
					<span className="text-left text-xs font-bold uppercase tracking-wide">
						Tên
					</span>
				),
				size: 120,
				cell: (info) => (
					<span className="font-semibold text-m3-on-surface">
						{info.getValue() || "--"}
					</span>
				),
			}),
		];

		// Cột bài tập
		for (const assignment of state.displayedAssignments) {
			cols.push(
				helper.accessor((row) => row.calculatedScores[assignment.id] ?? 0, {
					id: `assignment-${assignment.id}`,
					header: () => (
						<div className="text-center" title={assignment.name}>
							<div className="truncate">{assignment.name}</div>
							<div className="text-[11px] font-normal text-m3-on-surface-variant">
								(tối đa {assignment.maxScore})
							</div>
						</div>
					),
					size: 140,
					cell: (info) => {
						const row = info.row.original;
						const score = info.getValue();
						const maxScore = assignment.maxScore || 0;
						const errors = row.errorsByAssignment[assignment.id] || [];
						const issues = row.issuesByAssignment[assignment.id] || [];

						return (
							<div className="flex flex-col items-center">
								<div
									className={`mx-auto inline-flex min-w-15.5 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${getScorePillClass(
										score,
										maxScore,
									)}`}
								>
									{formatScore(score)}
								</div>
								{errors.length > 0 && (
									<details
										className="mt-1 text-left text-xs text-m3-error"
										onToggle={(e) => {
											if ((e.currentTarget as HTMLDetailsElement).open) {
												try {
													notify.custom({
														message: "Lỗi chấm tự động",
														type: "error",
														issues,
														title: "Lỗi chấm tự động",
													});
												} catch {
													// ignore
												}
											}
										}}
									>
										<summary className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-m3-error-container px-2 py-0.5 font-semibold text-m3-on-error-container hover:bg-m3-error-container/80">
											{errors.length} lỗi
										</summary>
										<ul className="mt-1 max-h-24 list-inside list-disc overflow-auto rounded bg-m3-error-container/30 p-2 text-[11px] text-m3-on-error-container">
											{Array.from(new Set(errors)).map((errorItem) => (
												<li key={`${row.id}-${assignment.id}-${errorItem}`}>
													{errorItem}
												</li>
											))}
										</ul>
									</details>
								)}
							</div>
						);
					},
				}),
			);
		}

		// Cột Xếp loại
		if (state.isClassificationColumnVisible) {
			cols.push(
				helper.display({
					id: "classification",
					header: () => (
						<span className="text-center text-xs font-bold uppercase tracking-wide">
							Xếp loại
						</span>
					),
					size: 130,
					cell: (info) => {
						const row = info.row.original;
						const isSaving = state.savingClassificationStudentId === row.id;

						return (
							<div className="inline-flex flex-col items-center gap-1">
								<select
									value={row.classification}
									disabled={isSaving}
									onChange={(e) =>
										void state.handleClassificationChange(
											row.id,
											e.target.value as CompetencyLevel,
										)
									}
									className={`h-8 min-w-21.5 rounded-full px-3 text-center text-xs font-bold outline-none transition focus:ring-2 focus:ring-m3-primary/30 ${
										row.classification
											? classificationClassMap[row.classification]
											: "bg-m3-surface text-m3-on-surface"
									} ${isSaving ? "cursor-not-allowed opacity-70" : "hover:brightness-95"}`}
									title="Chỉnh sửa xếp loại học sinh"
								>
									<option value="">--</option>
									<option value="A">A</option>
									<option value="B">B</option>
									<option value="C">C</option>
									<option value="D">D</option>
								</select>
								{isSaving && (
									<span className="text-[11px] text-m3-on-surface-variant">
										Đang lưu...
									</span>
								)}
							</div>
						);
					},
				}),
			);
		}

		// Cột tổng hợp Practice
		for (const practice of state.availablePracticeColumns) {
			const theme = getPracticeColumnTheme(practice.code);
			const completionVisible = state.isSummaryColumnVisible(
				getSummaryColumnKey(practice.code, "completion"),
			);
			const scoreVisible = state.isSummaryColumnVisible(
				getSummaryColumnKey(practice.code, "score"),
			);

			if (completionVisible) {
				cols.push(
					helper.display({
						id: `summary-${practice.code}-completion`,
						header: () => (
							<span
								className={`text-center text-xs font-bold uppercase tracking-wide ${theme.completionHeader}`}
							>
								{getPracticeCompletionHeaderLabel(practice)}
							</span>
						),
						size: 110,
						cell: (info) => {
							const row = info.row.original;
							const summary = row.practiceSummaries[practice.code];
							const completionText = summary?.completionText ?? "0/0";
							const totalScore = summary?.totalScore ?? 0;
							const maxScore = state.practiceMaxScoreByCode[practice.code] || 0;

							return (
								<div
									className={`font-semibold text-center ${theme.completionCell}`}
									title={`${practice.title}: ${formatScore(totalScore)}/${formatScore(maxScore)} điểm`}
								>
									{completionText}
								</div>
							);
						},
					}),
				);
			}

			if (scoreVisible) {
				cols.push(
					helper.display({
						id: `summary-${practice.code}-score`,
						header: () => (
							<span
								className={`text-right text-xs font-bold uppercase tracking-wide ${theme.scoreHeader}`}
							>
								{getPracticeScoreHeaderLabel(practice)}
							</span>
						),
						size: 130,
						cell: (info) => {
							const row = info.row.original;
							const summary = row.practiceSummaries[practice.code];
							const totalScore = summary?.totalScore ?? 0;
							const maxScore = state.practiceMaxScoreByCode[practice.code] || 0;

							return (
								<div
									className={`font-semibold text-right ${theme.scoreCell}`}
									title={`${practice.title}: tổng điểm chuẩn hóa theo thang ${formatScore(maxScore)}`}
								>
									{formatScore(totalScore)}/{formatScore(maxScore)}
								</div>
							);
						},
					}),
				);
			}
		}

		// Cột Tổng điểm 3 Practice
		if (state.showTotalScoreColumn) {
			cols.push(
				helper.accessor("totalScore", {
					id: "totalScore",
					header: () => (
						<span className="text-right text-xs font-bold uppercase tracking-wide text-m3-on-secondary-container">
							Tổng điểm 3 Practice
						</span>
					),
					size: 140,
					cell: (info) => (
						<div className="text-right">
							<span className="inline-flex rounded-full bg-m3-secondary-container px-2.5 py-1 text-xs font-bold text-m3-on-secondary-container">
								{formatScore(info.getValue())}/
								{formatScore(state.maxScoreTotal)}
							</span>
						</div>
					),
				}),
			);
		}

		// Cột Tỷ lệ đạt OTTH
		if (state.showOtthPercentageColumn) {
			cols.push(
				helper.accessor("otthPercentage", {
					id: "otthPercentage",
					header: () => (
						<span className="text-center text-xs font-bold uppercase tracking-wide text-m3-on-primary-container">
							Tỷ lệ đạt OTTH
						</span>
					),
					size: 130,
					cell: (info) => (
						<div className="text-center">
							<span
								className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getPercentagePillClass(
									info.getValue(),
								)}`}
							>
								{formatScore(info.getValue())}%
							</span>
						</div>
					),
				}),
			);
		}

		// Cột Tỷ lệ đạt ôn thi
		if (state.showExamReviewPercentageColumn) {
			cols.push(
				helper.accessor("examReviewPercentage", {
					id: "examReviewPercentage",
					header: () => (
						<span className="text-center text-xs font-bold uppercase tracking-wide text-m3-on-tertiary-container">
							Tỷ lệ đạt ôn thi
						</span>
					),
					size: 130,
					cell: (info) => (
						<div className="text-center">
							<span
								className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getPercentagePillClass(
									info.getValue(),
								)}`}
							>
								{formatScore(info.getValue())}%
							</span>
						</div>
					),
				}),
			);
		}

		// Cột Ghi chú
		cols.push(
			helper.display({
				id: "notes",
				header: () => (
					<span className="text-left text-xs font-bold uppercase tracking-wide">
						Ghi chú
					</span>
				),
				size: 240,
				cell: (info) => {
					const row = info.row.original;
					const isSaving = state.savingNotesStudentId === row.id;

					return (
						<div className="max-w-65 space-y-1">
							<textarea
								value={row.notes}
								onChange={(e) =>
									state.handleNotesChange(row.id, e.target.value)
								}
								onBlur={() => void state.handleNotesBlur(row.id)}
								rows={2}
								maxLength={500}
								placeholder="Nhập ghi chú..."
								disabled={isSaving}
								className={`w-full resize-y rounded-xl bg-m3-surface-container-lowest px-2.5 py-1.5 text-xs text-m3-on-surface outline-none transition focus:ring-1 focus:ring-m3-primary/40 ${
									isSaving
										? "cursor-not-allowed bg-m3-surface-container-highest opacity-70"
										: "hover:bg-m3-surface-container-low"
								}`}
							/>
							{isSaving && (
								<span className="text-[11px] text-m3-on-surface-variant">
									Đang lưu...
								</span>
							)}
						</div>
					);
				},
			}),
		);

		return helper.columns(cols);
	}, [
		state.displayedAssignments,
		state.isClassificationColumnVisible,
		state.savingClassificationStudentId,
		state.handleClassificationChange,
		state.availablePracticeColumns,
		state.isSummaryColumnVisible,
		state.practiceMaxScoreByCode,
		state.showTotalScoreColumn,
		state.maxScoreTotal,
		state.showOtthPercentageColumn,
		state.showExamReviewPercentageColumn,
		state.savingNotesStudentId,
		state.handleNotesChange,
		state.handleNotesBlur,
	]);

	const table = useTable({
		features,
		columns,
		data: state.sortedDisplayRows,
		initialState: {
			columnPinning: {
				start: ["stt", "middleName", "firstName"],
				end: [],
			},
		},
		getRowId: (row) => row.id,
	});

	const rows = table.getRowModel().rows;
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => tableContainerRef.current,
		estimateSize: () => 56,
		overscan: 10,
	});

	const virtualRows = rowVirtualizer.getVirtualItems();
	const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
	const paddingBottom =
		virtualRows.length > 0
			? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
			: 0;

	return (
		<div className="flex flex-1 flex-col">
			{/* Controls Panel - Gọn gàng, responsive unified flex bar */}
			{!hideControls && (
				<div className="mb-3 rounded-2xl bg-m3-surface-container p-3 sm:p-4 text-m3-on-surface">
					<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
						{/* Cụm bộ lọc bên trái */}
						<div className="flex flex-wrap items-center gap-2.5 shrink-0">
							{!hideInlineSearch && (
								<div className="w-full sm:w-60">
									<TextField
										value={state.searchTerm}
										onChange={(val) => state.setSearchTerm(val)}
										placeholder="Tìm kiếm tên học sinh..."
										leadingIcon={<Icon name="search" />}
										className="w-full"
									/>
								</div>
							)}
							{/* Checkbox label */}
							<label
								htmlFor="filter-only-exam-students"
								className="inline-flex cursor-pointer items-center gap-2 text-xs sm:text-sm font-medium text-m3-on-surface select-none transition-colors"
							>
								<Checkbox
									id="filter-only-exam-students"
									checked={state.showOnlyExamStudents}
									onCheckedChange={(checked) =>
										state.setShowOnlyExamStudents(Boolean(checked))
									}
								/>
								<span>Chỉ học sinh đi thi</span>
							</label>
							{/* Chip kết quả */}
							<div className="inline-flex items-center gap-1.5 rounded-full bg-m3-surface-container-high px-4 py-1.5 text-xs text-m3-on-surface-variant h-10 font-medium">
								<span>Kết quả:</span>
								<span className="font-bold text-m3-on-surface">
									{state.sortedDisplayRows.length}/{state.filteredStudentCount}
								</span>
							</div>
							{(state.searchTerm || state.showOnlyExamStudents) && (
								<Button
									type="button"
									size="sm"
									colorStyle="outlined"
									onClick={() => {
										state.setSearchTerm("");
										state.setShowOnlyExamStudents(false);
									}}
									icon={<Icon name="close" size={20} />}
								>
									Xóa bộ lọc
								</Button>
							)}
						</div>

						{/* Cụm thẻ bài tập bên phải */}
						{state.availablePracticeColumns.length > 0 && (
							<div className="flex flex-wrap items-center gap-2 lg:justify-end">
								{state.availablePracticeColumns.map((practice) => {
									const visibility =
										state.practiceGroupVisibility[practice.code];
									const isVisible = visibility?.isVisible;

									return (
										<div
											key={`practice-group-${practice.code}`}
											className="flex items-center justify-between gap-3 rounded-xl bg-m3-surface-container-high p-3 text-xs text-m3-on-surface"
										>
											<div className="min-w-0 pr-1">
												<div className="truncate font-bold text-m3-on-surface text-xs sm:text-sm">
													{practice.title}
												</div>
												<div className="text-[11px] text-m3-on-surface-variant flex items-center gap-1">
													<span>
														{visibility?.visibleAssignments}/
														{visibility?.totalAssignments} bài
													</span>
													<span className="opacity-40">·</span>
													<span>
														{visibility?.summaryVisible
															? "Hiện tổng hợp"
															: "Ẩn tổng hợp"}
													</span>
												</div>
											</div>
											<Button
												size="xs"
												colorStyle={isVisible ? "tonal" : "outlined"}
												onClick={() =>
													state.handleTogglePracticeGroupDisplay(practice.code)
												}
												icon={
													<Icon
														name={isVisible ? "visibility_off" : "visibility"}
														size={18}
													/>
												}
											>
												{isVisible ? "Ẩn" : "Hiện"}
											</Button>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Score Table Container - Không border, không shadow */}
			<div
				id="score-table"
				className="relative overflow-hidden rounded-2xl bg-m3-surface text-m3-on-surface"
			>
				<div className="flex items-center justify-between bg-m3-surface-container-high px-4 py-2.5 text-sm font-semibold text-m3-on-surface">
					<span>Bảng điểm lớp {state.titleClassName}</span>
					<span className="text-xs font-medium text-m3-on-surface-variant">
						Nhấn badge lỗi để xem chi tiết
					</span>
				</div>

				<div
					ref={tableContainerRef}
					className={`${tableMaxHeightClassName} overflow-auto`}
				>
					<table className="w-full min-w-max border-separate border-spacing-0 text-sm text-m3-on-surface">
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr
									key={headerGroup.id}
									className="bg-m3-surface-container-high"
								>
									{headerGroup.headers.map((header) => {
										const pinningStyle = getCommonPinningStyles(
											header.column,
											true,
										);
										const isPinned = header.column.getIsPinned();

										return (
											<th
												key={header.id}
												style={pinningStyle}
												className={`sticky top-0 px-3 py-3 text-xs font-bold text-m3-on-surface ${
													isPinned
														? "z-50 bg-m3-surface-container-high"
														: "z-20 bg-m3-surface-container-high"
												}`}
											>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</th>
										);
									})}
								</tr>
							))}
						</thead>

						<tbody>
							{paddingTop > 0 && (
								<tr>
									<td
										style={{ height: `${paddingTop}px`, padding: 0, border: 0 }}
										colSpan={columns.length}
									/>
								</tr>
							)}
							{virtualRows.map((virtualRow) => {
								const row = rows[virtualRow.index];
								if (!row) return null;
								const isEven = virtualRow.index % 2 === 0;
								const rowBgClass = isEven
									? "bg-m3-surface"
									: "bg-m3-surface-container-low";

								return (
									<tr
										key={row.id}
										data-index={virtualRow.index}
										ref={rowVirtualizer.measureElement}
										className={`${rowBgClass} transition-colors hover:bg-m3-surface-container-high/60`}
									>
										{row.getVisibleCells().map((cell) => {
											const pinningStyle = getCommonPinningStyles(
												cell.column,
												false,
											);
											const isPinned = cell.column.getIsPinned();

											return (
												<td
													key={cell.id}
													style={pinningStyle}
													className={`px-3 py-3 align-middle ${
														isPinned ? `${rowBgClass} z-30` : ""
													}`}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</td>
											);
										})}
									</tr>
								);
							})}
							{paddingBottom > 0 && (
								<tr>
									<td
										style={{
											height: `${paddingBottom}px`,
											padding: 0,
											border: 0,
										}}
										colSpan={columns.length}
									/>
								</tr>
							)}

							{rows.length === 0 && (
								<tr>
									<td
										colSpan={columns.length}
										className="px-4 py-8 text-center text-m3-on-surface-variant"
									>
										Chưa có dữ liệu điểm để hiển thị.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default ScoreboardContent;
