import { Button, Card, Icon, ShapeMedia, Text } from "@bug-on/m3-expressive";
import type React from "react";
import { useAuth } from "../context/AuthContext";

const AccountStatusPage: React.FC = () => {
	const { user, logout } = useAuth();
	const status =
		user?.teacherApprovalStatus ||
		(user?.role === "PendingTeacher" ? "Pending" : undefined);
	const isRejected = status === "Rejected";

	return (
		<div className="relative flex min-h-screen items-center justify-center bg-m3-surface p-4 text-m3-on-surface">
			{/* Background Decorative Blur Orbs */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div
					className="absolute -top-20 -right-20 h-96 w-96 rounded-full blur-3xl opacity-20"
					style={{ background: "var(--md-sys-color-primary)" }}
				/>
				<div
					className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full blur-3xl opacity-20"
					style={{
						background: isRejected
							? "var(--md-sys-color-error)"
							: "var(--md-sys-color-tertiary, #10b981)",
					}}
				/>
			</div>

			<Card
				variant="filled"
				disableElevation
				className="relative z-10 w-full max-w-lg p-8 text-center"
			>
				{/* Status Badge Icon */}
				<ShapeMedia
					morphOn="hover"
					morphTo="clover8Leaf"
					shape="clover4Leaf"
					className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
						isRejected
							? "bg-m3-error-container text-m3-on-error-container"
							: "bg-amber-500/15 text-amber-600 dark:text-amber-400"
					}`}
				>
					<Icon
						size={32}
						name={isRejected ? "gpp_bad" : "hourglass_top"}
						className="text-amber-600 dark:text-amber-400"
					/>
				</ShapeMedia>

				<h1 className="mt-6 text-2xl font-black tracking-tight text-m3-on-surface">
					{isRejected
						? "Yêu cầu giáo viên đã bị từ chối"
						: "Tài khoản đang chờ duyệt"}
				</h1>

				<Text variant="body-md" className="mt-2.5 text-sm leading-relaxed text-m3-on-surface-variant">
					{isRejected
						? "Tài khoản của bạn hiện chưa được cấp quyền giáo viên. Vui lòng liên hệ Admin nếu cần hỗ trợ xem xét lại."
						: "Tài khoản đã được khởi tạo thành công và đang chờ Quản trị viên phê duyệt quyền giáo viên. Bạn vẫn có thể đăng nhập để theo dõi trạng thái."}
				</Text>

				{user?.teacherApprovalNote && (
					<div className="mt-5 rounded-2xl bg-m3-surface-container-high p-4 text-left text-xs">
						<div className="flex items-center gap-1.5 font-bold text-m3-on-surface">
							<Icon name="feedback" className="text-base text-m3-primary" />
							<span>Ghi chú từ Quản trị viên</span>
						</div>
						<Text variant="body-sm" className="mt-1.5 whitespace-pre-wrap text-m3-on-surface-variant leading-relaxed">
							{user.teacherApprovalNote}
						</Text>
					</div>
				)}

				<div className="mt-6 space-y-2 rounded-2xl bg-m3-surface-container-low p-4 text-left text-xs text-m3-on-surface-variant">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-m3-on-surface">Họ và tên:</span>
						<span>{user?.fullName || user?.username}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="font-semibold text-m3-on-surface">
							Thư điện tử:
						</span>
						<span>{user?.email || "Chưa cập nhật"}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="font-semibold text-m3-on-surface">
							Trạng thái hiện tại:
						</span>
						<span
							className={`font-bold ${
								isRejected
									? "text-m3-error"
									: "text-amber-600 dark:text-amber-400"
							}`}
						>
							{status || "Đang chờ duyệt (Pending)"}
						</span>
					</div>
				</div>

				<div className="mt-8 flex justify-center">
					<Button
						colorStyle="filled"
						size="md"
						type="button"
						onClick={logout}
						icon={<Icon name="logout" size={20} />}
					>
						Đăng xuất
					</Button>
				</div>
			</Card>
		</div>
	);
};

export default AccountStatusPage;
