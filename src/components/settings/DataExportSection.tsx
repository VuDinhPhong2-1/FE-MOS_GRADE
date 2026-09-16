import { Button, Icon, Text } from "@bug-on/m3-expressive";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { schoolService } from "../../services/school.service";
import { exportToCsv, exportToJson } from "../../utils/exportUtils";
import { notify } from "../../utils/notify";

type ExportCategory = "profile" | "schools" | "all";

export const DataExportSection = () => {
	const { user, getAccessToken } = useAuth();
	const [selectedCategory, setSelectedCategory] =
		useState<ExportCategory>("profile");
	const [exportingJson, setExportingJson] = useState(false);
	const [exportingCsv, setExportingCsv] = useState(false);

	const getExportData = async (category: ExportCategory) => {
		const currentTheme = localStorage.getItem("md3-source-color") || "#1B6EF3";
		const currentPalette =
			localStorage.getItem("app-office-palette") || "default";
		const timestamp = new Date().toISOString();

		if (category === "profile") {
			return {
				dataType: "User Profile & Preferences",
				exportedAt: timestamp,
				user: {
					userId: user?.userId,
					username: user?.username,
					email: user?.email,
					fullName: user?.fullName,
					phoneNumber: user?.phoneNumber,
					role: user?.role,
					teacherApprovalStatus: user?.teacherApprovalStatus,
					permissions: user?.permissions,
					avatar: user?.avatar,
				},
				preferences: {
					themeColor: currentTheme,
					officePalette: currentPalette,
				},
			};
		}

		if (category === "schools") {
			const schools = await schoolService.getSchools(getAccessToken);
			return {
				dataType: "Schools Directory",
				exportedAt: timestamp,
				total: schools.length,
				schools,
			};
		}

		// category === "all"
		let schoolsData: unknown[] = [];
		try {
			schoolsData = await schoolService.getSchools(getAccessToken);
		} catch {
			schoolsData = [];
		}

		return {
			dataType: "Full System & Profile Backup",
			exportedAt: timestamp,
			user: {
				userId: user?.userId,
				username: user?.username,
				email: user?.email,
				fullName: user?.fullName,
				phoneNumber: user?.phoneNumber,
				role: user?.role,
				teacherApprovalStatus: user?.teacherApprovalStatus,
				permissions: user?.permissions,
			},
			preferences: {
				themeColor: currentTheme,
				officePalette: currentPalette,
			},
			schools: schoolsData,
		};
	};

	const handleExportJson = async () => {
		try {
			setExportingJson(true);
			const data = await getExportData(selectedCategory);
			const dateStr = new Date().toISOString().slice(0, 10);
			const filename = `mos-grader-${selectedCategory}-${dateStr}`;
			exportToJson(filename, data);
			notify.success("Xuất dữ liệu JSON thành công");
		} catch (error) {
			console.error("Lỗi xuất JSON:", error);
			notify.error(
				error instanceof Error ? error.message : "Không thể xuất file JSON",
			);
		} finally {
			setExportingJson(false);
		}
	};

	const handleExportCsv = async () => {
		try {
			setExportingCsv(true);
			const dateStr = new Date().toISOString().slice(0, 10);

			if (selectedCategory === "profile") {
				const currentTheme =
					localStorage.getItem("md3-source-color") || "#1B6EF3";
				const currentPalette =
					localStorage.getItem("app-office-palette") || "default";

				const headers = ["Thuộc tính", "Giá trị"];
				const rows = [
					["Tên đăng nhập", user?.username || ""],
					["Họ và tên", user?.fullName || ""],
					["Thư điện tử", user?.email || ""],
					["Số điện thoại", user?.phoneNumber || ""],
					["Vai trò", user?.role || ""],
					["Trạng thái phê duyệt", user?.teacherApprovalStatus || ""],
					["Bảng màu Office", currentPalette],
					["Mã màu chủ đạo (Hex)", currentTheme],
					["Thời gian xuất", new Date().toLocaleString("vi-VN")],
				];

				exportToCsv(`mos-profile-${dateStr}`, headers, rows);
			} else if (selectedCategory === "schools") {
				const schools = await schoolService.getSchools(getAccessToken);
				const headers = [
					"STT",
					"Mã trường",
					"Tên trường",
					"Địa chỉ",
					"Số điện thoại",
					"Ngày tạo",
				];
				const rows = schools.map((s, idx) => [
					idx + 1,
					s.id || "",
					s.name || "",
					s.address || "",
					s.phoneNumber || "",
					s.createdAt ? new Date(s.createdAt).toLocaleDateString("vi-VN") : "",
				]);

				exportToCsv(`mos-schools-${dateStr}`, headers, rows);
			} else {
				// all
				const schools = await schoolService
					.getSchools(getAccessToken)
					.catch(() => []);
				const headers = ["Phân loại", "Mã", "Tên / Nội dung", "Chi tiết"];
				const rows: (string | number)[][] = [
					[
						"Người dùng",
						user?.userId || "",
						user?.fullName || user?.username || "",
						user?.email || "",
					],
					[
						"Vai trò",
						"-",
						user?.role || "",
						user?.permissions?.join("; ") || "",
					],
					...schools.map((s) => [
						"Trường học",
						s.id || "",
						s.name || "",
						s.address || "",
					]),
				];

				exportToCsv(`mos-backup-${dateStr}`, headers, rows);
			}

			notify.success("Xuất dữ liệu CSV thành công");
		} catch (error) {
			console.error("Lỗi xuất CSV:", error);
			notify.error(
				error instanceof Error ? error.message : "Không thể xuất file CSV",
			);
		} finally {
			setExportingCsv(false);
		}
	};

	return (
		<div className="rounded-2xl bg-m3-surface-container p-6 space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3.5 min-w-0">
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-m3-primary/10 text-m3-primary">
						<Icon name="file_download" size={22} />
					</div>
					<div className="space-y-0.5 min-w-0">
						<Text variant="title-md" className="font-bold text-m3-on-surface">
							Xuất Dữ Liệu (Data Export)
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							Tải về bản sao lưu dữ liệu cá nhân hoặc danh mục hệ thống dưới
							định dạng JSON hoặc bảng tính CSV (tương thích Microsoft Excel
							tiếng Việt).
						</Text>
					</div>
				</div>
			</div>

			{/* Category Selector */}
			<div className="space-y-2">
				<span className="block text-xs font-semibold text-m3-on-surface-variant">
					Chọn phạm vi dữ liệu cần xuất
				</span>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{[
						{
							id: "profile" as const,
							label: "Hồ sơ & Cài đặt",
							desc: "Thông tin cá nhân & giao diện",
							icon: "account_box",
						},
						{
							id: "schools" as const,
							label: "Danh sách trường",
							desc: "Dữ liệu trường học liên kết",
							icon: "school",
						},
						{
							id: "all" as const,
							label: "Sao lưu tổng thể",
							desc: "Toàn bộ thông tin & danh mục",
							icon: "database",
						},
					].map((cat) => {
						const isSelected = selectedCategory === cat.id;
						return (
							<button
								key={cat.id}
								type="button"
								onClick={() => setSelectedCategory(cat.id)}
								className={`flex items-start gap-3 rounded-2xl p-3.5 text-left transition-all duration-200 cursor-pointer ${
									isSelected
										? "bg-m3-surface-container-highest border-m3-primary"
										: "bg-m3-surface-container-low border-m3-outline-variant/30 hover:border-m3-outline"
								}`}
							>
								<div
									className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
										isSelected
											? "bg-m3-primary text-m3-on-primary"
											: "bg-m3-surface-container-high text-m3-on-surface-variant"
									}`}
								>
									<Icon name={cat.icon} size={18} />
								</div>
								<div className="min-w-0 flex-1">
									<div className="truncate text-xs font-bold text-m3-on-surface">
										{cat.label}
									</div>
									<div className="truncate text-[11px] text-m3-on-surface-variant">
										{cat.desc}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Actions */}
			<div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-m3-outline-variant/30">
				<Button
					type="button"
					colorStyle="outlined"
					size="md"
					onClick={handleExportJson}
					loading={exportingJson}
					loadingVariant="circular"
					disabled={exportingJson || exportingCsv}
					icon={<Icon name="data_object" className="text-base" />}
				>
					Xuất dữ liệu JSON
				</Button>

				<Button
					type="button"
					colorStyle="filled"
					size="md"
					onClick={handleExportCsv}
					loading={exportingCsv}
					loadingVariant="circular"
					disabled={exportingJson || exportingCsv}
					icon={<Icon name="table_view" className="text-base" />}
				>
					Xuất dữ liệu CSV
				</Button>
			</div>
		</div>
	);
};

export default DataExportSection;
