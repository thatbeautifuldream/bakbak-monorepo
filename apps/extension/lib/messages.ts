export type Request =
  | { type: 'open-login' };

export type Response =
  | { ok: true; data: void }
  | { ok: false; error: string; status: number };

export async function send(request: Request): Promise<void> {
  const response: Response = await browser.runtime.sendMessage(request);

  if (!response) throw new Error('Extension worker did not respond');
  if (!response.ok) throw new Error(response.error);
}

export const openLogin = () => send({ type: 'open-login' });
