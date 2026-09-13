import {
	Card,
	Icon,
	List,
	ListItem,
	ProgressIndicator,
	ScrollArea,
	TextField,
} from "@bug-on/m3-expressive";
import { memo } from "react";
import type { TeacherListPanelProps } from "./types";

export const TeacherListPanel = memo(function TeacherListPanel({
	teachers,
	selectedTeacherId,
	loading,
	searchKeyword,
	onSearchChange,
	onSelectTeacher,
}: TeacherListPanelProps) {
	return (
		<Card
			variant="filled"
			className="rounded-3xl bg-m3-surface-container p-4 shadow-xs text-m3-on-surface border-none flex flex-col gap-3"
		>
			<div className="px-1">
				<h4 className="text-sm font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2">
					Danh sách giáo viên ({teachers.length})
				</h4>
				<TextField
					variant="outlined"
					placeholder="Tìm theo tên, email, username..."
					value={searchKeyword}
					onChange={onSearchChange}
					leadingIcon={<Icon name="search" size={20} />}
					fullWidth
					dense
					className="w-full"
				/>
			</div>

			{loading ? (
				<div className="flex items-center justify-center gap-2 py-8 text-sm text-m3-on-surface-variant">
					<ProgressIndicator
						variant="circular"
						shape="wavy"
						showTrack
						size={20}
						aria-label="Đang tải giáo viên"
					/>
					<span>Đang tải danh sách giáo viên...</span>
				</div>
			) : teachers.length === 0 ? (
				<div className="rounded-2xl border border-m3-outline-variant/40 bg-m3-surface/50 p-4 text-center text-sm text-m3-on-surface-variant">
					Không tìm thấy giáo viên nào phù hợp.
				</div>
			) : (
				<ScrollArea className="max-h-130 pr-1">
					<List
						variant="expressive"
						listStyle="segmented"
						className="space-y-1.5"
					>
						{teachers.map((teacher) => {
							const isSelected = selectedTeacherId === teacher.userId;
							return (
								<ListItem
									key={teacher.userId}
									value={teacher.userId}
									selected={isSelected}
									onClick={() => onSelectTeacher(teacher.userId)}
									headline={
										<span className="truncate block font-bold text-sm">
											{teacher.fullName || teacher.username}
										</span>
									}
									supportingText={teacher.email || teacher.username}
									trailingType="custom"
									trailingContent={
										<span
											className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors ${
												isSelected
													? "bg-m3-primary/20 text-m3-primary font-bold"
													: "bg-m3-surface-container-high text-m3-on-surface-variant"
											}`}
										>
											{teacher.permissions?.length || 0} quyền
										</span>
									}
									className={`cursor-pointer rounded-2xl border transition-all ${
										isSelected
											? "border-m3-primary/40 bg-m3-secondary-container text-m3-on-secondary-container shadow-xs"
											: "border-m3-outline-variant/40 bg-m3-surface text-m3-on-surface hover:bg-m3-surface-container-high/70"
									}`}
								/>
							);
						})}
					</List>
				</ScrollArea>
			)}
		</Card>
	);
});
