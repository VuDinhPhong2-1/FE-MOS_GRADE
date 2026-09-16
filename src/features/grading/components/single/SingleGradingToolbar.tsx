import {
	Button,
	Icon,
	ProgressIndicator,
	Select,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
import type { Assignment } from "../../../../types/assignment.types";
import { getAcceptedSubmissionFileTypes } from "../../utils/gradingUtils";

interface SingleGradingToolbarProps {
	assignments: Assignment[];
	selectedAssignment: string;
	selectedAssignmentData: Assignment | undefined;
	isBulkUploading: boolean;
	loading: boolean;
	onSelectAssignment: (assignmentId: string) => void;
	onBulkFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSaveAllScores: () => void;
	onBack: () => void;
}

export const SingleGradingToolbar: React.FC<SingleGradingToolbarProps> = ({
	assignments,
	selectedAssignment,
	selectedAssignmentData,
	isBulkUploading,
	loading,
	onSelectAssignment,
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
			{ value: "", label: "Chọn bài tập" },
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
		</div>
	);
};
