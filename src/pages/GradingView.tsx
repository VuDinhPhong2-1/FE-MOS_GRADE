import { useEffect, useState } from 'react';
import { Upload, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { gradingService } from '../services/grading.service';
import type { GradingResult } from '../types';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';

interface TestProjectOption {
  code: string;
  displayName: string;
}

const GradingView = () => {
  const { getAccessToken } = useAuth();
  const [projectCode, setProjectCode] = useState('project01');
  const [projectOptions, setProjectOptions] = useState<TestProjectOption[]>([]);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      setLoadingProjects(true);
      setProjectLoadError(null);

      try {
        const projects = await gradingService.getTestingProjects(getAccessToken);
        if (!active) {
          return;
        }

        const mapped = projects.map((project) => ({
          code: project.code,
          displayName: project.displayName,
        }));

        setProjectOptions(mapped);
        if (mapped.length > 0) {
          setProjectCode(mapped[0].code);
        }
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Không tải được danh sách project test.';
        setProjectLoadError(message);
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    };

    void loadProjects();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  const isValidExcelFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm');
  };

  const setSelectedFile = (file: File | null) => {
    if (!file) return;
    if (!isValidExcelFile(file)) {
      alert('File phải có định dạng .xls, .xlsx hoặc .xlsm');
      return;
    }
    setStudentFile(file);
    setError(null);
  };

  const handleGrade = async () => {
    if (!studentFile) {
      alert('Vui lòng chọn file bài làm học sinh!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await gradingService.gradeForTesting(projectCode, studentFile, getAccessToken);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi chấm điểm.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStudentFile(null);
    setError(null);
    setIsDragOver(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">Kiểm thử chấm điểm Excel</h1>
      <p className="mb-6 text-sm text-slate-600">
        Trang này chỉ để test nhanh luồng chấm điểm, không ảnh hưởng dữ liệu quản lý học sinh.
      </p>

      {!result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Chọn project test</label>
            <select
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-gray-50 p-2"
              disabled={loadingProjects || projectOptions.length === 0}
            >
              {projectOptions.map((project) => (
                <option key={project.code} value={project.code}>
                  {project.displayName}
                </option>
              ))}
            </select>
            {projectLoadError && <p className="mt-2 text-xs text-red-600">{projectLoadError}</p>}
          </div>

          <div className="mb-6">
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
                isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0] || null;
                setSelectedFile(file);
              }}
            >
              <input
                type="file"
                accept=".xls,.xlsx,.xlsm"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
                className="hidden"
                id="student-upload"
              />
              <label htmlFor="student-upload" className="cursor-pointer text-center">
                <FileSpreadsheet className="mx-auto mb-2 h-12 w-12 text-green-600" />
                <span className="text-sm font-medium text-gray-700">File bài làm học sinh</span>
                <p className="mt-1 text-xs text-gray-500">Kéo thả file vào đây hoặc bấm để chọn</p>
                {studentFile && <p className="mt-1 text-xs font-semibold text-green-600">{studentFile.name}</p>}
              </label>
            </div>
          </div>

          {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</div>}

          <button
            onClick={handleGrade}
            disabled={loading || loadingProjects || projectOptions.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
            {loading ? 'Đang chấm điểm...' : 'Bắt đầu chấm'}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800"
            >
              <RefreshCw size={16} /> Chấm bài khác
            </button>
          </div>
          <ResultCard result={result} />
        </div>
      )}
    </div>
  );
};

export default GradingView;
