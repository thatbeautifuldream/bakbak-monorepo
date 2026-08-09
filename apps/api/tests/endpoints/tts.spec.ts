import { testEndpoint } from "express-zod-api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { resetAuthUser } from "../helpers/auth.js";

vi.mock("../../src/auth.js", async () => {
  const { createAuthenticatedEndpointsFactory, createAdminEndpointsFactory } =
    await import("../helpers/auth.js");
  return {
    authenticatedEndpointsFactory: createAuthenticatedEndpointsFactory(),
    adminEndpointsFactory: createAdminEndpointsFactory(),
  };
});

const sarvamMocks = {
  synthesize: vi.fn(),
  translate: vi.fn(),
  identifyLanguage: vi.fn(),
  prepareScript: vi.fn(),
};

vi.mock("../../src/lib/sarvam.js", () => sarvamMocks);

const { getVoicesEndpoint, planNarrationEndpoint, speakEndpoint } = await import(
  "../../src/endpoints/tts.js"
);

describe("tts endpoints", () => {
  beforeEach(() => {
    sarvamMocks.synthesize.mockResolvedValue({
      audio: "QUJD",
      requestId: "req-1",
    });
    sarvamMocks.identifyLanguage.mockResolvedValue("en-IN");
    sarvamMocks.prepareScript.mockImplementation(async (text: string) => text);
    sarvamMocks.translate.mockImplementation(async (text: string) => ({
      text: `[hi] ${text}`,
      detectedSource: "en-IN",
    }));
  });

  afterEach(() => {
    resetAuthUser();
    vi.clearAllMocks();
  });

  test("getVoicesEndpoint lists models with their speakers", async () => {
    const { responseMock } = await testEndpoint({ endpoint: getVoicesEndpoint });

    expect(responseMock._getStatusCode()).toBe(200);
    const { data } = responseMock._getJSONData();
    expect(data.models.map((model: { id: string }) => model.id)).toEqual([
      "bulbul:v3",
      "bulbul:v2",
    ]);
    expect(data.models[0].speakers).toContain("shubh");
    expect(data.models[1].speakers).toContain("anushka");
    expect(data.models[0].supportsTemperature).toBe(true);
    expect(data.models[1].supportsPitchAndLoudness).toBe(true);
    expect(data.languages).toContain("hi-IN");
  });

  test("speakEndpoint returns base64 audio", async () => {
    const { responseMock } = await testEndpoint({
      endpoint: speakEndpoint,
      requestProps: {
        method: "POST",
        body: { text: "Hello there.", languageCode: "en-IN" },
      },
    });

    expect(responseMock._getStatusCode()).toBe(200);
    expect(responseMock._getJSONData()).toEqual({
      status: "success",
      data: {
        audio: "QUJD",
        codec: "mp3",
        sampleRate: 24000,
        chars: 12,
        requestId: "req-1",
      },
    });
    expect(sarvamMocks.synthesize).toHaveBeenCalledWith(
      "Hello there.",
      expect.objectContaining({
        languageCode: "en-IN",
        speaker: "shubh",
        model: "bulbul:v3",
      }),
    );
  });

  test("speakEndpoint defaults to the v2 voice when the v2 model is chosen", async () => {
    await testEndpoint({
      endpoint: speakEndpoint,
      requestProps: {
        method: "POST",
        body: { text: "Hi.", languageCode: "en-IN", model: "bulbul:v2" },
      },
    });

    expect(sarvamMocks.synthesize).toHaveBeenCalledWith(
      "Hi.",
      expect.objectContaining({ speaker: "anushka", model: "bulbul:v2" }),
    );
  });

  test("speakEndpoint rejects a speaker the model does not support", async () => {
    const { responseMock } = await testEndpoint({
      endpoint: speakEndpoint,
      requestProps: {
        method: "POST",
        body: {
          text: "Hi.",
          languageCode: "en-IN",
          model: "bulbul:v2",
          speaker: "shubh",
        },
      },
    });

    expect(responseMock._getStatusCode()).toBe(400);
    expect(sarvamMocks.synthesize).not.toHaveBeenCalled();
  });

  test("speakEndpoint rejects text beyond the chunk limit", async () => {
    const { responseMock } = await testEndpoint({
      endpoint: speakEndpoint,
      requestProps: {
        method: "POST",
        body: { text: "a".repeat(2001), languageCode: "en-IN" },
      },
    });

    expect(responseMock._getStatusCode()).toBe(400);
    expect(responseMock._getJSONData()).toMatchObject({ status: "error" });
    expect(sarvamMocks.synthesize).not.toHaveBeenCalled();
  });

  test("planNarrationEndpoint returns ordered chunks and honours translation", async () => {
    const { responseMock } = await testEndpoint({
      endpoint: planNarrationEndpoint,
      requestProps: {
        method: "POST",
        body: {
          text: "First sentence. Second sentence.",
          contentType: "news",
          sourceLanguageCode: "en-IN",
          targetLanguageCode: "hi-IN",
          prepare: false,
        },
      },
    });

    expect(responseMock._getStatusCode()).toBe(200);
    const { data } = responseMock._getJSONData();
    expect(data.languageCode).toBe("hi-IN");
    expect(data.translated).toBe(true);
    expect(data.prepared).toBe(false);
    expect(data.chunks).toEqual([
      { index: 0, text: "[hi] First sentence. Second sentence." },
    ]);
    expect(sarvamMocks.prepareScript).not.toHaveBeenCalled();
  });

  test("planNarrationEndpoint runs the LLM clean-up pass by default", async () => {
    sarvamMocks.prepareScript.mockResolvedValue("Cleaned body.");

    const { responseMock } = await testEndpoint({
      endpoint: planNarrationEndpoint,
      requestProps: {
        method: "POST",
        body: { text: "Share this! Body text.", sourceLanguageCode: "en-IN" },
      },
    });

    expect(responseMock._getStatusCode()).toBe(200);
    const { data } = responseMock._getJSONData();
    expect(data.prepared).toBe(true);
    expect(data.chunks[0].text).toBe("Cleaned body.");
    expect(sarvamMocks.prepareScript).toHaveBeenCalledWith(
      "Share this! Body text.",
      "general",
      undefined,
    );
  });

  test("planNarrationEndpoint fails when preparation leaves nothing to narrate", async () => {
    sarvamMocks.prepareScript.mockResolvedValue("   ");

    const { responseMock } = await testEndpoint({
      endpoint: planNarrationEndpoint,
      requestProps: {
        method: "POST",
        body: { text: "Cookie banner. Accept all.", sourceLanguageCode: "en-IN" },
      },
    });

    expect(responseMock._getStatusCode()).toBe(422);
  });
});
