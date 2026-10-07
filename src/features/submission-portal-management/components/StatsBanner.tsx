import { Card, Icon, ShapeIcon, Text } from "@bug-on/m3-expressive";
import type React from "react";
import { memo } from "react";
import { cn } from "../../../utils/utils";

interface StatsBannerProps {
	activeCount: number;
	scopedAssignmentsCount: number;
	totalAlertsCount: number;
	isDetailOpen?: boolean;
}

const StatsBannerComponent: React.FC<StatsBannerProps> = ({
	activeCount,
	scopedAssignmentsCount,
	totalAlertsCount,
	isDetailOpen = false,
}) => {
	return (
		<section
			className={cn(
				"grid gap-4",
				isDetailOpen ? "grid-cols-2" : "sm:grid-cols-3",
			)}
		>
			<Card
				variant="filled"
				className="bg-m3-primary-container text-m3-on-primary-container p-5"
			>
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider opacity-85">
						Link đang mở
					</span>
					<ShapeIcon
						shape="bun"
						size={44}
						className="flex items-center justify-center bg-m3-on-primary-container/10"
					>
						<Icon
							name="link"
							size={28}
							className="text-m3-on-primary-container"
						/>
					</ShapeIcon>
				</div>
				<div className="mt-3 text-3xl font-black" aria-live="polite">
					{activeCount}
				</div>
				<Text variant="body-sm" className="mt-1 opacity-75">
					Cổng nộp bài đang hoạt động
				</Text>
			</Card>

			<Card
				variant="filled"
				className="bg-m3-secondary-container text-m3-on-secondary-container p-5"
			>
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider opacity-85">
						Bài tập đã chia sẻ
					</span>
					<ShapeIcon
						shape="square"
						size={44}
						className="flex items-center justify-center bg-m3-on-secondary-container/10"
					>
						<Icon
							name="assignment"
							size={28}
							className="text-m3-on-secondary-container"
						/>
					</ShapeIcon>
				</div>
				<div className="mt-3 text-3xl font-black" aria-live="polite">
					{scopedAssignmentsCount}
				</div>
				<Text variant="body-sm" className="mt-1 opacity-75">
					Tổng bài tập được gán chấm tự động
				</Text>
			</Card>

			{!isDetailOpen && (
				<Card
					variant="filled"
					className="bg-m3-error-container text-m3-on-error-container p-5"
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider opacity-85">
							Cảnh báo nghi vấn
						</span>
						<ShapeIcon
							shape="arrow"
							size={44}
							className="flex items-center justify-center bg-m3-error"
						>
							<Icon name="warning" size={28} className="text-m3-on-error" />
						</ShapeIcon>
					</div>
					<div className="mt-3 text-3xl font-black" aria-live="polite">
						{totalAlertsCount}
					</div>
					<Text variant="body-sm" className="mt-1 opacity-75">
						Lượt nộp cần giáo viên đối chiếu
					</Text>
				</Card>
			)}
		</section>
	);
};

export const StatsBanner = memo(StatsBannerComponent);
