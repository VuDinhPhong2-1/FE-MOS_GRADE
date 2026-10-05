import { Icon } from "@bug-on/m3-expressive/core";
import { Text } from "@bug-on/m3-expressive/layout";
import { memo } from "react";
import type { SubmissionLeaderboardItem } from "../../../types/submission-portal.types";
import { formatScore, formatShortTime } from "../utils/formatters";

export interface PodiumCardProps {
	row: SubmissionLeaderboardItem;
	rankType: number; // 1: Gold, 2: Silver, 3: Bronze
}

const PodiumCardComponent = ({ row, rankType }: PodiumCardProps) => {
	const isRank1 = rankType === 1;
	const isRank2 = rankType === 2;

	const score = row.scoreValue ?? 0;
	const max = row.maxScore ?? 100;
	const percentage =
		max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;

	return (
		<div
			className={`relative flex w-full flex-col items-center justify-between rounded-3xl p-5 text-center transition-all sm:w-64 md:w-72 ${
				isRank1
					? "order-1 sm:order-2 border-2 border-amber-400/50 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-m3-surface-container shadow-xl shadow-amber-500/10 min-h-[360px] sm:min-h-[420px]"
					: isRank2
						? "order-2 sm:order-1 border border-slate-300 dark:border-slate-600 bg-gradient-to-b from-slate-200/30 via-slate-100/10 to-m3-surface-container shadow-md min-h-[310px] sm:min-h-[350px]"
						: "order-3 border border-amber-700/40 bg-gradient-to-b from-amber-700/15 via-amber-800/5 to-m3-surface-container shadow-md min-h-[280px] sm:min-h-[310px]"
			}`}
		>
			{/* Top Trophy / Medal Icon & Header Pill */}
			<div className="flex flex-col items-center">
				{isRank1 ? (
					<div className="flex flex-col items-center gap-2">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-400/20">
							<Icon name="emoji_events" size={32} />
						</div>
						<span className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
							👑 TOP 1 • QUÁN QUÂN
						</span>
					</div>
				) : isRank2 ? (
					<div className="flex flex-col items-center gap-2">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-800 shadow-md ring-4 ring-slate-300/30">
							<Icon name="military_tech" size={28} />
						</div>
						<span className="rounded-full bg-gradient-to-r from-slate-400 to-slate-500 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
							🥈 TOP 2 • Á QUÂN 1
						</span>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2">
						<div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white shadow-md ring-4 ring-amber-700/30">
							<Icon name="military_tech" size={26} />
						</div>
						<span className="rounded-full bg-gradient-to-r from-amber-700 to-amber-800 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
							🥉 TOP 3 • Á QUÂN 2
						</span>
					</div>
				)}

				{/* Student Name & Class */}
				<div className="mt-3 flex flex-col items-center">
					<Text
						variant={isRank1 ? "title-md" : "title-sm"}
						className="font-black text-m3-on-surface line-clamp-1"
						title={row.studentName}
					>
						{row.studentName}
					</Text>
					<span className="mt-0.5 rounded-full bg-m3-surface-container-high px-2 py-0.5 text-[11px] font-semibold text-m3-on-surface-variant">
						Lớp {row.className}
					</span>
				</div>
			</div>

			{/* Score & Progress Shimmer */}
			<div className="my-4 w-full flex flex-col items-center">
				<div className="flex items-baseline gap-1">
					<span
						className={`text-2xl font-black ${
							isRank1
								? "text-amber-600 dark:text-amber-400"
								: isRank2
									? "text-slate-700 dark:text-slate-200"
									: "text-amber-700 dark:text-amber-500"
						}`}
					>
						{formatScore(score)}
					</span>
					<span className="text-xs font-semibold text-m3-on-surface-variant">
						/{formatScore(max)} điểm
					</span>
				</div>

				<div className="mt-2 h-2 w-36 overflow-hidden rounded-full bg-m3-surface-container-highest">
					<div
						className={`h-full rounded-full ${
							isRank1
								? "bg-gradient-to-r from-amber-400 to-amber-500"
								: isRank2
									? "bg-gradient-to-r from-slate-300 to-slate-400"
									: "bg-gradient-to-r from-amber-600 to-amber-700"
						}`}
						style={{ width: `${percentage}%` }}
					/>
				</div>

				<div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-m3-on-surface-variant font-medium">
					<span className="inline-flex items-center gap-1 rounded-md bg-m3-surface-container px-2 py-0.5">
						<Icon name="bolt" size={12} className="text-amber-500" />
						{row.submissionCount} lần nộp
					</span>
					{row.gradedAt && (
						<span className="inline-flex items-center gap-1 rounded-md bg-m3-surface-container px-2 py-0.5">
							<Icon name="schedule" size={12} />
							{formatShortTime(row.gradedAt)}
						</span>
					)}
				</div>
			</div>

			{/* Pedestal Base Block */}
			<div
				className={`flex w-full items-center justify-center rounded-2xl py-2 font-black text-2xl select-none ${
					isRank1
						? "bg-amber-500/10 text-amber-500/60"
						: isRank2
							? "bg-slate-500/10 text-slate-500/50"
							: "bg-amber-700/10 text-amber-700/50"
				}`}
			>
				#{rankType}
			</div>
		</div>
	);
};

export const PodiumCard = memo(PodiumCardComponent);
