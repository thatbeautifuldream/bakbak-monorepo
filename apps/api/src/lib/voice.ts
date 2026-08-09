import { ConversationAgent, InteractionType } from "sarvam-conv-ai-sdk";
import type { IncomingMessage, Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

type ClientMessage =
  | { type: "audio"; audio: string }
  | { type: "stop" };

const getSessionToken = (request: IncomingMessage) => {
  const protocols = request.headers["sec-websocket-protocol"];
  if (!protocols) return undefined;
  const values = protocols.split(",").map((value) => value.trim());
  return values[0] === "bearer" ? values[1] : undefined;
};

const getVoiceConfig = () => {
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
  };
};

const send = (socket: WebSocket, message: unknown) => {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
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

const handleConnection = async (socket: WebSocket, request: IncomingMessage) => {
  if (!(await authenticate(request))) {
    socket.close(1008, "Authentication required");
    return;
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    socket.close(1011, "SARVAM_API_KEY is not configured");
    return;
  }

  let agent: ConversationAgent;
  try {
    agent = new ConversationAgent({
      apiKey,
      config: getVoiceConfig(),
      platform: "node",
      audioCallback: async (message) => send(socket, message),
      textCallback: async (message) => send(socket, message),
      transcriptCallback: async (message) => send(socket, message),
      eventCallback: async (event) => send(socket, event),
    });

    await agent.start();
    if (!(await agent.waitForConnect(10))) {
      socket.close(1011, "Voice agent connection timed out");
      return;
    }
    send(socket, { type: "ready" });
  } catch (error) {
    send(socket, {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    socket.close(1011, "Unable to start voice agent");
    return;
  }

  socket.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString()) as ClientMessage;
      if (message.type === "stop") {
        await agent.stop();
        socket.close(1000);
        return;
      }
      if (message.type === "audio" && typeof message.audio === "string") {
        await agent.sendAudio(Buffer.from(message.audio, "base64"));
      }
    } catch (error) {
      send(socket, {
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  socket.on("close", () => void agent.stop().catch(() => undefined));
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
