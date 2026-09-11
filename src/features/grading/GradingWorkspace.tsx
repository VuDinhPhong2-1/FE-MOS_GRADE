import {
	Button,
	Icon,
	IconButton,
	ProgressIndicator,
	Select,
} from "@bug-on/m3-expressive";
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
	title = "Chấm điểm",
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
		loadAssignments,
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
			void loadAssignments();
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
			{/* Top Bar Header */}
			<div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-m3-outline-variant/20">
				<div>
					<div className="flex items-center gap-2">
						{chooseMode !== null && (
							<IconButton
								type="button"
								size="sm"
								colorStyle="standard"
								onClick={handleBackToModes}
								aria-label="Quay lại danh mục"
							>
								<Icon name="arrow_back" />
							</IconButton>
						)}
						<h2 className="text-2xl font-bold text-m3-on-surface font-md3-expressive">
							{title}
						</h2>
					</div>
					<p className="text-xs text-m3-on-surface-variant mt-1">
						Lớp học:{" "}
						<span className="font-semibold text-m3-on-surface">{classId}</span>{" "}
						• Tổng số học sinh:{" "}
						<span className="font-semibold text-m3-on-surface">
							{gradingStudents.length}
						</span>
					</p>
				</div>

				<div className="flex items-center gap-3">
					{chooseMode === "existing-multi" && multiAssignmentIds.length > 0 && (
						<Button
							type="button"
							colorStyle="filled"
							onClick={handleSaveMultipleAssignments}
							disabled={
								multiLoading ||
								isSelectingAssignments ||
								hasPendingMultiAssignmentSelectionChanges
							}
							title={
								hasPendingMultiAssignmentSelectionChanges
									? "Vui lòng chốt lại danh sách bài tập trước khi lưu."
									: undefined
							}
						>
							{multiLoading ? (
								<>
									<ProgressIndicator
										variant="circular"
										shape="wavy"
										size={16}
										aria-label="Đang lưu..."
									/>
									Đang lưu...
								</>
							) : (
								<>
									<Icon name="save" className="text-base mr-1.5" />
									Lưu điểm nhiều bài
								</>
							)}
						</Button>
					)}

					{onClose && (
						<IconButton
							type="button"
							size="sm"
							colorStyle="standard"
							onClick={onClose}
							aria-label="Đóng bảng chấm điểm"
						>
							<Icon name="close" />
						</IconButton>
					)}
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 pt-4">
				{isLoadingAssignments && (
					<div className="flex items-center justify-center py-12 gap-3 text-sm text-m3-on-surface-variant">
						<ProgressIndicator
							variant="circular"
							shape="wavy"
							size={24}
							aria-label="Đang tải dữ liệu..."
						/>
						Đang tải dữ liệu bài tập của lớp...
					</div>
				)}

				{!isLoadingAssignments && chooseMode === null && (
					<div className="space-y-6">
						{/* Quick select dropdown for single assignment right from home */}
						{activeAutoAssignments.length > 0 && (
							<div className="max-w-2xl mx-auto p-4 rounded-3xl bg-m3-surface border border-m3-outline-variant/30 shadow-xs flex flex-col sm:flex-row items-center gap-3">
								<div className="flex-1 w-full">
									<Select
										variant="outlined"
										label="Chấm nhanh 1 bài tập cụ thể"
										options={[
											{ value: "", label: "-- Chọn bài tập để chấm lẻ --" },
											...activeAutoAssignments.map((a) => ({
												value: a.id,
												label: `${a.name} (Điểm tối đa: ${a.maxScore})`,
											})),
										]}
										value={selectedAssignment}
										onChange={(val) => {
											if (val) {
												setSelectedAssignment(val);
												setChooseMode("existing");
											}
										}}
										fullWidth
									/>
								</div>
								{selectedAssignment && (
									<Button
										type="button"
										colorStyle="filled"
										onClick={() => setChooseMode("existing")}
										className="w-full sm:w-auto"
									>
										Mở chấm điểm
									</Button>
								)}
							</div>
						)}

						<GradingModeSelector
							onSelectMode={(mode) => {
								if (mode === "existing-multi") {
									setMultiAssignmentIds([]);
									setMultiAssignmentDraftIds([]);
								}
								setChooseMode(mode);
							}}
							activeAutoAssignmentCount={activeAutoAssignments.length}
						/>
					</div>
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
					<div>
						<SingleGradingToolbar
							assignments={assignments}
							selectedAssignment={selectedAssignment}
							selectedAssignmentData={selectedAssignmentData}
							studentSearchQuery={studentSearchQuery}
							studentSearchHint={studentSearchHint}
							studentSearchMatchedIds={studentSearchMatchedIds}
							studentSearchMatchIndex={studentSearchMatchIndex}
							isBulkUploading={isBulkUploading}
							loading={singleLoading}
							onSelectAssignment={setSelectedAssignment}
							onSearchQueryChange={setStudentSearchQuery}
							onSearchSubmit={scrollToStudentByKeyword}
							onSearchNavigate={moveToMatchedStudent}
							onBulkFilesChange={handleBulkStudentFilesChange}
							onSaveAllScores={handleSaveAllScores}
							onBack={handleBackToModes}
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
					<div>
						<Button
							type="button"
							colorStyle="text"
							onClick={handleBackToModes}
							className="mb-4 text-sm"
						>
							<Icon name="arrow_back" className="text-base mr-1.5" /> Quay lại
						</Button>

						<MultiAssignmentSelector
							autoAssignments={activeAutoAssignments}
							filteredAutoAssignments={filteredAutoAssignments}
							multiAssignmentDraftIds={multiAssignmentDraftIds}
							multiAssignmentIds={multiAssignmentIds}
							multiAssignmentQuery={multiAssignmentQuery}
							isSelectingAssignments={isSelectingAssignments}
							hasPendingChanges={hasPendingMultiAssignmentSelectionChanges}
							activeAutoAssignmentIdsByPractice={
								activeAutoAssignmentIdsByPractice
							}
							onQueryChange={setMultiAssignmentQuery}
							onToggleAssignment={handleToggleMultiAssignmentSelection}
							onTogglePractice={handleToggleQuickPracticeSelection}
							onSelectAll={handleSelectAllAutoAssignments}
							onClear={handleClearAutoAssignments}
							onCommit={handleCommitMultiAssignmentSelection}
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
					</div>
				)}
			</div>
		</div>
	);
};

export default GradingWorkspace;
