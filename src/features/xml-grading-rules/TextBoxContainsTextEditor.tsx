import type { TextBoxContainsTextConfig } from "../../types/xml-grading-rules.types";

interface TextBoxContainsTextEditorProps {
	config?: TextBoxContainsTextConfig;
	inputClass: string;
	onChange: (config: TextBoxContainsTextConfig) => void;
}

const TextBoxContainsTextEditor = ({
	config,
	inputClass,
	onChange,
}: TextBoxContainsTextEditorProps) => {
	const current: TextBoxContainsTextConfig = {
		sourceFile: "word/document.xml",
		expectedText: "",
		matchMode: "exact",
		caseSensitive: false,
		targetOccurrence: 1,
		requireDefaultPaste: true,
		requireRemovedFromBody: true,
		forbiddenTextColors: ["FFFFFF", "background1", "bg1", "lt1"],
		forbiddenRunProperties: [],
		...config,
	};

	const update = (patch: Partial<TextBoxContainsTextConfig>) => {
		onChange({
			...current,
			...patch,
		});
	};

	return (
		<div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
			<div className="mb-3">
				<p className="text-xs font-semibold text-slate-700">
					Hộp văn bản chứa đúng nội dung (Cut/Paste vào Text Box)
				</p>
				<p className="mt-0.5 text-xs text-slate-500">
					Kiểm tra đoạn văn đã được chuyển vào hộp văn bản (Text Box), nội dung đầy đủ và đã được Cut khỏi thân bài. Mặc định hệ thống chấm linh hoạt, chấp nhận cả 2 cách: bôi đen kèm dấu ¶ (xóa cả đoạn) hoặc không kèm dấu ¶ (để lại dòng trống) theo chuẩn thi MOS.
				</p>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					File nguồn
					<input
						value={current.sourceFile ?? "word/document.xml"}
						onChange={(e) => update({ sourceFile: e.target.value })}
						placeholder="word/document.xml"
						className={inputClass}
					/>
				</label>

				<label className="text-xs font-semibold text-slate-600 md:col-span-2">
					Nội dung văn bản cần có trong hộp văn bản (expectedText)
					<textarea
						rows={4}
						value={current.expectedText ?? ""}
						onChange={(e) => update({ expectedText: e.target.value })}
						placeholder="Note: Most popular apps are available for both platforms. But for tablets, there are more apps designed specifically for the iPad; Android tablet apps are often scaled up versions of Android smartphone apps."
						className={`${inputClass} resize-y font-sans`}
					/>
				</label>

				<label className="text-xs font-semibold text-slate-600">
					Chế độ so khớp nội dung
					<select
						value={current.matchMode ?? "exact"}
						onChange={(e) =>
							update({
								matchMode: e.target.value as "exact" | "contains",
							})
						}
						className={inputClass}
					>
						<option value="exact">Khớp chính xác toàn bộ (exact - mặc định)</option>
						<option value="contains">Chứa chuỗi con (contains)</option>
					</select>
				</label>

				<label className="text-xs font-semibold text-slate-600">
					Thứ tự hộp văn bản trên trang (targetOccurrence)
					<input
						type="number"
						min={1}
						step={1}
						value={current.targetOccurrence ?? 1}
						onChange={(e) =>
							update({
								targetOccurrence: e.target.value
									? Number(e.target.value)
									: 1,
							})
						}
						placeholder="1"
						className={inputClass}
					/>
				</label>
			</div>

			<div className="mt-3 flex flex-col gap-2 border-t border-violet-100/60 pt-3">
				<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
					<input
						type="checkbox"
						checked={current.requireRemovedFromBody ?? true}
						onChange={(e) =>
							update({ requireRemovedFromBody: e.target.checked })
						}
						className="h-4 w-4 accent-blue-600"
					/>
					Yêu cầu đã Cut khỏi thân bài (chống thao tác Copy thay vì Cut)
				</label>

				<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
					<input
						type="checkbox"
						checked={current.requireDefaultPaste ?? true}
						onChange={(e) =>
							update({ requireDefaultPaste: e.target.checked })
						}
						className="h-4 w-4 accent-blue-600"
					/>
					Yêu cầu Paste mặc định (loại trừ trường hợp Paste Merge Formatting mang màu chữ của hộp văn bản)
				</label>

				<label className="flex items-center gap-2 text-xs font-medium text-slate-600">
					<input
						type="checkbox"
						checked={current.caseSensitive ?? false}
						onChange={(e) =>
							update({ caseSensitive: e.target.checked })
						}
						className="h-4 w-4 accent-blue-600"
					/>
					Phân biệt chữ hoa / chữ thường (case-sensitive)
				</label>
			</div>
		</div>
	);
};

export default TextBoxContainsTextEditor;
