import { Button, Icon, ProgressIndicator } from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import type { Student } from "../../types/student.types";
import { ManualFileMatchModal } from "./components/dialogs/ManualFileMatchModal";
import { GradingModeSelector } from "./components/GradingModeSelector";
import { CreateAssignmentPanel } from "./components/manage/CreateAssignmentPanel";
import { EditAssignmentModal } from "./components/manage/EditAssignmentModal";
import { ManageAssignmentsPanel } from "./components/manage/ManageAssignmentsPanel";
import { MultiAssignmentSelector } from "./components/multi/MultiAssignmentSelector";
import { MultiGradingTable } from "./components/multi/MultiGradingTable";
import { MultiGradingToolbar } from "./components/multi/MultiGradingToolbar";
import { SingleGradingTable } from "./components/single/SingleGradingTable";
import { SingleGradingToolbar } from "./components/single/SingleGradingToolbar";
import { useAssignmentManager } from "./hooks/useAssignmentManager";
import { useGradingData } from "./hooks/useGradingData";
import { useMultiGrading } from "./hooks/useMultiGrading";
import { useSingleGrading } from "./hooks/useSingleGrading";
import { useStudentTableSearch } from "./hooks/useStudentTableSearch";
import type { GradingMode } from "./types/gradingFeature.types";
import { normalizeVietnameseText } from "./utils/gradingUtils";

export interface GradingWorkspaceProps {
	classId: string;
	students: Student[];
	onClose?: () => void;
	onSuccess?: () => void | Promise<void>;
	title?: string;
	initialMode?: GradingMode;
}

const isStudentActive = (student: Student): boolean => {
	const normalizedStatus = normalizeVietnameseText(student.status);
	if (normalizedStatus) {
		return normalizedStatus === "active";
	}
	return Boolean(student.isActive);
};

export const GradingWorkspace: React.FC<GradingWorkspaceProps> = ({
	classId,
	students,
	onClose,
	onSuccess,
	initialMode = null,
}) => {
	const [chooseMode, setChooseMode] = useState<GradingMode>(initialMode);
	const [selectedAssignment, setSelectedAssignment] = useState<string>("");
	const [showInactiveAssignments, setShowInactiveAssignments] = useState(false);
	const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

	const gradingStudents = useMemo(
		() => students.filter((student) => isStudentActive(student)),
		[students],
	);

	// Hook 1: Data fetching (assignments, endpoints)
	const {
		assignments,
		setAssignments,
		gradingEndpoints,
		isLoadingAssignments,
	} = useGradingData({
		classId,
		showInactiveAssignments,
	});

	const activeAssignments = useMemo(
		() => assignments.filter((a) => a.isActive),
		[assignments],
	);

	const activeAutoAssignments = useMemo(
		() => activeAssignments.filter((a) => a.gradingType === "auto"),
		[activeAssignments],
	);

	// Hook 2: Student search in table
	const {
		studentSearchQuery,
		setStudentSearchQuery,
		studentSearchHint,
		studentSearchMatchedIds,
		studentSearchMatchIndex,
		highlightedStudentId,
		scrollToStudentByKeyword,
		moveToMatchedStudent,
		resetSearchState,
	} = useStudentTableSearch({
		gradingStudents,
		rowRefs,
	});

	// Hook 3: Assignment management (create, update, delete, bulk draft)
	const {
		newAssignmentSubject,
		setNewAssignmentSubject,
		newAssignmentPracticeCode,
		setNewAssignmentPracticeCode,
		bulkAssignmentDrafts,
		bulkAssignmentDescription,
		setBulkAssignmentDescription,
		isCreatingAssignment,
		selectedBulkAssignmentCount,
		manageableActiveAssignments,
		isAllManageActiveSelected,
		manageSelectedAssignmentIds,
		editingAssignment,
		setEditingAssignment,
		assignmentSubmitLoading,
		assignmentEditForm,
		setAssignmentEditForm,
		handleToggleBulkAssignmentSelection,
		handleBulkAssignmentNameChange,
		handleSelectAllBulkAssignments,
		handleClearBulkAssignments,
		handleResetBulkAssignmentNames,
		handleCreateBulkAssignments,
		handleQuickCreateByPractice,
		handleToggleManageAssignmentSelection,
		handleSelectAllManageAssignments,
		handleClearManageAssignments,
		handleDeactivateSelectedAssignments,
		handleOpenEditAssignment,
		handleSaveAssignmentEdit,
		handleDeleteAssignment,
		handleDeleteSelectedAssignments,
		resetAssignmentManagerState,
	} = useAssignmentManager({
		classId,
		gradingEndpoints,
		assignments,
		setAssignments,
		showInactiveAssignments,
		chooseMode,
		setChooseMode,
		onAssignmentsUpdated: () => {
			// Optimistic state updates already performed locally in useAssignmentManager
		},
	});

	// Hook 4: Single grading logic
	const {
		studentGradingStates,
		singlePersistedScores,
		singleUndoSnapshots,
		undoingSingleStudentId,
		singleDragOverStudentId,
		isBulkUploading,
		loading: singleLoading,
		selectedAssignmentData,
		handleStudentFileChange,
		handleBulkStudentFilesChange,
		handleStudentFileDragOver,
		handleStudentFileDragLeave,
		handleStudentFileDrop,
		handleUndoSingleStudentFile,
		handleSaveAllScores,
		resetSingleGradingState,
	} = useSingleGrading({
		classId,
		gradingStudents,
		selectedAssignment,
		assignments,
		onSuccess,
		onClose,
	});

	// Hook 5: Multi grading logic
	const {
		multiAssignmentIds,
		setMultiAssignmentIds,
		multiAssignmentDraftIds,
		setMultiAssignmentDraftIds,
		multiScores,
		multiAutoStates,
		multiUndoSnapshots,
		multiDragOverCellKey,
		multiAssignmentQuery,
		setMultiAssignmentQuery,
		isSelectingAssignments,
		pendingManualMultiFileMatches,
		setPendingManualMultiFileMatches,
		isApplyingManualMultiFileMatches,
		loading: multiLoading,
		activeAutoAssignmentIdsByPractice,
		hasPendingMultiAssignmentSelectionChanges,
		filteredAutoAssignments,
		handleToggleMultiAssignmentSelection,
		handleToggleQuickPracticeSelection,
		handleSelectAllAutoAssignments,
		handleClearAutoAssignments,
		handleCommitMultiAssignmentSelection,
		handleMultiScoreChange,
		handleMultiStudentFileChange,
		handleMultiStudentFileDragOver,
		handleMultiStudentFileDragLeave,
		handleMultiStudentFileDrop,
		handleUndoMultiStudentFile,
		handleApplyPendingManualMultiFileMatch,
		handleApplyAllPendingManualMultiFileMatches,
		handleSaveMultipleAssignments,
		resetMultiGradingState,
	} = useMultiGrading({
		classId,
		gradingStudents,
		assignments,
		activeAutoAssignments,
		onSuccess,
	});

	const selectedMultiAssignments = useMemo(
		() =>
			multiAssignmentIds
				.map((id) => assignments.find((a) => a.id === id))
				.filter((a): a is (typeof assignments)[0] => Boolean(a)),
		[multiAssignmentIds, assignments],
	);

	const handleBackToModes = () => {
		setChooseMode(null);
		setSelectedAssignment("");
		resetSearchState();
		resetSingleGradingState();
		resetMultiGradingState();
		resetAssignmentManagerState();
	};

	const handleOpenManualMatchModal = () => {
		// Dialog is automatically controlled by pendingManualMultiFileMatches length
	};

	return (
		<div className="w-full min-h-[calc(100vh-140px)] flex flex-col">
			{/* Main Content Area */}
			<div className="flex-1">
				{isLoadingAssignments && (
					<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
						<ProgressIndicator
							variant="circular"
							shape="wavy"
							size={64}
							aria-label="Đang tải dữ liệu..."
						/>
						<p className="text-sm font-medium text-m3-on-surface-variant">
							Đang tải dữ liệu bài tập của lớp...
						</p>
					</div>
				)}

				{!isLoadingAssignments && chooseMode === null && (
					<GradingModeSelector
						onSelectMode={(mode) => {
							if (mode === "existing-multi") {
								setMultiAssignmentIds([]);
								setMultiAssignmentDraftIds([]);
							}
							setChooseMode(mode);
						}}
						activeAutoAssignmentCount={activeAutoAssignments.length}
						activeAutoAssignments={activeAutoAssignments}
						onSelectAssignment={(id) => {
							setSelectedAssignment(id);
							setChooseMode("existing");
						}}
						onBack={onClose}
					/>
				)}

				{!isLoadingAssignments && chooseMode === "new" && (
					<CreateAssignmentPanel
						newAssignmentSubject={newAssignmentSubject}
						newAssignmentPracticeCode={newAssignmentPracticeCode}
						bulkAssignmentDrafts={bulkAssignmentDrafts}
						bulkAssignmentDescription={bulkAssignmentDescription}
						isCreatingAssignment={isCreatingAssignment}
						selectedBulkAssignmentCount={selectedBulkAssignmentCount}
						gradingEndpoints={gradingEndpoints}
						onSubjectChange={setNewAssignmentSubject}
						onPracticeChange={setNewAssignmentPracticeCode}
						onDescriptionChange={setBulkAssignmentDescription}
						onToggleDraftSelection={handleToggleBulkAssignmentSelection}
						onDraftNameChange={handleBulkAssignmentNameChange}
						onSelectAllDrafts={handleSelectAllBulkAssignments}
						onClearDrafts={handleClearBulkAssignments}
						onResetDraftNames={handleResetBulkAssignmentNames}
						onCreateBulkAssignments={handleCreateBulkAssignments}
						onQuickCreatePractice={handleQuickCreateByPractice}
						onBack={handleBackToModes}
					/>
				)}

				{!isLoadingAssignments && chooseMode === "manage" && (
					<>
						<ManageAssignmentsPanel
							assignments={assignments}
							manageableActiveAssignments={manageableActiveAssignments}
							manageSelectedAssignmentIds={manageSelectedAssignmentIds}
							isAllManageActiveSelected={isAllManageActiveSelected}
							showInactiveAssignments={showInactiveAssignments}
							assignmentSubmitLoading={assignmentSubmitLoading}
							onToggleShowInactive={setShowInactiveAssignments}
							onToggleSelectAssignment={handleToggleManageAssignmentSelection}
							onSelectAllManage={handleSelectAllManageAssignments}
							onClearManage={handleClearManageAssignments}
							onDeactivateSelected={handleDeactivateSelectedAssignments}
							onOpenEdit={handleOpenEditAssignment}
							onDelete={handleDeleteAssignment}
							onDeleteSelected={handleDeleteSelectedAssignments}
							onBack={handleBackToModes}
						/>
						<EditAssignmentModal
							editingAssignment={editingAssignment}
							assignmentEditForm={assignmentEditForm}
							gradingEndpoints={gradingEndpoints}
							assignmentSubmitLoading={assignmentSubmitLoading}
							onFormChange={setAssignmentEditForm}
							onSave={handleSaveAssignmentEdit}
							onClose={() => setEditingAssignment(null)}
						/>
					</>
				)}

				{!isLoadingAssignments && chooseMode === "existing" && (
					<div className="pb-32">
						<SingleGradingToolbar
							assignments={assignments}
							selectedAssignment={selectedAssignment}
							selectedAssignmentData={selectedAssignmentData}
							isBulkUploading={isBulkUploading}
							loading={singleLoading}
							onSelectAssignment={setSelectedAssignment}
							onBulkFilesChange={handleBulkStudentFilesChange}
							onSaveAllScores={handleSaveAllScores}
							onBack={handleBackToModes}
							studentSearchQuery={studentSearchQuery}
							onStudentSearchQueryChange={setStudentSearchQuery}
							studentSearchMatchedCount={studentSearchMatchedIds.length}
							studentSearchMatchIndex={studentSearchMatchIndex}
							studentSearchHint={studentSearchHint}
							onStudentSearchSubmit={scrollToStudentByKeyword}
							onStudentSearchNavigate={moveToMatchedStudent}
							onStudentSearchReset={resetSearchState}
						/>

						{selectedAssignment ? (
							<SingleGradingTable
								gradingStudents={gradingStudents}
								studentGradingStates={studentGradingStates}
								singlePersistedScores={singlePersistedScores}
								singleUndoSnapshots={singleUndoSnapshots}
								selectedAssignmentData={selectedAssignmentData}
								singleDragOverStudentId={singleDragOverStudentId}
								undoingSingleStudentId={undoingSingleStudentId}
								highlightedStudentId={highlightedStudentId}
								rowRefs={rowRefs}
								onFileChange={handleStudentFileChange}
								onDragOver={handleStudentFileDragOver}
								onDragLeave={handleStudentFileDragLeave}
								onDrop={handleStudentFileDrop}
								onUndo={handleUndoSingleStudentFile}
							/>
						) : (
							<div className="p-8 text-center text-sm text-m3-on-surface-variant rounded-2xl bg-m3-surface border border-m3-outline-variant/30">
								Vui lòng chọn bài tập ở thanh trên để bắt đầu chấm điểm học
								sinh.
							</div>
						)}
					</div>
				)}

				{!isLoadingAssignments && chooseMode === "existing-multi" && (
					<div className="pb-32">
						<MultiAssignmentSelector
							filteredAutoAssignments={filteredAutoAssignments}
							multiAssignmentDraftIds={multiAssignmentDraftIds}
							isSelectingAssignments={isSelectingAssignments}
							activeAutoAssignmentIdsByPractice={
								activeAutoAssignmentIdsByPractice
							}
							onToggleAssignment={handleToggleMultiAssignmentSelection}
							onTogglePractice={handleToggleQuickPracticeSelection}
						/>

						{pendingManualMultiFileMatches.length > 0 && (
							<div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Icon
										name="warning"
										className="text-xl text-amber-700 dark:text-amber-300"
									/>
									<span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
										Có {pendingManualMultiFileMatches.length} file cần chọn cột
										bài tập thủ công
									</span>
								</div>
								<Button
									type="button"
									colorStyle="tonal"
									onClick={handleOpenManualMatchModal}
									className="text-xs"
								>
									Xem và chọn bài
								</Button>
							</div>
						)}

						<MultiGradingTable
							selectedAssignments={selectedMultiAssignments}
							gradingStudents={gradingStudents}
							multiScores={multiScores}
							multiAutoStates={multiAutoStates}
							multiUndoSnapshots={multiUndoSnapshots}
							multiDragOverCellKey={multiDragOverCellKey}
							highlightedStudentId={highlightedStudentId}
							rowRefs={rowRefs}
							onScoreChange={handleMultiScoreChange}
							onFileChange={(assignId, studentId, e) =>
								handleMultiStudentFileChange(assignId, studentId, e)
							}
							onDragOver={(assignId, studentId, isDisabled, e) =>
								handleMultiStudentFileDragOver(
									assignId,
									studentId,
									isDisabled,
									e,
								)
							}
							onDragLeave={handleMultiStudentFileDragLeave}
							onDrop={(assignId, studentId, isDisabled, e) =>
								handleMultiStudentFileDrop(assignId, studentId, isDisabled, e)
							}
							onUndo={handleUndoMultiStudentFile}
						/>

						<ManualFileMatchModal
							isOpen={pendingManualMultiFileMatches.length > 0}
							matches={pendingManualMultiFileMatches}
							assignments={assignments}
							students={gradingStudents}
							isApplying={isApplyingManualMultiFileMatches}
							onSelectAssignmentForMatch={(matchId, assignmentId) => {
								setPendingManualMultiFileMatches((prev) =>
									prev.map((item) =>
										item.id === matchId
											? { ...item, selectedAssignmentId: assignmentId }
											: item,
									),
								);
							}}
							onApplyMatch={handleApplyPendingManualMultiFileMatch}
							onApplyAll={handleApplyAllPendingManualMultiFileMatches}
							onRemoveMatch={(matchId) => {
								setPendingManualMultiFileMatches((prev) =>
									prev.filter((item) => item.id !== matchId),
								);
							}}
							onClose={() => setPendingManualMultiFileMatches([])}
						/>

						<MultiGradingToolbar
							onBack={handleBackToModes}
							committedCount={multiAssignmentIds.length}
							draftCount={multiAssignmentDraftIds.length}
							totalAssignmentsCount={activeAutoAssignments.length}
							isLoading={isSelectingAssignments || multiLoading}
							hasPendingChanges={hasPendingMultiAssignmentSelectionChanges}
							onCommit={handleCommitMultiAssignmentSelection}
							onSaveAll={handleSaveMultipleAssignments}
							onSelectAll={handleSelectAllAutoAssignments}
							onClear={handleClearAutoAssignments}
							searchQuery={multiAssignmentQuery}
							onSearchQueryChange={setMultiAssignmentQuery}
							studentSearchQuery={studentSearchQuery}
							onStudentSearchQueryChange={setStudentSearchQuery}
							studentSearchMatchedCount={studentSearchMatchedIds.length}
							studentSearchMatchIndex={studentSearchMatchIndex}
							onStudentSearchSubmit={scrollToStudentByKeyword}
							onStudentSearchNavigate={moveToMatchedStudent}
							onStudentSearchReset={resetSearchState}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default GradingWorkspace;
