import {
	Button,
	Card,
	Chip,
	Icon,
	IconButton,
	Select,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo, useState } from "react";
import type { ScheduleAttendanceResponse } from "../../types/schedule.types";
import type { AttendanceDraftState } from "./types";

interface BonusTabContentProps {
	attendanceData: ScheduleAttendanceResponse | null;
	attendanceDraft: Record<string, AttendanceDraftState>;
	bonusDraft: Record<
		string,
		{ points: number; reason: string; category: string }
	>;
	onUpdateBonus: (
		studentId: string,
		updates: Partial<{ points: number; reason: string; category: string }>,
	) => void;
	onSaveBonus: () => void;
	bonusSaving: boolean;
}

const CATEGORY_OPTIONS = [
	{ value: "participation", label: "Phát biểu / Tham gia tích cực" },
	{ value: "behavior", label: "Ý thức / Tác phong tốt" },
	{ value: "achievement", label: "Hoàn thành xuất sắc bài tập" },
];

export const BonusTabContent: React.FC<BonusTabContentProps> = ({
	attendanceData,
	attendanceDraft,
	bonusDraft,
	onUpdateBonus,
	onSaveBonus,
	bonusSaving,
}) => {
	const [searchKeyword, setSearchKeyword] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("participation");

	const students = attendanceData?.students || [];

	const filteredStudents = useMemo(() => {
		if (!searchKeyword.trim()) return students;
		const q = searchKeyword.toLowerCase().trim();
		return students.filter((s) => s.fullName.toLowerCase().includes(q));
	}, [students, searchKeyword]);

	const bonusCount = useMemo(() => {
		return Object.values(bonusDraft).filter(
			(item) => item.points !== 0 || item.reason.trim() !== "",
		).length;
	}, [bonusDraft]);

	const totalDraftPoints = useMemo(() => {
		return Object.values(bonusDraft).reduce(
			(acc, item) => acc + (item.points || 0),
			0,
		);
	}, [bonusDraft]);

	return (
		<div className="flex flex-col gap-4 animate-fadeIn">
			{/* Header Card */}
			<Card
				variant="filled"
				className="p-4 rounded-2xl bg-m3-surface-container-lowest flex flex-wrap items-center justify-between gap-3"
			>
				<div>
					<div className="flex items-center gap-2 flex-wrap">
						<h3 className="text-base font-bold text-m3-on-surface">
							Ghi nhận điểm cộng buổi học
						</h3>
						<Chip
							variant="assist"
							label={`Đang ghi nhận: ${bonusCount} học sinh (${totalDraftPoints > 0 ? `+${totalDraftPoints}` : totalDraftPoints} điểm)`}
							leadingIcon={
								<Icon
									name="star"
									size={16}
									className="text-m3-on-primary-container"
								/>
							}
							className="pointer-events-none h-6 px-2.5 text-xs font-semibold bg-m3-primary-container text-m3-on-primary-container"
						/>
					</div>
					<p className="text-xs text-m3-on-surface-variant mt-1">
						Cộng điểm phát biểu, làm bài tốt hoặc ý thức trong buổi học này.
						Điểm sẽ được tính vào bảng xếp hạng chung.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						colorStyle="filled"
						onClick={onSaveBonus}
						disabled={bonusCount === 0 || bonusSaving}
						className="font-medium text-sm"
						loading={bonusSaving}
					>
						<Icon
							name={bonusSaving ? "hourglass_empty" : "save"}
							size={18}
							className="mr-1"
						/>
						{bonusSaving ? "Đang lưu..." : "Lưu điểm cộng"}
					</Button>
				</div>
			</Card>

			{/* Filter row */}
			<div className="flex flex-row items-center gap-3">
				<div className="w-full">
					<TextField
						variant="outlined"
						placeholder="Tìm học sinh theo tên..."
						value={searchKeyword}
						onChange={(val) => setSearchKeyword(val)}
						leadingIcon={<Icon name="search" size={20} />}
						fullWidth
					/>
				</div>
				<div className="w-full">
					<Select
						variant="outlined"
						label="Loại điểm mặc định"
						options={CATEGORY_OPTIONS}
						value={selectedCategory}
						onChange={(val) => setSelectedCategory(val)}
						fullWidth
						colorVariant="vibrant"
					/>
				</div>
			</div>

			{/* Student List */}
			<div className="overflow-x-auto rounded-2xl border border-m3-outline-variant/40 bg-m3-surface">
				<table className="min-w-175 w-full text-left border-collapse text-sm">
					<thead>
						<tr className="bg-m3-surface-container border-b border-m3-outline-variant/40 text-xs font-semibold text-m3-on-surface-variant uppercase">
							<th className="py-2.5 px-3 w-10 text-center">STT</th>
							<th className="py-2.5 px-3 min-w-45">Học sinh</th>
							<th className="py-2.5 px-3 w-28 text-center">Điểm danh</th>
							<th className="py-2.5 px-3 w-48 text-center">Điểm cộng</th>
							<th className="py-2.5 px-3 min-w-50">Lý do / Nội dung</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-m3-outline-variant/20">
						{filteredStudents.map((student, idx) => {
							const currentBonus = bonusDraft[student.studentId] ?? {
								points: 0,
								reason: "",
								category: selectedCategory,
							};
							const attendanceState =
								attendanceDraft[student.studentId]?.status ??
								student.attendanceStatus ??
								"Present";
							const isPresent = attendanceState === "Present";

							return (
								<tr
									key={student.studentId}
									className={`transition-colors hover:bg-m3-surface-container-low/50 ${
										currentBonus.points > 0 ? "bg-m3-primary-container/10" : ""
									}`}
								>
									<td className="py-2 px-3 text-center text-xs font-medium text-m3-on-surface-variant/70">
										{idx + 1}
									</td>
									<td className="py-2 px-3">
										<p className="font-semibold text-m3-on-surface">
											{student.fullName}
										</p>
									</td>
									<td className="py-2 px-3 text-center">
										<Chip
											variant="assist"
											label={isPresent ? "Có mặt" : "Vắng"}
											leadingIcon={
												<Icon
													name={isPresent ? "check_circle" : "cancel"}
													size={14}
													className={
														isPresent ? "text-m3-primary" : "text-m3-error"
													}
												/>
											}
											className={`pointer-events-none h-6 px-2 text-xs font-medium ${
												isPresent
													? "bg-m3-primary-container/30 text-m3-primary"
													: "bg-m3-error-container/30 text-m3-error"
											}`}
										/>
									</td>
									{/* Điểm cộng buttons + input */}
									<td className="py-2 px-3">
										<div className="flex items-center justify-center gap-1.5">
											<IconButton
												size="sm"
												onClick={() =>
													onUpdateBonus(student.studentId, {
														points: Math.max(
															-10,
															(currentBonus.points || 0) - 1,
														),
														category: currentBonus.category || selectedCategory,
													})
												}
												aria-label="Giảm 1 điểm"
												className="h-8 w-8 hover:bg-m3-surface-container-high"
											>
												<Icon name="remove" size={16} />
											</IconButton>
											<div className="w-16">
												<TextField
													variant="outlined"
													type="number"
													value={String(currentBonus.points || "")}
													onChange={(val) => {
														const parsed = parseFloat(val);
														onUpdateBonus(student.studentId, {
															points: isNaN(parsed) ? 0 : parsed,
															category:
																currentBonus.category || selectedCategory,
														});
													}}
													placeholder="0"
													fullWidth
												/>
											</div>
											<IconButton
												size="sm"
												onClick={() =>
													onUpdateBonus(student.studentId, {
														points: (currentBonus.points || 0) + 1,
														category: currentBonus.category || selectedCategory,
													})
												}
												aria-label="Tăng 1 điểm"
												className="h-8 w-8 text-m3-primary hover:bg-m3-primary/10"
											>
												<Icon name="add" size={16} />
											</IconButton>
										</div>
									</td>
									{/* Reason Input */}
									<td className="py-2 px-3">
										<TextField
											variant="outlined"
											placeholder="Lý do cộng điểm (phát biểu, bài tập...)"
											value={currentBonus.reason}
											onChange={(val) =>
												onUpdateBonus(student.studentId, {
													reason: val,
													category: currentBonus.category || selectedCategory,
												})
											}
											fullWidth
										/>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};
