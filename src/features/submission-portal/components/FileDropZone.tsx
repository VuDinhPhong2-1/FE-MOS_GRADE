import { IconButton } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import { type DragEvent, useRef } from "react";
import { cn } from "../../../utils/utils";
import { formatFileSize } from "../utils/formatters";

export interface FileDropZoneProps {
	file?: File;
	disabled?: boolean;
	isPreviewing?: boolean;
	isDragging?: boolean;
	onFileSelect: (file?: File) => void;
	onDragChange: (isDragging: boolean) => void;
}

export const FileDropZone = ({
	file,
	disabled = false,
	isPreviewing = false,
	isDragging = false,
	onFileSelect,
	onDragChange,
}: FileDropZoneProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		if (!disabled && !isPreviewing) {
			onDragChange(true);
		}
	};

	const handleDragLeave = () => {
		onDragChange(false);
	};

	const handleDrop = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		onDragChange(false);
		if (disabled || isPreviewing) return;
		const droppedFile = e.dataTransfer.files?.[0];
		if (droppedFile) {
			onFileSelect(droppedFile);
		}
	};

	const handleContainerClick = () => {
		if (!disabled && !isPreviewing) {
			inputRef.current?.click();
		}
	};

	return (
		<div className="mt-3 flex flex-col gap-2">
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				disabled={disabled || isPreviewing}
				onChange={(e) => {
					const selected = e.target.files?.[0];
					if (selected) {
						onFileSelect(selected);
					}
				}}
			/>

			{file ? (
				<Card
					variant="filled"
					className="flex flex-row items-center justify-between gap-2.5 bg-m3-primary-container/40 border border-m3-primary/30 px-3.5 py-2.5 text-m3-on-surface rounded-xl"
				>
					<div className="flex items-center gap-2.5 min-w-0">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-m3-primary/10 text-m3-primary">
							<Icon name="description" size={18} />
						</div>
						<div className="min-w-0">
							<Text
								variant="label-md"
								className="truncate font-bold text-m3-on-surface"
							>
								{file.name}
							</Text>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant text-[11px]"
							>
								{formatFileSize(file.size)}
							</Text>
						</div>
					</div>
					<IconButton
						aria-label="Đổi file khác"
						colorStyle="standard"
						disabled={disabled || isPreviewing}
						onClick={(e) => {
							e.stopPropagation();
							onFileSelect(undefined);
						}}
						className="shrink-0 text-m3-error hover:bg-m3-error-container/40"
					>
						<Icon name="close" size={18} />
					</IconButton>
				</Card>
			) : (
				<div
					className={cn(
						"flex flex-col items-center justify-center p-4 text-center border-2 border-dashed rounded-xl cursor-pointer transition-all",
						isDragging
							? "border-m3-primary bg-m3-primary-container/30 text-m3-primary scale-[1.01]"
							: "border-m3-outline-variant/60 hover:border-m3-primary/60 hover:bg-m3-surface-container-high/40 text-m3-on-surface-variant",
						(disabled || isPreviewing) &&
							"opacity-60 pointer-events-none cursor-not-allowed",
					)}
					onClick={handleContainerClick}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-m3-surface-container text-m3-primary">
						<Icon name="cloud_upload" size={20} />
					</div>
					<Text
						variant="label-md"
						className="mt-2 font-bold text-m3-on-surface"
					>
						{isPreviewing
							? "Đang chấm thử file..."
							: "Chọn file hoặc kéo thả vào đây"}
					</Text>
					<Text
						variant="body-sm"
						className="text-[11px] text-m3-on-surface-variant/80 mt-0.5"
					>
						Hỗ trợ file bài tập Office (.docx, .xlsx, .pptx)
					</Text>
				</div>
			)}
		</div>
	);
};
