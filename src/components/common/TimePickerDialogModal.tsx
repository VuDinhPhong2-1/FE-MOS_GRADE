import {
	Button,
	Icon,
	TimeInput,
	TimePicker,
	TimePickerDialog,
	useTimePickerState,
} from "@bug-on/m3-expressive";
import { useMemo, useState } from "react";

interface TimePickerDialogModalProps {
	open: boolean;
	onDismiss: () => void;
	onConfirm: (timeString: string) => void;
	/** Thời gian khởi tạo dạng "HH:mm" (ví dụ: "07:00", "13:30") */
	value?: string;
	/** Tên định danh trường (ví dụ: "giờ bắt đầu", "giờ kết thúc") */
	label?: string;
	title?: string;
}

const parseTimeString = (
	timeStr?: string,
): { hour: number; minute: number } => {
	if (!timeStr) return { hour: 7, minute: 0 };
	const parts = timeStr.trim().split(":");
	if (parts.length >= 2) {
		const h = Number.parseInt(parts[0], 10);
		const m = Number.parseInt(parts[1], 10);
		return {
			hour: Number.isFinite(h) && h >= 0 && h < 24 ? h : 7,
			minute: Number.isFinite(m) && m >= 0 && m < 60 ? m : 0,
		};
	}
	return { hour: 7, minute: 0 };
};

function TimePickerDialogContent({
	open,
	onDismiss,
	onConfirm,
	value,
	label,
	title,
}: TimePickerDialogModalProps) {
	// Mặc định là 'input' (Enter time) theo yêu cầu người dùng
	const [mode, setMode] = useState<"dial" | "input">("input");

	const { initialHour, initialMinute } = useMemo(() => {
		const parsed = parseTimeString(value);
		return { initialHour: parsed.hour, initialMinute: parsed.minute };
	}, [value]);

	// Luôn ở định dạng 24h
	const state = useTimePickerState({
		initialHour,
		initialMinute,
		is24hour: true,
	});

	const handleConfirm = () => {
		const formattedHour = String(state.hour).padStart(2, "0");
		const formattedMinute = String(state.minute).padStart(2, "0");
		onConfirm(`${formattedHour}:${formattedMinute}`);
		onDismiss();
	};

	const dialogTitle =
		title ||
		(label
			? mode === "dial"
				? `Chọn ${label}`
				: `Nhập ${label}`
			: mode === "dial"
				? "Chọn thời gian"
				: "Nhập thời gian");

	return (
		<TimePickerDialog
			open={open}
			onDismiss={onDismiss}
			title={dialogTitle}
			modeToggleButton={
				<button
					type="button"
					onClick={() => setMode((m) => (m === "dial" ? "input" : "dial"))}
					className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-m3-on-surface/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
					aria-label={
						mode === "dial"
							? "Chuyển sang nhập bàn phím"
							: "Chuyển sang chọn đồng hồ"
					}
					title={
						mode === "dial"
							? "Chuyển sang nhập bàn phím"
							: "Chuyển sang chọn đồng hồ"
					}
				>
					<Icon
						name={mode === "dial" ? "keyboard" : "schedule"}
						className="text-xl text-m3-on-surface-variant"
					/>
				</button>
			}
			confirmButton={
				<Button
					type="button"
					colorStyle="filled"
					size="sm"
					onClick={handleConfirm}
				>
					Xác nhận
				</Button>
			}
			dismissButton={
				<Button type="button" colorStyle="text" size="sm" onClick={onDismiss}>
					Hủy
				</Button>
			}
		>
			{mode === "dial" ? (
				<TimePicker state={state} />
			) : (
				<TimeInput state={state} />
			)}
		</TimePickerDialog>
	);
}

export const TimePickerDialogModal = (props: TimePickerDialogModalProps) => {
	if (!props.open) return null;
	// Sử dụng key dựa trên props.value để reset state khi mở modal với giá trị mới
	return <TimePickerDialogContent key={props.value || "default"} {...props} />;
};
