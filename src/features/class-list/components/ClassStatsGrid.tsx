import {
	Card,
	CardContent,
	Icon,
	type IconProps,
	ShapeMedia,
	type ShapeMediaProps,
	Text,
} from "@bug-on/m3-expressive";
import type React from "react";
import { memo, useMemo } from "react";
import type { Class } from "../../../types/class.types";

interface ClassStatsGridProps {
	classes: Class[];
}

interface StatItemProps {
	label: string;
	value: string | number;
	icon: IconProps["name"];
	iconBgClass?: string;
	iconColorClass?: string;
	textColorClass?: string;
	shape: ShapeMediaProps["shape"];
	morphTo?: ShapeMediaProps["morphTo"];
	morphOn?: ShapeMediaProps["morphOn"];
	morphOptions?: ShapeMediaProps["morphOptions"];
}

const StatCard: React.FC<StatItemProps> = ({
	label,
	value,
	icon,
	iconBgClass = "bg-m3-primary",
	iconColorClass = "text-m3-on-primary",
	textColorClass = "text-m3-on-surface",
	shape,
	morphTo,
	morphOn = "hover",
	morphOptions = {
		duration: 0.4,
		easing: [0.34, 1.56, 0.64, 1],
	},
}) => (
	<Card
		variant="filled"
		className="bg-m3-surface-container-lowest p-5 text-m3-on-surface"
	>
		<CardContent className="p-0">
			<div className="flex items-center justify-between">
				<div>
					<Text
						variant="label-md"
						weight={500}
						className="text-sm tracking-wider text-m3-on-surface-variant"
					>
						{label}
					</Text>
					<Text
						variant="headline-sm"
						weight={700}
						className={`mt-1 tracking-tight ${textColorClass || ""}`}
					>
						{value}
					</Text>
				</div>
				<ShapeMedia
					shape={shape}
					morphTo={morphTo}
					morphOn={morphOn}
					morphOptions={morphOptions}
					className={`flex h-12 w-12 items-center justify-center ${iconBgClass} ${iconColorClass}`}
				>
					<Icon name={icon} size={24} />
				</ShapeMedia>
			</div>
		</CardContent>
	</Card>
);

export const ClassStatsGrid: React.FC<ClassStatsGridProps> = memo(
	({ classes }) => {
		const activeCount = useMemo(
			() => classes.filter((c) => c.isActive).length,
			[classes],
		);
		const totalStudents = useMemo(
			() => classes.reduce((sum, cls) => sum + (cls.currentStudents || 0), 0),
			[classes],
		);

		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label="Tổng số lớp"
					value={classes.length}
					icon="menu_book"
					shape="softBoom"
					morphTo="flower"
				/>
				<StatCard
					label="Đang hoạt động"
					value={activeCount}
					icon="group"
					shape="softBoom"
					morphTo="flower"
				/>
				<StatCard
					label="Tổng học sinh"
					value={totalStudents}
					icon="person"
					shape="softBoom"
					morphTo="flower"
				/>
				<StatCard
					label="Năm học"
					value="2026 - 2027"
					icon="calendar_today"
					shape="softBoom"
					morphTo="flower"
				/>
			</div>
		);
	},
);

ClassStatsGrid.displayName = "ClassStatsGrid";
