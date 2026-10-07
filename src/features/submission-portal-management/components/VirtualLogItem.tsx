import { ShapeIcon } from "@bug-on/m3-expressive";
import type {
	ListItemComponent,
	ListItemPosition,
} from "@bug-on/m3-expressive/layout";
import { ListItem } from "@bug-on/m3-expressive/layout";
import type React from "react";
import { memo } from "react";
import type { SubmissionLog } from "../../../types/submission-portal.types";
import { formatDateTime } from "../utils/portalFormatters";

interface VirtualLogItemProps {
	log: SubmissionLog;
	index: number;
	total: number;
	position?: ListItemPosition;
	_listIndex?: number;
}

const getLogItemPosition = (index: number, total: number): ListItemPosition => {
	if (total <= 1) return "solo";
	if (index === 0) return "leading";
	if (index === total - 1) return "trailing";
	return "middle";
};

const VirtualLogItemComponent: React.FC<VirtualLogItemProps> = ({
	log,
	index,
	total,
	position,
	_listIndex,
}) => {
	const resolvedPosition = position ?? getLogItemPosition(index, total);

	const initials =
		log.studentName
			.trim()
			.split(/\s+/)
			.slice(-2)
			.map((w) => w[0])
			.join("")
			.toUpperCase() || "HS";

	return (
		<ListItem
			value={log.id}
			position={resolvedPosition}
			_listIndex={_listIndex ?? index}
			headline={
				<span className="font-semibold text-m3-on-surface block truncate">
					{log.studentName}
				</span>
			}
			supportingText={
				<span className="block text-xs text-m3-on-surface-variant truncate">
					{log.className} · {log.assignmentName}
					{log.fileName ? ` · ${log.fileName}` : ""}
				</span>
			}
			supportingTextLines={2}
			leadingType="custom"
			leadingContent={
				<ShapeIcon
					shape="circle"
					size={40}
					className="flex items-center justify-center bg-m3-secondary-container text-m3-on-secondary-container text-xs font-bold select-none shrink-0"
				>
					{initials}
				</ShapeIcon>
			}
			trailingType="custom"
			trailingContent={
				<div className="flex flex-col items-end text-right shrink-0">
					<span className="inline-flex items-center rounded-m3-full bg-m3-primary/10 px-2.5 py-0.5 text-xs font-black text-m3-primary whitespace-nowrap">
						{log.scoreValue ?? "--"}/{log.maxScore}
					</span>
					<span className="text-[11px] text-m3-on-surface-variant mt-1 whitespace-nowrap">
						{formatDateTime(log.submittedAt)}
					</span>
				</div>
			}
			className="bg-m3-surface-container-lowest! min-w-0 overflow-hidden"
			alignItems="center"
		/>
	);
};

export const VirtualLogItem = memo(
	VirtualLogItemComponent,
) as unknown as React.FC<VirtualLogItemProps> & ListItemComponent;

(VirtualLogItem as unknown as ListItemComponent)._m3ListItem = true;
