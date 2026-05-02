# Vietnamese–English Classroom Copilot

Realtime classroom assistant for Vietnamese university lectures (code-switching Vietnamese / English). Microphone audio flows through a **Node gateway** to **VALSEA realtime ASR**. **Live assist** (optional) adds short per-segment Vietnamese summary, explanation, and an English line as transcript chunks finalize. Full **learning notes** (summary, key terms, explanation, quiz, English recap) come from the **LLM** on the server when you click **Generate notes** — API keys never ship to the browser.

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

1. Open **Classroom Copilot** (`/classroom-copilot`), click **Start listening**, allow the microphone.
2. Speak (try the script in `AGENTS.md` — gradient descent / learning rate), **or** click **Insert demo script** to push that text to the gateway and UI (no mic / no VALSEA needed for that transcript path).
3. Watch **Live transcript**; click **Stop** when finished (if you used the mic).
4. Optional: enable **Live assist during lesson** — after each finalized transcript segment (with a minimum gap of about 12s between LLM calls), the **Live assist** panel shows a short Vietnamese summary, explanation, and an English line for that segment. Requires `LLM_API_KEY` and an active WebSocket session.
5. Optional: **Auto notes every 60s while listening** — calls **Generate notes** over the socket when the transcript grows (for a hands-off demo).
6. Click **Generate notes** for full structured output (summary VI, English recap, key terms, quiz, etc.). While the LLM runs, the learning panel shows a loading skeleton and the status badge updates.
7. Use **Download .md** / **Download .json** in the learning panel to export transcript + notes.

**Fallback:** Use **Upload audio** to call VALSEA batch `POST /v1/audio/transcriptions` via `/api/transcribe`; then **Generate notes** (works over HTTP if the WebSocket is closed). Errors surface with short hints and a link to **`GET /health`** on the gateway.

**Confusion:** **I'm confused** sends `confusion.mark` over the WebSocket when connected, or `POST /api/confusion` when the socket is closed; events are stored on the gateway and, when Supabase is configured, in `confusion_events`.

**Teacher / review:** Sidebar **Quản lý phiên** (`/session`) lists sessions via **`GET /api/sessions`** (memory + Supabase merge). Open a row or paste a UUID; detail view uses **`GET /api/session/:sessionId`**. With **`SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`** set, run `server/supabase/migrations/001_classroom_copilot.sql` and `002_learning_outputs_english_recap.sql` in the Supabase SQL editor; then sessions survive gateway restarts (including English recap on notes). Check **`GET /health`** for `persistence: "supabase"` and `supabase: "reachable"`.

## Workspace layout

| Package       | Role                                              |
| ------------- | ------------------------------------------------- |
| `client`      | Next.js UI, shadcn (preset **bJiC** / base-nova), PCM16 capture, WS client |
| `server`      | Fastify WebSocket gateway, VALSEA proxy, LLM      |

## WebSocket extras (live assist)

In addition to the events in `AGENTS.md` §11:

- **Client → gateway:** `{ "type": "liveAssist.set", "sessionId": "…", "enabled": true | false }` toggles per-segment assist for the active session.
- **Gateway → client:** `{ "type": "assist.live", "chunkId": "…", "chunkText": "…", "payload": { "microSummaryVi", "explainVi", "lineEn" } }` after a finalized chunk when live assist is on.

## Acceptance checklist

See `AGENTS.md` — this repo follows those contracts (frontend ↔ gateway events, VALSEA `session.start` / `audio.append`, batch upload path), plus the live-assist messages above for the **Real-Time Classroom Assist** track.
