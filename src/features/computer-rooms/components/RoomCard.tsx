import {
	ButtonDistribute,
	Card,
	CardFooter,
	Chip,
	Divider,
	Icon,
	IconButton,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { ComputerRoom } from "../../../types/computer-room.types";

interface RoomCardProps {
	room: ComputerRoom;
	onEdit: (room: ComputerRoom) => void;
	onDelete: (room: ComputerRoom) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
	room,
	onEdit,
	onDelete,
}) => {
	return (
		<Card variant="filled" className="flex flex-col justify-between p-5">
			<div>
				{/* Card Header: Title, Status Badge, Edit/Delete buttons */}
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<h4 className="text-base font-bold text-m3-on-surface font-md3-expressive">
							{room.name}
						</h4>
						<span
							className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
								room.isActive
									? "bg-m3-primary-container text-m3-on-primary-container"
									: "bg-m3-surface-container-highest text-m3-on-surface-variant"
							}`}
						>
							{room.isActive ? "Đang dùng" : "Tạm ẩn"}
						</span>
					</div>
					<p className="mt-1 text-xs text-m3-on-surface-variant">
						Tổng {room.totalMachinesText} · Máy lỗi {room.brokenMachineCount} ·
						Khả dụng {room.availableStudentMachines}
					</p>
				</div>

				{/* Device counts metrics */}
				<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
					<div className="rounded-2xl bg-m3-surface-container-low px-3 py-2">
						<div className="text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant">
							Máy HS
						</div>
						<div className="mt-0.5 text-base font-bold text-m3-on-surface">
							{room.studentMachineCount}
						</div>
					</div>
					<div className="rounded-2xl bg-m3-surface-container-low px-3 py-2">
						<div className="text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant">
							Máy GV
						</div>
						<div className="mt-0.5 text-base font-bold text-m3-on-surface">
							{room.teacherMachineCount}
						</div>
					</div>
					<div className="rounded-2xl bg-m3-primary-container/40 px-3 py-2">
						<div className="text-[11px] font-semibold uppercase tracking-wider text-m3-primary">
							Khả dụng
						</div>
						<div className="mt-0.5 text-base font-bold text-m3-primary">
							{room.availableStudentMachines}
						</div>
					</div>
					<div className="rounded-2xl bg-m3-error-container/40 px-3 py-2">
						<div className="text-[11px] font-semibold uppercase tracking-wider text-m3-error">
							Máy lỗi
						</div>
						<div className="mt-0.5 text-base font-bold text-m3-error">
							{room.brokenMachineCount}
						</div>
					</div>
				</div>

				{/* Broken machines details notice */}
				{room.brokenMachinesDetail ? (
					<p className="mt-3 rounded-2xl bg-m3-error-container/30 px-3.5 py-2 text-xs text-m3-on-error-container">
						<strong className="font-semibold">Chi tiết máy hỏng:</strong>{" "}
						{room.brokenMachinesDetail}
					</p>
				) : null}

				{/* Condition tags */}
				<div className="mt-4 flex flex-wrap gap-1.5">
					{[
						{ label: "NetSupport", value: room.netSupportStatus },
						{ label: "Âm thanh", value: room.audioStatus },
						{ label: "Làm mát", value: room.coolingStatus },
						{ label: "Vệ sinh", value: room.roomHygieneStatus },
						{ label: "Tắt điện", value: room.devicesPoweredOffStatus },
						{ label: "Xếp ghế", value: room.seatingOrderStatus },
					].map((item) => (
						<Chip
							aria-label={`Thông tin phòng máy ${item.label} ${item.value}`}
							variant="suggestion"
							key={`${room.id}-${item.label}`}
							label={`${item.label}: ${item.value || "Chưa cập nhật"}`}
						/>
					))}
				</div>
			</div>

			<Divider shape="wavy" className="mt-4" />

			<CardFooter className="p-0 mt-4">
				<ButtonDistribute
					mode="dynamic"
					expandRatio={0.1}
					gap={8}
					weights={[2, 1]}
					size="sm"
				>
					<IconButton
						aria-label="Sửa thông tin phòng máy"
						colorStyle="outlined"
						size="sm"
						onClick={() => onEdit(room)}
						width="wide"
					>
						<Icon name="edit" size={24} />
					</IconButton>
					<IconButton
						aria-label="Xóa phòng máy"
						colorStyle="standard"
						size="sm"
						className="text-m3-error hover:bg-m3-error-container/20"
						onClick={() => onDelete(room)}
					>
						<Icon name="delete" size={24} />
					</IconButton>
				</ButtonDistribute>
			</CardFooter>
		</Card>
	);
};
