import { SarvamAIClient, type SarvamAI } from "sarvamai";
import createError from "http-errors";
import { buildScriptPrompt } from "../domain/narration/script.js";
import { TTS_LANGUAGES } from "../domain/narration/voices.js";
import type {
  AudioCodec,
  ContentType,
  TranslateSourceLanguage,
  TtsLanguage,
  TtsModel,
  TtsSpeaker,
} from "../domain/narration/voices.js";

export const TEXT_MODEL = (process.env.SARVAM_TEXT_MODEL ??
  "sarvam-105b") as SarvamAI.SarvamModelIds;
export const TRANSLATE_MODEL = (process.env.SARVAM_TRANSLATE_MODEL ??
  "sarvam-translate:v1") as SarvamAI.TranslateModel;

let client: SarvamAIClient | undefined;

const getClient = () => {
  if (!client) {
    const apiSubscriptionKey = process.env.SARVAM_API_KEY;
    if (!apiSubscriptionKey) {
      throw createError(500, "SARVAM_API_KEY is not configured");
    }
    client = new SarvamAIClient({
      apiSubscriptionKey,
      maxRetries: 3,
      timeoutInSeconds: 120,
    });
  }
  return client;
};

export type SynthesizeOptions = {
  languageCode: TtsLanguage;
  speaker: TtsSpeaker;
  model: TtsModel;
  pace?: number;
  temperature?: number;
  pitch?: number;
  loudness?: number;
  sampleRate?: number;
  codec?: AudioCodec;
};

export const synthesize = async (text: string, options: SynthesizeOptions) => {
  const isV2 = options.model === "bulbul:v2";
  const response = await getClient().textToSpeech.convert({
    text,
    language_code: options.languageCode,
    speaker: options.speaker,
    model: options.model,
    output_audio_codec: options.codec ?? "mp3",
    speech_sample_rate: options.sampleRate,
    pace: options.pace,
    ...(isV2
      ? { pitch: options.pitch, loudness: options.loudness }
      : { temperature: options.temperature }),
  });

  const audio = response.audios.join("");
  if (!audio) {
    throw createError(502, "Sarvam returned no audio for this chunk");
  }

  return { audio, requestId: response.request_id };
};

export const translate = async (
  text: string,
  { source, target }: { source: TranslateSourceLanguage; target: TtsLanguage },
) => {
  const response = await getClient().text.translate({
    input: text,
    source_language_code: source,
    target_language_code: target,
    model: TRANSLATE_MODEL,
  });

  return {
    text: response.translated_text,
    detectedSource: response.source_language_code,
  };
};

export const identifyLanguage = async (
  text: string,
): Promise<TtsLanguage | undefined> => {
  const response = await getClient().text.identifyLanguage({ input: text });
  const detected = response.language_code;
  return detected && (TTS_LANGUAGES as readonly string[]).includes(detected)
    ? (detected as TtsLanguage)
    : undefined;
};

export const prepareScript = async (
  text: string,
  contentType: ContentType,
  title?: string,
) => {
  const response = await getClient().chat.completions({
    model: TEXT_MODEL,
    messages: buildScriptPrompt(text, contentType, title),
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content ?? text;
};
