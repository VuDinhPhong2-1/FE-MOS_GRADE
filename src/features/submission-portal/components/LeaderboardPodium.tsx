import { Icon } from "@bug-on/m3-expressive/core";
import { Text } from "@bug-on/m3-expressive/layout";
import { memo } from "react";
import type { SubmissionLeaderboardItem } from "../../../types/submission-portal.types";
import { PodiumCard } from "./PodiumCard";

export interface PodiumItem {
	row: SubmissionLeaderboardItem;
	rankType: number; // 1: Gold, 2: Silver, 3: Bronze
}

export interface LeaderboardPodiumProps {
	podiumItems: PodiumItem[];
}

const LeaderboardPodiumComponent = ({
	podiumItems,
}: LeaderboardPodiumProps) => {
	if (podiumItems.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-m3-outline-variant/60 bg-m3-surface-container-low p-8 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-3">
					<Icon name="sports_score" size={32} />
				</div>
				<Text variant="title-md" className="font-black text-m3-on-surface">
					Cuộc đua chuẩn bị khởi tranh!
				</Text>
				<p className="mt-1 max-w-md text-xs text-m3-on-surface-variant">
					Chưa có học sinh nào nộp bài có kết quả. Hãy là người đầu tiên hoàn
					thành bài tập để khắc tên lên vị trí Quán quân!
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-3xl border border-m3-outline-variant/30 bg-m3-surface-container-low p-5 sm:p-8">
			<div className="mb-6 text-center">
				<Text
					variant="title-lg"
					className="font-black tracking-tight text-m3-on-surface"
				>
					BỤC VINH DANH QUÁN QUÂN
				</Text>
				<p className="text-xs text-m3-on-surface-variant mt-1">
					Top 3 học sinh xuất sắc nhất cuộc tranh tài hiện tại
				</p>
			</div>

			<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-center sm:gap-4 md:gap-6">
				{podiumItems.map((item) => (
					<PodiumCard
						key={`${item.row.studentId}-${item.rankType}`}
						row={item.row}
						rankType={item.rankType}
					/>
				))}
			</div>
		</div>
	);
};

export const LeaderboardPodium = memo(LeaderboardPodiumComponent);
