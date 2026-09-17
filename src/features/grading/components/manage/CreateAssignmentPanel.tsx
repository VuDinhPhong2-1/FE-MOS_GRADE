import {
	Card,
	Checkbox,
	Chip,
	Icon,
	Select,
	ShapeIcon,
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
import { CreateAssignmentToolbar } from "./CreateAssignmentToolbar";

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
	const currentSubjectLabel =
		SUBJECT_OPTIONS.find((s) => s.code === newAssignmentSubject)?.label ||
		newAssignmentSubject.toUpperCase();

	const currentPracticeLabel =
		ASSIGNMENT_PRESET_OPTIONS.find((p) => p.code === newAssignmentPracticeCode)
			?.label || newAssignmentPracticeCode;

	return (
		<div className="w-full max-w-7xl mx-auto space-y-4 pb-18">
			{/* Page Header */}
			<Card
				variant="filled"
				className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6"
			>
				<div className="space-y-1.5">
					<div className="flex items-center gap-2.5">
						<ShapeIcon
							shape="burst"
							morphTo="circle"
							className="h-10 w-10 bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center"
						>
							<Icon name="library_add" size={24} />
						</ShapeIcon>
						<h3 className="text-2xl font-bold text-m3-on-surface font-md3-expressive">
							Tạo bài tập mới
						</h3>
					</div>
					<p className="text-xs sm:text-sm text-m3-on-surface-variant max-w-2xl">
						Tạo nhanh danh sách bài tập theo mẫu MOS Practice và Ôn thi có sẵn.
						Các bài tập được chọn sẽ xuất hiện trong lớp học ngay sau khi lưu.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Chip
						variant="assist"
						leadingIcon={<Icon name="menu_book" size={16} />}
						label={currentSubjectLabel}
						className="h-7! px-3! rounded-full pointer-events-none text-xs font-semibold"
					/>
					<Chip
						variant="assist"
						leadingIcon={<Icon name="assignment" size={16} />}
						label={currentPracticeLabel}
						className="h-7! px-3! rounded-full pointer-events-none text-xs font-semibold text-m3-secondary"
					/>
				</div>
			</Card>

			{/* Section 1: Cấu hình cơ bản & Tạo nhanh */}
			<Card variant="outlined" className="p-6 space-y-5">
				<div>
					<h4 className="text-base font-bold text-m3-on-surface font-md3-expressive flex items-center gap-2">
						<Icon name="tune" className="text-lg text-m3-primary" />
						Cấu hình môn thi & phần bài tập
					</h4>
					<p className="text-xs text-m3-on-surface-variant mt-0.5">
						Chọn môn học và phần đề thi để hệ thống tải danh sách project tương
						ứng.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Select
						variant="outlined"
						label="Chọn môn học"
						options={subjectSelectOptions}
						value={newAssignmentSubject}
						onChange={(val) => onSubjectChange(val as SubjectCode)}
						fullWidth
						required
						showDividers={false}
						colorVariant="vibrant"
						menuVariant="expressive"
						dense
					/>

					<Select
						variant="outlined"
						label="Chọn phần bài tập"
						options={practiceSelectOptions}
						value={newAssignmentPracticeCode}
						onChange={(val) => onPracticeChange(val as AssignmentPresetCode)}
						fullWidth
						required
						showDividers={false}
						colorVariant="vibrant"
						menuVariant="expressive"
						dense
					/>
				</div>

				{newAssignmentPracticeCode.startsWith("otth") && (
					<div className="p-3.5 rounded-2xl bg-m3-primary/10 text-xs text-m3-primary font-medium flex items-center gap-2">
						<Icon name="info" className="text-base shrink-0" />
						<span>
							OTTH dùng lại cấu hình Practice hiện có và tự động lọc project
							theo số lẻ/chẵn.
						</span>
					</div>
				)}

				{/* Quick create 1-touch */}
				<div className="rounded-xl bg-m3-surface-container p-4 space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-xs font-bold text-m3-primary uppercase tracking-wider flex items-center gap-1.5">
							<Icon name="bolt" className="text-sm" />
							Tạo nhanh 1 chạm ({newAssignmentSubject.toUpperCase()})
						</p>
						<span className="text-[11px] text-m3-on-surface-variant">
							Bấm để nạp sẵn danh sách project tương ứng
						</span>
					</div>

					<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
						{ASSIGNMENT_PRESET_OPTIONS.map((practice) => {
							const practiceEndpoints = resolveEndpointsBySubjectAndPractice(
								gradingEndpoints,
								newAssignmentSubject,
								practice.code,
							);
							const hasProjects = practiceEndpoints.length > 0;
							const isSelected = newAssignmentPracticeCode === practice.code;

							return (
								<button
									key={`quick-create-${practice.code}`}
									type="button"
									onClick={() => onQuickCreatePractice(practice.code)}
									disabled={isCreatingAssignment || !hasProjects}
									className={`rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
										isSelected
											? "border-m3-primary bg-m3-primary-container/40 shadow-xs"
											: "border-m3-outline-variant/60 bg-m3-surface hover:bg-m3-surface-container-high hover:border-m3-primary/40"
									}`}
								>
									<div className="text-xs font-bold text-m3-on-surface">
										{practice.label}
									</div>
									<div className="mt-1 text-[11px] text-m3-primary font-medium flex items-center gap-1">
										<Icon name="folder_open" className="text-xs" />
										{hasProjects
											? `${practiceEndpoints.length} project khả dụng`
											: "Chưa có project"}
									</div>
								</button>
							);
						})}
					</div>
				</div>

				<div>
					<TextField
						variant="outlined"
						label="Mô tả (tuỳ chọn)"
						placeholder="Nội dung mô tả này sẽ áp dụng cho tất cả bài được tạo trong đợt này."
						fullWidth
						type="textarea"
						rows={2}
						value={bulkAssignmentDescription}
						onChange={(val) => onDescriptionChange(val)}
					/>
				</div>
			</Card>

			{/* Section 2: Danh sách project sẽ tạo */}
			<Card variant="outlined" className="p-6 space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<div>
						<h4 className="text-base font-bold text-m3-on-surface font-md3-expressive flex items-center gap-2">
							<Icon name="list_alt" className="text-lg text-m3-secondary" />
							Danh sách project sẽ tạo
						</h4>
						<p className="text-xs text-m3-on-surface-variant mt-0.5">
							Tích chọn các project cần tạo và chỉnh sửa tên từng bài trước khi
							lưu. Thao tác chọn và tạo bài được thực hiện trên thanh công cụ
							bên dưới.
						</p>
					</div>

					<div className="text-xs font-semibold text-m3-on-surface-variant bg-m3-surface-container px-3 py-1.5 rounded-full min-w-fit">
						Tổng cộng {bulkAssignmentDrafts.length} project
					</div>
				</div>

				{bulkAssignmentDrafts.length === 0 ? (
					<div className="p-8 text-center rounded-2xl bg-m3-surface border border-m3-outline-variant/30">
						<Icon
							name="folder_off"
							className="text-3xl text-m3-on-surface-variant/60 mb-2"
						/>
						<p className="text-sm font-semibold text-m3-on-surface">
							Phần này chưa có project khả dụng trong hệ thống
						</p>
						<p className="text-xs text-m3-on-surface-variant mt-1">
							Vui lòng chọn môn học hoặc phần thi khác để tiếp tục.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto rounded-xl bg-m3-surface-container overflow-hidden">
						<table className="min-w-full divide-y divide-m3-outline-variant/20">
							<thead className="bg-m3-surface-container-high">
								<tr className="h-12 border-b border-m3-outline-variant/60">
									<th className="h-12 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant w-14 align-middle">
										Chọn
									</th>
									<th className="h-12 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant min-w-36 align-middle">
										Project gốc
									</th>
									<th className="h-12 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant min-w-56 align-middle">
										Tên bài tập hiển thị
									</th>
									<th className="h-12 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant w-28 align-middle">
										Điểm tối đa
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-m3-outline-variant/20 bg-m3-surface-container">
								{bulkAssignmentDrafts.map((draft, index) => (
									<tr
										key={draft.endpoint}
										className={`transition-colors ${
											index % 2 === 1
												? "bg-m3-surface-container-high/25"
												: "bg-transparent"
										} hover:bg-m3-surface-container-high/50`}
									>
										<td className="px-4 py-3 text-center align-middle">
											<Checkbox
												checked={draft.selected}
												onCheckedChange={() =>
													onToggleDraftSelection(draft.endpoint)
												}
												disabled={isCreatingAssignment}
												aria-label={`Chọn project ${draft.displayName}`}
											/>
										</td>
										<td className="px-4 py-3 text-xs text-m3-on-surface font-semibold align-middle">
											{draft.displayName}
										</td>
										<td className="px-4 py-3 align-middle">
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
										<td className="px-4 py-3 text-center text-sm font-bold text-m3-on-surface align-middle">
											{draft.maxScore}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			{/* Floating Action Toolbar */}
			<CreateAssignmentToolbar
				onBack={onBack}
				selectedCount={selectedBulkAssignmentCount}
				totalDraftsCount={bulkAssignmentDrafts.length}
				isCreating={isCreatingAssignment}
				onSelectAll={onSelectAllDrafts}
				onClear={onClearDrafts}
				onResetNames={onResetDraftNames}
				onCreate={onCreateBulkAssignments}
			/>
		</div>
	);
};
