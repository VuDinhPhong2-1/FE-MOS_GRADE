import { Button, Card, Icon, type SelectOption } from "@bug-on/m3-expressive";
import type React from "react";
import type { SubmissionPortal } from "../../../types/submission-portal.types";
import { PortalActionToolbar } from "./PortalActionToolbar";
import { PortalCard } from "./PortalCard";

interface PortalListProps {
	portals: SubmissionPortal[];
	scopeFilter: "all" | "teacher";
	onScopeChange: (scope: "all" | "teacher") => void;
	selectedClassId: string;
	onClassChange: (classId: string) => void;
	classOptions: SelectOption[];
	onResetFilters: () => void;
	hasActiveFilters: boolean;
	publicOrigin: string;
	selectedPortalId?: string;
	onOpenCreate: () => void;
	onCopyUrl: (url: string) => void;
	onOpenDetails: (portal: SubmissionPortal) => void;
	onEdit: (portal: SubmissionPortal) => void;
	onDelete: (portal: SubmissionPortal) => void;
	isActionDisabled?: boolean;
	searchQuery?: string;
	onSearchQueryChange?: (query: string) => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (isActive: boolean) => void;
}

export const PortalList: React.FC<PortalListProps> = ({
	portals,
	scopeFilter,
	onScopeChange,
	selectedClassId,
	onClassChange,
	classOptions,
	onResetFilters,
	hasActiveFilters,
	publicOrigin,
	selectedPortalId,
	onOpenCreate,
	onCopyUrl,
	onOpenDetails,
	onEdit,
	onDelete,
	isActionDisabled,
	searchQuery = "",
	onSearchQueryChange = () => {},
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
}) => {
	return (
		<section className="space-y-4">
			{/* Floating Action Toolbar với Tìm kiếm, Bộ lọc và FAB Tạo link */}
			<PortalActionToolbar
				scopeFilter={scopeFilter}
				onScopeChange={onScopeChange}
				selectedClassId={selectedClassId}
				onClassChange={onClassChange}
				classOptions={classOptions}
				onResetFilters={onResetFilters}
				hasActiveFilters={hasActiveFilters}
				searchQuery={searchQuery}
				onSearchQueryChange={onSearchQueryChange}
				isSearchActive={isSearchActive}
				onOpenSearch={onOpenSearch}
				onCloseSearch={onCloseSearch}
				onSearchActiveChange={onSearchActiveChange}
				onOpenCreate={onOpenCreate}
			/>

			{/* Portals Grid */}
			<div className="grid gap-4 xl:grid-cols-2 items-start">
				{portals.map((portal) => (
					<PortalCard
						key={portal.id}
						portal={portal}
						publicOrigin={publicOrigin}
						isSelected={selectedPortalId === portal.id}
						onCopyUrl={onCopyUrl}
						onOpenDetails={onOpenDetails}
						onEdit={onEdit}
						onDelete={onDelete}
						isActionDisabled={isActionDisabled}
					/>
				))}

				{/* Filtered Empty State */}
				{portals.length === 0 && hasActiveFilters && (
					<Card
						variant="filled"
						className="bg-m3-surface-container-low flex flex-col items-center justify-center p-10 text-center xl:col-span-2"
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-m3-full bg-m3-surface-container-highest text-m3-on-surface-variant">
							<Icon name="filter_list_off" size={32} />
						</div>
						<h3 className="mt-4 text-lg font-bold text-m3-on-surface">
							Không tìm thấy cổng nộp bài phù hợp
						</h3>
						<p className="mt-1 max-w-md text-sm text-m3-on-surface-variant">
							Không có cổng nộp bài nào khớp với bộ lọc hoặc từ khóa tìm kiếm đã
							chọn.
						</p>
						<div className="mt-5">
							<Button
								colorStyle="tonal"
								icon={<Icon name="filter_alt_off" />}
								onClick={onResetFilters}
							>
								Xóa bộ lọc & tìm kiếm
							</Button>
						</div>
					</Card>
				)}

				{/* Global Empty State */}
				{portals.length === 0 && !hasActiveFilters && (
					<Card
						variant="filled"
						className="bg-m3-surface-container-low flex flex-col items-center justify-center p-10 text-center xl:col-span-2"
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-m3-full bg-m3-primary-container text-m3-on-primary-container">
							<Icon name="link_off" size={32} />
						</div>
						<h3 className="mt-4 text-lg font-bold text-m3-on-surface">
							Chưa có link nộp bài nào đang mở
						</h3>
						<p className="mt-1 max-w-md text-sm text-m3-on-surface-variant">
							Tạo link mới để học sinh chọn trường, chọn lớp, chọn bài tập và
							nộp bài thi chấm tự động qua cổng công khai.
						</p>
						<div className="mt-5">
							<Button
								colorStyle="filled"
								icon={<Icon name="add" />}
								onClick={onOpenCreate}
							>
								Tạo link đầu tiên
							</Button>
						</div>
					</Card>
				)}
			</div>
		</section>
	);
};
