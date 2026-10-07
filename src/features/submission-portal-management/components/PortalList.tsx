import { Button, Card, Icon, Text } from "@bug-on/m3-expressive";
import { useReducedMotion } from "motion/react";
import type React from "react";
import { memo, useEffect, useRef } from "react";
import type { SubmissionPortal } from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";
import { PortalCard } from "./PortalCard";

interface PortalListProps {
	portals: SubmissionPortal[];
	publicOrigin: string;
	onOpenCreate: () => void;
	onCopyUrl: (url: string) => void;
	onOpenDetails: (portal: SubmissionPortal) => void;
	onEdit: (portal: SubmissionPortal) => void;
	onDelete: (portal: SubmissionPortal) => void;
	selectedPortalId?: string;
	isActionDisabled?: boolean;
	hasActiveFilters?: boolean;
	onResetFilters?: () => void;
	isDetailOpen?: boolean;
}

const PortalListComponent: React.FC<PortalListProps> = ({
	portals,
	publicOrigin,
	selectedPortalId,
	onOpenCreate,
	onCopyUrl,
	onOpenDetails,
	onEdit,
	onDelete,
	isActionDisabled,
	hasActiveFilters = false,
	onResetFilters,
	isDetailOpen = false,
}) => {
	const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
	const prevIsDetailOpenRef = useRef(isDetailOpen);
	const shouldReduceMotion = useReducedMotion();

	// Tự động scroll card đang được chọn vào tầm nhìn khi detail mở hoặc portal thay đổi
	useEffect(() => {
		if (!selectedPortalId) {
			prevIsDetailOpenRef.current = isDetailOpen;
			return;
		}

		const wasDetailOpen = prevIsDetailOpenRef.current;
		prevIsDetailOpenRef.current = isDetailOpen;

		const scrollToCard = () => {
			const targetEl = cardRefs.current.get(selectedPortalId);
			if (!targetEl) return;

			const viewport = targetEl.closest<HTMLElement>(
				"[data-radix-scroll-area-viewport]",
			);

			if (viewport) {
				const viewportRect = viewport.getBoundingClientRect();
				const targetRect = targetEl.getBoundingClientRect();
				const currentScrollTop = viewport.scrollTop;
				// Khoảng cách an toàn tối thiểu dưới sticky toolbar (~88px)
				const minTopOffset = 88;
				const desiredTopOffset = Math.max(
					minTopOffset,
					(viewportRect.height - targetRect.height) / 2,
				);
				const targetScrollTop = Math.max(
					0,
					currentScrollTop +
						(targetRect.top - viewportRect.top) -
						desiredTopOffset,
				);

				viewport.scrollTo({
					top: targetScrollTop,
					behavior: shouldReduceMotion ? "auto" : "smooth",
				});
			} else {
				targetEl.scrollIntoView({
					behavior: shouldReduceMotion ? "auto" : "smooth",
					block: "center",
					inline: "nearest",
				});
			}
		};

		// Nếu vừa mở detail (chuyển từ đóng sang mở), cần chờ transition width 300ms của layout ổn định
		if (isDetailOpen && !wasDetailOpen && !shouldReduceMotion) {
			const timerId = window.setTimeout(() => {
				requestAnimationFrame(scrollToCard);
			}, 320);

			return () => {
				window.clearTimeout(timerId);
			};
		}

		// Nếu detail đã mở sẵn hoặc reduced motion, cuộn ngay ở frame tiếp theo
		const rafId = requestAnimationFrame(scrollToCard);
		return () => {
			cancelAnimationFrame(rafId);
		};
	}, [selectedPortalId, isDetailOpen, shouldReduceMotion]);

	return (
		<section className="space-y-4">
			<div
				className={cn(
					"grid gap-4 items-start",
					isDetailOpen ? "grid-cols-1" : "xl:grid-cols-2",
				)}
			>
				{portals.map((portal) => (
					<PortalCard
						key={portal.id}
						ref={(node) => {
							if (node) {
								cardRefs.current.set(portal.id, node);
							} else {
								cardRefs.current.delete(portal.id);
							}
						}}
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

				{portals.length === 0 && hasActiveFilters && (
					<Card
						variant="filled"
						className={cn(
							"bg-m3-surface-container-low flex flex-col items-center justify-center p-10 text-center",
							isDetailOpen ? "col-span-1" : "xl:col-span-2",
						)}
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-m3-full bg-m3-surface-container-highest text-m3-on-surface-variant">
							<Icon name="filter_list_off" size={32} />
						</div>
						<h3 className="mt-4 text-lg font-bold text-m3-on-surface">
							Không tìm thấy cổng nộp bài phù hợp
						</h3>
						<Text
							variant="body-sm"
							className="mt-1 max-w-md text-m3-on-surface-variant"
						>
							Không có cổng nộp bài nào khớp với bộ lọc hoặc từ khóa tìm kiếm đã
							chọn.
						</Text>
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

				{portals.length === 0 && !hasActiveFilters && (
					<Card
						variant="filled"
						className={cn(
							"bg-m3-surface-container-low flex flex-col items-center justify-center p-10 text-center",
							isDetailOpen ? "col-span-1" : "xl:col-span-2",
						)}
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-m3-full bg-m3-primary-container text-m3-on-primary-container">
							<Icon name="link_off" size={32} />
						</div>
						<h3 className="mt-4 text-lg font-bold text-m3-on-surface">
							Chưa có link nộp bài nào đang mở
						</h3>
						<Text
							variant="body-sm"
							className="mt-1 max-w-md text-m3-on-surface-variant"
						>
							Tạo link mới để học sinh chọn trường, chọn lớp, chọn bài tập và
							nộp bài thi chấm tự động qua cổng công khai.
						</Text>
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

export const PortalList = memo(PortalListComponent);
