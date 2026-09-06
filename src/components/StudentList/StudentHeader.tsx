import { memo } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';

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
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-emerald-200/60 blur-3xl" />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">
            <Icon name="auto_awesome" variant="rounded" size={14} />
            Không gian lớp học
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Bảng danh sách học sinh - {className}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý danh sách, chấm điểm và đồng bộ dữ liệu ngay trên một màn hình.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <Icon name="group" variant="rounded" size={14} />
              Tổng {totalCount} học sinh
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              <Icon name="how_to_reg" variant="rounded" size={14} />
              Hoạt động {activeCount}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
              <Icon name="person_off" variant="rounded" size={14} />
              Ngừng {inactiveCount}
            </div>
            {newCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                <Icon name="save" variant="rounded" size={14} />
                Chưa lưu {newCount}
              </div>
            )}
          </div>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-160">
          {!readOnly && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <Icon name="person_add" variant="rounded" size={18} />
              Thêm học sinh
            </button>
          )}
          {!readOnly && (
            <button
              onClick={onGrade}
              disabled={activeCount === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              title="Chấm điểm cho học sinh đang hoạt động"
            >
              <Icon name="fact_check" variant="rounded" size={18} />
              Chấm điểm cho lớp
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={onSyncMetadata}
              disabled={isStudentMetadataSyncing || isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              title="Đồng bộ xếp loại và ghi chú học sinh lên Google Sheet"
            >
              {isStudentMetadataSyncing ? (
                <ProgressIndicator
                  variant="circular"
                  shape="wavy"
                  showTrack
                  size={18}
                  aria-label="Đang đồng bộ..."
                />
              ) : (
                <Icon name="refresh" variant="rounded" size={18} />
              )}
              {isStudentMetadataSyncing ? 'Đang đồng bộ...' : 'Đồng bộ XL + ghi chú GG Sheet'}
            </button>
          )}
          <button
            onClick={onOpenViewScores}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
          >
            <Icon name="visibility" variant="rounded" size={18} />
            Xem bảng điểm lớp
          </button>
        </div>
      </div>
    </section>
  );
};

export const StudentHeader = memo(StudentHeaderComponent);
