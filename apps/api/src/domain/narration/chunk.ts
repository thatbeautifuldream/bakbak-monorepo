export const TTS_MAX_CHARS = 2000;
export const TRANSLATE_MAX_CHARS = 1800;

const SENTENCE_BOUNDARY = /(?<=[.!?।॥])\s+/;

const splitLongSentence = (sentence: string, maxChars: number): string[] => {
  const parts: string[] = [];
  let remaining = sentence;

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars + 1);
    const breakAt = window.lastIndexOf(" ");
    const cut = breakAt > 0 ? breakAt : maxChars;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) parts.push(remaining);
  return parts;
};

/**
 * Packs text into chunks of at most `maxChars`, preferring paragraph then
 * sentence boundaries so narration never cuts mid-thought. Sentences longer
 * than `maxChars` are split at word boundaries.
 */
export const chunkText = (text: string, maxChars = TTS_MAX_CHARS): string[] => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const units = normalized
    .split(/\n{2,}/)
    .flatMap((paragraph) => paragraph.trim().split(SENTENCE_BOUNDARY))
    .map((unit) => unit.trim())
    .filter(Boolean)
    .flatMap((unit) =>
      unit.length > maxChars ? splitLongSentence(unit, maxChars) : unit,
    );

  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    const candidate = current ? `${current} ${unit}` : unit;
    if (candidate.length > maxChars) {
      if (current) chunks.push(current);
      current = unit;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
};

/** Rough narration length, assuming ~15 characters per second at pace 1.0. */
export const estimateSeconds = (totalChars: number, pace = 1.0) =>
  Math.round(totalChars / 15 / pace);
