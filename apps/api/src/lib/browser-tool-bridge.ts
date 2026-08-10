import { randomUUID } from "node:crypto";

export type BrowserToolCall = {
  requestId: string;
  name: string;
  arguments: Record<string, unknown>;
};

type PendingCall = {
  name: string;
  resolve: (result: unknown) => void;
  reject: (error: BrowserToolBridgeError) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type BrowserSession = {
  send: (call: BrowserToolCall) => void;
  pendingCalls: Map<string, PendingCall>;
};

export class BrowserToolBridgeError extends Error {
  constructor(
    readonly code: "session_not_found" | "tool_timed_out" | "session_closed",
  ) {
    super(code);
  }
}

export class BrowserToolBridge {
  private readonly sessions = new Map<string, BrowserSession>();

  constructor(private readonly timeoutMs = 15_000) {}

  register(sessionId: string, send: (call: BrowserToolCall) => void) {
    this.sessions.set(sessionId, { send, pendingCalls: new Map() });
  }

  unregister(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const pendingCall of session.pendingCalls.values()) {
      clearTimeout(pendingCall.timeout);
      pendingCall.reject(new BrowserToolBridgeError("session_closed"));
    }
    this.sessions.delete(sessionId);
  }

  request(
    sessionId: string,
    name: string,
    arguments_: Record<string, unknown>,
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return Promise.reject(new BrowserToolBridgeError("session_not_found"));
    }

    const requestId = randomUUID();
    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        session.pendingCalls.delete(requestId);
        reject(new BrowserToolBridgeError("tool_timed_out"));
      }, this.timeoutMs);

      session.pendingCalls.set(requestId, { name, resolve, reject, timeout });
      session.send({ requestId, name, arguments: arguments_ });
    });
  }

  resolve(
    sessionId: string,
    requestId: string,
    name: string,
    result: unknown,
  ) {
    const pendingCall = this.sessions.get(sessionId)?.pendingCalls.get(requestId);
    if (!pendingCall || pendingCall.name !== name) return false;

    clearTimeout(pendingCall.timeout);
    this.sessions.get(sessionId)?.pendingCalls.delete(requestId);
    pendingCall.resolve(result);
    return true;
  }
}
