import { useState } from 'react';
import { Upload, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { gradeProject } from '../services/api';
import type { GradingResult } from '../types';
import ResultCard from '../components/ResultCard';

const GradingView = () => {
  const [projectCode, setProjectCode] = useState('project09');
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async () => {
    if (!studentFile) {
      alert('Vui long chon file bai lam hoc sinh!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await gradeProject(projectCode, studentFile);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Co loi xay ra khi cham diem.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStudentFile(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Cham diem bai thi MOS</h1>

      {!result ? (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chon Project de bai</label>
            <select
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
            >
              <option value="project09">Project 09 - Sales and Orders Report</option>
              <option value="project10">Project 10</option>
              <option value="project01">Project 01</option>
            </select>
          </div>

          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
              <input
                type="file"
                accept=".xlsx, .xlsm"
                onChange={(e) => setStudentFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
                id="student-upload"
              />
              <label htmlFor="student-upload" className="cursor-pointer text-center">
                <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">File bai lam hoc sinh</span>
                {studentFile && (
                  <p className="text-xs text-green-600 mt-1 font-semibold">{studentFile.name}</p>
                )}
              </label>
            </div>
          </div>

          {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <button
            onClick={handleGrade}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
            {loading ? 'Dang cham diem...' : 'Bat dau cham'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <RefreshCw size={16} /> Cham bai khac
            </button>
          </div>
          <ResultCard result={result} />
        </div>
      )}
    </div>
  );
};

export default GradingView;
