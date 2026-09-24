import { Button, Card, Icon, LoadingIndicator } from "@bug-on/m3-expressive";
import type React from "react";
import type {
	SubmissionAlert,
	SubmissionLog,
	SubmissionPortal,
} from "../../../types/submission-portal.types";
import { AlertCard } from "./AlertCard";
import { SubmissionLogsTable } from "./SubmissionLogsTable";

interface PortalDetailsSectionProps {
	selectedPortal: SubmissionPortal;
	alerts: SubmissionAlert[];
	logs: SubmissionLog[];
	loadingDetails: boolean;
	onClose: () => void;
	onExportLogsCsv: () => void;
}

export const PortalDetailsSection: React.FC<PortalDetailsSectionProps> = ({
	selectedPortal,
	alerts,
	logs,
	loadingDetails,
	onClose,
	onExportLogsCsv,
}) => {
	return (
		<section className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
			{/* Left Column: Suspicious Alerts */}
			<Card
				variant="filled"
				className="bg-m3-surface-container flex flex-col p-5 space-y-4"
			>
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex items-center gap-2">
							<Icon name="security" className="text-m3-primary" size={20} />
							<h3 className="text-lg font-bold text-m3-on-surface">
								Cảnh báo nghi vấn
							</h3>
						</div>
						<p className="mt-0.5 text-xs text-m3-on-surface-variant truncate max-w-sm">
							Cổng: {selectedPortal.title}
						</p>
					</div>

					<Button
						size="sm"
						icon={<Icon name="close" size={18} />}
						onClick={onClose}
					>
						Đóng
					</Button>
				</div>

				{/* Loading indicator */}
				{loadingDetails && (
					<div className="flex flex-col items-center justify-center p-6 space-y-2">
						<LoadingIndicator
							aria-label="Đang tải cảnh báo và lịch sử nộp bài"
							size={20}
						/>
						<span className="text-xs text-m3-on-surface-variant">
							Đang tải chi tiết lượt nộp và cảnh báo...
						</span>
					</div>
				)}

				{/* Alerts List */}
				<div className="space-y-3 overflow-y-auto max-h-150 pr-1">
					{alerts.map((alert) => (
						<AlertCard key={alert.id} alert={alert} />
					))}

					{alerts.length === 0 && !loadingDetails && (
						<Card
							variant="filled"
							className="bg-m3-primary-container text-m3-on-primary-container flex items-center gap-3 p-4"
						>
							<Icon name="verified" size={22} />
							<span className="text-sm font-semibold">
								Không có cảnh báo nghi vấn nào trên cổng này.
							</span>
						</Card>
					)}
				</div>
			</Card>

			{/* Right Column: Submission Logs Table */}
			<Card variant="filled" className="bg-m3-surface-container p-5">
				<SubmissionLogsTable logs={logs} onExportCsv={onExportLogsCsv} />
			</Card>
		</section>
	);
};
