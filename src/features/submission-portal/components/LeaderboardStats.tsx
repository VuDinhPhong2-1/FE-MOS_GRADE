import { Icon } from "@bug-on/m3-expressive/core";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import { memo } from "react";
import { formatScore } from "../utils/formatters";

export interface LeaderboardStatsProps {
	totalParticipants: number;
	submittedCount: number;
	participationPercent: number;
	highestScore: number;
	maxScore: number;
	averageScore: string;
	totalSubmissions: number;
}

const LeaderboardStatsComponent = ({
	totalParticipants,
	submittedCount,
	participationPercent,
	highestScore,
	maxScore,
	averageScore,
	totalSubmissions,
}: LeaderboardStatsProps) => {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<Card
				variant="filled"
				className="flex flex-col p-4 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/30"
			>
				<div className="flex items-center gap-2 text-m3-primary">
					<Icon name="groups" size={20} />
					<Text
						variant="label-sm"
						className="font-bold uppercase tracking-wider text-m3-on-surface-variant"
					>
						Sĩ số đua tài
					</Text>
				</div>
				<div className="mt-2 flex items-baseline gap-1">
					<span className="text-2xl font-black text-m3-on-surface">
						{submittedCount}
					</span>
					<span className="text-xs font-semibold text-m3-on-surface-variant">
						/{totalParticipants} ({participationPercent}%)
					</span>
				</div>
			</Card>

			<Card
				variant="filled"
				className="flex flex-col p-4 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/30"
			>
				<div className="flex items-center gap-2 text-amber-500">
					<Icon name="emoji_events" size={20} />
					<Text
						variant="label-sm"
						className="font-bold uppercase tracking-wider text-m3-on-surface-variant"
					>
						Điểm dẫn đầu
					</Text>
				</div>
				<div className="mt-2 flex items-baseline gap-1">
					<span className="text-2xl font-black text-amber-600 dark:text-amber-400">
						{formatScore(highestScore)}
					</span>
					<span className="text-xs font-semibold text-m3-on-surface-variant">
						/{formatScore(maxScore)}
					</span>
				</div>
			</Card>

			<Card
				variant="filled"
				className="flex flex-col p-4 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/30"
			>
				<div className="flex items-center gap-2 text-sky-500">
					<Icon name="analytics" size={20} />
					<Text
						variant="label-sm"
						className="font-bold uppercase tracking-wider text-m3-on-surface-variant"
					>
						Điểm trung bình
					</Text>
				</div>
				<div className="mt-2 flex items-baseline gap-1">
					<span className="text-2xl font-black text-m3-on-surface">
						{averageScore}
					</span>
					<span className="text-xs font-semibold text-m3-on-surface-variant">
						điểm
					</span>
				</div>
			</Card>

			<Card
				variant="filled"
				className="flex flex-col p-4 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/30"
			>
				<div className="flex items-center gap-2 text-purple-500">
					<Icon name="bolt" size={20} />
					<Text
						variant="label-sm"
						className="font-bold uppercase tracking-wider text-m3-on-surface-variant"
					>
						Tổng lượt nộp
					</Text>
				</div>
				<div className="mt-2 flex items-baseline gap-1">
					<span className="text-2xl font-black text-m3-on-surface">
						{totalSubmissions}
					</span>
					<span className="text-xs font-semibold text-m3-on-surface-variant">
						lần
					</span>
				</div>
			</Card>
		</div>
	);
};

export const LeaderboardStats = memo(LeaderboardStatsComponent);
