import { Button, Card, CardContent, Icon } from "@bug-on/m3-expressive";
import type React from "react";
import { memo } from "react";
import type { Class } from "../../../types/class.types";
import { ClassCard } from "./ClassCard";

interface ClassGridProps {
	classes: Class[];
	canManageClass: (cls: Class) => boolean;
	canHandoverClass: (cls: Class) => boolean;
	canCreateClass: boolean;
	totalClassCount: number;
	searchQuery: string;
	onSelectClass: (cls: Class) => void;
	onEditClass: (cls: Class) => void;
	onDeleteClass: (cls: Class) => void;
	onHandoverClass: (cls: Class) => void;
	onOpenAddModal: () => void;
	onClearSearch: () => void;
}

export const ClassGrid: React.FC<ClassGridProps> = memo(
	({
		classes,
		canManageClass,
		canHandoverClass,
		canCreateClass,
		totalClassCount,
		searchQuery,
		onSelectClass,
		onEditClass,
		onDeleteClass,
		onHandoverClass,
		onOpenAddModal,
		onClearSearch,
	}) => {
		if (classes.length === 0) {
			return (
				<Card
					variant="filled"
					className="rounded-4xl border-none bg-m3-surface-container py-14 text-center text-m3-on-surface shadow-xs"
				>
					<CardContent className="flex flex-col items-center justify-center p-0">
						<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-m3-surface-container-high text-m3-on-surface-variant">
							<Icon name="menu_book" className="text-3xl" />
						</div>
						<p className="text-base font-bold text-m3-on-surface">
							{totalClassCount === 0
								? "Chưa có lớp học nào trong trường này"
								: "Không tìm thấy lớp phù hợp với từ khóa tìm kiếm"}
						</p>
						<p className="mt-1 max-w-sm text-xs text-m3-on-surface-variant">
							{totalClassCount === 0
								? "Hãy bắt đầu tạo lớp học đầu tiên cho trường để quản lý danh sách học sinh."
								: "Hãy thử tìm kiếm với tên lớp khác hoặc tắt bộ lọc."}
						</p>

						{totalClassCount > 0 && searchQuery.trim() && (
							<Button
								type="button"
								colorStyle="outlined"
								size="sm"
								onClick={onClearSearch}
								className="mt-4 rounded-full"
							>
								Xóa từ khóa tìm kiếm
							</Button>
						)}

						{totalClassCount === 0 && canCreateClass && (
							<Button
								type="button"
								colorStyle="filled"
								size="sm"
								icon={<Icon name="add" className="text-base" />}
								onClick={onOpenAddModal}
								className="mt-4 rounded-full shadow-xs"
							>
								Tạo lớp đầu tiên
							</Button>
						)}
					</CardContent>
				</Card>
			);
		}

		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{classes.map((cls) => (
					<ClassCard
						key={cls.id}
						cls={cls}
						hasManagePermission={canManageClass(cls)}
						canHandover={canHandoverClass(cls)}
						onSelect={onSelectClass}
						onEdit={onEditClass}
						onDelete={onDeleteClass}
						onHandover={onHandoverClass}
					/>
				))}
			</div>
		);
	},
);

ClassGrid.displayName = "ClassGrid";
