import {
	Button,
	ButtonDistribute,
	Icon,
	ListItem,
	ProgressIndicator,
	ShapeMedia,
	TextField,
} from "@bug-on/m3-expressive";
import { memo, useCallback } from "react";
import { PermissionStatusBadge } from "./PermissionStatusBadge";
import { formatDateTime, type TeacherRequestCardProps } from "./types";

const getInitials = (name: string) => {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const TeacherRequestCard = memo(function TeacherRequestCard({
	request,
	decisionNote,
	isBusy,
	onNoteChange,
	onDecide,
	value,
	_listIndex,
}: TeacherRequestCardProps) {
	const status = request.teacherApprovalStatus || "Pending";
	const isPending = status === "Pending";
	const displayName = request.fullName || request.username || "Giáo viên";
	const initials = getInitials(displayName);

	const handleApprove = useCallback(
		(e?: React.MouseEvent) => {
			e?.stopPropagation();
			void onDecide(request, "approve");
		},
		[onDecide, request],
	);

	const handleReject = useCallback(
		(e?: React.MouseEvent) => {
			e?.stopPropagation();
			void onDecide(request, "reject");
		},
		[onDecide, request],
	);

	const handleNoteChange = useCallback(
		(value: string) => {
			onNoteChange(request.userId, value);
		},
		[onNoteChange, request.userId],
	);

	return (
		<ListItem
			value={value || request.userId}
			_listIndex={_listIndex}
			className="items-start! flex-wrap gap-4 transition-colors sm:flex-nowrap h-auto min-h-0"
			leadingType="custom"
			leadingContent={
				<ShapeMedia
					shape="cookie9Sided"
					className="grid size-11 shrink-0 place-items-center bg-m3-primary-container text-m3-on-primary-container font-bold text-sm tracking-wider select-none shadow-xs"
				>
					{initials}
				</ShapeMedia>
			}
			headline={
				<div className="min-w-0 flex-1 space-y-1.5 py-0.5 select-text text-left">
					<div className="flex flex-wrap items-center gap-2.5">
						<h4 className="text-base font-bold text-m3-on-surface">
							{displayName}
						</h4>
						<PermissionStatusBadge status={status} />
					</div>

					<p className="text-sm font-medium text-m3-on-surface-variant">
						{request.email || request.username}
					</p>

					<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-m3-on-surface-variant/80 pt-0.5">
						<span>
							Gửi yêu cầu: {formatDateTime(request.teacherApprovalRequestedAt)}
						</span>
						{request.teacherApprovalReviewedAt && (
							<span>
								Xử lý: {formatDateTime(request.teacherApprovalReviewedAt)} bởi{" "}
								{request.teacherApprovalReviewedBy || "Admin"}
							</span>
						)}
					</div>

					{request.teacherApprovalNote && (
						<p className="mt-2 rounded-xl bg-m3-surface-container-high/60 px-3.5 py-2 text-xs text-m3-on-surface-variant sm:text-sm">
							<strong className="font-semibold text-m3-on-surface">
								Ghi chú:
							</strong>{" "}
							{request.teacherApprovalNote}
						</p>
					)}
				</div>
			}
			trailingType="custom"
			trailingContent={
				isPending ? (
					<div className="w-full space-y-2.5 shrink-0 sm:w-80 select-text">
						<TextField
							type="textarea"
							variant="outlined"
							value={decisionNote}
							onChange={handleNoteChange}
							placeholder="Ghi chú khi từ chối (hoặc ghi chú nội bộ)..."
							disabled={isBusy}
							rows={2}
							autoResize
							fullWidth
							className="w-full"
						/>
						<ButtonDistribute mode="dynamic" className="w-full">
							<Button
								type="button"
								colorStyle="filled"
								size="sm"
								onClick={handleApprove}
								disabled={isBusy}
								className="justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
								icon={
									isBusy ? (
										<ProgressIndicator
											variant="circular"
											shape="wavy"
											showTrack
											size={16}
											aria-label="Đang duyệt"
										/>
									) : (
										<Icon name="check_circle" size={16} />
									)
								}
							>
								Duyệt
							</Button>
							<Button
								type="button"
								colorStyle="tonal"
								size="sm"
								onClick={handleReject}
								disabled={isBusy}
								className="justify-center text-m3-error bg-m3-error-container/40 hover:bg-m3-error-container"
								icon={
									isBusy ? (
										<ProgressIndicator
											variant="circular"
											shape="wavy"
											showTrack
											size={16}
											aria-label="Đang từ chối"
										/>
									) : (
										<Icon name="cancel" size={16} />
									)
								}
							>
								Từ chối
							</Button>
						</ButtonDistribute>
					</div>
				) : (
					<div className="grid size-10 shrink-0 place-items-center rounded-full bg-m3-surface-container-high text-m3-on-surface-variant">
						{status === "Approved" ? (
							<Icon
								name="check_circle"
								size={22}
								className="text-emerald-600 dark:text-emerald-400"
							/>
						) : (
							<Icon name="gpp_maybe" size={22} className="text-m3-error" />
						)}
					</div>
				)
			}
		/>
	);
});
