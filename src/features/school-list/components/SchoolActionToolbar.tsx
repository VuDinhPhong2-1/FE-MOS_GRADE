import {
	FAB,
	HorizontalFloatingToolbarWithFab,
	Icon,
	Menu,
	MenuContent,
	MenuGroup,
	MenuItem,
	MenuTrigger,
	PlainTooltip,
	Search,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useRef } from "react";
import { cn } from "../../../utils/utils";
import type { SchoolActionToolbarProps } from "../types";

const SchoolActionToolbarComponent = ({
	isLoading,
	onReload,
	onOpenAddModal,
	statusFilter,
	onStatusFilterChange,
	searchQuery,
	onSearchQueryChange,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
}: SchoolActionToolbarProps) => {
	const searchContainerRef = useRef<HTMLDivElement>(null);

	// Tự động focus vào ô tìm kiếm qua scoped ref khi mở search mode
	useEffect(() => {
		if (isSearchActive) {
			const frameId = requestAnimationFrame(() => {
				const input =
					searchContainerRef.current?.querySelector<HTMLInputElement>("input");
				input?.focus();
			});
			return () => cancelAnimationFrame(frameId);
		}
	}, [isSearchActive]);

	// Hỗ trợ bấm Escape để đóng tìm kiếm
	useEffect(() => {
		if (!isSearchActive) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCloseSearch();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSearchActive, onCloseSearch]);

	const fabNode = isSearchActive ? (
		<TooltipBox
			tooltip={<PlainTooltip>Đóng tìm kiếm (Esc)</PlainTooltip>}
			placement="top"
		>
			<FAB
				colorStyle="tertiary"
				aria-label="Đóng tìm kiếm"
				size="md"
				onClick={onCloseSearch}
				icon={<Icon name="close" size={24} />}
			/>
		</TooltipBox>
	) : (
		<TooltipBox
			tooltip={<PlainTooltip>Thêm trường mới</PlainTooltip>}
			placement="top"
		>
			<FAB
				colorStyle="tertiary"
				aria-label="Thêm trường mới"
				size="md"
				onClick={onOpenAddModal}
				icon={<Icon name="add" size={24} />}
			/>
		</TooltipBox>
	);

	return (
		<div className="fixed bottom-18 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center max-w-[calc(100vw-2rem)]">
			<HorizontalFloatingToolbarWithFab
				expanded={true}
				shape="full"
				variant="vibrant"
				aria-label="Thanh công cụ quản lý trường học"
				fabPosition="end"
				floatingActionButton={fabNode}
				className={cn(isSearchActive && "[&>div>div]:p-1!")}
			>
				<motion.div
					layout
					transition={{ duration: 0.22, ease: "easeOut" }}
					className="flex items-center"
				>
					<AnimatePresence mode="wait" initial={false}>
						{isSearchActive ? (
							<motion.div
								key="search-view"
								ref={searchContainerRef}
								initial={{ opacity: 0, scale: 0.94 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.94 }}
								transition={{ duration: 0.16, ease: "easeOut" }}
								className="flex items-center justify-center h-full my-auto"
							>
								<Search
									id="school-floating-search"
									query={searchQuery}
									onQueryChange={onSearchQueryChange}
									onSearch={onSearchQueryChange}
									active={false}
									onActiveChange={() => {}}
									placeholder="Tìm theo tên, mã, địa chỉ..."
									aria-label="Tìm kiếm trường học"
									className="w-56 sm:w-72 md:w-80"
									styleType="contained"
									showLeadingIcon={false}
								/>
							</motion.div>
						) : (
							<motion.div
								key="toolbar-buttons"
								initial={{ opacity: 0, scale: 0.94 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.94 }}
								transition={{ duration: 0.16, ease: "easeOut" }}
								className="flex items-center gap-1"
							>
								{/* 1. Tải lại */}
								<TooltipBox
									tooltip={<PlainTooltip>Tải lại danh sách</PlainTooltip>}
									placement="top"
								>
									<ToolbarIconButton
										aria-label="Tải lại danh sách"
										onClick={onReload}
										disabled={isLoading}
										emphasis="standard"
									>
										<Icon
											name="refresh"
											variant="rounded"
											size={24}
											className={isLoading ? "animate-spin" : undefined}
										/>
									</ToolbarIconButton>
								</TooltipBox>

								{/* 2. Lọc (Menu Expressive) */}
								<Menu variant="expressive" colorVariant="vibrant">
									<MenuTrigger asChild>
										<div>
											<TooltipBox
												tooltip={
													<PlainTooltip>
														{statusFilter === "all"
															? "Lọc trạng thái"
															: `Đang lọc: ${
																	statusFilter === "active"
																		? "Đang hoạt động"
																		: "Ngừng hoạt động"
																}`}
													</PlainTooltip>
												}
												placement="top"
											>
												<ToolbarIconButton
													aria-label="Lọc trạng thái"
													emphasis={
														statusFilter !== "all" ? "tonal" : "standard"
													}
													className={
														statusFilter !== "all"
															? "text-m3-primary relative"
															: undefined
													}
												>
													<Icon name="tune" variant="rounded" size={24} />
													{statusFilter !== "all" && (
														<span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-m3-primary" />
													)}
												</ToolbarIconButton>
											</TooltipBox>
										</div>
									</MenuTrigger>
									<MenuContent
										align="center"
										className="w-56"
										separatorStyle="gap"
									>
										<MenuGroup label="Trạng thái hoạt động">
											<MenuItem
												selected={statusFilter === "all"}
												onClick={() => onStatusFilterChange("all")}
											>
												Tất cả
											</MenuItem>
											<MenuItem
												selected={statusFilter === "active"}
												onClick={() => onStatusFilterChange("active")}
											>
												Đang hoạt động
											</MenuItem>
											<MenuItem
												selected={statusFilter === "inactive"}
												onClick={() => onStatusFilterChange("inactive")}
											>
												Ngừng hoạt động
											</MenuItem>
										</MenuGroup>
									</MenuContent>
								</Menu>

								{/* 3. Tìm kiếm */}
								<TooltipBox
									tooltip={<PlainTooltip>Tìm kiếm trường học</PlainTooltip>}
									placement="top"
								>
									<ToolbarIconButton
										aria-label="Tìm kiếm trường học"
										onClick={onOpenSearch}
										emphasis="standard"
									>
										<Icon name="search" variant="rounded" size={24} />
									</ToolbarIconButton>
								</TooltipBox>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</HorizontalFloatingToolbarWithFab>
		</div>
	);
};

export const SchoolActionToolbar = memo(SchoolActionToolbarComponent);
