import { SESSION_COOKIE, WEB_URL } from '@/lib/config';
import type { Request, Response } from '@/lib/messages';

async function handle(request: Request) {
  switch (request.type) {
    case 'open-login':
      await browser.tabs.create({ url: new URL('/login', WEB_URL).toString() });
      return undefined;
    case 'session-token': {
      const cookie = await browser.cookies.get({ url: WEB_URL, name: SESSION_COOKIE });
      if (!cookie?.value) throw new Error(`Sign in at ${WEB_URL} to use voice chat`);
      return cookie.value;
    }
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
