import { useState } from 'react';
import { Icon } from '@bug-on/m3-expressive';
import type { Student } from '../../types/student.types';
import {
  parsePastedRows,
  mapRowsToTempStudents,
} from './utils/studentExcelParser';

interface PasteStudentModalProps {
  isOpen: boolean;
  readOnly: boolean;
  onClose: () => void;
  onImportStudents: (students: Student[]) => void;
}

export const PasteStudentModal = ({
  isOpen,
  readOnly,
  onClose,
  onImportStudents,
}: PasteStudentModalProps) => {
  const [pasteInput, setPasteInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setPasteInput('');
    setError('');
    onClose();
  };

  const handleImport = () => {
    if (readOnly) return;

    if (!pasteInput.trim()) {
      setError('Bạn chưa dán dữ liệu.');
      return;
    }

    const rows = parsePastedRows(pasteInput);
    const list = mapRowsToTempStudents(rows);

    if (list.length === 0) {
      setError('Dữ liệu cần có tối thiểu 2 cột: Họ và tên đệm, Tên.');
      return;
    }

    onImportStudents(list);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Dán danh sách học sinh</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            <Icon name="close" variant="rounded" size={18} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <p className="text-sm text-gray-600">
            Copy trực tiếp 2 cột từ Excel theo thứ tự: <strong>Họ và tên đệm</strong>,{' '}
            <strong>Tên</strong>, rồi dán vào ô bên dưới.
          </p>
          <textarea
            value={pasteInput}
            onChange={(event) => {
              setError('');
              setPasteInput(event.target.value);
            }}
            placeholder={'Ví dụ:\nNinh Hoàng\tAnh\nNguyễn Phan\tAnh'}
            className="h-64 w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Dán và thêm vào danh sách
          </button>
        </div>
      </div>
    </div>
  );
};
