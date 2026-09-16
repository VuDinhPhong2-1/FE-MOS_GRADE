import { LoadingIndicator } from "@bug-on/m3-expressive";
import type React from "react";
import type { ComputerRoomSummary } from "../types";

interface RoomStatsGridProps {
	summary: ComputerRoomSummary;
	isLoading?: boolean;
}

export const RoomStatsGrid: React.FC<RoomStatsGridProps> = ({
	summary,
	isLoading = false,
}) => {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{/* Tổng phòng */}
			<div className="rounded-2xl bg-m3-surface-container p-4 transition-colors">
				<div className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
					Tổng phòng
				</div>
				<div className="mt-2 flex h-8 items-center text-2xl font-bold text-m3-on-surface">
					{isLoading ? (
						<LoadingIndicator
							size={24}
							aria-label="Đang tải tổng số phòng máy"
						/>
					) : (
						summary.totalRooms
					)}
				</div>
			</div>

			{/* Máy HS sẵn sàng */}
			<div className="rounded-2xl bg-m3-primary-container p-4 transition-colors">
				<div className="text-xs font-semibold uppercase tracking-wider text-m3-on-primary-container">
					Máy sẵn sàng
				</div>
				<div className="mt-2 flex h-8 items-center text-2xl font-bold text-m3-on-primary-container">
					{isLoading ? (
						<LoadingIndicator
							size={24}
							color="currentColor"
							aria-label="Đang tải số máy sẵn sàng"
						/>
					) : (
						summary.availableMachines
					)}
				</div>
			</div>

			{/* Tổng thiết bị */}
			<div className="rounded-2xl bg-m3-secondary-container p-4 transition-colors">
				<div className="text-xs font-semibold uppercase tracking-wider text-m3-on-secondary-container">
					Tổng thiết bị
				</div>
				<div className="mt-2 flex h-8 items-center text-2xl font-bold text-m3-on-secondary-container">
					{isLoading ? (
						<LoadingIndicator
							size={24}
							color="currentColor"
							aria-label="Đang tải tổng số thiết bị"
						/>
					) : (
						summary.totalMachines
					)}
				</div>
			</div>

			{/* Phòng hoạt động */}
			<div className="rounded-2xl bg-m3-surface-container p-4 transition-colors">
				<div className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
					Đang hoạt động
				</div>
				<div className="mt-2 flex h-8 items-center text-2xl font-bold text-m3-on-surface">
					{isLoading ? (
						<LoadingIndicator
							size={24}
							aria-label="Đang tải số phòng hoạt động"
						/>
					) : (
						summary.activeRooms
					)}
				</div>
			</div>
		</div>
	);
};
