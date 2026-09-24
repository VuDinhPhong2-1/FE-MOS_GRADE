import { Button, Icon } from "@bug-on/m3-expressive";
import {
	createColumnHelper,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import type React from "react";
import { useMemo } from "react";
import { DataTable, TableEmptyState } from "../../../components/data-table";
import type { SubmissionLog } from "../../../types/submission-portal.types";
import { formatDateTime } from "../utils/portalFormatters";

interface SubmissionLogsTableProps {
	logs: SubmissionLog[];
	onExportCsv: () => void;
}

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, SubmissionLog>();

export const SubmissionLogsTable: React.FC<SubmissionLogsTableProps> = ({
	logs,
	onExportCsv,
}) => {
	const columns = useMemo(
		() =>
			helper.columns([
				helper.accessor("studentName", {
					header: "Học sinh",
					meta: {
						cellClassName: "font-semibold text-m3-on-surface",
					},
					cell: ({ getValue }) => getValue(),
				}),
				helper.accessor("className", {
					header: "Lớp",
					meta: {
						cellClassName: "text-m3-on-surface-variant",
					},
					cell: ({ getValue }) => getValue(),
				}),
				helper.accessor("assignmentName", {
					header: "Bài tập",
					meta: {
						cellClassName: "text-m3-on-surface",
					},
					cell: ({ getValue }) => getValue(),
				}),
				helper.display({
					id: "score",
					header: "Điểm",
					meta: {
						align: "center",
					},
					cell: ({ row }) => (
						<span className="inline-block rounded-m3-full bg-m3-primary/10 px-2.5 py-0.5 text-xs font-black text-m3-primary">
							{row.original.scoreValue ?? "--"}/{row.original.maxScore}
						</span>
					),
				}),
				helper.accessor("ipAddress", {
					header: "IP",
					meta: {
						cellClassName: "font-mono text-xs text-m3-on-surface-variant",
					},
					cell: ({ getValue }) => getValue() || "--",
				}),
				helper.accessor("fileName", {
					header: "Tệp",
					meta: {
						cellClassName:
							"font-mono text-xs text-m3-on-surface-variant truncate max-w-xs",
					},
					cell: ({ getValue }) => getValue() || "--",
				}),
				helper.accessor("submittedAt", {
					header: "Thời gian nộp",
					meta: {
						cellClassName:
							"text-xs text-m3-on-surface-variant whitespace-nowrap",
					},
					cell: ({ getValue }) => formatDateTime(getValue()),
				}),
			]),
		[],
	);

	const totalCount = logs.length;
	const displayedLogs = useMemo(() => logs.slice(0, 50), [logs]);
	const hasMore = totalCount > 50;

	const table = useTable({
		features,
		columns,
		data: displayedLogs,
		getRowId: (row) => row.id,
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="text-lg font-bold text-m3-on-surface">
						Lượt nộp gần đây
					</h3>
					<p className="text-xs text-m3-on-surface-variant">
						{hasMore
							? `Hiển thị 50 / ${totalCount} lượt nộp gần nhất. Đối chiếu tệp nộp, IP và điểm số.`
							: totalCount === 0
								? "Đối chiếu tệp nộp, IP và điểm số của học sinh qua cổng nộp bài."
								: `${totalCount} lượt nộp bài đã ghi nhận.`}
					</p>
				</div>
				<Button
					colorStyle="filled"
					size="sm"
					disabled={logs.length === 0}
					icon={<Icon name="download" size={18} />}
					onClick={onExportCsv}
				>
					Xuất CSV
				</Button>
			</div>

			<DataTable
				table={table}
				banded={false}
				stickyHeader
				scrollContainerClassName="max-h-120 overflow-y-auto"
				minWidthClassName="min-w-190 w-full"
				className="bg-m3-surface-container-low"
				emptyState={
					<TableEmptyState
						icon="history_edu"
						title="Chưa có lượt nộp bài nào"
						description="Chưa có lượt nộp bài nào được ghi nhận."
					/>
				}
			/>
		</div>
	);
};
