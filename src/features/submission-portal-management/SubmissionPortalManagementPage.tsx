import { Button, Icon, ScrollArea, Text } from "@bug-on/m3-expressive";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback } from "react";
import { RouteLoadingFallback } from "../../components";
import { usePageHeader } from "../../context/PageActionsContext";
import { cn } from "../../utils/utils";
import { PortalActionToolbar } from "./components/PortalActionToolbar";
import { PortalDetailsSection } from "./components/PortalDetailsSection";
import { PortalFormDialog } from "./components/PortalFormDialog";
import { PortalList } from "./components/PortalList";
import { StatsBanner } from "./components/StatsBanner";
import { usePortalDetails } from "./hooks/usePortalDetails";
import { usePortalFilters } from "./hooks/usePortalFilters";
import { usePortalManagement } from "./hooks/usePortalManagement";

export const SubmissionPortalManagementPage = () => {
	const portalMgmt = usePortalManagement();
	const filters = usePortalFilters(
		portalMgmt.isCreateOpen || Boolean(portalMgmt.editingPortal),
	);
	const details = usePortalDetails();
	const shouldReduceMotion = useReducedMotion();

	const publicOrigin = window.location.origin;
	const isDetailOpen = Boolean(details.selectedPortal);

	// Page Header Configuration - disablePageScroll và transparentContainer để 2 pane có khung rounded riêng độc lập
	usePageHeader(
		{
			title: "Quản lý bài tập",
			subtitle:
				"Tạo link nộp bài tự động chấm, chia sẻ cho học sinh và theo dõi cảnh báo.",
			disablePageScroll: true,
			transparentContainer: true,
			actions: [
				{
					id: "create-submission-portal",
					label: "Tạo link",
					icon: "add_link",
					colorStyle: "filled",
					onClick: () => portalMgmt.setIsCreateOpen(true),
				},
			],
		},
		[portalMgmt.setIsCreateOpen],
	);

	const handleCreateSubmit = useCallback(async () => {
		const success = await portalMgmt.createPortal(
			filters.selectedClassIds,
			filters.selectedAssignmentIds,
		);
		if (success) {
			filters.resetFilters();
		}
	}, [portalMgmt, filters]);

	const handleDeletePortal = useCallback(
		(portal: Parameters<typeof portalMgmt.deletePortal>[0]) => {
			void portalMgmt.deletePortal(portal, (deletedId) => {
				if (details.selectedPortal?.id === deletedId) {
					details.closeDetails();
				}
			});
		},
		[portalMgmt, details],
	);

	const handleToggleDetails = useCallback(
		(portal: Parameters<typeof details.openDetails>[0]) => {
			if (details.selectedPortal?.id === portal.id) {
				details.closeDetails();
			} else {
				void details.openDetails(portal);
			}
		},
		[details],
	);

	if (portalMgmt.isInitialLoading) {
		return <RouteLoadingFallback message="Đang tải cổng nộp bài..." />;
	}
	if (portalMgmt.isInitialLoadError) {
		const message =
			portalMgmt.portalListError instanceof Error
				? portalMgmt.portalListError.message
				: "Không thể tải cổng nộp bài.";
		return (
			<div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-8 text-center">
				<Icon name="error_outline" size={40} className="text-m3-error" />
				<div className="space-y-1">
					<Text variant="title-lg">Không thể tải cổng nộp bài</Text>
					<Text variant="body-md" className="text-m3-on-surface-variant">
						{message}
					</Text>
				</div>
				<Button onClick={portalMgmt.retryPortals}>Thử lại</Button>
			</div>
		);
	}

	return (
		<main className="flex-1 min-h-0 h-full w-full flex gap-3 lg:gap-4 overflow-hidden relative">
			<div
				className={cn(
					"h-full flex flex-col min-w-0 overflow-hidden relative rounded-m3-xl-inc bg-m3-surface text-m3-on-surface",
					"transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
					isDetailOpen
						? "w-full lg:w-[calc(60%-0.5rem)] shrink-0"
						: "w-full flex-1",
				)}
			>
				<ScrollArea
					type="hover"
					orientation="vertical"
					className="flex-1 min-h-0"
					viewportClassName="p-5 lg:pb-26"
				>
					<div className="space-y-4">
						{portalMgmt.isBackgroundRefreshError && (
							<div className="flex flex-wrap items-center justify-between gap-3 rounded-m3-md bg-m3-error-container px-4 py-3 text-m3-on-error-container">
								<Text variant="body-md">
									Không thể cập nhật danh sách mới nhất. Đang hiển thị dữ liệu
									đã lưu.
								</Text>
								<Button onClick={portalMgmt.retryPortals}>Thử lại</Button>
							</div>
						)}
						<StatsBanner
							activeCount={portalMgmt.stats.active}
							scopedAssignmentsCount={portalMgmt.stats.scopedAssignments}
							totalAlertsCount={portalMgmt.stats.totalAlerts}
							isDetailOpen={isDetailOpen}
						/>
						<PortalList
							portals={portalMgmt.filteredPortals}
							hasActiveFilters={portalMgmt.hasActiveFilters}
							onResetFilters={portalMgmt.resetFilters}
							publicOrigin={publicOrigin}
							selectedPortalId={details.selectedPortal?.id}
							onOpenCreate={() => portalMgmt.setIsCreateOpen(true)}
							onCopyUrl={portalMgmt.copyText}
							onOpenDetails={handleToggleDetails}
							onEdit={portalMgmt.openEdit}
							onDelete={handleDeletePortal}
							isActionDisabled={portalMgmt.loading}
							isDetailOpen={isDetailOpen}
						/>
					</div>
				</ScrollArea>

				<PortalActionToolbar
					scopeFilter={portalMgmt.scopeFilter}
					onScopeChange={portalMgmt.setScopeFilter}
					selectedClassId={portalMgmt.selectedClassId}
					onClassChange={portalMgmt.setSelectedClassId}
					classOptions={portalMgmt.classOptions}
					onResetFilters={portalMgmt.resetFilters}
					hasActiveFilters={portalMgmt.hasActiveFilters}
					searchQuery={portalMgmt.searchQuery}
					onSearchQueryChange={portalMgmt.setSearchQuery}
					isSearchActive={portalMgmt.isSearchActive}
					onOpenSearch={portalMgmt.openSearch}
					onCloseSearch={portalMgmt.closeSearch}
					onSearchActiveChange={portalMgmt.setIsSearchActive}
					onOpenCreate={() => portalMgmt.setIsCreateOpen(true)}
				/>
			</div>

			<AnimatePresence>
				{details.selectedPortal && (
					<motion.div
						key="portal-detail-pane"
						initial={{ x: "100%", opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: "100%", opacity: 0 }}
						transition={
							shouldReduceMotion
								? { duration: 0.15 }
								: { duration: 0.3, ease: [0.2, 0, 0, 1] }
						}
						className="fixed inset-0 z-50 bg-m3-surface lg:static lg:z-auto lg:h-full lg:w-[calc(40%-0.5rem)] lg:shrink-0 lg:min-w-0 rounded-none lg:rounded-m3-xl-inc text-m3-on-surface overflow-hidden flex flex-col will-change-transform shadow-m3-elevation-3 lg:shadow-none"
					>
						<PortalDetailsSection
							selectedPortal={details.selectedPortal}
							alerts={details.alerts}
							logs={details.logs}
							totalLogs={details.totalLogs}
							loadingDetails={details.loadingDetails}
							hasNextLogsPage={details.hasNextLogsPage}
							loadingMoreLogs={details.loadingMoreLogs}
							onClose={details.closeDetails}
							onLoadMoreLogs={details.loadMoreLogs}
							onExportLogsCsv={details.exportLogsCsv}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			<PortalFormDialog
				open={portalMgmt.isCreateOpen || Boolean(portalMgmt.editingPortal)}
				mode={portalMgmt.editingPortal ? "edit" : "create"}
				title={portalMgmt.title}
				setTitle={portalMgmt.setTitle}
				description={portalMgmt.description}
				setDescription={portalMgmt.setDescription}
				maxSubmissions={portalMgmt.maxSubmissions}
				setMaxSubmissions={portalMgmt.setMaxSubmissions}
				scoringPolicy={portalMgmt.scoringPolicy}
				setScoringPolicy={portalMgmt.setScoringPolicy}
				showLeaderboard={portalMgmt.showLeaderboard}
				setShowLeaderboard={portalMgmt.setShowLeaderboard}
				showDetailedFeedback={portalMgmt.showDetailedFeedback}
				setShowDetailedFeedback={portalMgmt.setShowDetailedFeedback}
				loading={portalMgmt.loading}
				onClose={() => {
					portalMgmt.closeCreate();
					portalMgmt.closeEdit();
					filters.resetFilters();
				}}
				onSubmitCreate={handleCreateSubmit}
				onSubmitUpdate={portalMgmt.updatePortal}
				schools={filters.schools}
				classes={filters.classes}
				assignments={filters.filteredAssignments}
				selectedSchoolId={filters.selectedSchoolId}
				selectedClassIds={filters.selectedClassIds}
				selectedAssignmentIds={filters.selectedAssignmentIds}
				selectedSchoolName={filters.selectedSchoolName}
				selectedClassNames={filters.selectedClassNames}
				classNameById={filters.classNameById}
				loadingClasses={filters.loadingClasses}
				loadingAssignments={filters.loadingAssignments}
				onSchoolChange={filters.handleSchoolChange}
				onClassChange={filters.handleClassChange}
				onAssignmentChange={filters.handleAssignmentChange}
				onToggleClass={filters.toggleClass}
				onToggleAssignment={filters.toggleAssignment}
				onSelectAllAssignments={filters.selectAllAssignments}
				onClearAssignments={filters.clearAssignments}
			/>
		</main>
	);
};

export default SubmissionPortalManagementPage;
