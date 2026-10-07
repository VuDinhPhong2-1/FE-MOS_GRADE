import { Text } from "@bug-on/m3-expressive";
import { type ChangeEvent, useState } from "react";

export interface JsonConfigEditorProps {
	initialConfig: unknown;
	configKey: string;
	onUpdate: (configKey: string, config: unknown) => void;
}

export const JsonConfigEditor = ({
	initialConfig,
	configKey,
	onUpdate,
}: JsonConfigEditorProps) => {
	const [draft, setDraft] = useState(() =>
		JSON.stringify(initialConfig ?? {}, null, 2),
	);
	const [hasError, setHasError] = useState(false);

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const nextDraft = event.target.value;
		setDraft(nextDraft);

		try {
			const config = JSON.parse(nextDraft) as unknown;
			setHasError(false);
			onUpdate(configKey, config);
		} catch {
			setHasError(true);
		}
	};

	const handleBlur = () => {
		try {
			const config = JSON.parse(draft) as unknown;
			setDraft(JSON.stringify(config, null, 2));
			setHasError(false);
		} catch {
			setHasError(true);
		}
	};

	return (
		<div className="space-y-1">
			<textarea
				value={draft}
				onChange={handleChange}
				onBlur={handleBlur}
				rows={8}
				aria-label={`JSON Editor cho ${configKey}`}
				className={`w-full rounded-2xl bg-m3-surface-container-high px-4 py-3 font-mono text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest ${
					hasError ? "bg-m3-error-container text-m3-on-error-container" : ""
				}`}
			/>
			{hasError && (
				<Text
					variant="label-sm"
					className="text-[11px] font-medium text-m3-error"
				>
					JSON không hợp lệ. Vui lòng kiểm tra dấu ngoặc kép và dấu phẩy.
				</Text>
			)}
		</div>
	);
};
