import {
	Checkbox,
	Icon,
	IconButton,
	PlainTooltip,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { memo, useCallback, useId } from "react";
import { getPermissionInfo, type PermissionItemProps } from "./types";

export const PermissionItem = memo(function PermissionItem({
	permission,
	checked,
	disabled = false,
	onToggle,
}: PermissionItemProps) {
	const permissionInfo = getPermissionInfo(permission);
	const inputId = useId();

	const handleToggle = useCallback(() => {
		if (!disabled) {
			onToggle(permission);
		}
	}, [disabled, onToggle, permission]);

	return (
		<div
			className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-2.5 sm:p-3 text-sm transition-all ${
				checked
					? "border-m3-primary/50 bg-m3-primary/8 text-m3-on-surface"
					: "border-m3-outline-variant/40 bg-m3-surface text-m3-on-surface-variant hover:bg-m3-surface-container-high/60 hover:text-m3-on-surface"
			}`}
		>
			<div className="flex min-w-0 flex-1 items-center gap-2">
				<div className="shrink-0 -my-1.5 -ml-1.5">
					<Checkbox
						id={inputId}
						checked={checked}
						disabled={disabled}
						onCheckedChange={handleToggle}
						aria-label={permissionInfo.label}
					/>
				</div>
				<label
					htmlFor={inputId}
					className="min-w-0 flex-1 cursor-pointer select-none"
				>
					<p className="font-semibold text-m3-on-surface line-clamp-1">
						{permissionInfo.label}
					</p>
					<p className="text-xs text-m3-on-surface-variant/80 font-mono mt-0.5 line-clamp-1">
						{permission}
					</p>
				</label>
			</div>

			<div className="shrink-0">
				<TooltipBox
					tooltip={
						<PlainTooltip>
							{permissionInfo.label}: {permissionInfo.description}
						</PlainTooltip>
					}
					placement="top"
				>
					<IconButton
						type="button"
						aria-label={`Mô tả chi tiết: ${permissionInfo.label}`}
						size="xs"
						colorStyle="standard"
						shape="square"
						className="text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-primary/10 transition-colors"
					>
						<Icon name="info" size={18} />
					</IconButton>
				</TooltipBox>
			</div>
		</div>
	);
});
