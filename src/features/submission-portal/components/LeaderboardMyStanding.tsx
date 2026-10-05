import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { Text } from "@bug-on/m3-expressive/layout";
import { memo } from "react";
import type { SubmissionLeaderboardItem } from "../../../types/submission-portal.types";
import { formatScore } from "../utils/formatters";

export interface LeaderboardMyStandingProps {
	myEntry: SubmissionLeaderboardItem;
	gapToTop3: number | null;
	onScrollToMyRow: () => void;
}

const LeaderboardMyStandingComponent = ({
	myEntry,
	gapToTop3,
	onScrollToMyRow,
}: LeaderboardMyStandingProps) => {
	const rank = myEntry.rank ?? 999;

	return (
		<div className="relative overflow-hidden rounded-2xl border border-m3-primary/30 bg-gradient-to-r from-m3-primary/15 via-m3-primary/5 to-transparent p-4 sm:p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3.5">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-m3-primary text-m3-on-primary font-black shadow-md shadow-m3-primary/20 text-base">
						#{rank}
					</div>
					<div>
						<div className="flex items-center gap-2">
							<Text
								variant="title-md"
								className="font-black text-m3-on-surface"
							>
								{myEntry.studentName}
							</Text>
							<span className="rounded-full bg-m3-primary/20 px-2 py-0.5 text-[10px] font-black text-m3-primary">
								VỊ TRÍ CỦA BẠN
							</span>
						</div>
						<p className="mt-0.5 text-xs text-m3-on-surface-variant">
							{rank === 1 ? (
								<span className="font-bold text-amber-600 dark:text-amber-400">
									👑 Xuất sắc! Bạn đang giữ ngôi vị Quán quân dẫn đầu bảng! Giữ
									vững phong độ nhé!
								</span>
							) : rank <= 3 ? (
								<span className="font-bold text-emerald-600 dark:text-emerald-400">
									🥈🥉 Tuyệt vời! Bạn đang nằm trong Top 3! Nỗ lực thêm chút nữa
									để vươn lên Quán quân!
								</span>
							) : gapToTop3 && gapToTop3 > 0 ? (
								<span>
									⚡ Bạn đang xếp thứ <strong>#{rank}</strong> với{" "}
									<strong>{formatScore(myEntry.scoreValue)} điểm</strong>. Chỉ
									còn cách Top 3 đúng{" "}
									<strong className="text-m3-primary">
										{formatScore(gapToTop3)} điểm
									</strong>
									!
								</span>
							) : (
								<span>
									Bạn đang xếp thứ <strong>#{rank}</strong>. Hãy nộp thêm bài để
									bứt phá thứ hạng!
								</span>
							)}
						</p>
					</div>
				</div>

				<Button
					colorStyle="filled"
					size="sm"
					onClick={onScrollToMyRow}
					className="rounded-full shrink-0 gap-1.5 self-start sm:self-auto text-xs"
				>
					<Icon name="my_location" size={16} />
					Xem vị trí trong bảng
				</Button>
			</div>
		</div>
	);
};

export const LeaderboardMyStanding = memo(LeaderboardMyStandingComponent);
