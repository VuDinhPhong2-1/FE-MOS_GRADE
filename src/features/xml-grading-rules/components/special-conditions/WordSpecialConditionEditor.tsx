import { Text } from "@bug-on/m3-expressive";
import type React from "react";
import { useEffect, useState } from "react";
import type { SpecialCondition } from "../../../../types/xml-grading-rules.types";
import { notify } from "../../../../utils/notify";
import {
	parseMarginInputToTwips,
	twipsPerInch,
} from "../../utils/xml-rule-helpers";
import { wordBulletCharacterOptions } from "../../utils/xml-rule-presets";

export interface WordSpecialConditionEditorProps {
	specialCondition: SpecialCondition;
	onChange: (specialCondition: SpecialCondition) => void;
}

const inputClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest";
const selectClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest cursor-pointer";
const textareaClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest min-h-[96px] resize-y";

const formatTwipsAsInches = (twips?: number) => {
	if (twips === undefined || twips === null) return "";
	const inches = twips / twipsPerInch;
	const value = Number.isInteger(inches)
		? `${inches}`
		: `${Number(inches.toFixed(3))}`;
	return `${value} in`;
};

interface MarginUnitInputProps {
	label: string;
	value?: number;
	placeholder: string;
	onCommit: (value?: number) => void;
}

const MarginUnitInput = ({
	label,
	value,
	placeholder,
	onCommit,
}: MarginUnitInputProps) => {
	const [draft, setDraft] = useState(formatTwipsAsInches(value));

	useEffect(() => {
		setDraft(formatTwipsAsInches(value));
	}, [value]);

	const commit = () => {
		if (!draft.trim()) {
			onCommit(undefined);
			return;
		}

		const twips = parseMarginInputToTwips(draft);
		if (twips === undefined) {
			notify.error(
				"Giá trị lề không hợp lệ. Hãy nhập ví dụ: 1 in, 1.5 in, 2.54 cm.",
			);
			return;
		}

		onCommit(twips);
		setDraft(formatTwipsAsInches(twips));
	};

	return (
		<label className="text-xs font-semibold text-m3-on-surface-variant">
			{label}
			<input
				type="text"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.currentTarget.blur();
					}
				}}
				placeholder={placeholder}
				className={inputClass}
			/>
		</label>
	);
};

const parsePageBorderWidthInput = (value: string) => {
	const raw = value
		.trim()
		.replace(",", ".")
		.replace(/½/g, " 1/2")
		.replace(/¼/g, " 1/4")
		.replace(/¾/g, " 3/4")
		.replace(/\b(wide|rộng|rong)\b/gi, "")
		.replace(/\s+/g, " ")
		.toLowerCase()
		.trim();
	if (!raw) return undefined;

	const xmlMatch = raw.match(/^(\d+)\s*(xml|sz|eighth|eighths)?$/);
	if (xmlMatch?.[2]) {
		const width = Number(xmlMatch[1]);
		return Number.isFinite(width) && width > 0 ? width : undefined;
	}

	const fractionMatch = raw.match(
		/^(?:(\d+)\s*)?(\d+)\s*\/\s*(\d+)\s*(pt|point|points)?$/,
	);
	if (fractionMatch) {
		const whole = Number(fractionMatch[1] ?? 0);
		const numerator = Number(fractionMatch[2]);
		const denominator = Number(fractionMatch[3]);
		if (
			!Number.isFinite(whole) ||
			!Number.isFinite(numerator) ||
			!Number.isFinite(denominator) ||
			denominator <= 0
		) {
			return undefined;
		}

		return Math.round((whole + numerator / denominator) * 8);
	}

	const pointMatch = raw.match(/^(\d+(?:\.\d*)?|\.\d+)\s*(pt|point|points)?$/);
	if (!pointMatch) return undefined;

	const points = Number(pointMatch[1]);
	if (!Number.isFinite(points) || points <= 0) return undefined;

	return Math.round(points * 8);
};

const formatPageBorderWidth = (value?: number) => {
	if (!value) return "";
	const points = value / 8;
	return `${Number(points.toFixed(3))} pt`;
};

interface PageBorderWidthInputProps {
	value?: number;
	onCommit: (value?: number) => void;
}

const PageBorderWidthInput = ({
	value,
	onCommit,
}: PageBorderWidthInputProps) => {
	const [draft, setDraft] = useState(formatPageBorderWidth(value));

	useEffect(() => {
		setDraft(formatPageBorderWidth(value));
	}, [value]);

	const commit = () => {
		if (!draft.trim()) {
			onCommit(undefined);
			return;
		}

		const width = parsePageBorderWidthInput(draft);
		if (width === undefined) {
			notify.error(
				"Độ dày viền không hợp lệ. Hãy nhập ví dụ: 1.5 pt, 1 1/2 pt, 12 xml.",
			);
			return;
		}

		onCommit(width);
		setDraft(formatPageBorderWidth(width));
	};

	return (
		<label className="text-xs font-semibold text-m3-on-surface-variant">
			Độ dày viền
			<input
				type="text"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={commit}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.currentTarget.blur();
					}
				}}
				placeholder="1.5 pt hoặc 1 1/2 pt"
				className={inputClass}
			/>
		</label>
	);
};

export const WordSpecialConditionEditor: React.FC<
	WordSpecialConditionEditorProps
> = ({ specialCondition, onChange }) => {
	const updateConfig = (configKey: keyof SpecialCondition, patch: object) => {
		const currentConfig =
			(specialCondition[configKey] as Record<string, unknown> | undefined) ??
			{};
		onChange({
			...specialCondition,
			[configKey]: {
				...currentConfig,
				...patch,
			},
		});
	};

	if (specialCondition.type === "convertTableToText") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tệp nguồn
					<input
						value={
							specialCondition.convertTableToTextConfig?.sourceFile ??
							"word/document.xml"
						}
						onChange={(e) =>
							updateConfig("convertTableToTextConfig", {
								sourceFile: e.target.value,
							})
						}
						placeholder="word/document.xml"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Văn bản neo
					<input
						value={specialCondition.convertTableToTextConfig?.anchorText ?? ""}
						onChange={(e) =>
							updateConfig("convertTableToTextConfig", {
								anchorText: e.target.value,
							})
						}
						placeholder="Nhập đoạn văn bản neo..."
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "hyperlink") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Văn bản hiển thị
					<input
						value={specialCondition.hyperlinkConfig?.displayText ?? ""}
						onChange={(e) =>
							updateConfig("hyperlinkConfig", { displayText: e.target.value })
						}
						placeholder="www.example.com"
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Địa chỉ URL
					<input
						value={specialCondition.hyperlinkConfig?.url ?? ""}
						onChange={(e) =>
							updateConfig("hyperlinkConfig", { url: e.target.value })
						}
						placeholder="https://example.com"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "sectionBreakBeforeText") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Văn bản mục tiêu
					<input
						value={
							specialCondition.sectionBreakBeforeTextConfig?.targetText ?? ""
						}
						onChange={(e) =>
							updateConfig("sectionBreakBeforeTextConfig", {
								targetText: e.target.value,
							})
						}
						placeholder="Nhập tiêu đề hoặc đoạn văn..."
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Loại ngắt trang / ngắt phần
					<select
						value={
							specialCondition.sectionBreakBeforeTextConfig?.breakType ??
							"nextPage"
						}
						onChange={(e) =>
							updateConfig("sectionBreakBeforeTextConfig", {
								breakType: e.target.value,
							})
						}
						className={selectClass}
					>
						<option value="nextPage">Next Page</option>
						<option value="continuous">Continuous</option>
						<option value="evenPage">Even Page</option>
						<option value="oddPage">Odd Page</option>
					</select>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "wordColumns") {
		return (
			<div className="mt-4 rounded-2xl bg-m3-surface-container p-4">
				<Text
					variant="body-sm"
					className="mb-3 text-xs text-m3-on-surface-variant"
				>
					Tính cả đoạn đầu và đoạn cuối. Mọi section trong phạm vi phải đúng số
					cột và không lấn sang đoạn trước/sau.
				</Text>
				<div className="grid gap-3 md:grid-cols-2">
					<label className="text-xs font-semibold text-m3-on-surface-variant">
						Văn bản đoạn bắt đầu
						<input
							value={specialCondition.wordColumnsConfig?.startText ?? ""}
							onChange={(e) =>
								updateConfig("wordColumnsConfig", { startText: e.target.value })
							}
							placeholder="Bắt đầu..."
							className={inputClass}
						/>
					</label>
					<label className="text-xs font-semibold text-m3-on-surface-variant">
						Văn bản đoạn kết thúc
						<input
							value={specialCondition.wordColumnsConfig?.endText ?? ""}
							onChange={(e) =>
								updateConfig("wordColumnsConfig", { endText: e.target.value })
							}
							placeholder="Kết thúc..."
							className={inputClass}
						/>
					</label>
					<label className="text-xs font-semibold text-m3-on-surface-variant">
						Số cột
						<input
							type="number"
							min={1}
							value={
								specialCondition.wordColumnsConfig?.expectedColumnCount ?? 2
							}
							onChange={(e) =>
								updateConfig("wordColumnsConfig", {
									expectedColumnCount: Number(e.target.value),
								})
							}
							className={inputClass}
						/>
					</label>
				</div>
			</div>
		);
	}

	if (specialCondition.type === "wordMoveText") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Nội dung đoạn cần di chuyển
					<textarea
						rows={2}
						value={specialCondition.wordMoveTextConfig?.expectedText ?? ""}
						onChange={(e) =>
							updateConfig("wordMoveTextConfig", {
								expectedText: e.target.value,
							})
						}
						placeholder="Đoạn văn bản cần cut/paste..."
						className={textareaClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Đích: nằm ngay sau đoạn
					<input
						value={specialCondition.wordMoveTextConfig?.afterText ?? ""}
						onChange={(e) =>
							updateConfig("wordMoveTextConfig", { afterText: e.target.value })
						}
						placeholder="Đoạn văn phía trước vị trí mới..."
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Đích: nằm ngay trước đoạn
					<input
						value={specialCondition.wordMoveTextConfig?.beforeText ?? ""}
						onChange={(e) =>
							updateConfig("wordMoveTextConfig", { beforeText: e.target.value })
						}
						placeholder="Đoạn văn phía sau vị trí mới..."
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "wordMoveSmartArt") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant md:col-span-2">
					Văn bản một node trong SmartArt cần di chuyển
					<input
						value={specialCondition.wordMoveSmartArtConfig?.nodeText ?? ""}
						onChange={(e) =>
							updateConfig("wordMoveSmartArtConfig", {
								nodeText: e.target.value,
							})
						}
						placeholder="Nhập chính xác text của 1 node..."
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Đích: nằm ngay sau đoạn
					<input
						value={specialCondition.wordMoveSmartArtConfig?.afterText ?? ""}
						onChange={(e) =>
							updateConfig("wordMoveSmartArtConfig", {
								afterText: e.target.value,
							})
						}
						placeholder="Đoạn văn phía trước vị trí mới..."
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Đích: nằm ngay trước đoạn
					<input
						value={specialCondition.wordMoveSmartArtConfig?.beforeText ?? ""}
						onChange={(e) =>
							updateConfig("wordMoveSmartArtConfig", {
								beforeText: e.target.value,
							})
						}
						placeholder="Đoạn văn phía sau vị trí mới..."
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "pageMargins") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 sm:grid-cols-2 md:grid-cols-4">
				<MarginUnitInput
					label="Lề trên (Top)"
					value={specialCondition.pageMarginsConfig?.top}
					placeholder="1 in hoặc 2.54 cm"
					onCommit={(top) => updateConfig("pageMarginsConfig", { top })}
				/>
				<MarginUnitInput
					label="Lề dưới (Bottom)"
					value={specialCondition.pageMarginsConfig?.bottom}
					placeholder="1 in hoặc 2.54 cm"
					onCommit={(bottom) => updateConfig("pageMarginsConfig", { bottom })}
				/>
				<MarginUnitInput
					label="Lề trái (Left)"
					value={specialCondition.pageMarginsConfig?.left}
					placeholder="1 in hoặc 2.54 cm"
					onCommit={(left) => updateConfig("pageMarginsConfig", { left })}
				/>
				<MarginUnitInput
					label="Lề phải (Right)"
					value={specialCondition.pageMarginsConfig?.right}
					placeholder="1 in hoặc 2.54 cm"
					onCommit={(right) => updateConfig("pageMarginsConfig", { right })}
				/>
			</div>
		);
	}

	if (specialCondition.type === "documentStyleSet") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Tên bộ kiểu (Style Set)
					<input
						value={specialCondition.documentStyleSetConfig?.styleSetName ?? ""}
						onChange={(e) =>
							updateConfig("documentStyleSetConfig", {
								styleSetName: e.target.value,
							})
						}
						placeholder="Casual, Centered, Lines..."
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "pageBorder") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-3">
				<PageBorderWidthInput
					value={specialCondition.pageBorderConfig?.requiredWidth}
					onCommit={(width) =>
						updateConfig("pageBorderConfig", { requiredWidth: width })
					}
				/>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Kiểu viền (Border Style)
					<input
						value={specialCondition.pageBorderConfig?.requiredStyle ?? "single"}
						onChange={(e) =>
							updateConfig("pageBorderConfig", {
								requiredStyle: e.target.value,
							})
						}
						placeholder="single, double, triple..."
						className={inputClass}
					/>
				</label>
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Mã màu viền (HEX)
					<input
						value={specialCondition.pageBorderConfig?.requiredColor ?? ""}
						onChange={(e) =>
							updateConfig("pageBorderConfig", {
								requiredColor: e.target.value,
							})
						}
						placeholder="00B0F0 hoặc 000000"
						className={inputClass}
					/>
				</label>
			</div>
		);
	}

	if (specialCondition.type === "wordBulletStyle") {
		return (
			<div className="mt-4 grid gap-3 rounded-2xl bg-m3-surface-container p-4 md:grid-cols-2">
				<label className="text-xs font-semibold text-m3-on-surface-variant">
					Ký tự Bullet mong đợi
					<select
						value={
							specialCondition.wordBulletStyleConfig?.expectedBulletChar ?? "■"
						}
						onChange={(e) =>
							updateConfig("wordBulletStyleConfig", {
								expectedBulletChar: e.target.value,
							})
						}
						className={selectClass}
					>
						{wordBulletCharacterOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</label>
			</div>
		);
	}

	return null;
};
