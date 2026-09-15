import {
	FABMenu,
	Icon,
	PlainTooltip,
	ToolbarDivider,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import {
	type ChangeEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	FloatingActionToolbar,
	type SearchConfig,
} from "../../components/common/FloatingActionToolbar";

export interface StudentActionToolbarProps {
	readOnly: boolean;
	isLoading: boolean;
	isStudentMetadataSyncing: boolean;
	activeCount: number;
	newCount: number;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (isActive: boolean) => void;
	onBack?: () => void;
	onOpenAddModal: () => void;
	onGrade: () => void;
	onOpenViewScores: () => void;
	onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
	onOpenPasteModal: () => void;
	onSyncMetadata: () => void;
	onSaveStudents: () => void;
}

const StudentActionToolbarComponent = ({
	readOnly,
	isLoading,
	isStudentMetadataSyncing,
	activeCount,
	newCount,
	searchQuery,
	onSearchQueryChange,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
	onBack,
	onOpenAddModal,
	onGrade,
	onOpenViewScores,
	onFileUpload,
	onOpenPasteModal,
	onSyncMetadata,
	onSaveStudents,
}: StudentActionToolbarProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isFabMenuExpanded, setIsFabMenuExpanded] = useState(false);

	// Đóng FABMenu khi ô tìm kiếm được kích hoạt
	useEffect(() => {
		if (isSearchActive) {
			setIsFabMenuExpanded(false);
		}
	}, [isSearchActive]);

	const handleTriggerFileInput = useCallback(() => {
		if (readOnly) return;
		fileInputRef.current?.click();
	}, [readOnly]);

	// Cấu hình tìm kiếm cho FloatingActionToolbar
	const searchConfig: SearchConfig = useMemo(
		() => ({
			id: "student-floating-search",
			placeholder: "Tìm kiếm theo tên học sinh...",
			ariaLabel: "Tìm kiếm học sinh",
			query: searchQuery,
			onQueryChange: onSearchQueryChange,
			widthClassName: "w-56 sm:w-72 md:w-80",
			clearQueryOnClose: true,
			variant: "filled",
		}),
		[searchQuery, onSearchQueryChange],
	);

	// Action buttons dành riêng cho Student List
	const actions = useMemo(
		() => (
			<>
				{/* Quay lại */}
				{onBack && (
					<TooltipBox
						tooltip={<PlainTooltip>Quay lại</PlainTooltip>}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Quay lại"
							onClick={onBack}
							emphasis="standard"
						>
							<Icon name="arrow_back" size={24} />
						</ToolbarIconButton>
					</TooltipBox>
				)}

				{/* Chấm điểm cho lớp */}
				{!readOnly && (
					<TooltipBox
						tooltip={
							<PlainTooltip>
								{activeCount === 0
									? "Không có học sinh hoạt động"
									: "Chấm điểm cho lớp"}
							</PlainTooltip>
						}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Chấm điểm cho lớp"
							onClick={onGrade}
							disabled={activeCount === 0}
							emphasis="standard"
						>
							<Icon name="fact_check" variant="rounded" size={24} />
						</ToolbarIconButton>
					</TooltipBox>
				)}

				{/* Xem bảng điểm lớp */}
				<TooltipBox
					tooltip={<PlainTooltip>Xem bảng điểm lớp</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Xem bảng điểm lớp"
						onClick={onOpenViewScores}
						emphasis="standard"
					>
						<Icon name="visibility" variant="rounded" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				<ToolbarDivider />

				{/* Đồng bộ XL + ghi chú Google Sheet */}
				{!readOnly && (
					<TooltipBox
						tooltip={
							<PlainTooltip>
								{isStudentMetadataSyncing
									? "Đang đồng bộ..."
									: "Đồng bộ XL + ghi chú GG Sheet"}
							</PlainTooltip>
						}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Đồng bộ XL + ghi chú GG Sheet"
							onClick={onSyncMetadata}
							disabled={isStudentMetadataSyncing || isLoading}
							emphasis="standard"
						>
							<Icon
								name="sync"
								variant="rounded"
								size={24}
								className={
									isStudentMetadataSyncing ? "animate-spin" : undefined
								}
							/>
						</ToolbarIconButton>
					</TooltipBox>
				)}

				{/* Lưu danh sách học sinh mới (chỉ hiện khi có học sinh chưa lưu) */}
				{!readOnly && newCount > 0 && (
					<TooltipBox
						tooltip={
							<PlainTooltip>
								{isLoading ? "Đang lưu..." : `Lưu ${newCount} học sinh mới`}
							</PlainTooltip>
						}
						placement="top"
					>
						<ToolbarIconButton
							aria-label={`Lưu ${newCount} học sinh mới`}
							onClick={onSaveStudents}
							disabled={isLoading}
							emphasis="tonal"
							className="text-m3-primary"
						>
							<Icon
								name="save"
								variant="rounded"
								size={24}
								className={isLoading ? "animate-pulse" : undefined}
							/>
						</ToolbarIconButton>
					</TooltipBox>
				)}
			</>
		),
		[
			onBack,
			readOnly,
			activeCount,
			onGrade,
			onOpenViewScores,
			isStudentMetadataSyncing,
			isLoading,
			onSyncMetadata,
			newCount,
			onSaveStudents,
		],
	);

	// Danh sách thao tác trong FAB Menu
	const fabMenuItems = useMemo(
		() => [
			{
				id: "add-student",
				label: "Thêm học sinh",
				icon: <Icon name="person_add" size={20} />,
				onClick: onOpenAddModal,
			},
			{
				id: "import-excel",
				label: "Nhập từ Excel",
				icon: <Icon name="upload" variant="rounded" size={20} />,
				onClick: handleTriggerFileInput,
			},
			{
				id: "paste-excel",
				label: "Dán từ Excel",
				icon: <Icon name="content_paste" variant="rounded" size={20} />,
				onClick: onOpenPasteModal,
			},
		],
		[onOpenAddModal, handleTriggerFileInput, onOpenPasteModal],
	);

	// End FAB Menu cho phép thêm học sinh, nhập/dán từ excel (chỉ hiện khi !readOnly)
	const endFab = useMemo(() => {
		if (readOnly) return undefined;

		return (
			<FABMenu
				className="relative! w-14! h-14! bottom-auto! right-auto! left-auto! translate-x-0! sm:bottom-auto! sm:right-auto! **:[[role=menu]]:absolute **:[[role=menu]]:bottom-full **:[[role=menu]]:mb-2 **:[[role=menu]]:right-0"
				expanded={isFabMenuExpanded}
				onToggle={setIsFabMenuExpanded}
				alignment="end"
				colorVariant="tertiary"
				aria-label="Thao tác thêm học sinh"
				items={fabMenuItems}
			/>
		);
	}, [readOnly, isFabMenuExpanded, fabMenuItems]);

	return (
		<>
			{/* Hidden File Input for Excel Import */}
			{!readOnly && (
				<input
					ref={fileInputRef}
					type="file"
					onChange={onFileUpload}
					accept=".xlsx, .xls, .txt"
					className="hidden"
					id="floating-import-excel"
					tabIndex={-1}
				/>
			)}

			{/* Floating Action Toolbar */}
			<FloatingActionToolbar
				ariaLabel="Thanh công cụ tác vụ học sinh"
				actions={actions}
				endFab={endFab}
				search={searchConfig}
				isSearchActive={isSearchActive}
				onOpenSearch={onOpenSearch}
				onCloseSearch={onCloseSearch}
				onSearchActiveChange={onSearchActiveChange}
			/>
		</>
	);
};

export const StudentActionToolbar = memo(StudentActionToolbarComponent);
