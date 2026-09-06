import { Icon, TabsContent } from '@bug-on/m3-expressive';
import type {
  ScheduleAttendanceResponse,
  ScheduleEndLessonReport,
  ScheduleProfessionalReport,
  ScheduleReportsPayload,
  ScheduleStartLessonReport,
} from '../../types/schedule.types';

interface ReportTabContentProps {
  reportsDraft: ScheduleReportsPayload;
  hasRoomSnapshot: boolean;
  attendanceData: ScheduleAttendanceResponse;
  onUpdateStartLessonField: (
    field: keyof ScheduleStartLessonReport,
    value: string
  ) => void;
  onUpdateProfessionalField: (
    field: keyof ScheduleProfessionalReport,
    value: string
  ) => void;
  onUpdateEndLessonField: (
    field: keyof ScheduleEndLessonReport,
    value: string
  ) => void;
}

export const ReportTabContent = ({
  reportsDraft,
  hasRoomSnapshot,
  attendanceData,
  onUpdateStartLessonField,
  onUpdateProfessionalField,
  onUpdateEndLessonField,
}: ReportTabContentProps) => {
  return (
    <>
      <TabsContent value="startLesson" className="pt-3">
        <div className="space-y-4 rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <Icon name="description" className="text-base text-m3-primary" />
            <h4 className="font-bold text-m3-primary">BÁO CÁO ĐẦU BUỔI DẠY</h4>
          </div>
          {hasRoomSnapshot && (
            <p className="text-xs text-m3-primary/80">
              Các trường liên quan phòng máy được tự động lấy từ cấu hình phòng
              máy trong database.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tên giáo viên
              </span>
              <input
                value={reportsDraft.startLesson.teacherName}
                onChange={(e) =>
                  onUpdateStartLessonField('teacherName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Tên trợ giảng</span>
              <input
                value={reportsDraft.startLesson.assistantName}
                onChange={(e) =>
                  onUpdateStartLessonField('assistantName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Phòng máy</span>
              <input
                value={reportsDraft.startLesson.roomName}
                onChange={(e) =>
                  onUpdateStartLessonField('roomName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Tổng số máy</span>
              <input
                value={reportsDraft.startLesson.totalMachines}
                onChange={(e) =>
                  onUpdateStartLessonField('totalMachines', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-m3-on-surface">
                Tổng số máy lỗi (mô tả)
              </span>
              <input
                value={reportsDraft.startLesson.brokenMachinesSummary}
                onChange={(e) =>
                  onUpdateStartLessonField(
                    'brokenMachinesSummary',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Số máy thiếu cho học sinh
              </span>
              <input
                value={reportsDraft.startLesson.missingMachinesForStudents}
                onChange={(e) =>
                  onUpdateStartLessonField(
                    'missingMachinesForStudents',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tình trạng NetSupport
              </span>
              <input
                value={reportsDraft.startLesson.netSupportStatus}
                onChange={(e) =>
                  onUpdateStartLessonField('netSupportStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tình trạng loa, âm ly
              </span>
              <input
                value={reportsDraft.startLesson.audioStatus}
                onChange={(e) =>
                  onUpdateStartLessonField('audioStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tình trạng máy lạnh, quạt
              </span>
              <input
                value={reportsDraft.startLesson.coolingStatus}
                onChange={(e) =>
                  onUpdateStartLessonField('coolingStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-m3-on-surface">
                Tình trạng vệ sinh phòng máy
              </span>
              <input
                value={reportsDraft.startLesson.hygieneStatus}
                onChange={(e) =>
                  onUpdateStartLessonField('hygieneStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="professional" className="pt-3">
        <div className="space-y-4 rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <Icon name="menu_book" className="text-base text-m3-secondary" />
            <h4 className="font-bold text-m3-secondary">BÁO CÁO CHUYÊN MÔN</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tên giáo viên
              </span>
              <input
                value={reportsDraft.professional.teacherName}
                onChange={(e) =>
                  onUpdateProfessionalField('teacherName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Lớp</span>
              <input
                value={reportsDraft.professional.className}
                onChange={(e) =>
                  onUpdateProfessionalField('className', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Môn</span>
              <input
                value={reportsDraft.professional.subjectName}
                onChange={(e) =>
                  onUpdateProfessionalField('subjectName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Tài liệu dạy</span>
              <input
                value={reportsDraft.professional.teachingMaterials}
                onChange={(e) =>
                  onUpdateProfessionalField('teachingMaterials', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-m3-on-surface">
                Nội dung dạy
              </span>
              <textarea
                value={reportsDraft.professional.teachingContent}
                onChange={(e) =>
                  onUpdateProfessionalField('teachingContent', e.target.value)
                }
                className="min-h-20 w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface p-3 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Số tiết dự kiến
              </span>
              <input
                value={reportsDraft.professional.plannedLessons}
                onChange={(e) =>
                  onUpdateProfessionalField('plannedLessons', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Số tiết đã dạy
              </span>
              <input
                value={reportsDraft.professional.taughtLessons}
                onChange={(e) =>
                  onUpdateProfessionalField('taughtLessons', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Số lần hoàn thành OTTH
              </span>
              <input
                value={reportsDraft.professional.ongoingPracticeCompletions}
                onChange={(e) =>
                  onUpdateProfessionalField(
                    'ongoingPracticeCompletions',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tỷ lệ kết quả Gmetrix
              </span>
              <input
                value={reportsDraft.professional.gmetrixResultRate}
                onChange={(e) =>
                  onUpdateProfessionalField('gmetrixResultRate', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="endLesson" className="pt-3">
        <div className="space-y-4 rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <Icon name="assignment" className="text-base text-m3-tertiary" />
            <h4 className="font-bold text-m3-tertiary">BÁO CÁO CUỐI BUỔI DẠY</h4>
          </div>
          {hasRoomSnapshot && (
            <p className="text-xs text-m3-tertiary/80">
              Các trường liên quan phòng máy được tự động lấy từ cấu hình phòng
              máy trong database.
            </p>
          )}
          <div className="rounded-2xl border border-m3-tertiary/30 bg-m3-tertiary-container/20 px-4 py-2.5 text-xs text-m3-on-tertiary-container">
            {attendanceData.roomSessionContext?.isSharedRoomSession
              ? `Đang là báo cáo cuối buổi dùng chung cho ${attendanceData.roomSessionContext.sharedClasses.length} lớp cùng phòng (${attendanceData.roomSessionContext.sessionLabel.toLowerCase()}).`
              : 'Chỉ có 1 lớp trong cùng phòng/buổi nên báo cáo cuối buổi áp dụng cho lịch hiện tại.'}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tên giáo viên
              </span>
              <input
                value={reportsDraft.endLesson.teacherName}
                onChange={(e) =>
                  onUpdateEndLessonField('teacherName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Tên trợ giảng</span>
              <input
                value={reportsDraft.endLesson.assistantName}
                onChange={(e) =>
                  onUpdateEndLessonField('assistantName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Phòng máy</span>
              <input
                value={reportsDraft.endLesson.roomName}
                onChange={(e) =>
                  onUpdateEndLessonField('roomName', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">Tổng số máy</span>
              <input
                value={reportsDraft.endLesson.totalMachines}
                onChange={(e) =>
                  onUpdateEndLessonField('totalMachines', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-m3-on-surface">
                Số lượng học sinh các lớp cùng phòng
              </span>
              <input
                value={reportsDraft.endLesson.classStudentCountSummary}
                onChange={(e) =>
                  onUpdateEndLessonField(
                    'classStudentCountSummary',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tỷ lệ học sinh có tài liệu
              </span>
              <input
                value={reportsDraft.endLesson.studentMaterialCoverageRate}
                onChange={(e) =>
                  onUpdateEndLessonField(
                    'studentMaterialCoverageRate',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tổng số máy lỗi (mô tả)
              </span>
              <input
                value={reportsDraft.endLesson.brokenMachinesSummary}
                onChange={(e) =>
                  onUpdateEndLessonField(
                    'brokenMachinesSummary',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tình trạng NetSupport
              </span>
              <input
                value={reportsDraft.endLesson.netSupportStatus}
                onChange={(e) =>
                  onUpdateEndLessonField('netSupportStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tình trạng loa, âm ly
              </span>
              <input
                value={reportsDraft.endLesson.audioStatus}
                onChange={(e) =>
                  onUpdateEndLessonField('audioStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tình trạng máy lạnh, quạt
              </span>
              <input
                value={reportsDraft.endLesson.coolingStatus}
                onChange={(e) =>
                  onUpdateEndLessonField('coolingStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Đã tắt các thiết bị điện
              </span>
              <input
                value={reportsDraft.endLesson.devicesPoweredOffStatus}
                onChange={(e) =>
                  onUpdateEndLessonField(
                    'devicesPoweredOffStatus',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                HS sắp xếp ghế ngồi
              </span>
              <input
                value={reportsDraft.endLesson.seatingOrderStatus}
                onChange={(e) =>
                  onUpdateEndLessonField('seatingOrderStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                HS vệ sinh phòng máy
              </span>
              <input
                value={reportsDraft.endLesson.roomHygieneStatus}
                onChange={(e) =>
                  onUpdateEndLessonField('roomHygieneStatus', e.target.value)
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                disabled={hasRoomSnapshot}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-m3-on-surface">
                Tuân thủ nội quy của HS
              </span>
              <input
                value={reportsDraft.endLesson.studentRuleComplianceStatus}
                onChange={(e) =>
                  onUpdateEndLessonField(
                    'studentRuleComplianceStatus',
                    e.target.value
                  )
                }
                className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-m3-on-surface">
                Danh sách vi phạm
              </span>
              <textarea
                value={reportsDraft.endLesson.violationListSummary}
                onChange={(e) =>
                  onUpdateEndLessonField('violationListSummary', e.target.value)
                }
                className="min-h-20 w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface p-3 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
              />
            </label>
          </div>
        </div>
      </TabsContent>
    </>
  );
};
