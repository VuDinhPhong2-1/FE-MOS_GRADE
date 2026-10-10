import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	Text,
} from "@bug-on/m3-expressive";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import type { UserSession } from "../../types/auth.types";
import { notify } from "../../utils/notify";

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("vi-VN", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));

type PendingConfirmation =
	| { type: "session"; session: UserSession }
	| { type: "others" }
	| null;

export const DeviceSessionsSection = () => {
	const { getAccessToken } = useAuth();
	const [sessions, setSessions] = useState<UserSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [busySessionId, setBusySessionId] = useState<string | null>(null);
	const [revokingOthers, setRevokingOthers] = useState(false);
	const [pendingConfirmation, setPendingConfirmation] =
		useState<PendingConfirmation>(null);

	const loadSessions = useCallback(async () => {
		try {
			setLoading(true);
			setSessions(await authService.getSessions(getAccessToken));
		} catch (error) {
			notify.error(
				error instanceof Error
					? error.message
					: "Không thể tải thiết bị đăng nhập",
			);
		} finally {
			setLoading(false);
		}
	}, [getAccessToken]);

	useEffect(() => {
		void loadSessions();
	}, [loadSessions]);

	const revokeSession = async (session: UserSession) => {
		try {
			setBusySessionId(session.sessionId);
			await authService.revokeSession(session.sessionId, getAccessToken);
			setSessions((current) =>
				current.filter((item) => item.sessionId !== session.sessionId),
			);
			notify.success("Đã đăng xuất thiết bị");
		} catch (error) {
			notify.error(
				error instanceof Error ? error.message : "Không thể đăng xuất thiết bị",
			);
		} finally {
			setBusySessionId(null);
		}
	};

	const revokeOthers = async () => {
		try {
			setRevokingOthers(true);
			const count = await authService.revokeOtherSessions(getAccessToken);
			setSessions((current) => current.filter((session) => session.isCurrent));
			notify.success(
				count
					? `Đã đăng xuất ${count} thiết bị khác`
					: "Không có thiết bị khác đang đăng nhập",
			);
		} catch (error) {
			notify.error(
				error instanceof Error
					? error.message
					: "Không thể đăng xuất các thiết bị khác",
			);
		} finally {
			setRevokingOthers(false);
		}
	};

	const isConfirmationBusy = busySessionId !== null || revokingOthers;
	const confirmLogout = async () => {
		if (!pendingConfirmation || isConfirmationBusy) return;
		const confirmation = pendingConfirmation;
		try {
			if (confirmation.type === "session") {
				await revokeSession(confirmation.session);
			} else {
				await revokeOthers();
			}
		} finally {
			setPendingConfirmation(null);
		}
	};
	const closeConfirmation = () => {
		if (!isConfirmationBusy) setPendingConfirmation(null);
	};

	const otherSessionCount = sessions.filter(
		(session) => !session.isCurrent,
	).length;

	return (
		<section className="rounded-2xl bg-m3-surface-container p-6 space-y-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex items-start gap-3.5">
					<div className="grid size-11 place-items-center rounded-full bg-m3-secondary-container text-m3-on-secondary-container">
						<Icon name="devices" size={22} />
					</div>
					<div className="space-y-0.5">
						<Text variant="title-md" className="font-bold text-m3-on-surface">
							Thiết bị đang đăng nhập
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							Quản lý các phiên đang hoạt động. IP có thể phản ánh VPN hoặc
							proxy.
						</Text>
					</div>
				</div>
				<Button
					colorStyle="outlined"
					size="sm"
					loading={revokingOthers}
					disabled={!otherSessionCount || revokingOthers}
					onClick={revokeOthers}
					icon={<Icon name="logout" size={18} />}
				>
					Đăng xuất thiết bị khác
				</Button>
			</div>

			{loading ? (
				<Text variant="body-sm" className="text-m3-on-surface-variant">
					Đang tải thiết bị đăng nhập...
				</Text>
			) : sessions.length === 0 ? (
				<Text variant="body-sm" className="text-m3-on-surface-variant">
					Chưa có phiên đăng nhập hoạt động.
				</Text>
			) : (
				<div className="space-y-3">
					{sessions.map((session) => (
						<div
							key={session.sessionId}
							className="flex flex-wrap items-center gap-3 rounded-xl bg-m3-surface p-4"
						>
							<Icon
								name={session.isCurrent ? "laptop_mac" : "devices"}
								size={24}
								className="text-m3-primary"
							/>
							<div className="min-w-0 flex-1 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<Text
										variant="body-md"
										className="font-semibold text-m3-on-surface"
									>
										{session.deviceName}
									</Text>
									{session.isCurrent && (
										<span className="rounded-full bg-m3-primary/12 px-2 py-0.5 text-xs font-semibold text-m3-primary">
											Thiết bị này
										</span>
									)}
								</div>
								<Text variant="body-sm" className="text-m3-on-surface-variant">
									IP: {session.ipAddress || "Không xác định"} · Hoạt động:{" "}
									{formatDate(session.lastSeenAt)}
								</Text>
								<Text variant="body-sm" className="text-m3-on-surface-variant">
									Đăng nhập: {formatDate(session.createdAt)} · Hết hạn:{" "}
									{formatDate(session.expiresAt)}
								</Text>
							</div>
							{!session.isCurrent && (
								<Button
									colorStyle="text"
									size="sm"
									loading={busySessionId === session.sessionId}
									disabled={busySessionId !== null}
									onClick={() =>
										setPendingConfirmation({ type: "session", session })
									}
									className="text-m3-error"
								>
									Đăng xuất
								</Button>
							)}
						</div>
					))}
				</div>
			)}

			<Dialog
				open={pendingConfirmation !== null}
				onOpenChange={(open) => {
					if (!open) closeConfirmation();
				}}
			>
				<DialogPortal open={pendingConfirmation !== null}>
					<DialogOverlay />
					<DialogContent
						hideCloseButton
						className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-6 text-m3-on-surface shadow-2xl"
					>
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-m3-error-container text-m3-on-error-container">
									<Icon name="logout" size={22} />
								</div>
								<div className="min-w-0 flex-1">
									<DialogTitle className="text-lg font-bold text-m3-on-surface leading-snug">
										Xác nhận đăng xuất thiết bị
									</DialogTitle>
									<DialogDescription className="text-xs text-m3-on-surface-variant">
										Thiết bị đã đăng xuất sẽ phải đăng nhập lại.
									</DialogDescription>
								</div>
							</div>

							<Text
								variant="body-md"
								className="text-sm leading-relaxed text-m3-on-surface-variant"
							>
								{pendingConfirmation?.type === "session"
									? `Bạn có chắc muốn đăng xuất ${pendingConfirmation.session.deviceName}?`
									: "Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị khác?"}
							</Text>

							<DialogFooter className="mt-2 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 pt-4">
								<Button
									colorStyle="text"
									type="button"
									onClick={closeConfirmation}
									disabled={isConfirmationBusy}
								>
									Hủy
								</Button>
								<Button
									colorStyle="filled"
									type="button"
									onClick={() => void confirmLogout()}
									loading={isConfirmationBusy}
									disabled={isConfirmationBusy}
									className="bg-m3-error text-m3-on-error hover:bg-m3-error/90 shadow-xs"
								>
									Đăng xuất
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</DialogPortal>
			</Dialog>
		</section>
	);
};
