import { Button, Card, Icon, ProgressIndicator } from "@bug-on/m3-expressive";
import { memo } from "react";
import { PermissionItem } from "./PermissionItem";
import type { PermissionPanelProps } from "./types";

export const PermissionPanel = memo(function PermissionPanel({
	selectedTeacher,
	permissionCatalog,
	selectedPermissions,
	loading,
	saving,
	onTogglePermission,
	onSelectAll,
	onClearAll,
	onSave,
}: PermissionPanelProps) {
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
				<p className="mt-1 text-xs text-m3-on-surface-variant max-w-xs">
					Vui lòng chọn một giáo viên từ danh sách bên trái để xem và phân quyền
					chức năng.
				</p>
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
					<p className="text-sm text-m3-on-surface-variant mt-0.5">
						{selectedTeacher.email || selectedTeacher.username}
					</p>
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

			<div className="max-h-140 overflow-y-auto pr-1">
				<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
					{permissionCatalog.map((permission) => (
						<PermissionItem
							key={permission}
							permission={permission}
							checked={selectedPermissions.includes(permission)}
							disabled={loading || saving}
							onToggle={onTogglePermission}
						/>
					))}
				</div>
			</div>

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
