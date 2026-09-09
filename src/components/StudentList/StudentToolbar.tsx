import { memo } from 'react';
import { Button, Icon, TextField } from '@bug-on/m3-expressive';

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
    <section className="rounded-2xl bg-m3-surface-container-low p-3 sm:p-4 text-m3-on-surface shadow-xs">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,auto)] items-center">
        <TextField
          variant="outlined"
          placeholder="Tìm kiếm theo tên học sinh..."
          value={searchKeyword}
          onChange={(val) => onSearchChange(val)}
          leadingIcon={<Icon name="search" variant="rounded" size={20} />}
          fullWidth
        />
        <div className="flex flex-col justify-center rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 shadow-xs">
          <span className="text-sm font-medium text-m3-on-surface">
            Hiển thị {displayedCount}/{totalCount} học sinh
          </span>
          <span className="text-xs text-m3-on-surface-variant">
            Bấm tiêu đề cột <strong>Tên</strong> hoặc <strong>Trạng thái</strong> để sắp xếp
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          colorStyle="tonal"
          onClick={onReload}
          disabled={isLoading}
          loading={isLoading}
          icon={!isLoading ? <Icon name="refresh" variant="rounded" size={18} /> : undefined}
          title="Tải lại danh sách"
        >
          Tải lại
        </Button>

        {!readOnly && (
          <>
            <input
              type="file"
              onChange={onFileUpload}
              accept=".xlsx, .xls, .txt"
              className="hidden"
              id="import-excel"
            />

            <Button
              asChild
              colorStyle="filled"
              icon={<Icon name="upload" variant="rounded" size={18} />}
            >
              <label htmlFor="import-excel" className="cursor-pointer">
                Nhập Excel
              </label>
            </Button>

            <Button
              colorStyle="tonal"
              onClick={onOpenPasteModal}
              icon={<Icon name="content_paste" variant="rounded" size={18} />}
            >
              Dán từ Excel
            </Button>

            {newCount > 0 && (
              <Button
                colorStyle="filled"
                onClick={onSaveStudents}
                disabled={isLoading}
                loading={isLoading}
                icon={!isLoading ? <Icon name="save" variant="rounded" size={18} /> : undefined}
              >
                {isLoading ? 'Đang lưu...' : 'Lưu danh sách'}
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export const StudentToolbar = memo(StudentToolbarComponent);
