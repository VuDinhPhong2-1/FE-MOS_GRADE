import { useCallback, useEffect } from "react";
import { RouteLoadingFallback } from "../../components";
import { usePageHeader } from "../../context/PageActionsContext";
import { PortalDetailsSection } from "./components/PortalDetailsSection";
import { PortalFormDialog } from "./components/PortalFormDialog";
import { PortalList } from "./components/PortalList";
import { StatsBanner } from "./components/StatsBanner";
import { usePortalDetails } from "./hooks/usePortalDetails";
import { usePortalFilters } from "./hooks/usePortalFilters";
import { usePortalManagement } from "./hooks/usePortalManagement";

export const SubmissionPortalManagementPage = () => {
	const portalMgmt = usePortalManagement();
	const filters = usePortalFilters();
	const details = usePortalDetails();

	const publicOrigin = window.location.origin;

	// Page Header Configuration
	usePageHeader(
		{
			title: "Cổng nộp bài công khai",
			subtitle:
				"Tạo link nộp bài tự động chấm, chia sẻ cho học sinh và theo dõi cảnh báo.",
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

	// Initial data loading
	useEffect(() => {
		void portalMgmt.fetchPortals();
		void filters.loadSchools();
	}, [portalMgmt.fetchPortals, filters.loadSchools]);

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

	if (portalMgmt.loading && portalMgmt.visiblePortals.length === 0) {
		return <RouteLoadingFallback message="Đang tải cổng nộp bài..." />;
	}

	return (
		<main className="space-y-4">
			{/* Metric Cards Banner */}
			<StatsBanner
				activeCount={portalMgmt.stats.active}
				scopedAssignmentsCount={portalMgmt.stats.scopedAssignments}
				totalAlertsCount={portalMgmt.stats.totalAlerts}
			/>

			{/* Main Portals Grid List */}
			<PortalList
				portals={portalMgmt.visiblePortals}
				publicOrigin={publicOrigin}
				onOpenCreate={() => portalMgmt.setIsCreateOpen(true)}
				onCopyUrl={portalMgmt.copyText}
				onOpenDetails={details.openDetails}
				onEdit={portalMgmt.openEdit}
				onDelete={handleDeletePortal}
				isActionDisabled={portalMgmt.loading}
			/>

			{/* Detailed View: Suspicious Alerts & Submission Logs */}
			{details.selectedPortal && (
				<PortalDetailsSection
					selectedPortal={details.selectedPortal}
					alerts={details.alerts}
					logs={details.logs}
					loadingDetails={details.loadingDetails}
					onClose={details.closeDetails}
					onExportLogsCsv={details.exportLogsCsv}
				/>
			)}

			{/* Unified Create / Edit Modal Dialog */}
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
				onToggleClass={filters.toggleClass}
				onToggleAssignment={filters.toggleAssignment}
			/>
		</main>
	);
};

export default SubmissionPortalManagementPage;
