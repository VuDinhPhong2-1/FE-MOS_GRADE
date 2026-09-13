import type React from "react";
import { getStatusLabel, type PermissionStatusBadgeProps } from "./types";

export const PermissionStatusBadge: React.FC<PermissionStatusBadgeProps> = ({
	status,
}) => {
	const currentStatus = status || "Pending";
	const label = getStatusLabel(currentStatus);

	const colorStyles =
		currentStatus === "Approved"
			? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
			: currentStatus === "Rejected"
				? "bg-m3-error-container text-m3-on-error-container"
				: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";

	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold select-none ${colorStyles}`}
		>
			{label}
		</span>
	);
};
