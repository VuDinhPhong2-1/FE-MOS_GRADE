import { Icon } from "@bug-on/m3-expressive/core";
import {
	Tab,
	Tabs,
	TabsContent,
	TabsList,
} from "@bug-on/m3-expressive/navigation";
import type { ReactNode } from "react";

export interface PortalTabsProps {
	tab: "submit" | "leaderboard";
	onTabChange: (tab: "submit" | "leaderboard") => void;
	showLeaderboard: boolean;
	submitContent: ReactNode;
	leaderboardContent: ReactNode;
}

export const PortalTabs = ({
	tab,
	onTabChange,
	showLeaderboard,
	submitContent,
	leaderboardContent,
}: PortalTabsProps) => {
	return (
		<Tabs
			value={tab}
			onValueChange={(val) => onTabChange(val as "submit" | "leaderboard")}
		>
			<TabsList
				variant="primary"
				scrollable={false}
				className="w-full"
				backgroundColor="transparent"
			>
				<Tab value="submit">
					<span className="flex items-center gap-2">
						<Icon name="edit_note" size={20} />
						Nộp bài
					</span>
				</Tab>
				{showLeaderboard && (
					<Tab value="leaderboard">
						<span className="flex items-center gap-2">
							<Icon name="emoji_events" size={20} />
							Bảng xếp hạng
						</span>
					</Tab>
				)}
			</TabsList>

			<TabsContent value="submit" className="mt-6 flex flex-col gap-6">
				{submitContent}
			</TabsContent>

			{showLeaderboard && (
				<TabsContent value="leaderboard" className="mt-6">
					{leaderboardContent}
				</TabsContent>
			)}
		</Tabs>
	);
};
