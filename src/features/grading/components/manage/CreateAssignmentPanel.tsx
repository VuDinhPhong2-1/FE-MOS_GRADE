import {
	Button,
	Checkbox,
	Icon,
	ProgressIndicator,
	Select,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { GradingEndpointInfo } from "../../../../types/assignment.types";
import {
	ASSIGNMENT_PRESET_OPTIONS,
	type AssignmentPresetCode,
	type BulkAssignmentDraft,
	SUBJECT_OPTIONS,
	type SubjectCode,
} from "../../types/gradingFeature.types";
import { resolveEndpointsBySubjectAndPractice } from "../../utils/gradingUtils";

interface CreateAssignmentPanelProps {
	newAssignmentSubject: SubjectCode;
	newAssignmentPracticeCode: AssignmentPresetCode;
	bulkAssignmentDrafts: BulkAssignmentDraft[];
	bulkAssignmentDescription: string;
	isCreatingAssignment: boolean;
	selectedBulkAssignmentCount: number;
	gradingEndpoints: GradingEndpointInfo[];
	onSubjectChange: (subject: SubjectCode) => void;
	onPracticeChange: (practice: AssignmentPresetCode) => void;
	onDescriptionChange: (desc: string) => void;
	onToggleDraftSelection: (endpoint: string) => void;
	onDraftNameChange: (endpoint: string, name: string) => void;
	onSelectAllDrafts: () => void;
	onClearDrafts: () => void;
	onResetDraftNames: () => void;
	onCreateBulkAssignments: () => void;
	onQuickCreatePractice: (practice: AssignmentPresetCode) => void;
	onBack: () => void;
}

const subjectSelectOptions = SUBJECT_OPTIONS.map((s) => ({
	value: s.code,
	label: s.label,
}));

const practiceSelectOptions = ASSIGNMENT_PRESET_OPTIONS.map((p) => ({
	value: p.code,
	label: p.label,
}));

export const CreateAssignmentPanel: React.FC<CreateAssignmentPanelProps> = ({
	newAssignmentSubject,
	newAssignmentPracticeCode,
	bulkAssignmentDrafts,
	bulkAssignmentDescription,
	isCreatingAssignment,
	selectedBulkAssignmentCount,
	gradingEndpoints,
	onSubjectChange,
	onPracticeChange,
	onDescriptionChange,
	onToggleDraftSelection,
	onDraftNameChange,
	onSelectAllDrafts,
	onClearDrafts,
	onResetDraftNames,
	onCreateBulkAssignments,
	onQuickCreatePractice,
	onBack,
}) => {
	return (
		<div className="flex-1 overflow-y-auto p-6 bg-m3-surface">
			<Button
				type="button"
				colorStyle="text"
				onClick={onBack}
				className="mb-6 text-sm"
			>
				<Icon name="arrow_back" className="mr-1.5 text-base" /> Quay lại
			</Button>

			<div className="p-6 bg-m3-surface-container-high rounded-3xl shadow-xs max-w-4xl border border-m3-outline-variant/30">
				<h3 className="font-bold mb-4 text-xl text-m3-on-surface font-md3-expressive">
					Tạo nhanh bài tập theo môn và phần
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<Select
						variant="outlined"
						label="Chọn môn *"
						options={subjectSelectOptions}
						value={newAssignmentSubject}
						onChange={(val) => onSubjectChange(val as SubjectCode)}
						fullWidth
					/>

					<Select
						variant="outlined"
						label="Chọn phần *"
						options={practiceSelectOptions}
						value={newAssignmentPracticeCode}
						onChange={(val) => onPracticeChange(val as AssignmentPresetCode)}
						fullWidth
					/>
				</div>

				{newAssignmentPracticeCode.startsWith("otth") && (
					<div className="mb-4 p-3 rounded-2xl bg-m3-primary/10 border border-m3-primary/20 text-xs text-m3-primary font-medium">
						OTTH dùng lại rule Practice hiện có và chỉ lọc project theo số
						lẻ/chẵn.
					</div>
				)}

				<div className="mb-5 rounded-2xl border border-m3-primary/20 bg-m3-primary/5 p-4">
					<p className="text-xs font-bold text-m3-primary uppercase tracking-wider">
						Tạo nhanh 1 chạm ({newAssignmentSubject.toUpperCase()})
					</p>
					<div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
						{ASSIGNMENT_PRESET_OPTIONS.map((practice) => {
							const practiceEndpoints = resolveEndpointsBySubjectAndPractice(
								gradingEndpoints,
								newAssignmentSubject,
								practice.code,
							);
							const hasProjects = practiceEndpoints.length > 0;

							return (
								<button
									key={`quick-create-${practice.code}`}
									type="button"
									onClick={() => onQuickCreatePractice(practice.code)}
									disabled={isCreatingAssignment || !hasProjects}
									className="rounded-xl border border-m3-outline-variant bg-m3-surface px-3.5 py-2.5 text-left text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container-highest transition disabled:cursor-not-allowed disabled:opacity-50 shadow-xs cursor-pointer"
								>
									<div>{practice.label}</div>
									<div className="mt-1 text-[11px] text-m3-primary font-normal">
										{hasProjects
											? `${practiceEndpoints.length} project khả dụng`
											: "Chưa có project"}
									</div>
								</button>
							);
						})}
					</div>
				</div>

				<div className="mb-5">
					<TextField
						variant="outlined"
						label="Mô tả dùng chung (tuỳ chọn)"
						placeholder="Nội dung mô tả này sẽ áp dụng cho tất cả bài được tạo trong đợt này."
						fullWidth
						type="textarea"
						rows={2}
						value={bulkAssignmentDescription}
						onChange={(val) => onDescriptionChange(val)}
					/>
				</div>

				<div className="rounded-2xl border border-m3-outline-variant/30 bg-m3-surface-container p-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div>
							<h4 className="text-sm font-bold text-m3-on-surface">
								Danh sách project sẽ tạo
							</h4>
							<p className="text-xs text-m3-on-surface-variant mt-0.5">
								Chọn các project cần tạo và chỉnh sửa tên từng bài trước khi
								lưu.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								colorStyle="tonal"
								onClick={onSelectAllDrafts}
								disabled={
									isCreatingAssignment || bulkAssignmentDrafts.length === 0
								}
								className="text-xs"
							>
								Chọn tất cả
							</Button>
							<Button
								type="button"
								colorStyle="tonal"
								onClick={onClearDrafts}
								disabled={
									isCreatingAssignment || bulkAssignmentDrafts.length === 0
								}
								className="text-xs"
							>
								Bỏ chọn
							</Button>
							<Button
								type="button"
								colorStyle="tonal"
								onClick={onResetDraftNames}
								disabled={
									isCreatingAssignment || bulkAssignmentDrafts.length === 0
								}
								className="text-xs"
							>
								Đặt lại tên mặc định
							</Button>
						</div>
					</div>

					{bulkAssignmentDrafts.length === 0 ? (
						<p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
							Phần này chưa có project khả dụng trong hệ thống.
						</p>
					) : (
						<div className="mt-4 overflow-x-auto rounded-xl border border-m3-outline-variant/30 bg-m3-surface">
							<table className="min-w-full divide-y divide-m3-outline-variant/20">
								<thead className="bg-m3-surface-container-low">
									<tr>
										<th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-m3-on-surface-variant w-14">
											Chọn
										</th>
										<th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-m3-on-surface-variant min-w-36">
											Project gốc
										</th>
										<th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-m3-on-surface-variant min-w-56">
											Tên bài tập hiển thị
										</th>
										<th className="px-3 py-2 text-center text-[11px] font-bold uppercase text-m3-on-surface-variant w-24">
											Điểm tối đa
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-m3-outline-variant/20">
									{bulkAssignmentDrafts.map((draft) => (
										<tr
											key={draft.endpoint}
											className="hover:bg-m3-surface-container-high/30 transition-colors"
										>
											<td className="px-3 py-2">
												<Checkbox
													checked={draft.selected}
													onCheckedChange={() =>
														onToggleDraftSelection(draft.endpoint)
													}
													disabled={isCreatingAssignment}
													aria-label={`Chọn project ${draft.displayName}`}
												/>
											</td>
											<td className="px-3 py-2 text-xs text-m3-on-surface font-medium">
												{draft.displayName}
											</td>
											<td className="px-3 py-2">
												<TextField
													variant="outlined"
													value={draft.name}
													onChange={(val) =>
														onDraftNameChange(draft.endpoint, val)
													}
													disabled={isCreatingAssignment}
													fullWidth
													placeholder="Nhập tên bài tập"
													aria-label={`Tên bài tập cho ${draft.displayName}`}
												/>
											</td>
											<td className="px-3 py-2 text-center text-sm font-semibold text-m3-on-surface">
												{draft.maxScore}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					<div className="mt-5">
						<Button
							type="button"
							colorStyle="filled"
							onClick={onCreateBulkAssignments}
							disabled={
								isCreatingAssignment || selectedBulkAssignmentCount === 0
							}
							fullWidth
							className="py-3"
						>
							{isCreatingAssignment ? (
								<>
									<ProgressIndicator
										variant="circular"
										shape="wavy"
										size={18}
										aria-label="Đang tạo nhiều bài..."
									/>
									Đang tạo các bài tập...
								</>
							) : (
								<>
									<Icon name="add" className="text-base mr-1.5" />
									Tạo ngay {selectedBulkAssignmentCount} bài đã chọn
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
