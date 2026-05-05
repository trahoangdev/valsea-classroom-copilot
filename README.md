# Vietnamese–English Classroom Copilot

Speech-first classroom copilot for Vietnamese university lectures where instructors naturally mix Vietnamese explanations with English technical terms. The app captures microphone audio in the browser, streams **16 kHz PCM16 mono** chunks through a Fastify gateway to **VALSEA Realtime ASR**, then turns the transcript into structured learning material: Vietnamese summary, key terms, simple explanation, English recap, quiz questions, possible confusion points, exports, and session history.

**Track:** VALSEA EdTech Hack Sprint — **Real-Time Classroom Assist** (speech-first, classroom-first; not a generic chatbot).

**One-line pitch:** VALSEA handles the hard voice + language layer for Vietnamese–English code-switching lectures; Classroom Copilot converts that stream into notes, explanations, and quizzes students can use immediately.

## What is implemented

- **Realtime mic capture:** Browser audio is downsampled to **16 kHz PCM16 mono**, base64-encoded, and streamed over WebSocket.
- **VALSEA realtime ASR:** Gateway connects to `wss://api.valsea.ai/v1/realtime` using `valsea-rtt`, Vietnamese language hint, and correction enabled.
- **Live transcript:** Partial and final ASR events are normalized, deduplicated, chunked, persisted, and rendered in the UI.
- **Live Assist:** Optional per-final-segment micro-summary, Vietnamese explanation, and English line via a rate-limited server-side LLM call.
- **Generate Notes:** Full transcript is enriched with VALSEA text APIs, then sent to an OpenAI-compatible LLM for schema-based JSON learning output.
- **VALSEA Learning Context:** The UI displays VALSEA semantic tags, formatted notes, and English translation directly, not only the LLM result.
- **Batch fallback:** Audio upload uses VALSEA batch transcription when realtime mic is unstable.
- **Demo-safe mode:** Insert a built-in Vietnamese–English script without microphone input.
- **Confusion signal:** Students can mark “I’m confused” with an optional note.
- **Session review:** `/session` lists saved sessions; `/session/[id]` shows transcript, learning outputs, and confusion events.
- **Export:** Download notes as `.md` or `.json`, including VALSEA learning artifacts.
- **Hybrid persistence:** In-memory store by default; optional Supabase durability.

## Contents

- [What is implemented](#what-is-implemented)
- [Architecture](#architecture)
- [VALSEA endpoints used](#valsea-endpoints-used)
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
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Acceptance checklist](#acceptance-checklist)
- [Hackathon definition of done](#hackathon-definition-of-done)
- [Judge takeaway](#judge-takeaway)

## Architecture

```text
Browser (Next.js)
  │  microphone → Float32 → 16 kHz PCM16 mono → base64
  │  WebSocket messages: session.start, audio.chunk, learning.generate, …
  ▼
Fastify gateway (WebSocket /ws + REST)
  │  protects VALSEA / LLM / Supabase secrets
  │  proxies realtime audio, normalizes transcript events
  │  chunks + persists transcript, builds VALSEA learning context
  ▼
VALSEA
  ├─ Realtime ASR
  ├─ Batch transcription fallback
  ├─ Annotations
  ├─ Clarifications
  ├─ Translations
  └─ Formatting
  ▼
Server-side LLM
  │  structured JSON notes + live assist
  ▼
Frontend UI
  ├─ Live Transcript
  ├─ Live Assist Feed
  ├─ Learning Assistant
  ├─ VALSEA Learning Context
  ├─ Export
  └─ Session Review
```

## VALSEA endpoints used

This project uses **6 VALSEA endpoints**:

| # | Endpoint | Used for |
|---|----------|----------|
| 1 | `wss://api.valsea.ai/v1/realtime` | Realtime Vietnamese ASR with correction |
| 2 | `POST /v1/audio/transcriptions` | Batch upload fallback with `verbose_json`, correction, and tags |
| 3 | `POST /v1/annotations` | Semantic tags and annotated text |
| 4 | `POST /v1/clarifications` | Simplified Vietnamese explanation |
| 5 | `POST /v1/translations` | English translation / recap evidence |
| 6 | `POST /v1/formatting` | Structured lecture notes / meeting-minutes style output |

Text enrichment flow:

1. `annotations`, `clarifications`, and `translations` run in parallel with safe per-call fallback.
2. `formatting` runs after annotation so semantic tags can be passed into the formatting request.
3. The gateway injects VALSEA evidence into the LLM prompt.
4. The final `learning.output` includes both LLM output and `output.valsea` artifacts.

## Prerequisites

- **Node.js** 18+ (global `fetch`, `FormData`, `File` on the server)
- **VALSEA** API key and an **OpenAI-compatible** LLM API key (or compatible base URL)
- Optional: **Supabase** project for durable sessions and exports

## Environment variables

The repo ships **[`.env.example`](./.env.example)** as a single reference. You must apply values in the right place:

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `VALSEA_API_KEY` | `server/.env` | Backend only — VALSEA realtime, batch, annotations, clarifications, translations, formatting |
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
| `POST /api/generate-notes` | HTTP fallback for VALSEA text enrichment + learning generation |
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
- `valsea` (optional VALSEA learning artifacts: semantic tags, annotated text, clarified text, formatted notes, English translation, API errors)

## Demo flow

1. Open **Classroom Copilot** at `/classroom-copilot`.
2. Point out the two-column layout: **Live Transcript** on the left, **Learning Assistant** on the right.
3. Click **Start listening**, allow microphone access, and optionally enable **Live Assist**.
4. Speak using the [demo script](#demo-script-testing), **or** use **Insert demo script** to seed the session without mic input.
5. Watch **Live transcript** partials and finals; show **Live Assist** after finalized chunks.
6. Click **Stop** when finished if you used the mic.
7. Click **Generate notes** for full structured output.
8. Show Vietnamese summary, key terms, simple explanation, English recap, quiz, and possible confusing points.
9. Expand or scroll to **VALSEA Learning Context**: semantic tags, formatted notes, and English translation.
10. Click **I'm confused** to save a confusion signal.
11. Use **Download .md** / **Download .json** to export transcript + notes + VALSEA context.
12. Open `/session` to show saved session history and detail pages.

**Fallback:** **Upload audio** uses batch transcription via `/api/transcribe`, then **Generate notes** (works over HTTP if the WebSocket is closed). Errors include short hints and a pointer to **`GET /health`**.

**Confusion:** **I'm confused** sends `confusion.mark` over the WebSocket when connected, or `POST /api/confusion` when offline; events are stored in memory and, with Supabase, in `confusion_events`.

## Demo script (testing)

Use this Vietnamese–English snippet to validate ASR and **Generate notes** (also available via **Insert demo script** in the UI):

```text
Hôm nay mình học về gradient descent. Khi model dự đoán sai, loss function sẽ cho biết mức độ sai lệch. Gradient descent giúp chúng ta cập nhật weights từng bước để giảm loss. Nhưng nếu learning rate quá cao thì model có thể overshoot và không converge. Nếu learning rate quá thấp thì training sẽ rất chậm.
```

**What you should see roughly:** a short Vietnamese summary mentioning gradient descent, loss, weights, learning rate, training; key terms such as *gradient descent*, *loss function*, *weights*, *learning rate*, *overshoot*, *converge*, *training*; quiz questions you can answer from the paragraph above; and VALSEA context such as semantic tags, clarified text, formatted notes, or English translation when the API key is configured.

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
├── about.md                # Devpost submission draft
├── demo-live-script.md     # 5-minute live demo script
├── script.md               # 2–3 minute video script
└── .env.example            # Reference for all variables
```

Important server files:

- `server/src/index.ts` — Fastify REST routes and WebSocket gateway.
- `server/src/valseaRealtimeClient.ts` — VALSEA realtime session, message normalization, `audio.append`, `audio.commit`, `session.stop`.
- `server/src/valseaBatchClient.ts` — VALSEA upload fallback.
- `server/src/valseaTextClient.ts` — VALSEA annotations, clarifications, translations, formatting.
- `server/src/transcriptProcessor.ts` — partial deduplication, final chunking, force flush.
- `server/src/intelligence.ts` — LLM prompts, JSON coercion, full notes, live chunk assist.
- `server/src/hybridStore.ts` — memory + optional Supabase persistence.

## Deployment notes

Recommended split:

- **Frontend:** Vercel, root directory `client/`
- **Gateway:** Render/Railway/Fly, root directory `server/`
- **Database:** Supabase, optional

Frontend production variables:

```env
NEXT_PUBLIC_GATEWAY_URL=https://YOUR-GATEWAY.example.com
NEXT_PUBLIC_WS_URL=wss://YOUR-GATEWAY.example.com/ws
```

Gateway production variables:

```env
VALSEA_API_KEY=
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
```

Use `wss://` for `NEXT_PUBLIC_WS_URL` in production.

## Troubleshooting

- **No transcript / VALSEA errors:** Confirm `VALSEA_API_KEY` in **`server/.env`** and check **`GET /health`**. Use **Insert demo script** or **Upload audio** to isolate ASR vs UI.
- **Generate notes fails:** Set `LLM_API_KEY` in **`server/.env`**; verify `LLM_BASE_URL` / `LLM_MODEL` for your provider.
- **UI cannot connect:** Ensure gateway is on port **3001** (or set `PORT` + matching `NEXT_PUBLIC_*` in **`client/.env.local`**).
- **CORS / wrong API host:** `NEXT_PUBLIC_GATEWAY_URL` must match where Fastify listens (scheme + host + port).
- **WebSocket works locally but not deployed:** Use `wss://`, verify the gateway host supports WebSocket upgrades, and check CORS / reverse proxy settings.
- **VALSEA text context missing:** Check `VALSEA_API_KEY`; `output.valsea.errors` may show which text API failed.
- **Session list is empty after restart:** Memory store was used; configure Supabase for durable persistence.

## Acceptance checklist

The build meets the intended demo when:

1. The app runs locally.
2. User can start **Start listening** (or equivalent).
3. Microphone audio is streamed through the backend gateway.
4. VALSEA realtime transcription returns text (when configured).
5. Transcript appears live on screen.
6. User can trigger **Generate notes**.
7. Structured learning output appears (summary, terms, explanation, quiz, etc.).
8. VALSEA Learning Context appears when configured (semantic tags, formatted notes, translation, or visible per-call errors).
9. The [demo script](#demo-script-testing) yields coherent summary, key terms, and quiz.
10. Failed realtime connection shows a visible error.
11. Batch upload fallback works or has a clear path (upload → transcribe → notes).
12. Confusion marking works via WebSocket or HTTP fallback.
13. Export `.md` / `.json` works.
14. `/session` and `/session/[id]` show saved data.
15. API keys are **not** exposed in the frontend bundle.
16. This README is enough to install and run the stack.

## Hackathon definition of done

A judge should be able to: open the app → start capture → speak or play a Vietnamese–English snippet → see transcript → click **Generate notes** → see summary, key terms, explanation, English recap, quiz, VALSEA semantic context, export, and session history — and understand that **VALSEA** powers both the speech layer and the semantic enrichment layer.

**One-line pitch:** VALSEA handles the hard voice layer (Vietnamese, Vietnamese-accented English, code-switching); this app turns that stream into structured learning artifacts students can use immediately.

## Judge takeaway

Classroom Copilot is not a generic chatbot. It is a working end-to-end classroom system:

```text
Vietnamese–English lecture speech
  → VALSEA realtime / batch transcription
  → VALSEA semantic enrichment
  → grounded LLM learning output
  → live transcript, explanations, notes, quizzes, exports, and session review
```

The core value is that VALSEA handles the difficult speech and language layer, while the application turns that stream into structured support for real students in Vietnamese university classrooms.
