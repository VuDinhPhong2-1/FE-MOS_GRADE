import { Icon, Tab, Tabs, TabsList } from "@bug-on/m3-expressive";
import { memo } from "react";
import type { ActiveTab, PermissionTabsProps } from "./types";

export const PermissionTabs = memo(function PermissionTabs({
	activeTab,
	onTabChange,
	pendingRequestsCount,
}: PermissionTabsProps) {
	return (
		<div className="w-full max-w-md">
			<Tabs
				value={activeTab}
				onValueChange={(val) => onTabChange(val as ActiveTab)}
			>
				<TabsList
					variant="primary"
					className="rounded-2xl bg-m3-surface-container-high/60 p-1"
				>
					<Tab
						value="requests"
						icon={<Icon name="how_to_reg" size={18} />}
						inlineIcon
						badge={
							pendingRequestsCount && pendingRequestsCount > 0 ? (
								<span className="ml-1.5 rounded-full bg-m3-primary px-1.5 py-0.2 text-[10px] font-bold text-m3-on-primary">
									{pendingRequestsCount}
								</span>
							) : undefined
						}
					>
						Yêu cầu giáo viên
					</Tab>
					<Tab
						value="permissions"
						icon={<Icon name="admin_panel_settings" size={18} />}
						inlineIcon
					>
						Phân quyền đã duyệt
					</Tab>
				</TabsList>
			</Tabs>
		</div>
	);
});
