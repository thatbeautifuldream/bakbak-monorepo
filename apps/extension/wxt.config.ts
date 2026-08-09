import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  dev: {
    server: {
      port: 3002,
    },
  },
  manifest: {
    name: 'bakbak',
    description: 'Listen to any page. Narrated with Sarvam voices.',
    // `cookies` + host access let the background worker reuse the session the
    // user already has on the web app, so the extension needs no login of its own.
    // Both origins are needed: the cookie is stored against the web app, and
    // narration requests go to the API.
    permissions: ['cookies', 'storage'],
    host_permissions: ['http://localhost:3000/*', 'http://localhost:3001/*'],
  },
});
