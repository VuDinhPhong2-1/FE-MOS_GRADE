import {
	Button,
	Checkbox,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	IconButton,
	ProgressIndicator,
	Select,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
import type {
	Assignment,
	GradingEndpointInfo,
	UpdateAssignmentRequest,
} from "../../../../types/assignment.types";

interface EditAssignmentModalProps {
	editingAssignment: Assignment | null;
	assignmentEditForm: UpdateAssignmentRequest;
	gradingEndpoints: GradingEndpointInfo[];
	assignmentSubmitLoading: boolean;
	onFormChange: React.Dispatch<React.SetStateAction<UpdateAssignmentRequest>>;
	onSave: () => void;
	onClose: () => void;
}

const GRADING_TYPE_OPTIONS = [
	{ value: "auto", label: "Tự động" },
	{ value: "manual", label: "Thủ công" },
];

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
	editingAssignment,
	assignmentEditForm,
	gradingEndpoints,
	assignmentSubmitLoading,
	onFormChange,
	onSave,
	onClose,
}) => {
	const endpointOptions = useMemo(
		() => [
			{ value: "", label: "-- Chọn đầu chấm điểm --" },
			...gradingEndpoints.map((ep) => ({
				value: ep.endpoint,
				label: ep.displayName,
			})),
		],
		[gradingEndpoints],
	);

	if (!editingAssignment) return null;

	const isOpen = Boolean(editingAssignment);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogPortal>
				<DialogOverlay />
				<DialogContent className="max-w-2xl w-full rounded-3xl bg-m3-surface-container p-0 shadow-2xl border border-m3-outline-variant/30 overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-m3-outline-variant/20">
						<DialogHeader>
							<DialogTitle className="text-lg font-bold text-m3-on-surface">
								Chỉnh sửa bài tập: {editingAssignment.name}
							</DialogTitle>
							<DialogDescription className="text-xs text-m3-on-surface-variant mt-0.5">
								Cập nhật tên, điểm tối đa, cấu hình đầu chấm và trạng thái hoạt
								động.
							</DialogDescription>
						</DialogHeader>
						<IconButton
							type="button"
							size="sm"
							colorStyle="standard"
							aria-label="Đóng"
							onClick={onClose}
						>
							<Icon name="close" />
						</IconButton>
					</div>

					{/* Body */}
					<DialogBody className="space-y-4 px-6 py-4 max-h-[75vh] overflow-y-auto">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<TextField
								variant="outlined"
								label="Tên bài tập"
								required
								fullWidth
								placeholder="Tên bài tập"
								value={assignmentEditForm.name || ""}
								onChange={(val) =>
									onFormChange((prev) => ({
										...prev,
										name: val,
									}))
								}
								disabled={assignmentSubmitLoading}
							/>

							<TextField
								variant="outlined"
								label="Điểm tối đa"
								type="number"
								fullWidth
								placeholder="10"
								value={
									assignmentEditForm.maxScore !== undefined
										? String(assignmentEditForm.maxScore)
										: "10"
								}
								onChange={(val) =>
									onFormChange((prev) => ({
										...prev,
										maxScore: val === "" ? 0 : Number(val),
									}))
								}
								disabled={assignmentSubmitLoading}
							/>

							<Select
								variant="outlined"
								label="Loại chấm điểm"
								fullWidth
								options={GRADING_TYPE_OPTIONS}
								value={assignmentEditForm.gradingType || "auto"}
								onChange={(val) =>
									onFormChange((prev) => ({
										...prev,
										gradingType: val as "auto" | "manual",
										gradingApiEndpoint:
											val === "manual" ? "" : prev.gradingApiEndpoint,
									}))
								}
								disabled={
									Boolean(editingAssignment.isLockedForPublication) ||
									assignmentSubmitLoading
								}
							/>

							<Select
								variant="outlined"
								label="Đầu chấm điểm (nếu tự động)"
								fullWidth
								options={endpointOptions}
								value={assignmentEditForm.gradingApiEndpoint || ""}
								onChange={(val) =>
									onFormChange((prev) => ({
										...prev,
										gradingApiEndpoint: val,
									}))
								}
								disabled={
									assignmentEditForm.gradingType === "manual" ||
									Boolean(editingAssignment.isLockedForPublication) ||
									assignmentSubmitLoading
								}
							/>

							<div className="md:col-span-2">
								<TextField
									variant="outlined"
									label="Mô tả bài tập"
									placeholder="Mô tả dùng chung hoặc ghi chú cho bài tập..."
									fullWidth
									type="textarea"
									rows={2}
									value={assignmentEditForm.description || ""}
									onChange={(val) =>
										onFormChange((prev) => ({
											...prev,
											description: val,
										}))
									}
									disabled={assignmentSubmitLoading}
								/>
							</div>

							<div className="md:col-span-2 pt-1">
								<Checkbox
									id="edit-assignment-is-active"
									checked={Boolean(assignmentEditForm.isActive)}
									onCheckedChange={(checked) =>
										onFormChange((prev) => ({
											...prev,
											isActive: checked,
										}))
									}
									label="Bài tập đang hoạt động"
									disabled={assignmentSubmitLoading}
								/>
							</div>
						</div>
					</DialogBody>

					{/* Footer */}
					<DialogFooter className="flex items-center justify-end gap-2 border-t border-m3-outline-variant/20 px-6 py-4 bg-m3-surface-container-high/50">
						<Button
							type="button"
							colorStyle="text"
							onClick={onClose}
							disabled={assignmentSubmitLoading}
						>
							Hủy
						</Button>
						<Button
							type="button"
							colorStyle="filled"
							onClick={onSave}
							disabled={assignmentSubmitLoading}
						>
							{assignmentSubmitLoading ? (
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
									Lưu cập nhật
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
