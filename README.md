# Vietnamese–English Classroom Copilot

Realtime classroom assistant for Vietnamese university lectures with **Vietnamese / English code-switching**. Speech goes from the browser microphone through a **Node gateway** to **VALSEA realtime ASR**. Optional **live assist** adds short per-segment Vietnamese summary, explanation, and an English line when transcript segments finalize. Full **learning notes** (Vietnamese summary, English recap, key terms, quiz, confusion hints) are produced by an **LLM on the server** when you click **Generate notes**. **API keys never ship to the browser.**

**Track:** VALSEA EdTech Hack Sprint — **Real-Time Classroom Assist** (speech-first, classroom-first; not a generic chatbot). Shared TypeScript shapes for socket messages live in **`server/src/types.ts`**.

## Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Setup](#setup)
- [Run locally](#run-locally)
- [NPM scripts](#npm-scripts)
- [Gateway API & WebSocket](#gateway-api--websocket)
- [WebSocket message contract](#websocket-message-contract)
- [Demo flow](#demo-flow)
- [Demo script (testing)](#demo-script-testing)
- [Persistence (Supabase)](#persistence-supabase)
- [Workspace layout](#workspace-layout)
- [Troubleshooting](#troubleshooting)
- [Acceptance checklist](#acceptance-checklist)
- [Hackathon definition of done](#hackathon-definition-of-done)

## Architecture

```text
Browser (Next.js)
  │  PCM16 16 kHz base64 chunks, learning.generate, …
  ▼
Fastify gateway (WebSocket /ws + REST)
  │  VALSEA realtime + batch transcribe
  ▼
VALSEA ASR  →  transcript  →  optional LLM (notes, live assist)
```

## Prerequisites

- **Node.js** 18+ (global `fetch`, `FormData`, `File` on the server)
- **VALSEA** API key and an **OpenAI-compatible** LLM API key (or compatible base URL)
- Optional: **Supabase** project for durable sessions and exports

## Environment variables

The repo ships **[`.env.example`](./.env.example)** as a single reference. You must apply values in the right place:

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `VALSEA_API_KEY` | `server/.env` | Backend only — VALSEA realtime & batch |
| `LLM_API_KEY` | `server/.env` | Backend only — learning notes & live assist |
| `LLM_BASE_URL` | `server/.env` | Optional; default `https://api.openai.com/v1` |
| `LLM_MODEL` | `server/.env` | Optional; default `gpt-4o-mini` |
| `PORT` | `server/.env` | Gateway HTTP port; default `3001` |
| `SUPABASE_URL` | `server/.env` | Optional persistence |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env` | Optional; server-only |
| `SUPABASE_ANON_KEY` | Not required by gateway | Reserved for future RLS / client patterns |
| `NEXT_PUBLIC_GATEWAY_URL` | `client/.env.local` | REST base URL for the browser |
| `NEXT_PUBLIC_WS_URL` | `client/.env.local` | WebSocket URL (e.g. `ws://localhost:3001/ws`) |

Never commit `.env`, `server/.env`, or `client/.env.local`.

## Setup

1. Clone the repo and install dependencies from the **repository root**:

   ```bash
   npm install
   ```

2. **Gateway:** Create **`server/.env`**. Copy the backend-related lines from [`.env.example`](./.env.example) and set `VALSEA_API_KEY` and `LLM_API_KEY` at minimum.

   npm workspaces run the server with the working directory set to **`server/`**, so `dotenv` loads **`server/.env`** (not a file only at the repo root).

3. **Next.js:** Create **`client/.env.local`** from [`client/.env.example`](./client/.env.example) so the UI can reach the gateway (defaults target `localhost:3001`).

## Run locally

From the **repository root**:

```bash
npm run dev
```

This starts:

| Service | URL / endpoint |
| ------- | ---------------- |
| **Next.js** | [http://localhost:3000](http://localhost:3000) |
| **Gateway** | [http://localhost:3001](http://localhost:3001) — health: `GET /health` |

Main UI routes:

- **Classroom Copilot:** `/classroom-copilot`
- **Session management (teacher / review):** `/session`

If the UI cannot reach the gateway (different host or port), update **`client/.env.local`**:

```env
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

## NPM scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Next.js + gateway in parallel (`concurrently`) |
| `npm run build` | `client` then `server` production build |
| `npm run start` | Start built client and server (run `build` first) |

Per-package: `npm run dev -w client`, `npm run dev -w server`, etc.

## Gateway API & WebSocket

| Method / path | Role |
| ------------- | ---- |
| `GET /health` | Liveness; reports persistence mode when Supabase is configured |
| `WebSocket /ws` | Realtime audio, transcript events, `learning.generate`, `confusion.mark`, `liveAssist.set` |
| `POST /api/transcribe` | Batch upload → VALSEA `POST /v1/audio/transcriptions` |
| `POST /api/demo-transcript` | Push demo text into session (no mic / no VALSEA) |
| `POST /api/generate-notes` | HTTP fallback for learning generation |
| `POST /api/confusion` | HTTP fallback for confusion events |
| `GET /api/sessions` | List sessions (memory + Supabase when enabled) |
| `GET /api/session/:sessionId` | Session detail |

## WebSocket message contract

Stable `type` strings (JSON bodies). Payload details: **`server/src/types.ts`**.

**Browser → gateway**

| `type` | Purpose |
| ------ | ------- |
| `session.start` | Begin session (`sessionId`) |
| `audio.chunk` | Base64 PCM16 mono audio (`sessionId`, `audio`) |
| `session.stop` | End streaming |
| `learning.generate` | Run full notes on buffered transcript |
| `confusion.mark` | Optional “I’m confused” (`note`) |
| `liveAssist.set` | Toggle per-segment assist (`enabled`) |

**Gateway → browser**

| `type` | Purpose |
| ------ | ------- |
| `session.status` | e.g. connecting / listening |
| `transcript.partial` | Live partial text |
| `transcript.final` | Final chunk with `id`, times, `text` |
| `learning.output` | Structured notes (see below) |
| `assist.live` | Optional per-chunk assist: `microSummaryVi`, `explainVi`, `lineEn` |
| `error` | `message`, `recoverable` |

**`learning.output` payload (conceptual)** — `output` object includes:

- `shortSummaryVi`, `simpleExplanationVi`, `englishRecapEn`
- `keyTerms` (array of `term`, `definitionVi`, `whyItMatters`)
- `quizQuestions` (question, choices, answer)
- `possibleConfusingPoints` (string array)

## Demo flow

1. Open **Classroom Copilot** at `/classroom-copilot`, click **Start listening**, allow the microphone.
2. Speak using the [demo script](#demo-script-testing) below, **or** use **Insert demo script** to send that text through the gateway (works without mic or VALSEA for that path).
3. Watch **Live transcript**; click **Stop** when finished if you used the mic.
4. Optional: **Live assist during lesson** — after finalized segments (rate-limited, ~12s minimum between LLM calls), the **Live assist** panel shows a short Vietnamese summary, explanation, and an English line. Requires `LLM_API_KEY` and an active WebSocket session.
5. Optional: **Auto notes every 60s while listening** — triggers note generation over the socket as the transcript grows.
6. Click **Generate notes** for full structured output. While the LLM runs, the learning panel shows loading state and the status badge updates.
7. Use **Download .md** / **Download .json** in the learning panel to export transcript + notes.

**Fallback:** **Upload audio** uses batch transcription via `/api/transcribe`, then **Generate notes** (works over HTTP if the WebSocket is closed). Errors include short hints and a pointer to **`GET /health`**.

**Confusion:** **I'm confused** sends `confusion.mark` over the WebSocket when connected, or `POST /api/confusion` when offline; events are stored in memory and, with Supabase, in `confusion_events`.

## Demo script (testing)

Use this Vietnamese–English snippet to validate ASR and **Generate notes** (also available via **Insert demo script** in the UI):

```text
Hôm nay mình học về gradient descent. Khi model dự đoán sai, loss function sẽ cho biết mức độ sai lệch. Gradient descent giúp chúng ta cập nhật weights từng bước để giảm loss. Nhưng nếu learning rate quá cao thì model có thể overshoot và không converge. Nếu learning rate quá thấp thì training sẽ rất chậm.
```

**What you should see roughly:** a short Vietnamese summary mentioning gradient descent, loss, weights, learning rate, training; key terms such as *gradient descent*, *loss function*, *weights*, *learning rate*, *overshoot*, *converge*, *training*; quiz questions you can answer from the paragraph above.

## Persistence (Supabase)

Optional. Set **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** in **`server/.env`**, then run in the Supabase SQL editor:

- `server/supabase/migrations/001_classroom_copilot.sql`
- `server/supabase/migrations/002_learning_outputs_english_recap.sql`

After that, **`GET /health`** should indicate persistence appropriately (e.g. `persistence: "supabase"` when reachable). Session list and detail at `/session` merge memory and Supabase.

## Workspace layout

| Package | Role |
| ------- | ---- |
| `client` | Next.js App Router, shadcn/ui, Tailwind v4, PCM16 capture, WebSocket client |
| `server` | Fastify, WebSocket gateway, VALSEA proxy, transcript processing, LLM |

```text
.
├── client/                 # Next.js app
│   ├── src/app/            # Routes (e.g. classroom-copilot, session)
│   ├── src/components/     # UI including classroom-copilot/*
│   └── src/lib/            # Audio helpers, classroom types, export
├── server/                 # Gateway
│   ├── src/                # index.ts, VALSEA clients, intelligence, storage
│   └── supabase/migrations/
├── package.json            # workspaces + dev/start scripts
├── package-lock.json
└── .env.example            # Reference for all variables
```

## Troubleshooting

- **No transcript / VALSEA errors:** Confirm `VALSEA_API_KEY` in **`server/.env`** and check **`GET /health`**. Use **Insert demo script** or **Upload audio** to isolate ASR vs UI.
- **Generate notes fails:** Set `LLM_API_KEY` in **`server/.env`**; verify `LLM_BASE_URL` / `LLM_MODEL` for your provider.
- **UI cannot connect:** Ensure gateway is on port **3001** (or set `PORT` + matching `NEXT_PUBLIC_*` in **`client/.env.local`**).
- **CORS / wrong API host:** `NEXT_PUBLIC_GATEWAY_URL` must match where Fastify listens (scheme + host + port).

## Acceptance checklist

The build meets the intended demo when:

1. The app runs locally.
2. User can start **Start listening** (or equivalent).
3. Microphone audio is streamed through the backend gateway.
4. VALSEA realtime transcription returns text (when configured).
5. Transcript appears live on screen.
6. User can trigger **Generate notes**.
7. Structured learning output appears (summary, terms, explanation, quiz, etc.).
8. The [demo script](#demo-script-testing) yields coherent summary, key terms, and quiz.
9. Failed realtime connection shows a visible error.
10. Batch upload fallback works or has a clear path (upload → transcribe → notes).
11. API keys are **not** exposed in the frontend bundle.
12. This README is enough to install and run the stack.

## Hackathon definition of done

A judge should be able to: open the app → start capture → speak or play a Vietnamese–English snippet → see transcript → click **Generate notes** → see summary, key terms, explanation, and quiz — and understand that **VALSEA** powers the speech layer.

**One-line pitch:** VALSEA handles the hard voice layer (Vietnamese, Vietnamese-accented English, code-switching); this app turns that stream into structured learning artifacts students can use immediately.
