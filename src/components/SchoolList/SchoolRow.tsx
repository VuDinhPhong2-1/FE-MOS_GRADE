import React, { memo } from 'react';
import { Chip, Icon, IconButton } from '@bug-on/m3-expressive';
import type { SchoolRowProps } from './types';

export const SchoolRow = memo(function SchoolRow({
  school,
  index,
  canDeleteSchool,
  isDeleting,
  isCurrentDeleting,
  onSelect,
  onEdit,
  onDelete,
}: SchoolRowProps) {
  const handleRowClick = () => {
    onSelect(school);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(school);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(school);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(school);
  };

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-m3-surface-container-high/60 focus-within:bg-m3-primary/5"
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Xem lớp học của trường ${school.name}`}
      title="Bấm để xem danh sách lớp"
    >
      <td className="px-6 py-4 font-semibold text-m3-on-surface-variant">
        {index + 1}
      </td>
      <td className="px-6 py-4">
        <Chip
          variant="assist"
          label={school.code || '---'}
          className="h-6 px-2.5 text-xs font-bold text-m3-primary border-none bg-m3-surface-container-high pointer-events-none shadow-xs"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
            {school.name}
          </span>
          {school.address && (
            <span className="text-xs text-m3-on-surface-variant line-clamp-1">
              {school.address}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            type="button"
            size="sm"
            colorStyle="standard"
            disabled={isDeleting}
            onClick={handleEdit}
            title="Chỉnh sửa trường"
            aria-label={`Chỉnh sửa trường ${school.name}`}
          >
            <Icon name="edit" className="text-base" />
          </IconButton>
          {canDeleteSchool && (
            <IconButton
              type="button"
              size="sm"
              colorStyle="standard"
              disabled={isDeleting}
              loading={isCurrentDeleting}
              onClick={handleDelete}
              className="text-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container"
              title="Xóa trường"
              aria-label={`Xóa trường ${school.name}`}
            >
              <Icon name="delete" className="text-base" />
            </IconButton>
          )}
          <IconButton
            type="button"
            size="sm"
            colorStyle="standard"
            disabled={isDeleting}
            onClick={handleRowClick}
            className="text-m3-primary"
            title="Xem danh sách lớp"
            aria-label={`Xem danh sách lớp của ${school.name}`}
          >
            <Icon name="chevron_right" className="text-base" />
          </IconButton>
        </div>
      </td>
    </tr>
  );
});
