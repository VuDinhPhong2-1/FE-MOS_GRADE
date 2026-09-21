import {
	Card,
	Chip,
	FAB,
	Icon,
	List,
	ListItem,
	PlainTooltip,
	ShapeMedia,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import type React from "react";
import { FloatingActionToolbar } from "../../../components/common/floating-action-toolbar";
import type { GradingMode } from "../types/gradingFeature.types";

interface AssignmentItem {
	id: string;
	name: string;
	maxScore: number;
}

interface GradingModeSelectorProps {
	onSelectMode: (mode: GradingMode) => void;
	activeAutoAssignmentCount: number;
	activeAutoAssignments?: AssignmentItem[];
	onSelectAssignment?: (id: string) => void;
	onBack?: () => void;
}

export const GradingModeSelector: React.FC<GradingModeSelectorProps> = ({
	onSelectMode,
	activeAutoAssignmentCount,
	activeAutoAssignments = [],
	onSelectAssignment,
	onBack,
}) => {
	const hasAssignments = activeAutoAssignments.length > 0;
	const isMultiDisabled = activeAutoAssignmentCount === 0;

	return (
		<div className="w-full max-w-7xl mx-auto space-y-4">
			{/* Khi đã có bài tập: Hiển thị danh sách dạng List Expressive Segmented */}
			{hasAssignments && (
				<div className="space-y-4">
					<div className="flex items-center justify-between px-2">
						<div className="space-y-1">
							<h3 className="text-xl sm:text-2xl font-bold text-m3-on-surface font-md3-expressive tracking-tight">
								Chọn bài tập để chấm điểm
							</h3>
							<p className="text-xs sm:text-sm text-m3-on-surface-variant">
								Chọn một bài tập từ danh sách bên dưới để bắt đầu chấm điểm cho
								học sinh
							</p>
						</div>
						<Chip
							variant="assist"
							leadingIcon={<Icon name="assignment" size={16} />}
							label={`${activeAutoAssignments.length} bài tập`}
							className="h-8! px-3! rounded-full pointer-events-none text-xs font-semibold"
						/>
					</div>

					<List variant="expressive" listStyle="segmented">
						{activeAutoAssignments.map((assignment, index) => (
							<ListItem
								interactive
								className="bg-m3-surface-container-high! text-m3-on-surface!"
								key={assignment.id}
								value={assignment.id}
								_listIndex={index}
								onClick={() => onSelectAssignment?.(assignment.id)}
								leadingType="custom"
								leadingContent={
									<ShapeMedia
										shape="pill"
										morphOn="hover"
										morphTo="arch"
										className="grid size-11 shrink-0 place-items-center bg-m3-primary-container text-m3-on-primary-container font-bold"
									>
										<Icon name="assignment" size={22} />
									</ShapeMedia>
								}
								headline={
									<span className="truncate block font-bold text-base text-m3-on-surface">
										{assignment.name}
									</span>
								}
								supportingText={
									<span className="text-xs sm:text-sm text-m3-on-surface-variant">
							Mốc bài:{" "}
										<span className="font-semibold text-m3-primary">
								{assignment.maxScore}đ
										</span>
									</span>
								}
								trailingType="custom"
								trailingContent={
									<div className="flex items-center gap-1.5 text-xs font-semibold text-m3-primary group-hover:translate-x-1 transition-transform">
										<span className="hidden sm:inline">Chấm ngay</span>
										<Icon name="arrow_forward" size={18} />
									</div>
								}
							/>
						))}
					</List>
				</div>
			)}

			{/* Mode Selection Grid (Chỉ hiển thị khi chưa có bài tập nào) */}
			{!hasAssignments && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Card 1: Chế độ chấm nhiều bài */}
					<Card
						variant="outlined"
						tabIndex={isMultiDisabled ? -1 : 0}
						aria-disabled={isMultiDisabled}
						onClick={() => {
							if (!isMultiDisabled) {
								onSelectMode("existing-multi");
							}
						}}
						onKeyDown={(e) => {
							if (!isMultiDisabled && (e.key === "Enter" || e.key === " ")) {
								e.preventDefault();
								onSelectMode("existing-multi");
							}
						}}
						disabled={isMultiDisabled}
						className="flex flex-col justify-between p-6 sm:p-7 text-left"
					>
						<div className="space-y-4">
							<div className="h-12 w-12 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-300">
								<Icon name="grid_view" className="text-2xl" />
							</div>
							<div>
								<h4 className="text-lg sm:text-xl font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors font-md3-expressive">
									Chấm nhiều bài (Ma trận)
								</h4>
								<p className="text-xs sm:text-sm text-m3-on-surface-variant mt-2 leading-relaxed">
									Kéo thả toàn bộ thư mục bài nộp hoặc nhiều file cùng lúc. Hệ
									thống tự động đối chiếu tên học sinh và tính điểm chính xác.
								</p>
							</div>
						</div>

						<div className="mt-8 pt-4 border-t border-m3-outline-variant/20 flex items-center justify-between w-full">
							<span className="text-xs font-semibold text-m3-primary">
								{activeAutoAssignmentCount} bài tập khả dụng
							</span>
							<span className="text-xs font-semibold text-m3-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
								Bắt đầu <Icon name="arrow_forward" className="text-sm" />
							</span>
						</div>
					</Card>

					{/* Card 2: Chế độ tạo bài tập mới */}
					<Card
						variant="outlined"
						tabIndex={0}
						onClick={() => onSelectMode("new")}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onSelectMode("new");
							}
						}}
						disableElevation
						className="group flex flex-col justify-between p-6 sm:p-7 bg-m3-surface-container-low text-left cursor-pointer"
					>
						<div className="space-y-4">
							<div className="h-12 w-12 rounded-2xl bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-300">
								<Icon name="add_circle" className="text-2xl" />
							</div>
							<div>
								<h4 className="text-lg sm:text-xl font-bold text-m3-on-surface group-hover:text-m3-secondary transition-colors font-md3-expressive">
									Tạo bài tập mới
								</h4>
								<p className="text-xs sm:text-sm text-m3-on-surface-variant mt-2 leading-relaxed">
									Tạo nhanh hàng loạt bài tập theo mẫu MOS Practice 01, 02, 03
									hoặc Ôn thi chỉ với 1 chạm, cấu hình điểm tối đa và tên hiển
									thị.
								</p>
							</div>
						</div>

						<div className="mt-8 pt-4 border-t border-m3-outline-variant/20 flex items-center justify-between w-full">
							<span className="text-xs font-semibold text-m3-secondary">
								Tạo nhanh 1 chạm
							</span>
							<span className="text-xs font-semibold text-m3-secondary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
								Tạo ngay <Icon name="arrow_forward" className="text-sm" />
							</span>
						</div>
					</Card>

					{/* Card 3: Chế độ quản lý bài tập */}
					<Card
						variant="outlined"
						tabIndex={0}
						onClick={() => onSelectMode("manage")}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onSelectMode("manage");
							}
						}}
						disableElevation
						className="group flex flex-col justify-between p-6 sm:p-7 bg-m3-surface-container-low text-left cursor-pointer"
					>
						<div className="space-y-4">
							<div className="h-12 w-12 rounded-2xl bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-300">
								<Icon name="tune" className="text-2xl" />
							</div>
							<div>
								<h4 className="text-lg sm:text-xl font-bold text-m3-on-surface group-hover:text-m3-tertiary transition-colors font-md3-expressive">
									Quản lý bài tập
								</h4>
								<p className="text-xs sm:text-sm text-m3-on-surface-variant mt-2 leading-relaxed">
									Xem danh sách, chỉnh sửa điểm tối đa, ẩn bài tập cũ hoặc xóa
									bài tập đã tạo trong lớp học với các tác vụ nhanh gọn.
								</p>
							</div>
						</div>

						<div className="mt-8 pt-4 border-t border-m3-outline-variant/20 flex items-center justify-between w-full">
							<span className="text-xs font-semibold text-m3-tertiary">
								Ẩn / Bật / Chỉnh sửa
							</span>
							<span className="text-xs font-semibold text-m3-tertiary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
								Quản lý <Icon name="arrow_forward" className="text-sm" />
							</span>
						</div>
					</Card>
				</div>
			)}

			{/* Floating Action Toolbar */}
			<FloatingActionToolbar
				ariaLabel="Thanh tác vụ điều hướng chấm điểm"
				actions={
					<>
						{/* Nút quay lại danh sách học sinh */}
						{onBack && (
							<TooltipBox
								tooltip={
									<PlainTooltip>Quay lại danh sách học sinh</PlainTooltip>
								}
								placement="top"
							>
								<ToolbarIconButton
									aria-label="Quay lại danh sách học sinh"
									onClick={onBack}
									emphasis="standard"
								>
									<Icon name="arrow_back" size={24} />
								</ToolbarIconButton>
							</TooltipBox>
						)}

						{/* Các action mở rộng khi đã có bài tập */}
						{hasAssignments && (
							<>
								{/* Chấm nhiều bài (Ma trận) */}
								<TooltipBox
									tooltip={
										<PlainTooltip>Chấm nhiều bài (Ma trận)</PlainTooltip>
									}
									placement="top"
								>
									<ToolbarIconButton
										aria-label="Chấm nhiều bài (Ma trận)"
										onClick={() => onSelectMode("existing-multi")}
										emphasis="standard"
									>
										<Icon name="grid_view" size={24} />
									</ToolbarIconButton>
								</TooltipBox>
								{/* Quản lý bài tập */}
								<TooltipBox
									tooltip={<PlainTooltip>Quản lý bài tập</PlainTooltip>}
									placement="top"
								>
									<ToolbarIconButton
										aria-label="Quản lý bài tập"
										onClick={() => onSelectMode("manage")}
										emphasis="standard"
									>
										<Icon name="tune" size={24} />
									</ToolbarIconButton>
								</TooltipBox>
							</>
						)}
					</>
				}
				endFab={
					hasAssignments ? (
						<TooltipBox
							tooltip={<PlainTooltip>Tạo bài tập mới</PlainTooltip>}
							placement="top"
						>
							<FAB
								colorStyle="tertiary"
								size="md"
								onClick={() => onSelectMode("new")}
								aria-label="Tạo bài tập mới"
								icon={<Icon name="contextual_token_add" size={24} />}
							/>
						</TooltipBox>
					) : undefined
				}
			/>
		</div>
	);
};
