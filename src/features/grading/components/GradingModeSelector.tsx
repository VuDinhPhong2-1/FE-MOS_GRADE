import { Card, Icon } from "@bug-on/m3-expressive";
import type React from "react";
import type { GradingMode } from "../types/gradingFeature.types";

interface GradingModeSelectorProps {
	onSelectMode: (mode: GradingMode) => void;
	activeAutoAssignmentCount: number;
}

export const GradingModeSelector: React.FC<GradingModeSelectorProps> = ({
	onSelectMode,
	activeAutoAssignmentCount,
}) => {
	const isMultiDisabled = activeAutoAssignmentCount === 0;

	return (
		<div className="flex-1 flex flex-col items-center justify-center gap-8 py-16 px-4">
			<div className="text-center space-y-2 max-w-lg">
				<h3 className="text-2xl font-bold text-m3-on-surface font-md3-expressive">
					Bảng điều khiển chấm điểm
				</h3>
				<p className="text-sm text-m3-on-surface-variant">
					Chọn chế độ làm việc phù hợp để bắt đầu chấm bài tập hoặc quản lý đề
					thi cho lớp học.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
				{/* Chế độ chấm nhiều bài */}
				<Card
					variant="outlined"
					tabIndex={isMultiDisabled ? -1 : 0}
					role="button"
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
					className={`group flex flex-col justify-between p-6 rounded-3xl hover:rounded-xl text-left transition-all duration-300 ${
						!isMultiDisabled
							? "border-m3-outline-variant/40 bg-m3-surface-container-low hover:bg-m3-surface-container hover:border-m3-primary/50 cursor-pointer shadow-xs hover:shadow-md"
							: "border-m3-outline-variant/20 bg-m3-surface-container-lowest opacity-50 cursor-not-allowed"
					}`}
				>
					<div className="space-y-4">
						<div className="h-12 w-12 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-2xs">
							<Icon name="grid_view" className="text-2xl" />
						</div>
						<div>
							<h4 className="text-lg font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
								Chấm nhiều bài (Ma trận)
							</h4>
							<p className="text-xs text-m3-on-surface-variant mt-1 leading-relaxed">
								Kéo thả toàn bộ thư mục hoặc nhiều file cùng lúc. Hệ thống tự
								nhận diện học sinh và phân bổ bài tập tự động.
							</p>
						</div>
					</div>

					<div className="mt-6 pt-4 border-t border-m3-outline-variant/20 flex items-center justify-between w-full">
						<span className="text-xs font-semibold text-m3-primary">
							{activeAutoAssignmentCount} bài tập khả dụng
						</span>
						<span className="text-xs font-semibold text-m3-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
							Bắt đầu <Icon name="arrow_forward" className="text-sm" />
						</span>
					</div>
				</Card>

				{/* Chế độ tạo bài tập mới */}
				<Card
					variant="outlined"
					tabIndex={0}
					role="button"
					onClick={() => onSelectMode("new")}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onSelectMode("new");
						}
					}}
					className="group flex flex-col justify-between p-6 rounded-3xl hover:rounded-xl border-m3-outline-variant/40 bg-m3-surface-container-low hover:bg-m3-surface-container hover:border-m3-secondary/50 text-left cursor-pointer shadow-xs hover:shadow-md transition-all duration-300"
				>
					<div className="space-y-4">
						<div className="h-12 w-12 rounded-2xl bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center shadow-2xs">
							<Icon name="add_circle" className="text-2xl" />
						</div>
						<div>
							<h4 className="text-lg font-bold text-m3-on-surface group-hover:text-m3-secondary transition-colors">
								Tạo bài tập mới
							</h4>
							<p className="text-xs text-m3-on-surface-variant mt-1 leading-relaxed">
								Tạo nhanh hàng loạt bài tập theo mẫu MOS Practice 01, Practice
								02, Practice 03 hoặc Ôn thi có sẵn.
							</p>
						</div>
					</div>

					<div className="mt-6 pt-4 border-t border-m3-outline-variant/20 flex items-center justify-between w-full">
						<span className="text-xs font-semibold text-m3-secondary">
							Hỗ trợ Excel & Word
						</span>
						<span className="text-xs font-semibold text-m3-secondary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
							Tạo ngay <Icon name="arrow_forward" className="text-sm" />
						</span>
					</div>
				</Card>

				{/* Chế độ quản lý bài tập */}
				<Card
					variant="outlined"
					tabIndex={0}
					role="button"
					onClick={() => onSelectMode("manage")}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onSelectMode("manage");
						}
					}}
					className="group flex flex-col justify-between p-6 rounded-3xl hover:rounded-xl border-m3-outline-variant/40 bg-m3-surface-container-low hover:bg-m3-surface-container hover:border-m3-tertiary/50 text-left cursor-pointer shadow-xs hover:shadow-md transition-all duration-300"
				>
					<div className="space-y-4">
						<div className="h-12 w-12 rounded-2xl bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center shadow-2xs">
							<Icon name="settings" className="text-2xl" />
						</div>
						<div>
							<h4 className="text-lg font-bold text-m3-on-surface group-hover:text-m3-tertiary transition-colors">
								Quản lý bài tập
							</h4>
							<p className="text-xs text-m3-on-surface-variant mt-1 leading-relaxed">
								Xem danh sách, chỉnh sửa điểm tối đa, ẩn bài tập cũ hoặc xóa bài
								tập đã tạo trong lớp học.
							</p>
						</div>
					</div>

					<div className="mt-6 pt-4 border-t border-m3-outline-variant/20 flex items-center justify-between w-full">
						<span className="text-xs font-semibold text-m3-tertiary">
							Bật / ẩn / chỉnh sửa
						</span>
						<span className="text-xs font-semibold text-m3-tertiary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
							Quản lý <Icon name="arrow_forward" className="text-sm" />
						</span>
					</div>
				</Card>
			</div>
		</div>
	);
};
