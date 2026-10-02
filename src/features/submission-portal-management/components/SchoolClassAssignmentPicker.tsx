import {
	Button,
	Icon,
	List,
	ListItem,
	LoadingIndicator,
	ScrollArea,
	Select,
	type SelectOption,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo, useState } from "react";
import type { Assignment } from "../../../types/assignment.types";
import type { Class } from "../../../types/class.types";
import type { School } from "../../../types/school.types";
import { subjectBadge } from "../utils/portalFormatters";

interface SchoolClassAssignmentPickerProps {
	schools: School[];
	classes: Class[];
	assignments: Assignment[];
	selectedSchoolId: string;
	selectedClassIds: string[];
	selectedAssignmentIds: string[];
	selectedSchoolName?: string;
	selectedClassNames?: string;
	classNameById?: Map<string, string>;
	loadingClasses: boolean;
	loadingAssignments: boolean;
	onSchoolChange: (schoolId: string) => void;
	onClassChange?: (classId: string) => void;
	onAssignmentChange?: (assignmentId: string) => void;
	onToggleClass?: (classId: string) => void;
	onToggleAssignment?: (assignmentId: string) => void;
	onSelectAllAssignments?: (allIds: string[]) => void;
	onClearAssignments?: () => void;
}

export const SchoolClassAssignmentPicker: React.FC<
	SchoolClassAssignmentPickerProps
> = ({
	schools,
	classes,
	assignments,
	selectedSchoolId,
	selectedClassIds,
	selectedAssignmentIds,
	selectedSchoolName = "",
	selectedClassNames = "",
	classNameById,
	loadingClasses,
	loadingAssignments,
	onSchoolChange,
	onClassChange,
	onAssignmentChange,
	onToggleClass,
	onToggleAssignment,
	onSelectAllAssignments,
	onClearAssignments,
}) => {
		const selectedClassId = selectedClassIds[0] || "";
		const [searchQuery, setSearchQuery] = useState("");

		const handleClassSelect = (val: string) => {
			if (onClassChange) {
				onClassChange(val);
			} else if (onToggleClass) {
				onToggleClass(val);
			}
		};

		const handleAssignmentToggle = (assignmentId: string) => {
			if (onToggleAssignment) {
				onToggleAssignment(assignmentId);
			} else if (onAssignmentChange) {
				onAssignmentChange(assignmentId);
			}
		};

		// 1. School options
		const schoolOptions: SelectOption[] = useMemo(
			() => [
				{ value: "", label: "Chọn trường học..." },
				...schools.map((school) => ({
					value: school.id,
					label: school.name,
				})),
			],
			[schools],
		);

		// 2. Class options
		const classOptions: SelectOption[] = useMemo(
			() => [
				{ value: "", label: "Chọn lớp học..." },
				...classes.map((cls) => ({
					value: cls.id,
					label: cls.name,
				})),
			],
			[classes],
		);

		// Filter assignments locally by search query
		const filteredAssignments = useMemo(() => {
			if (!searchQuery.trim()) return assignments;
			const q = searchQuery.toLowerCase().trim();
			return assignments.filter(
				(a) =>
					a.name.toLowerCase().includes(q) ||
					Boolean(a.subject?.toLowerCase().includes(q)),
			);
		}, [assignments, searchQuery]);

		const handleSelectAllFiltered = () => {
			const targetIds = filteredAssignments.map((a) => a.id);
			if (onSelectAllAssignments) {
				// Combine already selected with filtered target IDs
				const combined = Array.from(
					new Set([...selectedAssignmentIds, ...targetIds]),
				);
				onSelectAllAssignments(combined);
			} else {
				for (const id of targetIds) {
					if (!selectedAssignmentIds.includes(id)) {
						onToggleAssignment?.(id);
					}
				}
			}
		};

		const handleClearAll = () => {
			if (onClearAssignments) {
				onClearAssignments();
			} else {
				for (const id of selectedAssignmentIds) {
					onToggleAssignment?.(id);
				}
			}
		};

		// Check whether all steps are completed
		const isStepComplete = Boolean(
			selectedSchoolId && selectedClassId && selectedAssignmentIds.length > 0,
		);

		return (
			<div className="space-y-4 rounded-3xl bg-m3-surface-container-lowest p-4 sm:p-5 text-m3-on-surface">
				{/* Section Header */}
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-start gap-2.5">
						<div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-m3-primary/10 text-m3-primary shrink-0">
							<Icon name="hub" className="text-lg" />
						</div>
						<div>
							<h4 className="text-sm font-bold text-m3-on-surface">
								3. Phạm vi áp dụng (Trường, Lớp, Bài tập)
							</h4>
							<p className="text-xs text-m3-on-surface-variant">
								Chọn trường trước, sau đó chọn lớp và tích chọn một hoặc nhiều bài
								tập chấm tự động.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-1.5 text-xs font-semibold">
						<span
							className={`inline-flex items-center gap-1 rounded-m3-full px-2.5 py-1 transition-colors ${isStepComplete
									? "bg-m3-primary/15 text-m3-primary font-bold"
									: "bg-m3-surface-container-high text-m3-on-surface-variant"
								}`}
						>
							<Icon
								name={isStepComplete ? "check_circle" : "pending"}
								className="text-sm"
							/>
							{isStepComplete
								? `Đã chọn: ${selectedAssignmentIds.length} bài tập`
								: "Đang thiết lập"}
						</span>
					</div>
				</div>

				{/* Column Layout: Step 1 (School) -> Step 2 (Class) -> Step 3 (Assignment Direct Checkboxes) */}
				<div className="flex flex-col gap-4">
					{/* Step 1: School Selector */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<label
								htmlFor="portal-select-school"
								className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant"
							>
								<span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-m3-primary text-[10px] text-m3-on-primary">
									1
								</span>
								Trường học
							</label>
							{selectedSchoolName && (
								<span className="text-[11px] font-medium text-m3-primary truncate max-w-50">
									{selectedSchoolName}
								</span>
							)}
						</div>

						<Select
							id="portal-select-school"
							variant="filled"
							label="Chọn trường học"
							options={schoolOptions}
							value={selectedSchoolId}
							onChange={(val) => onSchoolChange(val)}
							searchable
							fullWidth
							placeholder="Tìm hoặc chọn trường học..."
							emptyText="Không tìm thấy trường học nào"
						/>
					</div>

					{/* Step 2: Class Selector */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<label
								htmlFor="portal-select-class"
								className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${!selectedSchoolId
										? "text-m3-on-surface-variant/50"
										: "text-m3-on-surface-variant"
									}`}
							>
								<span
									className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] ${!selectedSchoolId
											? "bg-m3-surface-container-highest text-m3-on-surface-variant/60"
											: "bg-m3-primary text-m3-on-primary"
										}`}
								>
									2
								</span>
								Lớp học
							</label>
							{selectedClassNames && selectedSchoolId && (
								<span className="text-[11px] font-medium text-m3-primary truncate max-w-50">
									{selectedClassNames}
								</span>
							)}
						</div>

						<Select
							id="portal-select-class"
							variant="filled"
							label="Chọn lớp học"
							options={classOptions}
							value={selectedClassId}
							onChange={(val) => handleClassSelect(val)}
							searchable
							loading={loadingClasses}
							disabled={
								!selectedSchoolId || loadingClasses || classes.length === 0
							}
							fullWidth
							placeholder={
								!selectedSchoolId
									? "Vui lòng chọn trường trước"
									: loadingClasses
										? "Đang tải danh sách lớp..."
										: classes.length === 0
											? "Trường chưa có lớp học nào"
											: "Tìm hoặc chọn lớp học..."
							}
							emptyText="Không tìm thấy lớp học nào"
						/>

						{/* Supporting Helper / Notice */}
						{!selectedSchoolId && (
							<p className="flex items-center gap-1.5 text-[11px] text-m3-on-surface-variant/70 pl-1">
								<Icon name="lock" className="text-xs" />
								Chọn trường học ở bước 1 để mở khóa chọn lớp.
							</p>
						)}
						{selectedSchoolId && !loadingClasses && classes.length === 0 && (
							<div className="flex items-center gap-2 rounded-2xl bg-m3-surface-container-high p-2.5 text-xs text-m3-on-surface-variant">
								<Icon name="info" className="text-base text-m3-error shrink-0" />
								<span>Trường này chưa có lớp nào đang hoạt động.</span>
							</div>
						)}
					</div>

					{/* Step 3: Direct Interactive Checkbox Assignment List */}
					<div className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-1.5">
							<label
								htmlFor="portal-assignment-search"
								className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${!selectedClassId
										? "text-m3-on-surface-variant/50"
										: "text-m3-on-surface-variant"
									}`}
							>
								<span
									className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] ${!selectedClassId
											? "bg-m3-surface-container-highest text-m3-on-surface-variant/60"
											: "bg-m3-primary text-m3-on-primary"
										}`}
								>
									3
								</span>
								Bài tập chấm tự động
							</label>
						</div>

						{/* Loading State */}
						{loadingAssignments && (
							<div className="flex flex-col items-center justify-center rounded-2xl bg-m3-surface-container-high p-6 space-y-2">
								<LoadingIndicator
									size={32}
									aria-label="Đang tải danh sách bài tập"
								/>
								<span className="text-xs text-m3-on-surface-variant">
									Đang tải bài tập chấm tự động...
								</span>
							</div>
						)}

						{/* Step 3 Locked: No School or No Class selected */}
						{!loadingAssignments && !selectedSchoolId && (
							<div className="flex items-center gap-2 rounded-2xl bg-m3-surface-container-high p-3 text-xs text-m3-on-surface-variant">
								<Icon name="lock" className="text-base opacity-60 shrink-0" />
								<span>Vui lòng chọn trường ở bước 1 để hiển thị lớp.</span>
							</div>
						)}

						{!loadingAssignments && selectedSchoolId && !selectedClassId && (
							<div className="flex items-center gap-2 rounded-2xl bg-m3-surface-container-high p-3 text-xs text-m3-on-surface-variant">
								<Icon name="lock" className="text-base opacity-60 shrink-0" />
								<span>
									Vui lòng chọn lớp học ở bước 2 để xem danh sách bài tập.
								</span>
							</div>
						)}

						{/* Empty State: Class has no auto-grading assignments */}
						{!loadingAssignments &&
							selectedClassId &&
							assignments.length === 0 && (
								<div className="flex items-start gap-2.5 rounded-xl bg-m3-tertiary-container/30 p-3 text-xs text-m3-on-tertiary-container">
									<Icon
										name="warning"
										className="mt-0.5 text-base text-m3-tertiary shrink-0"
									/>
									<div className="space-y-0.5">
										<p className="font-bold">Lớp chưa có bài tập chấm tự động</p>
										<p className="text-[11px] opacity-80">
											Lớp đã chọn chưa có bài tập chấm tự động có API endpoint.
											Hãy tạo bài tập ở trang Chấm điểm của lớp trước.
										</p>
									</div>
								</div>
							)}

						{/* Active Checkbox List with Search Input */}
						{!loadingAssignments && selectedClassId && assignments.length > 0 && (
							<div className="space-y-2 rounded-2xl bg-m3-surface-container-high/60 px-3 pt-3 pb-0">
								<div className="flex flex-row gap-3 justify-between items-center">
									{/* Search Filter Input (only show when more than 3 assignments) */}
									{assignments.length > 3 && (
										<TextField
											id="portal-assignment-search"
											variant="filled"
											placeholder="Tìm kiếm bài tập"
											value={searchQuery}
											dense
											onChange={(val) => setSearchQuery(val)}
											leadingIcon={<Icon name="search" />}
											trailingIconMode={searchQuery ? "clear" : "none"}
											className="w-1/2"
										/>
									)}
									{/* Quick action buttons & counter */}
									{selectedClassId && assignments.length > 0 && (
										<div className="flex items-center gap-2 text-xs">
											<Text
												variant="label-sm"
												className="text-m3-on-surface-variant w-full"
											>
												Đã chọn:{" "}
												<span className="font-bold text-m3-primary">
													{selectedAssignmentIds.length}
												</span>
												/{assignments.length}
											</Text>
											<Button
												colorStyle="filled"
												onClick={handleSelectAllFiltered}
												fullWidth
											>
												Chọn tất cả
											</Button>
											{selectedAssignmentIds.length > 0 && (
												<Button
													colorStyle="outlined"
													onClick={handleClearAll}
													fullWidth
												>
													Bỏ chọn
												</Button>
											)}
										</div>
									)}
								</div>

								{/* Scrollable Checkbox List using MD3 Expressive Segmented List */}
								{filteredAssignments.length > 0 ? (
									<ScrollArea
										type="scroll"
										orientation="vertical"
										scrollbarSize={8}
										className="max-h-60 overflow-hidden rounded-t-m3-md"
									>
										<List
											variant="expressive"
											listStyle="segmented"
											selectionMode="multi-select"
											value={selectedAssignmentIds}
											outerRadius={12}
											innerRadius={2}
											onChange={(val) => {
												const newIds = Array.isArray(val) ? val : [val];
												if (onSelectAllAssignments) {
													onSelectAllAssignments(newIds);
												} else {
													for (const id of newIds) {
														if (!selectedAssignmentIds.includes(id)) {
															handleAssignmentToggle(id);
														}
													}
													for (const id of selectedAssignmentIds) {
														if (!newIds.includes(id)) {
															handleAssignmentToggle(id);
														}
													}
												}
											}}
											className="w-full pb-3"
										>
											{filteredAssignments.map((assignment) => {
												const isChecked = selectedAssignmentIds.includes(
													assignment.id,
												);
												return (
													<ListItem
														key={assignment.id}
														value={assignment.id}
														interactive
														selected={isChecked}
														leadingType="checkbox"
														headline={
															<div className="flex items-center gap-2 flex-wrap">
																<span className="font-bold text-xs text-m3-on-surface">
																	{assignment.name}
																</span>
																<span className="rounded-m3-full bg-m3-primary/10 px-2 py-0.5 text-[10px] font-semibold text-m3-primary shrink-0">
																	{subjectBadge(assignment.subject)}
																</span>
															</div>
														}
														supportingText={
															<div className="flex items-center gap-2 flex-wrap text-[11px] text-m3-on-surface-variant">
																<span>Tối đa {assignment.maxScore} điểm</span>
																{assignment.gradingApiEndpoint && (
																	<span className="font-mono text-[10px] opacity-70">
																		• Auto-grade
																	</span>
																)}
																{classNameById && assignment.classId && (
																	<span className="opacity-70">
																		• Lớp{" "}
																		{classNameById.get(assignment.classId) ||
																			"--"}
																	</span>
																)}
															</div>
														}
														supportingTextLines={1}
													/>
												);
											})}
										</List>
									</ScrollArea>
								) : (
									<div className="p-4 text-center text-xs text-m3-on-surface-variant">
										Không tìm thấy bài tập nào khớp với từ khóa "{searchQuery}".
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};
