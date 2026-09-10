import { memo } from 'react';
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
import type { Student } from '../../types/student.types';

export interface DeleteStudentDialogProps {
  open: boolean;
  isDeleting: boolean;
  studentToDelete: Student | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
}

const DeleteStudentDialogComponent = ({
  open,
  isDeleting,
  studentToDelete,
  onClose,
  onConfirmDelete,
}: DeleteStudentDialogProps) => {
  const isTemp = studentToDelete?.id.startsWith('temp-') ?? false;
  const fullName = studentToDelete
    ? `${studentToDelete.middleName} ${studentToDelete.firstName}`.trim()
    : '';

  return (
    <Dialog
      open={open && Boolean(studentToDelete)}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) onClose();
      }}
    >
      <DialogPortal open={open && Boolean(studentToDelete)}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-6 text-m3-on-surface shadow-2xl transform-gpu will-change-transform"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-m3-error-container text-m3-error">
                <Icon name="delete_forever" className="text-2xl" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-m3-on-surface">
                  Xác nhận xóa học sinh
                </DialogTitle>
                <DialogDescription className="text-xs text-m3-on-surface-variant">
                  Thao tác này không thể hoàn tác
                </DialogDescription>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-m3-on-surface-variant">
              Bạn có chắc chắn muốn xóa học sinh{' '}
              <strong className="font-semibold text-m3-on-surface">
                "{fullName}"
              </strong>
              ?{' '}
              {isTemp
                ? 'Học sinh này đang ở trạng thái tạm thời, sẽ được gỡ khỏi danh sách hiện tại.'
                : 'Dữ liệu học sinh cùng điểm số và thông tin liên quan sẽ bị xóa hoàn toàn khỏi lớp học.'}
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
                className="bg-m3-error text-m3-on-error hover:bg-m3-error/90 shadow-xs"
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

export const DeleteStudentDialog = memo(DeleteStudentDialogComponent);

