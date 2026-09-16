import { ProgressIndicator } from "@bug-on/m3-expressive";
import type React from "react";

export interface RouteLoadingFallbackProps {
	fullScreen?: boolean;
	message?: string;
	className?: string;
	minHeight?: string;
	size?: number;
}

export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
	fullScreen = false,
	message = "Đang tải trang...",
	className = "",
	minHeight,
	size = 64,
}) => {
	const heightClass = fullScreen
		? "fixed inset-0 z-50 min-h-screen bg-m3-surface text-m3-on-surface"
		: (minHeight ?? "min-h-[50vh]");

	return (
		<div
			className={`flex w-full items-center justify-center p-8 transition-opacity duration-200 ${heightClass} ${className}`.trim()}
		>
			<div className="flex flex-col items-center gap-3">
				<ProgressIndicator
					variant="circular"
					shape="wavy"
					size={size}
					aria-label={message}
				/>
				<p className="text-sm font-medium text-m3-on-surface-variant font-md3-expressive animate-pulse text-center">
					{message}
				</p>
			</div>
		</div>
	);
};

export const PageLoadingState = RouteLoadingFallback;
export default RouteLoadingFallback;
