import type {
  GetV1TtsVoicesResponses,
  PostV1TtsPlanData,
  PostV1TtsPlanResponses,
  PostV1TtsSpeakData,
  PostV1TtsSpeakResponses,
} from '@repo/api-client/types';
import { API_URL, SESSION_COOKIE, WEB_URL } from './config';

export type PlanRequest = PostV1TtsPlanData['body'];
export type Plan = PostV1TtsPlanResponses[200]['data'];
export type SpeakRequest = PostV1TtsSpeakData['body'];
export type Speech = PostV1TtsSpeakResponses[200]['data'];
export type Voices = GetV1TtsVoicesResponses[200]['data'];

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const SIGN_IN_MESSAGE = `Sign in at ${WEB_URL} to use bakbak`;

/**
 * Reads the session the user already has on the web app. Better Auth accepts
 * this token as a bearer credential, so the extension never needs its own login.
 */
async function getSessionToken(): Promise<string> {
  const cookie = await browser.cookies.get({
    url: WEB_URL,
    name: SESSION_COOKIE,
  });

  if (!cookie?.value) {
    throw new ApiError(SIGN_IN_MESSAGE, 401);
  }

  return cookie.value;
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const token = await getSessionToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      response.status === 401
        ? SIGN_IN_MESSAGE
        : ((payload as { error?: { message?: string } })?.error?.message ??
          `Request failed (${response.status})`);
    throw new ApiError(message, response.status);
  }

  return (payload as { data: T }).data;
}

export const fetchVoices = () => request<Voices>('/v1/tts/voices');

export const planNarration = (body: PlanRequest) =>
  request<Plan>('/v1/tts/plan', body);

export const speakChunk = (body: SpeakRequest) =>
  request<Speech>('/v1/tts/speak', body);
