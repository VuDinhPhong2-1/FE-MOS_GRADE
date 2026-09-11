import { Card, Icon, TextField } from "@bug-on/m3-expressive";
import { memo } from "react";

interface StudentToolbarProps {
	searchKeyword: string;
	onSearchChange: (keyword: string) => void;
	displayedCount: number;
	totalCount: number;
}

const StudentToolbarComponent = ({
	searchKeyword,
	onSearchChange,
	displayedCount,
	totalCount,
}: StudentToolbarProps) => {
	return (
		<Card variant="filled" className="p-3 sm:p-4">
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,auto)] items-center">
				<TextField
					variant="outlined"
					placeholder="Tìm kiếm theo tên học sinh..."
					value={searchKeyword}
					onChange={(val) => onSearchChange(val)}
					leadingIcon={<Icon name="search" size={20} />}
					fullWidth
					dense
				/>
				<div className="flex flex-col justify-center px-3 py-2">
					<span className="text-sm font-medium text-m3-on-surface">
						Hiển thị {displayedCount}/{totalCount} học sinh
					</span>
					<span className="text-xs text-m3-on-surface-variant">
						Bấm tiêu đề cột <strong>Tên</strong> hoặc{" "}
						<strong>Trạng thái</strong> để sắp xếp
					</span>
				</div>
			</div>
		</Card>
	);
};

export const StudentToolbar = memo(StudentToolbarComponent);
