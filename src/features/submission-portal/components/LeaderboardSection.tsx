import { LoadingIndicator } from "@bug-on/m3-expressive/feedback";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, TableEmptyState } from "../../../components/data-table";
import type {
	PublicPortalClass,
	SubmissionLeaderboardItem,
} from "../../../types/submission-portal.types";
import { formatDateTime, formatScore } from "../utils/formatters";

export interface LeaderboardSectionProps {
	leaderboard: SubmissionLeaderboardItem[];
	loadingLeaderboard: boolean;
	selectedClass?: PublicPortalClass;
}

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, SubmissionLeaderboardItem>();

export const LeaderboardSection = ({
	leaderboard,
	loadingLeaderboard,
	selectedClass,
}: LeaderboardSectionProps) => {
	const topRows = leaderboard.slice(0, 3);

	const podiumItems = useMemo(() => {
		if (topRows.length === 0) return [];
		if (topRows.length === 1) {
			return [
				{
					row: topRows[0],
					medal: "🥇",
					heightClass: "min-h-80 sm:min-h-96",
				},
			];
		}
		if (topRows.length === 2) {
			return [
				{
					row: topRows[1],
					medal: "🥈",
					heightClass: "min-h-64 sm:min-h-72",
				},
				{
					row: topRows[0],
					medal: "🥇",
					heightClass: "min-h-80 sm:min-h-96",
				},
			];
		}
		return [
			{
				row: topRows[1],
				medal: "🥈",
				heightClass: "min-h-64 sm:min-h-72",
			},
			{
				row: topRows[0],
				medal: "🥇",
				heightClass: "min-h-80 sm:min-h-96",
			},
			{
				row: topRows[2],
				medal: "🥉",
				heightClass: "min-h-52 sm:min-h-56",
			},
		];
	}, [topRows]);

	const columns = useMemo(
		() =>
			helper.columns([
				helper.accessor("rank", {
					header: "Hạng",
					meta: {
						className: "w-20 text-center",
						align: "center",
					},
					cell: ({ row }) => (
						<span className="font-black text-m3-primary">
							#{row.original.rank}
						</span>
					),
				}),
				helper.accessor("studentName", {
					header: "Học sinh",
					meta: {
						className: "min-w-44",
					},
					cell: ({ row }) => (
						<span className="font-semibold text-m3-on-surface">
							{row.original.studentName}
						</span>
					),
				}),
				helper.accessor("className", {
					header: "Lớp",
					meta: {
						className: "w-32",
					},
					cell: ({ row }) => (
						<span className="text-m3-on-surface-variant">
							{row.original.className}
						</span>
					),
				}),
				helper.accessor("assignmentName", {
					header: "Bài tập",
					meta: {
						className: "min-w-36",
					},
					cell: ({ row }) => (
						<span className="text-m3-on-surface-variant">
							{row.original.assignmentName || "Tổng hợp"}
						</span>
					),
				}),
				helper.display({
					id: "score",
					header: "Điểm",
					meta: {
						className: "w-28 text-center",
						align: "center",
					},
					cell: ({ row }) => (
						<span className="font-bold text-m3-primary">
							{formatScore(row.original.scoreValue)}/
							{formatScore(row.original.maxScore)}
						</span>
					),
				}),
				helper.accessor("submissionCount", {
					header: "Số lần nộp",
					meta: {
						className: "w-28 text-center",
						align: "center",
					},
					cell: ({ row }) => (
						<span className="text-m3-on-surface-variant">
							{row.original.submissionCount}
						</span>
					),
				}),
				helper.accessor("gradedAt", {
					header: "Thời gian",
					meta: {
						className: "w-44",
					},
					cell: ({ row }) => (
						<span className="text-m3-on-surface-variant">
							{formatDateTime(row.original.gradedAt)}
						</span>
					),
				}),
			]),
		[],
	);

	const table = useTable({
		features,
		columns,
		data: leaderboard,
		getRowId: (row) => `${row.studentId}-${row.assignmentId || "all"}`,
	});

	return (
		<Card
			variant="filled"
			className="bg-m3-surface-container-lowest p-5 text-m3-on-surface"
		>
			<Text variant="headline-sm" className="font-black">
				Bảng xếp hạng{selectedClass ? ` - ${selectedClass.name}` : ""}
			</Text>

			{loadingLeaderboard && (
				<Card
					variant="filled"
					className="mt-4 flex items-center gap-2 bg-m3-secondary-container p-3 text-m3-on-secondary-container"
				>
					<LoadingIndicator aria-label="Đang tải bảng xếp hạng" size={20} />
					<Text variant="body-sm" className="font-semibold">
						Đang cập nhật bảng xếp hạng...
					</Text>
				</Card>
			)}

			{podiumItems.length > 0 && (
				<div className="mt-5 flex items-end justify-center gap-3">
					{podiumItems.map((item) => (
						<Card
							key={`${item.row.studentId}-${item.row.assignmentId || "all"}-podium`}
							variant="filled"
							className={`flex flex-1 flex-col items-center justify-center bg-m3-tertiary-container p-4 text-center text-m3-on-tertiary-container ${item.heightClass}`}
						>
							<span className="text-8xl">{item.medal}</span>
							<Text variant="title-lg" className="mt-2 font-bold">
								{item.row.studentName}
							</Text>
							<Text variant="body-md" className="text-m3-on-surface-variant">
								{formatScore(item.row.scoreValue)}/
								{formatScore(item.row.maxScore)} điểm
							</Text>
						</Card>
					))}
				</div>
			)}

			<div className="mt-5">
				<DataTable
					table={table}
					isLoading={loadingLeaderboard}
					loadingAriaLabel="Đang tải bảng xếp hạng"
					minWidthClassName="min-w-190 w-full"
					banded
					emptyState={
						<TableEmptyState
							icon="leaderboard"
							title="Chưa có dữ liệu bảng xếp hạng"
							description="Khi học sinh nộp bài và được chấm điểm, bảng xếp hạng sẽ hiển thị tại đây."
						/>
					}
				/>
			</div>
		</Card>
	);
};
