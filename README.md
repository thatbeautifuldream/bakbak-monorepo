# Bakbak

Talk to any webpage. Bakbak is a browser extension that lets you ask questions out loud about the page you are already reading — no copy-pasting into another tool, no switching tabs, no losing your place.

| | |
|---|---|
| **Use the app** | [bakbak.milind.fyi](https://bakbak.milind.fyi) |
| **Download the extension** | [extension-0.0.1-chrome.zip](https://github.com/thatbeautifuldream/bakbak-monorepo/releases/download/v0.0.1/extension-0.0.1-chrome.zip) ([all releases](https://github.com/thatbeautifuldream/bakbak-monorepo/releases)) |
| **Demo video** | [youtube.com/watch?v=8B5bvayecUE](https://youtube.com/watch?v=8B5bvayecUE) |
| **API** | [bakbak-api.milind.fyi](https://bakbak-api.milind.fyi) · [docs](https://bakbak-api.milind.fyi/docs) |

## Install

Bakbak is not on the Chrome Web Store yet, so it installs as an unpacked extension:

1. Download the zip and unzip it
2. Open `chrome://extensions` and turn on Developer mode
3. Drag the unzipped folder onto that page

Then sign in at [bakbak.milind.fyi](https://bakbak.milind.fyi). The extension reuses that session — there is no separate extension login.

## What it does

- Ask for explanations, summaries, or specific details from the page in front of you, out loud
- Reads the page's content, headings, links, metadata, selected text, and accessible controls for context
- Answers in voice, in real time, with a running transcript in the panel
- Can scroll, follow links, go back, click safe controls, and fill text fields on your behalf — every action is written into the transcript
- Never submits forms by voice
- The microphone opens only when you start a conversation, and stops the moment you end it

Because the voice layer is multilingual, it also makes the web more legible across languages — a Tamil speaker can listen to and understand a Gujarati news page without reading Gujarati.

## Stack

| Layer | Tool |
|---|---|
| Monorepo | Turborepo + Bun workspaces |
| Extension | WXT + React |
| Website | Next.js 16 + React 19 + Tailwind CSS v4 |
| API | Express 5 + express-zod-api |
| Auth | Better Auth (email/password + Google) |
| Database | PostgreSQL + Drizzle ORM |
| Voice | Sarvam Conversational AI |
| Type safety | Hey API (OpenAPI → typed SDK + React Query) |

## Run it locally

```bash
bun install

cp apps/api/.env.example apps/api/.env
cp apps/website/.env.example apps/website/.env
# fill in the values in both .env files

bun run db:generate
bun run db:migrate

bun run dev
```

- API — http://localhost:3000 (docs at `/docs`)
- Website — http://localhost:3001
- Extension — `bun --filter extension dev` opens a browser with it loaded

## Repository layout

```
apps/api/          Express REST API, Better Auth, Drizzle schema, voice WebSocket
apps/website/      Next.js app — marketing page, auth, dashboard
apps/extension/    WXT browser extension (content script + background worker)
packages/api-client/   Typed SDK generated from the API's OpenAPI spec
```

`AGENTS.md` documents the working conventions — how endpoints, migrations, and the generated client fit together.

## Environment variables

### API (`apps/api/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret key for auth |
| `BETTER_AUTH_URL` | Yes | API base URL |
| `TRUSTED_ORIGINS` | Yes | Comma-separated allowed origins |
| `WEB_APP_URL` | Yes | Website URL, used for OAuth callbacks |
| `SARVAM_*` | Yes | Sarvam org, workspace, agent, and API keys |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Google sign-in |

### Website (`apps/website/.env`)

| Variable | Required | Description |
|---|---|---|
| `API_URL` | Yes | Where `/api/auth/*` and `/api/proxy/*` are forwarded, read per request |
| `NEXT_PUBLIC_API_URL` | No | API URL used during server rendering |

### Extension

Defaults to the production API and website. Override with `WXT_API_URL` and `WXT_WEB_URL` in `apps/extension/.env`.

## How auth works

The browser talks to the API through the website's own origin — `proxy.ts` forwards `/api/auth/*` and `/api/proxy/*` to `API_URL` at request time. Same-origin keeps the session cookie alive on iOS Safari, where a direct cross-origin fetch drops it.

The extension has no login of its own. Its background worker reads the session cookie the website already set and sends it as a bearer token, so signing in on the website signs you in everywhere.
