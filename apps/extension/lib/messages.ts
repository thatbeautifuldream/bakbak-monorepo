import type { AnalyticsEvent } from "./analytics";

export type Request =
  | { type: 'open-login' }
  | { type: 'session-token' }
  | { type: 'analytics-events'; events: AnalyticsEvent[] }
  | { type: 'microphone-start'; captureId: string }
  | { type: 'microphone-stop'; captureId: string }
  | { type: 'microphone-audio'; captureId: string; audio: string };

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

export const recordAnalyticsEvents = (events: AnalyticsEvent[]) =>
  send({ type: 'analytics-events', events });

export const startMicrophoneCapture = (captureId: string) =>
  send({ type: 'microphone-start', captureId });

export const stopMicrophoneCapture = (captureId: string) =>
  send({ type: 'microphone-stop', captureId });
