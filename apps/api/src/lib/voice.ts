import { ConversationAgent, InteractionType } from "sarvam-conv-ai-sdk";
import type { AsyncAudioInterface } from "sarvam-conv-ai-sdk";
import { randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type { RequestHandler } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { BrowserToolBridge, BrowserToolBridgeError } from "./browser-tool-bridge.js";

export type VoiceClientMessage =
  | {
      type: "init";
      context: {
        page_title: string;
        page_url: string;
        page_hostname: string;
        page_language: string;
        meta_description: string;
        canonical_url: string;
        page_content: string;
        page_headings: string;
        page_links: string;
        accessibility_tree: string;
        selected_text: string;
      };
    }
  | { type: "audio"; audio: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "end" }
  | { type: "stop" }
  | {
      type: "tool_result";
      request_id?: string;
      name: string;
      result: unknown;
    };

const browserToolNames = [
  "browser_action",
  "get_page_context",
  "get_selected_text",
  "get_accessibility_tree",
  "get_page_metadata",
  "get_page_sections",
  "click_element",
  "fill_element",
  "scroll_page",
  "focus_elements",
  "show_translation",
  "get_news_trust",
  "navigate_to_page",
  "go_back",
] as const;

const browserToolArgumentsSchema = z.union([
  z.record(z.string(), z.unknown()),
  z.string().transform((value, context) => {
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        context.addIssue({ code: "custom", message: "Arguments must be an object" });
        return z.NEVER;
      }
      return parsed as Record<string, unknown>;
    } catch {
      context.addIssue({ code: "custom", message: "Arguments must be valid JSON" });
      return z.NEVER;
    }
  }),
]);

export const browserToolRequestSchema = z
  .object({
    session_id: z.string().uuid(),
    tool_name: z.enum(browserToolNames),
    action: z.string().optional(),
    arguments: browserToolArgumentsSchema.optional(),
  })
  .passthrough()
  .transform(({ action, arguments: arguments_, session_id, tool_name, ...parameters }) => ({
    session_id,
    tool_name,
    arguments: { ...parameters, ...arguments_, ...(action ? { action } : {}) },
  }));

const browserToolBridge = new BrowserToolBridge();

const logBrowserTool = (event: string, details: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[Browser tool] ${event}`, details);
  }
};

const serverAudioInterface: AsyncAudioInterface = {
  start: async () => undefined,
  stop: async () => undefined,
  output: async () => undefined,
  interrupt: () => undefined,
};

const getSessionToken = (request: IncomingMessage) => {
  const protocols = request.headers["sec-websocket-protocol"];
  if (!protocols) return undefined;
  const values = protocols.split(",").map((value) => value.trim());
  return values[0] === "bearer" ? values[1] : undefined;
};

const getVoiceConfig = (agentVariables: Record<string, string>) => {
  const orgId = process.env.SARVAM_ORG_ID;
  const workspaceId = process.env.SARVAM_WORKSPACE_ID;
  const appId = process.env.SARVAM_VOICE_AGENT_ID;

  if (!orgId || !workspaceId || !appId) {
    throw new Error(
      "SARVAM_ORG_ID, SARVAM_WORKSPACE_ID, and SARVAM_VOICE_AGENT_ID are required",
    );
  }

  return {
    org_id: orgId,
    workspace_id: workspaceId,
    app_id: appId,
    user_identifier_type: "custom",
    user_identifier: "website-widget",
    interaction_type: InteractionType.CALL,
    input_sample_rate: 16000 as const,
    output_sample_rate: 16000 as const,
    agent_variables: agentVariables,
  };
};

const waitForContext = (socket: WebSocket) =>
  new Promise<Record<string, string>>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Page context timed out")), 10000);
    socket.once("message", (raw) => {
      clearTimeout(timeout);
      try {
        const message = JSON.parse(raw.toString()) as VoiceClientMessage;
        if (message.type !== "init") throw new Error("Page context is required");
        resolve(message.context);
      } catch (error) {
        reject(error);
      }
    });
  });

type VoiceSocket = Pick<WebSocket, "close" | "readyState" | "send">;

type VoiceAgent = Pick<
  ConversationAgent,
  "mute" | "sendAudio" | "stop" | "unmute"
>;

type VoiceSessionOptions = {
  agent: VoiceAgent;
  onCleanup: () => void;
  onToolResult: (message: Extract<VoiceClientMessage, { type: "tool_result" }>) => void;
  socket?: VoiceSocket;
  getSocket?: () => VoiceSocket | undefined;
};

const send = (socket: VoiceSocket | undefined, message: unknown) => {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
};

export const createVoiceSession = ({
  agent,
  onCleanup,
  onToolResult,
  socket,
  getSocket,
}: VoiceSessionOptions) => {
  let ended = false;
  let paused = false;
  const activeSocket = () => getSocket?.() ?? socket;

  const finish = async (notifyClient: boolean) => {
    if (ended) return;
    ended = true;
    onCleanup();
    const currentSocket = activeSocket();
    if (notifyClient) send(currentSocket, { type: "server.action.interaction_end" });
    if (currentSocket?.readyState === WebSocket.OPEN) currentSocket.close(1000);
    await agent.stop().catch(() => undefined);
  };

  return {
    close: () => finish(false),
    endByAgent: () => finish(true),
    handleMessage: async (message: VoiceClientMessage) => {
      if (message.type === "pause") {
        if (!paused && !ended) {
          await agent.mute();
          paused = true;
        }
        if (!ended) send(activeSocket(), { type: "paused" });
        return;
      }

      if (message.type === "resume") {
        if (paused && !ended) {
          await agent.unmute();
          paused = false;
        }
        if (!ended) send(activeSocket(), { type: "resumed" });
        return;
      }

      if (message.type === "end" || message.type === "stop") {
        await finish(true);
        return;
      }

      if (message.type === "audio" && !paused && !ended) {
        await agent.sendAudio(Buffer.from(message.audio, "base64"));
        return;
      }

      if (message.type === "tool_result" && !ended) onToolResult(message);
    },
  };
};

const forwardTranscriptionsWithoutSdkWarning = (
  agent: ConversationAgent,
  getSocket: () => VoiceSocket | undefined,
) => {
  const internalAgent = agent as unknown as {
    agent: { routeMessage: (message: unknown) => Promise<void> };
  };
  const routeMessage = internalAgent.agent.routeMessage.bind(internalAgent.agent);

  internalAgent.agent.routeMessage = async (message) => {
    if (
      typeof message === "object" &&
      message !== null &&
      "type" in message &&
      message.type === "server.event.transcription"
    ) {
      send(getSocket(), message);
      return;
    }
    await routeMessage(message);
  };
};

const hasToolAuthorization = (authorization: string | undefined, secret: string) => {
  if (!authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
};

export const browserToolRequestHandler: RequestHandler = async (request, response) => {
  const secret = process.env.SARVAM_TOOL_SECRET;
  if (!secret) {
    response.status(503).json({ error: "Browser tools are not configured" });
    return;
  }
  if (!hasToolAuthorization(request.header("authorization"), secret)) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = browserToolRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    const requestShape =
      request.body && typeof request.body === "object" && !Array.isArray(request.body)
        ? Object.fromEntries(
            Object.entries(request.body).map(([key, value]) => [
              key,
              Array.isArray(value) ? "array" : typeof value,
            ]),
          )
        : { body: typeof request.body };
    logBrowserTool("invalid request", {
      fields: requestShape,
      issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
    response.status(400).json({ error: "Invalid browser tool request" });
    return;
  }

  logBrowserTool("received", {
    tool: parsed.data.tool_name,
    action: parsed.data.arguments.action,
  });

  try {
    const result = await browserToolBridge.request(
      parsed.data.session_id,
      parsed.data.tool_name,
      parsed.data.arguments,
    );
    logBrowserTool("completed", {
      tool: parsed.data.tool_name,
      action: parsed.data.arguments.action,
      result,
    });
    response.status(200).json({ result });
  } catch (error) {
    if (!(error instanceof BrowserToolBridgeError)) {
      response.status(500).json({ error: "Unable to execute browser tool" });
      return;
    }

    const status = error.code === "session_not_found" ? 404 : 504;
    logBrowserTool("failed", { tool: parsed.data.tool_name, code: error.code });
    response.status(status).json({ error: error.code });
  }
};

const authenticate = async (request: IncomingMessage) => {
  const token = getSessionToken(request);
  if (!token) return false;

  const headers = fromNodeHeaders({
    ...request.headers,
    authorization: `Bearer ${token}`,
  });
  return Boolean(await auth.api.getSession({ headers }));
};

const voiceReconnectGraceMs = 30_000;

type VoiceTransport = {
  socket?: WebSocket;
};

type ResumableVoiceSession = {
  id: string;
  session: ReturnType<typeof createVoiceSession>;
  transport: VoiceTransport;
  cleanupTimer?: ReturnType<typeof setTimeout>;
};

const resumableVoiceSessions = new Map<string, ResumableVoiceSession>();

const attachSocketToResumableSession = (
  resumableSession: ResumableVoiceSession,
  socket: WebSocket,
) => {
  if (resumableSession.cleanupTimer) {
    clearTimeout(resumableSession.cleanupTimer);
    resumableSession.cleanupTimer = undefined;
  }
  resumableSession.transport.socket = socket;

  socket.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString()) as VoiceClientMessage;
      await resumableSession.session.handleMessage(message);
    } catch (error) {
      send(socket, {
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      void resumableSession.session.close();
    }
  });

  socket.on("close", () => {
    if (
      resumableVoiceSessions.get(resumableSession.id) !== resumableSession
      || resumableSession.transport.socket !== socket
    ) {
      return;
    }
    resumableSession.transport.socket = undefined;
    resumableSession.cleanupTimer = setTimeout(() => {
      if (resumableVoiceSessions.get(resumableSession.id) === resumableSession) {
        void resumableSession.session.close();
      }
    }, voiceReconnectGraceMs);
  });

  send(socket, { type: "ready", session_id: resumableSession.id });
};

const handleConnection = async (socket: WebSocket, request: IncomingMessage) => {
  if (!(await authenticate(request))) {
    socket.close(1008, "Authentication required");
    return;
  }

  const resumeSessionId = new URL(request.url ?? "/ws/voice", "http://localhost")
    .searchParams.get("resume_session_id");
  if (resumeSessionId) {
    const resumableSession = resumableVoiceSessions.get(resumeSessionId);
    if (!resumableSession) {
      send(socket, { type: "error", message: "The previous voice session has ended. Press Start to begin again." });
      socket.close(1008, "Voice session not found");
      return;
    }
    attachSocketToResumableSession(resumableSession, socket);
    return;
  }

  const apiKey = process.env.SARVAM_CONVERSATIONS_API_KEY?.trim();
  if (!apiKey) {
    socket.close(
      1011,
      "SARVAM_CONVERSATIONS_API_KEY is not configured; create it in Sarvam Conversations Settings > API Key",
    );
    return;
  }

  let agent: ConversationAgent;
  let browserSessionId: string | undefined;
  let session: ReturnType<typeof createVoiceSession> | undefined;
  const transport: VoiceTransport = { socket };
  const resumableSessionId = randomUUID();
  try {
    const contextPromise = waitForContext(socket);
    send(socket, { type: "context_required" });
    const agentVariables = await contextPromise;
    browserSessionId = randomUUID();
    browserToolBridge.register(browserSessionId, (call) => {
      logBrowserTool("forwarded to extension", { tool: call.name, action: call.arguments.action });
      send(transport.socket, {
        type: "browser_tool_call",
        request_id: call.requestId,
        name: call.name,
        arguments: call.arguments,
      });
    });
    agent = new ConversationAgent({
      apiKey,
      config: getVoiceConfig({ ...agentVariables, voice_session_id: browserSessionId }),
      platform: "node",
      audioInterface: serverAudioInterface,
      audioCallback: async (message) => send(transport.socket, message),
      textCallback: async (message) => send(transport.socket, message),
      transcriptCallback: async (message) => send(transport.socket, message),
      eventCallback: async (event) => send(transport.socket, event),
      endCallback: async () => session?.endByAgent(),
    });
    forwardTranscriptionsWithoutSdkWarning(agent, () => transport.socket);
    session = createVoiceSession({
      agent,
      getSocket: () => transport.socket,
      onCleanup: () => {
        if (browserSessionId) browserToolBridge.unregister(browserSessionId);
        const resumableSession = resumableVoiceSessions.get(resumableSessionId);
        if (resumableSession?.cleanupTimer) clearTimeout(resumableSession.cleanupTimer);
        resumableVoiceSessions.delete(resumableSessionId);
      },
      onToolResult: (message) => {
        if (!browserSessionId || !message.request_id) return;
        const resolved = browserToolBridge.resolve(
          browserSessionId,
          message.request_id,
          message.name,
          message.result,
        );
        logBrowserTool("extension result", {
          tool: message.name,
          resolved,
          result: message.result,
        });
      },
    });

    await agent.start();
    if (!(await agent.waitForConnect(10))) {
      send(socket, { type: "error", message: "Voice agent connection timed out" });
      await session.close();
      return;
    }
    if (!session) throw new Error("Voice session could not be created");
    const resumableSession: ResumableVoiceSession = {
      id: resumableSessionId,
      session,
      transport,
    };
    resumableVoiceSessions.set(resumableSession.id, resumableSession);
    attachSocketToResumableSession(resumableSession, socket);
  } catch (error) {
    send(socket, {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    await session?.close();
    if (!session && browserSessionId) browserToolBridge.unregister(browserSessionId);
    socket.close(1011, "Unable to start voice agent");
    return;
  }
};

export const attachVoiceWebSocket = (server: Server) => {
  const wsServer = new WebSocketServer({
    noServer: true,
    handleProtocols: (protocols) => (protocols.has("bearer") ? "bearer" : ""),
  });

  server.on("upgrade", (request, socket, head) => {
    if (request.url?.split("?")[0] !== "/ws/voice") {
      socket.destroy();
      return;
    }

    wsServer.handleUpgrade(request, socket, head, (client) => {
      void handleConnection(client, request);
    });
  });
};
