import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { LoadingIndicator } from "@bug-on/m3-expressive/feedback";
import { Text } from "@bug-on/m3-expressive/layout";
import type { PublicPortalClass } from "../../../types/submission-portal.types";
import { formatShortTime } from "../utils/formatters";

export interface LeaderboardLiveHeaderProps {
	lastUpdatedAt: Date | null;
	isRefreshing: boolean;
	loadingLeaderboard: boolean;
	autoRefresh: boolean;
	onToggleAutoRefresh?: (enabled: boolean) => void;
	onRefresh?: () => void;
	classes: PublicPortalClass[];
	classId: string;
	onClassChange?: (classId: string) => void;
}

export const LeaderboardLiveHeader = ({
	lastUpdatedAt,
	isRefreshing,
	loadingLeaderboard,
	autoRefresh,
	onToggleAutoRefresh,
	onRefresh,
	classes,
	classId,
	onClassChange,
}: LeaderboardLiveHeaderProps) => {
	return (
		<div className="flex flex-col gap-4">
			{/* Real-time Status Control Bar */}
			<div className="flex flex-col gap-4 rounded-2xl bg-m3-surface-container p-4 sm:flex-row sm:items-center sm:justify-between border border-m3-outline-variant/30">
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<span className="relative flex h-3 w-3">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
						</span>
						<span className="text-xs font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
							TRỰC TIẾP
						</span>
					</div>

					<span className="h-4 w-px bg-m3-outline-variant/50" />

					<Text variant="body-sm" className="text-m3-on-surface-variant">
						{lastUpdatedAt
							? `Cập nhật lúc ${formatShortTime(lastUpdatedAt)}`
							: "Đang kết nối dữ liệu..."}
					</Text>

					{isRefreshing && (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-m3-primary/10 px-2 py-0.5 text-[11px] font-semibold text-m3-primary animate-pulse">
							<LoadingIndicator aria-label="Đang đồng bộ bảng xếp hạng" size={12} />
							Đang đồng bộ...
						</span>
					)}
				</div>

				<div className="flex items-center gap-2 self-end sm:self-auto">
					{onToggleAutoRefresh && (
						<button
							type="button"
							onClick={() => onToggleAutoRefresh(!autoRefresh)}
							className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
								autoRefresh
									? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
									: "border-m3-outline-variant/50 bg-m3-surface-container-high text-m3-on-surface-variant"
							}`}
							title="Tự động cập nhật ngầm mỗi 4 giây mà không cần F5"
						>
							<Icon
								name={autoRefresh ? "autorenew" : "pause_circle"}
								size={16}
								className={autoRefresh && isRefreshing ? "animate-spin" : ""}
							/>
							{autoRefresh ? "Tự động 4s" : "Đã tạm dừng"}
						</button>
					)}

					{onRefresh && (
						<Button
							colorStyle="outlined"
							size="sm"
							onClick={onRefresh}
							disabled={isRefreshing || loadingLeaderboard}
							className="rounded-full gap-1.5 h-8 px-3 text-xs"
						>
							<Icon
								name="sync"
								size={15}
								className={isRefreshing ? "animate-spin" : ""}
							/>
							Làm mới ngay
						</Button>
					)}
				</div>
			</div>

			{/* Multiple Classes Switcher Tabs */}
			{classes.length > 1 && onClassChange && (
				<div className="flex flex-wrap items-center gap-2">
					<Text
						variant="label-sm"
						className="font-bold text-m3-on-surface-variant uppercase tracking-wider mr-1"
					>
						Xem theo lớp:
					</Text>
					{classes.map((cls) => {
						const isSelected = cls.id === classId;
						return (
							<button
								key={cls.id}
								type="button"
								onClick={() => onClassChange(cls.id)}
								className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
									isSelected
										? "bg-m3-primary text-m3-on-primary shadow-xs"
										: "bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant border border-m3-outline-variant/40"
								}`}
							>
								{cls.name}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};
