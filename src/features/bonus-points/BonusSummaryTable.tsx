import {
	Card,
	Chip,
	Icon,
	IconButton,
	ScrollArea,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
import type { StudentBonusPointSummary } from "../../types/bonus-point.types";

interface BonusSummaryTableProps {
	summary: StudentBonusPointSummary[];
	onViewHistory: (student: StudentBonusPointSummary) => void;
	searchQuery: string;
	onSearchChange: (q: string) => void;
}

export const BonusSummaryTable: React.FC<BonusSummaryTableProps> = ({
	summary,
	onViewHistory,
	searchQuery,
	onSearchChange,
}) => {
	const filteredSummary = useMemo(() => {
		if (!searchQuery.trim()) return summary;
		const q = searchQuery.toLowerCase().trim();
		return summary.filter((s) => s.studentFullName.toLowerCase().includes(q));
	}, [summary, searchQuery]);

	const totalClassBonus = useMemo(() => {
		return summary.reduce((acc, s) => acc + (s.totalBonusPoints || 0), 0);
	}, [summary]);

	const studentsWithBonusCount = useMemo(() => {
		return summary.filter((s) => (s.totalBonusPoints || 0) > 0).length;
	}, [summary]);

	return (
		<div className="flex flex-col gap-4">
			{/* Overview stats bar */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<Card
					variant="filled"
					className="p-4 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/30 flex items-center gap-3"
				>
					<div className="w-10 h-10 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center font-bold">
						<Icon name="stars" size={22} />
					</div>
					<div>
						<Text
							variant="body-sm"
							className="text-xs font-medium text-m3-on-surface-variant"
						>
							Tổng điểm cộng toàn lớp
						</Text>
						<Text
							variant="headline-sm"
							className="text-xl font-bold text-m3-primary"
						>
							{totalClassBonus > 0 ? `+${totalClassBonus}` : totalClassBonus}{" "}
							điểm
						</Text>
					</div>
				</Card>

				<Card
					variant="filled"
					className="p-4 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/30 flex items-center gap-3"
				>
					<div className="w-10 h-10 rounded-m3-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center font-bold">
						<Icon name="group" size={22} />
					</div>
					<div>
						<Text
							variant="body-sm"
							className="text-xs font-medium text-m3-on-surface-variant"
						>
							Học sinh có điểm cộng
						</Text>
						<Text
							variant="headline-sm"
							className="text-xl font-bold text-m3-secondary"
						>
							{studentsWithBonusCount}/{summary.length} học sinh
						</Text>
					</div>
				</Card>

				<Card
					variant="filled"
					className="p-4 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/30 flex items-center gap-3"
				>
					<div className="w-10 h-10 rounded-m3-full bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center font-bold">
						<Icon name="insights" size={22} />
					</div>
					<div>
						<Text
							variant="body-sm"
							className="text-xs font-medium text-m3-on-surface-variant"
						>
							Điểm cộng trung bình
						</Text>
						<Text
							variant="headline-sm"
							className="text-xl font-bold text-m3-tertiary"
						>
							{summary.length > 0
								? (totalClassBonus / summary.length).toFixed(1)
								: "0"}{" "}
							điểm/HS
						</Text>
					</div>
				</Card>
			</div>

			{/* Search */}
			<div className="w-full sm:w-80">
				<TextField
					variant="outlined"
					placeholder="Tìm học sinh trong bảng tổng hợp..."
					value={searchQuery}
					onChange={(val) => onSearchChange(val)}
					leadingIcon={<Icon name="search" size={20} />}
					fullWidth
				/>
			</div>

			{/* Table */}
			<div className="rounded-m3-xl border border-m3-outline-variant/40 bg-m3-surface shadow-sm overflow-hidden">
				<ScrollArea type="hover" orientation="both" className="w-full">
					<table className="min-w-175 w-full text-left border-collapse text-sm">
						<thead>
							<tr className="bg-m3-surface-container border-b border-m3-outline-variant/40 text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								<th className="py-3 px-4 w-12 text-center">STT</th>
								<th className="py-3 px-4 min-w-50">Học sinh</th>
								<th className="py-3 px-4 w-40 text-center">Tổng điểm cộng</th>
								<th className="py-3 px-4 w-40 text-center">Số lần ghi nhận</th>
								<th className="py-3 px-4 w-28 text-center">Lịch sử</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-m3-outline-variant/20">
							{filteredSummary.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="py-12 text-center text-m3-on-surface-variant"
									>
										Không có học sinh nào.
									</td>
								</tr>
							) : (
								filteredSummary.map((item, idx) => {
									const initial = (
										item.studentFirstName?.[0] ||
										item.studentFullName[0] ||
										"?"
									).toUpperCase();
									const hasBonus = item.totalBonusPoints > 0;

									return (
										<tr
											key={item.studentId}
											className="transition-colors hover:bg-m3-surface-container-low/50"
										>
											<td className="py-3 px-4 text-center font-medium text-m3-on-surface-variant/80">
												{idx + 1}
											</td>

											<td className="py-3 px-4">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
														{initial}
													</div>
													<span className="font-semibold text-m3-on-surface">
														{item.studentFullName}
													</span>
												</div>
											</td>

											{/* Total Points */}
											<td className="py-3 px-4 text-center">
												<Chip
													variant="assist"
													label={
														hasBonus
															? `+${item.totalBonusPoints}`
															: `${item.totalBonusPoints}`
													}
													leadingIcon={
														<Icon
															name="military_tech"
															size={16}
															className={
																hasBonus
																	? "text-m3-primary"
																	: "text-m3-on-surface-variant/50"
															}
														/>
													}
													className={`pointer-events-none h-7 px-3 text-sm font-bold ${
														hasBonus
															? "bg-m3-primary-container/40 text-m3-primary border-primary/20"
															: "bg-m3-surface-container text-m3-on-surface-variant/70 border-transparent"
													}`}
												/>
											</td>

											{/* Number of times */}
											<td className="py-3 px-4 text-center text-m3-on-surface-variant font-medium">
												{item.details.length} lần
											</td>

											{/* View History Action */}
											<td className="py-3 px-4 text-center">
												<IconButton
													size="sm"
													onClick={() => onViewHistory(item)}
													aria-label={`Xem chi tiết điểm cộng của ${item.studentFullName}`}
													className="text-m3-primary hover:bg-m3-primary/10"
												>
													<Icon name="history" size={20} />
												</IconButton>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</ScrollArea>
			</div>
		</div>
	);
};
