import {
	Card,
	Select,
	type SelectOption,
	Switch,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import type { GradingRuleSet } from "../../../../types/xml-grading-rules.types";
import { normalizeSubject } from "../../utils/xml-rule-helpers";

export interface RulesetMetadataFormProps {
	selected: GradingRuleSet;
	onChange: (next: GradingRuleSet) => void;
}

const SUBJECT_OPTIONS: SelectOption[] = [
	{ value: "excel", label: "Excel (.xlsx)" },
	{ value: "word", label: "Word (.docx)" },
	{ value: "ppt", label: "PowerPoint (.pptx)" },
];

export const RulesetMetadataForm: React.FC<RulesetMetadataFormProps> = ({
	selected,
	onChange,
}) => {
	return (
		<Card
			variant="filled"
			disableElevation
			className="rounded-3xl bg-m3-surface-container p-6 text-m3-on-surface"
		>
			<div className="mb-4">
				<Text
					variant="title-md"
					as="h3"
					className="font-bold text-m3-on-surface"
				>
					Thông tin cấu hình bộ luật
				</Text>
				<Text
					variant="body-sm"
					className="mt-1 text-xs text-m3-on-surface-variant"
				>
					Thiết lập môn thi, phiên bản và trạng thái hoạt động của ruleset.
				</Text>
			</div>

			<div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
				<Select
					variant="filled"
					menuVariant="expressive"
					colorVariant="vibrant"
					label="Môn / Loại file"
					value={normalizeSubject(selected.subject)}
					onChange={(val) =>
						onChange({
							...selected,
							subject: val,
						})
					}
					showDividers={false}
					options={SUBJECT_OPTIONS}
					fullWidth
				/>

				<TextField
					label="Phiên bản bộ luật"
					placeholder="v1"
					value={selected.version}
					onChange={(val) =>
						onChange({
							...selected,
							version: val,
						})
					}
					fullWidth
				/>

				<div className="flex h-14 items-center px-4">
					<Switch
						label="Kích hoạt"
						checked={selected.isActive}
						onCheckedChange={(checked) =>
							onChange({
								...selected,
								isActive: checked,
							})
						}
					/>
				</div>
			</div>
		</Card>
	);
};

