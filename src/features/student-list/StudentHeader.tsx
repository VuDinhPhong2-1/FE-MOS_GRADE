import { memo } from 'react';
import { Card, Chip, Icon } from '@bug-on/m3-expressive';

interface StudentHeaderProps {
  className: string;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  newCount: number;
}

const StudentHeaderComponent = ({
  className,
  totalCount,
  activeCount,
  inactiveCount,
  newCount,
}: StudentHeaderProps) => {
  return (
    <Card variant='filled' className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-m3-on-surface sm:text-2xl">
              Bảng danh sách học sinh - {className}
            </h1>
            <p className="mt-1 text-sm text-m3-on-surface-variant">
              Quản lý danh sách, chấm điểm và đồng bộ dữ liệu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              variant="assist"
              leadingIcon={<Icon name="group" size={16} />}
              label={`Tổng ${totalCount} học sinh`}
            />
            <Chip
              variant="assist"
              leadingIcon={<Icon name="how_to_reg" size={16} className="text-m3-secondary" />}
              label={`Hoạt động ${activeCount}`}
            />
            <Chip
              variant="assist"
              leadingIcon={<Icon name="person_off" size={16} className="text-m3-error" />}
              label={`Ngừng ${inactiveCount}`}
            />
            {newCount > 0 && (
              <Chip
                variant="assist"
                leadingIcon={<Icon name="save" size={16} className="text-m3-tertiary" />}
                label={`Chưa lưu ${newCount}`}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const StudentHeader = memo(StudentHeaderComponent);
