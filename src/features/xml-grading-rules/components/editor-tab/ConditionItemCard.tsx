import { Icon } from "@bug-on/m3-expressive";
import type React from "react";
import type {
	XmlCompareMode,
	XmlGradingCondition,
	XmlMatchPolicy,
} from "../../../../types/xml-grading-rules.types";
import {
	expectedVariantsForEdit,
	formatExpectedValuesInput,
	parseExpectedValuesInput,
} from "../../utils/xml-rule-helpers";
import {
	compareModes,
	compareModesLabels,
	matchPolicies,
	matchPoliciesLabels,
} from "../../utils/xml-rule-presets";

export interface ConditionItemCardProps {
	condition: XmlGradingCondition;
	index: number;
	basicsExpanded: boolean;
	onToggleBasics: () => void;
	advancedExpanded: boolean;
	onToggleAdvanced: () => void;
	onMutate: (patch: Partial<XmlGradingCondition>) => void;
	onDelete: () => void;
}

const inputClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest";
const selectClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest cursor-pointer";
const textareaClass =
	"w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-xs text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest resize-y font-mono";

export const ConditionItemCard: React.FC<ConditionItemCardProps> = ({
	condition,
	index,
	basicsExpanded,
	onToggleBasics,
	advancedExpanded,
	onToggleAdvanced,
	onMutate,
	onDelete,
}) => {
	const variants = expectedVariantsForEdit(condition);

	return (
		<div className="min-w-0 overflow-hidden rounded-2xl bg-m3-surface-container p-4 text-m3-on-surface">
			{/* Top Bar: Id, Score, Delete button */}
			<div className="flex min-w-0 items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<span className="shrink-0 rounded-xl bg-m3-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold text-m3-primary">
						{condition.conditionId || `C${String(index + 1).padStart(2, "0")}`}
					</span>
					<span className="shrink-0 text-xs font-semibold text-m3-on-surface-variant">
						{condition.score} điểm
					</span>
				</div>

				<button
					type="button"
					onClick={onDelete}
					aria-label="Xóa điều kiện"
					title="Xóa điều kiện"
					className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl text-m3-on-surface-variant transition hover:bg-m3-error-container hover:text-m3-error"
				>
					<Icon name="delete" className="text-base" />
				</button>
			</div>

			{/* Toggleable Basics info */}
			<div className="mt-3 min-w-0 overflow-hidden rounded-xl bg-m3-surface-container-low">
				<button
					type="button"
					onClick={onToggleBasics}
					className="flex w-full min-w-0 items-center gap-2 overflow-hidden px-3.5 py-2.5 text-left transition hover:bg-m3-surface-container-high/50"
				>
					<Icon
						name="expand_more"
						className={`shrink-0 text-lg text-m3-on-surface-variant transition-transform duration-200 ${
							basicsExpanded ? "rotate-180" : ""
						}`}
					/>
					<span className="shrink-0 text-xs font-bold text-m3-on-surface">
						Thông tin tệp & điểm
					</span>
					<span className="min-w-0 truncate font-mono text-[11px] text-m3-on-surface-variant">
						{condition.conditionId || `C${String(index + 1).padStart(2, "0")}`}{" "}
						· {condition.score}đ ·{" "}
						{condition.sourceFile || "Chưa chọn file XML"}
					</span>
				</button>

				{basicsExpanded && (
					<div className="min-w-0 space-y-3 p-3.5 pt-1">
						<div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
							<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
								Mã điều kiện
								<input
									value={condition.conditionId}
									onChange={(e) => onMutate({ conditionId: e.target.value })}
									placeholder="VD: C01"
									className={inputClass}
								/>
							</label>
							<label className="text-xs font-semibold text-m3-on-surface-variant">
								Điểm
								<input
									type="number"
									value={condition.score}
									onChange={(e) =>
										onMutate({ score: Number(e.target.value) || 0 })
									}
									className={inputClass}
								/>
							</label>
						</div>

						<label className="block text-xs font-semibold text-m3-on-surface-variant">
							File XML cần kiểm tra
							<input
								value={condition.sourceFile}
								onChange={(e) => onMutate({ sourceFile: e.target.value })}
								placeholder="xl/worksheets/sheet1.xml"
								className={inputClass}
							/>
						</label>
					</div>
				)}
			</div>

			{/* Primary expected value textarea */}
			<label className="mt-3 block text-xs font-semibold text-m3-on-surface-variant">
				Giá trị cần tìm trong XML
				<textarea
					value={formatExpectedValuesInput(variants[0].expectedValues)}
					onChange={(e) => {
						onMutate({
							expectedVariants: [
								{
									expectedValues: parseExpectedValuesInput(e.target.value),
								},
								...variants.slice(1),
							],
						});
					}}
					rows={3}
					placeholder="Một cụm XML liền nhau là 1 giá trị. Cách nhau bằng 1 dòng trống để thêm giá trị khác..."
					className={textareaClass}
				/>
			</label>

			{/* Variants section */}
			<div className="mt-3 rounded-xl bg-m3-surface-container-low p-3.5">
				<div className="mb-2 flex items-center justify-between gap-3">
					<span className="text-xs font-bold text-m3-on-surface-variant">
						Các biến thể dự kiến ({variants.length})
					</span>
					<button
						type="button"
						onClick={() => {
							onMutate({
								expectedVariants: [
									...variants,
									{
										expectedValues: [""],
									},
								],
							});
						}}
						className="inline-flex items-center gap-1 rounded-xl bg-m3-surface-container-high px-2.5 py-1 text-xs font-bold text-m3-primary transition hover:bg-m3-surface-container-highest"
					>
						<Icon name="add" className="text-sm" />
						<span>Thêm biến thể</span>
					</button>
				</div>

				{variants.length > 1 && (
					<div className="space-y-3 mt-2">
						{variants.slice(1).map((variant, sliceIndex) => {
							const variantIndex = sliceIndex + 1;
							return (
								<div
									key={variantIndex}
									className="rounded-xl bg-m3-surface-container-high p-3"
								>
									<div className="mb-2 flex items-center justify-between gap-3">
										<span className="rounded-lg bg-m3-primary/10 px-2 py-0.5 text-xs font-bold text-m3-primary">
											Biến thể {variantIndex + 1}
										</span>
										<button
											type="button"
											onClick={() => {
												onMutate({
													expectedVariants: variants.filter(
														(_, idx) => idx !== variantIndex,
													),
												});
											}}
											aria-label="Xóa biến thể"
											className="rounded-lg p-1 text-m3-error transition hover:bg-m3-error-container"
										>
											<Icon name="delete" className="text-sm" />
										</button>
									</div>
									<textarea
										value={formatExpectedValuesInput(variant.expectedValues)}
										onChange={(e) => {
											const nextVariants = variants.map((item, idx) =>
												idx === variantIndex
													? {
															expectedValues: parseExpectedValuesInput(
																e.target.value,
															),
														}
													: item,
											);
											onMutate({ expectedVariants: nextVariants });
										}}
										rows={2}
										placeholder="Nhập giá trị biến thể..."
										className={textareaClass}
									/>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Match mode & Policy selects */}
			<div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
				<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
					Cách so khớp
					<select
						value={condition.compareMode}
						onChange={(e) =>
							onMutate({
								compareMode: e.target.value as XmlCompareMode,
							})
						}
						className={selectClass}
					>
						{compareModes.map((m) => (
							<option key={m} value={m}>
								{compareModesLabels[m]}
							</option>
						))}
					</select>
				</label>

				<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
					Quy tắc nhiều giá trị
					<select
						value={condition.matchPolicy}
						onChange={(e) =>
							onMutate({
								matchPolicy: e.target.value as XmlMatchPolicy,
							})
						}
						className={selectClass}
					>
						{matchPolicies.map((p) => (
							<option key={p} value={p}>
								{matchPoliciesLabels[p]}
							</option>
						))}
					</select>
				</label>
			</div>

			{/* Advanced settings toggle */}
			<button
				type="button"
				onClick={onToggleAdvanced}
				className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-m3-primary hover:underline"
			>
				<Icon
					name={advancedExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
					className="text-base"
				/>
				<span>
					{advancedExpanded
						? "Ẩn cài đặt nâng cao"
						: "Cài đặt nâng cao & phản hồi"}
				</span>
			</button>

			{/* Advanced options */}
			{advancedExpanded && (
				<div className="mt-3 min-w-0 rounded-2xl bg-m3-surface-container-low p-4 space-y-3">
					<div className="grid min-w-0 gap-3 sm:grid-cols-2">
						<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
							Thông báo khi đúng
							<input
								value={condition.feedback?.successDetail || ""}
								onChange={(e) =>
									onMutate({
										feedback: {
											...(condition.feedback || {}),
											successDetail: e.target.value,
										},
									})
								}
								placeholder="Thành công..."
								className={inputClass}
							/>
						</label>

						<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
							Thông báo khi sai
							<input
								value={condition.feedback?.errorMessage || ""}
								onChange={(e) =>
									onMutate({
										feedback: {
											...(condition.feedback || {}),
											errorMessage: e.target.value,
										},
									})
								}
								placeholder="Lỗi..."
								className={inputClass}
							/>
						</label>
					</div>

					<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
						Gợi ý cách sửa
						<input
							value={condition.feedback?.fixAction || ""}
							onChange={(e) =>
								onMutate({
									feedback: {
										...(condition.feedback || {}),
										fixAction: e.target.value,
									},
								})
							}
							placeholder="Hướng dẫn thao tác để đạt điểm..."
							className={inputClass}
						/>
					</label>

					<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
						Bỏ qua các thuộc tính (mỗi dòng 1 tên)
						<textarea
							value={(condition.ignoreAttributes ?? []).join("\n")}
							onChange={(e) =>
								onMutate({
									ignoreAttributes: e.target.value
										.split("\n")
										.map((s) => s.trim())
										.filter(Boolean),
								})
							}
							rows={2}
							placeholder={"id\nr:id\nrsid*\nwp:docPr@id"}
							className={textareaClass}
						/>
					</label>

					{condition.compareMode === "xmlMinOccurrences" && (
						<div className="grid min-w-0 gap-3 sm:grid-cols-2">
							<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
								Số lần xuất hiện tối thiểu
								<input
									type="number"
									min={1}
									value={condition.minOccurrences ?? ""}
									onChange={(e) =>
										onMutate({
											minOccurrences: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
									placeholder="1"
									className={inputClass}
								/>
							</label>

							<label className="min-w-0 block text-xs font-semibold text-m3-on-surface-variant">
								Số lần xuất hiện tối đa
								<input
									type="number"
									min={1}
									value={condition.maxOccurrences ?? ""}
									onChange={(e) =>
										onMutate({
											maxOccurrences: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
									placeholder="Không giới hạn"
									className={inputClass}
								/>
							</label>
						</div>
					)}

					<label className="flex items-center gap-2 text-xs font-semibold text-m3-on-surface-variant cursor-pointer select-none">
						<input
							type="checkbox"
							checked={condition.stopTaskIfFailed}
							onChange={(e) => onMutate({ stopTaskIfFailed: e.target.checked })}
							className="h-4 w-4 rounded accent-m3-primary cursor-pointer"
						/>
						<span>Dừng Task nếu điều kiện này thất bại</span>
					</label>
				</div>
			)}
		</div>
	);
};
