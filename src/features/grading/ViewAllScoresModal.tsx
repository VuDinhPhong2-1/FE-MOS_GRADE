import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	Icon,
	IconButton,
} from "@bug-on/m3-expressive";
import type { FC } from "react";
import ScoreboardActionToolbar from "./components/ScoreboardActionToolbar";
import ScoreboardContent from "./components/ScoreboardContent";
import { useScoreboardState } from "./hooks/useScoreboardState";
import type { ViewAllScoresModalProps } from "./utils/scoreboardUtils";

const ViewAllScoresModal: FC<ViewAllScoresModalProps> = ({
	isOpen,
	onClose,
	assignments,
	students,
	classDisplayName,
	displayMode = "modal",
	title,
	onStudentClassificationUpdated,
	onStudentNotesUpdated,
	scores,
}) => {
	const state = useScoreboardState({
		isOpen,
		assignments,
		students,
		scores,
		classDisplayName,
		title,
		onStudentClassificationUpdated,
		onStudentNotesUpdated,
	});

	if (!isOpen) return null;
	const isPageMode = displayMode === "page";
	const containerClassName = isPageMode
		? "relative flex w-full flex-col overflow-hidden rounded-4xl bg-m3-surface-container text-m3-on-surface"
		: "relative flex h-full w-full flex-col overflow-hidden bg-m3-surface-container-high text-m3-on-surface";

	const content = (
		<div className={containerClassName}>
			{/* Internal Modal Header */}
			<div className="flex items-center justify-between border-b border-m3-outline-variant/30 bg-m3-surface-container-high px-4 py-4 sm:px-6 sm:py-5">
				<div className="flex items-center gap-3">
					<div className="grid h-10 w-10 place-items-center rounded-2xl bg-m3-primary font-bold text-m3-on-primary">
						BD
					</div>
					<div>
						<h2 className="text-xl font-extrabold text-m3-on-surface">
							{state.headerTitle}
						</h2>
						<p className="text-sm text-m3-on-surface-variant">
							{state.sortedDisplayRows.length}
							{state.searchTerm || state.showOnlyExamStudents
								? `/${state.filteredStudentCount}`
								: ""}{" "}
							học sinh hiển thị, tổng lớp {students.length},{" "}
							{assignments.length} bài tập, hiện {state.visibleScoreColumnCount}
							/{state.totalScoreColumnCount} cột điểm
						</p>
					</div>
				</div>
				<IconButton
					type="button"
					colorStyle="standard"
					aria-label="Đóng"
					onClick={onClose}
				>
					<Icon name="close" />
				</IconButton>
			</div>

			{/* Modal Body with ScoreboardContent */}
			<div className="flex-1 overflow-auto px-2 pb-24 pt-3 sm:px-4 sm:pb-28 sm:pt-4 lg:px-5">
				<ScoreboardContent state={state} hideInlineSearch />
			</div>

			{/* FloatingActionToolbar hợp nhất: toggle cột, sort, xuất excel/pdf, search & quay lại */}
			<ScoreboardActionToolbar
				state={state}
				onBack={onClose}
				backTooltip={isPageMode ? "Quay lại" : "Đóng"}
				className={
					isPageMode
						? undefined
						: "absolute! bottom-4 left-1/2 -translate-x-1/2 z-50"
				}
			/>
		</div>
	);

	if (isPageMode) {
		return <div className="w-full">{content}</div>;
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogPortal>
				<DialogOverlay className="bg-black/60 backdrop-blur-xs" />
				<DialogContent
					hideCloseButton
					className="flex h-[96vh] w-[calc(100vw-0.5rem)] max-w-480 flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface sm:h-[94vh] sm:w-[calc(100vw-1.5rem)]"
				>
					{content}
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default ViewAllScoresModal;
