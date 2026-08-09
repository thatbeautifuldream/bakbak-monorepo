import { SarvamAIClient } from "sarvamai";
import createError from "http-errors";
import type {
  AudioCodec,
  TtsLanguage,
  TtsModel,
  TtsSpeaker,
} from "../domain/narration/voices.js";

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
  const response = await getClient().textToSpeech.convert({
    text,
    language_code: options.languageCode,
    speaker: options.speaker,
    model: options.model,
    output_audio_codec: options.codec ?? "wav",
    speech_sample_rate: options.sampleRate,
    pace: options.pace,
    temperature: options.temperature,
  });

  const audio = response.audios.join("");
  if (!audio) {
    throw createError(502, "Sarvam returned no audio for this chunk");
  }

  return { audio, requestId: response.request_id };
};
