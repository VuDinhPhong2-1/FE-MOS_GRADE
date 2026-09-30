import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { LoadingIndicator } from "@bug-on/m3-expressive/feedback";
import { Select } from "@bug-on/m3-expressive/forms";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import type {
	PublicPortalClass,
	PublicPortalStudent,
} from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";

export interface IdentitySectionProps {
	classes: PublicPortalClass[];
	classId: string;
	onClassChange: (classId: string) => void;
	onStudentSearchChange: (search: string) => void;
	filteredStudents: PublicPortalStudent[];
	studentId: string;
	onStudentChange: (studentId: string) => void;
	loadingStudents: boolean;
	selectedClass?: PublicPortalClass;
	selectedStudent?: PublicPortalStudent;
	completedCount: number;
	totalAssignmentsCount: number;
}

export const IdentitySection = ({
	classes,
	classId,
	onClassChange,
	onStudentSearchChange,
	filteredStudents,
	studentId,
	onStudentChange,
	loadingStudents,
	selectedClass,
	selectedStudent,
	completedCount,
	totalAssignmentsCount,
}: IdentitySectionProps) => {
	const classOptions = classes.map((c) => ({
		label: c.name,
		value: c.id,
	}));

	const studentOptions = filteredStudents.map((s) => ({
		label: s.fullName,
		value: s.id,
	}));

	return (
		<Card
			variant="filled"
			className="flex flex-col gap-4 bg-m3-surface-container-lowest p-5 text-m3-on-surface rounded-m3-xl"
		>
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold h-10",
						classId
							? "bg-m3-primary-container text-m3-on-primary-container"
							: "bg-m3-surface-container-high text-m3-on-surface-variant",
					)}
				>
					<Icon
						name={classId ? "check_circle" : "looks_one"}
						size={16}
						animateFill
						fill={classId ? 1 : 0}
					/>
					1. Chọn lớp
				</span>
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold h-10",
						studentId
							? "bg-m3-primary-container text-m3-on-primary-container"
							: "bg-m3-surface-container-high text-m3-on-surface-variant",
					)}
				>
					<Icon
						name={studentId ? "check_circle" : "looks_two"}
						size={16}
						animateFill
						fill={studentId ? 1 : 0}
					/>
					2. Xác nhận học sinh
				</span>
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold h-10",
						completedCount === totalAssignmentsCount
							? "bg-m3-primary-container text-m3-on-primary-container"
							: "bg-m3-surface-container-high text-m3-on-surface-variant",
					)}
				>
					<Icon
						name={
							completedCount === totalAssignmentsCount
								? "check_circle"
								: "assignment_turned_in"
						}
						size={16}
						animateFill
						fill={completedCount === totalAssignmentsCount ? 1 : 0}
					/>
					3. Nộp bài ({completedCount}/{totalAssignmentsCount})
				</span>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Select
					variant="filled"
					colorVariant="vibrant"
					label="Lớp học"
					placeholder="Chọn lớp"
					options={classOptions}
					value={classId}
					onChange={(value) => onClassChange(value)}
				/>

				<Select
					variant="filled"
					colorVariant="vibrant"
					label="Tên của bạn"
					placeholder={
						loadingStudents
							? "Đang tải danh sách..."
							: !classId
								? "Vui lòng chọn lớp trước"
								: "Tìm hoặc chọn tên của bạn"
					}
					searchable
					onSearchChange={(value) => onStudentSearchChange(value)}
					emptyText="Không tìm thấy học sinh phù hợp"
					leadingIcon={<Icon name="search" size={20} />}
					options={studentOptions}
					value={studentId}
					disabled={!classId || loadingStudents}
					loading={loadingStudents}
					onChange={(value) => {
						onStudentChange(value);
						onStudentSearchChange("");
					}}
				/>
			</div>

			{classId && loadingStudents && (
				<Card
					variant="filled"
					className="flex items-center gap-2 bg-m3-secondary-container p-3 text-m3-on-secondary-container"
				>
					<LoadingIndicator aria-label="Đang tải học sinh" size={20} />
					<Text variant="body-sm" className="font-semibold">
						Đang tải danh sách học sinh của lớp{" "}
						{selectedClass?.name || "đã chọn"}...
					</Text>
				</Card>
			)}

			{classId && !loadingStudents && filteredStudents.length === 0 && (
				<Card
					variant="filled"
					className="flex items-center gap-2 bg-m3-tertiary-container p-3 text-m3-on-tertiary-container"
				>
					<Icon name="info" size={20} />
					<Text variant="body-sm">
						Không tìm thấy học sinh phù hợp. Hãy kiểm tra lại lớp hoặc từ khóa
						tìm kiếm.
					</Text>
				</Card>
			)}

			{selectedStudent && (
				<Card
					variant="filled"
					className="flex items-center justify-between gap-2 bg-m3-tertiary-container rounded-m3-md p-4 text-m3-on-tertiary-container flex-row"
				>
					<div className="flex items-center gap-2">
						<Icon
							name="account_circle"
							size={24}
							className="text-m3-on-tertiary-container"
						/>
						<Text variant="body-lg" className="text-m3-on-tertiary-container">
							Đang nộp bài cho{" "}
							<span className="font-bold text-m3-on-tertiary-container">
								{selectedStudent.fullName}
							</span>{" "}
							— lớp{" "}
							<span className="font-bold text-m3-on-tertiary-container">
								{selectedClass?.name}
							</span>
						</Text>
					</div>
					<Button
						colorStyle="text"
						onClick={() => onStudentChange("")}
						size="sm"
						className="text-m3-on-tertiary-container"
					>
						Đổi học sinh
					</Button>
				</Card>
			)}
		</Card>
	);
};
