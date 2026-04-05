import { useEffect, useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, RefreshCw, Bug, Copy, Trash2 } from 'lucide-react';
import { gradingService } from '../services/grading.service';
import type { GradingResult } from '../types';
import type { BugSeverity, CreateGradingTestBugNoteRequest, GradingTestBugNote } from '../types/grading-test-bug-note.types';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';

interface TestProjectOption {
  code: string;
  displayName: string;
}

const severityMeta: Record<BugSeverity, { label: string; badgeClass: string }> = {
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  critical: {
    label: 'Critical',
    badgeClass: 'bg-rose-100 text-rose-800',
  },
};

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

  const [bugNotes, setBugNotes] = useState<GradingTestBugNote[]>([]);
  const [isLoadingBugNotes, setIsLoadingBugNotes] = useState(false);
  const [isSavingBugNote, setIsSavingBugNote] = useState(false);
  const [deletingBugNoteId, setDeletingBugNoteId] = useState<string | null>(null);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSeverity, setBugSeverity] = useState<BugSeverity>('medium');
  const [bugActionMessage, setBugActionMessage] = useState<string | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [isBugTitleDirty, setIsBugTitleDirty] = useState(false);

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

        const message = err instanceof Error ? err.message : 'Khong tai duoc danh sach project test.';
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

  useEffect(() => {
    let active = true;

    const loadBugNotes = async () => {
      setIsLoadingBugNotes(true);
      try {
        const notes = await gradingService.getTestingBugNotes(getAccessToken);
        if (!active) {
          return;
        }

        setBugNotes(notes);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setBugNotes([]);
        const message = err instanceof Error ? err.message : 'Khong tai duoc bug notes.';
        setBugActionMessage(message);
      } finally {
        if (active) {
          setIsLoadingBugNotes(false);
        }
      }
    };

    void loadBugNotes();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  const selectedProjectDisplayName = useMemo(
    () => projectOptions.find((project) => project.code === projectCode)?.displayName || projectCode,
    [projectCode, projectOptions]
  );

  const currentProjectNotes = useMemo(
    () =>
      bugNotes
        .filter((note) => note.projectCode === projectCode)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bugNotes, projectCode]
  );

  const autoBugTitle = useMemo(() => selectedProjectDisplayName, [selectedProjectDisplayName]);

  useEffect(() => {
    setIsBugTitleDirty(false);
    setBugDescription('');
  }, [projectCode]);

  useEffect(() => {
    if (!isBugTitleDirty) {
      setBugTitle(autoBugTitle);
    }
  }, [autoBugTitle, isBugTitleDirty]);

  const isValidExcelFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm');
  };

  const setSelectedFile = (file: File | null) => {
    if (!file) return;
    if (!isValidExcelFile(file)) {
      alert('File phai co dinh dang .xls, .xlsx hoac .xlsm');
      return;
    }
    setStudentFile(file);
    setError(null);
  };

  const handleGrade = async () => {
    if (!studentFile) {
      alert('Vui long chon file bai lam hoc sinh!');
      return;
    }

    setLoading(true);
    setError(null);
    setBugActionMessage(null);

    try {
      const data = await gradingService.gradeForTesting(projectCode, studentFile, getAccessToken);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Co loi xay ra khi cham diem.';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStudentFile(null);
    setError(null);
    setIsDragOver(false);
    setIsBugTitleDirty(false);
    setBugDescription('');
  };

  const buildBugNoteClipboardText = (note: GradingTestBugNote): string => {
    const lines = [
      `[${note.severity.toUpperCase()}] ${note.title}`,
      `Project: ${note.projectDisplayName} (${note.projectCode})`,
      `Time: ${new Date(note.createdAt).toLocaleString('vi-VN')}`,
      note.scoreSummary
        ? `Score: ${note.scoreSummary.totalScore}/${note.scoreSummary.maxScore} (${note.scoreSummary.percentage}%) - ${note.scoreSummary.status}`
        : '',
      note.gradingError ? `Grading error: ${note.gradingError}` : '',
      'Description:',
      note.description,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleSaveBugNote = async () => {
    const title = bugTitle.trim();
    const description = bugDescription.trim();

    if (!title) {
      setBugActionMessage('Vui long nhap tieu de bug.');
      return;
    }

    if (!description) {
      setBugActionMessage('Vui long nhap mo ta bug.');
      return;
    }

    const request: CreateGradingTestBugNoteRequest = {
      projectCode,
      projectDisplayName: selectedProjectDisplayName,
      title,
      description,
      severity: bugSeverity,
      scoreSummary: result
        ? {
            totalScore: result.totalScore,
            maxScore: result.maxScore,
            percentage: result.percentage,
            status: result.status,
          }
        : undefined,
      gradingError: error || undefined,
    };

    setIsSavingBugNote(true);
    try {
      const savedNote = await gradingService.createTestingBugNote(request, getAccessToken);
      setBugNotes((prev) => [savedNote, ...prev.filter((item) => item.id !== savedNote.id)]);
      setIsBugTitleDirty(false);
      setBugDescription('');
      setBugActionMessage('Da luu bug note.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Khong luu duoc bug note.';
      setBugActionMessage(message);
    } finally {
      setIsSavingBugNote(false);
    }
  };

  const handleDeleteBugNote = async (noteId: string) => {
    if (!window.confirm('Ban co chac chan muon xoa bug note nay?')) {
      return;
    }

    setDeletingBugNoteId(noteId);
    try {
      await gradingService.deleteTestingBugNote(noteId, getAccessToken);
      setBugNotes((prev) => prev.filter((item) => item.id !== noteId));
      setCopiedNoteId((prev) => (prev === noteId ? null : prev));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Khong xoa duoc bug note.';
      setBugActionMessage(message);
    } finally {
      setDeletingBugNoteId(null);
    }
  };

  const handleCopyBugNote = async (note: GradingTestBugNote) => {
    const text = buildBugNoteClipboardText(note);

    try {
      await navigator.clipboard.writeText(text);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId((prev) => (prev === note.id ? null : prev)), 1500);
    } catch {
      setBugActionMessage('Khong copy duoc bug note. Hay copy thu cong tu danh sach.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">Kiem thu cham diem Excel</h1>
      <p className="mb-6 text-sm text-slate-600">
        Trang nay de test nhanh luong cham diem. Ban co the luu bug note theo tung project de theo doi.
      </p>

      {!result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Chon project test</label>
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
                <span className="text-sm font-medium text-gray-700">File bai lam hoc sinh</span>
                <p className="mt-1 text-xs text-gray-500">Keo tha file vao day hoac bam de chon</p>
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
            {loading ? 'Dang cham diem...' : 'Bat dau cham'}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800"
            >
              <RefreshCw size={16} /> Cham bai khac
            </button>
          </div>
          <ResultCard result={result} />
        </div>
      )}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Bug size={18} className="text-amber-600" />
              Bug Notes
            </h2>
            <p className="text-xs text-slate-500">
              Dang xem: <span className="font-medium">{selectedProjectDisplayName}</span> ({currentProjectNotes.length}{' '}
              note)
            </p>
          </div>
          <p className="text-xs text-slate-500">Tong notes da luu: {bugNotes.length}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <label className="mb-1 block text-xs font-medium text-slate-700">Tieu de bug</label>
            <input
              type="text"
              value={bugTitle}
              onChange={(e) => {
                setBugTitle(e.target.value);
                setIsBugTitleDirty(true);
              }}
              placeholder="Vi du: Project 09 cham sai task T4"
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mb-1 block text-xs font-medium text-slate-700">Muc do</label>
            <select
              value={bugSeverity}
              onChange={(e) => setBugSeverity(e.target.value as BugSeverity)}
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <label className="mb-1 block text-xs font-medium text-slate-700">Mo ta bug</label>
            <textarea
              value={bugDescription}
              onChange={(e) => {
                setBugDescription(e.target.value);
              }}
              placeholder="Mo ta buoc tai hien, ket qua mong doi, ket qua thuc te..."
              rows={5}
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => void handleSaveBugNote()}
              disabled={isSavingBugNote}
              className="w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingBugNote ? 'Dang luu...' : 'Luu bug note'}
            </button>

            {bugActionMessage && <p className="mt-2 text-xs text-slate-600">{bugActionMessage}</p>}
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {isLoadingBugNotes && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Dang tai bug notes...
              </div>
            )}

            {!isLoadingBugNotes && currentProjectNotes.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Chua co bug note nao cho project nay.
              </div>
            )}

            {!isLoadingBugNotes &&
              currentProjectNotes.map((note) => (
                <article key={note.id} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{note.title}</h3>
                      <p className="text-[11px] text-slate-500">{new Date(note.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        severityMeta[note.severity].badgeClass
                      }`}
                    >
                      {severityMeta[note.severity].label}
                    </span>
                  </div>

                  {note.scoreSummary && (
                    <p className="mb-2 text-xs text-slate-600">
                      Score: {note.scoreSummary.totalScore}/{note.scoreSummary.maxScore} ({note.scoreSummary.percentage}
                      %) - {note.scoreSummary.status}
                    </p>
                  )}

                  {note.gradingError && (
                    <p className="mb-2 rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">{note.gradingError}</p>
                  )}

                  <p className="mb-3 whitespace-pre-wrap text-sm text-slate-700">{note.description}</p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyBugNote(note)}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      <Copy size={12} />
                      {copiedNoteId === note.id ? 'Da copy' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteBugNote(note.id)}
                      disabled={deletingBugNoteId === note.id}
                      className="inline-flex items-center gap-1 rounded border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={12} />
                      {deletingBugNoteId === note.id ? 'Dang xoa...' : 'Xoa'}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GradingView;
