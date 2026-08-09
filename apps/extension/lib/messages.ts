export type Request =
  | { type: 'open-login' }
  | { type: 'session-token' };

export type Response<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

type ResultFor<R extends Request> = R extends { type: 'session-token' }
  ? string
  : void;

export async function send<R extends Request>(request: R): Promise<ResultFor<R>> {
  const response: Response<ResultFor<R>> = await browser.runtime.sendMessage(request);

  if (!response) throw new Error('Extension worker did not respond');
  if (!response.ok) throw new Error(response.error);
  return response.data as ResultFor<R>;
}

export const openLogin = () => send({ type: 'open-login' });
