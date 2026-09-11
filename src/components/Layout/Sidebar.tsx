import {
	Icon,
	NavigationRail,
	NavigationRailItem,
	ShapeMedia,
	Text,
} from "@bug-on/m3-expressive";
import { useLocation, useNavigate } from "react-router-dom";

export interface SidebarNavItem {
	id: string;
	label: string;
	icon: string;
	path: string;
	badge?: string | number;
}

interface SidebarProps {
	navItems: SidebarNavItem[];
	onNavigate?: () => void;
}

export const Sidebar = ({ navItems, onNavigate }: SidebarProps) => {
	const navigate = useNavigate();
	const location = useLocation();

	const isPathActive = (path: string) => {
		if (path === "/dashboard") {
			return location.pathname === "/dashboard" || location.pathname === "/";
		}
		if (path.startsWith("/assignments")) {
			return location.pathname.startsWith("/assignments");
		}
		if (path === "/grading") {
			return (
				location.pathname.startsWith("/grading") ||
				location.pathname.startsWith("/scores")
			);
		}
		return location.pathname.startsWith(path);
	};

	return (
		<aside className="relative hidden h-full flex-col bg-m3-surface-container-low text-m3-on-surface lg:flex">
			<NavigationRail
				variant="collapsed"
				header={
					<ShapeMedia
						shape="cookie4Sided"
						morphTo="cookie12Sided"
						morphOn="hover"
						morphOptions={{
							duration: 0.4,
							easing: [0.34, 1.56, 0.64, 1],
						}}
						className="flex size-14 items-center justify-center bg-m3-primary"
					>
						<Text
							variant="title-lg"
							className="font-extrabold text-m3-on-primary"
						>
							M
						</Text>
					</ShapeMedia>
				}
				className="bg-m3-surface-container-low py-4"
			>
				{navItems.map((item) => (
					<NavigationRailItem
						key={item.id}
						icon={<Icon name={item.icon} variant="rounded" animateFill />}
						label={item.label}
						selected={isPathActive(item.path)}
						onClick={() => {
							navigate(item.path);
							onNavigate?.();
						}}
						badge={item.badge}
					/>
				))}
			</NavigationRail>
		</aside>
	);
};

export default Sidebar;
