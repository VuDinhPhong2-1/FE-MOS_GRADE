import { memo } from 'react';
import { Chip, Icon } from '@bug-on/m3-expressive';

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
    <section className="relative overflow-hidden rounded-3xl bg-m3-surface-container px-4 py-4 sm:px-6 sm:py-5 shadow-xs text-m3-on-surface">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-m3-primary/10 blur-3xl gpu-layer-isolate" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-m3-tertiary/10 blur-3xl gpu-layer-isolate" />
      <div className="relative flex flex-col gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-m3-primary/20 bg-m3-primary-container/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-m3-on-primary-container">
            <Icon name="auto_awesome" variant="rounded" size={14} />
            Không gian lớp học
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-m3-on-surface sm:text-2xl">
              Bảng danh sách học sinh - {className}
            </h1>
            <p className="mt-1 text-sm text-m3-on-surface-variant">
              Quản lý danh sách, chấm điểm và đồng bộ dữ liệu ngay trên một màn hình.
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
    </section>
  );
};

export const StudentHeader = memo(StudentHeaderComponent);
