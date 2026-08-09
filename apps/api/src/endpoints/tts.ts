import { z } from "zod";
import { authenticatedEndpointsFactory } from "../auth.js";
import { synthesize } from "../lib/sarvam.js";
import {
  AUDIO_CODECS,
  DEFAULT_CODEC,
  DEFAULT_MODEL,
  DEFAULT_SAMPLE_RATE,
} from "../domain/narration/voices.js";

type ApiEndpoint = ReturnType<typeof authenticatedEndpointsFactory.build>;

const speakInputSchema = z.object({
  text: z.string().min(1).max(1500),
});

const speakOutputSchema = z.object({
  audio: z.string(),
  codec: z.enum(AUDIO_CODECS),
  sampleRate: z.number(),
  requestId: z.string().optional(),
});

export const speakEndpoint: ApiEndpoint = authenticatedEndpointsFactory.build({
  method: "post",
  input: speakInputSchema,
  tag: "tts",
  summary: "Speak text",
  output: speakOutputSchema,
  handler: async ({ input }) => {
    const { audio, requestId } = await synthesize(input.text, {
      languageCode: "en-IN",
      speaker: "shubh",
      model: DEFAULT_MODEL,
      sampleRate: DEFAULT_SAMPLE_RATE,
      codec: DEFAULT_CODEC,
    });

    return {
      audio,
      codec: DEFAULT_CODEC,
      sampleRate: DEFAULT_SAMPLE_RATE,
      requestId,
    };
  },
});
