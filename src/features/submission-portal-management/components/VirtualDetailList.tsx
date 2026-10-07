import {
	Button,
	Card,
	Divider,
	Icon,
	LoadingIndicator,
	Text,
} from "@bug-on/m3-expressive";
import { List } from "@bug-on/m3-expressive/layout";
import { useVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { memo, useMemo } from "react";
import type {
	SubmissionAlert,
	SubmissionLog,
} from "../../../types/submission-portal.types";
import { AlertCard } from "./AlertCard";
import { VirtualLogItem } from "./VirtualLogItem";

type DetailRow =
	| { id: "summary-error"; type: "summary-error"; alertCount: number }
	| { id: "summary-empty"; type: "summary-empty" }
	| { id: "alerts-header"; type: "alerts-header"; alertCount: number }
	| { id: "loading-indicator"; type: "loading" }
	| { id: string; type: "alert"; alert: SubmissionAlert }
	| { id: "section-divider"; type: "divider" }
	| { id: "logs-header"; type: "logs-header"; logCount: number }
	| { id: "logs-empty"; type: "logs-empty" }
	| {
			id: string;
			type: "log";
			log: SubmissionLog;
			logIndex: number;
			totalLogs: number;
	  };

interface VirtualDetailListProps {
	alerts: SubmissionAlert[];
	logs: SubmissionLog[];
	loadingDetails: boolean;
	onExportLogsCsv: () => void;
	scrollViewportRef: React.RefObject<HTMLDivElement | null>;
}

const ESTIMATED_SIZES: Record<DetailRow["type"], number> = {
	"summary-error": 96,
	"summary-empty": 96,
	"alerts-header": 36,
	loading: 64,
	alert: 180,
	divider: 24,
	"logs-header": 44,
	"logs-empty": 130,
	log: 72,
};

const VirtualDetailListComponent: React.FC<VirtualDetailListProps> = ({
	alerts,
	logs,
	loadingDetails,
	onExportLogsCsv,
	scrollViewportRef,
}) => {
	const rows = useMemo<DetailRow[]>(() => {
		const result: DetailRow[] = [];

		if (alerts.length > 0) {
			result.push({
				id: "summary-error",
				type: "summary-error",
				alertCount: alerts.length,
			});
		} else if (!loadingDetails) {
			result.push({ id: "summary-empty", type: "summary-empty" });
		}

		result.push({
			id: "alerts-header",
			type: "alerts-header",
			alertCount: alerts.length,
		});

		if (loadingDetails) {
			result.push({ id: "loading-indicator", type: "loading" });
		}

		for (const alert of alerts) {
			result.push({
				id: `alert-${alert.id}`,
				type: "alert",
				alert,
			});
		}

		result.push({ id: "section-divider", type: "divider" });

		result.push({
			id: "logs-header",
			type: "logs-header",
			logCount: logs.length,
		});

		if (logs.length === 0) {
			result.push({ id: "logs-empty", type: "logs-empty" });
		} else {
			const totalLogs = logs.length;
			for (let i = 0; i < totalLogs; i++) {
				const log = logs[i];
				result.push({
					id: `log-${log.id}`,
					type: "log",
					log,
					logIndex: i,
					totalLogs,
				});
			}
		}

		return result;
	}, [alerts, logs, loadingDetails]);

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => scrollViewportRef.current,
		estimateSize: (index) => {
			const row = rows[index];
			return row ? ESTIMATED_SIZES[row.type] : 60;
		},
		getItemKey: (index) => rows[index]?.id ?? index,
		overscan: 6,
	});

	const virtualItems = rowVirtualizer.getVirtualItems();

	return (
		<div
			className="relative w-full min-w-0"
			style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
		>
			{virtualItems.map((virtualRow) => {
				const row = rows[virtualRow.index];
				if (!row) return null;

				return (
					<div
						key={virtualRow.key}
						data-index={virtualRow.index}
						ref={rowVirtualizer.measureElement}
						className="absolute top-0 left-0 w-full min-w-0 pb-0.5"
						style={{
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						{row.type === "summary-error" && (
							<Card
								variant="filled"
								className="bg-m3-error-container text-m3-on-error-container p-4 flex items-center justify-between gap-3"
							>
								<div className="flex flex-col items-center gap-3">
									<Icon
										name="warning"
										size={32}
										className="text-m3-on-error-container shrink-0"
									/>
									<div className="flex flex-col items-center gap-1">
										<Text
											variant="body-md"
											className="font-bold text-m3-on-error-container"
										>
											{row.alertCount} cảnh báo nghi vấn được ghi nhận
										</Text>
										<Text
											variant="body-sm"
											className="text-m3-on-error-container opacity-80"
										>
											Vui lòng kiểm tra các lượt nộp có dấu hiệu bất thường bên
											dưới.
										</Text>
									</div>
								</div>
							</Card>
						)}

						{row.type === "summary-empty" && (
							<Card
								variant="outlined"
								className="flex flex-col items-center gap-3 p-4"
							>
								<Icon
									name="verified"
									size={32}
									className="text-m3-primary shrink-0"
								/>
								<div className="flex flex-col items-center gap-1">
									<Text
										variant="body-md"
										className="text-center text-m3-on-surface"
									>
										Không có cảnh báo nghi vấn
									</Text>
									<Text
										variant="body-sm"
										className="text-center text-m3-on-surface-variant"
									>
										Chưa phát hiện hoạt động bất thường nào trên cổng nộp này.
									</Text>
								</div>
							</Card>
						)}

						{row.type === "alerts-header" && (
							<div className="flex items-center justify-between mt-4">
								<div className="flex items-center gap-2">
									<Icon name="security" className="text-m3-primary" size={20} />
									<h4 className="text-sm font-bold uppercase tracking-wider text-m3-on-surface">
										Cảnh báo nghi vấn ({row.alertCount})
									</h4>
								</div>
							</div>
						)}

						{row.type === "loading" && (
							<div className="flex flex-col items-center justify-center p-6 space-y-2">
								<LoadingIndicator
									aria-label="Đang tải chi tiết cổng nộp bài"
									size={32}
								/>
								<span className="text-xs text-m3-on-surface-variant">
									Đang đồng bộ dữ liệu cảnh báo và lượt nộp...
								</span>
							</div>
						)}

						{row.type === "alert" && <AlertCard alert={row.alert} />}

						{row.type === "divider" && (
							<Divider shape="wavy" className="my-1" />
						)}

						{row.type === "logs-header" && (
							<div className="flex items-center justify-between gap-2 mt-4 mb-2">
								<div className="flex items-center gap-2">
									<Icon
										name="receipt_long"
										className="text-m3-secondary"
										size={20}
									/>
									<h4 className="text-sm font-bold uppercase tracking-wider text-m3-on-surface">
										Lượt nộp gần đây ({row.logCount})
									</h4>
								</div>

								{row.logCount > 0 && (
									<Button
										size="sm"
										colorStyle="tonal"
										icon={<Icon name="download" size={20} />}
										onClick={onExportLogsCsv}
										className="shrink-0"
									>
										Xuất CSV
									</Button>
								)}
							</div>
						)}

						{row.type === "logs-empty" && (
							<Card
								variant="filled"
								className="bg-m3-surface-container-low flex flex-col items-center justify-center p-8 text-center text-m3-on-surface-variant rounded-m3-lg"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-m3-full bg-m3-surface-container-highest text-m3-on-surface-variant">
									<Icon name="history_edu" size={24} />
								</div>
								<Text
									variant="body-sm"
									className="mt-3 font-medium text-m3-on-surface"
								>
									Chưa có lượt nộp bài nào
								</Text>
								<Text
									variant="body-sm"
									className="mt-0.5 text-xs text-m3-on-surface-variant"
								>
									Các bài nộp của học sinh qua liên kết này sẽ được ghi nhận tại
									đây.
								</Text>
							</Card>
						)}

						{row.type === "log" && (
							<List
								variant="expressive"
								listStyle="segmented"
								className="w-full min-w-0"
							>
								<VirtualLogItem
									log={row.log}
									index={row.logIndex}
									total={row.totalLogs}
								/>
							</List>
						)}
					</div>
				);
			})}
		</div>
	);
};

export const VirtualDetailList = memo(VirtualDetailListComponent);
