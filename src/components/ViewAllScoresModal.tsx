import { useMemo } from 'react';
import type { FC } from 'react';
import { X, FileDown } from 'lucide-react';
import type { Assignment } from '../types/assignment.types';
import type { Student } from '../types/student.types';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

interface DisplayStudentRow {
  id: string;
  name: string;
  calculatedScores: { [assignmentId: string]: number };
  errorsByAssignment: { [assignmentId: string]: string[] };
  totalScore: number;
}

interface AssignmentStatistics {
  assignmentId: string;
  min: number;
  max: number;
  average: number;
}

interface ViewAllScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  students: Student[];
  scores: {
    studentId: string;
    assignmentId: string;
    assignmentName?: string;
    scoreValue: number | null;
    autoGradingErrors?: string[];
  }[];
}

const ViewAllScoresModal: FC<ViewAllScoresModalProps> = ({
  isOpen,
  onClose,
  assignments,
  students,
  scores,
}) => {
  const maxScoreTotal = useMemo(
    () => assignments.reduce((sum, a) => sum + (a.maxScore || 0), 0),
    [assignments]
  );
  const normalizeErrorText = (value: string): string => value.replace(/\s+/g, ' ').trim();
  const toDedupKey = (value: string): string =>
    normalizeErrorText(value)
      .toLowerCase()
      .replace(/[.:;!?]+$/g, '');

  const displayRows = useMemo<DisplayStudentRow[]>(() => {
    if (!isOpen) return [];

    return students.map((student) => {
      const name =
        student.fullName ||
        `${student.middleName || ''} ${student.firstName || ''}`.trim();

      let totalScore = 0;
      const calculatedScores: { [assignmentId: string]: number } = {};
      const errorsByAssignment: { [assignmentId: string]: string[] } = {};

      assignments.forEach((assignment) => {
        const scoreObj = scores.find(
          (s) => s.studentId === student.id && s.assignmentId === assignment.id
        );
        const score =
          typeof scoreObj?.scoreValue === 'number' ? scoreObj.scoreValue : 0;
        calculatedScores[assignment.id] = score;
        totalScore += score;

        const assignmentErrors: string[] = [];
        const seenErrors = new Set<string>();
        (scoreObj?.autoGradingErrors || []).forEach((rawError) => {
          const errorText = normalizeErrorText(rawError || '');
          if (!errorText) return;
          const key = toDedupKey(errorText);
          if (seenErrors.has(key)) return;
          seenErrors.add(key);
          assignmentErrors.push(errorText);
        });
        errorsByAssignment[assignment.id] = assignmentErrors;
      });

      return {
        id: student.id,
        name,
        calculatedScores,
        errorsByAssignment,
        totalScore,
      };
    });
  }, [isOpen, assignments, students, scores]);

  const assignmentStats = useMemo<AssignmentStatistics[]>(() => {
    if (!isOpen) return [];

    return assignments.map((assignment) => {
      const allScores: number[] = students.map((student) => {
        const scoreObj = scores.find(
          (s) => s.studentId === student.id && s.assignmentId === assignment.id
        );
        return typeof scoreObj?.scoreValue === 'number' ? scoreObj.scoreValue : 0;
      });

      const min = allScores.length > 0 ? Math.min(...allScores) : 0;
      const max = allScores.length > 0 ? Math.max(...allScores) : 0;
      const avg =
        allScores.length > 0
          ? parseFloat(
              (allScores.reduce((acc, s) => acc + s, 0) / allScores.length).toFixed(2)
            )
          : 0;

      return { assignmentId: assignment.id, min, max, average: avg };
    });
  }, [isOpen, assignments, students, scores]);

  const classAverageTotal = useMemo(() => {
    if (displayRows.length === 0) return 0;
    const sum = displayRows.reduce((acc, row) => acc + row.totalScore, 0);
    return parseFloat((sum / displayRows.length).toFixed(2));
  }, [displayRows]);

  const highestTotal = useMemo(() => {
    if (displayRows.length === 0) return 0;
    return Math.max(...displayRows.map((r) => r.totalScore));
  }, [displayRows]);

  const lowestTotal = useMemo(() => {
    if (displayRows.length === 0) return 0;
    return Math.min(...displayRows.map((r) => r.totalScore));
  }, [displayRows]);

  const excelHeaders = useMemo(
    () => [
      'Tên học sinh',
      ...assignments.map((a) => `${a.name} (TD: ${a.maxScore})`),
      'TỔNG ĐIỂM',
    ],
    [assignments]
  );

  const excelBody = useMemo(
    () =>
      displayRows.map((row) => [
        row.name,
        ...assignments.map((a) => {
          const score = row.calculatedScores[a.id];
          const errors = row.errorsByAssignment[a.id] || [];
          if (errors.length === 0) return score;
          return `${score} | Lỗi: ${errors.join(' ; ')}`;
        }),
        `${row.totalScore}/${maxScoreTotal}`,
      ]),
    [displayRows, assignments, maxScoreTotal]
  );

  const excelBodyWithStats = useMemo(
    () => [
      ...excelBody,
      [
        'Điểm thấp nhất',
        ...assignmentStats.map((s) => s.min),
        '',
      ],
      [
        'Điểm cao nhất',
        ...assignmentStats.map((s) => s.max),
        '',
      ],
      [
        'Điểm trung bình',
        ...assignmentStats.map((s) => s.average),
        `${classAverageTotal}/${maxScoreTotal}`,
      ],
    ],
    [assignmentStats, classAverageTotal, excelBody, maxScoreTotal]
  );

  const handleExportExcel = () => {
    exportToExcel('BảngĐiểmHọcSinh.xlsx', 'Bảng Điểm', excelHeaders, excelBodyWithStats);
  };

  const handleExportPdf = () => {
    exportToPdf('score-table', 'BảngĐiểmHọcSinh.pdf');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center font-bold">
              SD
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Bảng điểm toàn lớp</h2>
              <p className="text-sm text-slate-500">
                {students.length} học sinh • {assignments.length} bài tập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="text-xs text-blue-600 uppercase font-semibold">Trung bình tổng</div>
            <div className="text-lg font-bold text-blue-800">
              {classAverageTotal}/{maxScoreTotal}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="text-xs text-emerald-600 uppercase font-semibold">Cao nhất</div>
            <div className="text-lg font-bold text-emerald-800">
              {highestTotal}/{maxScoreTotal}
            </div>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
            <div className="text-xs text-rose-600 uppercase font-semibold">Thấp nhất</div>
            <div className="text-lg font-bold text-rose-800">
              {lowestTotal}/{maxScoreTotal}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-4">
          <div id="score-table" className="relative overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-[980px] w-full text-sm text-slate-700">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="sticky left-0 z-30 bg-slate-100 min-w-[220px] px-4 py-3 text-left font-semibold">
                    TÊN HỌC SINH
                  </th>
                  {assignments.map((a) => (
                    <th key={a.id} className="min-w-[130px] px-3 py-3 text-center font-semibold">
                      <div>{a.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">(tối đa {a.maxScore})</div>
                    </th>
                  ))}
                  <th className="sticky right-0 z-30 bg-blue-100 min-w-[140px] px-4 py-3 text-right font-bold text-blue-800">
                    TỔNG ĐIỂM
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayRows.map((studentRow, index) => (
                  <tr
                    key={studentRow.id}
                    className={index % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/70'}
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-medium border-r border-slate-100">
                      {studentRow.name}
                    </td>
                    {assignments.map((assignment) => {
                      const assignmentErrors = studentRow.errorsByAssignment[assignment.id] || [];

                      return (
                        <td key={assignment.id} className="px-3 py-3 text-center align-top">
                          <div>{studentRow.calculatedScores[assignment.id]}</div>
                          {assignmentErrors.length > 0 && (
                            <details className="mt-1 text-left text-xs text-amber-800">
                              <summary className="cursor-pointer font-medium">
                                {assignmentErrors.length} lỗi
                              </summary>
                              <ul className="mt-1 max-h-24 overflow-auto rounded border border-amber-200 bg-amber-50 p-2 text-[11px] list-disc list-inside">
                                {assignmentErrors.map((errorItem, errorIdx) => (
                                  <li key={`${studentRow.id}-${assignment.id}-${errorIdx}`}>{errorItem}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 bg-blue-50 px-4 py-3 text-right font-bold text-blue-800 border-l border-blue-100">
                      {studentRow.totalScore}/{maxScoreTotal}
                    </td>
                  </tr>
                ))}

                <tr className="bg-rose-50 border-t border-rose-100 font-semibold">
                  <td className="sticky left-0 z-10 bg-rose-50 px-4 py-3 text-rose-700 border-r border-rose-100">
                    Điểm thấp nhất
                  </td>
                  {assignmentStats.map((stat) => (
                    <td key={stat.assignmentId} className="px-3 py-3 text-center text-rose-600">
                      {stat.min}
                    </td>
                  ))}
                  <td className="sticky right-0 z-10 bg-rose-50 px-4 py-3 border-l border-rose-100" />
                </tr>

                <tr className="bg-emerald-50 border-t border-emerald-100 font-semibold">
                  <td className="sticky left-0 z-10 bg-emerald-50 px-4 py-3 text-emerald-700 border-r border-emerald-100">
                    Điểm cao nhất
                  </td>
                  {assignmentStats.map((stat) => (
                    <td key={stat.assignmentId} className="px-3 py-3 text-center text-emerald-600">
                      {stat.max}
                    </td>
                  ))}
                  <td className="sticky right-0 z-10 bg-emerald-50 px-4 py-3 border-l border-emerald-100" />
                </tr>

                <tr className="bg-violet-50 border-t border-violet-100 font-semibold">
                  <td className="sticky left-0 z-10 bg-violet-50 px-4 py-3 text-violet-700 border-r border-violet-100">
                    Điểm trung bình
                  </td>
                  {assignmentStats.map((stat) => (
                    <td key={stat.assignmentId} className="px-3 py-3 text-center text-violet-700">
                      {stat.average}
                    </td>
                  ))}
                  <td className="sticky right-0 z-10 bg-violet-50 px-4 py-3 border-l border-violet-100" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-2 p-5 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileDown size={18} /> Xuất Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FileDown size={18} /> Xuất PDF
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAllScoresModal;

