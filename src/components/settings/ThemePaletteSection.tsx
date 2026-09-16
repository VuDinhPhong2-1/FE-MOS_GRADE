import { Icon, Text, useTheme } from "@bug-on/m3-expressive";
import { useMemo } from "react";
import { notify } from "../../utils/notify";

export interface OfficePalette {
	id: string;
	name: string;
	software: string;
	description: string;
	primary: string;
	shades: string[];
	icon: string;
}

export const OFFICE_PALETTES: OfficePalette[] = [
	{
		id: "default",
		name: "Mặc định (MOS Blue)",
		software: "MOS Grader Pro",
		description: "Tone màu xanh dương hiện đại tiêu chuẩn của hệ thống",
		primary: "#1B6EF3",
		shades: ["#1B6EF3", "#4A8DF8", "#82B1FF", "#B3D4FF", "#FFFFFF"],
		icon: "tune",
	},
	{
		id: "powerpoint",
		name: "PowerPoint",
		software: "Microsoft PowerPoint",
		description: "Sắc cam đỏ nhiệt huyết, hiện đại và tràn đầy năng lượng",
		primary: "#C13B1B",
		shades: ["#C13B1B", "#D35230", "#ED6C47", "#FF8F6B", "#FFFFFF"],
		icon: "slideshow",
	},
	{
		id: "word",
		name: "Word",
		software: "Microsoft Word",
		description: "Sắc xanh dương thanh lịch, tập trung và chuẩn mực văn phòng",
		primary: "#1B5EBE",
		shades: ["#1B5EBE", "#41A5EE", "#2B7CD3", "#103F91", "#FFFFFF"],
		icon: "description",
	},
	{
		id: "excel",
		name: "Excel",
		software: "Microsoft Excel",
		description:
			"Sắc xanh ngọc lục bảo tươi sáng, phân tích số liệu và báo cáo",
		primary: "#10793F",
		shades: ["#10793F", "#185C37", "#21A366", "#33C481", "#FFFFFF"],
		icon: "table_chart",
	},
	{
		id: "outlook",
		name: "Outlook",
		software: "Microsoft Outlook",
		description: "Sắc xanh da trời đa tầng, kết nối thư từ và quản lý lịch",
		primary: "#127CD6",
		shades: [
			"#127CD6",
			"#28A8EA",
			"#50D9FF",
			"#0364B8",
			"#1490DF",
			"#0A2767",
			"#FFFFFF",
		],
		icon: "mail",
	},
	{
		id: "access",
		name: "Access",
		software: "Microsoft Access",
		description: "Sắc đỏ mận - vang ấm áp, quản trị cấu trúc dữ liệu bền vững",
		primary: "#C64848",
		shades: ["#E3A5A5", "#C64848", "#8B3030", "#5C1E1E", "#FFFFFF"],
		icon: "dataset",
	},
];

export const ThemePaletteSection = () => {
	const { sourceColor, setSourceColor } = useTheme();

	const activePaletteId = useMemo(() => {
		const current = (sourceColor || "").toUpperCase();
		const match = OFFICE_PALETTES.find(
			(p) => p.primary.toUpperCase() === current,
		);
		return match ? match.id : "custom";
	}, [sourceColor]);

	const handleSelectPalette = (palette: OfficePalette) => {
		try {
			setSourceColor(palette.primary);
			localStorage.setItem("md3-source-color", palette.primary);
			localStorage.setItem("app-office-palette", palette.id);
			notify.success(`Đã áp dụng bảng màu ${palette.name}`);
		} catch (error) {
			console.error("Lỗi khi cập nhật bảng màu:", error);
			notify.error("Không thể cập nhật bảng màu giao diện");
		}
	};

	return (
		<div className="rounded-2xl bg-m3-surface-container p-6 space-y-5">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3.5 min-w-0">
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-m3-primary/10 text-m3-primary">
						<Icon name="palette" size={22} />
					</div>
					<div className="space-y-0.5 min-w-0">
						<Text variant="title-md" className="font-bold text-m3-on-surface">
							Palette Màu Ứng Dụng (Microsoft Office)
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							Tùy biến phong cách màu sắc giao diện theo biểu tượng các phần mềm
							văn phòng quen thuộc. Toàn bộ hệ màu Material Design 3 sẽ tự động
							thích ứng đồng bộ.
						</Text>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
				{OFFICE_PALETTES.map((palette) => {
					const isSelected = activePaletteId === palette.id;

					return (
						<button
							key={palette.id}
							type="button"
							onClick={() => handleSelectPalette(palette)}
							className={`group relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer ${
								isSelected
									? "bg-m3-surface-container-highest"
									: "bg-m3-surface-container-low"
							}`}
						>
							<div className="flex items-start justify-between gap-2 w-full mb-3">
								<div className="flex items-center gap-2.5 min-w-0">
									<div
										className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
										style={{ backgroundColor: palette.primary }}
									>
										<Icon name={palette.icon} size={20} />
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="truncate text-sm font-bold text-m3-on-surface">
												{palette.name}
											</span>
											{isSelected && (
												<span className="shrink-0 rounded-full bg-m3-primary px-2 py-0.5 text-[10px] font-bold text-m3-on-primary">
													Đang dùng
												</span>
											)}
										</div>
										<span className="block truncate text-xs text-m3-on-surface-variant font-mono">
											{palette.primary}
										</span>
									</div>
								</div>

								{isSelected && (
									<div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-m3-primary text-m3-on-primary animate-in zoom-in-50 duration-200">
										<Icon name="check" size={16} />
									</div>
								)}
							</div>

							<p className="text-xs text-m3-on-surface-variant line-clamp-2 mb-3">
								{palette.description}
							</p>

							{/* Color Shades Swatch Strip */}
							<div className="flex h-3.5 w-full overflow-hidden rounded-full">
								{palette.shades.map((shade, idx) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: fixed palette shade sequence
										key={`${palette.id}-shade-${idx}`}
										className="flex-1 h-full transition-transform group-hover:scale-105"
										style={{ backgroundColor: shade }}
										title={shade}
									/>
								))}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default ThemePaletteSection;
