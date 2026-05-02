# Vietnamese–English Classroom Copilot

Realtime classroom assistant for Vietnamese university lectures (code-switching Vietnamese / English). Microphone audio flows through a **Node gateway** to **VALSEA realtime ASR**; notes (summary, key terms, explanation, quiz) are produced via an **LLM** on the server — API keys never ship to the browser.

## Prerequisites

- Node.js 18+ (includes `fetch`, `FormData`, `File`)
- Frontend uses **Tailwind CSS v4** (`@tailwindcss/postcss` + `@import "tailwindcss"` in `client/app/globals.css`)
- `VALSEA_API_KEY` and `LLM_API_KEY` in environment (see `.env.example`)

## Setup

1. Copy `.env.example` to `.env` at the repo root (same folder as `package.json`).
2. Fill in `VALSEA_API_KEY` and `LLM_API_KEY`.
3. Optionally set `LLM_BASE_URL` / `LLM_MODEL` for your OpenAI-compatible provider.

```bash
npm install
```

## Run locally

Terminal:

```bash
npm run dev
```

This starts:

- **Next.js** at [http://localhost:3000](http://localhost:3000)
- **Gateway** at [http://localhost:3001](http://localhost:3001) — WebSocket `/ws`, REST `/api/transcribe`, `/api/demo-transcript`, `/api/generate-notes`, `/api/confusion`, `GET /api/sessions`, `GET /api/session/:sessionId`, `GET /health`

If the UI cannot reach the gateway, set in `.env` (or `.env.local` in `client`):

```env
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

## Demo flow

1. Open the app, click **Start listening**, allow the microphone.
2. Speak (try the script in `AGENTS.md` §17 — gradient descent / learning rate), **or** click **Chèn kịch bản demo (§17)** to push that text to the gateway and UI (no mic / no VALSEA needed for transcript).
3. Watch the live transcript; click **Stop** when finished (if you used the mic).
4. Click **Generate notes** — structured JSON-backed summary, terms, quiz. While the LLM runs, the learning panel shows a loading skeleton and the status badge spins.
5. Use **Tải .md** / **Tải .json** in the learning panel to export transcript + notes.

**Fallback:** Use **Upload audio** to call VALSEA batch `POST /v1/audio/transcriptions` via `/api/transcribe`; then **Generate notes** (works over HTTP if the WebSocket is closed). Errors surface with short hints and a link to **`GET /health`** on the gateway.

**Confusion:** **Tôi đang bối rối** sends `confusion.mark` over the WebSocket when connected, or `POST /api/confusion` when the socket is closed; events are stored on the gateway and, when Supabase is configured, in `confusion_events`.

**Teacher / review:** Sidebar **Quản lý phiên** (`/session`) lists sessions via **`GET /api/sessions`** (memory + Supabase merge). Open a row or paste a UUID; detail view uses **`GET /api/session/:sessionId`**. With **`SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`** set, run `server/supabase/migrations/001_classroom_copilot.sql` in the Supabase SQL editor; then sessions survive gateway restarts. Check **`GET /health`** for `persistence: "supabase"` and `supabase: "reachable"`.

## Workspace layout

| Package       | Role                                              |
| ------------- | ------------------------------------------------- |
| `client`      | Next.js UI, shadcn (preset **bJiC** / base-nova), PCM16 capture, WS client |
| `server`      | Fastify WebSocket gateway, VALSEA proxy, LLM      |

## Acceptance checklist

See `AGENTS.md` §18 — this repo follows those contracts (frontend ↔ gateway events, VALSEA `session.start` / `audio.append`, batch upload path).
