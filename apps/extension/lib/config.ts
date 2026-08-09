/** Where the conversational agent + REST API live. */
export const API_URL =
  import.meta.env.WXT_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:3000' : 'https://bakbak-api.milind.fyi');

/**
 * Where the user signs in. Auth runs through the web app's proxy, so the
 * browser stores the session cookie against this host, not the API's.
 */
export const WEB_URL =
  import.meta.env.WXT_WEB_URL ??
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://bakbak.milind.fyi');

/** Better Auth prefixes the cookie with `__Secure-` once it issues secure cookies. */
export const SESSION_COOKIES = [
  '__Secure-better-auth.session_token',
  'better-auth.session_token',
];
