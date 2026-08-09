import type { Plan, PlanRequest, SpeakRequest, Speech, Voices } from './api';

export type Request =
  | { type: 'voices' }
  | { type: 'plan'; body: PlanRequest }
  | { type: 'speak'; body: SpeakRequest };

export type Response<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

type ResultFor<R extends Request> = R extends { type: 'voices' }
  ? Voices
  : R extends { type: 'plan' }
    ? Plan
    : Speech;

/** Content scripts run in the page's origin, so all API calls go via the worker. */
export async function send<R extends Request>(
  request: R,
): Promise<ResultFor<R>> {
  const response: Response<ResultFor<R>> =
    await browser.runtime.sendMessage(request);

  if (!response) throw new Error('Extension worker did not respond');
  if (!response.ok) throw new Error(response.error);

  return response.data;
}
