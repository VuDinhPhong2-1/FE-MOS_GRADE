import {
	Button,
	Icon,
	ProgressIndicator,
	ShapeMedia,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { ComputerRoom } from "../../../types/computer-room.types";
import { RoomCard } from "./RoomCard";

interface RoomGridProps {
	rooms: ComputerRoom[];
	isLoading: boolean;
	hasActiveFilters: boolean;
	onEdit: (room: ComputerRoom) => void;
	onDelete: (room: ComputerRoom) => void;
	onOpenAdd: () => void;
	onClearFilters: () => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
	rooms,
	isLoading,
	hasActiveFilters,
	onEdit,
	onDelete,
	onOpenAdd,
	onClearFilters,
}) => {
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
				<ProgressIndicator
					variant="circular"
					shape="wavy"
					size={64}
					aria-label="Đang tải danh sách phòng máy..."
				/>
				<p className="text-sm font-medium text-m3-on-surface-variant">
					Đang tải danh sách phòng máy...
				</p>
			</div>
		);
	}

	if (rooms.length === 0) {
		if (hasActiveFilters) {
			return (
				<div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-m3-surface-container px-6 py-16 text-center">
					<div className="flex size-14 items-center justify-center rounded-2xl bg-m3-surface-container-highest text-m3-on-surface-variant">
						<Icon name="search_off" className="text-2xl" />
					</div>
					<div className="max-w-md">
						<h5 className="text-base font-bold text-m3-on-surface">
							Không tìm thấy phòng máy phù hợp
						</h5>
						<p className="mt-1 text-xs text-m3-on-surface-variant">
							Không có phòng máy nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng
							thái hiện tại.
						</p>
					</div>
					<Button
						type="button"
						colorStyle="tonal"
						size="sm"
						icon={<Icon name="filter_alt_off" className="text-sm" />}
						onClick={onClearFilters}
					>
						Xóa bộ lọc
					</Button>
				</div>
			);
		}

		return (
			<div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-m3-surface-container px-6 py-16 text-center">
				<ShapeMedia
					shape="pixelCircle"
					className="flex size-16 items-center justify-center bg-m3-surface-container-highest text-m3-on-surface-variant"
				>
					<Icon name="desktop_access_disabled" size={30} />
				</ShapeMedia>
				<div className="max-w-md">
					<h5 className="text-base font-bold text-m3-on-surface">
						Chưa có phòng máy nào
					</h5>
					<p className="mt-1 text-xs text-m3-on-surface-variant leading-relaxed">
						Trường này hiện chưa được khai báo phòng máy. Hãy tạo phòng máy đầu
						tiên để phân bổ lịch dạy và ghi nhận tình trạng thiết bị.
					</p>
				</div>
				<Button
					type="button"
					colorStyle="filled"
					size="md"
					icon={<Icon name="add" className="text-base" />}
					onClick={onOpenAdd}
				>
					Tạo phòng đầu tiên
				</Button>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{rooms.map((room) => (
				<RoomCard
					key={room.id}
					room={room}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
};
