import { Icon, ProgressIndicator } from "@bug-on/m3-expressive";
import { memo } from "react";
import type { Student } from "../../types/student.types";
import { StudentTableRow } from "./StudentTableRow";
import type {
	CompetencyLevel,
	NameSortDirection,
	StatusSortDirection,
} from "./types";

interface StudentTableProps {
	displayedStudents: Student[];
	totalStudentsCount: number;
	isLoading: boolean;
	readOnly: boolean;
	inlineSavingStudentId: string | null;
	nameSortDirection: NameSortDirection;
	statusSortDirection: StatusSortDirection;
	onToggleNameSort: () => void;
	onToggleStatusSort: () => void;
	onCompetencyChange: (student: Student, level: CompetencyLevel) => void;
	onExamToggle: (student: Student) => void;
	onEdit: (student: Student) => void;
	onDelete: (student: Student) => void;
}

const StudentTableComponent = ({
	displayedStudents,
	totalStudentsCount,
	isLoading,
	readOnly,
	inlineSavingStudentId,
	nameSortDirection,
	statusSortDirection,
	onToggleNameSort,
	onToggleStatusSort,
	onCompetencyChange,
	onExamToggle,
	onEdit,
	onDelete,
}: StudentTableProps) => {
	return (
		<section className="overflow-hidden rounded-3xl bg-m3-surface-container shadow-xs text-m3-on-surface">
			<div className="flex items-center justify-between border-b border-m3-outline-variant/40 bg-m3-surface-container-high px-4 py-3">
				<span className="text-sm font-semibold text-m3-on-surface">
					Danh sách học sinh
				</span>
				<span className="text-xs text-m3-on-surface-variant">
					Bảng dữ liệu chi tiết theo từng học sinh
				</span>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-245 w-full text-xs sm:text-sm">
					<thead className="sticky top-0 z-10 bg-m3-surface-container-highest">
						<tr>
							<th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								STT
							</th>
							<th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								Họ và tên đệm
							</th>
							<th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								<button
									type="button"
									onClick={onToggleNameSort}
									className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-m3-on-surface font-semibold hover:bg-m3-surface-container hover:text-m3-primary transition-colors cursor-pointer"
									title="Sắp xếp theo tên"
								>
									<span>Tên</span>
									<Icon
										name={
											nameSortDirection === "asc"
												? "arrow_upward"
												: nameSortDirection === "desc"
													? "arrow_downward"
													: "unfold_more"
										}
										size={16}
										className={
											nameSortDirection !== "none"
												? "text-m3-primary"
												: "text-m3-on-surface-variant"
										}
									/>
								</button>
							</th>
							<th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								Năng lực
							</th>
							<th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								Ghi chú
							</th>
							<th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								<button
									type="button"
									onClick={onToggleStatusSort}
									className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-m3-on-surface font-semibold hover:bg-m3-surface-container hover:text-m3-primary transition-colors cursor-pointer"
									title="Sắp xếp theo trạng thái"
								>
									<span>Trạng thái</span>
									<Icon
										name={
											statusSortDirection === "active-first"
												? "arrow_upward"
												: statusSortDirection === "inactive-first"
													? "arrow_downward"
													: "unfold_more"
										}
										size={16}
										className={
											statusSortDirection !== "none"
												? "text-m3-primary"
												: "text-m3-on-surface-variant"
										}
									/>
								</button>
							</th>
							<th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								Exam
							</th>
							<th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-m3-on-surface-variant sm:px-6">
								Hành động
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-m3-outline-variant/30 bg-m3-surface">
						{isLoading ? (
							<tr>
								<td
									colSpan={8}
									className="px-3 py-10 text-center text-m3-on-surface-variant"
								>
									<div className="flex flex-col items-center justify-center gap-2">
										<ProgressIndicator
											variant="circular"
											shape="wavy"
											size={32}
											aria-label="Đang tải dữ liệu học sinh"
										/>
										<span className="text-xs font-medium text-m3-on-surface-variant">
											Đang tải dữ liệu...
										</span>
									</div>
								</td>
							</tr>
						) : displayedStudents.length === 0 ? (
							<tr>
								<td
									colSpan={8}
									className="px-3 py-6 text-center text-m3-on-surface-variant"
								>
									{totalStudentsCount === 0
										? "Chưa có học sinh nào. Vui lòng nhập file Excel."
										: "Không có học sinh nào khớp từ khóa tìm kiếm."}
								</td>
							</tr>
						) : (
							displayedStudents.map((st, index) => (
								<StudentTableRow
									key={st.id}
									student={st}
									index={index}
									readOnly={readOnly}
									isSaving={inlineSavingStudentId === st.id}
									onCompetencyChange={onCompetencyChange}
									onExamToggle={onExamToggle}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							))
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
};

export const StudentTable = memo(StudentTableComponent);
