import { client } from '@repo/api-client/client';
import { API_URL } from './config';
import { send } from './messages';

const emptyBodyStatuses = new Set([204, 205, 304]);

const backgroundFetch: typeof fetch = async (input, init) => {
  const request = new globalThis.Request(input as RequestInfo, init);
  const reply = await send({
    type: 'api',
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.body ? await request.text() : undefined,
  });

  return new globalThis.Response(
    emptyBodyStatuses.has(reply.status) ? null : reply.body,
    {
      status: reply.status,
      statusText: reply.statusText,
      headers: reply.headers,
    },
  );
};

client.setConfig({ baseUrl: API_URL, fetch: backgroundFetch });

export { client };
