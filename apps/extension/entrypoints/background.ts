import { API_URL, SESSION_COOKIES, WEB_URL } from '@/lib/config';
import type { ApiReply, Request, Response, SessionUser } from '@/lib/messages';

/** The web app owns the session cookie; the extension only borrows it as a bearer token. */
async function readSessionToken() {
  for (const name of SESSION_COOKIES) {
    const cookie = await browser.cookies.get({ url: WEB_URL, name });
    if (cookie?.value) return cookie.value;
  }
  return undefined;
}

async function requireSessionToken() {
  const token = await readSessionToken();
  if (!token) throw new Error(`Sign in at ${WEB_URL} to use voice chat`);
  return token;
}

async function readSession(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;

  const response = await fetch(new URL('/api/auth/get-session', API_URL), {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;

  const body = await response.text();
  if (!body) return null;
  const session = JSON.parse(body) as { user?: SessionUser } | null;
  return session?.user ?? null;
}

/**
 * Content scripts run on the page's origin, so the API would reject their fetches.
 * The worker holds the host permissions — it forwards the call with the bearer token.
 */
async function callApi(request: Extract<Request, { type: 'api' }>): Promise<ApiReply> {
  const token = await readSessionToken();
  const response = await fetch(new URL(request.url, API_URL), {
    method: request.method,
    headers: token
      ? { ...request.headers, authorization: `Bearer ${token}` }
      : request.headers,
    body: request.body,
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
}

async function handle(request: Request) {
  switch (request.type) {
    case 'open-login':
      await browser.tabs.create({ url: new URL('/login', WEB_URL).toString() });
      return undefined;
    case 'session-token':
      return requireSessionToken();
    case 'session':
      return readSession();
    case 'api':
      return callApi(request);
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (request: Request, _sender, sendResponse: (r: Response<unknown>) => void) => {
      handle(request)
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
