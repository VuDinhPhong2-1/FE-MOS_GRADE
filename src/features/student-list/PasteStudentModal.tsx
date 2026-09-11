import { useState, useMemo, useRef, memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  type TextFieldHandle,
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

const PasteStudentModalComponent = ({
  isOpen,
  readOnly,
  onClose,
  onImportStudents,
}: PasteStudentModalProps) => {
  const [pasteInput, setPasteInput] = useState('');
  const [error, setError] = useState('');
  const textFieldRef = useRef<TextFieldHandle>(null);

  const parsedRows = useMemo(() => parsePastedRows(pasteInput), [pasteInput]);
  const parsedStudents = useMemo(() => mapRowsToTempStudents(parsedRows), [parsedRows]);

  const handlePasteCapture = () => {
    // Đưa con trỏ và cuộn ngay về đầu văn bản sau khi hoàn tất dán dữ liệu
    requestAnimationFrame(() => {
      const el = textFieldRef.current?.getInputElement();
      if (el) {
        el.setSelectionRange(0, 0);
        el.scrollTop = 0;
        const viewport = el.closest('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = 0;
        }
      }
    });
  };

  const handlePasteFromClipboard = async () => {
    if (readOnly) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setError('Bộ nhớ tạm không có nội dung văn bản.');
        return;
      }
      setPasteInput(text);
      setError('');
      handlePasteCapture();
    } catch {
      setError('Không thể truy cập bộ nhớ tạm. Bạn vui lòng dán thủ công bằng phím tắt Ctrl + V.');
    }
  };

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

    if (parsedStudents.length === 0) {
      setError('Dữ liệu cần có tối thiểu 2 cột: Họ và tên đệm, Tên.');
      return;
    }

    onImportStudents(parsedStudents);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPortal open={isOpen}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl transform-gpu will-change-transform"
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

            <div onPaste={handlePasteCapture} className="w-full">
              <TextField
                ref={textFieldRef}
                type="textarea"
                rows={12}
                variant="outlined"
                scrollAreaType="none"
                placeholder={'Ví dụ:\nNinh Hoàng\tAnh\nNguyễn Phan\tAnh'}
                value={pasteInput}
                onChange={(val) => {
                  if (error) setError('');
                  setPasteInput(val);
                }}
                fullWidth
                className="pt-2"
              />
            </div>

            {/* Nút Dán từ bộ nhớ tạm khi chưa có dữ liệu và Khối nhận diện khi đã có dữ liệu */}
            <AnimatePresence mode="wait" initial={false}>
              {!pasteInput.trim() ? (
                <motion.div
                  key="clipboard-action"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center justify-start"
                >
                  <Button
                    type="button"
                    colorStyle="tonal"
                    icon={<Icon name="content_paste" />}
                    onClick={handlePasteFromClipboard}
                    disabled={readOnly}
                    className="cursor-pointer"
                  >
                    Dán từ bộ nhớ tạm
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="recognition-info"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center justify-between rounded-2xl bg-m3-surface-container px-3.5 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2 text-m3-on-surface">
                    <Icon name="check_circle" size={18} className="text-m3-primary" />
                    <span>
                      Đã nhận diện:{' '}
                      <strong className="font-semibold text-m3-primary">
                        {parsedStudents.length}
                      </strong>{' '}
                      học sinh
                      {parsedRows.length > parsedStudents.length && (
                        <span className="text-m3-on-surface-variant">
                          {' '}
                          ({parsedRows.length} dòng dữ liệu)
                        </span>
                      )}
                    </span>
                  </div>
                  <Button
                    type="button"
                    colorStyle="text"
                    size="xs"
                    onClick={() => {
                      setPasteInput('');
                      setError('');
                    }}
                    className="text-m3-error hover:bg-m3-error-container/40 cursor-pointer"
                  >
                    Xóa tất cả
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

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
              icon={<Icon name="add" />}
              disabled={readOnly || !pasteInput.trim() || parsedStudents.length === 0}
              className="transition-all duration-200"
            >
              Thêm vào danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export const PasteStudentModal = memo(PasteStudentModalComponent);

