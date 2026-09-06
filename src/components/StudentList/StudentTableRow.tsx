import { memo } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import type { Student } from '../../types/student.types';
import type { CompetencyLevel } from './types';
import {
  VALID_COMPETENCY_LEVELS,
  isStudentActive,
  competencyBadgeClass,
} from './types';

interface StudentTableRowProps {
  student: Student;
  index: number;
  readOnly: boolean;
  isSaving: boolean;
  onCompetencyChange: (student: Student, level: CompetencyLevel) => void;
  onExamToggle: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

const StudentTableRowComponent = ({
  student,
  index,
  readOnly,
  isSaving,
  onCompetencyChange,
  onExamToggle,
  onEdit,
  onDelete,
}: StudentTableRowProps) => {
  const isActive = isStudentActive(student);
  const isTemp = student.id.startsWith('temp-');

  return (
    <tr
      className={`transition-colors ${isActive ? 'hover:bg-sky-50/70' : 'bg-rose-50/70 hover:bg-rose-100/70'
        }`}
    >
      <td className="px-3 py-4 text-slate-500 sm:px-6">{index + 1}</td>
      <td className="px-3 py-4 font-medium text-slate-900 sm:px-6">{student.middleName}</td>
      <td className="px-3 py-4 font-medium text-slate-900 sm:px-6">{student.firstName}</td>

      {/* Competency Level */}
      <td className="px-3 py-4 text-center sm:px-6">
        <div className="flex flex-col items-center gap-1">
          <select
            value={student.competencyLevel || ''}
            disabled={readOnly || isSaving}
            onChange={(event) =>
              onCompetencyChange(student, event.target.value as CompetencyLevel)
            }
            className={`w-18 rounded-full border px-2 py-1 text-center text-xs font-semibold outline-none transition ${competencyBadgeClass(
              student.competencyLevel
            )} ${isSaving ? 'cursor-not-allowed opacity-70' : 'hover:brightness-95'}`}
            title={
              isTemp
                ? 'Học sinh tạm, sẽ lưu cùng danh sách học sinh.'
                : 'Cập nhật nhanh năng lực'
            }
          >
            <option value="">--</option>
            {VALID_COMPETENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {isSaving && <span className="text-[10px] text-slate-500">Đang lưu...</span>}
        </div>
      </td>

      {/* Notes */}
      <td className="px-3 py-4 text-slate-700 sm:px-6">
        <div className="max-w-65 truncate" title={student.notes || ''}>
          {student.notes?.trim() || '--'}
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-4 text-center sm:px-6">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${isActive
              ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
              : 'bg-rose-100 text-rose-700 ring-rose-200'
            }`}
        >
          {isActive ? (
            <Icon name="check_circle" variant="rounded" size={13} />
          ) : (
            <Icon name="cancel" variant="rounded" size={13} />
          )}
          {isActive ? 'Hoạt động' : 'Ngừng'}
        </span>
      </td>

      {/* Exam Switch */}
      <td className="px-3 py-4 text-center sm:px-6">
        <button
          type="button"
          role="switch"
          aria-checked={student.thi ?? false}
          onClick={() => onExamToggle(student)}
          disabled={readOnly || isSaving}
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${student.thi
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-100 text-slate-600'
            } ${readOnly || isSaving ? 'cursor-not-allowed opacity-60' : 'hover:brightness-95'}`}
          title={
            student.thi
              ? 'Click to switch to Not Taking Exam'
              : 'Click to switch to Taking Exam'
          }
        >
          <span
            className={`relative h-4 w-8 rounded-full transition ${student.thi ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${student.thi ? 'left-4' : 'left-0.5'
                }`}
            />
          </span>
          <span>{student.thi ? 'Taking Exam' : 'Not Taking Exam'}</span>
          {isSaving && (
            <ProgressIndicator
              variant="circular"
              shape="wavy"
              showTrack
              size={12}
              aria-label="Đang lưu..."
            />
          )}
        </button>
      </td>

      {/* Actions */}
      <td className="px-3 py-4 text-center sm:px-6">
        {!readOnly ? (
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(student)}
              disabled={isTemp}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Icon name="edit" variant="rounded" size={14} />
              Sửa
            </button>
            <button
              type="button"
              onClick={() => onDelete(student)}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
            >
              <Icon name="delete" variant="rounded" size={14} />
              Xóa
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Chỉ xem</span>
        )}
      </td>
    </tr>
  );
};

export const StudentTableRow = memo(
  StudentTableRowComponent,
  (prev, next) =>
    prev.student === next.student &&
    prev.index === next.index &&
    prev.readOnly === next.readOnly &&
    prev.isSaving === next.isSaving &&
    prev.onCompetencyChange === next.onCompetencyChange &&
    prev.onExamToggle === next.onExamToggle &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete
);
