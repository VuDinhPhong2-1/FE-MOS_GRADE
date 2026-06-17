import { useEffect, useState } from "react";
import { Play, RefreshCw, RotateCcw, Send, SkipForward } from "lucide-react";
import { localAgentService } from "../services/local-agent.service";
import type { LocalAgentState } from "../types/local-agent.types";

type LocalAgentPanelProps = {
  publicationToken: string;
  studentId?: string;
  studentName: string;
};

const defaultState: LocalAgentState = {
  currentProjectNumber: 0,
  totalProjectCount: 0,
  status: "idle",
  isBusy: false,
  isCompleted: false,
  isCurrentProjectGraded: false,
};

const formatValue = (value?: string) => value?.trim() || "-";

export function LocalAgentPanel({
  publicationToken,
  studentId,
  studentName,
}: LocalAgentPanelProps) {
  const [state, setState] = useState<LocalAgentState>(defaultState);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasPublicationToken = publicationToken.trim().length > 0;

  const runAction = async (
    actionKey: string,
    action: () => Promise<LocalAgentState>,
    successText: string
  ) => {
    setLoadingAction(actionKey);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextState = await action();
      setState(nextState);
      setSuccessMessage(successText);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không gọi được Local Agent.");
    } finally {
      setLoadingAction(null);
    }
  };

  const refreshState = async () => {
    setLoadingAction("refresh");
    setError(null);

    try {
      const nextState = await localAgentService.getCurrentState();
      setState(nextState);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được trạng thái Local Agent.");
    } finally {
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    void refreshState();
  }, []);

  return (
    <section className="mt-6 rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Local Agent</h2>
          <p className="mt-1 text-sm text-slate-600">
            Dùng panel này để start exam, submit, restart và chuyển project qua Local Agent.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshState()}
          disabled={loadingAction !== null}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loadingAction === "refresh" ? "animate-spin" : ""} />
          Làm mới state
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm md:grid-cols-2">
        <div>
          <span className="font-medium text-slate-700">Publication token:</span> {formatValue(publicationToken)}
        </div>
        <div>
          <span className="font-medium text-slate-700">Student ID:</span> {formatValue(studentId)}
        </div>
        <div>
          <span className="font-medium text-slate-700">Student name:</span> {formatValue(studentName)}
        </div>
        <div>
          <span className="font-medium text-slate-700">Session ID:</span> {formatValue(state.sessionId)}
        </div>
      </div>

      {!hasPublicationToken && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Cần có publication token trước khi bấm Start exam.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {successMessage && !error && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          disabled={!hasPublicationToken || loadingAction !== null}
          onClick={() =>
            void runAction(
              "start",
              () =>
                localAgentService.startExam({
                  publicationToken,
                  studentId,
                  studentName,
                }),
              "Đã start exam qua Local Agent."
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Play size={16} />
          Start exam
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() =>
            void runAction(
              "submit",
              () => localAgentService.submitCurrentProject({ confirmSaved: true }),
              "Đã submit project hiện tại."
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Send size={16} />
          Submit
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() =>
            void runAction(
              "force-submit",
              () => localAgentService.submitCurrentProject({ confirmSaved: true, forceSubmit: true }),
              "Đã force submit project hiện tại."
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Send size={16} />
          Force submit
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() =>
            void runAction(
              "restart",
              () => localAgentService.restartCurrentProject(),
              "Đã restart project hiện tại."
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <RotateCcw size={16} />
          Restart
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() =>
            void runAction(
              "next",
              () => localAgentService.nextProject(),
              "Đã chuyển sang project tiếp theo."
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <SkipForward size={16} />
          Next project
        </button>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-950/95 p-4 text-sm text-slate-100 md:grid-cols-2">
        <div>
          <span className="font-medium text-slate-300">Status:</span> {state.status}
        </div>
        <div>
          <span className="font-medium text-slate-300">Project code:</span> {formatValue(state.projectCode)}
        </div>
        <div>
          <span className="font-medium text-slate-300">Subject:</span> {formatValue(state.subject)}
        </div>
        <div>
          <span className="font-medium text-slate-300">Template file:</span> {formatValue(state.templateFileName)}
        </div>
        <div>
          <span className="font-medium text-slate-300">Current project:</span> {state.currentProjectNumber || 0}/
          {state.totalProjectCount || 0}
        </div>
        <div>
          <span className="font-medium text-slate-300">Working file:</span> {formatValue(state.workingFilePath)}
        </div>
        <div>
          <span className="font-medium text-slate-300">Is busy:</span> {state.isBusy ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium text-slate-300">Is graded:</span>{" "}
          {state.isCurrentProjectGraded ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium text-slate-300">Is completed:</span> {state.isCompleted ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium text-slate-300">Last error:</span> {formatValue(state.lastError)}
        </div>
      </div>
    </section>
  );
}
