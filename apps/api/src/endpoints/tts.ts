import { z } from "zod";
import createError from "http-errors";
import { authenticatedEndpointsFactory } from "../auth.js";
import {
  identifyLanguage,
  prepareScript,
  synthesize,
  translate,
} from "../lib/sarvam.js";
import { planNarration } from "../domain/narration/pipeline.js";
import { TTS_MAX_CHARS } from "../domain/narration/chunk.js";
import {
  ALL_SPEAKERS,
  AUDIO_CODECS,
  CONTENT_TYPES,
  DEFAULT_CODEC,
  DEFAULT_MODEL,
  DEFAULT_SAMPLE_RATE,
  SAMPLE_RATES,
  SPEAKERS_BY_MODEL,
  TTS_LANGUAGES,
  TTS_MODELS,
  defaultSpeakerFor,
  isSpeakerCompatible,
} from "../domain/narration/voices.js";

type ApiEndpoint = ReturnType<typeof authenticatedEndpointsFactory.build>;

const PLAN_MAX_CHARS = 60_000;

const modelSchema = z.enum(TTS_MODELS).describe("Bulbul model version");
const languageSchema = z.enum(TTS_LANGUAGES).describe("BCP-47 language code");
const speakerSchema = z.enum(ALL_SPEAKERS).describe("Voice name, lowercase");
const paceSchema = z
  .number()
  .min(0.5)
  .max(2)
  .describe("Speech rate; 1.0 is natural pace");

const voicesOutputSchema = z.object({
  models: z
    .array(
      z.object({
        id: modelSchema,
        speakers: z.array(speakerSchema).describe("Voices valid for this model"),
        supportsPitchAndLoudness: z
          .boolean()
          .describe("Only bulbul:v2 accepts pitch and loudness"),
        supportsTemperature: z
          .boolean()
          .describe("Only bulbul:v3 accepts temperature"),
        maxCharsPerRequest: z.number().describe("Sarvam per-request text limit"),
      }),
    )
    .describe("Available TTS models and their voices"),
  languages: z.array(languageSchema).describe("Languages available for narration"),
  contentTypes: z
    .array(z.enum(CONTENT_TYPES))
    .describe("Narration tones for script preparation"),
  audioCodecs: z.array(z.enum(AUDIO_CODECS)).describe("Supported output codecs"),
  sampleRates: z.array(z.number()).describe("Supported output sample rates"),
});

export const getVoicesEndpoint: ApiEndpoint =
  authenticatedEndpointsFactory.build({
    method: "get",
    input: z.object({}),
    tag: "tts",
    summary: "List voices and narration options",
    description:
      "Returns the Bulbul models, their compatible voices, supported languages, narration tones, codecs and sample rates. Use this to populate voice pickers instead of hardcoding values.",
    output: voicesOutputSchema,
    handler: async () => ({
      models: TTS_MODELS.map((id) => ({
        id,
        speakers: [...SPEAKERS_BY_MODEL[id]],
        supportsPitchAndLoudness: id === "bulbul:v2",
        supportsTemperature: id === "bulbul:v3",
        maxCharsPerRequest: id === "bulbul:v3" ? 2500 : 1500,
      })),
      languages: [...TTS_LANGUAGES],
      contentTypes: [...CONTENT_TYPES],
      audioCodecs: [...AUDIO_CODECS],
      sampleRates: [...SAMPLE_RATES],
    }),
  });

const planInputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(PLAN_MAX_CHARS)
    .describe("Extracted article text from the page"),
  title: z.string().max(300).optional().describe("Page or article title"),
  contentType: z
    .enum(CONTENT_TYPES)
    .default("general")
    .describe("Narration tone applied while preparing the script"),
  prepare: z
    .boolean()
    .default(true)
    .describe(
      "Run an LLM pass to strip navigation and boilerplate and expand abbreviations",
    ),
  sourceLanguageCode: z
    .enum([...TTS_LANGUAGES, "auto"])
    .default("auto")
    .describe("Language of the supplied text; 'auto' detects it"),
  targetLanguageCode: languageSchema
    .optional()
    .describe("Translate the script into this language before narrating"),
  pace: paceSchema.default(1).describe("Used only to estimate narration length"),
});

const planOutputSchema = z.object({
  languageCode: languageSchema.describe("Language to pass to /v1/tts/speak"),
  sourceLanguageCode: z.string().describe("Detected or supplied source language"),
  prepared: z.boolean().describe("Whether the LLM clean-up pass ran"),
  translated: z.boolean().describe("Whether the script was translated"),
  chunks: z
    .array(
      z.object({
        index: z.number().describe("Playback order, zero-based"),
        text: z.string().describe("Narration text for this chunk"),
      }),
    )
    .describe("Ordered chunks, each within the TTS character limit"),
  totalChars: z.number().describe("Total characters to be narrated"),
  estimatedSeconds: z.number().describe("Rough narration duration at the given pace"),
});

export const planNarrationEndpoint: ApiEndpoint =
  authenticatedEndpointsFactory.build({
    method: "post",
    input: planInputSchema,
    tag: "tts",
    summary: "Build a narration script",
    description:
      "Turns raw page text into an ordered list of narration-ready chunks: optional LLM clean-up, optional translation, then splitting at sentence boundaries within the TTS character limit. Returns no audio — call /v1/tts/speak per chunk and prefetch ahead of playback.",
    output: planOutputSchema,
    handler: async ({ input }) => {
      const plan = await planNarration(
        input.text,
        {
          contentType: input.contentType,
          title: input.title,
          prepare: input.prepare,
          sourceLanguageCode: input.sourceLanguageCode,
          targetLanguageCode: input.targetLanguageCode,
          pace: input.pace,
        },
        { prepare: prepareScript, translate, identifyLanguage },
      );

      if (plan.chunks.length === 0) {
        throw createError(422, "No narratable text remained after preparation");
      }

      return plan;
    },
  });

const speakInputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(TTS_MAX_CHARS)
    .describe("A single chunk from /v1/tts/plan"),
  languageCode: languageSchema,
  model: modelSchema.default(DEFAULT_MODEL),
  speaker: speakerSchema.optional().describe("Defaults to the model's default voice"),
  pace: paceSchema.default(1),
  temperature: z
    .number()
    .min(0.01)
    .max(2)
    .optional()
    .describe("Expressiveness; bulbul:v3 only"),
  pitch: z.number().min(-0.75).max(0.75).optional().describe("bulbul:v2 only"),
  loudness: z.number().min(0.3).max(3).optional().describe("bulbul:v2 only"),
  sampleRate: z
    .union(SAMPLE_RATES.map((rate) => z.literal(rate)))
    .default(DEFAULT_SAMPLE_RATE)
    .describe("Output sample rate in Hz"),
  codec: z.enum(AUDIO_CODECS).default(DEFAULT_CODEC).describe("Output audio codec"),
});

const speakOutputSchema = z.object({
  audio: z.string().describe("Base64-encoded audio for this chunk"),
  codec: z.enum(AUDIO_CODECS).describe("Codec of the returned audio"),
  sampleRate: z.number().describe("Sample rate of the returned audio"),
  chars: z.number().describe("Characters narrated"),
  requestId: z.string().optional().describe("Sarvam request id, for support"),
});

export const speakEndpoint: ApiEndpoint = authenticatedEndpointsFactory.build({
  method: "post",
  input: speakInputSchema,
  tag: "tts",
  summary: "Synthesize one chunk",
  description:
    "Converts a single narration chunk into base64-encoded audio using Sarvam Bulbul. Text must be within the TTS character limit — use /v1/tts/plan to split longer content.",
  output: speakOutputSchema,
  handler: async ({ input }) => {
    const speaker = input.speaker ?? defaultSpeakerFor(input.model);

    if (!isSpeakerCompatible(input.model, speaker)) {
      throw createError(
        400,
        `Speaker "${speaker}" is not available for ${input.model}`,
      );
    }

    const { audio, requestId } = await synthesize(input.text, {
      languageCode: input.languageCode,
      speaker,
      model: input.model,
      pace: input.pace,
      temperature: input.temperature,
      pitch: input.pitch,
      loudness: input.loudness,
      sampleRate: input.sampleRate,
      codec: input.codec,
    });

    return {
      audio,
      codec: input.codec,
      sampleRate: input.sampleRate,
      chars: input.text.length,
      requestId,
    };
  },
});
