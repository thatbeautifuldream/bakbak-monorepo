export const TTS_MODELS = ["bulbul:v3", "bulbul:v2"] as const;
export type TtsModel = (typeof TTS_MODELS)[number];

export const TTS_LANGUAGES = [
  "bn-IN",
  "en-IN",
  "gu-IN",
  "hi-IN",
  "kn-IN",
  "ml-IN",
  "mr-IN",
  "od-IN",
  "pa-IN",
  "ta-IN",
  "te-IN",
] as const;
export type TtsLanguage = (typeof TTS_LANGUAGES)[number];

export type TranslateSourceLanguage = TtsLanguage | "auto";

const V3_SPEAKERS = [
    "shubh",
    "aditya",
    "ritu",
    "priya",
    "neha",
    "rahul",
    "pooja",
    "rohan",
    "simran",
    "kavya",
    "amit",
    "dev",
    "ishita",
    "shreya",
    "ratan",
    "varun",
    "manan",
    "sumit",
    "roopa",
    "kabir",
    "aayan",
    "ashutosh",
    "advait",
    "anand",
    "tanya",
    "tarun",
    "sunny",
    "mani",
    "gokul",
    "vijay",
    "shruti",
    "suhani",
    "mohit",
    "kavitha",
    "rehan",
    "soham",
  "rupali",
] as const;

const V2_SPEAKERS = [
  "anushka",
  "manisha",
  "vidya",
  "arya",
  "abhilash",
  "karun",
  "hitesh",
] as const;

export type TtsSpeaker = (typeof V3_SPEAKERS)[number] | (typeof V2_SPEAKERS)[number];

export const SPEAKERS_BY_MODEL: Record<TtsModel, readonly TtsSpeaker[]> = {
  "bulbul:v3": V3_SPEAKERS,
  "bulbul:v2": V2_SPEAKERS,
};

export const ALL_SPEAKERS: [TtsSpeaker, ...TtsSpeaker[]] = [
  ...V3_SPEAKERS,
  ...V2_SPEAKERS,
];

export const AUDIO_CODECS = [
  "mp3",
  "wav",
  "opus",
  "flac",
  "aac",
  "linear16",
  "mulaw",
  "alaw",
] as const;
export type AudioCodec = (typeof AUDIO_CODECS)[number];

export const SAMPLE_RATES = [
  8000, 16000, 22050, 24000, 32000, 44100, 48000,
] as const;

export const CONTENT_TYPES = ["news", "fiction", "education", "general"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const DEFAULT_MODEL: TtsModel = "bulbul:v3";
export const DEFAULT_SPEAKER: TtsSpeaker = "shubh";
export const DEFAULT_LANGUAGE: TtsLanguage = "en-IN";
export const DEFAULT_CODEC: AudioCodec = "mp3";
export const DEFAULT_SAMPLE_RATE = 24000;

export const isSpeakerCompatible = (model: TtsModel, speaker: TtsSpeaker) =>
  SPEAKERS_BY_MODEL[model].includes(speaker);

export const defaultSpeakerFor = (model: TtsModel): TtsSpeaker =>
  model === "bulbul:v2" ? "anushka" : DEFAULT_SPEAKER;
