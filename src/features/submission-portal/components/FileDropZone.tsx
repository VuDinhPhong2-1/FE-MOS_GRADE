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
		<div className="mt-4 flex flex-col gap-2">
			<Card
				variant="outlined"
				disableElevation
				className={cn(
					"flex border-dashed flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer rounded-m3-md",
					isDragging && "bg-m3-primary-container text-m3-on-primary-container",
				)}
				onClick={handleContainerClick}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				disabled={disabled || isPreviewing}
			>
				<Icon
					name={file ? "check_circle" : "cloud_upload"}
					size={36}
					className={
						isDragging ? "text-m3-primary" : "text-m3-on-surface-variant"
					}
				/>
				<Text variant="title-sm" className="mt-2 font-bold">
					{isPreviewing
						? "Đang chấm thử file..."
						: file
							? file.name
							: "Chọn hoặc kéo thả file bài làm"}
				</Text>
				{file ? (
					<Text variant="body-sm" className="text-m3-on-surface-variant">
						{formatFileSize(file.size)}
					</Text>
				) : (
					<Text variant="body-sm" className="text-m3-on-surface-variant">
						Kéo thả hoặc nhấp để tải lên
					</Text>
				)}

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
			</Card>

			{file && (
				<Card
					variant="filled"
					className="flex flex-row items-center justify-between bg-m3-surface-container-low px-3 py-2 text-m3-on-surface rounded-m3-md"
				>
					<div className="flex items-center gap-2 overflow-hidden">
						<Icon name="description" size={18} className="text-m3-primary" />
						<Text variant="body-sm" className="truncate font-semibold">
							{file.name}
						</Text>
					</div>
					<IconButton
						aria-label="Xóa file"
						colorStyle="standard"
						disabled={disabled || isPreviewing}
						onClick={() => onFileSelect(undefined)}
					>
						<Icon name="close" size={18} className="text-m3-error" />
					</IconButton>
				</Card>
			)}
		</div>
	);
};
