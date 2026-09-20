import { Chip, Icon, useSnackbar } from "@bug-on/m3-expressive";
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
import { usePageHeader } from "../context/PageActionsContext";
import {
	ClassAnalyticsPanel,
	DeleteStudentDialog,
	mapRowsToTempStudents,
	normalizeText,
	PasteStudentModal,
	StudentActionToolbar,
	type StudentListProps,
	StudentModal,
	StudentTable,
	useStudentData,
} from "../features/student-list";
import type { Student } from "../types/student.types";

const StudentList = ({
	selectedClass,
	schoolName,
	readOnly = false,
	onBack,
}: StudentListProps) => {
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const [searchKeyword, setSearchKeyword] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);

	const handleOpenSearch = useCallback(() => setIsSearchActive(true), []);
	const handleCloseSearch = useCallback(() => {
		setIsSearchActive(false);
		setSearchKeyword("");
	}, []);

	const [studentModalOpen, setStudentModalOpen] = useState(false);
	const [selectedStudentForEdit, setSelectedStudentForEdit] =
		useState<Student | null>(null);
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

	usePageHeader(
		{
			title: (
				<div className="flex flex-wrap items-center gap-2">
					<span className="shrink-0">Lớp {selectedClass.name}</span>
					<div className="flex flex-wrap items-center gap-1.5 text-xs font-normal">
						<Chip
							variant="assist"
							leadingIcon={<Icon name="group" size={16} />}
							label={`Tổng ${students.length} học sinh`}
							className="h-6! p-2! rounded-full pointer-events-none"
						/>
						<Chip
							variant="assist"
							leadingIcon={
								<Icon
									name="how_to_reg"
									size={16}
									className="text-m3-secondary"
								/>
							}
							label={`Hoạt động ${activeStudents.length}`}
							className="h-6! p-2! rounded-full pointer-events-none"
						/>
						<Chip
							variant="assist"
							leadingIcon={
								<Icon name="person_off" size={16} className="text-m3-error" />
							}
							label={`Ngừng ${inactiveStudentsCount}`}
							className="h-6! p-2! rounded-full pointer-events-none"
						/>
						{studentNewList.length > 0 && (
							<Chip
								variant="assist"
								leadingIcon={
									<Icon name="save" size={16} className="text-m3-tertiary" />
								}
								label={`Chưa lưu ${studentNewList.length}`}
								className="h-6! p-2! rounded-full pointer-events-none"
							/>
						)}
					</div>
				</div>
			),
			subtitle: schoolName || "Danh sách học sinh",
		},
		[
			selectedClass.name,
			schoolName,
			students.length,
			activeStudents.length,
			inactiveStudentsCount,
			studentNewList.length,
		],
	);

	const displayedStudents = useMemo(() => {
		const keyword = normalizeText(searchKeyword);
		if (!keyword) return students;
		return students.filter((st) =>
			normalizeText(`${st.middleName} ${st.firstName}`).includes(keyword),
		);
	}, [students, searchKeyword]);

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

		navigate(`/classes/${selectedClassId}/grading`, {
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

			setSelectedStudentForEdit(student);
			setStudentModalOpen(true);
		},
		[readOnly, showSnackbar],
	);

	const handleOpenAddModal = useCallback(() => {
		setSelectedStudentForEdit(null);
		setStudentModalOpen(true);
	}, []);

	const handleCloseStudentModal = useCallback(() => {
		setStudentModalOpen(false);
		setSelectedStudentForEdit(null);
	}, []);

	const handleStudentModalSuccess = useCallback(
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
		<div className="mx-auto w-full space-y-5">
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

			{/* Class Analytics Panel */}
			<ClassAnalyticsPanel
				classId={selectedClass.id}
				assignments={assignments}
			/>

			{/* Main Students Data Table */}
			<StudentTable
				displayedStudents={displayedStudents}
				totalStudentsCount={students.length}
				isLoading={isLoading}
				readOnly={readOnly}
				inlineSavingStudentId={inlineSavingStudentId}
				onCompetencyChange={handleInlineCompetencyChange}
				onExamToggle={handleInlineExamToggle}
				onEdit={handleOpenEditStudent}
				onDelete={setStudentToDelete}
			/>

			{/* Floating Action Toolbar (Thêm học sinh, Chấm điểm, Xem điểm, Tải lại, Nhập/Dán Excel, Đồng bộ GG Sheet) */}
			<StudentActionToolbar
				readOnly={readOnly}
				isLoading={isLoading}
				isStudentMetadataSyncing={isStudentMetadataSyncing}
				activeCount={activeStudents.length}
				newCount={studentNewList.length}
				searchQuery={searchKeyword}
				onSearchQueryChange={setSearchKeyword}
				isSearchActive={isSearchActive}
				onOpenSearch={handleOpenSearch}
				onCloseSearch={handleCloseSearch}
				onSearchActiveChange={setIsSearchActive}
				onBack={handleBack}
				onOpenAddModal={handleOpenAddModal}
				onGrade={handleGrade}
				onOpenViewScores={handleOpenViewScoresModal}
				onFileUpload={handleFileUpload}
				onOpenPasteModal={handleOpenPasteModal}
				onSyncMetadata={handleSyncStudentMetadataToGoogleSheet}
				onSaveStudents={handleSaveStudents}
			/>

			{/* Student Form Modal (Add / Edit) */}
			<StudentModal
				isOpen={studentModalOpen}
				student={selectedStudentForEdit}
				classId={selectedClass.id}
				readOnly={readOnly}
				getAccessToken={getAccessToken}
				onClose={handleCloseStudentModal}
				onSuccess={handleStudentModalSuccess}
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
