import {
	FAB,
	Icon,
	PlainTooltip,
	ProgressIndicator,
	Select,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import type React from "react";
import { memo, useCallback, useMemo, useRef } from "react";
import {
	FloatingActionToolbar,
	type SearchConfig,
} from "../../../../components/common/floating-action-toolbar";
import type { Assignment } from "../../../../types/assignment.types";
import {
	getAcceptedSubmissionFileTypes,
	getShortAssignmentName,
} from "../../utils/gradingUtils";

export interface SingleGradingToolbarProps {
	assignments: Assignment[];
	selectedAssignment: string;
	selectedAssignmentData: Assignment | undefined;
	isBulkUploading: boolean;
	loading: boolean;
	onSelectAssignment: (assignmentId: string) => void;
	onBulkFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSaveAllScores: () => void;
	onBack: () => void;
	studentSearchQuery?: string;
	onStudentSearchQueryChange?: (query: string) => void;
	studentSearchMatchedCount?: number;
	studentSearchMatchIndex?: number;
	studentSearchHint?: string;
	onStudentSearchSubmit?: () => void;
	onStudentSearchNavigate?: (direction: -1 | 1) => void;
	onStudentSearchReset?: () => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (active: boolean) => void;
}

const SingleGradingToolbarComponent: React.FC<SingleGradingToolbarProps> = ({
	assignments,
	selectedAssignment,
	selectedAssignmentData,
	isBulkUploading,
	loading,
	onSelectAssignment,
	onBulkFilesChange,
	onSaveAllScores,
	onBack,
	studentSearchQuery,
	onStudentSearchQueryChange,
	studentSearchMatchedCount,
	studentSearchMatchIndex,
	studentSearchHint,
	onStudentSearchSubmit,
	onStudentSearchNavigate,
	onStudentSearchReset,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const autoAssignments = useMemo(
		() => assignments.filter((a) => a.isActive && a.gradingType === "auto"),
		[assignments],
	);

	const assignmentSelectOptions = useMemo(
		() => [
			{ value: "", label: "Chọn bài tập" },
			...autoAssignments.map((a) => ({
				value: a.id,
				label: `${getShortAssignmentName(a.name, a.gradingApiEndpoint)} - Tự động`,
			})),
		],
		[autoAssignments],
	);

	const handleTriggerBulkUpload = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	// Cấu hình tìm kiếm học sinh cho FloatingActionToolbar
	const searchConfig: SearchConfig | undefined = useMemo(() => {
		if (
			selectedAssignment &&
			studentSearchQuery !== undefined &&
			onStudentSearchQueryChange
		) {
			return {
				id: "single-grading-student-search",
				placeholder: "Tìm tên học sinh...",
				ariaLabel: "Tìm kiếm học sinh",
				query: studentSearchQuery,
				onQueryChange: onStudentSearchQueryChange,
				onSubmit: onStudentSearchSubmit,
				onNavigate: onStudentSearchNavigate,
				onReset: onStudentSearchReset,
				matchedCount: studentSearchMatchedCount,
				matchIndex: studentSearchMatchIndex,
				hint: studentSearchHint,
				widthClassName: "w-52 sm:w-64 md:w-72",
				clearQueryOnClose: true,
				variant: "filled",
			};
		}

		return undefined;
	}, [
		selectedAssignment,
		studentSearchQuery,
		onStudentSearchQueryChange,
		onStudentSearchSubmit,
		onStudentSearchNavigate,
		onStudentSearchReset,
		studentSearchMatchedCount,
		studentSearchMatchIndex,
		studentSearchHint,
	]);

	// Nút tác vụ trên toolbar (Quay lại, Chọn nhiều file)
	const actions = useMemo(
		() => (
			<>
				{/* Quay lại danh mục */}
				<TooltipBox
					tooltip={<PlainTooltip>Quay lại danh mục</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Quay lại danh mục"
						onClick={onBack}
						disabled={loading}
						emphasis="standard"
					>
						<Icon name="arrow_back" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Chọn nhiều file theo danh sách */}
				{selectedAssignment && (
					<>
						<input
							ref={fileInputRef}
							id="bulk-single-upload"
							type="file"
							multiple
							accept={getAcceptedSubmissionFileTypes(
								selectedAssignmentData?.gradingApiEndpoint,
							)}
							onChange={onBulkFilesChange}
							disabled={isBulkUploading}
							className="hidden"
						/>
						<TooltipBox
							tooltip={
								<PlainTooltip>
									{isBulkUploading
										? "Đang xử lý nhiều file..."
										: "Chọn nhiều file theo danh sách"}
								</PlainTooltip>
							}
							placement="top"
						>
							<ToolbarIconButton
								aria-label="Chọn nhiều file theo danh sách"
								onClick={handleTriggerBulkUpload}
								disabled={isBulkUploading || loading}
								emphasis="standard"
							>
								{isBulkUploading ? (
									<ProgressIndicator
										variant="circular"
										shape="wavy"
										size={20}
										aria-label="Đang xử lý"
									/>
								) : (
									<Icon name="upload_file" size={24} />
								)}
							</ToolbarIconButton>
						</TooltipBox>
					</>
				)}
			</>
		),
		[
			onBack,
			loading,
			selectedAssignment,
			selectedAssignmentData?.gradingApiEndpoint,
			onBulkFilesChange,
			isBulkUploading,
			handleTriggerBulkUpload,
		],
	);

	// FAB Lưu điểm
	const endFab = useMemo(() => {
		if (selectedAssignment) {
			return (
				<TooltipBox
					tooltip={<PlainTooltip>Lưu điểm</PlainTooltip>}
					placement="top"
				>
					<FAB
						key="fab-save-single"
						colorStyle="tertiary"
						size="md"
						aria-label="Lưu điểm"
						onClick={onSaveAllScores}
						disabled={loading}
						loading={loading}
						icon={<Icon name="save" size={24} />}
					/>
				</TooltipBox>
			);
		}
		return null;
	}, [selectedAssignment, loading, onSaveAllScores]);

	return (
		<>
			{/* Assignment Selection */}
			<div className="p-4 rounded-2xl bg-m3-surface-container-high shadow-xs border border-m3-outline-variant/20 mb-6">
				<Select
					variant="outlined"
					label="Chọn bài tập để chấm điểm"
					options={assignmentSelectOptions}
					value={selectedAssignment}
					onChange={(val) => onSelectAssignment(val)}
					fullWidth
				/>
			</div>

			{/* Floating Action Toolbar */}
			<FloatingActionToolbar
				ariaLabel="Thanh công cụ chấm bài"
				actions={actions}
				search={searchConfig}
				endFab={endFab}
				isSearchActive={isSearchActive}
				onOpenSearch={onOpenSearch}
				onCloseSearch={onCloseSearch}
				onSearchActiveChange={onSearchActiveChange}
			/>
		</>
	);
};

export const SingleGradingToolbar = memo(SingleGradingToolbarComponent);
