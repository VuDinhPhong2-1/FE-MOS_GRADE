import { Icon } from "@bug-on/m3-expressive/core";
import { Button, ButtonGroup } from "@bug-on/m3-expressive/buttons";
import {
	Select,
	type SelectOption,
	TextField,
} from "@bug-on/m3-expressive/forms";
import { Card, List, ListItem, ScrollArea, Text } from "@bug-on/m3-expressive/layout";
import type React from "react";
import { useMemo, useState } from "react";
import type { GradingRuleSetSummary } from "../../../../types/xml-grading-rules.types";
import { getSubjectMeta } from "../../utils/xml-rule-helpers";
import { ShapeIcon } from "@bug-on/m3-expressive";

export interface RulesetSidebarProps {
	ruleSets: GradingRuleSetSummary[];
	selectedId: string;
	subjectFilter: string;
	onSubjectFilterChange: (subject: string) => void;
	activeFilter: "all" | "true" | "false";
	onActiveFilterChange: (filter: "all" | "true" | "false") => void;
	onSelectRuleSet: (summary: GradingRuleSetSummary) => void;
	onCreateNew: () => void;
	onImportClick: () => void;
	loading: boolean;
	loadingRuleSetId: string;
}

const SUBJECT_OPTIONS: SelectOption[] = [
	{ value: "", label: "Tất cả" },
	{ value: "excel", label: "Excel" },
	{ value: "word", label: "Word" },
	{ value: "ppt", label: "PowerPoint" },
];

export const RulesetSidebar: React.FC<RulesetSidebarProps> = ({
	ruleSets,
	selectedId,
	subjectFilter,
	onSubjectFilterChange,
	activeFilter,
	onActiveFilterChange,
	onSelectRuleSet,
	onCreateNew,
	onImportClick,
	loading,
	loadingRuleSetId,
}) => {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredRuleSets = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return ruleSets;
		return ruleSets.filter(
			(r) =>
				r.subject.toLowerCase().includes(query) ||
				r.version.toLowerCase().includes(query) ||
				r.id.toLowerCase().includes(query),
		);
	}, [ruleSets, searchQuery]);

	return (
		<aside className="w-full shrink-0 md:w-88 lg:w-96">
			<Card variant="filled" disableElevation className="flex h-fit flex-col bg-m3-surface-container-highest p-4">
				{/* Header actions */}
				<div className="mb-4 flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<ShapeIcon shape="cookie6Sided" size={44} className="flex items-center justify-center rounded-2xl bg-m3-surface-container-low text-m3-on-surface">
							<Icon name="rule" size={20} className="text-m3-on-surface" />
						</ShapeIcon>
						<div>
							<h3 className="text-sm font-bold text-m3-on-surface">
								Bộ luật XML
							</h3>
							<Text
								variant="label-sm"
								className="text-[11px] text-m3-on-surface-variant"
							>
								{filteredRuleSets.length} ruleset khả dụng
							</Text>
						</div>
					</div>

					<Button
						type="button"
						size="sm"
						colorStyle="filled"
						onClick={onCreateNew}
						title="Tạo ruleset mới"
						icon={<Icon name="add" className="text-base" />}
					>
						Mới
					</Button>
				</div>

				{/* Unified Filter Bar: Search + Select file type + Connected Status ButtonGroup */}
				<div className="mb-3 flex flex-col items-center gap-3">
					{/* Ô tìm kiếm */}
					<TextField
						variant="outlined"
						dense
						placeholder="Tìm ruleset..."
						value={searchQuery}
						onChange={(val) => setSearchQuery(val)}
						leadingIcon={<Icon name="search" className="text-base" />}
						trailingIconMode="clear"
						aria-label="Tìm kiếm bộ luật"
						fullWidth
					/>

					{/* Menu select loại file */}
					<Select
						variant="outlined"
						dense
						options={SUBJECT_OPTIONS}
						value={subjectFilter}
						onChange={(val) => onSubjectFilterChange(val)}
						menuVariant="expressive"
						colorVariant="vibrant"
						showDividers={false}
						matchTriggerWidth={false}
						aria-label="Chọn loại file"
						fullWidth
					/>

					{/* Button group connected cho trạng thái */}
					<ButtonGroup variant="connected" size="sm" fullWidth className="shrink-0">
						<Button
							type="button"
							variant="toggle"
							selected={activeFilter === "all"}
							onClick={() => onActiveFilterChange("all")}
							size="sm"
							title="Tất cả trạng thái"
						>
							Tất cả
						</Button>
						<Button
							type="button"
							variant="toggle"
							selected={activeFilter === "true"}
							onClick={() => onActiveFilterChange("true")}
							size="sm"
							title="Đang hoạt động"
						>
							Active
						</Button>
						<Button
							type="button"
							variant="toggle"
							selected={activeFilter === "false"}
							onClick={() => onActiveFilterChange("false")}
							size="sm"
							title="Không hoạt động"
						>
							Inactive
						</Button>
					</ButtonGroup>
				</div>

				{/* Rulesets List */}
				<ScrollArea
					className="flex-1 -mx-1 px-1"
					type="hover"
					viewportClassName="max-h-[calc(100vh-280px)]"
				>
					{loading && ruleSets.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 text-m3-on-surface-variant">
							<Icon name="refresh" className="animate-spin text-2xl" />
							<Text variant="body-sm" className="mt-2 text-xs">
								Đang tải danh sách ruleset...
							</Text>
						</div>
					) : filteredRuleSets.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 text-center text-m3-on-surface-variant">
							<Icon name="folder_open" className="text-3xl opacity-50" />
							<Text variant="body-sm" className="mt-2 text-xs">
								Không có bộ luật nào phù hợp
							</Text>
						</div>
					) : (
						<List
							variant="expressive"
							listStyle="segmented"
							selectionMode="single-select"
							value={selectedId}
							onChange={(val) => {
								const targetId = Array.isArray(val) ? val[0] : val;
								const found = ruleSets.find((r) => r.id === targetId);
								if (found) onSelectRuleSet(found);
							}}
							className="w-full"
						>
							{filteredRuleSets.map((item) => {
								const isCurrent = selectedId === item.id;
								const isItemLoading = loadingRuleSetId === item.id;
								const subjectMeta = getSubjectMeta(item.subject);

								return (
									<ListItem
										key={item.id}
										value={item.id}
										disabled={isItemLoading}
										onClick={() => onSelectRuleSet(item)}
										className="cursor-pointer"
										leadingType="custom"
										leadingContent={
											<span
												className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isCurrent
													? "bg-m3-on-secondary-container/10 text-m3-on-secondary-container"
													: subjectMeta.className
													}`}
											>
												{subjectMeta.shortBadge}
											</span>
										}
										headline={
											<div className="flex items-center gap-1.5 min-w-0">
												<span className="truncate text-xs font-bold">
													{item.version || "v1"}
												</span>
											</div>
										}
										supportingText={
											<div className="flex items-center justify-between text-[11px] opacity-80">
												<span>
													{item.projectCount} proj · {item.taskCount} task
												</span>
												<span className="font-semibold">
													{item.maxScore} pts
												</span>
											</div>
										}
										trailingType="custom"
										trailingContent={
											<span
												className={`h-2 w-2 shrink-0 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-m3-outline"
													}`}
											/>
										}
									/>
								);
							})}
						</List>
					)}
				</ScrollArea>

				{/* Footer utility buttons */}
				<div className="mt-4 pt-3">
					<Button
						type="button"
						colorStyle="tonal"
						size="sm"
						fullWidth
						onClick={onImportClick}
						icon={<Icon name="upload_file" className="text-base" />}
					>
						Tải lên file JSON
					</Button>
				</div>
			</Card>
		</aside>
	);
};
