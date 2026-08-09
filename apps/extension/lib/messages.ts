export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role?: string | null;
};

export type ApiCall = {
  type: 'api';
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

export type ApiReply = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

export type Request =
  | { type: 'open-login' }
  | { type: 'session-token' }
  | { type: 'session' }
  | ApiCall;

export type Response<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

type ResultFor<R extends Request> = R extends { type: 'session-token' }
  ? string
  : R extends { type: 'session' }
    ? SessionUser | null
    : R extends { type: 'api' }
      ? ApiReply
      : void;

export async function send<R extends Request>(request: R): Promise<ResultFor<R>> {
  const response: Response<ResultFor<R>> = await browser.runtime.sendMessage(request);

  if (!response) throw new Error('Extension worker did not respond');
  if (!response.ok) throw new Error(response.error);
  return response.data as ResultFor<R>;
}

export const openLogin = () => send({ type: 'open-login' });
export const getSession = () => send({ type: 'session' });
