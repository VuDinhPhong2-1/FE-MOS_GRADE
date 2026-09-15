import {
	Button,
	Checkbox,
	DatePicker,
	DatePickerDialog,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	IconButton,
	Select,
	type SelectOption,
	TextField,
	useDatePickerState,
} from "@bug-on/m3-expressive";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	DialogHeaderIcon,
	TimePickerDialogModal,
	useUnsavedChangesGuard,
} from "../../components/common";
import type { Class } from "../../types/class.types";
import type { ComputerRoom } from "../../types/computer-room.types";
import type { ScheduleItem } from "../../types/schedule.types";
import type { School } from "../../types/school.types";
import type { ScheduleFormState } from "./types";
import { formatDateViFromYmd, toYmd } from "./utils";

interface ScheduleFormModalProps {
	open: boolean;
	editing: ScheduleItem | null;
	form: ScheduleFormState;
	schools: School[];
	classesBySelectedSchool: Class[];
	computerRooms: ComputerRoom[];
	computerRoomsLoading: boolean;
	onClose: () => void;
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	onFormChange: <K extends keyof ScheduleFormState>(
		field: K,
		value: ScheduleFormState[K],
	) => void;
	onSchoolChange: (schoolId: string) => void;
	onClassChange: (classId: string, className: string, schoolId: string) => void;
	onRoomChange: (roomId: string, roomName: string) => void;
}

export const ScheduleFormModal = ({
	open,
	editing,
	form,
	schools,
	classesBySelectedSchool,
	computerRooms,
	computerRoomsLoading,
	onClose,
	onSubmit,
	onFormChange,
	onSchoolChange,
	onClassChange,
	onRoomChange,
}: ScheduleFormModalProps) => {
	// State for Date Picker dialog
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const initialDateMs = useMemo(() => {
		if (form.date) {
			const parsed = new Date(`${form.date}T00:00:00`).getTime();
			if (!Number.isNaN(parsed)) return parsed;
		}
		return null;
	}, [form.date]);

	const datePickerState = useDatePickerState({
		initialSelectedDateMs: initialDateMs,
	});

	const handleConfirmDate = useCallback(() => {
		if (datePickerState.selectedDateMs) {
			const ymd = toYmd(new Date(datePickerState.selectedDateMs));
			onFormChange("date", ymd);
		}
		setDatePickerOpen(false);
	}, [datePickerState.selectedDateMs, onFormChange]);

	// State for Start & End Time Picker dialogs
	const [startTimePickerOpen, setStartTimePickerOpen] = useState(false);
	const [endTimePickerOpen, setEndTimePickerOpen] = useState(false);

	// Select Options memoization
	const schoolOptions = useMemo<SelectOption[]>(() => {
		return schools.map((school) => ({
			label: school.name,
			value: school.id,
		}));
	}, [schools]);

	const classOptions = useMemo<SelectOption[]>(() => {
		return classesBySelectedSchool.map((c) => ({
			label: c.name,
			value: c.id,
			supportingText: `Trường: ${schools.find((s) => s.id === c.schoolId)?.name || ""}`,
		}));
	}, [classesBySelectedSchool, schools]);

	const roomOptions = useMemo<SelectOption[]>(() => {
		return [
			{
				label: "Không dùng phòng cấu hình (nhập thủ công)",
				value: "",
			},
			...computerRooms.map((room) => ({
				label: room.name,
				value: room.id,
				supportingText: `${room.totalMachinesText} · Lỗi: ${room.brokenMachineCount}`,
			})),
		];
	}, [computerRooms]);

	const [initialForm, setInitialForm] = useState<ScheduleFormState>(form);
	const prevOpenRef = useRef(open);

	useEffect(() => {
		if (open && !prevOpenRef.current) {
			setInitialForm(form);
		}
		prevOpenRef.current = open;
	}, [open, form]);

	const isDirty = useMemo(() => {
		return (
			form.schoolId !== initialForm.schoolId ||
			form.classId !== initialForm.classId ||
			form.className !== initialForm.className ||
			form.subject !== initialForm.subject ||
			form.date !== initialForm.date ||
			form.startTime !== initialForm.startTime ||
			form.endTime !== initialForm.endTime ||
			form.roomId !== initialForm.roomId ||
			form.roomName !== initialForm.roomName ||
			form.isActive !== initialForm.isActive
		);
	}, [form, initialForm]);

	const { handleSafeClose } = useUnsavedChangesGuard({
		isDirty,
		isOpen: open,
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
					className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
				>
					{/* Modal Header */}
					<div className="flex items-center justify-between px-6 pt-5 pb-3">
						<DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
							<DialogHeaderIcon icon="calendar_month" />
							<div>
								<DialogTitle className="text-lg font-bold text-m3-on-surface font-md3-expressive">
									{editing ? "Chỉnh sửa lịch dạy" : "Tạo lịch dạy mới"}
								</DialogTitle>
								<DialogDescription className="text-xs text-m3-on-surface-variant">
									{editing
										? "Cập nhật thông tin cho buổi dạy này."
										: "Điền thông tin để thêm một buổi dạy vào tuần."}
								</DialogDescription>
							</div>
						</DialogHeader>
					</div>

					<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
						<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
							{/* Nhóm: Trường & Lớp học */}
							<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface">
								<div className="mb-3 flex items-center gap-2">
									<Icon name="domain" className="text-base text-m3-primary" />
									<h4 className="text-sm font-bold text-m3-on-surface">
										Trường &amp; lớp học
									</h4>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<Select
										variant="outlined"
										label="Trường học"
										options={schoolOptions}
										value={form.schoolId}
										onChange={(val) => onSchoolChange(val)}
										searchable
										placeholder="Chọn trường"
										required
									/>

									<Select
										variant="outlined"
										label="Lớp có sẵn"
										options={classOptions}
										value={form.classId}
										onChange={(val) => {
											const matched = classesBySelectedSchool.find(
												(c) => c.id === val,
											);
											onClassChange(
												val,
												matched?.name || form.className,
												matched?.schoolId || form.schoolId,
											);
										}}
										searchable
										placeholder="Chọn lớp"
										disabled={!form.schoolId}
										supportingText={
											!form.schoolId ? "Vui lòng chọn trường trước" : undefined
										}
									/>

									<div className="sm:col-span-2">
										<TextField
											variant="outlined"
											label="Tên lớp hiển thị"
											value={form.className}
											onChange={(val) => onFormChange("className", val)}
											placeholder="Ví dụ: 11A11"
											required
											fullWidth
										/>
									</div>
								</div>
							</div>

							{/* Nhóm: Môn học & phòng */}
							<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface">
								<div className="mb-3 flex items-center gap-2">
									<Icon
										name="desktop_windows"
										className="text-base text-m3-primary"
									/>
									<h4 className="text-sm font-bold text-m3-on-surface">
										Môn học &amp; phòng dạy
									</h4>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<TextField
										variant="outlined"
										label="Môn học"
										value={form.subject}
										onChange={(val) => onFormChange("subject", val)}
										placeholder="Ví dụ: Tin học"
										required
										fullWidth
									/>

									<TextField
										variant="outlined"
										label="Tiết mấy"
										value={form.periodLabel}
										onChange={(val) => onFormChange("periodLabel", val)}
										placeholder="Ví dụ: Tiết 1-2"
										fullWidth
									/>

									<Select
										variant="outlined"
										label="Phòng máy cấu hình sẵn"
										options={roomOptions}
										value={form.roomId}
										onChange={(val) => {
											const matched = computerRooms.find((r) => r.id === val);
											onRoomChange(val, matched?.name || form.roomName);
										}}
										searchable
										loading={computerRoomsLoading}
										placeholder="Chọn phòng máy"
										disabled={!form.schoolId || computerRoomsLoading}
									/>

									<TextField
										variant="outlined"
										label="Phòng học / phòng máy"
										value={form.roomName}
										onChange={(val) => {
											onFormChange("roomName", val);
											if (form.roomId) {
												onFormChange("roomId", "");
											}
										}}
										placeholder={
											form.roomId
												? "Đã lấy theo phòng cấu hình"
												: "Ví dụ: P.Máy 03"
										}
										disabled={Boolean(form.roomId)}
										supportingText={
											form.roomId
												? "Đã liên kết phòng máy từ danh mục"
												: undefined
										}
										fullWidth
									/>
								</div>
							</div>

							{/* Nhóm: Thời gian */}
							<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface">
								<div className="mb-3 flex items-center gap-2">
									<Icon name="schedule" className="text-base text-m3-primary" />
									<h4 className="text-sm font-bold text-m3-on-surface">
										Thời gian
									</h4>
								</div>
								<div className="grid gap-3 sm:grid-cols-3">
									{/* Ngày dạy */}
									<TextField
										variant="outlined"
										label="Ngày dạy"
										value={form.date ? formatDateViFromYmd(form.date) : ""}
										readOnly
										required
										fullWidth
										className="cursor-pointer"
										onFocus={(e) => {
											e.target.blur();
											setDatePickerOpen(true);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setDatePickerOpen(true);
											}
										}}
										leadingIcon={
											<Icon name="calendar_today" className="text-base" />
										}
										trailingIconMode="custom"
										trailingIcon={
											<IconButton
												type="button"
												aria-label="Chọn ngày dạy"
												size="xs"
												colorStyle="standard"
												onClick={() => setDatePickerOpen(true)}
											>
												<Icon name="edit_calendar" className="text-sm" />
											</IconButton>
										}
									/>

									{/* Giờ bắt đầu */}
									<TextField
										variant="outlined"
										label="Giờ bắt đầu"
										value={form.startTime}
										readOnly
										required
										fullWidth
										className="cursor-pointer"
										onFocus={(e) => {
											e.target.blur();
											setStartTimePickerOpen(true);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setStartTimePickerOpen(true);
											}
										}}
										leadingIcon={<Icon name="schedule" className="text-base" />}
										trailingIconMode="custom"
										trailingIcon={
											<IconButton
												type="button"
												aria-label="Chọn giờ bắt đầu"
												size="xs"
												colorStyle="standard"
												onClick={() => setStartTimePickerOpen(true)}
											>
												<Icon name="more_time" className="text-sm" />
											</IconButton>
										}
									/>

									{/* Giờ kết thúc */}
									<TextField
										variant="outlined"
										label="Giờ kết thúc"
										value={form.endTime}
										readOnly
										required
										fullWidth
										className="cursor-pointer"
										onFocus={(e) => {
											e.target.blur();
											setEndTimePickerOpen(true);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setEndTimePickerOpen(true);
											}
										}}
										leadingIcon={<Icon name="alarm_on" className="text-base" />}
										trailingIconMode="custom"
										trailingIcon={
											<IconButton
												type="button"
												aria-label="Chọn giờ kết thúc"
												size="xs"
												colorStyle="standard"
												onClick={() => setEndTimePickerOpen(true)}
											>
												<Icon name="more_time" className="text-sm" />
											</IconButton>
										}
									/>
								</div>
							</div>

							{/* Nhóm: Ghi chú & trạng thái */}
							<div className="rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface">
								<div className="mb-3 flex items-center gap-2">
									<Icon name="chat" className="text-base text-m3-primary" />
									<h4 className="text-sm font-bold text-m3-on-surface">
										Ghi chú
									</h4>
								</div>
								<TextField
									variant="outlined"
									label="Ghi chú thêm"
									type="textarea"
									rows={3}
									autoResize
									value={form.notes}
									onChange={(val) => onFormChange("notes", val)}
									placeholder="Ghi chú thêm về buổi học..."
									fullWidth
								/>

								{editing && (
									<div className="mt-3">
										<Checkbox
											checked={form.isActive}
											onCheckedChange={(checked) =>
												onFormChange("isActive", checked)
											}
											label="Lịch đang hoạt động"
										/>
									</div>
								)}
							</div>
						</div>

						{/* Modal Footer */}
						<DialogFooter className="gap-2 border-t border-m3-outline-variant/60 px-6 py-3 mt-0">
							<Button
								type="button"
								colorStyle="text"
								onClick={() => handleSafeClose(onClose)}
							>
								Hủy
							</Button>
							<Button type="submit" colorStyle="filled">
								{editing ? "Lưu cập nhật" : "Tạo lịch"}
							</Button>
						</DialogFooter>
					</form>

					{/* Modal Date Picker Dialog */}
					<DatePickerDialog
						open={datePickerOpen}
						onDismiss={() => setDatePickerOpen(false)}
						title="Chọn ngày dạy"
						className="w-[calc(100vw-2rem)]! sm:w-100! max-w-md!"
						confirmButton={
							<Button
								type="button"
								colorStyle="filled"
								size="sm"
								onClick={handleConfirmDate}
							>
								Xác nhận
							</Button>
						}
						dismissButton={
							<Button
								type="button"
								colorStyle="text"
								size="sm"
								onClick={() => setDatePickerOpen(false)}
							>
								Hủy
							</Button>
						}
					>
						<DatePicker
							state={datePickerState}
							className="w-full! max-w-none!"
						/>
					</DatePickerDialog>

					{/* Modal Start Time Picker Dialog */}
					<TimePickerDialogModal
						open={startTimePickerOpen}
						onDismiss={() => setStartTimePickerOpen(false)}
						label="giờ bắt đầu"
						value={form.startTime}
						onConfirm={(val) => onFormChange("startTime", val)}
					/>

					{/* Modal End Time Picker Dialog */}
					<TimePickerDialogModal
						open={endTimePickerOpen}
						onDismiss={() => setEndTimePickerOpen(false)}
						label="giờ kết thúc"
						value={form.endTime}
						onConfirm={(val) => onFormChange("endTime", val)}
					/>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
