import { ApiError, fetchVoices, planNarration, speakChunk } from '@/lib/api';
import type { Request, Response } from '@/lib/messages';

async function handle(request: Request) {
  switch (request.type) {
    case 'voices':
      return fetchVoices();
    case 'plan':
      return planNarration(request.body);
    case 'speak':
      return speakChunk(request.body);
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
            status: error instanceof ApiError ? error.status : 0,
          }),
        );

      // Keep the message channel open for the async response.
      return true;
    },
  );
});
