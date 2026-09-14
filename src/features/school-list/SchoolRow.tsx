import {
	ButtonDistribute,
	Chip,
	Icon,
	IconButton,
} from "@bug-on/m3-expressive";
import type React from "react";
import { memo, useCallback } from "react";
import { cn } from "../../utils/utils";
import type { SchoolRowProps } from "./types";

export const SchoolRow = memo(function SchoolRow({
	school,
	index,
	canDeleteSchool,
	isDeleting,
	isCurrentDeleting,
	onSelect,
	onEdit,
	onDelete,
}: SchoolRowProps) {
	const handleRowClick = useCallback(() => {
		onSelect(school);
	}, [onSelect, school]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTableRowElement>) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onSelect(school);
			}
		},
		[onSelect, school],
	);

	const handleEdit = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onEdit(school);
		},
		[onEdit, school],
	);

	const handleDelete = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onDelete(school);
		},
		[onDelete, school],
	);

	const isBanded = index % 2 === 1;

	return (
		<tr
			className={cn(
				"group cursor-pointer transition-colors",
				isBanded ? "bg-m3-surface-container-high/30" : "bg-transparent",
				"hover:bg-m3-surface-container-high/60 focus-within:bg-m3-primary/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary",
			)}
			onClick={handleRowClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={`Xem lớp học của trường ${school.name}`}
			title="Bấm để xem danh sách lớp"
		>
			<td className="px-6 py-4 font-semibold text-m3-on-surface-variant">
				{index + 1}
			</td>
			<td className="px-6 py-4">
				<Chip
					variant="assist"
					label={school.code || "---"}
					className="h-6 px-2.5 text-xs font-bold text-m3-primary border-none bg-m3-surface-container-high pointer-events-none shadow-xs"
				/>
			</td>
			<td className="px-6 py-4">
				<div className="flex flex-col">
					<span className="font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
						{school.name}
					</span>
					{school.address && (
						<span className="text-xs text-m3-on-surface-variant line-clamp-1">
							{school.address}
						</span>
					)}
				</div>
			</td>
			<td className="px-6 py-4 text-center">
				<ButtonDistribute
					mode="dynamic"
					size="sm"
					weights={[2, 1]}
					gap={4}
					expandRatio={0.1}
				>
					<IconButton
						type="button"
						size="sm"
						colorStyle="standard"
						disabled={isDeleting}
						onClick={handleEdit}
						title="Chỉnh sửa trường"
						aria-label={`Chỉnh sửa trường ${school.name}`}
					>
						<Icon name="edit" className="text-base" />
					</IconButton>
					{canDeleteSchool && (
						<IconButton
							type="button"
							size="sm"
							colorStyle="standard"
							disabled={isDeleting}
							loading={isCurrentDeleting}
							onClick={handleDelete}
							className="text-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container"
							title="Xóa trường"
							aria-label={`Xóa trường ${school.name}`}
						>
							<Icon name="delete" className="text-base" />
						</IconButton>
					)}
				</ButtonDistribute>
			</td>
		</tr>
	);
});
