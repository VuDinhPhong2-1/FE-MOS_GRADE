import {
	Button,
	Checkbox,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	Select,
	type SelectOption,
	TextField,
} from "@bug-on/m3-expressive";
import { type FormEvent, memo, useEffect, useMemo, useState } from "react";
import { DialogHeaderIcon, showConfirm } from "../../components/common";
import studentService from "../../services/student.service";
import type {
	CompetencyLevel,
	StudentFormData,
	StudentModalProps,
} from "./types";
import { VALID_COMPETENCY_LEVELS, VALID_STATUSES } from "./types";

const defaultForm: StudentFormData = {
	middleName: "",
	firstName: "",
	status: "Active",
	competencyLevel: "",
	notes: "",
	thi: false,
	classId: "",
};

const STATUS_OPTIONS: SelectOption[] = [
	{ value: "Active", label: "Hoạt động" },
	{ value: "Inactive", label: "Ngừng hoạt động" },
];

const COMPETENCY_OPTIONS: SelectOption[] = [
	{ value: "", label: "Chưa đánh giá" },
	...VALID_COMPETENCY_LEVELS.map((level) => ({ value: level, label: level })),
];

const StudentModalComponent = ({
	isOpen,
	mode,
	student,
	classId,
	readOnly,
	getAccessToken,
	onClose,
	onSuccess,
}: StudentModalProps) => {
	const isEdit = mode ? mode === "edit" : Boolean(student);

	const [form, setForm] = useState<StudentFormData>(defaultForm);
	const [initialForm, setInitialForm] = useState<StudentFormData>(defaultForm);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!isOpen) return;

		if (isEdit && student) {
			const preset: StudentFormData = {
				middleName: student.middleName || "",
				firstName: student.firstName || "",
				status: VALID_STATUSES.includes(
					(student.status || "") as (typeof VALID_STATUSES)[number],
				)
					? (student.status as string)
					: student.isActive
						? "Active"
						: "Inactive",
				competencyLevel: (student.competencyLevel || "") as CompetencyLevel,
				notes: student.notes || "",
				thi: Boolean(student.thi),
				classId: student.classId || classId,
			};
			setForm(preset);
			setInitialForm(preset);
			setError("");
		} else {
			const preset: StudentFormData = {
				...defaultForm,
				classId,
			};
			setForm(preset);
			setInitialForm(preset);
			setError("");
		}
	}, [isOpen, isEdit, student, classId]);

	const hasUnsavedChanges = useMemo(() => {
		return (
			form.middleName !== initialForm.middleName ||
			form.firstName !== initialForm.firstName ||
			form.status !== initialForm.status ||
			form.competencyLevel !== initialForm.competencyLevel ||
			form.notes !== initialForm.notes ||
			form.thi !== initialForm.thi ||
			(isEdit && form.classId !== initialForm.classId)
		);
	}, [form, initialForm, isEdit]);

	useEffect(() => {
		if (!isOpen || !hasUnsavedChanges) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isOpen, hasUnsavedChanges]);

	const handleClose = async () => {
		if (isSubmitting) return;
		if (hasUnsavedChanges) {
			const confirmed = await showConfirm({
				title: "Thay đổi chưa lưu",
				message: "Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?",
				confirmLabel: "Đóng và bỏ thay đổi",
				cancelLabel: "Ở lại",
				variant: "destructive",
				icon: "warning",
			});
			if (!confirmed) return;
		}
		onClose();
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (isEdit && !student) return;

		if (readOnly) {
			setError("Bạn chỉ có quyền xem lớp này.");
			return;
		}

		const middleName = form.middleName.trim();
		const firstName = form.firstName.trim();
		const status = form.status.trim();

		if (!firstName) {
			setError("Vui lòng nhập tên.");
			return;
		}

		if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
			setError("Trạng thái không hợp lệ.");
			return;
		}

		if (
			form.competencyLevel &&
			!VALID_COMPETENCY_LEVELS.includes(form.competencyLevel)
		) {
			setError("Mức năng lực không hợp lệ.");
			return;
		}

		setIsSubmitting(true);
		setError("");
		try {
			const notes = form.notes.trim();
			if (isEdit && student) {
				await studentService.updateStudent(
					student.id,
					{
						middleName,
						firstName,
						status,
						competencyLevel: form.competencyLevel,
						notes,
						thi: form.thi,
						classId: form.classId || classId,
					},
					getAccessToken,
				);
				onSuccess("Cập nhật học sinh thành công.");
			} else {
				await studentService.createStudent(
					{
						middleName,
						firstName,
						status,
						competencyLevel: form.competencyLevel,
						notes,
						thi: form.thi,
						classId,
					},
					getAccessToken,
				);
				onSuccess("Thêm học sinh thành công.");
			}
			onClose();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: isEdit
						? "Cập nhật học sinh thất bại."
						: "Không thể thêm học sinh.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isDialogOpen = isOpen && (!isEdit || Boolean(student));

	return (
		<Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogPortal open={isDialogOpen}>
				<DialogOverlay />
				<DialogContent
					hideCloseButton
					className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl transform-gpu will-change-transform"
				>
					{/* Header */}
					<div className="flex items-center justify-between px-6 pt-5 pb-3">
						<DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
							<DialogHeaderIcon
								icon={isEdit ? "edit" : "person_add"}
								className={
									isEdit ? "bg-m3-secondary text-m3-on-secondary" : undefined
								}
							/>
							<div>
								<DialogTitle className="text-lg font-bold text-m3-on-surface">
									{isEdit ? "Sửa học sinh" : "Thêm học sinh"}
								</DialogTitle>
								<DialogDescription className="text-xs text-m3-on-surface-variant">
									{isEdit
										? "Cập nhật thông tin chi tiết học sinh"
										: "Nhập thông tin học sinh mới vào lớp học"}
								</DialogDescription>
							</div>
						</DialogHeader>
					</div>

					{/* Form */}
					<form
						onSubmit={handleSubmit}
						className="flex min-h-0 flex-1 flex-col"
					>
						<DialogBody className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
							{error && (
								<div className="flex items-center gap-2 rounded-2xl bg-m3-error-container p-3 text-xs font-medium text-m3-on-error-container">
									<Icon name="error" size={16} />
									<span>{error}</span>
								</div>
							)}

							<TextField
								variant="outlined"
								label="Họ và tên đệm"
								placeholder="VD: Nguyễn Văn"
								value={form.middleName}
								onChange={(val) => {
									if (error) setError("");
									setForm((prev) => ({ ...prev, middleName: val }));
								}}
								disabled={isSubmitting}
								fullWidth
								className="pt-2"
							/>

							<TextField
								required
								variant="outlined"
								label="Tên"
								placeholder="VD: An"
								value={form.firstName}
								onChange={(val) => {
									if (error) setError("");
									setForm((prev) => ({ ...prev, firstName: val }));
								}}
								disabled={isSubmitting}
								fullWidth
								className="pt-4"
							/>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Select
									variant="outlined"
									label="Trạng thái"
									options={STATUS_OPTIONS}
									value={form.status}
									onChange={(val) => {
										if (error) setError("");
										setForm((prev) => ({ ...prev, status: val }));
									}}
									disabled={isSubmitting}
									fullWidth
									menuVariant="expressive"
									showDividers={false}
									colorVariant="standard"
									className="pt-4"
								/>

								<Select
									variant="outlined"
									label="Xếp loại"
									options={COMPETENCY_OPTIONS}
									value={form.competencyLevel}
									onChange={(val) => {
										if (error) setError("");
										setForm((prev) => ({
											...prev,
											competencyLevel: val as CompetencyLevel,
										}));
									}}
									disabled={isSubmitting}
									fullWidth
									menuVariant="expressive"
									showDividers={false}
									colorVariant="vibrant"
									className="pt-4"
								/>
							</div>

							<Checkbox
								checked={form.thi}
								onCheckedChange={(checked) => {
									if (error) setError("");
									setForm((prev) => ({ ...prev, thi: checked }));
								}}
								disabled={isSubmitting}
								label="Học sinh dự thi"
							/>

							<TextField
								type="textarea"
								rows={3}
								variant="outlined"
								label="Ghi chú"
								placeholder="Nhận xét thêm về học sinh..."
								value={form.notes}
								onChange={(val) => {
									if (error) setError("");
									setForm((prev) => ({ ...prev, notes: val }));
								}}
								disabled={isSubmitting}
								maxLength={500}
								fullWidth
								className="pt-4"
							/>
						</DialogBody>

						<DialogFooter className="flex justify-end gap-2 border-t border-m3-outline-variant/40 px-6 py-4">
							<Button
								type="button"
								colorStyle="text"
								onClick={handleClose}
								disabled={isSubmitting}
							>
								Hủy
							</Button>
							<Button
								type="submit"
								colorStyle="filled"
								disabled={isSubmitting}
								loading={isSubmitting}
							>
								{isSubmitting
									? isEdit
										? "Đang lưu..."
										: "Đang thêm..."
									: isEdit
										? "Lưu"
										: "Thêm học sinh"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export const StudentModal = memo(StudentModalComponent);
