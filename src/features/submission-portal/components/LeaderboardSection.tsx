import { Icon } from "@bug-on/m3-expressive/core";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type {
	PublicPortalClass,
	SubmissionLeaderboardItem,
} from "../../../types/submission-portal.types";
import { LeaderboardLiveHeader } from "./LeaderboardLiveHeader";
import { LeaderboardMyStanding } from "./LeaderboardMyStanding";
import { LeaderboardPodium, type PodiumItem } from "./LeaderboardPodium";
import { LeaderboardStats } from "./LeaderboardStats";
import { LeaderboardTable } from "./LeaderboardTable";

export interface LeaderboardSectionProps {
	leaderboard: SubmissionLeaderboardItem[];
	loadingLeaderboard: boolean;
	isRefreshing?: boolean;
	lastUpdatedAt?: Date | null;
	selectedClass?: PublicPortalClass;
	classes?: PublicPortalClass[];
	classId?: string;
	onClassChange?: (classId: string) => void;
	currentStudentId?: string;
	onRefresh?: () => void;
	autoRefresh?: boolean;
	onToggleAutoRefresh?: (enabled: boolean) => void;
}

type FilterTab = "all" | "top10" | "scored" | "unscored";

const normalizeText = (text: string): string =>
	text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

const LeaderboardSectionComponent = ({
	leaderboard,
	loadingLeaderboard,
	isRefreshing = false,
	lastUpdatedAt = null,
	selectedClass,
	classes = [],
	classId = "",
	onClassChange,
	currentStudentId,
	onRefresh,
	autoRefresh = true,
	onToggleAutoRefresh,
}: LeaderboardSectionProps) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterTab, setFilterTab] = useState<FilterTab>("all");
	const tableContainerRef = useRef<HTMLDivElement>(null);

	// Track previous ranks to calculate live delta
	const prevRanksRef = useRef<Record<string, number>>({});
	const [rankDeltas, setRankDeltas] = useState<Record<string, number>>({});

	useEffect(() => {
		if (leaderboard.length === 0) return;
		const newDeltas: Record<string, number> = {};
		const prev = prevRanksRef.current;

		for (const item of leaderboard) {
			const currentRank = item.rank ?? 999;
			const previousRank = prev[item.studentId];
			if (previousRank !== undefined && previousRank !== currentRank) {
				newDeltas[item.studentId] = previousRank - currentRank;
			}
		}

		if (Object.keys(newDeltas).length > 0) {
			setRankDeltas((d) => ({ ...d, ...newDeltas }));
		}

		const nextRanks: Record<string, number> = {};
		for (const item of leaderboard) {
			nextRanks[item.studentId] = item.rank ?? 999;
		}
		prevRanksRef.current = nextRanks;
	}, [leaderboard]);

	// Scored list & stats
	const scoredItems = useMemo(
		() =>
			leaderboard.filter(
				(item) => (item.scoreValue ?? 0) > 0 || (item.submissionCount ?? 0) > 0,
			),
		[leaderboard],
	);

	const totalParticipants = leaderboard.length;
	const submittedCount = scoredItems.length;
	const maxScore = leaderboard[0]?.maxScore ?? 100;
	const highestScore = useMemo(
		() =>
			scoredItems.length > 0
				? Math.max(...scoredItems.map((i) => i.scoreValue ?? 0))
				: 0,
		[scoredItems],
	);
	const averageScore = useMemo(() => {
		if (scoredItems.length === 0) return "0";
		const sum = scoredItems.reduce(
			(acc, curr) => acc + (curr.scoreValue ?? 0),
			0,
		);
		return (sum / scoredItems.length).toFixed(1);
	}, [scoredItems]);
	const totalSubmissions = useMemo(
		() =>
			leaderboard.reduce((acc, curr) => acc + (curr.submissionCount ?? 0), 0),
		[leaderboard],
	);
	const participationPercent =
		totalParticipants > 0
			? Math.round((submittedCount / totalParticipants) * 100)
			: 0;

	// Active student's ranking & gap analysis
	const myEntry = useMemo(
		() =>
			currentStudentId
				? leaderboard.find((item) => item.studentId === currentStudentId)
				: undefined,
		[leaderboard, currentStudentId],
	);

	const top3ThresholdScore = useMemo(() => {
		if (scoredItems.length >= 3) {
			return scoredItems[2].scoreValue ?? 0;
		}
		return scoredItems[scoredItems.length - 1]?.scoreValue ?? 0;
	}, [scoredItems]);

	const myGapToTop3 = useMemo(() => {
		if (!myEntry) return null;
		const myScore = myEntry.scoreValue ?? 0;
		const gap = top3ThresholdScore - myScore;
		return gap > 0 ? gap : 0;
	}, [myEntry, top3ThresholdScore]);

	// Filtered list for table
	const filteredLeaderboard = useMemo(() => {
		let list = leaderboard;

		if (filterTab === "top10") {
			list = list.slice(0, 10);
		} else if (filterTab === "scored") {
			list = list.filter(
				(i) => (i.scoreValue ?? 0) > 0 || (i.submissionCount ?? 0) > 0,
			);
		} else if (filterTab === "unscored") {
			list = list.filter(
				(i) => (i.scoreValue ?? 0) === 0 && (i.submissionCount ?? 0) === 0,
			);
		}

		if (searchTerm.trim()) {
			const query = normalizeText(searchTerm.trim());
			list = list.filter((i) => normalizeText(i.studentName).includes(query));
		}

		return list;
	}, [leaderboard, filterTab, searchTerm]);

	// Top 3 Podium items
	const podiumItems = useMemo<PodiumItem[]>(() => {
		const topScored = scoredItems.slice(0, 3);
		if (topScored.length === 0) return [];
		if (topScored.length === 1) {
			return [{ row: topScored[0], rankType: 1 }];
		}
		if (topScored.length === 2) {
			return [
				{ row: topScored[1], rankType: 2 },
				{ row: topScored[0], rankType: 1 },
			];
		}
		return [
			{ row: topScored[1], rankType: 2 },
			{ row: topScored[0], rankType: 1 },
			{ row: topScored[2], rankType: 3 },
		];
	}, [scoredItems]);

	const scrollToMyRow = () => {
		if (!tableContainerRef.current || !currentStudentId) return;
		const row = tableContainerRef.current.querySelector(
			`[data-student-id="${currentStudentId}"]`,
		);
		if (row) {
			row.scrollIntoView({ behavior: "smooth", block: "center" });
			row.classList.add("ring-2", "ring-m3-primary");
			setTimeout(() => {
				row.classList.remove("ring-2", "ring-m3-primary");
			}, 2500);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Real-time Status Control Bar & Class switcher */}
			<LeaderboardLiveHeader
				lastUpdatedAt={lastUpdatedAt}
				isRefreshing={isRefreshing}
				loadingLeaderboard={loadingLeaderboard}
				autoRefresh={autoRefresh}
				onToggleAutoRefresh={onToggleAutoRefresh}
				onRefresh={onRefresh}
				classes={classes}
				classId={classId}
				onClassChange={onClassChange}
			/>

			{/* Competition Overview Stats Bar */}
			<LeaderboardStats
				totalParticipants={totalParticipants}
				submittedCount={submittedCount}
				participationPercent={participationPercent}
				highestScore={highestScore}
				maxScore={maxScore}
				averageScore={averageScore}
				totalSubmissions={totalSubmissions}
			/>

			{/* My Standing Motivational Card (If student is logged in/selected) */}
			{myEntry && (
				<LeaderboardMyStanding
					myEntry={myEntry}
					gapToTop3={myGapToTop3}
					onScrollToMyRow={scrollToMyRow}
				/>
			)}

			{/* Olympic Stepped Podium (Top 3) */}
			<LeaderboardPodium podiumItems={podiumItems} />

			{/* Full Data Table Card */}
			<Card
				variant="filled"
				className="bg-m3-surface-container-low p-5 rounded-3xl border border-m3-outline-variant/30 text-m3-on-surface"
			>
				{/* Table Control Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-m3-outline-variant/30">
					<div className="flex items-center gap-2">
						<Text variant="title-md" className="font-black text-m3-on-surface">
							Bảng thành tích chi tiết
							{selectedClass ? ` - ${selectedClass.name}` : ""}
						</Text>
						<span className="rounded-full bg-m3-surface-container-high px-2.5 py-0.5 text-xs font-bold text-m3-on-surface-variant">
							{filteredLeaderboard.length} học sinh
						</span>
					</div>

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
						{/* Search Input */}
						<div className="relative flex items-center min-w-56">
							<Icon
								name="search"
								size={18}
								className="absolute left-3 text-m3-on-surface-variant pointer-events-none"
							/>
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Tìm tên học sinh..."
								className="w-full h-9 rounded-full bg-m3-surface-container pl-9 pr-8 text-xs font-medium text-m3-on-surface placeholder:text-m3-on-surface-variant/60 focus:outline-hidden focus:ring-2 focus:ring-m3-primary border border-m3-outline-variant/40"
							/>
							{searchTerm && (
								<button
									type="button"
									onClick={() => setSearchTerm("")}
									className="absolute right-2.5 text-m3-on-surface-variant hover:text-m3-on-surface"
								>
									<Icon name="close" size={14} />
								</button>
							)}
						</div>

						{/* Quick Filter Buttons */}
						<div className="flex items-center gap-1 rounded-full bg-m3-surface-container p-1 border border-m3-outline-variant/40">
							<button
								type="button"
								onClick={() => setFilterTab("all")}
								className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
									filterTab === "all"
										? "bg-m3-primary text-m3-on-primary shadow-xs"
										: "text-m3-on-surface-variant hover:text-m3-on-surface"
								}`}
							>
								Tất cả ({totalParticipants})
							</button>
							<button
								type="button"
								onClick={() => setFilterTab("top10")}
								className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
									filterTab === "top10"
										? "bg-m3-primary text-m3-on-primary shadow-xs"
										: "text-m3-on-surface-variant hover:text-m3-on-surface"
								}`}
							>
								Top 10
							</button>
							<button
								type="button"
								onClick={() => setFilterTab("scored")}
								className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
									filterTab === "scored"
										? "bg-m3-primary text-m3-on-primary shadow-xs"
										: "text-m3-on-surface-variant hover:text-m3-on-surface"
								}`}
							>
								Đã có điểm ({submittedCount})
							</button>
							<button
								type="button"
								onClick={() => setFilterTab("unscored")}
								className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
									filterTab === "unscored"
										? "bg-m3-primary text-m3-on-primary shadow-xs"
										: "text-m3-on-surface-variant hover:text-m3-on-surface"
								}`}
							>
								Chưa nộp ({totalParticipants - submittedCount})
							</button>
						</div>
					</div>
				</div>

				{/* Table */}
				<LeaderboardTable
					data={filteredLeaderboard}
					loading={loadingLeaderboard}
					currentStudentId={currentStudentId}
					rankDeltas={rankDeltas}
					searchTerm={searchTerm}
					tableContainerRef={tableContainerRef}
				/>
			</Card>
		</div>
	);
};

export const LeaderboardSection = memo(LeaderboardSectionComponent);
