import { Readability, isProbablyReaderable } from '@mozilla/readability';

export interface Article {
  title: string;
  text: string;
  readerable: boolean;
}

const MAX_CHARS = 60_000;

/** Collapses runs of blank lines but keeps paragraph breaks intact. */
const tidy = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export function extractArticle(): Article {
  const readerable = isProbablyReaderable(document);

  // Readability strips nodes as it parses, so give it a throwaway copy of the
  // document rather than letting it dismantle the live page.
  const parsed = new Readability(
    document.cloneNode(true) as Document,
  ).parse();

  const fallback = () => document.body?.innerText ?? '';
  const text = tidy(parsed?.textContent?.trim() ? parsed.textContent : fallback());

  return {
    title: parsed?.title?.trim() || document.title || 'Untitled page',
    text: text.slice(0, MAX_CHARS),
    readerable,
  };
}

export function selectedText(): string {
  return tidy(window.getSelection()?.toString() ?? '');
}
