import {
  TRANSLATE_MAX_CHARS,
  TTS_MAX_CHARS,
  chunkText,
  estimateSeconds,
} from "./chunk.js";
import {
  DEFAULT_LANGUAGE,
  TTS_LANGUAGES,
  type ContentType,
  type TranslateSourceLanguage,
  type TtsLanguage,
} from "./voices.js";

export const PREPARE_MAX_CHARS = 4000;

export type NarrationDeps = {
  prepare: (text: string, contentType: ContentType, title?: string) => Promise<string>;
  translate: (
    text: string,
    params: { source: TranslateSourceLanguage; target: TtsLanguage },
  ) => Promise<{ text: string; detectedSource: string }>;
  identifyLanguage: (text: string) => Promise<TtsLanguage | undefined>;
};

export type NarrationOptions = {
  contentType: ContentType;
  title?: string;
  prepare: boolean;
  sourceLanguageCode: TranslateSourceLanguage;
  targetLanguageCode?: TtsLanguage;
  pace: number;
};

export type NarrationPlan = {
  languageCode: TtsLanguage;
  sourceLanguageCode: string;
  translated: boolean;
  prepared: boolean;
  chunks: { index: number; text: string }[];
  totalChars: number;
  estimatedSeconds: number;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
};

/**
 * Builds the narration script: LLM clean-up, then translation, then chunking
 * to the TTS character limit. Each stage re-chunks to its own API limit.
 * Network calls are injected so this stays pure and testable.
 */
export const planNarration = async (
  text: string,
  options: NarrationOptions,
  deps: NarrationDeps,
  concurrency = 4,
): Promise<NarrationPlan> => {
  let script = text.trim();
  let prepared = false;

  let sourceLanguageCode = options.sourceLanguageCode;
  if (sourceLanguageCode === "auto" && script) {
    const detected = await deps.identifyLanguage(script.slice(0, 500));
    sourceLanguageCode = detected ?? DEFAULT_LANGUAGE;
  }

  if (options.prepare && script) {
    const segments = chunkText(script, PREPARE_MAX_CHARS);
    const cleaned = await mapWithConcurrency(segments, concurrency, (segment) =>
      deps.prepare(segment, options.contentType, options.title),
    );
    script = cleaned.map((segment) => segment.trim()).filter(Boolean).join("\n\n");
    prepared = true;
  }

  const target = options.targetLanguageCode;
  const shouldTranslate =
    Boolean(target) && target !== sourceLanguageCode && Boolean(script);
  let translated = false;

  if (shouldTranslate && target) {
    const segments = chunkText(script, TRANSLATE_MAX_CHARS);
    const results = await mapWithConcurrency(segments, concurrency, (segment) =>
      deps.translate(segment, { source: sourceLanguageCode, target }),
    );
    script = results.map((result) => result.text.trim()).filter(Boolean).join("\n\n");
    translated = true;
  }

  const chunks = chunkText(script, TTS_MAX_CHARS).map((chunk, index) => ({
    index,
    text: chunk,
  }));
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);
  const resolved = target ?? sourceLanguageCode;
  const languageCode = (TTS_LANGUAGES as readonly string[]).includes(resolved)
    ? (resolved as TtsLanguage)
    : DEFAULT_LANGUAGE;

  return {
    languageCode,
    sourceLanguageCode,
    translated,
    prepared,
    chunks,
    totalChars,
    estimatedSeconds: estimateSeconds(totalChars, options.pace),
  };
};
