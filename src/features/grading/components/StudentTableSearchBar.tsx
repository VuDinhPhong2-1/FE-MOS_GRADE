import { Button, Icon, IconButton, TextField } from "@bug-on/m3-expressive";
import type React from "react";

interface StudentTableSearchBarProps {
	query: string;
	hint: string;
	matchedCount: number;
	matchIndex: number;
	onQueryChange: (query: string) => void;
	onSubmit: () => void;
	onNavigate: (direction: -1 | 1) => void;
	onReset: () => void;
}

export const StudentTableSearchBar: React.FC<StudentTableSearchBarProps> = ({
	query,
	hint,
	matchedCount,
	matchIndex,
	onQueryChange,
	onSubmit,
	onNavigate,
	onReset,
}) => {
	return (
		<div className="sticky top-0 z-30 mb-3 rounded-2xl border border-m3-outline-variant/30 bg-m3-surface/95 p-3 shadow-md backdrop-blur">
			<div className="flex flex-col gap-2 lg:flex-row lg:items-center">
				<div className="min-w-0 flex-1">
					<TextField
						variant="outlined"
						placeholder="Tim ten hoc sinh..."
						value={query}
						onChange={onQueryChange}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								onSubmit();
							}
							if (event.key === "Escape") {
								event.preventDefault();
								onReset();
							}
						}}
						leadingIcon={<Icon name="search" />}
						fullWidth
					/>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						type="button"
						colorStyle="filled"
						onClick={onSubmit}
						className="h-10 text-xs"
					>
						<Icon name="travel_explore" className="mr-1 text-base" />
						Tim
					</Button>
					<IconButton
						type="button"
						size="sm"
						colorStyle="outlined"
						onClick={() => onNavigate(-1)}
						disabled={matchedCount === 0}
						aria-label="Ket qua truoc"
						title="Ket qua truoc"
					>
						<Icon name="keyboard_arrow_up" />
					</IconButton>
					<IconButton
						type="button"
						size="sm"
						colorStyle="outlined"
						onClick={() => onNavigate(1)}
						disabled={matchedCount === 0}
						aria-label="Ket qua tiep theo"
						title="Ket qua tiep theo"
					>
						<Icon name="keyboard_arrow_down" />
					</IconButton>
					{matchedCount > 0 && (
						<span className="min-w-14 rounded-full bg-m3-primary-container px-2 py-1 text-center text-xs font-semibold text-m3-on-primary-container">
							{matchIndex + 1}/{matchedCount}
						</span>
					)}
					{query && (
						<IconButton
							type="button"
							size="sm"
							colorStyle="standard"
							onClick={onReset}
							aria-label="Xoa tim kiem"
							title="Xoa tim kiem"
						>
							<Icon name="close" />
						</IconButton>
					)}
				</div>
			</div>
			{hint && (
				<p className="mt-2 text-xs font-medium text-m3-on-surface-variant">
					{hint}
				</p>
			)}
		</div>
	);
};
