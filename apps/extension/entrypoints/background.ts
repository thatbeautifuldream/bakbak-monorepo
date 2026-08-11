import { API_URL, SESSION_COOKIE, WEB_URL } from '@/lib/config';
import type { AnalyticsEvent } from '@/lib/analytics';
import type { Request, Response } from '@/lib/messages';

const ANALYTICS_INSTALLATION_KEY = 'bakbak:analytics-installation';
const ANALYTICS_QUEUE_KEY = 'bakbak:analytics-queue';
const MAX_ANALYTICS_QUEUE_SIZE = 500;
const ANALYTICS_BATCH_SIZE = 25;
const OFFSCREEN_DOCUMENT = 'offscreen.html';
const VOICE_SESSION_KEY_PREFIX = 'bakbak:voice-navigation:';
const VOICE_SESSION_TTL_MS = 25_000;

let creatingOffscreen: Promise<void> | undefined;
let microphoneSession: { captureId: string; tabId: number } | undefined;

const voiceSessionKey = (tabId: number) => `${VOICE_SESSION_KEY_PREFIX}${tabId}`;

const getSessionToken = async () => {
  const cookie = await browser.cookies.get({ url: WEB_URL, name: SESSION_COOKIE });
  return cookie?.value;
};

const getInstallationId = async () => {
  const stored = await browser.storage.local.get(ANALYTICS_INSTALLATION_KEY);
  const existing = stored[ANALYTICS_INSTALLATION_KEY];
  if (typeof existing === 'string') return existing;
  const installationId = crypto.randomUUID();
  await browser.storage.local.set({ [ANALYTICS_INSTALLATION_KEY]: installationId });
  return installationId;
};

const getQueuedEvents = async () => {
  const stored = await browser.storage.local.get(ANALYTICS_QUEUE_KEY);
  const queue = stored[ANALYTICS_QUEUE_KEY];
  return Array.isArray(queue) ? queue as AnalyticsEvent[] : [];
};

const setQueuedEvents = (events: AnalyticsEvent[]) =>
  browser.storage.local.set({ [ANALYTICS_QUEUE_KEY]: events });

const flushAnalyticsEvents = async () => {
  const token = await getSessionToken();
  if (!token) return;

  const installationId = await getInstallationId();
  let queue = await getQueuedEvents();
  while (queue.length > 0) {
    const events = queue.slice(0, ANALYTICS_BATCH_SIZE);
    try {
      const response = await fetch(new URL('/v1/analytics/events', API_URL), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installationId, events }),
      });
      if (!response.ok) return;
    } catch {
      return;
    }
    queue = queue.slice(events.length);
    await setQueuedEvents(queue);
  }
};

const queueAnalyticsEvents = async (events: AnalyticsEvent[]) => {
  if (!(await getSessionToken())) return;
  const queue = await getQueuedEvents();
  const queuedIds = new Set(queue.map((event) => event.id));
  const additions = events.filter((event) => !queuedIds.has(event.id));
  if (additions.length === 0) return;
  await setQueuedEvents([...queue, ...additions].slice(-MAX_ANALYTICS_QUEUE_SIZE));
  await flushAnalyticsEvents();
};

const ensureOffscreenDocument = async () => {
  const url = browser.runtime.getURL(OFFSCREEN_DOCUMENT);
  const contexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [url],
  });
  if (contexts.length > 0) return;
  if (!creatingOffscreen) {
    creatingOffscreen = browser.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT,
      reasons: ['USER_MEDIA'],
      justification: 'Capture microphone audio for an active Bakbak voice session.',
    });
  }
  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = undefined;
  }
};

const sendToOffscreen = (request: Extract<Request, { type: 'microphone-start' | 'microphone-stop' }>) =>
  browser.runtime.sendMessage({ ...request, target: 'bakbak-offscreen' });

const closeOffscreenDocument = async () => {
  const url = browser.runtime.getURL(OFFSCREEN_DOCUMENT);
  const contexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [url],
  });
  if (contexts.length > 0) await browser.offscreen.closeDocument();
};

const isOffscreenCommand = (request: unknown): request is { target: 'bakbak-offscreen' } =>
  Boolean(request && typeof request === 'object' && (request as { target?: unknown }).target === 'bakbak-offscreen');

async function handle(request: Request, sender: { tab?: { id?: number }; url?: string }) {
  switch (request.type) {
    case 'open-login':
      await browser.tabs.create({ url: new URL('/login', WEB_URL).toString() });
      return undefined;
    case 'session-token': {
      const token = await getSessionToken();
      if (!token) throw new Error(`Sign in at ${WEB_URL} to use voice chat`);
      return token;
    }
    case 'voice-session-save': {
      const tabId = sender.tab?.id;
      if (typeof tabId !== 'number') throw new Error('Voice navigation must originate from a browser tab.');
      await browser.storage.session.set({
        [voiceSessionKey(tabId)]: {
          sessionId: request.sessionId,
          expiresAt: Date.now() + VOICE_SESSION_TTL_MS,
        },
      });
      return undefined;
    }
    case 'voice-session-take': {
      const tabId = sender.tab?.id;
      if (typeof tabId !== 'number') return undefined;
      const key = voiceSessionKey(tabId);
      const stored = await browser.storage.session.get(key);
      await browser.storage.session.remove(key);
      const value = stored[key];
      if (
        !value
        || typeof value !== 'object'
        || !('sessionId' in value)
        || !('expiresAt' in value)
        || typeof value.sessionId !== 'string'
        || typeof value.expiresAt !== 'number'
        || value.expiresAt < Date.now()
      ) {
        return undefined;
      }
      return value.sessionId;
    }
    case 'analytics-events':
      await queueAnalyticsEvents(request.events);
      return undefined;
    case 'microphone-start': {
      const tabId = sender.tab?.id;
      if (typeof tabId !== 'number') throw new Error('Microphone capture must start from an active page.');
      await ensureOffscreenDocument();
      microphoneSession = { captureId: request.captureId, tabId };
      await sendToOffscreen(request);
      return undefined;
    }
    case 'microphone-stop':
      if (microphoneSession?.captureId !== request.captureId) return undefined;
      microphoneSession = undefined;
      await sendToOffscreen(request);
      await closeOffscreenDocument();
      return undefined;
    case 'microphone-audio': {
      if (
        sender.url !== browser.runtime.getURL(OFFSCREEN_DOCUMENT)
        || microphoneSession?.captureId !== request.captureId
      ) return undefined;
      try {
        await browser.tabs.sendMessage(microphoneSession.tabId, request);
      } catch {
      }
      return undefined;
    }
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (request: Request | { target: 'bakbak-offscreen' }, sender, sendResponse: (r: Response<unknown>) => void) => {
      if (isOffscreenCommand(request)) return;
      handle(request, sender)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
            status: 0,
          }),
        );

      return true;
    },
  );
});
