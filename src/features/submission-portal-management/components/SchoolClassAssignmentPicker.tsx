import {
	Checkbox,
	Icon,
	LoadingIndicator,
	ScrollArea,
	Select,
	type SelectOption,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
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
	selectedSchoolName: string;
	selectedClassNames: string;
	classNameById: Map<string, string>;
	loadingClasses: boolean;
	loadingAssignments: boolean;
	onSchoolChange: (schoolId: string) => void;
	onToggleClass: (classId: string) => void;
	onToggleAssignment: (assignmentId: string) => void;
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
	selectedSchoolName,
	selectedClassNames,
	classNameById,
	loadingClasses,
	loadingAssignments,
	onSchoolChange,
	onToggleClass,
	onToggleAssignment,
}) => {
	const schoolOptions: SelectOption[] = useMemo(
		() => [
			{ value: "", label: "Chọn trường học..." },
			...schools.map((school) => ({
				value: school.id,
				label: `${school.name}${school.code ? ` (${school.code})` : ""}`,
			})),
		],
		[schools],
	);

	return (
		<div className="space-y-4 rounded-3xl bg-m3-surface-container p-4 sm:p-5 text-m3-on-surface">
			{/* Section Header */}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-start gap-2">
					<Icon
						name="hub"
						className="mt-0.5 text-base text-m3-primary shrink-0"
					/>
					<div>
						<h4 className="text-sm font-bold text-m3-on-surface">
							3. Phạm vi áp dụng (Trường, Lớp, Bài tập)
						</h4>
						<p className="text-xs text-m3-on-surface-variant">
							Chọn trường trước, sau đó chọn một hoặc nhiều lớp để tải các bài
							tập chấm tự động đã tạo.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 text-xs font-semibold text-m3-primary">
					<span>Đã chọn:</span>
					<span className="rounded-m3-full bg-m3-primary/10 px-2.5 py-0.5">
						{selectedClassIds.length} lớp
					</span>
					<span className="rounded-m3-full bg-m3-primary/10 px-2.5 py-0.5">
						{selectedAssignmentIds.length} bài tập
					</span>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				{/* Column 1: School Selection */}
				<div className="space-y-2">
					<span className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
						1. Trường học
					</span>

					<Select
						variant="outlined"
						label="Chọn trường"
						options={schoolOptions}
						value={selectedSchoolId}
						onChange={(val) => onSchoolChange(val)}
						searchable
						fullWidth
					/>

					{selectedSchoolName ? (
						<p className="text-xs text-m3-on-surface-variant">
							Đang chọn:{" "}
							<span className="font-semibold text-m3-on-surface">
								{selectedSchoolName}
							</span>
						</p>
					) : (
						<div className="rounded-2xl bg-m3-surface-container-high p-3 text-xs text-m3-on-surface-variant">
							Vui lòng chọn trường để hệ thống hiển thị danh sách lớp học tương
							ứng.
						</div>
					)}
				</div>

				{/* Column 2: Class Selection */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
							2. Danh sách lớp
						</span>
						{selectedClassIds.length > 0 && (
							<span className="text-xs text-m3-primary font-bold">
								{selectedClassIds.length} đã chọn
							</span>
						)}
					</div>

					<div className="rounded-2xl bg-m3-surface-container-high p-2">
						{loadingClasses && (
							<div className="flex flex-col items-center justify-center p-4 space-y-2">
								<LoadingIndicator
									size={20}
									aria-label="Đang tải danh sách lớp"
								/>
								<span className="text-xs text-m3-on-surface-variant">
									Đang tải danh sách lớp...
								</span>
							</div>
						)}

						{!loadingClasses && selectedSchoolId && classes.length > 0 && (
							<ScrollArea className="max-h-60 pr-1 space-y-1">
								{classes.map((cls) => {
									const isChecked = selectedClassIds.includes(cls.id);
									return (
										<div
											key={cls.id}
											className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${
												isChecked
													? "bg-m3-primary/10"
													: "hover:bg-m3-surface-container-highest"
											}`}
										>
											<Checkbox
												id={`class-pick-${cls.id}`}
												checked={isChecked}
												onCheckedChange={() => onToggleClass(cls.id)}
											/>
											<label
												htmlFor={`class-pick-${cls.id}`}
												className="cursor-pointer text-sm font-semibold text-m3-on-surface select-none grow"
											>
												{cls.name}
											</label>
										</div>
									);
								})}
							</ScrollArea>
						)}

						{!selectedSchoolId && (
							<div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-m3-on-surface-variant">
								<Icon name="school" className="text-2xl opacity-40" />
								<p className="text-xs">
									Vui lòng chọn trường ở bước 1 để hiển thị lớp.
								</p>
							</div>
						)}

						{selectedSchoolId && !loadingClasses && classes.length === 0 && (
							<div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-m3-on-surface-variant">
								<Icon name="groups" className="text-2xl opacity-40" />
								<p className="text-xs">
									Chưa có lớp nào đang hoạt động trong trường đã chọn.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Column 3: Auto-grading Assignments */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
							3. Bài tập chấm tự động
						</span>
						{selectedAssignmentIds.length > 0 && (
							<span className="text-xs text-m3-primary font-bold">
								{selectedAssignmentIds.length} đã chọn
							</span>
						)}
					</div>
					{selectedClassNames && (
						<p className="text-[11px] text-m3-on-surface-variant truncate">
							Lớp: {selectedClassNames}
						</p>
					)}

					<div className="rounded-2xl bg-m3-surface-container-high p-2">
						{loadingAssignments && (
							<div className="flex flex-col items-center justify-center p-4 space-y-2">
								<LoadingIndicator
									size={20}
									aria-label="Đang tải bài tập chấm tự động"
								/>
								<span className="text-xs text-m3-on-surface-variant">
									Đang tải bài tập...
								</span>
							</div>
						)}

						{!loadingAssignments &&
							selectedClassIds.length > 0 &&
							assignments.length > 0 && (
								<ScrollArea className="max-h-60 pr-1 space-y-2">
									{assignments.map((assignment) => {
										const isChecked = selectedAssignmentIds.includes(
											assignment.id,
										);
										return (
											<div
												key={assignment.id}
												className={`flex items-start gap-2.5 rounded-m3-sm p-2.5 transition-colors ${
													isChecked
														? "bg-m3-primary/10"
														: "hover:bg-m3-surface-container-high"
												}`}
											>
												<Checkbox
													id={`assign-pick-${assignment.id}`}
													checked={isChecked}
													onCheckedChange={() =>
														onToggleAssignment(assignment.id)
													}
													className="mt-0.5"
												/>
												<label
													htmlFor={`assign-pick-${assignment.id}`}
													className="cursor-pointer text-xs select-none grow"
												>
													<span className="block font-bold text-m3-on-surface">
														{assignment.name}
													</span>
													<span className="text-m3-on-surface-variant">
														Lớp {classNameById.get(assignment.classId) || "--"}{" "}
														• {subjectBadge(assignment.subject)} •{" "}
														{assignment.maxScore} điểm
													</span>
													{assignment.gradingApiEndpoint && (
														<span className="block truncate font-mono text-[11px] opacity-60">
															API: {assignment.gradingApiEndpoint}
														</span>
													)}
												</label>
											</div>
										);
									})}
								</ScrollArea>
							)}

						{!selectedSchoolId && (
							<div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-m3-on-surface-variant">
								<Icon name="assignment" className="text-2xl opacity-40" />
								<p className="text-xs">Vui lòng chọn trường trước.</p>
							</div>
						)}

						{selectedSchoolId && selectedClassIds.length === 0 && (
							<div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-m3-on-surface-variant">
								<Icon name="checklist" className="text-2xl opacity-40" />
								<p className="text-xs">
									Vui lòng chọn ít nhất 1 lớp ở bước 2 để xem bài tập.
								</p>
							</div>
						)}

						{!loadingAssignments &&
							selectedClassIds.length > 0 &&
							assignments.length === 0 && (
								<div className="rounded-m3-sm bg-m3-tertiary-container text-m3-on-tertiary-container p-3 text-xs space-y-1">
									<p className="font-bold">Chưa có bài tập chấm tự động</p>
									<p>
										Các lớp đã chọn chưa có bài tập chấm tự động. Hãy tạo bài
										tập ở trang Chấm điểm của lớp trước.
									</p>
								</div>
							)}
					</div>
				</div>
			</div>
		</div>
	);
};
