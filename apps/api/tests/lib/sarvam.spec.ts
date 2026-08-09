import { beforeEach, describe, expect, test, vi } from "vitest";

const { convert } = vi.hoisted(() => ({ convert: vi.fn() }));

vi.mock("sarvamai", () => ({
  SarvamAIClient: class {
    textToSpeech = { convert };
  },
}));

const { synthesize } = await import("../../src/lib/sarvam.js");

describe("synthesize", () => {
  beforeEach(() => {
    process.env.SARVAM_API_KEY = "test-key";
    convert.mockReset();
  });

  test("combines all audio chunks returned by Sarvam", async () => {
    convert.mockResolvedValue({
      audios: ["QU", "JD"],
      request_id: "req-1",
    });

    await expect(
      synthesize("Hello.", {
        languageCode: "en-IN",
        speaker: "shubh",
        model: "bulbul:v3",
        codec: "mp3",
      }),
    ).resolves.toEqual({ audio: "QUJD", requestId: "req-1" });
  });
});
