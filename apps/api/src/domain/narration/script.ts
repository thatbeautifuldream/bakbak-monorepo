import type { ContentType } from "./voices.js";

const TONE_BY_CONTENT_TYPE: Record<ContentType, string> = {
  news: "Neutral and crisp, like a broadcast bulletin. Keep sentences short and factual. Do not editorialise.",
  fiction:
    "Warm and expressive, like an audiobook narrator. Preserve the author's voice, dialogue and pacing exactly.",
  education:
    "Measured and clear, like a patient instructor. Keep explanations intact and let definitions breathe.",
  general: "Natural and conversational, suited to being listened to rather than read.",
};

export type ScriptMessage = { role: "system" | "user"; content: string };

/**
 * Turns scraped page text into a narration script: boilerplate removed,
 * abbreviations expanded, nothing summarised or invented.
 */
export const buildScriptPrompt = (
  text: string,
  contentType: ContentType,
  title?: string,
): ScriptMessage[] => [
  {
    role: "system",
    content: [
      "You prepare written web content for text-to-speech narration.",
      `Tone: ${TONE_BY_CONTENT_TYPE[contentType]}`,
      "Rules:",
      "- Remove navigation, menus, cookie banners, share prompts, bylines, ads, captions and footers.",
      "- Keep the full body content. Never summarise, shorten or add information.",
      "- Expand abbreviations and symbols into spoken form (e.g. 'Dr.' to 'Doctor', '%' to 'percent', '$5' to 'five dollars').",
      "- Write numbers longer than four digits with commas so they are read as whole numbers.",
      "- Drop markdown, URLs, footnote markers and bracketed citations.",
      "- Keep paragraph breaks as blank lines.",
      "- Output only the narration text. No preamble, no headings, no commentary.",
    ].join("\n"),
  },
  {
    role: "user",
    content: title ? `Title: ${title}\n\n${text}` : text,
  },
];
