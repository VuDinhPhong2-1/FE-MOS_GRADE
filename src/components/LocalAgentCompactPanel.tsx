import { RefreshCw, RotateCcw, Send, ShieldAlert, SkipForward } from 'lucide-react';
import type { LocalAgentState } from '../types/local-agent.types';

type LocalAgentCompactPanelProps = {
  state: LocalAgentState;
  loadingAction: string | null;
  error: string | null;
  successMessage: string | null;
  onRefresh: () => void;
  onSubmit: () => void;
  onForceSubmit: () => void;
  onNextProject: () => void;
  onRestart: () => void;
};

const formatValue = (value?: string | null) => value?.trim() || '-';

export function LocalAgentCompactPanel({
  state,
  loadingAction,
  error,
  successMessage,
  onRefresh,
  onSubmit,
  onForceSubmit,
  onNextProject,
  onRestart,
}: LocalAgentCompactPanelProps) {
  const isLoading = loadingAction !== null;
  const disableActions = isLoading || state.isBusy || state.isCompleted;
  const taskItems = state.taskSnapshot || [];

  return (
    <section className="flex h-full flex-col overflow-hidden bg-white text-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="font-semibold">
            Project {Math.max(state.currentProjectNumber || 0, 0)}/{Math.max(state.totalProjectCount || 0, 0)}
          </span>
          <span>Student: {formatValue(state.studentName)}</span>
          <span>Status: {state.isCompleted ? 'Hoàn thành ca thi' : formatValue(state.status)}</span>
          <span>Project code: {formatValue(state.projectCode)}</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loadingAction === 'refresh' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 lg:flex-row">
        <div className="min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="font-medium text-slate-700">Working file:</span> {formatValue(state.workingFilePath)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Template:</span> {formatValue(state.templateFileName)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Subject:</span> {formatValue(state.subject)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Session:</span> {formatValue(state.sessionId)}
            </p>
          </div>

          {state.isCompleted && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Hoàn thành ca thi
            </div>
          )}

          {(error || state.lastError) && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error || state.lastError}
            </div>
          )}

          {successMessage && !error && !state.lastError && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          <div className="mt-3 min-h-0 rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Project instructions
            </div>
            <div className="max-h-48 overflow-y-auto whitespace-pre-wrap px-3 py-2 text-sm text-slate-700">
              {state.instructionsText?.trim() || 'Chưa có file đề bài cho project hiện tại.'}
            </div>
          </div>

          <div className="mt-3 min-h-0 rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Help
            </div>
            <div className="max-h-40 overflow-y-auto whitespace-pre-wrap px-3 py-2 text-sm text-slate-700">
              {state.helpText?.trim() || 'Chưa có file help cho project hiện tại.'}
            </div>
          </div>

          <div className="mt-3 min-h-0 rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Task list
            </div>
            <div className="max-h-56 overflow-y-auto px-3 py-2">
              {taskItems.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có task snapshot.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {taskItems.map((task, index) => (
                    <li key={`${task.taskId || task.taskName || 'task'}-${index}`} className="rounded-md bg-slate-50 px-2 py-1.5">
                      <span className="font-medium text-slate-800">{formatValue(task.taskName || task.taskId)}</span>
                      {typeof task.maxScore === 'number' ? (
                        <span className="ml-2 text-xs text-slate-500">/{task.maxScore}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2 lg:w-60 lg:content-start">
          <button
            type="button"
            onClick={onSubmit}
            disabled={disableActions}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
          >
            <Send size={16} />
            Submit
          </button>
          <button
            type="button"
            onClick={onForceSubmit}
            disabled={disableActions}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-slate-300"
          >
            <ShieldAlert size={16} />
            Force submit
          </button>
          <button
            type="button"
            onClick={onNextProject}
            disabled={disableActions}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:bg-slate-300"
          >
            <SkipForward size={16} />
            Next project
          </button>
          <button
            type="button"
            onClick={onRestart}
            disabled={disableActions}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-300"
          >
            <RotateCcw size={16} />
            Restart
          </button>
        </div>
      </div>
    </section>
  );
}
