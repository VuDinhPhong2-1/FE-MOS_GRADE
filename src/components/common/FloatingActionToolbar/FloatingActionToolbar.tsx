import {
	FAB,
	FAST_SPATIAL_SPRING,
	HorizontalFloatingToolbar,
	Icon,
	PlainTooltip,
	Search,
	ToolbarIconButton,
	type ToolbarIconButtonVariant,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import {
	type MouseEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { cn } from "../../../utils/utils";
import type { FloatingActionToolbarProps } from "./types";

const FloatingActionToolbarComponent = ({
	startFab,
	endFab,
	actions,
	search,
	infoSlot,
	infoSlotPosition = "before",
	ariaLabel = "Thanh công cụ tác vụ nổi",
	className,
	toolbarClassName,
	closeSearchTooltip = "Đóng tìm kiếm (Esc)",
	onSearchActiveChange,
	isSearchActive: controlledSearchActive,
	onOpenSearch: controlledOpenSearch,
	onCloseSearch: controlledCloseSearch,
}: FloatingActionToolbarProps) => {
	const [internalSearchActive, setInternalSearchActive] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	const isControlled = controlledSearchActive !== undefined;
	const isSearchActive = isControlled
		? controlledSearchActive
		: internalSearchActive;

	// Báo trạng thái ra ngoài qua callback onSearchActiveChange (nếu có)
	useEffect(() => {
		onSearchActiveChange?.(isSearchActive);
	}, [isSearchActive, onSearchActiveChange]);

	// Xử lý mở tìm kiếm
	const handleOpenSearch = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			e.currentTarget.dispatchEvent(
				new PointerEvent("pointercancel", { bubbles: true }),
			);
			e.currentTarget.blur();

			if (isControlled) {
				controlledOpenSearch?.();
			} else {
				setInternalSearchActive(true);
			}
		},
		[isControlled, controlledOpenSearch],
	);

	// Xử lý đóng tìm kiếm
	const handleCloseSearch = useCallback(
		(e?: MouseEvent<HTMLButtonElement>) => {
			if (e?.currentTarget) {
				e.currentTarget.dispatchEvent(
					new PointerEvent("pointercancel", { bubbles: true }),
				);
				e.currentTarget.blur();
			}

			if (search?.clearQueryOnClose) {
				search.onQueryChange("");
			}

			if (isControlled) {
				controlledCloseSearch?.();
			} else {
				setInternalSearchActive(false);
			}
		},
		[isControlled, controlledCloseSearch, search],
	);

	// Tự động focus vào ô input khi search-view mount vào DOM
	const focusSearchInput = useCallback(() => {
		if (search?.autoFocus === false) return;

		const input =
			searchContainerRef.current?.querySelector<HTMLInputElement>("input") ||
			(search?.id
				? (document.getElementById(search.id) as HTMLInputElement | null)
				: null);

		if (input) {
			input.focus({ preventScroll: true });
			const len = input.value.length;
			if (len > 0) {
				input.setSelectionRange(len, len);
			}
		}
	}, [search?.autoFocus, search?.id]);

	// Ref callback kích hoạt focus ngay khi node tìm kiếm xuất hiện trong DOM
	const setSearchContainerRef = useCallback(
		(node: HTMLDivElement | null) => {
			searchContainerRef.current = node;
			if (node && search?.autoFocus !== false) {
				requestAnimationFrame(() => {
					focusSearchInput();
				});
			}
		},
		[focusSearchInput, search?.autoFocus],
	);

	// Hỗ trợ bấm phím Escape để nhanh chóng đóng tìm kiếm
	useEffect(() => {
		if (!isSearchActive) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (search?.clearQueryOnClose) {
					search.onQueryChange("");
				}
				if (isControlled) {
					controlledCloseSearch?.();
				} else {
					setInternalSearchActive(false);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSearchActive, isControlled, controlledCloseSearch, search]);

	return (
		<div
			className={cn(
				"fixed bottom-18 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-2 max-w-[calc(100vw-2rem)] m-0!",
				className,
			)}
		>
			{/* Start FAB (hiển thị trước toolbar, tự thu gọn mượt mà khi search active) */}
			<AnimatePresence initial={false}>
				{startFab && !isSearchActive && (
					<motion.div
						key="floating-start-fab"
						initial={{ opacity: 0, scale: 0.6, width: 0 }}
						animate={{
							opacity: 1,
							scale: 1,
							width: "auto",
							transition: FAST_SPATIAL_SPRING,
						}}
						exit={{
							opacity: 0,
							scale: 0.6,
							width: 0,
							transition: { duration: 0.14, ease: "easeInOut" },
						}}
						className="flex shrink-0 items-center justify-center p-2 -m-2 overflow-hidden"
					>
						{startFab}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Info slot nếu được cấu hình hiển thị phía trước Toolbar */}
			{infoSlot && infoSlotPosition === "before" && !isSearchActive && (
				<div className="flex shrink-0 items-center">{infoSlot}</div>
			)}

			{/* Main Floating Toolbar */}
			<HorizontalFloatingToolbar
				expanded={true}
				shape="full"
				variant="vibrant"
				aria-label={ariaLabel}
				disableLayoutAnimation={true}
				contentPadding="4px 8px"
				className={cn(
					"[&>div]:overflow-hidden!",
					isSearchActive ? "p-1" : "px-2",
					toolbarClassName,
				)}
			>
				<div className="relative flex items-center">
					<AnimatePresence mode="wait" initial={false}>
						{isSearchActive && search ? (
							<motion.div
								key="search-view"
								ref={setSearchContainerRef}
								initial={{ opacity: 0, scale: 0.96 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{
									opacity: 0,
									scale: 0.96,
									transition: { duration: 0.12, ease: "easeOut" },
								}}
								transition={{ duration: 0.16, ease: "easeOut" }}
								onAnimationComplete={focusSearchInput}
								className="flex items-center justify-center h-full my-auto"
							>
								<Search
									id={search.id}
									query={search.query}
									onQueryChange={search.onQueryChange}
									onSearch={search.onQueryChange}
									active={false}
									onActiveChange={() => {}}
									placeholder={search.placeholder}
									aria-label={search.ariaLabel}
									className={search.widthClassName || "w-56 sm:w-72 md:w-80"}
									styleType="contained"
									showLeadingIcon={search.showLeadingIcon ?? false}
								/>
							</motion.div>
						) : (
							<motion.div
								key="toolbar-buttons"
								initial={{ opacity: 0, scale: 0.96 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{
									opacity: 0,
									scale: 0.96,
									transition: { duration: 0.12, ease: "easeOut" },
								}}
								transition={{ duration: 0.16, ease: "easeOut" }}
								className="flex items-center gap-1"
							>
								{/* Custom Actions từ Caller */}
								{actions}

								{/* Search Toggle Icon Button (nếu có Search config) */}
								{search &&
									(() => {
										const {
											id,
											placeholder,
											ariaLabel,
											query,
											onQueryChange,
											widthClassName,
											showLeadingIcon,
											clearQueryOnClose,
											variant,
											iconVariant,
											iconName = "search",
											iconSize = 24,
											emphasis,
											className: triggerClassName,
											...buttonProps
										} = search;

										return (
											<TooltipBox
												tooltip={<PlainTooltip>{ariaLabel}</PlainTooltip>}
												placement="top"
											>
												<ToolbarIconButton
													aria-label={ariaLabel}
													onClick={handleOpenSearch}
													emphasis={
														(emphasis ??
															variant ??
															"standard") as ToolbarIconButtonVariant
													}
													className={triggerClassName}
													{...buttonProps}
												>
													<Icon
														name={iconName}
														variant={
															(iconVariant ?? "rounded") as
																| "outlined"
																| "rounded"
																| "sharp"
														}
														size={iconSize}
													/>
												</ToolbarIconButton>
											</TooltipBox>
										);
									})()}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</HorizontalFloatingToolbar>

			{/* Info slot nếu được cấu hình hiển thị phía sau Toolbar */}
			{infoSlot && infoSlotPosition === "after" && !isSearchActive && (
				<div className="flex shrink-0 items-center">{infoSlot}</div>
			)}

			{/* End FAB (hiển thị sau toolbar, tự thu gọn mượt mà khi search active) */}
			<AnimatePresence initial={false}>
				{endFab && !isSearchActive && (
					<motion.div
						key="floating-end-fab"
						initial={{ opacity: 0, scale: 0.6, width: 0 }}
						animate={{
							opacity: 1,
							scale: 1,
							width: "auto",
							transition: FAST_SPATIAL_SPRING,
						}}
						exit={{
							opacity: 0,
							scale: 0.6,
							width: 0,
							transition: { duration: 0.14, ease: "easeInOut" },
						}}
						className="flex shrink-0 items-center justify-center p-2 -m-2 overflow-visible"
					>
						{endFab}
					</motion.div>
				)}
			</AnimatePresence>

			{/* FAB đóng tìm kiếm khi search đang active */}
			<AnimatePresence initial={false}>
				{isSearchActive && (
					<motion.div
						key="floating-search-close-fab"
						initial={{ opacity: 0, scale: 0.6, width: 0 }}
						animate={{
							opacity: 1,
							scale: 1,
							width: "auto",
							transition: FAST_SPATIAL_SPRING,
						}}
						exit={{
							opacity: 0,
							scale: 0.6,
							width: 0,
							transition: { duration: 0.14, ease: "easeInOut" },
						}}
						className="flex shrink-0 items-center justify-center p-2 -m-2 overflow-hidden"
					>
						<TooltipBox
							tooltip={<PlainTooltip>{closeSearchTooltip}</PlainTooltip>}
							placement="top"
						>
							<FAB
								colorStyle="tertiary"
								aria-label={closeSearchTooltip}
								size="md"
								onClick={handleCloseSearch}
								icon={<Icon name="close" size={24} />}
							/>
						</TooltipBox>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export const FloatingActionToolbar = memo(FloatingActionToolbarComponent);
