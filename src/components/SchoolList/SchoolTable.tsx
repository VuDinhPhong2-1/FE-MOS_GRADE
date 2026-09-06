import { memo } from 'react';
import { Button, Card, Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import { SchoolRow } from './SchoolRow';
import type { SchoolTableProps } from './types';

export const SchoolTable = memo(function SchoolTable({
  schools,
  isLoading,
  canDeleteSchool,
  isDeleting,
  schoolToDelete,
  onSelectSchool,
  onEditSchool,
  onDeleteSchool,
  onOpenAddModal,
}: SchoolTableProps) {
  return (
    <Card
      variant="filled"
      className="relative overflow-hidden rounded-3xl bg-m3-surface-container p-0 shadow-xs border-none"
    >
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <ProgressIndicator
            variant="linear"
            shape="wavy"
            aria-label="Đang tải dữ liệu trường học"
            className="w-full"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-140 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-m3-outline-variant/60 bg-m3-surface-container-high text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
              <th className="w-16 px-6 py-4">STT</th>
              <th className="px-6 py-4">Mã trường</th>
              <th className="px-6 py-4">Tên trường</th>
              <th className="w-36 px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-m3-outline-variant/40 text-sm">
            {schools.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-m3-surface-container-high text-m3-on-surface-variant">
                      <Icon name="domain_disabled" className="text-3xl" />
                    </div>
                    <div>
                      <p className="font-bold text-m3-on-surface">Chưa có trường nào</p>
                      <p className="mt-1 text-xs text-m3-on-surface-variant">
                        Hãy bấm nút "Thêm trường" để bắt đầu thiết lập cơ sở đầu tiên.
                      </p>
                    </div>
                    <Button
                      colorStyle="filled"
                      size="sm"
                      icon={<Icon name="add" className="text-base" />}
                      onClick={onOpenAddModal}
                    >
                      Thêm trường mới
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              schools.map((sch, index) => (
                <SchoolRow
                  key={sch.id}
                  school={sch}
                  index={index}
                  canDeleteSchool={canDeleteSchool}
                  isDeleting={isDeleting}
                  isCurrentDeleting={isDeleting && schoolToDelete?.id === sch.id}
                  onSelect={onSelectSchool}
                  onEdit={onEditSchool}
                  onDelete={onDeleteSchool}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
});
