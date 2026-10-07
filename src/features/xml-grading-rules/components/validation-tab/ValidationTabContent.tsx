import { Icon, Text } from "@bug-on/m3-expressive";
import type React from "react";
import type { XmlRuleValidationResult } from "../../../../types/xml-grading-rules.types";

export interface ValidationTabContentProps {
	validation: XmlRuleValidationResult | null;
	isValidating: boolean;
	onValidate: () => void;
}

export const ValidationTabContent: React.FC<ValidationTabContentProps> = ({
	validation,
	isValidating,
	onValidate,
}) => {
	return (
		<section className="rounded-3xl bg-m3-surface-container p-6 text-m3-on-surface">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-m3-surface-container-high text-m3-primary">
							<Icon name="fact_check" className="text-xl" />
						</div>
						<h3 className="text-base font-bold text-m3-on-surface">
							Kiểm tra tính hợp lệ của ruleset (Validation)
						</h3>
					</div>
					<Text
						variant="body-sm"
						className="mt-1 text-xs text-m3-on-surface-variant"
					>
						Kiểm tra cấu trúc và tính tương thích của ruleset trước khi lưu hoặc
						kích hoạt.
					</Text>
				</div>

				<button
					type="button"
					onClick={onValidate}
					disabled={isValidating}
					className="inline-flex items-center gap-2 rounded-2xl bg-m3-primary px-4 py-2 text-xs font-bold text-m3-on-primary transition hover:bg-m3-primary/90 disabled:opacity-50"
				>
					<Icon
						name="check_circle"
						className={`text-base ${isValidating ? "animate-spin" : ""}`}
					/>
					<span>{isValidating ? "Đang kiểm tra..." : "Chạy Validate"}</span>
				</button>
			</div>

			{!validation ? (
				<div className="rounded-3xl bg-m3-surface-container-low p-12 text-center text-m3-on-surface-variant">
					<Icon name="rule" className="text-4xl opacity-50" />
					<Text variant="body-md" className="mt-3 text-sm font-semibold">
						Chưa chạy validation cho bộ luật này
					</Text>
					<Text variant="body-sm" className="mt-1 text-xs">
						Hãy chạy Validate để hệ thống kiểm tra các liên kết, cú pháp XML và
						điểm số.
					</Text>
				</div>
			) : (
				<div className="space-y-4">
					{/* Status Card */}
					<div
						className={`flex items-center gap-4 rounded-2xl p-4 ${
							validation.isValid
								? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
								: "bg-m3-error-container text-m3-on-error-container"
						}`}
					>
						<Icon
							name={validation.isValid ? "check_circle" : "error"}
							className="text-3xl shrink-0"
						/>
						<div>
							<h4 className="text-sm font-bold">
								{validation.isValid
									? "Ruleset hoàn toàn hợp lệ"
									: "Phát hiện lỗi trong cấu trúc ruleset"}
							</h4>
							<Text variant="body-sm" className="mt-0.5 text-xs opacity-90">
								{validation.errors?.length || 0} lỗi ·{" "}
								{validation.warnings?.length || 0} cảnh báo
							</Text>
						</div>
					</div>

					{/* Error List */}
					{(validation.errors || []).length > 0 && (
						<div className="overflow-hidden rounded-2xl bg-m3-surface-container-low">
							<div className="bg-m3-error-container/40 px-4 py-3 text-xs font-bold text-m3-on-error-container">
								Danh sách lỗi cần khắc phục
							</div>
							<div className="divide-y divide-m3-surface-container-high">
								{(validation.errors || []).map((err) => (
									<div
										key={err}
										className="flex items-start gap-3 px-4 py-3 text-xs text-m3-error"
									>
										<Icon name="cancel" className="mt-0.5 shrink-0 text-base" />
										<span>{err}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Warning List */}
					{(validation.warnings || []).length > 0 && (
						<div className="overflow-hidden rounded-2xl bg-m3-surface-container-low">
							<div className="bg-amber-500/15 px-4 py-3 text-xs font-bold text-amber-700 dark:text-amber-300">
								Cảnh báo cấu hình
							</div>
							<div className="divide-y divide-m3-surface-container-high">
								{(validation.warnings || []).map((warning) => (
									<div
										key={warning}
										className="flex items-start gap-3 px-4 py-3 text-xs text-amber-700 dark:text-amber-300"
									>
										<Icon
											name="warning"
											className="mt-0.5 shrink-0 text-base"
										/>
										<span>{warning}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</section>
	);
};
