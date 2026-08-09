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

const synthesize = vi.fn();
vi.mock("../../src/lib/sarvam.js", () => ({ synthesize }));

const { speakEndpoint } = await import("../../src/endpoints/tts.js");

describe("tts endpoint", () => {
  beforeEach(() => {
    synthesize.mockResolvedValue({ audio: "UklGRg==", requestId: "req-1" });
  });

  afterEach(() => {
    resetAuthUser();
    vi.clearAllMocks();
  });

  test("returns WAV audio for short text", async () => {
    const { responseMock } = await testEndpoint({
      endpoint: speakEndpoint,
      requestProps: {
        method: "POST",
        body: { text: "Hello there." },
      },
    });

    expect(responseMock._getStatusCode()).toBe(200);
    expect(responseMock._getJSONData()).toEqual({
      status: "success",
      data: {
        audio: "UklGRg==",
        codec: "wav",
        sampleRate: 24000,
        requestId: "req-1",
      },
    });
    expect(synthesize).toHaveBeenCalledWith(
      "Hello there.",
      expect.objectContaining({
        languageCode: "en-IN",
        speaker: "shubh",
        model: "bulbul:v3",
        codec: "wav",
      }),
    );
  });
});
