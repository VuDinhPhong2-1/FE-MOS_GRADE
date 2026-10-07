import { Icon, ScrollArea, Text } from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo, useState } from "react";
import type { GradingRuleSetSummary } from "../../../../types/xml-grading-rules.types";
import { getSubjectMeta } from "../../utils/xml-rule-helpers";

export interface RulesetSidebarProps {
	ruleSets: GradingRuleSetSummary[];
	selectedId: string;
	subjectFilter: string;
	onSubjectFilterChange: (subject: string) => void;
	activeFilter: "all" | "true" | "false";
	onActiveFilterChange: (filter: "all" | "true" | "false") => void;
	onSelectRuleSet: (summary: GradingRuleSetSummary) => void;
	onCreateNew: () => void;
	onSeedPptGm2: () => void;
	onImportClick: () => void;
	loading: boolean;
	loadingRuleSetId: string;
}

export const RulesetSidebar: React.FC<RulesetSidebarProps> = ({
	ruleSets,
	selectedId,
	subjectFilter,
	onSubjectFilterChange,
	activeFilter,
	onActiveFilterChange,
	onSelectRuleSet,
	onCreateNew,
	onSeedPptGm2,
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

	const subjects = [
		{ id: "", label: "Tất cả" },
		{ id: "excel", label: "Excel" },
		{ id: "word", label: "Word" },
		{ id: "ppt", label: "PowerPoint" },
	];

	return (
		<aside className="w-full shrink-0 md:w-80 lg:w-88">
			<div className="flex h-full flex-col rounded-3xl bg-m3-surface-container p-4">
				{/* Header actions */}
				<div className="mb-4 flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-m3-surface-container-high text-m3-primary">
							<Icon name="rule" className="text-xl" />
						</div>
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

					<button
						type="button"
						onClick={onCreateNew}
						title="Tạo ruleset mới"
						className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-m3-primary px-3 text-xs font-semibold text-m3-on-primary transition hover:bg-m3-primary/90"
					>
						<Icon name="add" className="text-base" />
						<span>Mới</span>
					</button>
				</div>

				{/* Search box */}
				<div className="relative mb-3">
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant">
						<Icon name="search" className="text-base" />
					</span>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Tìm kiếm bộ luật..."
						className="w-full rounded-2xl bg-m3-surface-container-high py-2 pl-9 pr-8 text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-m3-on-surface-variant hover:text-m3-on-surface"
						>
							<Icon name="close" className="text-sm" />
						</button>
					)}
				</div>

				{/* Subject filter chips */}
				<div className="mb-3 flex flex-wrap gap-1.5">
					{subjects.map((sub) => {
						const isSelected = subjectFilter === sub.id;
						return (
							<button
								type="button"
								key={sub.id}
								onClick={() => onSubjectFilterChange(sub.id)}
								className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
									isSelected
										? "bg-m3-primary text-m3-on-primary"
										: "bg-m3-surface-container-high text-m3-on-surface-variant hover:bg-m3-surface-container-highest hover:text-m3-on-surface"
								}`}
							>
								{sub.label}
							</button>
						);
					})}
				</div>

				{/* Status filter tabs */}
				<div className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-m3-surface-container-low p-1">
					{(
						[
							["all", "Tất cả"],
							["true", "Active"],
							["false", "Inactive"],
						] as const
					).map(([key, label]) => {
						const isSelected = activeFilter === key;
						return (
							<button
								type="button"
								key={key}
								onClick={() => onActiveFilterChange(key)}
								className={`rounded-xl py-1 text-[11px] font-bold transition ${
									isSelected
										? "bg-m3-surface-container-high text-m3-on-surface"
										: "text-m3-on-surface-variant hover:text-m3-on-surface"
								}`}
							>
								{label}
							</button>
						);
					})}
				</div>

				{/* Rulesets List */}
				<ScrollArea
					className="flex-1 -mx-1 px-1"
					type="hover"
					viewportClassName="space-y-1.5 max-h-[calc(100vh-280px)]"
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
						filteredRuleSets.map((item) => {
							const isCurrent = selectedId === item.id;
							const isItemLoading = loadingRuleSetId === item.id;
							const subjectMeta = getSubjectMeta(item.subject);

							return (
								<button
									type="button"
									key={item.id}
									onClick={() => onSelectRuleSet(item)}
									disabled={isItemLoading}
									className={`w-full rounded-2xl p-3 text-left transition ${
										isCurrent
											? "bg-m3-primary-container text-m3-on-primary-container"
											: "bg-m3-surface-container-high text-m3-on-surface hover:bg-m3-surface-container-highest"
									}`}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-1.5 min-w-0">
											<span
												className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
													isCurrent
														? "bg-m3-on-primary-container/10 text-m3-on-primary-container"
														: subjectMeta.className
												}`}
											>
												{subjectMeta.shortBadge}
											</span>
											<span className="truncate text-xs font-bold">
												{item.version || "v1"}
											</span>
										</div>
										<span
											className={`h-2 w-2 shrink-0 rounded-full ${
												item.isActive ? "bg-emerald-500" : "bg-m3-outline"
											}`}
										/>
									</div>

									<div className="mt-2 flex items-center justify-between text-[11px] opacity-80">
										<span>
											{item.projectCount} proj · {item.taskCount} task
										</span>
										<span className="font-semibold">{item.maxScore} pts</span>
									</div>
								</button>
							);
						})
					)}
				</ScrollArea>

				{/* Footer utility buttons */}
				<div className="mt-4 pt-3 space-y-1.5">
					<button
						type="button"
						onClick={onSeedPptGm2}
						className="flex w-full items-center justify-center gap-2 rounded-2xl bg-m3-surface-container-high py-2 text-xs font-bold text-m3-on-surface transition hover:bg-m3-surface-container-highest"
					>
						<Icon name="auto_awesome" className="text-base text-amber-500" />
						<span>Nạp mẫu PPT GM2</span>
					</button>

					<button
						type="button"
						onClick={onImportClick}
						className="flex w-full items-center justify-center gap-2 rounded-2xl bg-m3-surface-container-high py-2 text-xs font-bold text-m3-on-surface transition hover:bg-m3-surface-container-highest"
					>
						<Icon name="upload_file" className="text-base" />
						<span>Tải lên file JSON</span>
					</button>
				</div>
			</div>
		</aside>
	);
};
