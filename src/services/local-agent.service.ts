import { LOCAL_AGENT_API_KEY, LOCAL_AGENT_BASE_URL } from "../config/api";
import type {
  LocalAgentState,
  StartExamAgentRequest,
  SubmitCurrentProjectRequest,
} from "../types/local-agent.types";

async function requestLocalAgent<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("X-Local-Agent-Key", LOCAL_AGENT_API_KEY);

  let response: Response;
  const requestUrl = `${LOCAL_AGENT_BASE_URL}${path}`;
  const requestOptions: RequestInit = {
    ...options,
    headers,
    mode: "cors",
  };

  try {
    response = await fetch(requestUrl, requestOptions);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Khong ket noi duoc Local Agent tren may nay. Hay mo/chay lai agent va cap nhat package moi neu dang dung ban cu."
      );
    }

    throw error;
  }

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      throw new Error(body.message);
    }

    if (typeof body === "string" && body.trim()) {
      throw new Error(body.trim());
    }

    throw new Error(`Local Agent error ${response.status}`);
  }

  return body as T;
}

export const localAgentService = {
  getCurrentState(): Promise<LocalAgentState> {
    return requestLocalAgent<LocalAgentState>("/current-state", {
      method: "GET",
    });
  },

  startExam(request: StartExamAgentRequest): Promise<LocalAgentState> {
    return requestLocalAgent<LocalAgentState>("/start-exam", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  continueCurrentProject(): Promise<LocalAgentState> {
    return requestLocalAgent<LocalAgentState>("/continue-current-project", {
      method: "POST",
    });
  },

  recreateCurrentProject(): Promise<LocalAgentState> {
    return requestLocalAgent<LocalAgentState>("/recreate-current-project", {
      method: "POST",
    });
  },

  submitCurrentProject(
    request: SubmitCurrentProjectRequest = { confirmSaved: true }
  ): Promise<LocalAgentState> {
    return requestLocalAgent<LocalAgentState>("/submit-current-project", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  nextProject(): Promise<LocalAgentState> {
    return requestLocalAgent<LocalAgentState>("/next-project", {
      method: "POST",
    });
  },

  restartCurrentProject(): Promise<LocalAgentState> {
    return requestLocalAgent<LocalAgentState>("/restart-current-project", {
      method: "POST",
    });
  },
};
