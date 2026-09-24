import { Button, Card, Icon } from "@bug-on/m3-expressive";
import type React from "react";
import type { SubmissionPortal } from "../../../types/submission-portal.types";
import { PortalCard } from "./PortalCard";

interface PortalListProps {
	portals: SubmissionPortal[];
	publicOrigin: string;
	onOpenCreate: () => void;
	onCopyUrl: (url: string) => void;
	onOpenDetails: (portal: SubmissionPortal) => void;
	onEdit: (portal: SubmissionPortal) => void;
	onDelete: (portal: SubmissionPortal) => void;
	isActionDisabled?: boolean;
}

export const PortalList: React.FC<PortalListProps> = ({
	portals,
	publicOrigin,
	onOpenCreate,
	onCopyUrl,
	onOpenDetails,
	onEdit,
	onDelete,
	isActionDisabled,
}) => {
	return (
		<section className="space-y-4">
			{/* Section Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-bold text-m3-on-surface">
						Danh sách cổng nộp bài
					</h2>
					<p className="text-sm text-m3-on-surface-variant">
						Sao chép link, xem thử giao diện học sinh và kiểm tra cảnh báo nộp
						bài.
					</p>
				</div>
				<Button
					colorStyle="filled"
					icon={<Icon name="add_link" />}
					onClick={onOpenCreate}
				>
					Tạo link mới
				</Button>
			</div>

			{/* Portals Grid */}
			<div className="grid gap-4 xl:grid-cols-2 items-start">
				{portals.map((portal) => (
					<PortalCard
						key={portal.id}
						portal={portal}
						publicOrigin={publicOrigin}
						onCopyUrl={onCopyUrl}
						onOpenDetails={onOpenDetails}
						onEdit={onEdit}
						onDelete={onDelete}
						isActionDisabled={isActionDisabled}
					/>
				))}

				{/* Empty State */}
				{portals.length === 0 && (
					<Card
						variant="filled"
						className="bg-m3-surface-container-low flex flex-col items-center justify-center p-10 text-center xl:col-span-2"
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-m3-full bg-m3-primary-container text-m3-on-primary-container">
							<Icon name="link_off" size={32} />
						</div>
						<h3 className="mt-4 text-lg font-bold text-m3-on-surface">
							Chưa có link nộp bài nào đang mở
						</h3>
						<p className="mt-1 max-w-md text-sm text-m3-on-surface-variant">
							Tạo link mới để học sinh chọn trường, chọn lớp, chọn bài tập và
							nộp bài thi chấm tự động qua cổng công khai.
						</p>
						<div className="mt-5">
							<Button
								colorStyle="filled"
								icon={<Icon name="add" />}
								onClick={onOpenCreate}
							>
								Tạo link đầu tiên
							</Button>
						</div>
					</Card>
				)}
			</div>
		</section>
	);
};
