import {
	Button,
	Icon,
	IconButton,
	ProgressIndicator,
	Select,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
import type { Assignment } from "../../../../types/assignment.types";
import { getAcceptedSubmissionFileTypes } from "../../utils/gradingUtils";

interface SingleGradingToolbarProps {
	assignments: Assignment[];
	selectedAssignment: string;
	selectedAssignmentData: Assignment | undefined;
	studentSearchQuery: string;
	studentSearchHint: string;
	studentSearchMatchedIds: string[];
	studentSearchMatchIndex: number;
	isBulkUploading: boolean;
	loading: boolean;
	onSelectAssignment: (assignmentId: string) => void;
	onSearchQueryChange: (query: string) => void;
	onSearchSubmit: () => void;
	onSearchNavigate: (direction: -1 | 1) => void;
	onBulkFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSaveAllScores: () => void;
	onBack: () => void;
}

export const SingleGradingToolbar: React.FC<SingleGradingToolbarProps> = ({
	assignments,
	selectedAssignment,
	selectedAssignmentData,
	studentSearchQuery,
	studentSearchHint,
	studentSearchMatchedIds,
	studentSearchMatchIndex,
	isBulkUploading,
	loading,
	onSelectAssignment,
	onSearchQueryChange,
	onSearchSubmit,
	onSearchNavigate,
	onBulkFilesChange,
	onSaveAllScores,
	onBack,
}) => {
	const autoAssignments = useMemo(
		() => assignments.filter((a) => a.isActive && a.gradingType === "auto"),
		[assignments],
	);

	const assignmentSelectOptions = useMemo(
		() => [
			{ value: "", label: "-- Chọn bài tập --" },
			...autoAssignments.map((a) => ({
				value: a.id,
				label: `${a.name} (Tự động - Điểm tối đa: ${a.maxScore})`,
			})),
		],
		[autoAssignments],
	);

	return (
		<div className="space-y-4 mb-6">
			{/* Top action row */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					type="button"
					colorStyle="text"
					onClick={onBack}
					className="text-sm"
				>
					<Icon name="arrow_back" className="text-base mr-1.5" /> Quay lại
				</Button>

				{selectedAssignment && (
					<div className="flex items-center gap-3">
						<input
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
						<label
							htmlFor="bulk-single-upload"
							className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-xs ${
								isBulkUploading
									? "bg-m3-surface-container text-m3-on-surface-variant/40 border-m3-outline-variant/40 cursor-not-allowed"
									: "bg-m3-surface text-m3-primary border-m3-primary/30 hover:bg-m3-primary/10 cursor-pointer"
							}`}
						>
							<Icon name="upload_file" className="text-base" />
							{isBulkUploading
								? "Đang xử lý nhiều file..."
								: "Chọn nhiều file theo danh sách"}
						</label>

						<Button
							type="button"
							colorStyle="filled"
							onClick={onSaveAllScores}
							disabled={loading}
						>
							{loading ? (
								<>
									<ProgressIndicator
										variant="circular"
										shape="wavy"
										size={16}
										aria-label="Đang lưu"
									/>
									Đang lưu...
								</>
							) : (
								<>
									<Icon name="save" className="text-base mr-1.5" />
									Lưu điểm
								</>
							)}
						</Button>
					</div>
				)}
			</div>

			{/* Assignment Selection */}
			<div className="p-4 rounded-2xl bg-m3-surface-container-high shadow-xs border border-m3-outline-variant/20">
				<Select
					variant="outlined"
					label="Chọn bài tập để chấm điểm"
					options={assignmentSelectOptions}
					value={selectedAssignment}
					onChange={(val) => onSelectAssignment(val)}
					fullWidth
				/>
			</div>

			{/* Search box */}
			{selectedAssignment && (
				<div className="rounded-2xl bg-m3-surface-container-high p-4 shadow-xs border border-m3-outline-variant/20">
					<p className="block text-sm font-semibold text-m3-on-surface mb-2">
						Tìm học sinh và cuộn tới vị trí trong bảng
					</p>
					<div className="flex flex-col sm:flex-row gap-2">
						<div className="relative flex-1">
							<TextField
								variant="outlined"
								placeholder="Nhập tên học sinh (ví dụ: An, Linh, Nam...)"
								value={studentSearchQuery}
								onChange={(val) => onSearchQueryChange(val)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										onSearchSubmit();
									}
								}}
								leadingIcon={<Icon name="search" />}
								fullWidth
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								colorStyle="filled"
								onClick={onSearchSubmit}
								className="text-xs"
							>
								Tìm & Cuộn
							</Button>
							<IconButton
								type="button"
								size="sm"
								colorStyle="outlined"
								onClick={() => onSearchNavigate(-1)}
								disabled={studentSearchMatchedIds.length === 0}
								aria-label="Kết quả trước"
							>
								<Icon name="arrow_upward" />
							</IconButton>
							<IconButton
								type="button"
								size="sm"
								colorStyle="outlined"
								onClick={() => onSearchNavigate(1)}
								disabled={studentSearchMatchedIds.length === 0}
								aria-label="Kết quả kế tiếp"
							>
								<Icon name="arrow_downward" />
							</IconButton>
							{studentSearchMatchedIds.length > 0 && (
								<span className="text-xs font-semibold text-m3-primary px-2">
									{studentSearchMatchIndex + 1}/{studentSearchMatchedIds.length}
								</span>
							)}
						</div>
					</div>
					{studentSearchHint && (
						<p className="mt-2 text-xs text-m3-on-surface-variant font-medium">
							{studentSearchHint}
						</p>
					)}
				</div>
			)}
		</div>
	);
};
