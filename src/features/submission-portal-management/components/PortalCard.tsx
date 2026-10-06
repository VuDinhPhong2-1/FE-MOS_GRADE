import {
	Button,
	ButtonDistribute,
	Card,
	Chip,
	Icon,
} from "@bug-on/m3-expressive";
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
	isSelected?: boolean;
}

export const PortalCard: React.FC<PortalCardProps> = ({
	portal,
	publicOrigin,
	onCopyUrl,
	onOpenDetails,
	onEdit,
	onDelete,
	isActionDisabled,
	isSelected,
}) => {
	const url = `${publicOrigin}/submit/${portal.publicToken}`;

	return (
		<Card
			variant="filled"
			className={cn(
				"flex flex-col justify-between p-5 space-y-4 cursor-pointer pointer-events-auto transition-colors",
				isSelected
					? "bg-m3-primary-container text-m3-on-primary-container ring-2 ring-m3-primary shadow-sm"
					: "bg-m3-surface-container-highest text-m3-on-surface",
			)}
			onClick={() => onOpenDetails(portal)}
			disableElevation
			disableStateLayer
			morphRadius={{
				rest: isSelected ? "extraLargeIncreased" : "large",
				hover: "extraLargeIncreased",
			}}
		>
			<div className="space-y-3">
				{/* Top row: Status, Alert badges & Creation date */}
				<div className="flex flex-wrap items-center justify-between gap-2">
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
								"border-m3-on-surface-variant/50 pointer-events-none h-10",
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
									<Icon name="warning" size={20} className="text-m3-on-error" />
								}
								className="border-none bg-m3-error text-m3-on-error font-semibold pointer-events-none h-10"
							/>
						)}
					</div>

					<span
						className={cn(
							"text-right text-xs",
							isSelected
								? "text-m3-on-primary-container/80"
								: "text-m3-on-surface-variant",
						)}
					>
						Ngày tạo: {formatDateTime(portal.createdAt)}
					</span>
				</div>

				{/* Title & Description */}
				<div>
					<p
						className={cn(
							"text-lg font-bold",
							isSelected
								? "text-m3-on-primary-container"
								: "text-m3-on-surface",
						)}
					>
						{portal.title}
					</p>
					{portal.description && (
						<p
							className={cn(
								"mt-1 text-sm line-clamp-2",
								isSelected
									? "text-m3-on-primary-container/80"
									: "text-m3-on-surface-variant",
							)}
						>
							{portal.description}
						</p>
					)}
				</div>

				{/* Applied Classes Badges */}
				{portal.classes && portal.classes.length > 0 && (
					<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
						<span
							className={cn(
								"text-xs font-semibold",
								isSelected
									? "text-m3-on-primary-container"
									: "text-m3-on-surface-variant",
							)}
						>
							Lớp:
						</span>
						{portal.classes.map((cls) => (
							<span
								key={cls.id}
								className="rounded-m3-full bg-m3-secondary-container px-2.5 py-0.5 text-xs font-bold text-m3-on-secondary-container"
							>
								{cls.name}
							</span>
						))}
					</div>
				)}

				{/* Quick Stats: Classes, Assignments, Scoring Policy */}
				<div
					className={cn(
						"grid grid-cols-3 gap-2 rounded-m3-md p-2.5 text-center text-xs transition-colors",
						isSelected
							? "bg-m3-surface/60 text-m3-on-surface"
							: "bg-m3-surface-container-low",
					)}
				>
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
			<ButtonDistribute
				size="sm"
				expandRatio={0.1}
				gap={8}
				onClick={(e) => e.stopPropagation()}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<Button
					colorStyle="filled"
					size="sm"
					icon={<Icon name="open_in_new" size={20} />}
					fullWidth
					onClick={(e) => {
						e.stopPropagation();
						window.open(url, "_blank", "noopener,noreferrer");
					}}
				>
					Mở liên kết
				</Button>

				<Button
					colorStyle="tonal"
					size="sm"
					icon={<Icon name="content_copy" size={20} />}
					onClick={(e) => {
						e.stopPropagation();
						onCopyUrl(url);
					}}
					fullWidth
				>
					Sao chép
				</Button>

				<Button
					colorStyle="outlined"
					size="sm"
					icon={<Icon name="edit" size={20} />}
					onClick={(e) => {
						e.stopPropagation();
						onEdit(portal);
					}}
					fullWidth
				>
					Sửa
				</Button>

				<Button
					colorStyle="text"
					size="sm"
					disabled={isActionDisabled}
					icon={<Icon name="link_off" size={20} />}
					className="text-m3-error hover:bg-m3-error/10"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(portal);
					}}
					fullWidth
				>
					Đóng link
				</Button>
			</ButtonDistribute>
		</Card>
	);
};
