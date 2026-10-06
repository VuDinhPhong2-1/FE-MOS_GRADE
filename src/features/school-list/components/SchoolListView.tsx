import { Button, Card, Icon, List } from "@bug-on/m3-expressive";
import { memo } from "react";
import { TableEmptyState } from "../../../components/data-table";
import type { SchoolListViewProps } from "../types";
import { SchoolListItem } from "./SchoolListItem";

export const SchoolListView = memo(function SchoolListView({
	schools,
	isLoading,
	canDeleteSchool,
	isDeleting,
	schoolToDelete,
	onSelectSchool,
	onEditSchool,
	onDeleteSchool,
	onOpenAddModal,
	hasActiveFilters,
	onResetFilters,
}: SchoolListViewProps) {
	if (isLoading && schools.length === 0) {
		return (
			<div className="w-full space-y-0.5 animate-pulse">
				{[1, 2, 3, 4, 5, 6].map((key) => (
					<div
						key={key}
						className="flex items-center justify-between h-18 px-4 bg-m3-surface-container-high/40 rounded-xl"
					>
						<div className="flex items-center gap-3">
							<div className="size-7 rounded-full bg-m3-surface-container-highest" />
							<div className="h-6 w-20 rounded-lg bg-m3-surface-container-highest" />
							<div className="space-y-1.5 ml-2">
								<div className="h-4 w-48 rounded bg-m3-surface-container-highest" />
								<div className="h-3 w-64 rounded bg-m3-surface-container-highest/60" />
							</div>
						</div>
						<div className="flex gap-2">
							<div className="size-8 rounded-full bg-m3-surface-container-highest" />
							<div className="size-8 rounded-full bg-m3-surface-container-highest" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (schools.length === 0) {
		return (
			<Card
				variant="outlined"
				className="w-full border-m3-outline-variant/30 bg-m3-surface-container-low/50"
			>
				<TableEmptyState
					icon={hasActiveFilters ? "search_off" : "domain_disabled"}
					title={
						hasActiveFilters
							? "Không tìm thấy trường nào"
							: "Chưa có trường nào"
					}
					description={
						hasActiveFilters
							? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái."
							: 'Hãy bấm nút "Thêm trường" để bắt đầu thiết lập cơ sở đầu tiên.'
					}
					action={
						hasActiveFilters ? (
							<Button
								colorStyle="tonal"
								size="sm"
								icon={<Icon name="filter_alt_off" className="text-base" />}
								onClick={onResetFilters}
							>
								Đặt lại bộ lọc
							</Button>
						) : (
							<Button
								colorStyle="filled"
								size="sm"
								icon={<Icon name="add" className="text-base" />}
								onClick={onOpenAddModal}
							>
								Thêm trường mới
							</Button>
						)
					}
				/>
			</Card>
		);
	}

	return (
		<div className="w-full">
			<List variant="expressive" listStyle="segmented" className="w-full">
				{schools.map((school, index) => (
					<SchoolListItem
						key={school.id}
						school={school}
						index={index}
						canDeleteSchool={canDeleteSchool}
						isDeleting={isDeleting}
						isCurrentDeleting={isDeleting && schoolToDelete?.id === school.id}
						onSelect={onSelectSchool}
						onEdit={onEditSchool}
						onDelete={onDeleteSchool}
					/>
				))}
			</List>
		</div>
	);
});
