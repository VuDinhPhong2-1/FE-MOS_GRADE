import { useEffect } from "react";
import SettingsForm from "../components/settings/SettingsForm";
import { useAuth } from "../context/AuthContext";
import { usePageActionsContext } from "../context/PageActionsContext";

export default function SettingsPage() {
	const { user } = useAuth();
	const { setConfig } = usePageActionsContext();

	useEffect(() => {
		setConfig({
			title: "Cài đặt",
			subtitle: "Quản lý tài khoản, giao diện và dữ liệu",
		});
		return () => {
			setConfig({});
		};
	}, [setConfig]);

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<SettingsForm userEmail={user?.email ?? ""} />
		</div>
	);
}
