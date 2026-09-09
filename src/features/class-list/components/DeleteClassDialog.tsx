import React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Icon,
} from '@bug-on/m3-expressive';
import type { Class } from '../../../types/class.types';

export interface DeleteClassDialogProps {
  open: boolean;
  isDeleting: boolean;
  classToDelete: Class | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
}

export const DeleteClassDialog: React.FC<DeleteClassDialogProps> = ({
  open,
  isDeleting,
  classToDelete,
  onClose,
  onConfirmDelete,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) onClose();
      }}
    >
      <DialogPortal open={open}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-6 text-m3-on-surface shadow-2xl"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-m3-error-container text-m3-error">
                <Icon name="delete_forever" className="text-2xl" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-m3-on-surface">
                  Xác nhận xóa lớp học
                </DialogTitle>
                <DialogDescription className="text-xs text-m3-on-surface-variant">
                  Thao tác này không thể hoàn tác
                </DialogDescription>
              </div>
            </div>

            <p className="text-sm text-m3-on-surface-variant leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn lớp{' '}
              <strong className="font-semibold text-m3-on-surface">
                "{classToDelete?.name}"
              </strong>
              ? Toàn bộ danh sách học sinh và các dữ liệu điểm số liên quan trực thuộc lớp này sẽ bị ảnh hưởng.
            </p>

            <DialogFooter className="mt-2 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 pt-4">
              <Button
                colorStyle="text"
                type="button"
                onClick={onClose}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                colorStyle="filled"
                type="button"
                onClick={() => void onConfirmDelete()}
                disabled={isDeleting}
                loading={isDeleting}
                className="bg-m3-error text-m3-on-error hover:bg-m3-error/90"
              >
                Xác nhận xóa
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
