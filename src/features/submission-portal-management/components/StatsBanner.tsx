import { Card, Icon } from "@bug-on/m3-expressive";
import type React from "react";

interface StatsBannerProps {
	activeCount: number;
	scopedAssignmentsCount: number;
	totalAlertsCount: number;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
	activeCount,
	scopedAssignmentsCount,
	totalAlertsCount,
}) => {
	return (
		<section className="grid gap-4 sm:grid-cols-3">
			{/* Active Portals */}
			<Card
				variant="filled"
				className="bg-m3-primary-container text-m3-on-primary-container p-5 transition-transform"
			>
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider opacity-85">
						Link đang mở
					</span>
					<div className="flex h-9 w-9 items-center justify-center rounded-m3-full bg-m3-on-primary-container/10">
						<Icon name="link" size={20} />
					</div>
				</div>
				<div className="mt-3 text-3xl font-black" aria-live="polite">
					{activeCount}
				</div>
				<p className="mt-1 text-xs opacity-75">Cổng nộp bài đang hoạt động</p>
			</Card>

			{/* Scoped Assignments */}
			<Card
				variant="filled"
				className="bg-m3-secondary-container text-m3-on-secondary-container p-5 transition-transform"
			>
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider opacity-85">
						Bài tập đã chia sẻ
					</span>
					<div className="flex h-9 w-9 items-center justify-center rounded-m3-full bg-m3-on-secondary-container/10">
						<Icon name="assignment" size={20} />
					</div>
				</div>
				<div className="mt-3 text-3xl font-black" aria-live="polite">
					{scopedAssignmentsCount}
				</div>
				<p className="mt-1 text-xs opacity-75">
					Tổng bài tập được gán chấm tự động
				</p>
			</Card>

			{/* Alerts */}
			<Card
				variant="filled"
				className="bg-m3-error-container text-m3-on-error-container p-5 transition-transform"
			>
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider opacity-85">
						Cảnh báo nghi vấn
					</span>
					<div className="flex h-9 w-9 items-center justify-center rounded-m3-full bg-m3-on-error-container/10">
						<Icon name="warning" size={20} />
					</div>
				</div>
				<div className="mt-3 text-3xl font-black" aria-live="polite">
					{totalAlertsCount}
				</div>
				<p className="mt-1 text-xs opacity-75">
					Lượt nộp cần giáo viên đối chiếu
				</p>
			</Card>
		</section>
	);
};
