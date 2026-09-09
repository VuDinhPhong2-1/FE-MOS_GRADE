import type { FormEvent } from 'react';
import { Button, Checkbox, Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import type { ComputerRoom } from '../../types/computer-room.types';
import type { School } from '../../types/school.types';
import type { ComputerRoomFormState } from './types';
import { getRoomConditionTone } from './utils';

interface RoomManagerModalProps {
  open: boolean;
  roomManagerSchoolId: string;
  roomManagerRows: ComputerRoom[];
  roomManagerLoading: boolean;
  editingRoomId: string;
  roomSubmitting: boolean;
  roomForm: ComputerRoomFormState;
  schools: School[];
  selectedRoomManagerSchool: School | null;
  roomManagerSummary: {
    totalRooms: number;
    activeRooms: number;
    totalMachines: number;
    availableMachines: number;
  };
  roomFormMachinePreview: {
    totalMachines: number;
    availableMachines: number;
  };
  onClose: () => void;
  onSchoolChange: (schoolId: string) => void;
  onResetForm: (schoolId: string) => void;
  onEditRoom: (room: ComputerRoom) => void;
  onDeleteRoom: (room: ComputerRoom) => void;
  onSaveRoom: (e: FormEvent<HTMLFormElement>) => void;
  onRoomFormFieldChange: <K extends keyof ComputerRoomFormState>(
    field: K,
    value: ComputerRoomFormState[K]
  ) => void;
}

export const RoomManagerModal = ({
  open,
  roomManagerSchoolId,
  roomManagerRows,
  roomManagerLoading,
  editingRoomId,
  roomSubmitting,
  roomForm,
  schools,
  selectedRoomManagerSchool,
  roomManagerSummary,
  roomFormMachinePreview,
  onClose,
  onSchoolChange,
  onResetForm,
  onEditRoom,
  onDeleteRoom,
  onSaveRoom,
  onRoomFormFieldChange,
}: RoomManagerModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-0 backdrop-blur-xs sm:grid sm:place-items-center sm:p-4">
      <div className="flex h-dvh w-full flex-col overflow-hidden rounded-none bg-m3-surface-container shadow-2xl sm:h-auto sm:max-h-[94vh] sm:max-w-7xl sm:rounded-4xl">
        <div
          className="border-b border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-4 sm:px-6 shadow-xs"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-m3-primary to-m3-primary/80 text-m3-on-primary shadow-md">
                <Icon name="desktop_windows" className="text-2xl" />
              </div>
              <div className="space-y-2">
                <div>
                  <h3 className="text-xl font-bold text-m3-on-surface font-md3-expressive">
                    Quản lý phòng máy
                  </h3>
                  <p className="mt-1 text-sm text-m3-on-surface-variant">
                    Cấu hình phòng máy theo từng trường để dùng cho lịch dạy,
                    điểm danh và báo cáo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="inline-flex items-center gap-1 rounded-full border border-m3-primary/30 bg-m3-primary/10 px-3 py-1 text-m3-primary">
                    <Icon name="domain" className="text-xs" />
                    {selectedRoomManagerSchool?.name || 'Chưa chọn trường'}
                  </span>
                  <span className="rounded-full border border-m3-outline-variant bg-m3-surface px-3 py-1 text-m3-on-surface-variant">
                    {roomManagerSummary.totalRooms} phòng
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                    {roomManagerSummary.activeRooms} đang hoạt động
                  </span>
                </div>
              </div>
            </div>
            <Button
              type="button"
              colorStyle="outlined"
              size="sm"
              onClick={onClose}
            >
              <Icon name="close" className="text-base" />
              Đóng
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-m3-surface p-4 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_400px]">
            <div className="space-y-4">
              <div className="rounded-3xl bg-m3-surface-container-high p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex-1">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-semibold text-m3-on-surface">
                        Trường áp dụng
                      </span>
                      <div className="relative">
                        <select
                          value={roomManagerSchoolId}
                          onChange={(event) => {
                            const nextSchoolId = event.target.value;
                            onSchoolChange(nextSchoolId);
                            onResetForm(nextSchoolId);
                          }}
                          className="min-w-65 w-full appearance-none rounded-xl border border-m3-outline-variant bg-m3-surface px-3.5 py-2.5 pr-9 text-m3-on-surface focus:border-m3-primary focus:outline-hidden"
                        >
                          <option value="">-- Chọn trường --</option>
                          {schools.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <Icon
                          name="expand_more"
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant text-base"
                        />
                      </div>
                    </label>
                  </div>

                  <Button
                    type="button"
                    colorStyle="filled"
                    size="sm"
                    icon={<Icon name="add" className="text-base" />}
                    onClick={() => onResetForm(roomManagerSchoolId)}
                  >
                    Tạo phòng mới
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-m3-outline-variant/60 bg-m3-surface p-3.5 shadow-2xs">
                    <div className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
                      Tổng phòng
                    </div>
                    <div className="mt-2 text-2xl font-bold text-m3-on-surface">
                      {roomManagerSummary.totalRooms}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-m3-primary/30 bg-m3-primary/10 p-3.5 shadow-2xs">
                    <div className="text-xs font-semibold uppercase tracking-wider text-m3-primary">
                      Máy sẵn sàng
                    </div>
                    <div className="mt-2 text-2xl font-bold text-m3-primary">
                      {roomManagerSummary.availableMachines}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-m3-secondary/30 bg-m3-secondary/10 p-3.5 shadow-2xs">
                    <div className="text-xs font-semibold uppercase tracking-wider text-m3-secondary">
                      Tổng thiết bị
                    </div>
                    <div className="mt-2 text-2xl font-bold text-m3-secondary">
                      {roomManagerSummary.totalMachines}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-m3-surface-container-high overflow-hidden shadow-xs">
                <div className="flex items-center justify-between border-b border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3">
                  <div>
                    <h4 className="text-base font-bold text-m3-on-surface">
                      Danh sách phòng máy
                    </h4>
                    <p className="text-xs text-m3-on-surface-variant">
                      Chọn một phòng để chỉnh sửa nhanh cấu hình và trạng thái
                      vận hành.
                    </p>
                  </div>
                  <span className="rounded-full border border-m3-outline-variant bg-m3-surface px-3 py-1 text-xs font-semibold text-m3-on-surface-variant">
                    {roomManagerRows.length} mục
                  </span>
                </div>
                <div className="max-h-[58vh] overflow-y-auto bg-m3-surface-container/50 p-3 sm:p-4">
                  {roomManagerLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <ProgressIndicator
                        variant="circular"
                        shape="wavy"
                        size={28}
                        aria-label="Đang tải phòng máy..."
                      />
                      <p className="text-xs text-m3-on-surface-variant font-medium">
                        Đang tải phòng máy...
                      </p>
                    </div>
                  )}

                  {!roomManagerLoading && roomManagerRows.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-m3-outline-variant/60 bg-m3-surface px-4 py-10 text-center text-sm text-m3-on-surface-variant">
                      Chưa có phòng máy nào trong trường này.
                    </div>
                  )}

                  {!roomManagerLoading && roomManagerRows.length > 0 && (
                    <div className="space-y-3">
                      {roomManagerRows.map((room) => (
                        <article
                          key={room.id}
                          className={`group rounded-2xl border p-4 shadow-2xs transition-all ${
                            editingRoomId === room.id
                              ? 'border-m3-primary bg-m3-primary/10 shadow-xs'
                              : 'border-m3-outline-variant/60 bg-m3-surface hover:bg-m3-surface-container-high/50'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-lg font-bold text-m3-on-surface">
                                  {room.name}
                                </h5>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    room.isActive
                                      ? 'bg-m3-primary-container text-m3-on-primary-container'
                                      : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                                  }`}
                                >
                                  {room.isActive ? 'Đang dùng' : 'Tạm ẩn'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-m3-on-surface-variant">
                                Tổng {room.totalMachinesText} · Máy lỗi{' '}
                                {room.brokenMachineCount} · Dùng được{' '}
                                {room.availableStudentMachines}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                colorStyle="outlined"
                                size="xs"
                                icon={<Icon name="edit" className="text-xs" />}
                                onClick={() => onEditRoom(room)}
                              >
                                Sửa
                              </Button>
                              <Button
                                type="button"
                                colorStyle="outlined"
                                size="xs"
                                className="border-m3-error/40! text-m3-error! hover:bg-m3-error-container/20!"
                                icon={
                                  <Icon name="delete" className="text-xs" />
                                }
                                onClick={() => onDeleteRoom(room)}
                              >
                                Xóa
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-4">
                            <div className="rounded-xl bg-m3-surface-container px-3 py-2">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-on-surface-variant">
                                Máy HS
                              </div>
                              <div className="mt-1 text-base font-bold text-m3-on-surface">
                                {room.studentMachineCount}
                              </div>
                            </div>
                            <div className="rounded-xl bg-m3-surface-container px-3 py-2">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-on-surface-variant">
                                Máy GV
                              </div>
                              <div className="mt-1 text-base font-bold text-m3-on-surface">
                                {room.teacherMachineCount}
                              </div>
                            </div>
                            <div className="rounded-xl border border-m3-primary/30 bg-m3-primary-container/20 px-3 py-2">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-primary">
                                Khả dụng
                              </div>
                              <div className="mt-1 text-base font-bold text-m3-primary">
                                {room.availableStudentMachines}
                              </div>
                            </div>
                            <div className="rounded-xl border border-m3-error/30 bg-m3-error-container/20 px-3 py-2">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-m3-error">
                                Máy lỗi
                              </div>
                              <div className="mt-1 text-base font-bold text-m3-error">
                                {room.brokenMachineCount}
                              </div>
                            </div>
                          </div>

                          {room.brokenMachinesDetail ? (
                            <p className="mt-2 rounded-xl border border-m3-error/40 bg-m3-error-container/20 px-3 py-1.5 text-xs text-m3-on-error-container">
                              Chi tiết máy hỏng: {room.brokenMachinesDetail}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {[
                              {
                                label: 'NetSupport',
                                value: room.netSupportStatus,
                              },
                              { label: 'Âm thanh', value: room.audioStatus },
                              { label: 'Làm mát', value: room.coolingStatus },
                              {
                                label: 'Vệ sinh',
                                value: room.roomHygieneStatus,
                              },
                            ].map((item) => (
                              <span
                                key={`${room.id}-${item.label}`}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getRoomConditionTone(
                                  item.value
                                )}`}
                              >
                                {item.label}: {item.value || 'Chưa cập nhật'}
                              </span>
                            ))}
                          </div>

                          <p className="mt-3 text-xs text-m3-on-surface-variant">
                            Tắt điện:{' '}
                            {room.devicesPoweredOffStatus || 'Chưa cập nhật'} ·
                            Xếp ghế:{' '}
                            {room.seatingOrderStatus || 'Chưa cập nhật'}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form
              onSubmit={onSaveRoom}
              className="flex min-h-160 flex-col overflow-hidden rounded-3xl bg-m3-surface-container shadow-xs"
            >
              <div className="border-b border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-m3-on-surface">
                      {editingRoomId
                        ? 'Chỉnh sửa phòng máy'
                        : 'Tạo phòng máy mới'}
                    </h4>
                    <p className="mt-1 text-sm text-m3-on-surface-variant">
                      {editingRoomId
                        ? 'Cập nhật nhanh cấu hình và tình trạng vận hành của phòng đang chọn.'
                        : 'Khai báo một phòng máy chuẩn để dùng xuyên suốt cho lịch dạy và báo cáo.'}
                    </p>
                  </div>
                  {editingRoomId && (
                    <span className="rounded-full border border-m3-primary/30 bg-m3-primary/10 px-3 py-1 text-xs font-semibold text-m3-primary">
                      Đang sửa
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-m3-primary/30 bg-m3-primary/10 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-m3-primary">
                      Tổng máy dự kiến
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-m3-primary">
                      {roomFormMachinePreview.totalMachines}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-m3-secondary/30 bg-m3-secondary/10 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-m3-secondary">
                      Máy dùng được
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-m3-secondary">
                      {roomFormMachinePreview.availableMachines}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-m3-surface p-4">
                <div className="rounded-2xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 shadow-xs">
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-m3-on-surface">
                      Tên phòng máy *
                    </span>
                    <input
                      value={roomForm.name}
                      onChange={(event) =>
                        onRoomFormFieldChange('name', event.target.value)
                      }
                      placeholder="Ví dụ: PM 01 hoặc Phòng máy A"
                      className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2.5 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                      required
                    />
                  </label>
                </div>

                <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 shadow-xs">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon name="build" className="text-base text-m3-primary" />
                    <h5 className="text-sm font-bold text-m3-on-surface">
                      Cấu hình thiết bị
                    </h5>
                  </div>
                  <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(108px,1fr))]">
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="font-medium leading-snug text-m3-on-surface">
                        Số máy HS
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={roomForm.studentMachineCount}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'studentMachineCount',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                        required
                      />
                    </label>
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="font-medium leading-snug text-m3-on-surface">
                        Số máy GV
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={roomForm.teacherMachineCount}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'teacherMachineCount',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                        required
                      />
                    </label>
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="font-medium leading-snug text-m3-on-surface">
                        Máy lỗi
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={roomForm.brokenMachineCount}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'brokenMachineCount',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                        required
                      />
                    </label>
                  </div>

                  <label className="mt-3 grid gap-1.5 text-sm">
                    <span className="font-medium leading-snug text-m3-on-surface">
                      Chi tiết máy hỏng (nhập tay)
                    </span>
                    <textarea
                      value={roomForm.brokenMachinesDetail}
                      onChange={(event) =>
                        onRoomFormFieldChange(
                          'brokenMachinesDetail',
                          event.target.value
                        )
                      }
                      placeholder="Ví dụ: PC 32 hỏng màn hình, PC 15 mất chuột..."
                      className="min-h-18 w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface p-3 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                    />
                    <span className="text-xs text-m3-on-surface-variant">
                      Mô tả cụ thể từng máy hỏng — không ảnh hưởng tới số lượng máy
                      lỗi ở trên.
                    </span>
                  </label>
                </div>

                <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 shadow-xs">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon
                      name="auto_awesome"
                      className="text-base text-m3-primary"
                    />
                    <h5 className="text-sm font-bold text-m3-on-surface">
                      Tình trạng trước giờ học
                    </h5>
                  </div>
                  <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="flex items-start gap-1.5 font-medium leading-snug text-m3-on-surface">
                        <Icon
                          name="desktop_windows"
                          className="mt-0.5 shrink-0 text-sm text-m3-on-surface-variant/60"
                        />
                        <span className="min-w-0">Tình trạng NetSupport</span>
                      </span>
                      <input
                        value={roomForm.netSupportStatus}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'netSupportStatus',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="flex items-start gap-1.5 font-medium leading-snug text-m3-on-surface">
                        <Icon
                          name="volume_up"
                          className="mt-0.5 shrink-0 text-sm text-m3-on-surface-variant/60"
                        />
                        <span className="min-w-0">Tình trạng loa, âm ly</span>
                      </span>
                      <input
                        value={roomForm.audioStatus}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'audioStatus',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="flex items-start gap-1.5 font-medium leading-snug text-m3-on-surface">
                        <Icon
                          name="air"
                          className="mt-0.5 shrink-0 text-sm text-m3-on-surface-variant/60"
                        />
                        <span className="min-w-0">
                          Tình trạng máy lạnh, quạt
                        </span>
                      </span>
                      <input
                        value={roomForm.coolingStatus}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'coolingStatus',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="font-medium leading-snug text-m3-on-surface">
                        HS vệ sinh phòng máy
                      </span>
                      <input
                        value={roomForm.roomHygieneStatus}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'roomHygieneStatus',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 shadow-xs">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon
                      name="power_settings_new"
                      className="text-base text-m3-primary"
                    />
                    <h5 className="text-sm font-bold text-m3-on-surface">
                      Tình trạng sau giờ học
                    </h5>
                  </div>
                  <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="font-medium leading-snug text-m3-on-surface">
                        Đã tắt thiết bị điện
                      </span>
                      <input
                        value={roomForm.devicesPoweredOffStatus}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'devicesPoweredOffStatus',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="font-medium leading-snug text-m3-on-surface">
                        HS xếp ghế gọn gàng
                      </span>
                      <input
                        value={roomForm.seatingOrderStatus}
                        onChange={(event) =>
                          onRoomFormFieldChange(
                            'seatingOrderStatus',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                      />
                    </label>
                  </div>
                </div>

                {editingRoomId && (
                  <div className="pt-1">
                    <Checkbox
                      checked={roomForm.isActive}
                      onCheckedChange={(checked) =>
                        onRoomFormFieldChange('isActive', checked)
                      }
                      label="Phòng đang hoạt động"
                    />
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-4 sm:px-6">
                <div className="flex flex-wrap justify-end gap-2">
                  {editingRoomId && (
                    <Button
                      type="button"
                      colorStyle="outlined"
                      size="sm"
                      onClick={() => onResetForm(roomManagerSchoolId)}
                    >
                      Hủy sửa
                    </Button>
                  )}
                  <Button
                    type="submit"
                    colorStyle="filled"
                    size="sm"
                    disabled={roomSubmitting}
                    loading={roomSubmitting}
                    icon={
                      <Icon
                        name={editingRoomId ? 'edit' : 'add'}
                        className="text-sm"
                      />
                    }
                  >
                    {editingRoomId ? 'Lưu phòng máy' : 'Tạo phòng máy'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div
          className="shrink-0 border-t border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3 sm:px-6"
          style={{
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex justify-end">
            <Button
              type="button"
              colorStyle="tonal"
              size="sm"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
