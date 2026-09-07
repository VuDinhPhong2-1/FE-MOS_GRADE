import React, { memo } from 'react';
import { Button, ButtonDistribute, Card, Chip, Icon, IconButton } from '@bug-on/m3-expressive';
import type { Class } from '../../../types/class.types';

interface ClassCardProps {
  cls: Class;
  hasManagePermission: boolean;
  canHandover: boolean;
  onSelect: (cls: Class) => void;
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
  onHandover: (cls: Class) => void;
}

export const ClassCard: React.FC<ClassCardProps> = memo(
  ({
    cls,
    hasManagePermission,
    canHandover,
    onSelect,
    onEdit,
    onDelete,
    onHandover,
  }) => {
    return (
      <Card
        variant="filled"
        className={`group flex flex-col justify-between overflow-hidden rounded-4xl border-none bg-m3-surface-container p-5 text-m3-on-surface shadow-xs transition-all hover:shadow-md ${!cls.isActive ? 'opacity-65' : ''
          }`}
      >
        <div className="space-y-4">
          {/* Card Header: Tên lớp & Badge trạng thái */}
          <div className="flex items-start justify-between gap-2 pb-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-m3-on-surface transition-colors group-hover:text-m3-primary">
                {cls.name}
              </h3>
              <p className="text-xs text-m3-on-surface-variant">
                Khối: <span className="font-semibold text-m3-on-surface">{cls.grade || '---'}</span>
              </p>
            </div>
            <Chip
              variant="assist"
              label={cls.isActive ? 'Hoạt động' : 'Ngừng'}
              className={`pointer-events-none h-6 border-none px-2.5 text-xs font-bold shadow-xs ${cls.isActive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant'
                }`}
            />
          </div>

          {/* Thông tin chi tiết */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-m3-on-surface-variant">Sĩ số:</span>
              <span className="font-semibold text-m3-on-surface">
                {cls.currentStudents}/{cls.maxStudents || '∞'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-m3-on-surface-variant">Năm học:</span>
              <span className="font-medium text-m3-on-surface">{cls.academicYear || '---'}</span>
            </div>

            {cls.description && (
              <p className="line-clamp-2 pt-1 text-xs italic text-m3-on-surface-variant/80">
                {cls.description}
              </p>
            )}
          </div>
        </div>

        {/* Card Actions Footer */}
        <div className="mt-5 flex w-full flex-col items-center justify-between gap-2">
          <Button
            type="button"
            colorStyle="tonal"
            size="md"
            fullWidth
            onClick={() => onSelect(cls)}
            icon={<Icon name="groups" size={24} variant='rounded' />}
          >
            Xem học sinh
          </Button>

          {hasManagePermission ? (
            <ButtonDistribute
              weights={canHandover ? [2, 1, 1] : [1, 1]}
              gap={4}
              expandRatio={0}
              size="sm"
            >
              {canHandover && (
                <IconButton
                  type="button"
                  size="sm"
                  colorStyle="outlined"
                  title="Bàn giao quyền lớp"
                  aria-label={`Bàn giao quyền lớp ${cls.name}`}
                  onClick={() => onHandover(cls)}
                  width="narrow"
                >
                  <Icon name="supervisor_account" size={20} />
                </IconButton>
              )}
              <IconButton
                type="button"
                size="sm"
                colorStyle="standard"
                title="Chỉnh sửa lớp"
                aria-label={`Chỉnh sửa lớp ${cls.name}`}
                onClick={() => onEdit(cls)}
                width="narrow"
              >
                <Icon name="edit" size={18} />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                colorStyle="standard"
                title="Xóa lớp"
                aria-label={`Xóa lớp ${cls.name}`}
                onClick={() => onDelete(cls)}
                className="text-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container"
              >
                <Icon name="delete" size={20} />
              </IconButton>
            </ButtonDistribute>
          ) : (
            <Chip
              variant="assist"
              label="Chỉ xem"
              className="pointer-events-none h-6 border-none bg-m3-surface-container-high px-2 text-[11px] text-m3-on-surface-variant"
            />
          )}
        </div>
      </Card>
    );
  }
);

ClassCard.displayName = 'ClassCard';
