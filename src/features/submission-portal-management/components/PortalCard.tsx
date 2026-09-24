import { Button, Card, Chip, Icon } from "@bug-on/m3-expressive";
import type React from "react";
import type { SubmissionPortal } from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";
import { formatDateTime } from "../utils/portalFormatters";

interface PortalCardProps {
	portal: SubmissionPortal;
	publicOrigin: string;
	onCopyUrl: (url: string) => void;
	onOpenDetails: (portal: SubmissionPortal) => void;
	onEdit: (portal: SubmissionPortal) => void;
	onDelete: (portal: SubmissionPortal) => void;
	isActionDisabled?: boolean;
}

export const PortalCard: React.FC<PortalCardProps> = ({
	portal,
	publicOrigin,
	onCopyUrl,
	onOpenDetails,
	onEdit,
	onDelete,
	isActionDisabled,
}) => {
	const url = `${publicOrigin}/submit/${portal.publicToken}`;

	return (
		<Card
			variant="filled"
			className="bg-m3-surface-container flex flex-col justify-between p-5 space-y-4"
		>
			<div className="space-y-3">
				{/* Top row: Status, Alert badges & Creation date */}
				<div className="flex flex-wrap items-start justify-between gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<Chip
							variant="suggestion"
							label={portal.isActive ? "Đang mở" : "Đã đóng"}
							leadingIcon={
								<Icon
									name={portal.isActive ? "check_circle" : "cancel"}
									size={16}
								/>
							}
							className={cn(
								"border-m3-on-surface-variant/50 pointer-events-none",
								portal.isActive
									? "bg-m3-primary/10 text-m3-primary"
									: "bg-m3-surface-variant text-m3-on-surface-variant",
							)}
						/>

						{portal.unreadAlertCount > 0 && (
							<Chip
								variant="suggestion"
								label={`${portal.unreadAlertCount} cảnh báo`}
								leadingIcon={
									<Icon name="warning" size={16} className="text-m3-on-error" />
								}
								className="border-none bg-m3-error text-m3-on-error font-semibold pointer-events-none select-none"
							/>
						)}
					</div>

					<span className="text-right text-xs text-m3-on-surface-variant">
						Ngày tạo: {formatDateTime(portal.createdAt)}
					</span>
				</div>

				{/* Title & Description */}
				<div>
					<h3 className="text-lg font-bold text-m3-on-surface">
						{portal.title}
					</h3>
					{portal.description && (
						<p className="mt-1 text-sm text-m3-on-surface-variant line-clamp-2">
							{portal.description}
						</p>
					)}
				</div>

				{/* Quick Stats: Classes, Assignments, Scoring Policy */}
				<div className="grid grid-cols-3 gap-2 rounded-m3-md bg-m3-surface-container-highest p-2.5 text-center text-xs">
					<div>
						<span className="block font-bold text-m3-on-surface">
							{portal.classIds.length}
						</span>
						<span className="text-m3-on-surface-variant">Lớp áp dụng</span>
					</div>
					<div>
						<span className="block font-bold text-m3-on-surface">
							{portal.assignmentIds.length}
						</span>
						<span className="text-m3-on-surface-variant">Bài tập</span>
					</div>
					<div>
						<span className="block font-bold text-m3-on-surface">
							{portal.scoringPolicy === "BestScore" ? "Cao nhất" : "Mới nhất"}
						</span>
						<span className="text-m3-on-surface-variant">Tính điểm</span>
					</div>
				</div>
			</div>

			{/* Link Box & Action Buttons */}
			<div className="space-y-3 pt-2">
				<div className="rounded-m3-lg bg-m3-surface-container-high p-3">
					<div className="break-all font-mono text-xs text-m3-on-surface-variant select-all">
						{url}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						colorStyle="filled"
						size="sm"
						icon={<Icon name="analytics" size={18} />}
						onClick={() => onOpenDetails(portal)}
					>
						Chi tiết
					</Button>

					<Button
						colorStyle="tonal"
						size="sm"
						icon={<Icon name="content_copy" size={18} />}
						onClick={() => onCopyUrl(url)}
					>
						Sao chép
					</Button>

					<Button
						colorStyle="outlined"
						size="sm"
						icon={<Icon name="open_in_new" size={18} />}
						onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
					>
						Xem thử
					</Button>

					<Button
						colorStyle="text"
						size="sm"
						icon={<Icon name="qr_code_2" size={18} />}
						onClick={() => onCopyUrl(url)}
					>
						QR
					</Button>

					<Button
						colorStyle="text"
						size="sm"
						icon={<Icon name="edit" size={18} />}
						onClick={() => onEdit(portal)}
					>
						Sửa
					</Button>

					<Button
						colorStyle="text"
						size="sm"
						disabled={isActionDisabled}
						icon={<Icon name="link_off" size={18} />}
						className="text-m3-error hover:bg-m3-error/10 ml-auto"
						onClick={() => onDelete(portal)}
					>
						Đóng link
					</Button>
				</div>
			</div>
		</Card>
	);
};
