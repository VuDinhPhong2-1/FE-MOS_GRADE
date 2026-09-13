import {
	Button,
	ButtonGroup,
	Card,
	Icon,
	List,
	LoadingIndicator,
} from "@bug-on/m3-expressive";
import { memo } from "react";
import { TeacherRequestCard } from "./TeacherRequestCard";
import type {
	TeacherRequestListProps,
	TeacherRequestStatusFilter,
} from "./types";

const STATUS_FILTERS: {
	value: TeacherRequestStatusFilter;
	label: string;
	icon: string;
}[] = [
	{ value: "pending", label: "Đang chờ", icon: "pending" },
	{ value: "approved", label: "Đã duyệt", icon: "check_circle" },
	{ value: "rejected", label: "Đã từ chối", icon: "cancel" },
	{ value: "all", label: "Tất cả", icon: "list_alt" },
];

export const TeacherRequestList = memo(function TeacherRequestList({
	requests,
	requestLoading,
	requestStatus,
	onRequestStatusChange,
	decisionNotes,
	decidingUserId,
	onNoteChange,
	onDecide,
}: TeacherRequestListProps) {
	return (
		<Card variant="filled" className="p-4 sm:p-6">
			<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h3 className="text-lg font-bold text-m3-on-surface">
						Yêu cầu đăng ký giáo viên
					</h3>
					<p className="text-sm text-m3-on-surface-variant">
						Duyệt hoặc từ chối tài khoản giáo viên mới đăng ký trong hệ thống.
					</p>
				</div>

				<ButtonGroup variant="connected" size="sm">
					{STATUS_FILTERS.map((filter) => {
						const isSelected = requestStatus === filter.value;
						return (
							<Button
								key={filter.value}
								type="button"
								variant="toggle"
								selected={isSelected}
								colorStyle="filled"
								onClick={() => onRequestStatusChange(filter.value)}
								icon={
									<Icon
										name={filter.icon}
										animateFill
										fill={isSelected ? 1 : 0}
										size={20}
									/>
								}
							>
								{filter.label}
							</Button>
						);
					})}
				</ButtonGroup>
			</div>

			{requestLoading ? (
				<div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-m3-on-surface-variant">
					<LoadingIndicator size={64} aria-label="Đang tải yêu cầu giáo viên" />
					<span>Đang tải danh sách yêu cầu...</span>
				</div>
			) : requests.length === 0 ? (
				<div className="px-6 py-12 text-center">
					<div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-3 text-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-m3-surface-container-high text-m3-on-surface-variant">
							<Icon name="person_search" size={30} />
						</div>
						<div>
							<p className="font-bold text-m3-on-surface">
								Không có yêu cầu phù hợp
							</p>
							<p className="mt-1 text-xs text-m3-on-surface-variant">
								Hiện không có yêu cầu phê duyệt giáo viên nào ở trạng thái này.
							</p>
						</div>
					</div>
				</div>
			) : (
				<List variant="expressive" listStyle="segmented" className="w-full">
					{requests.map((request) => (
						<TeacherRequestCard
							key={request.userId}
							value={request.userId}
							request={request}
							decisionNote={decisionNotes[request.userId] || ""}
							isBusy={decidingUserId === request.userId}
							onNoteChange={onNoteChange}
							onDecide={onDecide}
						/>
					))}
				</List>
			)}
		</Card>
	);
});
