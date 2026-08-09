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
    name: 'Bakbak',
    description: 'Listen to any page. Narrated with Sarvam voices.',
    // The worker reuses the web app session; the extension has no separate login.
    permissions: ['cookies', 'storage', 'tabs'],
    host_permissions: [
      'https://bakbak-api.milind.fyi/*',
      'https://bakbak.milind.fyi/*',
      'http://localhost:3000/*',
      'http://localhost:3001/*',
    ],
  },
});
