import { ApiError } from './api';
import type { SpeakRequest, Speech } from './api';

export type Request =
  | { type: 'speak'; body: SpeakRequest }
  | { type: 'open-login' };

export type Response<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

type ResultFor<R extends Request> = R extends { type: 'speak' } ? Speech : void;

/** Content scripts run in the page's origin, so all API calls go via the worker. */
export async function send<R extends Request>(
  request: R,
): Promise<ResultFor<R>> {
  const response: Response<ResultFor<R>> =
    await browser.runtime.sendMessage(request);

  if (!response) throw new Error('Extension worker did not respond');
  if (!response.ok) throw new ApiError(response.error, response.status);

  return response.data as ResultFor<R>;
}

export const openLogin = () => send({ type: 'open-login' });
