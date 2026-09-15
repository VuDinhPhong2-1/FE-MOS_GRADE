import {
	Button,
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
	TextField,
} from "@bug-on/m3-expressive";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	DialogHeaderIcon,
	useUnsavedChangesGuard,
} from "../../components/common";
import type { CreateSchoolRequest, School } from "../../types";
import { EMPTY_FORM, type SchoolFormModalProps } from "./types";

const getInitialFormData = (
	editingSchool: School | null,
): CreateSchoolRequest => {
	if (!editingSchool) return EMPTY_FORM;
	return {
		name: editingSchool.name,
		code: editingSchool.code || "",
		address: editingSchool.address || "",
		phoneNumber: editingSchool.phoneNumber || "",
		email: editingSchool.email || "",
		website: editingSchool.website || "",
		description: editingSchool.description || "",
		attendanceSpreadsheetId: editingSchool.attendanceSpreadsheetId || "",
	};
};

export const SchoolFormModal = ({
	open,
	isSubmitting,
	isAdmin,
	editingSchool,
	onClose,
	onSubmit,
}: SchoolFormModalProps) => {
	const [formData, setFormData] = useState<CreateSchoolRequest>(() =>
		getInitialFormData(editingSchool),
	);
	const [initialFormData, setInitialFormData] = useState<CreateSchoolRequest>(
		() => getInitialFormData(editingSchool),
	);

	useEffect(() => {
		if (open) {
			const initial = getInitialFormData(editingSchool);
			setFormData(initial);
			setInitialFormData(initial);
		}
	}, [open, editingSchool]);

	const isDirty = useMemo(() => {
		return (
			formData.name !== initialFormData.name ||
			formData.code !== initialFormData.code ||
			formData.address !== initialFormData.address ||
			formData.phoneNumber !== initialFormData.phoneNumber ||
			formData.email !== initialFormData.email ||
			formData.website !== initialFormData.website ||
			formData.description !== initialFormData.description ||
			formData.attendanceSpreadsheetId !==
				initialFormData.attendanceSpreadsheetId
		);
	}, [formData, initialFormData]);

	const { handleSafeClose } = useUnsavedChangesGuard({
		isDirty,
		isOpen: open,
		isSubmitting,
	});

	const handleFieldChange = useCallback(
		(field: keyof CreateSchoolRequest) => (value: string) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const payload: CreateSchoolRequest = { ...formData };
		if (!isAdmin) {
			delete payload.attendanceSpreadsheetId;
		}
		void onSubmit(payload);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => !isOpen && handleSafeClose(onClose)}
		>
			<DialogPortal open={open}>
				<DialogOverlay />
				<DialogContent
					hideCloseButton
					className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
				>
					<form
						onSubmit={handleSubmit}
						className="flex min-h-0 flex-1 flex-col"
					>
						{/* Modal Header */}
						<div className="flex items-center justify-between px-6 pt-5 pb-3">
							<DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
								<DialogHeaderIcon
									icon={editingSchool ? "edit_square" : "domain_add"}
								/>
								<div>
									<DialogTitle className="text-lg font-bold text-m3-on-surface">
										{editingSchool
											? "Chỉnh sửa trường học"
											: "Thêm trường học mới"}
									</DialogTitle>
									<DialogDescription className="text-xs text-m3-on-surface-variant">
										Nhập các thông tin cơ sở đào tạo vào hệ thống
									</DialogDescription>
								</div>
							</DialogHeader>
						</div>

						{/* Modal Body */}
						<DialogBody className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pt-4 pb-6 pr-5">
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
								<TextField
									variant="outlined"
									label="Tên trường"
									placeholder="VD: Trường THPT Chu Văn An"
									required
									disabled={isSubmitting}
									fullWidth
									leadingIcon={<Icon name="apartment" />}
									value={formData.name}
									onChange={handleFieldChange("name")}
									className="pt-4"
								/>

								<TextField
									variant="outlined"
									label="Mã trường"
									placeholder="VD: CVA-HN"
									required
									disabled={isSubmitting}
									fullWidth
									leadingIcon={<Icon name="tag" />}
									value={formData.code}
									onChange={handleFieldChange("code")}
									className="pt-4"
								/>
							</div>

							<div>
								<TextField
									variant="outlined"
									label="Spreadsheet ID Google Sheet (Điểm danh / Kết quả)"
									placeholder="Dán Spreadsheet ID hoặc link Google Sheet"
									disabled={isSubmitting || !isAdmin}
									fullWidth
									leadingIcon={<Icon name="table_chart" />}
									value={formData.attendanceSpreadsheetId || ""}
									onChange={handleFieldChange("attendanceSpreadsheetId")}
									supportingText={
										isAdmin
											? "Mỗi trường có 1 Google Sheet riêng. Lớp học mới tạo sẽ tự động kế thừa."
											: "Chỉ tài khoản Admin mới có quyền cập nhật Spreadsheet ID."
									}
									className="pt-4"
								/>
							</div>

							<TextField
								variant="outlined"
								label="Địa chỉ"
								placeholder="VD: Số 10 Thụy Khuê, Tây Hồ, Hà Nội"
								disabled={isSubmitting}
								fullWidth
								leadingIcon={<Icon name="location_on" />}
								value={formData.address || ""}
								onChange={handleFieldChange("address")}
								className="pt-4"
							/>

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
								<TextField
									variant="outlined"
									type="tel"
									label="Số điện thoại"
									placeholder="VD: 024-38234567"
									disabled={isSubmitting}
									fullWidth
									leadingIcon={<Icon name="call" />}
									value={formData.phoneNumber || ""}
									onChange={handleFieldChange("phoneNumber")}
									className="pt-4"
								/>
								<TextField
									variant="outlined"
									type="email"
									label="Email liên hệ"
									placeholder="VD: lienhe@cva.edu.vn"
									disabled={isSubmitting}
									fullWidth
									leadingIcon={<Icon name="mail" />}
									value={formData.email || ""}
									onChange={handleFieldChange("email")}
									className="pt-4"
								/>
							</div>

							<TextField
								variant="outlined"
								type="url"
								label="Website"
								placeholder="VD: https://thptchuvanan.edu.vn"
								disabled={isSubmitting}
								fullWidth
								leadingIcon={<Icon name="language" />}
								value={formData.website || ""}
								onChange={handleFieldChange("website")}
								className="pt-4"
							/>

							<TextField
								variant="outlined"
								label="Mô tả ghi chú"
								placeholder="Thông tin ghi chú thêm về trường..."
								disabled={isSubmitting}
								fullWidth
								leadingIcon={<Icon name="notes" />}
								value={formData.description || ""}
								onChange={handleFieldChange("description")}
								className="pt-4"
							/>
						</DialogBody>

						{/* Modal Footer */}
						<DialogFooter className="mt-0 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 px-6 py-4">
							<Button
								colorStyle="text"
								type="button"
								onClick={() => handleSafeClose(onClose)}
								disabled={isSubmitting}
							>
								Hủy
							</Button>
							<Button
								colorStyle="filled"
								type="submit"
								disabled={isSubmitting}
								loading={isSubmitting}
							>
								{editingSchool ? "Lưu thay đổi" : "Thêm trường"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
