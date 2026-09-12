import { Icon, useSnackbar } from "@bug-on/m3-expressive";
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx-js-style";
import { useAuth } from "../context/AuthContext";
import {
	AddStudentModal,
	ClassAnalyticsPanel,
	DeleteStudentDialog,
	EditStudentModal,
	isStudentActive,
	mapRowsToTempStudents,
	type NameSortDirection,
	normalizeText,
	PasteStudentModal,
	type StatusSortDirection,
	StudentActionToolbar,
	StudentHeader,
	type StudentListProps,
	StudentTable,
	StudentToolbar,
	useStudentData,
	vietnameseCollator,
} from "../features/student-list";
import type { Student } from "../types/student.types";

const StudentList = ({
	selectedClass,
	readOnly = false,
	onBack,
}: StudentListProps) => {
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const [searchKeyword, setSearchKeyword] = useState("");
	const [nameSortDirection, setNameSortDirection] =
		useState<NameSortDirection>("none");
	const [statusSortDirection, setStatusSortDirection] =
		useState<StatusSortDirection>("none");

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingStudent, setEditingStudent] = useState<Student | null>(null);
	const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
	const [isDeletingStudent, setIsDeletingStudent] = useState(false);

	const {
		students,
		assignments,
		isLoading,
		isStudentMetadataSyncing,
		inlineSavingStudentId,
		flashMessage,
		setFlashMessage,
		studentNewList,
		activeStudents,
		inactiveStudentsCount,
		loadStudents,
		appendImportedStudents,
		handleSaveStudents,
		handleDeleteStudent,
		handleInlineCompetencyChange,
		handleInlineExamToggle,
		handleSyncStudentMetadataToGoogleSheet,
	} = useStudentData({ selectedClass, readOnly, getAccessToken });

	const displayedStudents = useMemo(() => {
		const keyword = normalizeText(searchKeyword);
		let list = [...students];

		if (keyword) {
			list = list.filter((st) =>
				normalizeText(`${st.middleName} ${st.firstName}`).includes(keyword),
			);
		}

		if (nameSortDirection === "asc") {
			list.sort((a, b) => {
				const byFirstName = vietnameseCollator.compare(
					a.firstName || "",
					b.firstName || "",
				);
				if (byFirstName !== 0) return byFirstName;
				return vietnameseCollator.compare(
					a.middleName || "",
					b.middleName || "",
				);
			});
		} else if (nameSortDirection === "desc") {
			list.sort((a, b) => {
				const byFirstName = vietnameseCollator.compare(
					b.firstName || "",
					a.firstName || "",
				);
				if (byFirstName !== 0) return byFirstName;
				return vietnameseCollator.compare(
					b.middleName || "",
					a.middleName || "",
				);
			});
		} else if (statusSortDirection === "active-first") {
			list.sort(
				(a, b) => Number(isStudentActive(b)) - Number(isStudentActive(a)),
			);
		} else if (statusSortDirection === "inactive-first") {
			list.sort(
				(a, b) => Number(isStudentActive(a)) - Number(isStudentActive(b)),
			);
		}

		return list;
	}, [students, searchKeyword, nameSortDirection, statusSortDirection]);

	const toggleNameSort = useCallback(() => {
		setStatusSortDirection("none");
		setNameSortDirection((prev) => {
			if (prev === "none") return "asc";
			if (prev === "asc") return "desc";
			return "none";
		});
	}, []);

	const toggleStatusSort = useCallback(() => {
		setNameSortDirection("none");
		setStatusSortDirection((prev) => {
			if (prev === "none") return "active-first";
			if (prev === "active-first") return "inactive-first";
			return "none";
		});
	}, []);

	const selectedClassId = selectedClass?.id;
	const selectedClassName = selectedClass?.name;
	const returnPath = `${location.pathname}${location.search}`;

	const handleOpenViewScoresModal = useCallback(() => {
		if (!selectedClassId) return;
		navigate(`/scores/class/${selectedClassId}`, {
			state: {
				className: selectedClassName,
				returnPath,
			},
		});
	}, [selectedClassId, selectedClassName, returnPath, navigate]);

	const handleGrade = useCallback(() => {
		if (readOnly) {
			void showSnackbar({
				message: "Bạn chỉ có quyền xem lớp này.",
				withDismissAction: true,
				duration: 3500,
			});
			return;
		}

		if (activeStudents.length === 0) {
			void showSnackbar({
				message: "Không có học sinh đang hoạt động để chấm điểm!",
				withDismissAction: true,
				duration: 3500,
			});
			return;
		}

		if (!selectedClassId) return;

		navigate(`/grading/class/${selectedClassId}`, {
			state: {
				className: selectedClassName,
				returnPath,
			},
		});
	}, [
		readOnly,
		activeStudents.length,
		selectedClassId,
		selectedClassName,
		returnPath,
		navigate,
		showSnackbar,
	]);

	const handleFileUpload = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			if (readOnly) return;

			const file = e.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (evt) => {
				const bstr = evt.target?.result;
				const wb = XLSX.read(bstr, { type: "binary" });
				const wsname = wb.SheetNames[0];
				const ws = wb.Sheets[wsname];
				const data = XLSX.utils.sheet_to_json(ws, {
					header: 1,
					defval: "",
				}) as Array<Array<string | number>>;
				const list = mapRowsToTempStudents(data);

				if (list.length === 0) {
					setFlashMessage("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
					return;
				}

				appendImportedStudents(list);
				setFlashMessage(
					`Đã nhận ${list.length} học sinh từ file Excel. Bấm "Lưu danh sách" để lưu.`,
				);
			};

			reader.readAsBinaryString(file);
		},
		[readOnly, appendImportedStudents, setFlashMessage],
	);

	const handleOpenEditStudent = useCallback(
		(student: Student) => {
			if (readOnly) {
				void showSnackbar({
					message: "Bạn chỉ có quyền xem lớp này.",
					withDismissAction: true,
					duration: 3500,
				});
				return;
			}

			if (student.id.startsWith("temp-")) {
				void showSnackbar({
					message: "Học sinh chưa được lưu lên hệ thống, không thể sửa.",
					withDismissAction: true,
					duration: 3500,
				});
				return;
			}

			setEditingStudent(student);
			setIsEditModalOpen(true);
		},
		[readOnly, showSnackbar],
	);

	const handleCloseEditModal = useCallback(() => {
		setIsEditModalOpen(false);
		setEditingStudent(null);
	}, []);

	const handleEditSuccess = useCallback(
		async (message: string) => {
			await loadStudents();
			setFlashMessage(message);
		},
		[loadStudents, setFlashMessage],
	);

	const handleAddSuccess = useCallback(
		async (message: string) => {
			await loadStudents();
			setFlashMessage(message);
		},
		[loadStudents, setFlashMessage],
	);

	const handleImportFromPaste = useCallback(
		(list: Student[]) => {
			appendImportedStudents(list);
			setFlashMessage(
				`Đã nhận ${list.length} học sinh từ dữ liệu dán. Bấm "Lưu danh sách" để lưu.`,
			);
		},
		[appendImportedStudents, setFlashMessage],
	);

	const handleOpenAddModal = useCallback(() => {
		setIsAddModalOpen(true);
	}, []);

	const handleCloseAddModal = useCallback(() => {
		setIsAddModalOpen(false);
	}, []);

	const handleOpenPasteModal = useCallback(() => {
		setIsPasteModalOpen(true);
	}, []);

	const handleClosePasteModal = useCallback(() => {
		setIsPasteModalOpen(false);
	}, []);

	const handleCloseDeleteDialog = useCallback(() => {
		setStudentToDelete(null);
	}, []);

	const handleBack = useCallback(() => {
		if (onBack) {
			onBack();
		} else {
			navigate(-1);
		}
	}, [onBack, navigate]);

	const handleConfirmDeleteStudent = useCallback(async () => {
		if (!studentToDelete) return;
		setIsDeletingStudent(true);
		try {
			await handleDeleteStudent(studentToDelete);
			setStudentToDelete(null);
		} finally {
			setIsDeletingStudent(false);
		}
	}, [studentToDelete, handleDeleteStudent]);

	useEffect(() => {
		if (flashMessage) {
			void showSnackbar({
				message: flashMessage,
				withDismissAction: true,
				duration: 3500,
			});
		}
	}, [flashMessage, showSnackbar]);

	return (
		<div className="mx-auto w-full space-y-4 pb-28">
			{readOnly && (
				<div className="flex items-center gap-2 rounded-2xl border border-m3-outline-variant/60 bg-m3-surface-container px-4 py-3 text-sm text-m3-on-surface shadow-xs">
					<Icon
						name="lock"
						variant="rounded"
						size={18}
						className="text-m3-secondary"
					/>
					<span>
						Bạn chỉ có quyền xem lớp này. Các chức năng chỉnh sửa đã bị khóa.
					</span>
				</div>
			)}

			{/* Hero Header without action buttons */}
			<StudentHeader
				className={selectedClass.name}
				totalCount={students.length}
				activeCount={activeStudents.length}
				inactiveCount={inactiveStudentsCount}
				newCount={studentNewList.length}
			/>

			{/* Class Analytics Panel */}
			<ClassAnalyticsPanel
				classId={selectedClass.id}
				assignments={assignments}
			/>

			{/* Search & Filter Toolbar */}
			<StudentToolbar
				searchKeyword={searchKeyword}
				onSearchChange={setSearchKeyword}
				displayedCount={displayedStudents.length}
				totalCount={students.length}
			/>

			{/* Floating Action Toolbar (Thêm học sinh, Chấm điểm, Xem điểm, Tải lại, Nhập/Dán Excel, Đồng bộ GG Sheet) */}
			<StudentActionToolbar
				readOnly={readOnly}
				isLoading={isLoading}
				isStudentMetadataSyncing={isStudentMetadataSyncing}
				activeCount={activeStudents.length}
				newCount={studentNewList.length}
				onBack={handleBack}
				onOpenAddModal={handleOpenAddModal}
				onGrade={handleGrade}
				onOpenViewScores={handleOpenViewScoresModal}
				onFileUpload={handleFileUpload}
				onOpenPasteModal={handleOpenPasteModal}
				onSyncMetadata={handleSyncStudentMetadataToGoogleSheet}
				onSaveStudents={handleSaveStudents}
			/>

			{/* Main Students Data Table */}
			<StudentTable
				displayedStudents={displayedStudents}
				totalStudentsCount={students.length}
				isLoading={isLoading}
				readOnly={readOnly}
				inlineSavingStudentId={inlineSavingStudentId}
				nameSortDirection={nameSortDirection}
				statusSortDirection={statusSortDirection}
				onToggleNameSort={toggleNameSort}
				onToggleStatusSort={toggleStatusSort}
				onCompetencyChange={handleInlineCompetencyChange}
				onExamToggle={handleInlineExamToggle}
				onEdit={handleOpenEditStudent}
				onDelete={setStudentToDelete}
			/>

			{/* Add Student Modal */}
			<AddStudentModal
				isOpen={isAddModalOpen}
				classId={selectedClass.id}
				readOnly={readOnly}
				getAccessToken={getAccessToken}
				onClose={handleCloseAddModal}
				onSuccess={handleAddSuccess}
			/>

			{/* Edit Student Modal */}
			<EditStudentModal
				student={editingStudent}
				isOpen={isEditModalOpen}
				classId={selectedClass.id}
				readOnly={readOnly}
				getAccessToken={getAccessToken}
				onClose={handleCloseEditModal}
				onSuccess={handleEditSuccess}
			/>

			{/* Paste From Clipboard / Excel Modal */}
			<PasteStudentModal
				isOpen={isPasteModalOpen}
				readOnly={readOnly}
				onClose={handleClosePasteModal}
				onImportStudents={handleImportFromPaste}
			/>

			{/* Delete Student Confirmation Dialog */}
			<DeleteStudentDialog
				open={Boolean(studentToDelete)}
				isDeleting={isDeletingStudent}
				studentToDelete={studentToDelete}
				onClose={handleCloseDeleteDialog}
				onConfirmDelete={handleConfirmDeleteStudent}
			/>
		</div>
	);
};

export default StudentList;
