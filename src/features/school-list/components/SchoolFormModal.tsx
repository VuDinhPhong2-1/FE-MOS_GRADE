import {
	Button,
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
	ScrollArea,
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
} from "../../../components/common";
import type { CreateSchoolRequest, School } from "../../../types";
import { EMPTY_FORM, type SchoolFormModalProps } from "../types";

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

	const handleOpenSheet = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const sheetId = formData.attendanceSpreadsheetId?.trim();
			if (!sheetId) return;
			const url =
				sheetId.startsWith("http://") || sheetId.startsWith("https://")
					? sheetId
					: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
			window.open(url, "_blank", "noopener,noreferrer");
		},
		[formData.attendanceSpreadsheetId],
	);

	const handleOpenMap = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const address = formData.address?.trim();
			if (!address) return;
			window.open(
				`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
				"_blank",
				"noopener,noreferrer",
			);
		},
		[formData.address],
	);

	const handleCallPhone = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const phone = formData.phoneNumber?.trim();
			if (!phone) return;
			window.location.href = `tel:${phone}`;
		},
		[formData.phoneNumber],
	);

	const handleSendEmail = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const email = formData.email?.trim();
			if (!email) return;
			window.location.href = `mailto:${email}`;
		},
		[formData.email],
	);

	const handleOpenWebsite = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const website = formData.website?.trim();
			if (!website) return;
			const url =
				website.startsWith("http://") || website.startsWith("https://")
					? website
					: `https://${website}`;
			window.open(url, "_blank", "noopener,noreferrer");
		},
		[formData.website],
	);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const payload: CreateSchoolRequest = {
			...formData,
			name: formData.name.trim(),
			code: formData.code.trim(),
			address: formData.address?.trim() || "",
			phoneNumber: formData.phoneNumber?.trim() || "",
			email: formData.email?.trim() || "",
			website: formData.website?.trim() || "",
			description: formData.description?.trim() || "",
			attendanceSpreadsheetId: formData.attendanceSpreadsheetId?.trim() || "",
		};
		if (!isAdmin) {
			delete payload.attendanceSpreadsheetId;
		}
		await onSubmit(payload);
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

						<ScrollArea
							type="hover"
							orientation="vertical"
							className="flex-1 min-h-0"
							viewportClassName="px-6 pt-4 pb-6 pr-5"
						>
							<div className="flex flex-col gap-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
									/>
								</div>

								<TextField
									variant="outlined"
									label="ID Google Sheet"
									placeholder="Dán Spreadsheet ID hoặc link Google Sheet"
									disabled={isSubmitting || !isAdmin}
									fullWidth
									leadingIcon={<Icon name="table_chart" />}
									value={formData.attendanceSpreadsheetId || ""}
									onChange={handleFieldChange("attendanceSpreadsheetId")}
									trailingIconMode="custom"
									trailingIcon={
										<IconButton
											type="button"
											size="sm"
											colorStyle="standard"
											disabled={
												isSubmitting ||
												!isAdmin ||
												!formData.attendanceSpreadsheetId?.trim()
											}
											onClick={handleOpenSheet}
											title="Mở Google Sheet"
											aria-label="Mở Google Sheet"
										>
											<Icon name="open_in_new" size={18} />
										</IconButton>
									}
									supportingText={
										isAdmin
											? "Mỗi trường có 1 Google Sheet riêng. Lớp học mới tạo sẽ tự động kế thừa."
											: "Chỉ tài khoản Admin mới có quyền cập nhật Spreadsheet ID."
									}
								/>

								<TextField
									variant="outlined"
									label="Địa chỉ"
									placeholder="VD: Số 10 Thụy Khuê, Tây Hồ, Hà Nội"
									disabled={isSubmitting}
									fullWidth
									leadingIcon={<Icon name="location_on" />}
									value={formData.address || ""}
									onChange={handleFieldChange("address")}
									trailingIconMode="custom"
									trailingIcon={
										<IconButton
											type="button"
											size="sm"
											colorStyle="standard"
											disabled={isSubmitting || !formData.address?.trim()}
											onClick={handleOpenMap}
											title="Xem vị trí trên Google Maps"
											aria-label="Xem vị trí trên Google Maps"
										>
											<Icon name="open_in_new" size={18} />
										</IconButton>
									}
								/>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
										trailingIconMode="custom"
										trailingIcon={
											<IconButton
												type="button"
												size="sm"
												colorStyle="standard"
												disabled={isSubmitting || !formData.phoneNumber?.trim()}
												onClick={handleCallPhone}
												title="Gọi số điện thoại"
												aria-label="Gọi số điện thoại"
											>
												<Icon name="phone_in_talk" size={18} />
											</IconButton>
										}
									/>
									<TextField
										variant="outlined"
										type="email"
										label="Email"
										placeholder="VD: lienhe@cva.edu.vn"
										disabled={isSubmitting}
										fullWidth
										leadingIcon={<Icon name="mail" />}
										value={formData.email || ""}
										onChange={handleFieldChange("email")}
										trailingIconMode="custom"
										trailingIcon={
											<IconButton
												type="button"
												size="sm"
												colorStyle="standard"
												disabled={isSubmitting || !formData.email?.trim()}
												onClick={handleSendEmail}
												title="Gửi email"
												aria-label="Gửi email"
											>
												<Icon name="send" size={18} />
											</IconButton>
										}
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
									trailingIconMode="custom"
									trailingIcon={
										<IconButton
											type="button"
											size="sm"
											colorStyle="standard"
											disabled={isSubmitting || !formData.website?.trim()}
											onClick={handleOpenWebsite}
											title="Truy cập website"
											aria-label="Truy cập website"
										>
											<Icon name="open_in_new" size={18} />
										</IconButton>
									}
								/>

								<TextField
									variant="outlined"
									label="Mô tả ghi chú"
									placeholder="Thông tin ghi chú thêm về trường..."
									disabled={isSubmitting}
									fullWidth
									rows={4}
									leadingIcon={<Icon name="notes" />}
									value={formData.description || ""}
									onChange={handleFieldChange("description")}
								/>
							</div>
						</ScrollArea>

						{/* Modal Footer */}
						<DialogFooter className="mt-0 flex shrink-0 items-center justify-end gap-2.5 px-6 py-4">
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
