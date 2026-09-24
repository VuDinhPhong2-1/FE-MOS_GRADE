import {
	Button,
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
	Select,
	type SelectOption,
	Switch,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	DialogHeaderIcon,
	useUnsavedChangesGuard,
} from "../../../components/common";
import type { Assignment } from "../../../types/assignment.types";
import type { Class } from "../../../types/class.types";
import type { School } from "../../../types/school.types";
import type { ScoringPolicy } from "../utils/portalFormatters";
import { SchoolClassAssignmentPicker } from "./SchoolClassAssignmentPicker";

interface PortalFormDialogProps {
	open: boolean;
	mode: "create" | "edit";
	title: string;
	setTitle: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	maxSubmissions: number;
	setMaxSubmissions: (val: number) => void;
	scoringPolicy: ScoringPolicy;
	setScoringPolicy: (val: ScoringPolicy) => void;
	showLeaderboard: boolean;
	setShowLeaderboard: (val: boolean) => void;
	showDetailedFeedback: boolean;
	setShowDetailedFeedback: (val: boolean) => void;
	loading: boolean;
	onClose: () => void;
	onSubmitCreate?: () => void;
	onSubmitUpdate?: (isActive: boolean) => void;

	// Props for picker (create mode)
	schools?: School[];
	classes?: Class[];
	assignments?: Assignment[];
	selectedSchoolId?: string;
	selectedClassIds?: string[];
	selectedAssignmentIds?: string[];
	selectedSchoolName?: string;
	selectedClassNames?: string;
	classNameById?: Map<string, string>;
	loadingClasses?: boolean;
	loadingAssignments?: boolean;
	onSchoolChange?: (schoolId: string) => void;
	onToggleClass?: (classId: string) => void;
	onToggleAssignment?: (assignmentId: string) => void;
}

export const PortalFormDialog: React.FC<PortalFormDialogProps> = ({
	open,
	mode,
	title,
	setTitle,
	description,
	setDescription,
	maxSubmissions,
	setMaxSubmissions,
	scoringPolicy,
	setScoringPolicy,
	showLeaderboard,
	setShowLeaderboard,
	showDetailedFeedback,
	setShowDetailedFeedback,
	loading,
	onClose,
	onSubmitCreate,
	onSubmitUpdate,
	schools = [],
	classes = [],
	assignments = [],
	selectedSchoolId = "",
	selectedClassIds = [],
	selectedAssignmentIds = [],
	selectedSchoolName = "",
	selectedClassNames = "",
	classNameById = new Map(),
	loadingClasses = false,
	loadingAssignments = false,
	onSchoolChange = () => {},
	onToggleClass = () => {},
	onToggleAssignment = () => {},
}) => {
	const scoringOptions: SelectOption[] = useMemo(
		() => [
			{ value: "BestScore", label: "Điểm cao nhất (Best Score)" },
			{ value: "LatestScore", label: "Điểm mới nhất (Latest Score)" },
		],
		[],
	);

	const isCreate = mode === "create";

	// Track initial state when dialog opens to detect dirty changes
	const [initialState, setInitialState] = useState(() => ({
		title,
		description,
		maxSubmissions,
		scoringPolicy,
		showLeaderboard,
		showDetailedFeedback,
		selectedSchoolId,
		selectedClassIds,
		selectedAssignmentIds,
	}));
	const prevOpenRef = useRef(open);

	useEffect(() => {
		if (open && !prevOpenRef.current) {
			setInitialState({
				title,
				description,
				maxSubmissions,
				scoringPolicy,
				showLeaderboard,
				showDetailedFeedback,
				selectedSchoolId,
				selectedClassIds,
				selectedAssignmentIds,
			});
		}
		prevOpenRef.current = open;
	}, [
		open,
		title,
		description,
		maxSubmissions,
		scoringPolicy,
		showLeaderboard,
		showDetailedFeedback,
		selectedSchoolId,
		selectedClassIds,
		selectedAssignmentIds,
	]);

	const isDirty = useMemo(() => {
		if (!open) return false;
		return (
			title !== initialState.title ||
			description !== initialState.description ||
			maxSubmissions !== initialState.maxSubmissions ||
			scoringPolicy !== initialState.scoringPolicy ||
			showLeaderboard !== initialState.showLeaderboard ||
			showDetailedFeedback !== initialState.showDetailedFeedback ||
			selectedSchoolId !== initialState.selectedSchoolId ||
			selectedClassIds.length !== initialState.selectedClassIds.length ||
			selectedAssignmentIds.length !== initialState.selectedAssignmentIds.length
		);
	}, [
		open,
		title,
		description,
		maxSubmissions,
		scoringPolicy,
		showLeaderboard,
		showDetailedFeedback,
		selectedSchoolId,
		selectedClassIds,
		selectedAssignmentIds,
		initialState,
	]);

	const { handleSafeClose } = useUnsavedChangesGuard({
		isDirty,
		isOpen: open,
		isSubmitting: loading,
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => !isOpen && handleSafeClose(onClose)}
		>
			<DialogPortal open={open}>
				<DialogOverlay />
				<DialogContent
					hideCloseButton
					className={`flex max-h-[92vh] w-[calc(100%-2rem)] flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl ${
						isCreate ? "max-w-4xl" : "max-w-xl"
					}`}
				>
					{/* Modal Header */}
					<div className="flex items-center justify-between px-6 pt-5 pb-3">
						<DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
							<DialogHeaderIcon icon={isCreate ? "add_link" : "edit_square"} />
							<div>
								<DialogTitle className="text-lg font-bold text-m3-on-surface font-md3-expressive">
									{isCreate ? "Tạo cổng nộp bài" : "Sửa link nộp bài"}
								</DialogTitle>
								<DialogDescription className="text-xs text-m3-on-surface-variant">
									{isCreate
										? "Thiết lập link nộp bài công khai cho học sinh và kết nối bài tập tự chấm."
										: "Phạm vi trường, lớp và bài tập được giữ nguyên để bảo vệ dữ liệu nộp bài."}
								</DialogDescription>
							</div>
						</DialogHeader>
					</div>

					{/* Modal Body */}
					<DialogBody className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
						<div className="flex flex-col gap-4">
							{/* Group 1: General Info */}
							<div className="space-y-4 rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface">
								<div className="flex items-center gap-2">
									<Icon name="info" className="text-base text-m3-primary" />
									<h4 className="text-sm font-bold text-m3-on-surface">
										1. Thông tin chung
									</h4>
								</div>

								<TextField
									variant="outlined"
									label="Tiêu đề cổng nộp bài"
									required
									value={title}
									onChange={(val) => setTitle(val)}
									disabled={loading}
									leadingIcon={<Icon name="title" />}
									fullWidth
								/>

								<div className="grid gap-4 sm:grid-cols-2">
									<TextField
										variant="outlined"
										type="number"
										label="Giới hạn số lượt nộp (0 = không giới hạn)"
										value={String(maxSubmissions)}
										onChange={(val) =>
											setMaxSubmissions(Math.max(0, parseInt(val, 10) || 0))
										}
										disabled={loading}
										leadingIcon={<Icon name="pin" />}
										fullWidth
									/>

									<Select
										variant="outlined"
										label="Cách tính điểm"
										options={scoringOptions}
										value={scoringPolicy}
										onChange={(val) => setScoringPolicy(val as ScoringPolicy)}
										disabled={loading}
										fullWidth
									/>
								</div>

								<TextField
									variant="outlined"
									type="textarea"
									label="Mô tả / Hướng dẫn học sinh"
									placeholder="Nhập ghi chú hoặc hướng dẫn cho học sinh khi vào cổng nộp..."
									value={description}
									onChange={(val) => setDescription(val)}
									disabled={loading}
									leadingIcon={<Icon name="notes" />}
									fullWidth
								/>
							</div>

							{/* Group 2: Display & Leaderboard Preferences */}
							<div className="space-y-3 rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface">
								<div className="flex items-center gap-2">
									<Icon name="tune" className="text-base text-m3-primary" />
									<h4 className="text-sm font-bold text-m3-on-surface">
										2. Tùy chọn hiển thị
									</h4>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									<div className="flex items-center justify-between rounded-2xl bg-m3-surface-container-high p-3.5 transition-colors">
										<div className="space-y-0.5">
											<span className="block text-sm font-semibold text-m3-on-surface">
												Bảng xếp hạng
											</span>
											<span className="block text-xs text-m3-on-surface-variant">
												Hiển thị thứ hạng điểm số
											</span>
										</div>
										<Switch
											checked={showLeaderboard}
											onCheckedChange={setShowLeaderboard}
											disabled={loading}
										/>
									</div>

									<div className="flex items-center justify-between rounded-2xl bg-m3-surface-container-high p-3.5 transition-colors">
										<div className="space-y-0.5">
											<span className="block text-sm font-semibold text-m3-on-surface">
												Nhận xét chi tiết
											</span>
											<span className="block text-xs text-m3-on-surface-variant">
												Hiển thị phản hồi tự động
											</span>
										</div>
										<Switch
											checked={showDetailedFeedback}
											onCheckedChange={setShowDetailedFeedback}
											disabled={loading}
										/>
									</div>
								</div>
							</div>

							{/* Group 3: Scope Picker (Create Mode only) */}
							{isCreate && (
								<SchoolClassAssignmentPicker
									schools={schools}
									classes={classes}
									assignments={assignments}
									selectedSchoolId={selectedSchoolId}
									selectedClassIds={selectedClassIds}
									selectedAssignmentIds={selectedAssignmentIds}
									selectedSchoolName={selectedSchoolName}
									selectedClassNames={selectedClassNames}
									classNameById={classNameById}
									loadingClasses={loadingClasses}
									loadingAssignments={loadingAssignments}
									onSchoolChange={onSchoolChange}
									onToggleClass={onToggleClass}
									onToggleAssignment={onToggleAssignment}
								/>
							)}
						</div>
					</DialogBody>

					{/* Modal Footer */}
					<DialogFooter className="mt-0 flex justify-end gap-2 px-6 py-4">
						<Button
							type="button"
							colorStyle="text"
							disabled={loading}
							onClick={() => handleSafeClose(onClose)}
						>
							Hủy
						</Button>

						{isCreate ? (
							<Button
								type="button"
								colorStyle="filled"
								loading={loading}
								icon={<Icon name="add" />}
								onClick={onSubmitCreate}
							>
								Tạo link nộp bài
							</Button>
						) : (
							<>
								<Button
									type="button"
									colorStyle="outlined"
									disabled={loading}
									icon={<Icon name="link_off" />}
									className="text-m3-error hover:bg-m3-error/10 border-m3-error/40"
									onClick={() => onSubmitUpdate?.(false)}
								>
									Đóng link
								</Button>
								<Button
									type="button"
									colorStyle="filled"
									loading={loading}
									icon={<Icon name="check" />}
									onClick={() => onSubmitUpdate?.(true)}
								>
									Lưu và mở link
								</Button>
							</>
						)}
					</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
