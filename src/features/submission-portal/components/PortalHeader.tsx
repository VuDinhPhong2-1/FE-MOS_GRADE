import { Icon } from "@bug-on/m3-expressive/core";
import { Card, Text } from "@bug-on/m3-expressive/layout";

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
	return (
		<header className="bg-m3-primary px-4 py-8 text-m3-on-primary sm:px-6 lg:px-10">
			<div className="mx-auto max-w-7xl">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-m3-on-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-m3-on-primary">
							<Icon name="school" size={16} />
							MOS Submission Portal
						</span>
						<Text
							as="h1"
							variant="headline-lg"
							className="mt-3 font-black text-m3-on-primary sm:text-4xl"
						>
							{title}
						</Text>
						{description && (
							<Text
								variant="body-lg"
								className="mt-3 max-w-3xl text-m3-on-primary/90"
							>
								{description}
							</Text>
						)}
					</div>

					<div className="grid grid-cols-3 gap-3">
						<Card
							variant="filled"
							className="flex flex-col items-center justify-center p-4 text-center "
						>
							<Text variant="title-lg" className="font-black">
								{classesCount}
							</Text>
							<Text variant="label-md">Lớp</Text>
						</Card>

						<Card
							variant="filled"
							className="flex flex-col items-center justify-center p-4 text-center "
						>
							<Text variant="title-lg" className="font-black">
								{assignmentsCount}
							</Text>
							<Text variant="label-md">Bài tập</Text>
						</Card>

						<Card
							variant="filled"
							className="flex flex-col items-center justify-center p-4 text-center "
						>
							<Text variant="title-lg" className="font-black">
								{maxSubmissionsPerStudent || "∞"}
							</Text>
							<Text variant="label-md">Lần nộp</Text>
						</Card>
					</div>
				</div>
			</div>
		</header>
	);
};
