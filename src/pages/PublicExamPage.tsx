import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Play, RefreshCw } from 'lucide-react';
import { localAgentService } from '../services/local-agent.service';
import { publicExamService } from '../services/public-exam.service';
import type { LocalAgentState } from '../types/local-agent.types';
import type { PublicExamPublicationInfo } from '../types/public-exam.types';

const defaultAgentState: LocalAgentState = {
  currentProjectNumber: 0,
  totalProjectCount: 0,
  status: 'idle',
  isBusy: false,
  isCompleted: false,
  isCurrentProjectGraded: false,
};

export function PublicExamPage() {
  const { token } = useParams();
  const [publication, setPublication] = useState<PublicExamPublicationInfo | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<LocalAgentState | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPublication = async () => {
      if (!token) {
        setPublication(null);
        setError('Thiếu publication token.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [nextPublication, currentAgentState] = await Promise.all([
          publicExamService.getByToken(token),
          localAgentService.getCurrentState().catch(() => defaultAgentState),
        ]);

        if (!active) {
          return;
        }

        setPublication(nextPublication);

        const matchingStudentId =
          currentAgentState.publicationToken === token &&
          currentAgentState.studentId &&
          nextPublication.students.some((student) => student.id === currentAgentState.studentId)
            ? currentAgentState.studentId
            : '';

        setSelectedStudentId((currentValue) => {
          if (nextPublication.students.some((student) => student.id === currentValue)) {
            return currentValue;
          }

          return matchingStudentId;
        });

        setAgentState(
          currentAgentState.publicationToken === token && currentAgentState.sessionId
            ? currentAgentState
            : null
        );
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setPublication(null);
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin ca thi.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPublication();

    return () => {
      active = false;
    };
  }, [token]);

  const selectedStudent = useMemo(
    () => publication?.students.find((student) => student.id === selectedStudentId) || null,
    [publication, selectedStudentId]
  );

  const displayStudentName = selectedStudent?.fullName || agentState?.studentName || '';
  const hasStartedExam = Boolean(agentState?.sessionId && agentState.publicationToken === token);

  const runAgentAction = async (
    actionKey: string,
    action: () => Promise<LocalAgentState>,
    successText: string
  ) => {
    setLoadingAction(actionKey);
    setAgentError(null);
    setSuccessMessage(null);

    try {
      const nextState = await action();
      setAgentState(nextState);
      setSuccessMessage(successText);
    } catch (err: unknown) {
      setAgentError(err instanceof Error ? err.message : 'Không gọi được Local Agent.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRefreshAgentState = () =>
    void runAgentAction('refresh', () => localAgentService.getCurrentState(), 'Đã làm mới trạng thái.');

  const handleStartExam = () => {
    if (!token || !selectedStudent) {
      setAgentError('Vui lòng chọn đúng tên của bạn trước khi bắt đầu thi.');
      return;
    }

    void runAgentAction(
      'start',
      () =>
        localAgentService.startExam({
          publicationToken: token,
          studentId: selectedStudent.id,
          studentName: selectedStudent.fullName,
        }),
      'Đã bắt đầu ca thi. Local Agent sẽ mở WPF App để tiếp tục làm bài.'
    );
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ca thi MOS</h1>
          <p className="mt-2 text-sm text-slate-600">Chọn đúng tên của bạn rồi bắt đầu thi trên Local Agent.</p>
        </div>

        <section className="app-card overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Public Exam</p>
            <h2 className="mt-2 text-2xl font-bold">{publication?.name || 'Đang tải ca thi...'}</h2>
          </div>

          <div className="space-y-5 px-6 py-6">
            {loading && (
              <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                <RefreshCw size={16} className="animate-spin" />
                Đang tải thông tin ca thi...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {publication && !loading && (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="app-card-soft px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Số học sinh</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{publication.students.length}</p>
                  </div>
                  <div className="app-card-soft px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Số project</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{publication.projectCount}</p>
                  </div>
                  <div className="app-card-soft px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Thời lượng</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {publication.durationMinutes ? `${publication.durationMinutes} phút` : 'Không giới hạn'}
                    </p>
                  </div>
                </div>

                {publication.description && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {publication.description}
                  </div>
                )}

                <div>
                  <label htmlFor="public-exam-student" className="mb-2 block text-sm font-medium text-slate-800">
                    Chọn tên của bạn
                  </label>
                  <select
                    id="public-exam-student"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                    disabled={hasStartedExam}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {publication.students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {agentError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {agentError}
                  </div>
                )}

                {successMessage && !agentError && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {!hasStartedExam && (
                    <button
                      type="button"
                      onClick={handleStartExam}
                      disabled={!selectedStudent || loadingAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {loadingAction === 'start' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                      {loadingAction === 'start' ? 'Đang start exam...' : 'Start exam'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRefreshAgentState}
                    disabled={loadingAction !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw size={16} className={loadingAction === 'refresh' ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {hasStartedExam && agentState && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                    <p className="font-semibold">Ca thi đã được start trên máy local.</p>
                    <p className="mt-2">WPF App sẽ tự đọc `current-state` để hiển thị thông tin và các nút điều khiển.</p>
                    <p className="mt-2">Student: {displayStudentName || '-'}</p>
                    <p>Session ID: {agentState.sessionId || '-'}</p>
                    <p>
                      Project hiện tại: {agentState.currentProjectNumber}/{agentState.totalProjectCount}
                    </p>
                    <p>Status: {agentState.status}</p>
                  </div>
                )}

                {!selectedStudent && !hasStartedExam && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    Chọn đúng tên của bạn rồi bấm Start exam để mở bài thi trên Local Agent.
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-slate-500">
          Nếu mở nhầm liên kết, quay lại trang{' '}
          <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            đăng nhập
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

export default PublicExamPage;
