import { Button, IconButton } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import {
	Checkbox,
	Select,
	type SelectOption,
	TextField,
} from "@bug-on/m3-expressive/forms";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import type React from "react";
import { useMemo } from "react";
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

	const compareModeOptions: SelectOption[] = useMemo(
		() =>
			compareModes.map((m) => ({
				value: m,
				label: compareModesLabels[m],
			})),
		[],
	);

	const matchPolicyOptions: SelectOption[] = useMemo(
		() =>
			matchPolicies.map((p) => ({
				value: p,
				label: matchPoliciesLabels[p],
			})),
		[],
	);

	return (
		<Card
			variant="filled"
			disableElevation
			className="min-w-0 overflow-hidden rounded-2xl bg-m3-surface-container p-4 text-m3-on-surface"
		>
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

				<IconButton
					type="button"
					size="sm"
					colorStyle="standard"
					onClick={onDelete}
					aria-label="Xóa điều kiện"
					title="Xóa điều kiện"
					className="shrink-0 text-m3-on-surface-variant hover:bg-m3-error-container hover:text-m3-error"
				>
					<Icon name="delete" className="text-base" />
				</IconButton>
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
					<Text
						variant="label-md"
						className="shrink-0 font-bold text-m3-on-surface"
					>
						Thông tin tệp & điểm
					</Text>
					<span className="min-w-0 truncate font-mono text-[11px] text-m3-on-surface-variant">
						{condition.conditionId || `C${String(index + 1).padStart(2, "0")}`}{" "}
						· {condition.score}đ ·{" "}
						{condition.sourceFile || "Chưa chọn file XML"}
					</span>
				</button>

				{basicsExpanded && (
					<div className="min-w-0 space-y-3 p-3.5 pt-1">
						<div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
							<TextField
								label="Mã điều kiện"
								placeholder="VD: C01"
								value={condition.conditionId}
								onChange={(val) => onMutate({ conditionId: val })}
								fullWidth
							/>
							<TextField
								label="Điểm"
								type="number"
								value={String(condition.score ?? 0)}
								onChange={(val) => onMutate({ score: Number(val) || 0 })}
								fullWidth
							/>
						</div>

						<TextField
							label="File XML cần kiểm tra"
							placeholder="xl/worksheets/sheet1.xml"
							value={condition.sourceFile}
							onChange={(val) => onMutate({ sourceFile: val })}
							fullWidth
						/>
					</div>
				)}
			</div>

			{/* Primary expected value textarea */}
			<div className="mt-3">
				<TextField
					type="textarea"
					rows={3}
					autoResize
					label="Giá trị cần tìm trong XML"
					placeholder="Một cụm XML liền nhau là 1 giá trị. Cách nhau bằng 1 dòng trống để thêm giá trị khác..."
					value={formatExpectedValuesInput(variants[0].expectedValues)}
					onChange={(val) => {
						onMutate({
							expectedVariants: [
								{
									expectedValues: parseExpectedValuesInput(val),
								},
								...variants.slice(1),
							],
						});
					}}
					fullWidth
				/>
			</div>

			{/* Variants section */}
			<div className="mt-3 rounded-xl bg-m3-surface-container-low p-3.5">
				<div className="mb-2 flex items-center justify-between gap-3">
					<Text
						variant="label-md"
						className="font-bold text-m3-on-surface-variant"
					>
						Các biến thể dự kiến ({variants.length})
					</Text>
					<Button
						type="button"
						colorStyle="tonal"
						size="xs"
						icon={<Icon name="add" className="text-sm" />}
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
					>
						Thêm biến thể
					</Button>
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
										<IconButton
											type="button"
											size="sm"
											colorStyle="standard"
											aria-label="Xóa biến thể"
											onClick={() => {
												onMutate({
													expectedVariants: variants.filter(
														(_, idx) => idx !== variantIndex,
													),
												});
											}}
											className="text-m3-error hover:bg-m3-error-container"
										>
											<Icon name="delete" className="text-sm" />
										</IconButton>
									</div>
									<TextField
										type="textarea"
										rows={2}
										autoResize
										label={`Biến thể ${variantIndex + 1}`}
										placeholder="Nhập giá trị biến thể..."
										value={formatExpectedValuesInput(variant.expectedValues)}
										onChange={(val) => {
											const nextVariants = variants.map((item, idx) =>
												idx === variantIndex
													? {
															expectedValues: parseExpectedValuesInput(val),
														}
													: item,
											);
											onMutate({ expectedVariants: nextVariants });
										}}
										fullWidth
									/>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Match mode & Policy selects */}
			<div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
				<Select
					variant="filled"
					menuVariant="expressive"
					label="Cách so khớp"
					value={condition.compareMode}
					onChange={(val) =>
						onMutate({
							compareMode: val as XmlCompareMode,
						})
					}
					options={compareModeOptions}
					showDividers={false}
					fullWidth
				/>

				<Select
					variant="filled"
					menuVariant="expressive"
					label="Quy tắc nhiều giá trị"
					value={condition.matchPolicy}
					onChange={(val) =>
						onMutate({
							matchPolicy: val as XmlMatchPolicy,
						})
					}
					options={matchPolicyOptions}
					showDividers={false}
					fullWidth
				/>
			</div>

			{/* Advanced settings toggle */}
			<div className="mt-3">
				<Button
					type="button"
					colorStyle="text"
					size="xs"
					onClick={onToggleAdvanced}
					icon={
						<Icon
							name={
								advancedExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"
							}
							className="text-base"
						/>
					}
				>
					{advancedExpanded
						? "Ẩn cài đặt nâng cao"
						: "Cài đặt nâng cao & phản hồi"}
				</Button>
			</div>

			{/* Advanced options */}
			{advancedExpanded && (
				<div className="mt-3 min-w-0 rounded-2xl bg-m3-surface-container-low p-4 space-y-3">
					<div className="grid min-w-0 gap-3 sm:grid-cols-2">
						<TextField
							label="Thông báo khi đúng"
							placeholder="Thành công..."
							value={condition.feedback?.successDetail || ""}
							onChange={(val) =>
								onMutate({
									feedback: {
										...(condition.feedback || {}),
										successDetail: val,
									},
								})
							}
							fullWidth
						/>

						<TextField
							label="Thông báo khi sai"
							placeholder="Lỗi..."
							value={condition.feedback?.errorMessage || ""}
							onChange={(val) =>
								onMutate({
									feedback: {
										...(condition.feedback || {}),
										errorMessage: val,
									},
								})
							}
							fullWidth
						/>
					</div>

					<TextField
						label="Gợi ý cách sửa"
						placeholder="Hướng dẫn thao tác để đạt điểm..."
						value={condition.feedback?.fixAction || ""}
						onChange={(val) =>
							onMutate({
								feedback: {
									...(condition.feedback || {}),
									fixAction: val,
								},
							})
						}
						fullWidth
					/>

					<TextField
						type="textarea"
						rows={2}
						autoResize
						label="Bỏ qua các thuộc tính (mỗi dòng 1 tên)"
						placeholder={"id\nr:id\nrsid*\nwp:docPr@id"}
						value={(condition.ignoreAttributes ?? []).join("\n")}
						onChange={(val) =>
							onMutate({
								ignoreAttributes: val
									.split("\n")
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						fullWidth
					/>

					{condition.compareMode === "xmlMinOccurrences" && (
						<div className="grid min-w-0 gap-3 sm:grid-cols-2">
							<TextField
								label="Số lần xuất hiện tối thiểu"
								placeholder="1"
								type="number"
								min="1"
								value={
									condition.minOccurrences != null
										? String(condition.minOccurrences)
										: ""
								}
								onChange={(val) =>
									onMutate({
										minOccurrences: val ? Number(val) : undefined,
									})
								}
								fullWidth
							/>

							<TextField
								label="Số lần xuất hiện tối đa"
								placeholder="Không giới hạn"
								type="number"
								min="1"
								value={
									condition.maxOccurrences != null
										? String(condition.maxOccurrences)
										: ""
								}
								onChange={(val) =>
									onMutate({
										maxOccurrences: val ? Number(val) : undefined,
									})
								}
								fullWidth
							/>
						</div>
					)}

					<div className="pt-1">
						<Checkbox
							checked={Boolean(condition.stopTaskIfFailed)}
							onCheckedChange={(checked) =>
								onMutate({ stopTaskIfFailed: Boolean(checked) })
							}
							label="Dừng Task nếu điều kiện này thất bại"
						/>
					</div>
				</div>
			)}
		</Card>
	);
};
