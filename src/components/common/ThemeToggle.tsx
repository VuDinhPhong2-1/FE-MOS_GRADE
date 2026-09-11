import {
	Icon,
	IconButton,
	type ThemeMode,
	useThemeMode,
} from "@bug-on/m3-expressive";

export function ThemeToggle({ className }: { className?: string }) {
	const { mode, setMode, effectiveMode } = useThemeMode();

	const handleToggle = () => {
		const nextMode: Record<ThemeMode, ThemeMode> = {
			light: "dark",
			dark: "system",
			system: "light",
		};
		setMode(nextMode[mode] || "light");
	};

	const getIconName = () => {
		if (mode === "system") return "brightness_auto";
		return mode === "dark" ? "dark_mode" : "light_mode";
	};

	const getLabel = () => {
		if (mode === "system") {
			return `Chế độ: Hệ thống (${effectiveMode === "dark" ? "Tối" : "Sáng"}) - Bấm để chuyển sang Sáng`;
		}
		if (mode === "dark") {
			return "Chế độ: Tối - Bấm để chuyển sang Hệ thống";
		}
		return "Chế độ: Sáng - Bấm để chuyển sang Tối";
	};

	return (
		<IconButton
			onClick={handleToggle}
			aria-label={getLabel()}
			title={getLabel()}
			size="md"
			className={className}
		>
			<Icon name={getIconName()} size={24} variant="rounded" />
		</IconButton>
	);
}

export default ThemeToggle;
