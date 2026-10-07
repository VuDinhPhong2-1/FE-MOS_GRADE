import { Chip, Icon, IconButton, ScrollArea } from "@bug-on/m3-expressive";
import { SmallAppBar } from "@bug-on/m3-expressive/navigation";
import type React from "react";
import { memo, useRef } from "react";
import type {
	SubmissionAlert,
	SubmissionLog,
	SubmissionPortal,
} from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";
import { VirtualDetailList } from "./VirtualDetailList";

interface PortalDetailsSectionProps {
	selectedPortal: SubmissionPortal;
	alerts: SubmissionAlert[];
	logs: SubmissionLog[];
	loadingDetails: boolean;
	onClose: () => void;
	onExportLogsCsv: () => void;
}

const PortalDetailsSectionComponent: React.FC<PortalDetailsSectionProps> = ({
	selectedPortal,
	alerts,
	logs,
	loadingDetails,
	onClose,
	onExportLogsCsv,
}) => {
	const scrollViewportRef = useRef<HTMLDivElement>(null);

	return (
		<div className="flex flex-col h-full bg-m3-surface-container-low text-m3-on-surface min-w-0 overflow-hidden relative">
			<SmallAppBar
				navigationIcon={
					<IconButton
						colorStyle="tonal"
						aria-label="Đóng chi tiết"
						onClick={onClose}
						size="sm"
					>
						<Icon name="close" size={20} />
					</IconButton>
				}
				enableFadingBlur
				blurIntensity={4}
				fadingBlurColor="var(--md-sys-color-surface-container-low)"
				scrollElement={scrollViewportRef}
				title={
					<div className="flex items-center ml-1 gap-2 min-w-0">
						<span className="truncate text-base font-bold text-m3-on-surface">
							{selectedPortal.title}
						</span>
						<Chip
							variant="suggestion"
							label={selectedPortal.isActive ? "Đang mở" : "Đã đóng"}
							className={cn(
								"pointer-events-none h-6 text-[11px] px-2 shrink-0",
								selectedPortal.isActive
									? "bg-m3-primary/10 text-m3-primary border-none"
									: "bg-m3-surface-variant text-m3-on-surface-variant border-none",
							)}
						/>
					</div>
				}
				className="shrink-0 top-0 z-10 w-full pl-1 absolute"
			/>

			{/* Scrollable Content Body - Fix Radix display: table horizontal expansion */}
			<ScrollArea
				viewportRef={scrollViewportRef}
				type="hover"
				orientation="vertical"
				className="flex-1 min-h-0 w-full overflow-hidden"
				viewportClassName="p-5 pt-16 [&>div]:!block [&>div]:!w-full [&>div]:!min-w-0 [&>div]:!max-w-full"
			>
				<VirtualDetailList
					alerts={alerts}
					logs={logs}
					loadingDetails={loadingDetails}
					onExportLogsCsv={onExportLogsCsv}
					scrollViewportRef={scrollViewportRef}
				/>
			</ScrollArea>
		</div>
	);
};

export const PortalDetailsSection = memo(PortalDetailsSectionComponent);
