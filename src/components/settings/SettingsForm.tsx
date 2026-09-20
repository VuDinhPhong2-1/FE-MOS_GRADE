import { AccountSection } from "./AccountSection";
import { DataExportSection } from "./DataExportSection";
import { ThemePaletteSection } from "./ThemePaletteSection";

interface SettingsFormProps {
	userEmail?: string;
}

export const SettingsForm = (_props: SettingsFormProps) => {
	return (
		<div className="space-y-5">
			{/* Phần thông tin tài khoản & Đăng xuất */}
			<AccountSection />

			{/* Phần chọn Palette màu Microsoft Office */}
			<ThemePaletteSection />

			{/* Phần xuất dữ liệu JSON & CSV */}
			<DataExportSection />
		</div>
	);
};

export default SettingsForm;
