import { Icon } from "@bug-on/m3-expressive/core";
import {
	type AppBarColors,
	SmallAppBar,
} from "@bug-on/m3-expressive/navigation";

export interface PortalHeaderProps {
	title: string;
	description?: string;
	classesCount: number;
	assignmentsCount: number;
	maxSubmissionsPerStudent?: number | null;
}

export const PortalHeader = ({
	title,
	description,
	classesCount,
	assignmentsCount,
	maxSubmissionsPerStudent,
}: PortalHeaderProps) => {
	const primaryColors: AppBarColors = {
		containerColor: "var(--md-sys-color-primary)",
		scrolledContainerColor: "var(--md-sys-color-primary)",
		titleColor: "var(--md-sys-color-on-primary)",
		subtitleColor: "var(--md-sys-color-on-primary)",
	};

	const actions = (
		<div className="flex items-center gap-1.5 sm:gap-2">
			<div
				title={`${classesCount} Lớp`}
				className="flex items-center gap-1.5 rounded-full bg-m3-on-primary/15 px-2.5 py-1 text-xs font-semibold text-m3-on-primary transition-colors hover:bg-m3-on-primary/20 sm:px-3 sm:py-1.5"
			>
				<Icon name="groups" size={16} className="opacity-80" />
				<span>{classesCount}</span>
				<span className="hidden opacity-80 sm:inline">Lớp</span>
			</div>

			<div
				title={`${assignmentsCount} Bài tập`}
				className="flex items-center gap-1.5 rounded-full bg-m3-on-primary/15 px-2.5 py-1 text-xs font-semibold text-m3-on-primary transition-colors hover:bg-m3-on-primary/20 sm:px-3 sm:py-1.5"
			>
				<Icon name="assignment" size={16} className="opacity-80" />
				<span>{assignmentsCount}</span>
				<span className="hidden opacity-80 sm:inline">Bài tập</span>
			</div>

			<div
				title={`Lần nộp: ${maxSubmissionsPerStudent || "Không giới hạn"}`}
				className="flex items-center gap-1.5 rounded-full bg-m3-on-primary/15 px-2.5 py-1 text-xs font-semibold text-m3-on-primary transition-colors hover:bg-m3-on-primary/20 sm:px-3 sm:py-1.5"
			>
				<Icon name="repeat" size={16} className="opacity-80" />
				<span>{maxSubmissionsPerStudent || "∞"}</span>
				<span className="hidden opacity-80 sm:inline">Lần nộp</span>
			</div>
		</div>
	);

	const navigationIcon = (
		<div
			title="MOS Submission"
			className="flex h-10 w-10 items-center justify-center rounded-full bg-m3-on-primary/15 text-m3-on-primary"
		>
			<Icon name="school" size={20} />
		</div>
	);

	return (
		<>
			<SmallAppBar
				title={title}
				subtitle={description || "MOS Submission"}
				navigationIcon={navigationIcon}
				actions={actions}
				colors={primaryColors}
				scrollBehavior="pinned"
			/>
			<div className="h-16" aria-hidden="true" />
		</>
	);
};
