import { describe, expect, test, vi } from "vitest";
import { WebSocket } from "ws";
import { createVoiceSession } from "../../src/lib/voice.js";

const createSocket = () => ({
  close: vi.fn(),
  readyState: WebSocket.OPEN,
  send: vi.fn(),
});

const createAgent = () => ({
  mute: vi.fn().mockResolvedValue(undefined),
  sendAudio: vi.fn().mockResolvedValue(undefined),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  unmute: vi.fn().mockResolvedValue(undefined),
});

describe("voice session lifecycle", () => {
  test("pauses and resumes an existing agent without starting another interaction", async () => {
    const agent = createAgent();
    const socket = createSocket();
    const session = createVoiceSession({
      agent: agent as never,
      socket: socket as never,
      onCleanup: vi.fn(),
      onToolResult: vi.fn(),
    });

    await session.handleMessage({ type: "pause" });
    await session.handleMessage({ type: "audio", audio: "AQI=" });
    await session.handleMessage({ type: "resume" });
    await session.handleMessage({ type: "audio", audio: "AQI=" });

    expect(agent.mute).toHaveBeenCalledOnce();
    expect(agent.unmute).toHaveBeenCalledOnce();
    expect(agent.sendAudio).toHaveBeenCalledOnce();
    expect(agent.start).not.toHaveBeenCalled();
    expect(socket.send).toHaveBeenNthCalledWith(1, JSON.stringify({ type: "paused" }));
    expect(socket.send).toHaveBeenNthCalledWith(2, JSON.stringify({ type: "resumed" }));
    expect(agent.stop).not.toHaveBeenCalled();
  });

  test("ends once and runs browser-tool cleanup for an explicit end", async () => {
    const agent = createAgent();
    const socket = createSocket();
    const onCleanup = vi.fn();
    const session = createVoiceSession({
      agent: agent as never,
      socket: socket as never,
      onCleanup,
      onToolResult: vi.fn(),
    });

    await session.handleMessage({ type: "end" });
    await session.close();

    expect(agent.stop).toHaveBeenCalledOnce();
    expect(onCleanup).toHaveBeenCalledOnce();
    expect(socket.close).toHaveBeenCalledWith(1000);
    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "server.action.interaction_end" }),
    );
  });

  test("cleans up an unexpected socket close", async () => {
    const agent = createAgent();
    const socket = createSocket();
    const onCleanup = vi.fn();
    const session = createVoiceSession({
      agent: agent as never,
      socket: socket as never,
      onCleanup,
      onToolResult: vi.fn(),
    });

    await session.close();

    expect(agent.stop).toHaveBeenCalledOnce();
    expect(onCleanup).toHaveBeenCalledOnce();
    expect(socket.send).not.toHaveBeenCalled();
  });

  test("forwards tool results only while the session is active", async () => {
    const agent = createAgent();
    const socket = createSocket();
    const onToolResult = vi.fn();
    const session = createVoiceSession({
      agent: agent as never,
      socket: socket as never,
      onCleanup: vi.fn(),
      onToolResult,
    });

    await session.handleMessage({
      type: "tool_result",
      request_id: "request-1",
      name: "get_page_context",
      result: { title: "Bakbak" },
    });
    await session.handleMessage({ type: "stop" });
    await session.handleMessage({
      type: "tool_result",
      request_id: "request-2",
      name: "get_page_context",
      result: { title: "Ignored" },
    });

    expect(onToolResult).toHaveBeenCalledOnce();
    expect(agent.stop).toHaveBeenCalledOnce();
  });
});
