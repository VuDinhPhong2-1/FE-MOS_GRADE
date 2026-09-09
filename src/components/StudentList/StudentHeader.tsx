import { memo } from 'react';
import { Button, Icon } from '@bug-on/m3-expressive';

interface StudentHeaderProps {
  className: string;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  newCount: number;
  readOnly: boolean;
  isStudentMetadataSyncing: boolean;
  isLoading: boolean;
  onOpenAddModal: () => void;
  onGrade: () => void;
  onSyncMetadata: () => void;
  onOpenViewScores: () => void;
}

const StudentHeaderComponent = ({
  className,
  totalCount,
  activeCount,
  inactiveCount,
  newCount,
  readOnly,
  isStudentMetadataSyncing,
  isLoading,
  onOpenAddModal,
  onGrade,
  onSyncMetadata,
  onOpenViewScores,
}: StudentHeaderProps) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-m3-surface-container px-4 py-4 sm:px-6 sm:py-5 shadow-xs text-m3-on-surface">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-m3-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-m3-tertiary/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-m3-outline-variant/60 bg-m3-surface-container-high px-3 py-1 text-xs font-semibold text-m3-on-surface shadow-xs">
              <Icon name="group" variant="rounded" size={14} />
              Tổng {totalCount} học sinh
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-m3-secondary/20 bg-m3-secondary-container px-3 py-1 text-xs font-semibold text-m3-on-secondary-container shadow-xs">
              <Icon name="how_to_reg" variant="rounded" size={14} />
              Hoạt động {activeCount}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-m3-error/20 bg-m3-error-container px-3 py-1 text-xs font-semibold text-m3-on-error-container shadow-xs">
              <Icon name="person_off" variant="rounded" size={14} />
              Ngừng {inactiveCount}
            </div>
            {newCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-m3-tertiary/20 bg-m3-tertiary-container px-3 py-1 text-xs font-semibold text-m3-on-tertiary-container shadow-xs">
                <Icon name="save" variant="rounded" size={14} />
                Chưa lưu {newCount}
              </div>
            )}
          </div>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-160">
          {!readOnly && (
            <Button
              colorStyle="filled"
              icon={<Icon name="person_add" variant="rounded" size={18} />}
              onClick={onOpenAddModal}
              fullWidth
            >
              Thêm học sinh
            </Button>
          )}
          {!readOnly && (
            <Button
              colorStyle="tonal"
              icon={<Icon name="fact_check" variant="rounded" size={18} />}
              onClick={onGrade}
              disabled={activeCount === 0}
              title="Chấm điểm cho học sinh đang hoạt động"
              fullWidth
            >
              Chấm điểm cho lớp
            </Button>
          )}
          {!readOnly && (
            <Button
              colorStyle="tonal"
              icon={!isStudentMetadataSyncing ? <Icon name="refresh" variant="rounded" size={18} /> : undefined}
              loading={isStudentMetadataSyncing}
              onClick={onSyncMetadata}
              disabled={isStudentMetadataSyncing || isLoading}
              title="Đồng bộ xếp loại và ghi chú học sinh lên Google Sheet"
              fullWidth
            >
              {isStudentMetadataSyncing ? 'Đang đồng bộ...' : 'Đồng bộ XL + ghi chú GG Sheet'}
            </Button>
          )}
          <Button
            colorStyle="outlined"
            icon={<Icon name="visibility" variant="rounded" size={18} />}
            onClick={onOpenViewScores}
            fullWidth
          >
            Xem bảng điểm lớp
          </Button>
        </div>
      </div>
    </section>
  );
};

export const StudentHeader = memo(StudentHeaderComponent);
