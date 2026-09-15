import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	ProgressIndicator,
	Select,
	type SelectOption,
	TextField,
} from "@bug-on/m3-expressive";
import { type FormEvent, useMemo } from "react";
import {
	DialogHeaderIcon,
	useUnsavedChangesGuard,
} from "../../components/common";
import type { ComputerRoom } from "../../types/computer-room.types";
import type { School } from "../../types/school.types";
import type { ComputerRoomFormState } from "./types";
import { getRoomConditionTone } from "./utils";

interface RoomManagerModalProps {
	open: boolean;
	roomManagerSchoolId: string;
	roomManagerRows: ComputerRoom[];
	roomManagerLoading: boolean;
	editingRoomId: string;
	roomSubmitting: boolean;
	roomForm: ComputerRoomFormState;
	schools: School[];
	selectedRoomManagerSchool: School | null;
	roomManagerSummary: {
		totalRooms: number;
		activeRooms: number;
		totalMachines: number;
		availableMachines: number;
	};
	roomFormMachinePreview: {
		totalMachines: number;
		availableMachines: number;
	};
	onClose: () => void;
	onSchoolChange: (schoolId: string) => void;
	onResetForm: (schoolId: string) => void;
	onEditRoom: (room: ComputerRoom) => void;
	onDeleteRoom: (room: ComputerRoom) => void;
	onSaveRoom: (e: FormEvent<HTMLFormElement>) => void;
	onRoomFormFieldChange: <K extends keyof ComputerRoomFormState>(
		field: K,
		value: ComputerRoomFormState[K],
	) => void;
}

export const RoomManagerModal = ({
	open,
	roomManagerSchoolId,
	roomManagerRows,
	roomManagerLoading,
	editingRoomId,
	roomSubmitting,
	roomForm,
	schools,
	selectedRoomManagerSchool,
	roomManagerSummary,
	roomFormMachinePreview,
	onClose,
	onSchoolChange,
	onResetForm,
	onEditRoom,
	onDeleteRoom,
	onSaveRoom,
	onRoomFormFieldChange,
}: RoomManagerModalProps) => {
	const schoolOptions = useMemo<SelectOption[]>(() => {
		return schools.map((school) => ({
			label: school.name,
			value: school.id,
		}));
	}, [schools]);

	const isDirty = Boolean(editingRoomId || roomForm.name.trim());

	const { handleSafeClose } = useUnsavedChangesGuard({
		isDirty,
		isOpen: open,
		message: "Bạn đang có thông tin phòng máy chưa lưu. Bạn có chắc muốn đóng?",
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => !isOpen && handleSafeClose(onClose)}
		>
			<DialogPortal open={open}>
				<DialogOverlay />
				<DialogContent
					hideCloseButton
					className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-7xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
				>
					{/* Modal Header */}
					<div className="flex items-center justify-between px-6 pt-5 pb-3">
						<DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
							<DialogHeaderIcon icon="desktop_windows" />
							<div>
								<DialogTitle className="text-lg font-bold text-m3-on-surface font-md3-expressive">
									Quản lý phòng máy
								</DialogTitle>
								<DialogDescription className="text-xs text-m3-on-surface-variant">
									Cấu hình phòng máy theo từng trường để dùng cho lịch dạy, điểm
									danh và báo cáo.
								</DialogDescription>
							</div>
						</DialogHeader>
					</div>

					{/* Sub-header badges */}
					<div className="flex flex-wrap items-center gap-2 px-6 pb-3 text-xs font-medium">
						<span className="inline-flex items-center gap-1 rounded-full border border-m3-primary/30 bg-m3-primary/10 px-3 py-1 text-m3-primary">
							<Icon name="domain" className="text-xs" />
							{selectedRoomManagerSchool?.name || "Chưa chọn trường"}
						</span>
						<span className="rounded-full border border-m3-outline-variant bg-m3-surface px-3 py-1 text-m3-on-surface-variant">
							{roomManagerSummary.totalRooms} phòng
						</span>
						<span className="rounded-full border border-m3-tertiary/30 bg-m3-tertiary-container/30 px-3 py-1 text-m3-on-tertiary-container">
							{roomManagerSummary.activeRooms} đang hoạt động
						</span>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
						<div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_400px]">
							<div className="space-y-4">
								<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 shadow-xs text-m3-on-surface">
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex-1">
											<Select
												variant="outlined"
												label="Trường áp dụng"
												options={schoolOptions}
												value={roomManagerSchoolId}
												onChange={(val) => {
													onSchoolChange(val);
													onResetForm(val);
												}}
												searchable
												placeholder="Chọn trường"
											/>
										</div>

										<Button
											type="button"
											colorStyle="filled"
											size="sm"
											icon={<Icon name="add" className="text-base" />}
											onClick={() => onResetForm(roomManagerSchoolId)}
										>
											Tạo phòng mới
										</Button>
									</div>

									<div className="mt-4 grid gap-3 sm:grid-cols-3">
										<div className="rounded-2xl border border-m3-outline-variant/60 bg-m3-surface-container-high p-3.5 shadow-2xs">
											<div className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
												Tổng phòng
											</div>
											<div className="mt-2 text-2xl font-bold text-m3-on-surface">
												{roomManagerSummary.totalRooms}
											</div>
										</div>
										<div className="rounded-2xl border border-m3-primary/30 bg-m3-primary/10 p-3.5 shadow-2xs">
											<div className="text-xs font-semibold uppercase tracking-wider text-m3-primary">
												Máy sẵn sàng
											</div>
											<div className="mt-2 text-2xl font-bold text-m3-primary">
												{roomManagerSummary.availableMachines}
											</div>
										</div>
										<div className="rounded-2xl border border-m3-secondary/30 bg-m3-secondary/10 p-3.5 shadow-2xs">
											<div className="text-xs font-semibold uppercase tracking-wider text-m3-secondary">
												Tổng thiết bị
											</div>
											<div className="mt-2 text-2xl font-bold text-m3-secondary">
												{roomManagerSummary.totalMachines}
											</div>
										</div>
									</div>
								</div>

								<div className="rounded-3xl bg-m3-surface-container overflow-hidden shadow-xs text-m3-on-surface">
									<div className="flex items-center justify-between border-b border-m3-outline-variant/60 bg-m3-surface-container px-4 py-3">
										<div>
											<h4 className="text-base font-bold text-m3-on-surface">
												Danh sách phòng máy
											</h4>
											<p className="text-xs text-m3-on-surface-variant">
												Chọn một phòng để chỉnh sửa nhanh cấu hình và trạng thái
												vận hành.
											</p>
										</div>
										<span className="rounded-full border border-m3-outline-variant bg-m3-surface-container-high px-3 py-1 text-xs font-semibold text-m3-on-surface-variant">
											{roomManagerRows.length} mục
										</span>
									</div>
									<div className="max-h-[58vh] overflow-y-auto p-3 sm:p-4">
										{roomManagerLoading && (
											<div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
												<ProgressIndicator
													variant="circular"
													shape="wavy"
													size={28}
													aria-label="Đang tải phòng máy..."
												/>
												<p className="text-xs text-m3-on-surface-variant font-medium">
													Đang tải phòng máy...
												</p>
											</div>
										)}

										{!roomManagerLoading && roomManagerRows.length === 0 && (
											<div className="rounded-2xl border border-dashed border-m3-outline-variant/60 bg-m3-surface-container-high/50 px-4 py-10 text-center text-sm text-m3-on-surface-variant">
												Chưa có phòng máy nào trong trường này.
											</div>
										)}

										{!roomManagerLoading && roomManagerRows.length > 0 && (
											<div className="space-y-3">
												{roomManagerRows.map((room) => (
													<article
														key={room.id}
														className={`group rounded-2xl border p-4 shadow-2xs transition-all ${
															editingRoomId === room.id
																? "border-m3-primary bg-m3-primary/10 shadow-xs"
																: "border-m3-outline-variant/60 bg-m3-surface-container-high hover:bg-m3-surface-container-highest/60"
														}`}
													>
														<div className="flex flex-wrap items-start justify-between gap-3">
															<div>
																<div className="flex flex-wrap items-center gap-2">
																	<h5 className="text-lg font-bold text-m3-on-surface">
																		{room.name}
																	</h5>
																	<span
																		className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
																			room.isActive
																				? "bg-m3-primary-container text-m3-on-primary-container"
																				: "bg-m3-surface-container-highest text-m3-on-surface-variant"
																		}`}
																	>
																		{room.isActive ? "Đang dùng" : "Tạm ẩn"}
																	</span>
																</div>
																<p className="mt-1 text-sm text-m3-on-surface-variant">
																	Tổng {room.totalMachinesText} · Máy lỗi{" "}
																	{room.brokenMachineCount} · Dùng được{" "}
																	{room.availableStudentMachines}
																</p>
															</div>

															<div className="flex flex-wrap gap-2">
																<Button
																	type="button"
																	colorStyle="outlined"
																	size="xs"
																	icon={
																		<Icon name="edit" className="text-xs" />
																	}
																	onClick={() => onEditRoom(room)}
																>
																	Sửa
																</Button>
																<Button
																	type="button"
																	colorStyle="outlined"
																	size="xs"
																	className="border-m3-error/40! text-m3-error! hover:bg-m3-error-container/20!"
																	icon={
																		<Icon name="delete" className="text-xs" />
																	}
																	onClick={() => onDeleteRoom(room)}
																>
																	Xóa
																</Button>
															</div>
														</div>

														<div className="mt-4 grid gap-2 sm:grid-cols-4">
															<div className="rounded-xl bg-m3-surface-container px-3 py-2">
																<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-on-surface-variant">
																	Máy HS
																</div>
																<div className="mt-1 text-base font-bold text-m3-on-surface">
																	{room.studentMachineCount}
																</div>
															</div>
															<div className="rounded-xl bg-m3-surface-container px-3 py-2">
																<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-on-surface-variant">
																	Máy GV
																</div>
																<div className="mt-1 text-base font-bold text-m3-on-surface">
																	{room.teacherMachineCount}
																</div>
															</div>
															<div className="rounded-xl border border-m3-primary/30 bg-m3-primary-container/20 px-3 py-2">
																<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-primary">
																	Khả dụng
																</div>
																<div className="mt-1 text-base font-bold text-m3-primary">
																	{room.availableStudentMachines}
																</div>
															</div>
															<div className="rounded-xl border border-m3-error/30 bg-m3-error-container/20 px-3 py-2">
																<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-error">
																	Máy lỗi
																</div>
																<div className="mt-1 text-base font-bold text-m3-error">
																	{room.brokenMachineCount}
																</div>
															</div>
														</div>

														{room.brokenMachinesDetail ? (
															<p className="mt-2 rounded-xl border border-m3-error/40 bg-m3-error-container/20 px-3 py-1.5 text-xs text-m3-on-error-container">
																Chi tiết máy hỏng: {room.brokenMachinesDetail}
															</p>
														) : null}

														<div className="mt-4 flex flex-wrap gap-2">
															{[
																{
																	label: "NetSupport",
																	value: room.netSupportStatus,
																},
																{ label: "Âm thanh", value: room.audioStatus },
																{ label: "Làm mát", value: room.coolingStatus },
																{
																	label: "Vệ sinh",
																	value: room.roomHygieneStatus,
																},
															].map((item) => (
																<span
																	key={`${room.id}-${item.label}`}
																	className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getRoomConditionTone(
																		item.value,
																	)}`}
																>
																	{item.label}: {item.value || "Chưa cập nhật"}
																</span>
															))}
														</div>

														<p className="mt-3 text-xs text-m3-on-surface-variant">
															Tắt điện:{" "}
															{room.devicesPoweredOffStatus || "Chưa cập nhật"}{" "}
															· Xếp ghế:{" "}
															{room.seatingOrderStatus || "Chưa cập nhật"}
														</p>
													</article>
												))}
											</div>
										)}
									</div>
								</div>
							</div>

							<form
								onSubmit={onSaveRoom}
								className="flex min-h-160 flex-col overflow-hidden rounded-3xl bg-m3-surface-container shadow-xs"
							>
								<div className="border-b border-m3-outline-variant/60 bg-m3-surface-container px-4 py-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<h4 className="text-base font-bold text-m3-on-surface">
												{editingRoomId
													? "Chỉnh sửa phòng máy"
													: "Tạo phòng máy mới"}
											</h4>
											<p className="mt-1 text-sm text-m3-on-surface-variant">
												{editingRoomId
													? "Cập nhật nhanh cấu hình và tình trạng vận hành của phòng đang chọn."
													: "Khai báo một phòng máy chuẩn để dùng xuyên suốt cho lịch dạy và báo cáo."}
											</p>
										</div>
										{editingRoomId && (
											<span className="rounded-full border border-m3-primary/30 bg-m3-primary/10 px-3 py-1 text-xs font-semibold text-m3-primary">
												Đang sửa
											</span>
										)}
									</div>

									<div className="mt-4 grid gap-3 sm:grid-cols-2">
										<div className="rounded-2xl border border-m3-primary/30 bg-m3-primary/10 p-3">
											<div className="text-xs font-semibold uppercase tracking-[0.16em] text-m3-primary">
												Tổng máy dự kiến
											</div>
											<div className="mt-2 text-2xl font-extrabold text-m3-primary">
												{roomFormMachinePreview.totalMachines}
											</div>
										</div>
										<div className="rounded-2xl border border-m3-secondary/30 bg-m3-secondary/10 p-3">
											<div className="text-xs font-semibold uppercase tracking-[0.16em] text-m3-secondary">
												Máy dùng được
											</div>
											<div className="mt-2 text-2xl font-extrabold text-m3-secondary">
												{roomFormMachinePreview.availableMachines}
											</div>
										</div>
									</div>
								</div>

								<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
									<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface shadow-xs">
										<TextField
											variant="outlined"
											label="Tên phòng máy"
											value={roomForm.name}
											onChange={(val) => onRoomFormFieldChange("name", val)}
											placeholder="Ví dụ: PM 01 hoặc Phòng máy A"
											required
											fullWidth
										/>
									</div>

									<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface shadow-xs">
										<div className="mb-3 flex items-center gap-2">
											<Icon
												name="build"
												className="text-base text-m3-primary"
											/>
											<h5 className="text-sm font-bold text-m3-on-surface">
												Cấu hình thiết bị
											</h5>
										</div>
										<div className="grid gap-3 sm:grid-cols-3">
											<TextField
												variant="outlined"
												label="Số máy HS"
												type="number"
												min="0"
												value={roomForm.studentMachineCount}
												onChange={(val) =>
													onRoomFormFieldChange("studentMachineCount", val)
												}
												required
												fullWidth
											/>
											<TextField
												variant="outlined"
												label="Số máy GV"
												type="number"
												min="0"
												value={roomForm.teacherMachineCount}
												onChange={(val) =>
													onRoomFormFieldChange("teacherMachineCount", val)
												}
												required
												fullWidth
											/>
											<TextField
												variant="outlined"
												label="Máy lỗi"
												type="number"
												min="0"
												value={roomForm.brokenMachineCount}
												onChange={(val) =>
													onRoomFormFieldChange("brokenMachineCount", val)
												}
												required
												fullWidth
											/>
										</div>

										<div className="mt-3">
											<TextField
												variant="outlined"
												label="Chi tiết máy hỏng (nhập tay)"
												type="textarea"
												rows={3}
												autoResize
												value={roomForm.brokenMachinesDetail}
												onChange={(val) =>
													onRoomFormFieldChange("brokenMachinesDetail", val)
												}
												placeholder="Ví dụ: PC 32 hỏng màn hình, PC 15 mất chuột..."
												supportingText="Mô tả cụ thể từng máy hỏng — không ảnh hưởng tới số lượng máy lỗi ở trên."
												fullWidth
											/>
										</div>
									</div>

									<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface shadow-xs">
										<div className="mb-3 flex items-center gap-2">
											<Icon
												name="auto_awesome"
												className="text-base text-m3-primary"
											/>
											<h5 className="text-sm font-bold text-m3-on-surface">
												Tình trạng trước giờ học
											</h5>
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<TextField
												variant="outlined"
												label="Tình trạng NetSupport"
												value={roomForm.netSupportStatus}
												onChange={(val) =>
													onRoomFormFieldChange("netSupportStatus", val)
												}
												fullWidth
											/>
											<TextField
												variant="outlined"
												label="Tình trạng loa, âm ly"
												value={roomForm.audioStatus}
												onChange={(val) =>
													onRoomFormFieldChange("audioStatus", val)
												}
												fullWidth
											/>
											<TextField
												variant="outlined"
												label="Tình trạng máy lạnh, quạt"
												value={roomForm.coolingStatus}
												onChange={(val) =>
													onRoomFormFieldChange("coolingStatus", val)
												}
												fullWidth
											/>
											<TextField
												variant="outlined"
												label="HS vệ sinh phòng máy"
												value={roomForm.roomHygieneStatus}
												onChange={(val) =>
													onRoomFormFieldChange("roomHygieneStatus", val)
												}
												fullWidth
											/>
										</div>
									</div>

									<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface shadow-xs">
										<div className="mb-3 flex items-center gap-2">
											<Icon
												name="power_settings_new"
												className="text-base text-m3-primary"
											/>
											<h5 className="text-sm font-bold text-m3-on-surface">
												Tình trạng sau giờ học
											</h5>
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<TextField
												variant="outlined"
												label="Đã tắt thiết bị điện"
												value={roomForm.devicesPoweredOffStatus}
												onChange={(val) =>
													onRoomFormFieldChange("devicesPoweredOffStatus", val)
												}
												fullWidth
											/>
											<TextField
												variant="outlined"
												label="HS xếp ghế gọn gàng"
												value={roomForm.seatingOrderStatus}
												onChange={(val) =>
													onRoomFormFieldChange("seatingOrderStatus", val)
												}
												fullWidth
											/>
										</div>

										{editingRoomId && (
											<div className="mt-3">
												<Checkbox
													checked={roomForm.isActive}
													onCheckedChange={(checked) =>
														onRoomFormFieldChange("isActive", checked)
													}
													label="Phòng đang hoạt động"
												/>
											</div>
										)}
									</div>
								</div>

								<div className="shrink-0 border-t border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3 sm:px-6">
									<div className="flex flex-wrap justify-end gap-2">
										{editingRoomId && (
											<Button
												type="button"
												colorStyle="outlined"
												size="sm"
												onClick={() => onResetForm(roomManagerSchoolId)}
											>
												Hủy sửa
											</Button>
										)}
										<Button
											type="submit"
											colorStyle="filled"
											size="sm"
											disabled={roomSubmitting}
											loading={roomSubmitting}
											icon={
												<Icon
													name={editingRoomId ? "edit" : "add"}
													className="text-sm"
												/>
											}
										>
											{editingRoomId ? "Lưu phòng máy" : "Tạo phòng máy"}
										</Button>
									</div>
								</div>
							</form>
						</div>
					</div>

					{/* Modal Footer */}
					<DialogFooter className="mt-0 flex shrink-0 items-center justify-end border-t border-m3-outline-variant/60 bg-m3-surface-container-high px-6 py-3">
						<Button
							type="button"
							colorStyle="text"
							onClick={() => handleSafeClose(onClose)}
						>
							Đóng
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
