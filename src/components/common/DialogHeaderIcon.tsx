import { Icon, type IconProps, ShapeMedia } from "@bug-on/m3-expressive";
import type React from "react";
import { cn } from "../../utils/utils";

export interface DialogHeaderIconProps {
	icon: IconProps["name"];
	size?: number;
	iconClassName?: string;
	className?: string;
}

export const DialogHeaderIcon: React.FC<DialogHeaderIconProps> = ({
	icon,
	size = 22,
	iconClassName,
	className,
}) => {
	return (
		<ShapeMedia
			shape="clover8Leaf"
			morphOn="hover"
			morphTo="circle"
			className={cn(
				"flex size-11 shrink-0 items-center justify-center bg-m3-primary text-m3-on-primary",
				className,
			)}
		>
			<Icon name={icon} size={size} className={iconClassName} />
		</ShapeMedia>
	);
};
