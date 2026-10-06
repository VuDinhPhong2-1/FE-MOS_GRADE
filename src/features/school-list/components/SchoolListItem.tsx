import {
	ButtonDistribute,
	Chip,
	Icon,
	IconButton,
	ListItem,
	ShapeIcon,
} from "@bug-on/m3-expressive";
import { type MouseEvent, memo, useCallback } from "react";
import type { SchoolListItemProps } from "../types";

const SchoolListItemComponent = ({
	school,
	index,
	canDeleteSchool,
	isDeleting,
	isCurrentDeleting,
	onSelect,
	onEdit,
	onDelete,
	_listIndex,
	position,
}: SchoolListItemProps) => {
	const handleClick = useCallback(() => {
		onSelect(school);
	}, [onSelect, school]);

	const handleEdit = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation();
			onEdit(school);
		},
		[onEdit, school],
	);

	const handleDelete = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation();
			onDelete(school);
		},
		[onDelete, school],
	);

	return (
		<ListItem
			value={school.id}
			_listIndex={_listIndex}
			position={position}
			interactive
			onClick={handleClick}
			className="group bg-m3-surface-container-lowest! min-h-18 cursor-pointer [&_button]:cursor-pointer"
			aria-label={`Xem danh sách lớp của trường ${school.name}`}
			leadingType="custom"
			leadingContent={
				<div className="flex items-center gap-3 shrink-0">
					<ShapeIcon
						size={40}
						shape="sunny"
						className="flex items-center justify-center rounded-full bg-m3-surface-container-high text-sm font-semibold text-m3-on-surface-variant"
					>
						{index + 1}
					</ShapeIcon>
				</div>
			}
			headline={
				<div className="flex items-center gap-2">
					<span className="font-bold text-sm sm:text-base text-m3-on-surface transition-colors group-hover:text-m3-primary">
						{school.name}
					</span>
					<Chip
						variant="assist"
						label={school.code || "---"}
						className="pointer-events-none h-5 px-2 text-xs text-m3-on-secondary-container border-none rounded-m3-full bg-m3-secondary-container"
					/>
				</div>
			}
			supportingText={
				school.address ? (
					<span className="line-clamp-1 text-xs text-m3-on-surface-variant">
						{school.address}
					</span>
				) : undefined
			}
			supportingTextLines={1}
			trailingType="custom"
			trailingContent={
				<div
					role="toolbar"
					aria-label="Thao tác"
					className="inline-flex items-center justify-center"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<ButtonDistribute
						mode="dynamic"
						size="sm"
						weights={[2, 1]}
						gap={4}
						expandRatio={0.1}
					>
						<IconButton
							size="sm"
							colorStyle="filled"
							disabled={isDeleting}
							onClick={handleEdit}
							title="Chỉnh sửa trường"
							aria-label={`Chỉnh sửa trường ${school.name}`}
						>
							<Icon name="edit" size={20} />
						</IconButton>
						{canDeleteSchool && (
							<IconButton
								size="sm"
								colorStyle="standard"
								disabled={isDeleting}
								loading={isCurrentDeleting}
								onClick={handleDelete}
								className="text-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container"
								title="Xóa trường"
								aria-label={`Xóa trường ${school.name}`}
							>
								<Icon name="delete" size={20} />
							</IconButton>
						)}
					</ButtonDistribute>
				</div>
			}
		/>
	);
};

export const SchoolListItem = memo(
	SchoolListItemComponent,
) as typeof SchoolListItemComponent & {
	_m3ListItem?: boolean;
};
SchoolListItem._m3ListItem = true;
