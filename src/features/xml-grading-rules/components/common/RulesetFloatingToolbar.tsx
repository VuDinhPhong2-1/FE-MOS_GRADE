import {
	Badge,
	BadgedBox,
	Button,
	FAB,
	Icon,
	PlainTooltip,
	Text,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { ToolbarIconButton } from "@bug-on/m3-expressive/navigation";
import { memo, useMemo } from "react";
import type React from "react";
import { FloatingActionToolbar } from "../../../../components/common/floating-action-toolbar";

export type RulesetTab = "editor" | "validation" | "test";

export interface RulesetFloatingToolbarProps {
	isSaving: boolean;
	isValidating: boolean;
	hasUnsavedChanges: boolean;
	onSave: () => void;
	onValidate: () => void;
	activeTab: RulesetTab;
	onTabChange: (tab: RulesetTab) => void;
	validationCount?: {
		errors: number;
		warnings: number;
	} | null;
	className?: string;
}

const RulesetFloatingToolbarComponent: React.FC<
	RulesetFloatingToolbarProps
> = ({
	isSaving,
	isValidating,
	hasUnsavedChanges,
	onSave,
	onValidate,
	activeTab,
	onTabChange,
	validationCount,
	className,
}) => {
	// Status slot: Chỉ báo trạng thái đã lưu / chưa lưu
	const infoSlot = useMemo(
		() => (
			<div className="flex items-center gap-2 rounded-full bg-m3-surface-container-highest/80 px-3.5 py-1.5 backdrop-blur-md border border-white/10 text-xs shadow-xs select-none">
				<span
					className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
						hasUnsavedChanges ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
					}`}
					title={hasUnsavedChanges ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
				/>
				<Text
					variant="label-sm"
					className="hidden text-xs font-semibold text-m3-on-surface sm:inline whitespace-nowrap"
				>
					{hasUnsavedChanges ? "Chưa lưu thay đổi" : "Đã lưu"}
				</Text>
			</div>
		),
		[hasUnsavedChanges],
	);

	const hasErrors = Boolean(validationCount && validationCount.errors > 0);

	// Action buttons chính: 3 nút tab điều hướng + nút Kiểm tra XML
	const actions = useMemo(
		() => (
			<div className="flex items-center gap-1">
				{/* Tab 1: Rules editor */}
				<TooltipBox
					tooltip={<PlainTooltip>Rules editor</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Rules editor"
						selected={activeTab === "editor"}
						emphasis={activeTab === "editor" ? "tonal" : "standard"}
						onClick={() => onTabChange("editor")}
					>
						<Icon name="edit_document" size={22} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Tab 2: Validation */}
				<TooltipBox
					tooltip={
						<PlainTooltip>
							Validation
							{hasErrors ? ` (${validationCount?.errors} lỗi)` : ""}
						</PlainTooltip>
					}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Validation"
						selected={activeTab === "validation"}
						emphasis={activeTab === "validation" ? "tonal" : "standard"}
						onClick={() => onTabChange("validation")}
					>
						<BadgedBox
							badge={
								hasErrors ? <Badge>{validationCount?.errors}</Badge> : undefined
							}
						>
							<Icon name="fact_check" size={22} />
						</BadgedBox>
					</ToolbarIconButton>
				</TooltipBox>

				{/* Tab 3: Test XML */}
				<TooltipBox
					tooltip={<PlainTooltip>Test XML</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Test XML"
						selected={activeTab === "test"}
						emphasis={activeTab === "test" ? "tonal" : "standard"}
						onClick={() => onTabChange("test")}
					>
						<Icon name="science" size={22} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Nút Kiểm tra XML */}
				<TooltipBox
					tooltip={
						<PlainTooltip>
							Kiểm tra cú pháp và tính hợp lệ của ruleset XML
						</PlainTooltip>
					}
					placement="top"
				>
					<Button
						type="button"
						colorStyle="tonal"
						size="sm"
						loading={isValidating}
						disabled={isValidating}
						onClick={onValidate}
						icon={<Icon name="fact_check" size={18} />}
						className="font-medium shrink-0 cursor-pointer"
					>
						<span>Kiểm tra XML</span>
						{hasErrors && (
							<span className="ml-1 rounded-full bg-m3-error px-1.5 py-0.2 text-[10px] font-bold text-m3-on-error">
								{validationCount?.errors}
							</span>
						)}
					</Button>
				</TooltipBox>
			</div>
		),
		[
			activeTab,
			onTabChange,
			hasErrors,
			validationCount?.errors,
			isValidating,
			onValidate,
		],
	);

	// End FAB: Lưu Ruleset với đầy đủ loading state & phím tắt Ctrl+S
	const endFab = useMemo(
		() => (
			<TooltipBox
				tooltip={
					<PlainTooltip>
						{isSaving ? "Đang lưu ruleset..." : "Lưu ruleset"}
					</PlainTooltip>
				}
				placement="top"
			>
				<FAB
					colorStyle="tertiary"
					loading={isSaving}
					disabled={isSaving}
					onClick={onSave}
					icon={<Icon name="save" size={24} />}
					aria-label={isSaving ? "Đang lưu ruleset..." : "Lưu ruleset"}
				/>
			</TooltipBox>
		),
		[isSaving, onSave],
	);

	return (
		<FloatingActionToolbar
			ariaLabel="Thao tác ruleset"
			infoSlot={infoSlot}
			infoSlotPosition="before"
			actions={actions}
			endFab={endFab}
			className={className}
		/>
	);
};

export const RulesetFloatingToolbar = memo(RulesetFloatingToolbarComponent);
