import {
	Button,
	Card,
	Icon,
	ProgressIndicator,
	ScrollArea,
	Text,
} from "@bug-on/m3-expressive";
import { memo, useMemo, useState } from "react";
import { PermissionItem } from "./PermissionItem";
import {
	getPermissionInfo,
	PERMISSION_GROUPS,
	type PermissionGroup,
	type PermissionPanelProps,
} from "./types";

export const PermissionPanel = memo(function PermissionPanel({
	selectedTeacher,
	permissionCatalog,
	selectedPermissions,
	loading,
	saving,
	onTogglePermission,
	onToggleGroup,
	onSelectAll,
	onClearAll,
	onSave,
}: PermissionPanelProps) {
	const [permissionKeyword, setPermissionKeyword] = useState("");

	const groupedPermissions = useMemo(() => {
		const catalogSet = new Set(permissionCatalog);
		const knownPermissionSet = new Set(
			PERMISSION_GROUPS.flatMap((group) => group.permissions),
		);
		const normalizedKeyword = permissionKeyword.trim().toLowerCase();

		const matchesKeyword = (permission: string) => {
			if (!normalizedKeyword) return true;
			const info = getPermissionInfo(permission);
			return (
				permission.toLowerCase().includes(normalizedKeyword) ||
				info.label.toLowerCase().includes(normalizedKeyword) ||
				info.description.toLowerCase().includes(normalizedKeyword)
			);
		};

		const groups = PERMISSION_GROUPS.map((group) => ({
			...group,
			permissions: group.permissions.filter(
				(permission) => catalogSet.has(permission) && matchesKeyword(permission),
			),
		})).filter((group) => group.permissions.length > 0);

		const otherPermissions = permissionCatalog.filter(
			(permission) =>
				!knownPermissionSet.has(permission) &&
				catalogSet.has(permission) &&
				matchesKeyword(permission),
		);

		if (otherPermissions.length > 0) {
			groups.push({
				id: "other",
				title: "Quyền khác",
				description:
					"Các quyền mới từ backend chưa được gán vào nhóm hiển thị cố định.",
				icon: "extension",
				permissions: otherPermissions,
			});
		}

		return groups;
	}, [permissionCatalog, permissionKeyword]);

	const disabled = loading || saving;

	if (!selectedTeacher) {
		return (
			<Card
				variant="filled"
				className="rounded-3xl bg-m3-surface-container p-6 shadow-xs text-m3-on-surface border-none flex flex-col items-center justify-center min-h-80 text-center"
			>
				<div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-m3-surface-container-high text-m3-on-surface-variant mb-3">
					<Icon name="person_outline" size={32} />
				</div>
				<h4 className="text-base font-bold text-m3-on-surface">
					Chưa chọn giáo viên
				</h4>
				<Text
					variant="body-sm"
					className="mt-1 text-xs text-m3-on-surface-variant max-w-xs"
				>
					Vui lòng chọn một giáo viên từ danh sách bên trái để xem và phân quyền
					chức năng.
				</Text>
			</Card>
		);
	}

	return (
		<Card
			variant="filled"
			className="rounded-3xl bg-m3-surface-container p-4 sm:p-6 shadow-xs text-m3-on-surface border-none flex flex-col gap-4"
		>
			<div className="flex flex-wrap items-start justify-between gap-4 border-b border-m3-outline-variant/30 pb-4">
				<div>
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold text-m3-on-surface">
							{selectedTeacher.fullName || selectedTeacher.username}
						</h3>
						<span className="rounded-full bg-m3-primary/10 px-2.5 py-0.5 text-xs font-semibold text-m3-primary">
							Đã chọn {selectedPermissions.length}/{permissionCatalog.length}{" "}
							quyền
						</span>
					</div>
					<Text
						variant="body-md"
						className="text-sm text-m3-on-surface-variant mt-0.5"
					>
						{selectedTeacher.email || selectedTeacher.username}
					</Text>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						colorStyle="tonal"
						onClick={onSelectAll}
						disabled={loading || saving}
						icon={<Icon name="select_all" size={16} />}
					>
						Chọn tất cả
					</Button>
					<Button
						type="button"
						size="sm"
						colorStyle="outlined"
						onClick={onClearAll}
						disabled={loading || saving}
						icon={<Icon name="deselect" size={16} />}
					>
						Bỏ chọn tất cả
					</Button>
				</div>
			</div>

			<div className="relative">
				<Icon
					name="search"
					size={20}
					className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant"
				/>
				<input
					type="search"
					value={permissionKeyword}
					onChange={(event) => setPermissionKeyword(event.target.value)}
					placeholder="Tìm quyền theo tên hoặc mã permission..."
					className="w-full rounded-2xl border border-m3-outline-variant/50 bg-m3-surface-container-low px-10 py-3 text-sm font-medium text-m3-on-surface outline-none transition focus:border-m3-primary focus:bg-m3-surface"
				/>
				{permissionKeyword && (
					<button
						type="button"
						className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-m3-on-surface-variant hover:bg-m3-surface-container-high hover:text-m3-on-surface"
						onClick={() => setPermissionKeyword("")}
						aria-label="Xóa từ khóa tìm quyền"
					>
						<Icon name="close" size={18} />
					</button>
				)}
			</div>

			<ScrollArea type="hover" orientation="vertical" className="max-h-140 pr-1">
				<div className="space-y-3">
					{groupedPermissions.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-m3-outline-variant/60 bg-m3-surface-container-low p-6 text-center">
							<Icon
								name="search_off"
								size={32}
								className="mx-auto mb-2 text-m3-on-surface-variant"
							/>
							<Text
								variant="body-md"
								className="font-semibold text-m3-on-surface"
							>
								Không tìm thấy quyền phù hợp
							</Text>
							<Text
								variant="body-sm"
								className="mt-1 text-m3-on-surface-variant"
							>
								Thử nhập từ khóa khác hoặc xóa bộ lọc tìm kiếm.
							</Text>
						</div>
					) : (
						groupedPermissions.map((group) => {
							const selectedCount = group.permissions.filter((permission) =>
								selectedPermissions.includes(permission),
							).length;
							const allSelected = selectedCount === group.permissions.length;
							const partiallySelected = selectedCount > 0 && !allSelected;

							return (
								<PermissionGroupCard
									key={group.id}
									group={group}
									selectedPermissions={selectedPermissions}
									selectedCount={selectedCount}
									allSelected={allSelected}
									partiallySelected={partiallySelected}
									disabled={disabled}
									onTogglePermission={onTogglePermission}
									onToggleGroup={onToggleGroup}
								/>
							);
						})
					)}
				</div>
			</ScrollArea>

			<div className="flex justify-end pt-2 border-t border-m3-outline-variant/30">
				<Button
					type="button"
					colorStyle="filled"
					size="md"
					onClick={() => void onSave()}
					disabled={saving || loading}
					icon={
						saving ? (
							<ProgressIndicator
								variant="circular"
								shape="wavy"
								showTrack
								size={18}
								aria-label="Đang lưu phân quyền"
							/>
						) : (
							<Icon name="verified_user" size={18} />
						)
					}
				>
					{saving ? "Đang lưu..." : "Lưu phân quyền"}
				</Button>
			</div>
		</Card>
	);
});

interface PermissionGroupCardProps {
	group: PermissionGroup;
	selectedPermissions: string[];
	selectedCount: number;
	allSelected: boolean;
	partiallySelected: boolean;
	disabled: boolean;
	onTogglePermission: (permission: string) => void;
	onToggleGroup: (permissions: string[], select: boolean) => void;
}

const PermissionGroupCard = memo(function PermissionGroupCard({
	group,
	selectedPermissions,
	selectedCount,
	allSelected,
	partiallySelected,
	disabled,
	onTogglePermission,
	onToggleGroup,
}: PermissionGroupCardProps) {
	return (
		<section className="rounded-3xl border border-m3-outline-variant/40 bg-m3-surface-container-low p-3 sm:p-4">
			<div className="mb-3 flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-3">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
						<Icon name={group.icon} size={24} />
					</div>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h4 className="text-base font-bold text-m3-on-surface">
								{group.title}
							</h4>
							<span
								className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
									allSelected
										? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
										: partiallySelected
											? "bg-m3-primary/10 text-m3-primary"
											: "bg-m3-surface-container-high text-m3-on-surface-variant"
								}`}
							>
								{selectedCount}/{group.permissions.length} quyền
							</span>
						</div>
						<Text
							variant="body-sm"
							className="mt-0.5 text-xs text-m3-on-surface-variant"
						>
							{group.description}
						</Text>
					</div>
				</div>

				<Button
					type="button"
					size="sm"
					colorStyle={allSelected ? "outlined" : "tonal"}
					disabled={disabled}
					onClick={() => onToggleGroup(group.permissions, !allSelected)}
					icon={
						<Icon name={allSelected ? "deselect" : "done_all"} size={16} />
					}
				>
					{allSelected ? "Bỏ chọn nhóm" : "Chọn nhóm"}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
				{group.permissions.map((permission) => (
					<PermissionItem
						key={permission}
						permission={permission}
						checked={selectedPermissions.includes(permission)}
						disabled={disabled}
						onToggle={onTogglePermission}
					/>
				))}
			</div>
		</section>
	);
});
