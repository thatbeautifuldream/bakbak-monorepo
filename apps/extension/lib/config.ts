/** Where the conversational agent API lives. */
export const API_URL = import.meta.env.WXT_API_URL ?? 'http://localhost:3000';

/**
 * Where the user signs in. Auth runs through the web app's proxy, so the
 * browser stores the session cookie against this host, not the API's.
 */
export const WEB_URL = import.meta.env.WXT_WEB_URL ?? 'http://localhost:3001';

export const SESSION_COOKIE = 'better-auth.session_token';
