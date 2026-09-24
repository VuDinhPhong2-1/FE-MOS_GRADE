import { Card, Chip, Icon, List, ListItem } from "@bug-on/m3-expressive";
import type React from "react";
import type { SubmissionAlert } from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";
import {
	formatDateTime,
	severityColors,
	severityLabel,
} from "../utils/portalFormatters";

interface AlertCardProps {
	alert: SubmissionAlert;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
	const colors = severityColors(alert.severity);

	return (
		<Card variant="filled" className={`${colors.containerClass} p-4 space-y-3`}>
			{/* Header: Severity Badge & Timestamp */}
			<div className="flex items-center justify-between gap-2">
				<Chip
					variant="suggestion"
					label={severityLabel(alert.severity)}
					leadingIcon={
						<Icon name="warning" size={16} className={cn(colors.iconClass)} />
					}
					className={cn(colors.badgeClass, "pointer-events-none select-none")}
				/>
				<span className="text-xs opacity-80">
					{formatDateTime(alert.createdAt)}
				</span>
			</div>

			{/* Alert Message */}
			<p className="text-sm font-semibold leading-relaxed">{alert.message}</p>

			{/* Involved Students Sub-List */}
			{alert.involvedStudents && alert.involvedStudents.length > 0 ? (
				<div className="space-y-2 text-m3-on-surface">
					<p className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
						Học sinh liên quan
					</p>
					<List outerRadius={12} variant="expressive" listStyle="segmented">
						{alert.involvedStudents.map((student) => (
							<ListItem
								key={`${alert.id}-${student.studentId}-${student.submittedAt || "latest"}`}
								value={`${alert.id}-${student.studentId}`}
								className="bg-m3-surface-container-lowest"
								headline={
									<span className="font-bold text-m3-on-surface">
										{student.studentName || "(Không rõ học sinh)"}
									</span>
								}
								supportingText={
									<div className="space-y-1">
										<span className="block text-xs text-m3-on-surface-variant">
											{student.className || "Chưa rõ lớp"}
											{student.assignmentName
												? ` · ${student.assignmentName}`
												: ""}
										</span>
										<span className="block text-[11px] text-m3-on-surface-variant opacity-80">
											Tệp: {student.fileName || "--"} · IP:{" "}
											{student.ipAddress || "--"} · Nộp lúc:{" "}
											{formatDateTime(student.submittedAt)}
										</span>
									</div>
								}
								trailingType={
									student.scoreValue !== undefined ? "custom" : "none"
								}
								trailingContent={
									student.scoreValue !== undefined ? (
										<span className="rounded-m3-full bg-m3-surface-container-high px-2.5 py-0.5 text-xs font-black text-m3-on-surface">
											{student.scoreValue}/{student.maxScore ?? "--"}
										</span>
									) : undefined
								}
							/>
						))}
					</List>
				</div>
			) : (
				<p className="rounded-m3-sm bg-m3-surface/70 p-2.5 text-xs text-m3-on-surface">
					Chưa có dữ liệu tên học sinh cho cảnh báo này. Vui lòng đối chiếu bảng
					“Lượt nộp gần đây” theo thời gian/IP/tệp.
				</p>
			)}
		</Card>
	);
};
