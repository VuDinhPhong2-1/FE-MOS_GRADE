// src/features/bonus-points/BonusEntryTable.tsx
import {
	Button,
	Card,
	Chip,
	Icon,
	IconButton,
	ScrollArea,
	Select,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
import type { Student } from "../../types/student.types";

interface BonusEntryTableProps {
	students: Student[];
	items: Record<string, { points: number; category: string; reason: string }>;
	onChangeItem: (
		studentId: string,
		updates: Partial<{ points: number; category: string; reason: string }>,
	) => void;
	onSaveAll: () => void;
	isSaving: boolean;
	searchQuery: string;
	onSearchChange: (q: string) => void;
	defaultCategory: string;
	onDefaultCategoryChange: (cat: string) => void;
}

const CATEGORY_OPTIONS = [
	{ value: "participation", label: "Phát biểu / Tham gia tích cực" },
	{ value: "behavior", label: "Ý thức / Kỷ luật tốt" },
	{ value: "achievement", label: "Làm bài tập xuất sắc" },
];

export const BonusEntryTable: React.FC<BonusEntryTableProps> = ({
	students,
	items,
	onChangeItem,
	onSaveAll,
	isSaving,
	searchQuery,
	onSearchChange,
	defaultCategory,
	onDefaultCategoryChange,
}) => {
	const filteredStudents = useMemo(() => {
		if (!searchQuery.trim()) return students;
		const q = searchQuery.toLowerCase().trim();
		return students.filter((s) => {
			const fullName =
				`${s.middleName || ""} ${s.firstName || ""}`.toLowerCase();
			return fullName.includes(q);
		});
	}, [students, searchQuery]);

	const totalActiveEntries = useMemo(() => {
		return Object.values(items).filter(
			(i) => i.points !== 0 || i.reason.trim() !== "",
		).length;
	}, [items]);

	const totalPointsToGive = useMemo(() => {
		return Object.values(items).reduce((acc, i) => acc + (i.points || 0), 0);
	}, [items]);

	return (
		<div className="flex flex-col gap-4">
			{/* Controls Bar */}
			<Card
				variant="filled"
				className="p-4 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/30 flex flex-wrap items-center justify-between gap-3"
			>
				<div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
					<div className="w-full sm:w-72">
						<TextField
							variant="outlined"
							placeholder="Tìm học sinh theo tên..."
							value={searchQuery}
							onChange={(val) => onSearchChange(val)}
							leadingIcon={<Icon name="search" size={20} />}
							fullWidth
						/>
					</div>

					<div className="w-full sm:w-64">
						<Select
							variant="outlined"
							label="Phân loại áp dụng"
							options={CATEGORY_OPTIONS}
							value={defaultCategory}
							onChange={(val) => onDefaultCategoryChange(val)}
							fullWidth
						/>
					</div>
				</div>

				<div className="flex items-center gap-3 ml-auto">
					<Chip
						variant="assist"
						label={`Đang nhập: ${totalActiveEntries} HS (${totalPointsToGive > 0 ? `+${totalPointsToGive}` : totalPointsToGive} điểm)`}
						leadingIcon={
							<Icon name="stars" size={16} className="text-m3-primary" />
						}
						className="pointer-events-none h-7 px-3 text-xs font-semibold bg-m3-primary-container/30 text-m3-on-primary-container"
					/>

					<Button
						colorStyle="filled"
						onClick={onSaveAll}
						disabled={totalActiveEntries === 0 || isSaving}
						className="font-medium"
					>
						<Icon
							name={isSaving ? "hourglass_empty" : "save"}
							size={18}
							className="mr-1"
						/>
						{isSaving ? "Đang lưu..." : "Lưu điểm cộng ngày"}
					</Button>
				</div>
			</Card>

			{/* Table */}
			<div className="rounded-m3-xl border border-m3-outline-variant/40 bg-m3-surface shadow-sm overflow-hidden">
				<ScrollArea type="hover" orientation="both" className="w-full">
					<table className="min-w-225 w-full text-left border-collapse text-sm">
						<thead>
							<tr className="bg-m3-surface-container border-b border-m3-outline-variant/40 text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
								<th className="py-3 px-4 w-12 text-center">STT</th>
								<th className="py-3 px-4 min-w-50">Học sinh</th>
								<th className="py-3 px-4 w-52 text-center">Điểm cộng</th>
								<th className="py-3 px-4 w-60">Phân loại</th>
								<th className="py-3 px-4 min-w-55">Lý do / Nội dung</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-m3-outline-variant/20">
							{filteredStudents.map((student, idx) => {
								const item = items[student.id] ?? {
									points: 0,
									category: defaultCategory,
									reason: "",
								};
								const fullName =
									`${student.middleName || ""} ${student.firstName || ""}`.trim() ||
									"Chưa có tên";
								const initial = (
									student.firstName?.[0] ||
									fullName[0] ||
									"?"
								).toUpperCase();

								return (
									<tr
										key={student.id}
										className={`transition-colors hover:bg-m3-surface-container-low/50 ${
											item.points > 0 ? "bg-m3-primary-container/10" : ""
										}`}
									>
										<td className="py-3 px-4 text-center font-medium text-m3-on-surface-variant/80">
											{idx + 1}
										</td>

										<td className="py-3 px-4">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
													{initial}
												</div>
												<div>
													<Text
														variant="body-md"
														className="font-semibold text-m3-on-surface"
													>
														{fullName}
													</Text>
													{student.notes && (
														<Text
															variant="body-sm"
															className="text-xs text-m3-on-surface-variant truncate max-w-xs"
														>
															{student.notes}
														</Text>
													)}
												</div>
											</div>
										</td>

										{/* Point controls */}
										<td className="py-3 px-4">
											<div className="flex items-center justify-center gap-1.5">
												<IconButton
													size="sm"
													onClick={() =>
														onChangeItem(student.id, {
															points: Math.max(-10, (item.points || 0) - 1),
															category: item.category || defaultCategory,
														})
													}
													aria-label="Giảm 1 điểm"
													className="hover:bg-m3-surface-container-high"
												>
													<Icon name="remove" size={16} />
												</IconButton>
												<div className="w-20">
													<TextField
														variant="outlined"
														type="number"
														value={String(item.points || "")}
														onChange={(val) => {
															const parsed = parseFloat(val);
															onChangeItem(student.id, {
																points: Number.isNaN(parsed) ? 0 : parsed,
																category: item.category || defaultCategory,
															});
														}}
														placeholder="0"
														fullWidth
													/>
												</div>
												<IconButton
													size="sm"
													onClick={() =>
														onChangeItem(student.id, {
															points: (item.points || 0) + 1,
															category: item.category || defaultCategory,
														})
													}
													aria-label="Tăng 1 điểm"
													className="text-m3-primary hover:bg-m3-primary/10"
												>
													<Icon name="add" size={16} />
												</IconButton>
											</div>
										</td>

										{/* Category Selector */}
										<td className="py-3 px-4">
											<Select
												variant="outlined"
												options={CATEGORY_OPTIONS}
												value={item.category || defaultCategory}
												onChange={(val) =>
													onChangeItem(student.id, { category: val })
												}
												fullWidth
											/>
										</td>

										{/* Reason Input */}
										<td className="py-3 px-4">
											<TextField
												variant="outlined"
												placeholder="Lý do ghi nhận điểm cộng..."
												value={item.reason}
												onChange={(val) =>
													onChangeItem(student.id, { reason: val })
												}
												fullWidth
											/>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</ScrollArea>
			</div>
		</div>
	);
};
