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
  workingFileExists: false,
  hasRecoverableSession: false,
  resumeMode: 'none',
};

const normalizeAgentState = (state: LocalAgentState | null): LocalAgentState | null => {
  if (!state) {
    return null;
  }

  return {
    ...state,
    workingFileExists: state.workingFileExists ?? Boolean(state.workingFilePath),
    hasRecoverableSession: state.hasRecoverableSession ?? Boolean(state.sessionId && state.publicationToken),
    resumeMode: state.resumeMode ?? 'none',
  };
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
        setError('Thieu publication token.');
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

        const normalizedState = normalizeAgentState(currentAgentState);
        setPublication(nextPublication);

        setSelectedStudentId((currentValue) => {
          if (nextPublication.students.some((student) => student.id === currentValue)) {
            return currentValue;
          }

          return '';
        });

        setAgentState(
          normalizedState?.publicationToken === token && normalizedState.sessionId
            ? normalizedState
            : null
        );
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setPublication(null);
        setError(err instanceof Error ? err.message : 'Khong the tai thong tin ca thi.');
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

  const agentStateMatchesToken = Boolean(agentState?.sessionId && agentState.publicationToken === token);
  const agentStateMatchesSelectedStudent = Boolean(
    agentStateMatchesToken &&
      selectedStudent &&
      agentState?.studentId &&
      agentState.studentId === selectedStudent.id
  );
  const canResumeCurrentStudent = Boolean(
    agentStateMatchesSelectedStudent &&
      agentState?.hasRecoverableSession &&
      !agentState?.isCompleted
  );
  const canContinueCurrentStudent = Boolean(
    canResumeCurrentStudent &&
      agentState?.workingFileExists &&
      agentState.resumeMode !== 'missing_working_file'
  );
  const needsRecreateCurrentStudent = Boolean(
    canResumeCurrentStudent && !agentState?.workingFileExists
  );

  const displayStudentName = selectedStudent?.fullName || agentState?.studentName || '';

  const runAgentAction = async (
    actionKey: string,
    action: () => Promise<LocalAgentState>,
    successText: string | ((state: LocalAgentState) => string)
  ) => {
    setLoadingAction(actionKey);
    setAgentError(null);
    setSuccessMessage(null);

    try {
      const nextState = normalizeAgentState(await action());
      setAgentState(nextState);
      setSuccessMessage(typeof successText === 'function' ? successText(nextState!) : successText);
    } catch (err: unknown) {
      setAgentError(err instanceof Error ? err.message : 'Khong goi duoc Local Agent.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRefreshAgentState = () =>
    void runAgentAction('refresh', () => localAgentService.getCurrentState(), 'Da lam moi trang thai.');

  const handleStartExam = () => {
    if (!token || !selectedStudent) {
      setAgentError('Vui long chon dung ten cua ban truoc khi bat dau thi.');
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
      'Da bat dau ca thi moi. Local Agent se mo WPF App de tiep tuc lam bai.'
    );
  };

  const handleLoadSavedState = () => {
    if (!token || !selectedStudent) {
      setAgentError('Vui long chon dung ten cua ban truoc khi tim bai cu.');
      return;
    }

    void runAgentAction(
      'load-saved-state',
      () =>
        localAgentService.loadSavedState({
          publicationToken: token,
          studentId: selectedStudent.id,
          studentName: selectedStudent.fullName,
        }),
      'Da nap bai cu tren may nay. Ban co the tiep tuc hoac lam lai project hien tai.'
    );
  };

  const handleContinueExam = () =>
    void runAgentAction(
      'continue',
      () => localAgentService.continueCurrentProject(),
      'Da mo lai bai dang lam do tren may local.'
    );

  const handleRestartCurrentProject = () =>
    void runAgentAction(
      'restart',
      () => localAgentService.restartCurrentProject(),
      'Da lam lai project hien tai tu template.'
    );

  const handleRecreateCurrentProject = () =>
    void runAgentAction(
      'recreate',
      () => localAgentService.recreateCurrentProject(),
      'Da tao lai working file cho project hien tai.'
    );

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ca thi MOS</h1>
          <p className="mt-2 text-sm text-slate-600">
            Chon dung ten cua ban roi bat dau thi tren Local Agent.
          </p>
        </div>

        <section className="app-card overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Public Exam</p>
            <h2 className="mt-2 text-2xl font-bold">{publication?.name || 'Dang tai ca thi...'}</h2>
          </div>

          <div className="space-y-5 px-6 py-6">
            {loading && (
              <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                <RefreshCw size={16} className="animate-spin" />
                Dang tai thong tin ca thi...
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
                    <p className="text-xs uppercase tracking-wide text-slate-500">So hoc sinh</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{publication.students.length}</p>
                  </div>
                  <div className="app-card-soft px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">So project</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{publication.projectCount}</p>
                  </div>
                  <div className="app-card-soft px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Thoi luong</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {publication.durationMinutes ? `${publication.durationMinutes} phut` : 'Khong gioi han'}
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
                    Chon ten cua ban
                  </label>
                  <select
                    id="public-exam-student"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                    disabled={loadingAction !== null}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                  >
                    <option value="">-- Chon hoc sinh --</option>
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
                  <button
                    type="button"
                    onClick={handleStartExam}
                    disabled={!selectedStudent || loadingAction !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {loadingAction === 'start' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                    {loadingAction === 'start' ? 'Dang start exam...' : 'Start exam'}
                  </button>

                  {!canResumeCurrentStudent && (
                    <button
                      type="button"
                      onClick={handleLoadSavedState}
                      disabled={!selectedStudent || loadingAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw size={16} className={loadingAction === 'load-saved-state' ? 'animate-spin' : ''} />
                      {loadingAction === 'load-saved-state'
                        ? 'Dang tai bai cu...'
                        : 'Dung lai bai cu tren may nay'}
                    </button>
                  )}

                  {canResumeCurrentStudent && canContinueCurrentStudent && (
                    <button
                      type="button"
                      onClick={handleContinueExam}
                      disabled={loadingAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {loadingAction === 'continue' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                      {loadingAction === 'continue' ? 'Dang tiep tuc...' : 'Tiep tuc bai thi'}
                    </button>
                  )}

                  {canResumeCurrentStudent && (
                    <button
                      type="button"
                      onClick={needsRecreateCurrentStudent ? handleRecreateCurrentProject : handleRestartCurrentProject}
                      disabled={loadingAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw size={16} className={loadingAction === 'restart' || loadingAction === 'recreate' ? 'animate-spin' : ''} />
                      {needsRecreateCurrentStudent
                        ? (loadingAction === 'recreate' ? 'Dang tao lai file...' : 'Tao lai file project hien tai')
                        : (loadingAction === 'restart' ? 'Dang lam lai project...' : 'Lam lai project hien tai')}
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

                {canResumeCurrentStudent && agentState && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                    <p className="font-semibold">Da tim thay bai cu tren may local.</p>
                    <p className="mt-2">Student: {displayStudentName || '-'}</p>
                    <p>Session ID: {agentState.sessionId || '-'}</p>
                    <p>
                      Project hien tai: {agentState.currentProjectNumber}/{agentState.totalProjectCount}
                    </p>
                    <p>Status: {agentState.status}</p>
                    {agentState.workingFilePath && <p>Working file: {agentState.workingFilePath}</p>}
                    {!agentState.workingFileExists && (
                      <p className="mt-2 text-rose-700">
                        Khong tim thay file dang lam do. Ban co the tao lai file project hien tai tu template.
                      </p>
                    )}
                  </div>
                )}

                {!selectedStudent && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    Chon dung ten cua ban roi bam Start exam de mo bai thi tren Local Agent.
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-slate-500">
          Neu mo nham lien ket, quay lai trang{' '}
          <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            dang nhap
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

export default PublicExamPage;
