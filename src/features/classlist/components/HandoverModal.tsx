import React, { useMemo } from 'react';
import {
  Button,
  Chip,
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
  ProgressIndicator,
  TextField,
} from '@bug-on/m3-expressive';
import type { Class } from '../../../types/class.types';
import type { TeacherSummary } from '../../../types/auth.types';

interface HandoverModalProps {
  open: boolean;
  onClose: () => void;
  handoverClass: Class | null;
  teachers: TeacherSummary[];
  isLoadingTeachers: boolean;
  handoverError: string;
  handoverBusyTeacherId: string | null;
  handoverSearch: string;
  onSearchChange: (val: string) => void;
  onToggleHandover: (teacherId: string, granted: boolean) => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  open,
  onClose,
  handoverClass,
  teachers,
  isLoadingTeachers,
  handoverError,
  handoverBusyTeacherId,
  handoverSearch,
  onSearchChange,
  onToggleHandover,
}) => {
  const isOpen = open && Boolean(handoverClass);

  const filteredTeachers = useMemo(() => {
    const keyword = handoverSearch.trim().toLowerCase();
    if (!keyword) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      const fullName = (teacher.fullName || '').toLowerCase();
      const username = (teacher.username || '').toLowerCase();
      const email = (teacher.email || '').toLowerCase();
      return fullName.includes(keyword) || username.includes(keyword) || email.includes(keyword);
    });
  }, [handoverSearch, teachers]);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogPortal open={isOpen}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
        >
          {handoverClass && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
                    <Icon name="supervisor_account" className="text-xl" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-m3-on-surface">
                      Bàn giao quyền lớp: <span className="text-m3-primary">{handoverClass.name}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-m3-on-surface-variant">
                      Cấp hoặc thu hồi quyền quản lý lớp học cho các giáo viên khác trong hệ thống
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <IconButton
                  type="button"
                  size="sm"
                  colorStyle="standard"
                  aria-label="Đóng hộp thoại bàn giao"
                  onClick={onClose}
                >
                  <Icon name="close" className="text-lg" />
                </IconButton>
              </div>

              {/* Body */}
              <DialogBody className="space-y-4 px-6 py-3">
                <TextField
                  variant="outlined"
                  placeholder="Tìm theo tên, username hoặc email..."
                  value={handoverSearch}
                  onChange={onSearchChange}
                  leadingIcon={<Icon name="search" size={18} />}
                  className="w-full"
                />

                {handoverError && (
                  <div className="flex items-center gap-2 rounded-2xl bg-m3-error-container p-3 text-xs font-medium text-m3-on-error-container">
                    <Icon name="error" size={16} />
                    <span>{handoverError}</span>
                  </div>
                )}

                {isLoadingTeachers ? (
                  <div className="flex h-44 flex-col items-center justify-center gap-2 text-m3-on-surface-variant">
                    <ProgressIndicator variant="circular" shape="wavy" size={36} aria-label="Đang tải danh sách giáo viên..." />
                    <span className="text-xs">Đang tải danh sách giáo viên...</span>
                  </div>
                ) : filteredTeachers.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-m3-outline-variant/60 p-8 text-center text-xs text-m3-on-surface-variant">
                    Không tìm thấy giáo viên nào phù hợp.
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {filteredTeachers.map((teacher) => {
                      const isOwner = teacher.userId === handoverClass.ownerId;
                      const granted = Boolean(handoverClass.managerTeacherIds?.includes(teacher.userId));
                      const isBusy = handoverBusyTeacherId === teacher.userId;

                      return (
                        <div
                          key={teacher.userId}
                          className="flex items-center justify-between rounded-2xl border border-m3-outline-variant/40 bg-m3-surface-container p-3 transition-colors hover:bg-m3-surface-container-highest/60"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="truncate text-sm font-semibold text-m3-on-surface">
                              {teacher.fullName?.trim() || teacher.username}
                            </p>
                            <p className="truncate text-xs text-m3-on-surface-variant">
                              {teacher.email || teacher.username}
                            </p>
                          </div>

                          {isOwner ? (
                            <Chip
                              variant="assist"
                              label="Giáo viên chính"
                              className="pointer-events-none h-6 border-none bg-emerald-500/10 px-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                            />
                          ) : (
                            <Button
                              type="button"
                              colorStyle={granted ? 'outlined' : 'tonal'}
                              size="sm"
                              disabled={isBusy}
                              loading={isBusy}
                              onClick={() => onToggleHandover(teacher.userId, granted)}
                              className={`rounded-full text-xs font-semibold ${
                                granted ? 'border-m3-error text-m3-error hover:bg-m3-error-container/30' : ''
                              }`}
                            >
                              {granted ? 'Thu hồi quyền' : 'Cấp quyền'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </DialogBody>

              {/* Footer */}
              <DialogFooter className="border-t border-m3-outline-variant/30 px-6 py-4">
                <Button
                  type="button"
                  colorStyle="text"
                  onClick={onClose}
                >
                  Đóng
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
