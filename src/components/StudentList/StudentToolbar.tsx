import { memo } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';

interface StudentToolbarProps {
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
  displayedCount: number;
  totalCount: number;
  isLoading: boolean;
  readOnly: boolean;
  newCount: number;
  onReload: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPasteModal: () => void;
  onSaveStudents: () => void;
}

const StudentToolbarComponent = ({
  searchKeyword,
  onSearchChange,
  displayedCount,
  totalCount,
  isLoading,
  readOnly,
  newCount,
  onReload,
  onFileUpload,
  onOpenPasteModal,
  onSaveStudents,
}: StudentToolbarProps) => {
  return (
    <section className="rounded-2xl bg-m3-surface-container-low p-3 sm:p-4 text-m3-on-surface">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,auto)]">
        <div className="relative">
          <Icon
            name="search"
            variant="rounded"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchKeyword}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm kiếm theo tên học sinh..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-slate-700">
            Hiển thị {displayedCount}/{totalCount} học sinh
          </span>
          <span className="text-xs text-slate-500">
            Bấm tiêu đề cột <strong>Tên</strong> hoặc <strong>Trạng thái</strong> để sắp xếp
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onReload}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          title="Tải lại danh sách"
        >
          {isLoading ? (
            <ProgressIndicator
              variant="circular"
              shape="wavy"
              showTrack
              size={18}
              aria-label="Đang tải lại..."
            />
          ) : (
            <Icon name="refresh" variant="rounded" size={18} />
          )}
          Tải lại
        </button>

        {!readOnly && (
          <>
            <input
              type="file"
              onChange={onFileUpload}
              accept=".xlsx, .xls, .txt"
              className="hidden"
              id="import-excel"
            />

            <label
              htmlFor="import-excel"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Icon name="upload" variant="rounded" size={18} /> Nhập Excel
            </label>

            <button
              type="button"
              onClick={onOpenPasteModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Icon name="content_paste" variant="rounded" size={18} /> Dán từ Excel
            </button>

            {newCount > 0 && (
              <button
                onClick={onSaveStudents}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <Icon name="save" variant="rounded" size={18} />
                {isLoading ? 'Đang lưu...' : 'Lưu danh sách'}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export const StudentToolbar = memo(StudentToolbarComponent);
