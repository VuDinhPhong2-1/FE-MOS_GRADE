import {
	FAB,
	Icon,
	PlainTooltip,
	ToolbarDivider,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import {
	type ChangeEvent,
	type MouseEvent,
	memo,
	useCallback,
	useMemo,
	useRef,
} from "react";
import { FloatingActionToolbar } from "../../components/common/FloatingActionToolbar";

export interface StudentActionToolbarProps {
	readOnly: boolean;
	isLoading: boolean;
	isStudentMetadataSyncing: boolean;
	activeCount: number;
	newCount: number;
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

	const handleTriggerFileInput = useCallback(() => {
		if (readOnly) return;
		fileInputRef.current?.click();
	}, [readOnly]);

	// Giải phóng tap gesture của Motion trước khi mở modal thêm học sinh
	const handleOpenAddModal = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			e.currentTarget.dispatchEvent(
				new PointerEvent("pointercancel", { bubbles: true }),
			);
			e.currentTarget.blur();
			onOpenAddModal();
		},
		[onOpenAddModal],
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

				{/* Nhập file Excel */}
				{!readOnly && (
					<TooltipBox
						tooltip={<PlainTooltip>Nhập từ file Excel</PlainTooltip>}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Nhập từ file Excel"
							onClick={handleTriggerFileInput}
							emphasis="standard"
						>
							<Icon name="upload" variant="rounded" size={24} />
						</ToolbarIconButton>
					</TooltipBox>
				)}

				{/* Dán từ Excel / Clipboard */}
				{!readOnly && (
					<TooltipBox
						tooltip={<PlainTooltip>Dán từ Excel</PlainTooltip>}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Dán từ Excel"
							onClick={onOpenPasteModal}
							emphasis="standard"
						>
							<Icon name="content_paste" variant="rounded" size={24} />
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
			onOpenPasteModal,
			newCount,
			onSaveStudents,
			handleTriggerFileInput,
		],
	);

	// End FAB cho phép thêm học sinh mới (chỉ hiện khi !readOnly)
	const endFab = useMemo(() => {
		if (readOnly) return undefined;

		return (
			<TooltipBox
				tooltip={<PlainTooltip>Thêm học sinh</PlainTooltip>}
				placement="top"
			>
				<FAB
					colorStyle="tertiary"
					aria-label="Thêm học sinh"
					onClick={handleOpenAddModal}
					icon={<Icon name="person_add" size={24} />}
				/>
			</TooltipBox>
		);
	}, [readOnly, handleOpenAddModal]);

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
			/>
		</>
	);
};

export const StudentActionToolbar = memo(StudentActionToolbarComponent);
