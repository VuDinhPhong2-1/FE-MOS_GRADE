// src/features/manual-grading/ManualGradingToolbar.tsx
import {
	Button,
	Card,
	Chip,
	Icon,
	IconButton,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";

interface ManualGradingToolbarProps {
	assignmentName: string;
	className: string;
	maxScore: number;
	totalStudents: number;
	gradedCount: number;
	hasUnsavedChanges: boolean;
	isSaving: boolean;
	onSaveAll: () => void;
	onBack: () => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

export const ManualGradingToolbar: React.FC<ManualGradingToolbarProps> = ({
	assignmentName,
	className,
	maxScore,
	totalStudents,
	gradedCount,
	hasUnsavedChanges,
	isSaving,
	onSaveAll,
	onBack,
	searchQuery,
	onSearchChange,
}) => {
	const progressPercent =
		totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0;

	return (
		<Card
			variant="filled"
			className="p-4 sm:p-5 rounded-m3-xl mb-4 bg-m3-surface-container-low border border-m3-outline-variant/40"
		>
			<div className="flex flex-col gap-4">
				{/* Top row: Back button, Title & Badges, Save Button */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<IconButton
							size="md"
							onClick={onBack}
							aria-label="Quay lại danh sách bài tập"
							className="text-m3-on-surface-variant hover:bg-m3-surface-container-high"
						>
							<Icon name="arrow_back" size={24} />
						</IconButton>
						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="text-xl sm:text-2xl font-bold text-m3-on-surface">
									{assignmentName}
								</h1>
								<Chip
									variant="assist"
									label={`Thang điểm: ${maxScore}`}
									leadingIcon={
										<Icon name="grade" size={16} className="text-m3-primary" />
									}
									className="pointer-events-none h-6 px-2.5 text-xs font-semibold"
								/>
								<Chip
									variant="assist"
									label="Bài kiểm tra không nộp file"
									leadingIcon={
										<Icon
											name="assignment"
											size={16}
											className="text-m3-tertiary"
										/>
									}
									className="pointer-events-none h-6 px-2.5 text-xs font-medium bg-m3-tertiary-container/30 text-m3-on-tertiary-container"
								/>
							</div>
							<Text variant="body-md" className="text-sm text-m3-on-surface-variant mt-0.5">
								Lớp:{" "}
								<span className="font-semibold text-m3-on-surface">
									{className}
								</span>{" "}
								• Đã nhập:{" "}
								<span className="font-semibold text-m3-primary">
									{gradedCount}
								</span>
								/{totalStudents} học sinh ({progressPercent}%)
							</Text>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							colorStyle="filled"
							onClick={onSaveAll}
							disabled={!hasUnsavedChanges || isSaving}
							className="font-medium px-5"
						>
							<Icon
								name={isSaving ? "hourglass_empty" : "save"}
								size={18}
								className="mr-1"
							/>
							{isSaving ? "Đang lưu..." : "Lưu tất cả điểm"}
						</Button>
					</div>
				</div>

				{/* Search filter row */}
				<div className="flex items-center justify-between gap-3 pt-2 border-t border-m3-outline-variant/30">
					<div className="w-full sm:w-80">
						<TextField
							variant="outlined"
							placeholder="Tìm kiếm học sinh theo họ tên..."
							value={searchQuery}
							onChange={(val) => onSearchChange(val)}
							leadingIcon={<Icon name="search" size={20} />}
							fullWidth
						/>
					</div>
					{hasUnsavedChanges && (
						<div className="flex items-center gap-1.5 text-xs font-medium text-m3-error bg-m3-error-container/40 px-3 py-1.5 rounded-m3-full">
							<Icon name="info" size={16} />
							<span>Có điểm số chưa lưu!</span>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
};
