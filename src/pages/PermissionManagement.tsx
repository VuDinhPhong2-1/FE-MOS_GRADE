import { Card, Icon } from "@bug-on/m3-expressive";
import type React from "react";
import { useMemo } from "react";
import { usePageHeader } from "../context/PageActionsContext";
import {
	PermissionPanel,
	PermissionTabs,
	TeacherListPanel,
	TeacherRequestList,
	usePermissionData,
} from "../features/permission-management";

const PermissionManagement: React.FC = () => {
	const {
		isAdmin,
		activeTab,
		setActiveTab,
		loading,
		requestLoading,
		saving,
		decidingUserId,
		error,
		success,
		teacherRequests,
		requestStatus,
		setRequestStatus,
		decisionNotes,
		permissionCatalog,
		selectedTeacherId,
		selectedTeacher,
		filteredTeachers,
		selectedPermissions,
		teacherKeyword,
		setTeacherKeyword,
		selectTeacher,
		togglePermission,
		selectAllPermissions,
		clearAllPermissions,
		savePermissions,
		handleNoteChange,
		decideTeacherRequest,
		handleRefresh,
	} = usePermissionData();

	const pendingCount = useMemo(
		() =>
			teacherRequests.filter(
				(req) => (req.teacherApprovalStatus || "Pending") === "Pending",
			).length,
		[teacherRequests],
	);

	usePageHeader(
		{
			title: "Phân quyền giáo viên",
			subtitle:
				"Admin duyệt tài khoản giáo viên mới và chỉnh permissions cho giáo viên đã duyệt",
			actions: [
				{
					id: "reload-permissions",
					label: "Làm mới",
					icon: "refresh",
					colorStyle: "outlined",
					onClick: handleRefresh,
					disabled:
						loading || requestLoading || saving || Boolean(decidingUserId),
				},
			],
		},
		[
			isAdmin,
			requestStatus,
			selectedTeacherId,
			loading,
			requestLoading,
			saving,
			decidingUserId,
			handleRefresh,
		],
	);

	if (!isAdmin) {
		return (
			<Card
				variant="filled"
				className="rounded-3xl bg-m3-surface-container p-6 shadow-xs text-m3-on-surface border-none"
			>
				<div className="flex items-center gap-3 text-m3-error mb-2">
					<Icon name="gpp_bad" size={28} />
					<h1 className="text-xl font-bold tracking-tight">
						Truy cập bị từ chối
					</h1>
				</div>
				<p className="text-sm text-m3-on-surface-variant">
					Chức năng này chỉ dành riêng cho Quản trị viên (Admin) của hệ thống.
				</p>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{error && (
				<div className="flex items-center gap-3 rounded-2xl border border-m3-error/20 bg-m3-error-container/60 px-4 py-3 text-sm text-m3-on-error-container shadow-xs">
					<Icon name="error" size={20} className="shrink-0 text-m3-error" />
					<span className="font-medium">{error}</span>
				</div>
			)}
			{success && (
				<div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 shadow-xs">
					<Icon
						name="check_circle"
						size={20}
						className="shrink-0 text-emerald-600 dark:text-emerald-400"
					/>
					<span className="font-medium">{success}</span>
				</div>
			)}

			<PermissionTabs
				activeTab={activeTab}
				onTabChange={setActiveTab}
				pendingRequestsCount={pendingCount}
			/>

			{activeTab === "requests" ? (
				<TeacherRequestList
					requests={teacherRequests}
					requestLoading={requestLoading}
					requestStatus={requestStatus}
					onRequestStatusChange={setRequestStatus}
					decisionNotes={decisionNotes}
					decidingUserId={decidingUserId}
					onNoteChange={handleNoteChange}
					onDecide={decideTeacherRequest}
				/>
			) : (
				<div className="grid gap-4 lg:grid-cols-[340px_1fr]">
					<TeacherListPanel
						teachers={filteredTeachers}
						selectedTeacherId={selectedTeacherId}
						loading={loading}
						searchKeyword={teacherKeyword}
						onSearchChange={setTeacherKeyword}
						onSelectTeacher={selectTeacher}
					/>

					<PermissionPanel
						selectedTeacher={selectedTeacher}
						permissionCatalog={permissionCatalog}
						selectedPermissions={selectedPermissions}
						loading={loading}
						saving={saving}
						onTogglePermission={togglePermission}
						onSelectAll={selectAllPermissions}
						onClearAll={clearAllPermissions}
						onSave={savePermissions}
					/>
				</div>
			)}
		</div>
	);
};

export default PermissionManagement;
