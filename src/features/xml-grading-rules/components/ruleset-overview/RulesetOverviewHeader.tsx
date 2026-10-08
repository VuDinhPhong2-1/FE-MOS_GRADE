import { Button, Card, Icon, IconButton, Text } from "@bug-on/m3-expressive";
import type React from "react";
import type { GradingRuleSet } from "../../../../types/xml-grading-rules.types";
import { getSubjectMeta } from "../../utils/xml-rule-helpers";

export interface RulesetOverviewHeaderProps {
	selected: GradingRuleSet;
	onExportJson: () => void;
	onDeleteRuleSet: (id: string) => void;
}

export const RulesetOverviewHeader: React.FC<RulesetOverviewHeaderProps> = ({
	selected,
	onExportJson,
	onDeleteRuleSet,
}) => {
	const subjectMeta = getSubjectMeta(selected.subject);
	const projectCount = selected.projects.length;
	const taskCount = selected.projects.reduce(
		(sum, p) => sum + p.tasks.length,
		0,
	);
	const conditionCount = selected.projects.reduce(
		(sum, p) =>
			sum + p.tasks.reduce((tSum, t) => tSum + t.conditions.length, 0),
		0,
	);
	const maxScore = selected.projects.reduce(
		(sum, p) => sum + Number(p.maxScore || 0),
		0,
	);

	return (
		<Card variant="filled" className="bg-m3-surface-container-highest p-4">
			{/* Top bar: title, subject, version, status, actions */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="mb-1 flex flex-wrap items-center gap-2">
						<span
							className={`rounded-xl px-2.5 py-1 text-xs font-black uppercase tracking-wider ${subjectMeta.className}`}
						>
							{subjectMeta.label}
						</span>
						<h2 className="text-xl font-black text-m3-on-surface">
							{selected.version || "v1"}
						</h2>
						<span
							className={`rounded-full px-3 py-1 text-xs font-bold ${selected.isActive
								? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
								: "bg-m3-surface-container-high text-m3-on-surface-variant"
								}`}
						>
							{selected.isActive ? "Đang hoạt động" : "Đang tắt"}
						</span>
					</div>
					<Text
						variant="label-sm"
						className="text-xs text-m3-on-surface-variant"
					>
						{selected.id
							? `Mã định danh: ${selected.id}`
							: "Ruleset mới chưa được lưu"}
					</Text>
				</div>

				<div className="flex items-center gap-2">
					<Button
						colorStyle="filled"
						onClick={onExportJson}
						size="sm"
						icon={<Icon name="download" size={20} />}
					>
						Xuất JSON
					</Button>

					{selected.id && (
						<IconButton
							aria-label="Xóa ruleset"
							size="sm"
							onClick={() => onDeleteRuleSet(selected.id)}
							className="text-m3-error hover:bg-m3-error-container"
						>
							<Icon name="delete" size={20} />
						</IconButton>
					)}
				</div>
			</div>

			{/* Stats Grid */}
			<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[
					["Projects", projectCount],
					["Tasks", taskCount],
					["Conditions", conditionCount],
					["Max score", maxScore],
				].map(([label, value]) => (
					<Card
						key={label}
						variant="filled"
						disableElevation
						disableHoverEffect
						className="rounded-m3-md bg-m3-surface-container-lowest px-4 py-3"
					>
						<Text
							variant="label-sm"
							className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant"
						>
							{label}
						</Text>
						<Text
							variant="headline-sm"
							className="mt-1 text-xl font-black text-m3-on-surface"
						>
							{value}
						</Text>
					</Card>
				))}
			</div>
		</Card>
	);
};
