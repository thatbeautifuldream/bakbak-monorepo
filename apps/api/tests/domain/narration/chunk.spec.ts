import { describe, expect, test } from "vitest";
import { chunkText, estimateSeconds } from "../../../src/domain/narration/chunk.js";

const sentence = (words: number, word = "word") =>
  `${Array.from({ length: words }, () => word).join(" ")}.`;

describe("chunkText", () => {
  test("returns nothing for blank input", () => {
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  test("keeps short text as a single chunk", () => {
    expect(chunkText("Hello there. How are you?")).toEqual([
      "Hello there. How are you?",
    ]);
  });

  test("never exceeds the limit", () => {
    const text = Array.from({ length: 200 }, () => sentence(20)).join(" ");
    for (const chunk of chunkText(text, 500)) {
      expect(chunk.length).toBeLessThanOrEqual(500);
    }
  });

  test("splits on sentence boundaries rather than mid-sentence", () => {
    const text = `${sentence(10, "alpha")} ${sentence(10, "beta")}`;
    const chunks = chunkText(text, 60);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.endsWith(".")).toBe(true);
    }
  });

  test("splits Devanagari danda sentences", () => {
    const text = "यह पहला वाक्य है। यह दूसरा वाक्य है। यह तीसरा वाक्य है।";
    const chunks = chunkText(text, 20);
    expect(chunks.length).toBe(3);
    expect(chunks[0]).toBe("यह पहला वाक्य है।");
  });

  test("hard-splits a single overlong sentence at word boundaries", () => {
    const chunks = chunkText(sentence(2000), 500);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(500);
      expect(chunk.startsWith(" ")).toBe(false);
      expect(chunk).not.toMatch(/\bwor$|\bwo$/);
    }
  });

  test("preserves every word in order", () => {
    const text = Array.from({ length: 50 }, (_, i) => `Sentence number ${i}.`).join(
      "\n\n",
    );
    const rejoined = chunkText(text, 120).join(" ").split(/\s+/);
    expect(rejoined).toEqual(text.split(/\s+/));
  });
});

describe("estimateSeconds", () => {
  test("scales inversely with pace", () => {
    expect(estimateSeconds(1500, 1)).toBe(100);
    expect(estimateSeconds(1500, 2)).toBe(50);
  });
});
