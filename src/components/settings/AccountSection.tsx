import {
	Button,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	ShapeMedia,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import { notify } from "../../utils/notify";

interface ProfileFormState {
	fullName: string;
	phoneNumber: string;
	avatar: string;
}

export const AccountSection = () => {
	const { user, getAccessToken, updateUser, logout } = useAuth();
	const navigate = useNavigate();

	const [form, setForm] = useState<ProfileFormState>({
		fullName: "",
		phoneNumber: "",
		avatar: "",
	});
	const [saving, setSaving] = useState(false);
	const [confirmLogout, setConfirmLogout] = useState(false);

	useEffect(() => {
		if (!user) return;
		setForm({
			fullName: user.fullName || "",
			phoneNumber: user.phoneNumber || "",
			avatar: user.avatar || "",
		});
	}, [user]);

	if (!user) return null;

	const handleLogout = () => {
		logout();
		navigate("/login", { replace: true });
		notify.success("Đã đăng xuất thành công");
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (saving) return;

		try {
			setSaving(true);
			const updated = await authService.updateCurrentUserProfile(
				{
					fullName: form.fullName,
					phoneNumber: form.phoneNumber,
					avatar: form.avatar,
				},
				getAccessToken,
			);

			updateUser({
				fullName: updated.fullName,
				phoneNumber: updated.phoneNumber,
				avatar: updated.avatar,
			});

			notify.success("Cập nhật thông tin tài khoản thành công");
		} catch (error) {
			notify.error(
				error instanceof Error
					? error.message
					: "Không thể cập nhật thông tin tài khoản",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="rounded-2xl bg-m3-surface-container p-6 space-y-6">
			{/* Section Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3.5 min-w-0">
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-m3-primary/10 text-m3-primary">
						<Icon name="person" size={22} />
					</div>
					<div className="space-y-0.5 min-w-0">
						<Text variant="title-md" className="font-bold text-m3-on-surface">
							Thông Tin Tài Khoản
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							Quản lý danh tính hồ sơ cá nhân và phiên đăng nhập hiện tại của
							bạn.
						</Text>
					</div>
				</div>
			</div>

			{/* Avatar & User Summary Card */}
			<div className="flex items-center gap-4 rounded-xl bg-m3-surface p-4 text-m3-on-surface">
				<ShapeMedia
					shape="cookie12Sided"
					morphOn="hover"
					morphTo="puffyDiamond"
					className="relative size-18 shrink-0"
				>
					{form.avatar ? (
						<img
							src={form.avatar}
							alt={form.fullName || user.username}
							className="h-full w-full object-cover"
							onError={(e) => {
								(e.currentTarget as HTMLElement).style.display = "none";
							}}
						/>
					) : (
						<div className="grid h-full w-full place-items-center text-m3-primary">
							<Icon name="account_circle" size={48} />
						</div>
					)}
				</ShapeMedia>
				<div className="min-w-0 flex-1 space-y-1">
					<div className="truncate text-base font-bold text-m3-on-surface">
						{form.fullName || user.fullName || user.username}
					</div>
					<div className="truncate text-xs text-m3-on-surface-variant font-mono">
						{user.email || "Chưa thiết lập email"}
					</div>
					<div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-m3-primary/12 px-2.5 py-0.5 text-xs font-semibold text-m3-primary">
						<Icon name="verified_user" size={14} />
						<span>{user.role || "Người dùng"}</span>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<TextField
						variant="outlined"
						label="Tên đăng nhập"
						readOnly
						fullWidth
						value={user.username}
						supportingText="Định danh tài khoản không thể thay đổi"
						leadingIcon={<Icon name="person" />}
					/>

					<TextField
						variant="outlined"
						label="Thư điện tử (Email)"
						readOnly
						fullWidth
						value={user.email || ""}
						supportingText="Địa chỉ thư điện tử xác thực"
						leadingIcon={<Icon name="mail" />}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<TextField
						variant="outlined"
						label="Họ và tên"
						placeholder="Ví dụ: Vũ Đình Phong"
						fullWidth
						maxLength={120}
						value={form.fullName}
						onChange={(value: string) =>
							setForm((prev) => ({ ...prev, fullName: value }))
						}
						leadingIcon={<Icon name="badge" />}
					/>

					<TextField
						variant="outlined"
						type="tel"
						label="Số điện thoại"
						placeholder="Ví dụ: 0909xxxxxx"
						fullWidth
						maxLength={25}
						value={form.phoneNumber}
						onChange={(value: string) =>
							setForm((prev) => ({ ...prev, phoneNumber: value }))
						}
						leadingIcon={<Icon name="call" />}
					/>
				</div>

				<TextField
					variant="outlined"
					label="Ảnh đại diện (URL)"
					placeholder="https://..."
					fullWidth
					maxLength={500}
					value={form.avatar}
					onChange={(value: string) =>
						setForm((prev) => ({ ...prev, avatar: value }))
					}
					leadingIcon={<Icon name="image" />}
				/>

				{/* Footer Controls */}
				<div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-m3-outline-variant/30">
					<Button
						type="button"
						colorStyle="text"
						size="sm"
						onClick={() => setConfirmLogout(true)}
						icon={<Icon name="logout" className="text-base" />}
						className="text-m3-error hover:bg-m3-error/8 active:bg-m3-error/12"
					>
						Đăng xuất
					</Button>

					<Button
						type="submit"
						colorStyle="filled"
						size="md"
						loading={saving}
						loadingVariant="circular"
						disabled={saving}
						icon={<Icon name="save" className="text-base" />}
					>
						Lưu thay đổi hồ sơ
					</Button>
				</div>
			</form>

			{/* Dialog xác nhận Đăng xuất */}
			<Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
				<DialogPortal open={confirmLogout}>
					<DialogOverlay />
					<DialogContent
						hideCloseButton
						className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-6 text-m3-on-surface shadow-2xl z-50"
					>
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-3.5">
								<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-m3-error-container text-m3-on-error-container">
									<Icon name="logout" size={24} />
								</div>
								<div className="min-w-0 flex-1">
									<DialogTitle className="text-lg font-bold text-m3-on-surface leading-snug">
										Xác nhận đăng xuất
									</DialogTitle>
									<DialogDescription className="text-xs text-m3-on-surface-variant">
										Kết thúc phiên làm việc hiện tại
									</DialogDescription>
								</div>
							</div>

							<DialogBody className="p-0 text-sm leading-relaxed text-m3-on-surface-variant">
								Bạn có chắc chắn muốn đăng xuất khỏi hệ thống MOS Grader Pro
								không? Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng các tính
								năng.
							</DialogBody>

							<DialogFooter className="mt-2 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 pt-4">
								<Button
									colorStyle="text"
									type="button"
									onClick={() => setConfirmLogout(false)}
								>
									Hủy
								</Button>
								<Button
									colorStyle="filled"
									type="button"
									onClick={handleLogout}
									className="bg-m3-error text-m3-on-error hover:bg-m3-error/90 shadow-xs"
									icon={<Icon name="logout" className="text-base" />}
								>
									Đăng xuất
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</DialogPortal>
			</Dialog>
		</div>
	);
};

export default AccountSection;
