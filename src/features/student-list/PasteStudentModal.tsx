import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Icon,
  IconButton,
  TextField,
} from '@bug-on/m3-expressive';
import type { Student } from '../../types/student.types';
import {
  parsePastedRows,
  mapRowsToTempStudents,
} from './utils/studentExcelParser';

interface PasteStudentModalProps {
  isOpen: boolean;
  readOnly: boolean;
  onClose: () => void;
  onImportStudents: (students: Student[]) => void;
}

export const PasteStudentModal = ({
  isOpen,
  readOnly,
  onClose,
  onImportStudents,
}: PasteStudentModalProps) => {
  const [pasteInput, setPasteInput] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setPasteInput('');
    setError('');
    onClose();
  };

  const handleImport = () => {
    if (readOnly) return;

    if (!pasteInput.trim()) {
      setError('Bạn chưa dán dữ liệu.');
      return;
    }

    const rows = parsePastedRows(pasteInput);
    const list = mapRowsToTempStudents(rows);

    if (list.length === 0) {
      setError('Dữ liệu cần có tối thiểu 2 cột: Họ và tên đệm, Tên.');
      return;
    }

    onImportStudents(list);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPortal open={isOpen}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-m3-outline-variant/40 px-6 pt-5 pb-3">
            <DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-m3-primary text-m3-on-primary">
                <Icon name="content_paste" size={20} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-m3-on-surface">
                  Dán danh sách học sinh
                </DialogTitle>
                <DialogDescription className="text-xs text-m3-on-surface-variant">
                  Sao chép và dán nhanh danh sách từ bảng tính Excel
                </DialogDescription>
              </div>
            </DialogHeader>
            <IconButton
              type="button"
              size="sm"
              colorStyle="standard"
              aria-label="Đóng"
              onClick={handleClose}
            >
              <Icon name="close" />
            </IconButton>
          </div>

          <DialogBody className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
            <p className="text-sm text-m3-on-surface-variant">
              Copy trực tiếp 2 cột từ Excel theo thứ tự:{' '}
              <strong className="text-m3-on-surface">Họ và tên đệm</strong>,{' '}
              <strong className="text-m3-on-surface">Tên</strong>, rồi dán vào ô bên dưới.
            </p>

            <TextField
              type="textarea"
              rows={12}
              variant="outlined"
              placeholder={'Ví dụ:\nNinh Hoàng\tAnh\nNguyễn Phan\tAnh'}
              value={pasteInput}
              onChange={(val) => {
                if (error) setError('');
                setPasteInput(val);
              }}
              fullWidth
              className='pt-2'
            />

            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-m3-error-container p-3 text-xs font-medium text-m3-on-error-container">
                <Icon name="error" size={16} />
                <span>{error}</span>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex justify-end gap-2 border-t border-m3-outline-variant/40 px-6 py-4">
            <Button
              type="button"
              colorStyle="text"
              onClick={handleClose}
            >
              Hủy
            </Button>
            <Button
              type="button"
              colorStyle="filled"
              onClick={handleImport}
              icon={<Icon name="content_paste" size={18} />}
            >
              Dán và thêm vào danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
