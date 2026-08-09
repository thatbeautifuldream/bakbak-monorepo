import { WEB_URL } from '@/lib/config';
import type { Request, Response } from '@/lib/messages';

async function handle(request: Request) {
  switch (request.type) {
    case 'open-login':
      await browser.tabs.create({ url: new URL('/login', WEB_URL).toString() });
      return undefined;
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (request: Request, _sender, sendResponse: (r: Response) => void) => {
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
