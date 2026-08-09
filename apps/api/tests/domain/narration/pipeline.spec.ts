import { describe, expect, test, vi } from "vitest";
import { planNarration } from "../../../src/domain/narration/pipeline.js";
import {
  TRANSLATE_MAX_CHARS,
  TTS_MAX_CHARS,
} from "../../../src/domain/narration/chunk.js";

const baseOptions = {
  contentType: "general" as const,
  prepare: false,
  sourceLanguageCode: "en-IN",
  pace: 1,
};

const stubDeps = (overrides = {}) => ({
  prepare: vi.fn(async (text: string) => text),
  translate: vi.fn(async (text: string) => ({
    text: `[hi] ${text}`,
    detectedSource: "en-IN",
  })),
  identifyLanguage: vi.fn(async () => "en-IN"),
  ...overrides,
});

describe("planNarration", () => {
  test("chunks without touching the network when prepare and translate are off", async () => {
    const deps = stubDeps();
    const plan = await planNarration("One. Two. Three.", baseOptions, deps);

    expect(deps.prepare).not.toHaveBeenCalled();
    expect(deps.translate).not.toHaveBeenCalled();
    expect(deps.identifyLanguage).not.toHaveBeenCalled();
    expect(plan.chunks).toEqual([{ index: 0, text: "One. Two. Three." }]);
    expect(plan.prepared).toBe(false);
    expect(plan.translated).toBe(false);
    expect(plan.languageCode).toBe("en-IN");
  });

  test("detects the source language when set to auto", async () => {
    const deps = stubDeps({ identifyLanguage: vi.fn(async () => "hi-IN") });
    const plan = await planNarration(
      "यह एक वाक्य है।",
      { ...baseOptions, sourceLanguageCode: "auto" },
      deps,
    );

    expect(deps.identifyLanguage).toHaveBeenCalledOnce();
    expect(plan.sourceLanguageCode).toBe("hi-IN");
    expect(plan.languageCode).toBe("hi-IN");
  });

  test("falls back to the default language when detection fails", async () => {
    const deps = stubDeps({ identifyLanguage: vi.fn(async () => undefined) });
    const plan = await planNarration(
      "Some text.",
      { ...baseOptions, sourceLanguageCode: "auto" },
      deps,
    );

    expect(plan.languageCode).toBe("en-IN");
  });

  test("prepares before translating", async () => {
    const order: string[] = [];
    const deps = stubDeps({
      prepare: vi.fn(async (text: string) => {
        order.push("prepare");
        return `cleaned ${text}`;
      }),
      translate: vi.fn(async (text: string) => {
        order.push("translate");
        return { text: `translated ${text}`, detectedSource: "en-IN" };
      }),
    });

    const plan = await planNarration(
      "Body text.",
      { ...baseOptions, prepare: true, targetLanguageCode: "hi-IN" },
      deps,
    );

    expect(order).toEqual(["prepare", "translate"]);
    expect(plan.chunks[0].text).toBe("translated cleaned Body text.");
    expect(plan.prepared).toBe(true);
    expect(plan.translated).toBe(true);
    expect(plan.languageCode).toBe("hi-IN");
  });

  test("skips translation when the target matches the source", async () => {
    const deps = stubDeps();
    const plan = await planNarration(
      "Already English.",
      { ...baseOptions, targetLanguageCode: "en-IN" },
      deps,
    );

    expect(deps.translate).not.toHaveBeenCalled();
    expect(plan.translated).toBe(false);
  });

  test("respects the translate limit on the way in and the TTS limit on the way out", async () => {
    const long = Array.from({ length: 900 }, (_, i) => `Sentence ${i}.`).join(" ");
    const deps = stubDeps({
      translate: vi.fn(async (text: string) => ({
        text,
        detectedSource: "en-IN",
      })),
    });

    const plan = await planNarration(
      long,
      { ...baseOptions, targetLanguageCode: "hi-IN" },
      deps,
    );

    expect(deps.translate.mock.calls.length).toBeGreaterThan(1);
    for (const [segment] of deps.translate.mock.calls) {
      expect(segment.length).toBeLessThanOrEqual(TRANSLATE_MAX_CHARS);
    }
    for (const chunk of plan.chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(TTS_MAX_CHARS);
    }
    expect(plan.chunks.map((chunk) => chunk.index)).toEqual(
      plan.chunks.map((_, index) => index),
    );
  });

  test("keeps chunk order under concurrency", async () => {
    const long = Array.from({ length: 400 }, (_, i) => `Sentence ${i}.`).join(" ");
    const deps = stubDeps({
      translate: vi.fn(async (text: string) => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
        return { text, detectedSource: "en-IN" };
      }),
    });

    const plan = await planNarration(
      long,
      { ...baseOptions, targetLanguageCode: "hi-IN" },
      deps,
    );

    const rejoined = plan.chunks.map((chunk) => chunk.text).join(" ");
    expect(rejoined.split(/\s+/)).toEqual(long.split(/\s+/));
  });
});
