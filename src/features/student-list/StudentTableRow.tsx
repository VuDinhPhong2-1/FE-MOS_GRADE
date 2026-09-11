import {
	Button,
	Icon,
	PlainTooltip,
	Switch,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { memo } from "react";
import type { Student } from "../../types/student.types";
import type { CompetencyLevel } from "./types";
import {
	competencyBadgeClass,
	isStudentActive,
	VALID_COMPETENCY_LEVELS,
} from "./types";

interface StudentTableRowProps {
	student: Student;
	index: number;
	readOnly: boolean;
	isSaving: boolean;
	onCompetencyChange: (student: Student, level: CompetencyLevel) => void;
	onExamToggle: (student: Student) => void;
	onEdit: (student: Student) => void;
	onDelete: (student: Student) => void;
}

const StudentTableRowComponent = ({
	student,
	index,
	readOnly,
	isSaving,
	onCompetencyChange,
	onExamToggle,
	onEdit,
	onDelete,
}: StudentTableRowProps) => {
	const isActive = isStudentActive(student);
	const isTemp = student.id.startsWith("temp-");

	return (
		<tr
			className={`transition-colors ${
				isActive
					? "hover:bg-m3-surface-container-high/60"
					: "bg-m3-error-container/15 hover:bg-m3-error-container/25"
			}`}
		>
			<td className="px-3 py-4 text-m3-on-surface-variant sm:px-6">
				{index + 1}
			</td>
			<td className="px-3 py-4 font-medium text-m3-on-surface sm:px-6">
				{student.middleName}
			</td>
			<td className="px-3 py-4 font-medium text-m3-on-surface sm:px-6">
				{student.firstName}
			</td>

			{/* Competency Level */}
			<td className="px-3 py-4 text-center sm:px-6">
				<div className="flex flex-col items-center gap-1">
					<div className="relative inline-flex items-center">
						<select
							value={student.competencyLevel || ""}
							disabled={readOnly || isSaving}
							onChange={(event) =>
								onCompetencyChange(
									student,
									event.target.value as CompetencyLevel,
								)
							}
							className={`appearance-none rounded-full border border-m3-outline-variant/60 py-1 pl-3 pr-7 text-center text-xs font-semibold outline-none transition cursor-pointer ${competencyBadgeClass(
								student.competencyLevel,
							)} ${isSaving ? "cursor-not-allowed opacity-70" : "hover:brightness-95 focus:ring-2 focus:ring-m3-primary/30"}`}
							title={
								isTemp
									? "Học sinh tạm, sẽ lưu cùng danh sách học sinh."
									: "Cập nhật nhanh năng lực"
							}
						>
							<option value="">--</option>
							{VALID_COMPETENCY_LEVELS.map((level) => (
								<option key={level} value={level}>
									{level}
								</option>
							))}
						</select>
						<Icon
							name="expand_more"
							size={16}
							className="pointer-events-none absolute right-1.5 text-m3-on-surface-variant"
						/>
					</div>
					{isSaving && (
						<span className="text-[10px] text-m3-on-surface-variant">
							Đang lưu...
						</span>
					)}
				</div>
			</td>

			{/* Notes */}
			<td className="px-3 py-4 text-m3-on-surface-variant sm:px-6">
				<div className="max-w-65 truncate" title={student.notes || ""}>
					{student.notes?.trim() || "--"}
				</div>
			</td>

			{/* Status */}
			<td className="px-3 py-4 text-center sm:px-6">
				<span
					className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
						isActive
							? "bg-m3-secondary-container text-m3-on-secondary-container"
							: "bg-m3-error-container text-m3-on-error-container"
					}`}
				>
					<Icon
						name={isActive ? "check_circle" : "cancel"}
						variant="rounded"
						size={13}
					/>
					{isActive ? "Hoạt động" : "Ngừng"}
				</span>
			</td>

			{/* Exam Switch */}
			<td className="px-3 py-4 text-left sm:px-6">
				<div className="inline-flex items-center gap-2.5">
					<Switch
						checked={Boolean(student.thi)}
						onCheckedChange={() => onExamToggle(student)}
						disabled={readOnly || isSaving}
						ariaLabel={
							student.thi ? "Học sinh dự thi" : "Học sinh không dự thi"
						}
					/>
					<span className="min-w-26.25 select-none whitespace-nowrap text-xs font-medium text-m3-on-surface-variant">
						{student.thi ? "Taking Exam" : "Not Taking Exam"}
					</span>
				</div>
			</td>

			{/* Actions */}
			<td className="px-3 py-4 text-center sm:px-6">
				{!readOnly ? (
					<div className="inline-flex items-center gap-1.5">
						<TooltipBox
							tooltip={<PlainTooltip>Sửa học sinh</PlainTooltip>}
							placement="top"
						>
							<Button
								colorStyle="tonal"
								size="xs"
								onClick={() => onEdit(student)}
								disabled={isTemp}
								icon={<Icon name="edit" variant="rounded" size={14} />}
							>
								Sửa
							</Button>
						</TooltipBox>
						<TooltipBox
							tooltip={<PlainTooltip>Xóa học sinh</PlainTooltip>}
							placement="top"
						>
							<Button
								colorStyle="text"
								size="xs"
								className="text-m3-error hover:bg-m3-error-container/40"
								onClick={() => onDelete(student)}
								icon={<Icon name="delete" variant="rounded" size={14} />}
							>
								Xóa
							</Button>
						</TooltipBox>
					</div>
				) : (
					<span className="text-xs text-m3-on-surface-variant">Chỉ xem</span>
				)}
			</td>
		</tr>
	);
};

export const StudentTableRow = memo(
	StudentTableRowComponent,
	(prev, next) =>
		prev.student === next.student &&
		prev.index === next.index &&
		prev.readOnly === next.readOnly &&
		prev.isSaving === next.isSaving &&
		prev.onCompetencyChange === next.onCompetencyChange &&
		prev.onExamToggle === next.onExamToggle &&
		prev.onEdit === next.onEdit &&
		prev.onDelete === next.onDelete,
);
