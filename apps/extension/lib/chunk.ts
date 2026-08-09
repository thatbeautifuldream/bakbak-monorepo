const MAX_CHARS = 1500;

export function splitText(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (next.length <= MAX_CHARS) {
      current = next;
    } else {
      if (current) chunks.push(current);
      for (let start = 0; start < sentence.length; start += MAX_CHARS) {
        const part = sentence.slice(start, start + MAX_CHARS).trim();
        if (part) chunks.push(part);
      }
      current = '';
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
