export type TtsModel = "bulbul:v3";
export type TtsSpeaker = "shubh";
export type TtsLanguage = "en-IN";
export type AudioCodec = "wav";

export const AUDIO_CODECS = ["wav"] as const;
export const DEFAULT_MODEL: TtsModel = "bulbul:v3";
export const DEFAULT_CODEC: AudioCodec = "wav";
export const DEFAULT_SAMPLE_RATE = 24000;
