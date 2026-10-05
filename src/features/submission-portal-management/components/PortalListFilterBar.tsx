import { Button, Icon, Select, type SelectOption } from "@bug-on/m3-expressive";
import type React from "react";
import { cn } from "../../../utils/utils";

interface PortalListFilterBarProps {
	scopeFilter: "all" | "teacher";
	onScopeChange: (scope: "all" | "teacher") => void;
	selectedClassId: string;
	onClassChange: (classId: string) => void;
	classOptions: SelectOption[];
	totalCount: number;
	filteredCount: number;
	onResetFilters: () => void;
	hasActiveFilters: boolean;
	userRole?: string;
}

export const PortalListFilterBar: React.FC<PortalListFilterBarProps> = ({
	scopeFilter,
	onScopeChange,
	selectedClassId,
	onClassChange,
	classOptions,
	totalCount,
	filteredCount,
	onResetFilters,
	hasActiveFilters,
}) => {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-m3-surface-container p-3 sm:p-4">
			{/* Left controls: Filter 1 (Scope) & Filter 2 (Class) */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Bộ lọc 1: Tất cả vs Lớp trực thuộc của giáo viên */}
				<div className="inline-flex items-center rounded-m3-full bg-m3-surface-container-high p-1 border border-m3-outline-variant/30">
					<button
						type="button"
						onClick={() => onScopeChange("all")}
						className={cn(
							"flex items-center gap-1.5 rounded-m3-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
							scopeFilter === "all"
								? "bg-m3-primary text-m3-on-primary shadow-xs"
								: "text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest",
						)}
					>
						<Icon name="public" size={16} />
						<span>Tất cả</span>
					</button>

					<button
						type="button"
						onClick={() => onScopeChange("teacher")}
						className={cn(
							"flex items-center gap-1.5 rounded-m3-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
							scopeFilter === "teacher"
								? "bg-m3-primary text-m3-on-primary shadow-xs"
								: "text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest",
						)}
					>
						<Icon name="school" size={16} />
						<span>Lớp trực thuộc của giáo viên</span>
					</button>
				</div>

				{/* Bộ lọc 2: Chọn lớp */}
				<div className="w-52 sm:w-60">
					<Select
						variant="outlined"
						label="Chọn lớp"
						options={classOptions}
						value={selectedClassId}
						onChange={onClassChange}
						className="w-full"
					/>
				</div>

				{/* Xóa bộ lọc nếu đang áp dụng */}
				{hasActiveFilters && (
					<Button
						colorStyle="text"
						size="sm"
						icon={<Icon name="filter_alt_off" size={16} />}
						onClick={onResetFilters}
						className="text-xs font-semibold text-m3-primary hover:bg-m3-primary/10"
					>
						Xóa bộ lọc
					</Button>
				)}
			</div>

			{/* Right summary indicator */}
			<div className="flex items-center gap-2 text-xs text-m3-on-surface-variant">
				<Icon name="tune" size={16} className="text-m3-primary" />
				<span>
					Hiển thị{" "}
					<strong className="text-m3-on-surface">{filteredCount}</strong> /{" "}
					{totalCount} cổng nộp bài
				</span>
			</div>
		</div>
	);
};
