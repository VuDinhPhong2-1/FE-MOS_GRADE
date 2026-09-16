import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Select,
	type SelectOption,
	TextField,
} from "@bug-on/m3-expressive";
import { useEffect, useMemo, useState } from "react";
import {
	DialogHeaderIcon,
	useUnsavedChangesGuard,
} from "../../../components/common";
import type { RoomFormModalProps } from "../types";

const CONDITION_OPTIONS: SelectOption[] = [
	{ label: "Tốt", value: "Tốt" },
	{ label: "Trung bình", value: "Trung bình" },
	{ label: "Kém", value: "Kém" },
];

const POWER_OFF_OPTIONS: SelectOption[] = [
	{ label: "Rồi", value: "Rồi" },
	{ label: "Chưa", value: "Chưa" },
];

export const RoomFormModal = ({
	open,
	isEditing,
	roomForm,
	roomFormMachinePreview,
	submitting,
	schools,
	onClose,
	onFieldChange,
	onSubmit,
}: RoomFormModalProps) => {
	// Snapshot initial state to check for unsaved changes
	const [initialSnapshot, setInitialSnapshot] = useState("");

	useEffect(() => {
		if (open) {
			setInitialSnapshot(JSON.stringify(roomForm));
		}
	}, [open, roomForm]);

	const isDirty = useMemo(() => {
		if (!open || !initialSnapshot) return false;
		return JSON.stringify(roomForm) !== initialSnapshot;
	}, [open, initialSnapshot, roomForm]);

	const { handleSafeClose } = useUnsavedChangesGuard({
		isDirty,
		isOpen: open,
		isSubmitting: submitting,
	});

	const schoolOptions = useMemo<SelectOption[]>(
		() => schools.map((s) => ({ label: s.name, value: s.id })),
		[schools],
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !submitting) {
					void handleSafeClose(onClose);
				}
			}}
		>
			<DialogPortal open={open}>
				<DialogOverlay />
				<DialogContent
					hideCloseButton
					className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
				>
					<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
						{/* Header */}
						<div className="flex shrink-0 items-center justify-between bg-m3-surface-container-high px-6 py-5">
							<div className="flex items-center gap-3">
								<DialogHeaderIcon
									icon={isEditing ? "edit_note" : "desktop_windows"}
								/>
								<div>
									<DialogTitle className="text-lg font-bold text-m3-on-surface font-md3-expressive">
										{isEditing ? "Chỉnh sửa phòng máy" : "Tạo phòng máy mới"}
									</DialogTitle>
									<DialogDescription className="text-xs text-m3-on-surface-variant">
										{isEditing
											? "Cập nhật cấu hình thiết bị và tình trạng vận hành của phòng."
											: "Khai báo thông số phòng máy chuẩn dùng cho lịch dạy và báo cáo."}
									</DialogDescription>
								</div>
							</div>
						</div>

						{/* Form Scroll Area */}
						<div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
							{/* Trường áp dụng nếu có nhiều hơn 1 trường */}
							{schools.length > 1 && (
								<div>
									<Select
										variant="outlined"
										label="Trường học áp dụng"
										options={schoolOptions}
										value={roomForm.schoolId}
										onChange={(val) => onFieldChange("schoolId", val)}
										searchable
										showDividers={false}
										disabled={isEditing}
									/>
								</div>
							)}

							{/* Tên phòng & Trạng thái hoạt động */}
							<div className="grid gap-4 sm:grid-cols-3 sm:items-center">
								<div className="sm:col-span-2">
									<TextField
										label="Tên phòng máy"
										placeholder="Ví dụ: Phòng máy 01"
										value={roomForm.name}
										onChange={(val) => onFieldChange("name", val)}
										required
										variant="outlined"
										className="w-full"
									/>
								</div>
								<div className="flex items-center gap-2 pt-2 sm:pt-0">
									<Checkbox
										id="room-is-active"
										checked={roomForm.isActive}
										onCheckedChange={(checked) =>
											onFieldChange("isActive", Boolean(checked))
										}
									/>
									<label
										htmlFor="room-is-active"
										className="text-xs font-semibold text-m3-on-surface cursor-pointer select-none"
									>
										Đang hoạt động
									</label>
								</div>
							</div>

							{/* Machine Preview Cards */}
							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-2xl bg-m3-surface-container p-3.5">
									<div className="text-[11px] font-semibold uppercase tracking-wider text-m3-primary">
										Tổng máy dự kiến
									</div>
									<div className="mt-1 text-2xl font-extrabold text-m3-primary">
										{roomFormMachinePreview.totalMachines}
									</div>
								</div>
								<div className="rounded-2xl bg-m3-surface-container p-3.5">
									<div className="text-[11px] font-semibold uppercase tracking-wider text-m3-secondary">
										Máy HS dùng được
									</div>
									<div className="mt-1 text-2xl font-extrabold text-m3-secondary">
										{roomFormMachinePreview.availableMachines}
									</div>
								</div>
							</div>

							{/* Thiết bị máy tính */}
							<div className="rounded-2xl bg-m3-surface-container p-4">
								<h5 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
									Số lượng máy móc
								</h5>
								<div className="mt-3 grid gap-3 sm:grid-cols-3">
									<TextField
										type="number"
										label="Máy học sinh"
										value={roomForm.studentMachineCount}
										onChange={(val) =>
											onFieldChange("studentMachineCount", val)
										}
										required
										variant="outlined"
									/>
									<TextField
										type="number"
										label="Máy giáo viên"
										value={roomForm.teacherMachineCount}
										onChange={(val) =>
											onFieldChange("teacherMachineCount", val)
										}
										required
										variant="outlined"
									/>
									<TextField
										type="number"
										label="Máy hỏng"
										value={roomForm.brokenMachineCount}
										onChange={(val) => onFieldChange("brokenMachineCount", val)}
										variant="outlined"
									/>
								</div>

								<div className="mt-3">
									<TextField
										label="Chi tiết máy hỏng (nếu có)"
										placeholder="Ví dụ: Máy 04 hỏng chuột, máy 12 lỗi nguồn..."
										value={roomForm.brokenMachinesDetail}
										onChange={(val) =>
											onFieldChange("brokenMachinesDetail", val)
										}
										variant="outlined"
									/>
								</div>
							</div>

							{/* Tình trạng cơ sở vật chất */}
							<div className="rounded-2xl bg-m3-surface-container p-4">
								<h5 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
									Cơ sở vật chất & Môi trường
								</h5>
								<div className="mt-3 grid gap-3 sm:grid-cols-2">
									<Select
										variant="outlined"
										label="Phần mềm NetSupport"
										options={CONDITION_OPTIONS}
										value={roomForm.netSupportStatus}
										onChange={(val) => onFieldChange("netSupportStatus", val)}
										showDividers={false}
									/>
									<Select
										variant="outlined"
										label="Hệ thống âm thanh"
										options={CONDITION_OPTIONS}
										value={roomForm.audioStatus}
										onChange={(val) => onFieldChange("audioStatus", val)}
										showDividers={false}
									/>
									<Select
										variant="outlined"
										label="Điều hòa / Làm mát"
										options={CONDITION_OPTIONS}
										value={roomForm.coolingStatus}
										onChange={(val) => onFieldChange("coolingStatus", val)}
										showDividers={false}
									/>
									<Select
										variant="outlined"
										label="Vệ sinh phòng máy"
										options={CONDITION_OPTIONS}
										value={roomForm.roomHygieneStatus}
										onChange={(val) => onFieldChange("roomHygieneStatus", val)}
										showDividers={false}
									/>
									<Select
										variant="outlined"
										label="Tắt điện thiết bị"
										options={POWER_OFF_OPTIONS}
										value={roomForm.devicesPoweredOffStatus}
										onChange={(val) =>
											onFieldChange("devicesPoweredOffStatus", val)
										}
										showDividers={false}
									/>
									<Select
										variant="outlined"
										label="Xếp ghế ngay ngắn"
										options={CONDITION_OPTIONS}
										value={roomForm.seatingOrderStatus}
										onChange={(val) => onFieldChange("seatingOrderStatus", val)}
										showDividers={false}
									/>
								</div>
							</div>
						</div>

						{/* Footer */}
						<DialogFooter className="gap-2 border-t border-m3-outline-variant/60 px-6 py-3 mt-0">
							<div className="flex items-center justify-end gap-2.5 w-full">
								<Button
									type="button"
									colorStyle="text"
									onClick={() => void handleSafeClose(onClose)}
									disabled={submitting}
								>
									Hủy
								</Button>
								<Button
									type="submit"
									colorStyle="filled"
									disabled={submitting}
									loading={submitting}
								>
									{isEditing ? "Lưu thay đổi" : "Tạo phòng máy"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
