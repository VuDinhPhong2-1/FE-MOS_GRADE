import { Icon } from "@bug-on/m3-expressive/core";
import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import type React from "react";
import { memo, useMemo } from "react";
import { DataTable, TableEmptyState } from "../../../components/data-table";
import type { SubmissionLeaderboardItem } from "../../../types/submission-portal.types";
import { formatDateTime, formatScore } from "../utils/formatters";

export interface LeaderboardTableProps {
	data: SubmissionLeaderboardItem[];
	loading: boolean;
	currentStudentId?: string;
	rankDeltas: Record<string, number>;
	searchTerm: string;
	tableContainerRef: React.RefObject<HTMLDivElement | null>;
}

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, SubmissionLeaderboardItem>();

const getInitials = (name: string): string => {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const LeaderboardTableComponent = ({
	data,
	loading,
	currentStudentId,
	rankDeltas,
	searchTerm,
	tableContainerRef,
}: LeaderboardTableProps) => {
	const columns = useMemo(
		() =>
			helper.columns([
				helper.accessor("rank", {
					header: "Hạng",
					meta: {
						className: "w-24 text-center",
						align: "center",
					},
					cell: ({ row }) => {
						const rank = row.original.rank ?? 999;
						const delta = rankDeltas[row.original.studentId];

						let rankBadge = (
							<span className="inline-flex items-center justify-center font-black text-m3-on-surface-variant text-sm">
								#{rank}
							</span>
						);

						if (rank === 1) {
							rankBadge = (
								<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-0.5 text-xs font-black text-white shadow-xs">
									<Icon name="emoji_events" size={14} />
									#1
								</span>
							);
						} else if (rank === 2) {
							rankBadge = (
								<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-400 to-slate-500 px-2.5 py-0.5 text-xs font-black text-white shadow-xs">
									<Icon name="military_tech" size={14} />
									#2
								</span>
							);
						} else if (rank === 3) {
							rankBadge = (
								<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 px-2.5 py-0.5 text-xs font-black text-white shadow-xs">
									<Icon name="military_tech" size={14} />
									#3
								</span>
							);
						}

						return (
							<div className="flex items-center justify-center gap-1.5">
								{rankBadge}
								{typeof delta === "number" && delta !== 0 && (
									<span
										className={`inline-flex items-center text-[11px] font-black ${
											delta > 0
												? "text-emerald-500 dark:text-emerald-400"
												: "text-rose-500 dark:text-rose-400"
										}`}
										title={`Thay đổi: ${delta > 0 ? `Tăng ${delta}` : `Giảm ${Math.abs(delta)}`} bậc`}
									>
										{delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
									</span>
								)}
							</div>
						);
					},
				}),
				helper.accessor("studentName", {
					header: "Học sinh",
					meta: {
						className: "min-w-52",
					},
					cell: ({ row }) => {
						const isMe = row.original.studentId === currentStudentId;
						const initials = getInitials(row.original.studentName);

						return (
							<div className="flex items-center gap-3">
								<div
									className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black select-none ${
										row.original.rank === 1
											? "bg-amber-500 text-white ring-2 ring-amber-400/50"
											: row.original.rank === 2
												? "bg-slate-400 text-white ring-2 ring-slate-300/50"
												: row.original.rank === 3
													? "bg-amber-700 text-white ring-2 ring-amber-600/50"
													: "bg-m3-surface-container-highest text-m3-on-surface-variant"
									}`}
								>
									{initials}
								</div>
								<div className="flex flex-col min-w-0">
									<div className="flex items-center gap-2">
										<span
											className={`truncate font-bold ${
												isMe ? "text-m3-primary" : "text-m3-on-surface"
											}`}
										>
											{row.original.studentName}
										</span>
										{isMe && (
											<span className="shrink-0 rounded-full bg-m3-primary px-2 py-0.2 text-[10px] font-black uppercase text-m3-on-primary tracking-wide">
												BẠN
											</span>
										)}
									</div>
									<span className="text-[11px] text-m3-on-surface-variant/80">
										{row.original.className}
									</span>
								</div>
							</div>
						);
					},
				}),
				helper.accessor("assignmentName", {
					header: "Bài tập",
					meta: {
						className: "min-w-36",
					},
					cell: ({ row }) => (
						<span className="text-xs font-medium text-m3-on-surface-variant">
							{row.original.assignmentName || "Tổng hợp toàn bộ"}
						</span>
					),
				}),
				helper.display({
					id: "score",
					header: "Điểm số",
					meta: {
						className: "w-36 text-center",
						align: "center",
					},
					cell: ({ row }) => {
						const score = row.original.scoreValue ?? 0;
						const max = row.original.maxScore ?? 100;
						const percentage =
							max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
						const isMax = score >= max && max > 0;

						return (
							<div className="flex flex-col items-center gap-1">
								<div className="flex items-baseline gap-1">
									<span
										className={`text-sm font-black ${
											isMax
												? "text-emerald-600 dark:text-emerald-400"
												: score > 0
													? "text-m3-primary"
													: "text-m3-on-surface-variant/60"
										}`}
									>
										{formatScore(row.original.scoreValue)}
									</span>
									<span className="text-[11px] font-medium text-m3-on-surface-variant/70">
										/{formatScore(row.original.maxScore)}
									</span>
								</div>
								<div className="h-1.5 w-24 overflow-hidden rounded-full bg-m3-surface-container-highest">
									<div
										className={`h-full rounded-full transition-all duration-500 ${
											isMax
												? "bg-emerald-500"
												: score > 0
													? "bg-m3-primary"
													: "bg-transparent"
										}`}
										style={{ width: `${percentage}%` }}
									/>
								</div>
							</div>
						);
					},
				}),
				helper.accessor("submissionCount", {
					header: "Lượt nộp",
					meta: {
						className: "w-28 text-center",
						align: "center",
					},
					cell: ({ row }) => (
						<span
							className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
								row.original.submissionCount > 0
									? "bg-m3-surface-container-high text-m3-on-surface"
									: "text-m3-on-surface-variant/50"
							}`}
						>
							<Icon name="bolt" size={13} className="text-amber-500" />
							{row.original.submissionCount}
						</span>
					),
				}),
				helper.accessor("gradedAt", {
					header: "Thời gian",
					meta: {
						className: "w-44 text-right",
						align: "right",
					},
					cell: ({ row }) => (
						<span className="text-xs text-m3-on-surface-variant font-mono">
							{row.original.gradedAt
								? formatDateTime(row.original.gradedAt)
								: "—"}
						</span>
					),
				}),
			]),
		[currentStudentId, rankDeltas],
	);

	const table = useTable({
		features,
		columns,
		data,
		getRowId: (row) => `${row.studentId}-${row.assignmentId || "all"}`,
	});

	return (
		<div ref={tableContainerRef} className="mt-4">
			<DataTable
				table={table}
				isLoading={loading}
				loadingAriaLabel="Đang tải dữ liệu bảng xếp hạng"
				minWidthClassName="min-w-190 w-full"
				className="border-none shadow-none"
				scrollContainerClassName="max-h-140"
				stickyHeader
				banded
				renderRow={(row, index, defaultCells) => (
					<tr
						key={row.id}
						data-student-id={row.original.studentId}
						style={{
							contentVisibility: "auto",
							containIntrinsicSize: "0 52px",
						}}
						className={`border-b border-m3-outline-variant/30 transition-colors ${
							row.original.studentId === currentStudentId
								? "bg-m3-primary/10 border-l-4 border-m3-primary font-bold"
								: row.original.rank === 1
									? "bg-amber-500/5 hover:bg-amber-500/10"
									: row.original.rank === 2
										? "bg-slate-200/20 hover:bg-slate-200/30"
										: row.original.rank === 3
											? "bg-amber-700/5 hover:bg-amber-700/10"
											: index % 2 === 1
												? "bg-m3-surface-container-high/40 hover:bg-m3-surface-container-high"
												: "bg-transparent hover:bg-m3-surface-container-high/60"
						}`}
					>
						{defaultCells}
					</tr>
				)}
				emptyState={
					<TableEmptyState
						icon="leaderboard"
						title="Không tìm thấy học sinh phù hợp"
						description={
							searchTerm
								? `Không có kết quả nào khớp với "${searchTerm}". Hãy thử từ khoá khác.`
								: "Chưa có dữ liệu xếp hạng trong danh sách này."
						}
					/>
				}
			/>
		</div>
	);
};

export const LeaderboardTable = memo(LeaderboardTableComponent);
