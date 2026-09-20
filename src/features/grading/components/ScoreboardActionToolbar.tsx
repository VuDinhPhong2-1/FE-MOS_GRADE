import {
	Icon,
	PlainTooltip,
	Select,
	ToolbarDivider,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
import {
	FloatingActionToolbar,
	type SearchConfig,
} from "../../../components/common/floating-action-toolbar";
import type { ScoreboardState } from "../hooks/useScoreboardState";
import {
	SCORE_SORT_KEY_OPTIONS,
	type ScoreTableSortKey,
} from "../utils/scoreboardUtils";

export interface ScoreboardActionToolbarProps {
	state: ScoreboardState;
	onBack?: () => void;
	backTooltip?: string;
	className?: string;
	showExportButtons?: boolean;
}

export const ScoreboardActionToolbar: React.FC<
	ScoreboardActionToolbarProps
> = ({
	state,
	onBack,
	backTooltip = "Quay lại",
	className,
	showExportButtons = true,
}) => {
	// Cấu hình tìm kiếm cho FloatingActionToolbar
	const searchConfig: SearchConfig = useMemo(
		() => ({
			id: "scoreboard-floating-search",
			placeholder: "Tìm kiếm theo tên học sinh...",
			ariaLabel: "Tìm kiếm học sinh",
			query: state.searchTerm,
			onQueryChange: state.setSearchTerm,
			widthClassName: "w-56 sm:w-72 md:w-80",
			clearQueryOnClose: true,
			variant: "filled",
		}),
		[state.searchTerm, state.setSearchTerm],
	);

	const actions = useMemo(
		() => (
			<>
				{/* Nút quay lại / đóng (nếu có callback onBack) */}
				{onBack && (
					<TooltipBox
						tooltip={<PlainTooltip>{backTooltip}</PlainTooltip>}
						placement="top"
					>
						<ToolbarIconButton
							aria-label={backTooltip}
							onClick={onBack}
							emphasis="standard"
						>
							<Icon name="arrow_back" size={24} />
						</ToolbarIconButton>
					</TooltipBox>
				)}

				{/* 1. Toggle Hiện / Ẩn tất cả phần chính */}
				{state.availablePracticeGroupCount > 0 && (
					<TooltipBox
						tooltip={
							<PlainTooltip>
								{state.areAllPracticeGroupsVisible
									? "Ẩn tất cả phần chính"
									: `Hiện tất cả (${state.availablePracticeGroupCount}) phần chính`}
							</PlainTooltip>
						}
						placement="top"
					>
						<ToolbarIconButton
							aria-label={
								state.areAllPracticeGroupsVisible
									? "Ẩn tất cả phần chính"
									: "Hiện tất cả phần chính"
							}
							onClick={() =>
								state.handleApplyPracticeGroupDisplayForAll(
									state.areAllPracticeGroupsVisible ? "hidden" : "full",
								)
							}
							emphasis={
								state.areAllPracticeGroupsVisible ? "tonal" : "standard"
							}
						>
							<Icon
								name={
									state.areAllPracticeGroupsVisible ? "layers_clear" : "layers"
								}
								size={24}
								animateFill
								fill={state.areAllPracticeGroupsVisible ? 1 : 0}
							/>
						</ToolbarIconButton>
					</TooltipBox>
				)}

				{/* 2. Toggle cột Tổng điểm 3 Practice */}
				<TooltipBox
					tooltip={
						<PlainTooltip>
							{state.isTotalScoreColumnVisible
								? "Ẩn cột tổng điểm 3 Practice"
								: "Hiện cột tổng điểm 3 Practice"}
						</PlainTooltip>
					}
					placement="top"
				>
					<ToolbarIconButton
						aria-label={
							state.isTotalScoreColumnVisible
								? "Ẩn cột tổng điểm 3 Practice"
								: "Hiện cột tổng điểm 3 Practice"
						}
						onClick={() => state.setIsTotalScoreColumnVisible((prev) => !prev)}
						emphasis={state.isTotalScoreColumnVisible ? "tonal" : "standard"}
					>
						<Icon
							name="calculate"
							size={24}
							animateFill
							fill={state.isTotalScoreColumnVisible ? 1 : 0}
						/>
					</ToolbarIconButton>
				</TooltipBox>

				{/* 3. Toggle cột Tỷ lệ đạt OTTH */}
				<TooltipBox
					tooltip={
						<PlainTooltip>
							{state.isOtthPercentageColumnVisible
								? "Ẩn cột tỷ lệ đạt OTTH"
								: "Hiện cột tỷ lệ đạt OTTH"}
						</PlainTooltip>
					}
					placement="top"
				>
					<ToolbarIconButton
						aria-label={
							state.isOtthPercentageColumnVisible
								? "Ẩn cột tỷ lệ đạt OTTH"
								: "Hiện cột tỷ lệ đạt OTTH"
						}
						onClick={() =>
							state.setIsOtthPercentageColumnVisible((prev) => !prev)
						}
						emphasis={
							state.isOtthPercentageColumnVisible ? "tonal" : "standard"
						}
					>
						<Icon
							name="percent"
							size={24}
							animateFill
							fill={state.isOtthPercentageColumnVisible ? 1 : 0}
						/>
					</ToolbarIconButton>
				</TooltipBox>

				<ToolbarDivider />

				{/* 4. Sắp xếp: Select dense + Direction toggle button */}
				<div className="flex items-center gap-1">
					<div className="w-fit">
						<Select
							showDividers={false}
							dense
							aria-label="Sắp xếp danh sách"
							value={state.sortKey}
							onChange={(val) => {
								const nextSortKey = val as ScoreTableSortKey;
								state.setSortKey(nextSortKey);
								if (nextSortKey === "name") {
									state.setSortDirection("asc");
								}
							}}
							colorVariant="vibrant"
							options={SCORE_SORT_KEY_OPTIONS}
						/>
					</div>
					<TooltipBox
						tooltip={
							<PlainTooltip>
								{state.sortDirection === "asc"
									? state.sortKey === "name"
										? "A → Z (Nhấn để đảo Z → A)"
										: "Tăng dần (Nhấn để đảo giảm dần)"
									: state.sortKey === "name"
										? "Z → A (Nhấn để đảo A → Z)"
										: "Giảm dần (Nhấn để đảo tăng dần)"}
							</PlainTooltip>
						}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Đảo chiều sắp xếp"
							disabled={state.sortKey === "none"}
							onClick={() =>
								state.setSortDirection((prev) =>
									prev === "asc" ? "desc" : "asc",
								)
							}
							emphasis="standard"
						>
							<Icon
								name={
									state.sortDirection === "asc"
										? "arrow_upward"
										: "arrow_downward"
								}
								size={20}
							/>
						</ToolbarIconButton>
					</TooltipBox>
				</div>

				{/* 5. Xuất Excel & PDF (nếu showExportButtons) */}
				{showExportButtons && (
					<>
						<ToolbarDivider />
						<TooltipBox
							tooltip={<PlainTooltip>Xuất file Excel</PlainTooltip>}
							placement="top"
						>
							<ToolbarIconButton
								aria-label="Xuất file Excel"
								onClick={state.handleExportExcel}
								emphasis="standard"
							>
								<Icon name="table_view" size={24} />
							</ToolbarIconButton>
						</TooltipBox>

						<TooltipBox
							tooltip={<PlainTooltip>Xuất file PDF</PlainTooltip>}
							placement="top"
						>
							<ToolbarIconButton
								aria-label="Xuất file PDF"
								onClick={state.handleExportPdf}
								emphasis="standard"
							>
								<Icon name="picture_as_pdf" size={24} />
							</ToolbarIconButton>
						</TooltipBox>
					</>
				)}
			</>
		),
		[
			onBack,
			backTooltip,
			state.availablePracticeGroupCount,
			state.areAllPracticeGroupsVisible,
			state.handleApplyPracticeGroupDisplayForAll,
			state.isTotalScoreColumnVisible,
			state.setIsTotalScoreColumnVisible,
			state.isOtthPercentageColumnVisible,
			state.setIsOtthPercentageColumnVisible,
			state.sortKey,
			state.setSortKey,
			state.sortDirection,
			state.setSortDirection,
			showExportButtons,
			state.handleExportExcel,
			state.handleExportPdf,
		],
	);

	return (
		<FloatingActionToolbar
			actions={actions}
			search={searchConfig}
			className={className}
		/>
	);
};

export default ScoreboardActionToolbar;
