import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import multipart from "@fastify/multipart";
import type { WebSocket } from "ws";
import { env, assertValseaKey } from "./env.js";
import { createSupabasePersistence } from "./supabasePersistence.js";
import { HybridSessionStore } from "./hybridStore.js";
import {
  connectValseaRealtime,
  sendAudioAppend,
  sendAudioCommit,
  sendSessionStop,
  type NormalizedValsea,
} from "./valseaRealtimeClient.js";
import { transcribeAudioFile } from "./valseaBatchClient.js";
import { buildValseaLearningContext } from "./valseaTextClient.js";
import { TranscriptProcessor, type TranscriptChunk } from "./transcriptProcessor.js";
import { generateLearning, generateLiveChunkAssist } from "./intelligence.js";
import type { BackendToFrontend, FrontendToBackend } from "./types.js";

const supabasePersistence = createSupabasePersistence(
  env.supabaseUrl,
  env.supabaseServiceRoleKey
);
const store = new HybridSessionStore(supabasePersistence);
if (supabasePersistence) {
  console.log("[gateway] Supabase persistence enabled");
}

function sendJson(socket: WebSocket, msg: BackendToFrontend): void {
  if (socket.readyState === 1 /* OPEN */) {
    socket.send(JSON.stringify(msg));
  }
}

function log(event: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.log(`[${event}]`, detail);
  } else {
    console.log(`[${event}]`);
  }
}

function parseClientMessage(raw: string): FrontendToBackend | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== "object" || data === null) return null;
    const o = data as Record<string, unknown>;
    const type = o.type;
    const sessionId = o.sessionId;
    if (typeof type !== "string" || typeof sessionId !== "string") return null;

    switch (type) {
      case "session.start":
        return { type: "session.start", sessionId };
      case "audio.chunk": {
        const audio = o.audio;
        if (typeof audio !== "string") return null;
        return { type: "audio.chunk", sessionId, audio };
      }
      case "session.stop":
        return { type: "session.stop", sessionId };
      case "learning.generate":
        return { type: "learning.generate", sessionId };
      case "confusion.mark": {
        const note = typeof o.note === "string" ? o.note : "";
        return { type: "confusion.mark", sessionId, note };
      }
      case "liveAssist.set": {
        const enabled = o.enabled === true;
        return { type: "liveAssist.set", sessionId, enabled };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

const VALSEA_MAX_RECONNECTS = 5;
const VALSEA_RECONNECT_BASE_MS = 2000;
/** Min time between live-assist LLM calls per session (demo stability + cost). */
const LIVE_ASSIST_MIN_INTERVAL_MS = 12_000;

type SessionRuntime = {
  sessionId: string;
  valseaWs: WebSocket | null;
  processor: TranscriptProcessor;
  valseaReady: boolean;
  lastPartial: string;
  tickTimer: NodeJS.Timeout | null;
  valseaReconnectCancelled: boolean;
  /** Incremented on each abnormal VALSEA close; reset on `session_ready`. */
  valseaReconnectCount: number;
  valseaConnGeneration: number;
  valseaReconnectTimer: NodeJS.Timeout | null;
  liveAssistEnabled: boolean;
  liveAssistLastAt: number;
  liveAssistInFlight: boolean;
};

function closeValsea(rt: SessionRuntime | null): void {
  if (!rt) return;
  rt.valseaReconnectCancelled = true;
  if (rt.valseaReconnectTimer) {
    clearTimeout(rt.valseaReconnectTimer);
    rt.valseaReconnectTimer = null;
  }
  if (rt.tickTimer) {
    clearInterval(rt.tickTimer);
    rt.tickTimer = null;
  }
  if (rt.valseaWs && rt.valseaWs.readyState === rt.valseaWs.OPEN) {
    try {
      rt.valseaWs.close();
    } catch {
      /* ignore */
    }
  }
  rt.valseaWs = null;
  rt.valseaReady = false;
}

/** Text still in the processor buffer + live partial (not yet flushed to store). */
function buildTranscriptForLearning(rt: SessionRuntime): string {
  const base = rt.processor.getFullTranscript();
  const tail = rt.lastPartial.trim();
  if (tail && !base.includes(tail)) {
    return [base, tail].filter(Boolean).join("\n");
  }
  return base;
}

function mergeStoredAndLive(stored: string, live: string): string {
  const a = stored.trim();
  const b = live.trim();
  if (!a) return b;
  if (!b) return a;
  if (a.includes(b)) return a;
  if (b.includes(a)) return b;
  return `${a}\n\n${b}`;
}

/** Full lecture text: persisted chunks in store + any unflushed processor state (fixes empty WS generate after finals). */
async function resolveTranscriptForLearning(
  sessionId: string,
  rt: SessionRuntime | null
): Promise<string> {
  const row = await store.get(sessionId);
  const persisted = row?.transcript?.trim() ?? "";
  const live =
    rt && rt.sessionId === sessionId ? buildTranscriptForLearning(rt).trim() : "";
  return mergeStoredAndLive(persisted, live);
}

function pushTranscriptFinal(
  socket: WebSocket,
  rt: SessionRuntime,
  chunk: TranscriptChunk,
  sessionRef: { current: SessionRuntime | null }
): void {
  sendJson(socket, {
    type: "transcript.final",
    chunk: {
      id: chunk.id,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      text: chunk.text,
    },
  });
  store.appendFinalChunk(rt.sessionId, chunk);
  scheduleLiveAssistForChunk(socket, rt, chunk, sessionRef);
}

function scheduleLiveAssistForChunk(
  socket: WebSocket,
  rt: SessionRuntime,
  chunk: TranscriptChunk,
  sessionRef: { current: SessionRuntime | null }
): void {
  if (!rt.liveAssistEnabled) return;
  const text = chunk.text.trim();
  if (text.length < 20) return;
  if (rt.liveAssistInFlight) return;
  const now = Date.now();
  if (now - rt.liveAssistLastAt < LIVE_ASSIST_MIN_INTERVAL_MS) return;

  rt.liveAssistLastAt = now;
  rt.liveAssistInFlight = true;
  const capturedSessionId = rt.sessionId;
  const chunkId = chunk.id;
  const forLlm = text.length > 900 ? text.slice(0, 900) : text;
  const preview = text.length > 280 ? `${text.slice(0, 280)}…` : text;

  void (async () => {
    try {
      const payload = await generateLiveChunkAssist(forLlm);
      const cur = sessionRef.current;
      if (
        !payload ||
        socket.readyState !== 1 ||
        !cur ||
        cur.sessionId !== capturedSessionId
      ) {
        return;
      }
      sendJson(socket, {
        type: "assist.live",
        chunkId,
        chunkText: preview,
        payload,
      });
      log("live_assist_chunk", { sessionId: capturedSessionId, chunkId });
    } catch (e) {
      log("live_assist_error", {
        sessionId: capturedSessionId,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      const cur = sessionRef.current;
      if (cur?.sessionId === capturedSessionId) {
        cur.liveAssistInFlight = false;
      }
    }
  })();
}

async function main(): Promise<void> {
  const fastify = Fastify({ logger: false });

  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });
  await fastify.register(multipart, {
    limits: { fileSize: 25 * 1024 * 1024 },
  });
  await fastify.register(websocket);

  fastify.get("/health", async () => {
    const base = {
      ok: true as const,
      service: "classroom-copilot-gateway",
      persistence: supabasePersistence ? ("supabase" as const) : ("memory" as const),
      port: env.port,
    };
    if (!supabasePersistence) {
      return { ...base, supabase: "disabled" as const };
    }
    const ping = await supabasePersistence.ping();
    return {
      ...base,
      supabase: ping.ok ? ("reachable" as const) : ("error" as const),
      ...(ping.message ? { supabaseDetail: ping.message } : {}),
    };
  });

  fastify.get<{ Querystring: { limit?: string } }>("/api/sessions", async (req) => {
    const raw = req.query?.limit;
    const parsed =
      typeof raw === "string" ? Number.parseInt(raw, 10) : Number.NaN;
    const limit = Number.isFinite(parsed) ? parsed : 100;
    const sessions = await store.listAllSummaries(limit);
    log("sessions_list", { count: sessions.length });
    return {
      sessions,
      persistence: supabasePersistence ? ("supabase" as const) : ("memory" as const),
    };
  });

  fastify.get<{ Params: { sessionId: string } }>(
    "/api/session/:sessionId",
    async (req, reply) => {
      const sessionId = (req.params.sessionId ?? "").trim();
      if (!sessionId) {
        reply.code(400);
        return { error: "sessionId is required" };
      }
      const s = await store.get(sessionId);
      if (!s) {
        reply.code(404);
        return {
          error:
            "Session not found — chưa có dữ liệu (RAM/Supabase) hoặc sessionId không hợp lệ.",
        };
      }
      return {
        sessionId: s.sessionId,
        transcript: s.transcript,
        learningOutputs: s.learningOutputs,
        confusionEvents: s.confusionEvents,
        updatedAt: s.updatedAt,
      };
    }
  );

  fastify.post("/api/generate-notes", async (req, reply) => {
    const body = req.body as { sessionId?: string };
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!sessionId.trim()) {
      reply.code(400);
      return { error: "sessionId is required" };
    }
    try {
      const transcript = (await store.get(sessionId))?.transcript ?? "";
      if (!transcript.trim()) {
        reply.code(400);
        return { error: "Transcript is empty for this session" };
      }
      const valsea = await buildValseaLearningContext(transcript);
      log("valsea_learning_context", {
        sessionId,
        enabled: valsea.enabled,
        semanticTagCount: valsea.semanticTags.length,
        hasClarifiedText: Boolean(valsea.clarifiedText),
        hasFormattedNotes: Boolean(valsea.formattedNotes),
        hasTranslationEn: Boolean(valsea.translatedTextEn),
        errorCount: valsea.errors.length,
      });
      const output = await generateLearning(transcript, valsea);
      store.appendLearning(sessionId, output);
      return { output };
    } catch (e) {
      reply.code(500);
      return {
        error: e instanceof Error ? e.message : "Learning generation failed",
      };
    }
  });

  fastify.post("/api/confusion", async (req, reply) => {
    const body = req.body as { sessionId?: string; note?: string };
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!sessionId) {
      reply.code(400);
      return { error: "sessionId is required" };
    }
    store.appendConfusion(sessionId, note || "(no note)", "http");
    log("confusion_mark", { sessionId, note: note || "(no note)", via: "http" });
    return { ok: true };
  });

  fastify.post("/api/demo-transcript", async (req, reply) => {
    const body = req.body as { sessionId?: string; text?: string };
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
    const text = typeof body?.text === "string" ? body.text : "";
    if (!sessionId) {
      reply.code(400);
      return { error: "sessionId is required" };
    }
    const trimmed = text.trim();
    if (!trimmed) {
      reply.code(400);
      return { error: "text is required" };
    }
    store.replaceTranscriptFromBulk(sessionId, trimmed);
    log("demo_transcript_seeded", { sessionId, chars: trimmed.length });
    return { ok: true as const };
  });

  fastify.post("/api/transcribe", async (req, reply) => {
    try {
      assertValseaKey();
    } catch (e) {
      reply.code(500);
      return {
        error: e instanceof Error ? e.message : "VALSEA not configured",
      };
    }

    const q = req.query as { sessionId?: string; language?: string };
    const mp = await req.file();
    if (!mp) {
      reply.code(400);
      return { error: "Missing file field" };
    }
    const langRaw = typeof q.language === "string" ? q.language.toLowerCase().trim() : "";
    const batchLang = langRaw === "english" || langRaw === "en" ? "english" : "vietnamese";
    const chunks: Buffer[] = [];
    for await (const ch of mp.file) {
      chunks.push(ch);
    }
    const buffer = Buffer.concat(chunks);
    try {
      const result = await transcribeAudioFile(buffer, mp.filename || "upload.wav", batchLang);
      if (typeof q.sessionId === "string" && q.sessionId.trim()) {
        store.replaceTranscriptFromBulk(q.sessionId.trim(), result.text);
      }
      return { text: result.text, valsea: result.raw };
    } catch (e) {
      reply.code(502);
      return {
        error: e instanceof Error ? e.message : "Transcription failed",
      };
    }
  });

  fastify.get("/ws", { websocket: true }, (socket, _req) => {
    let session: SessionRuntime | null = null;
    const sessionHolder = {
      get current(): SessionRuntime | null {
        return session;
      },
    };

    const handleValseaEvents = (events: NormalizedValsea[]): void => {
      if (!session) return;
      for (const ev of events) {
        if (ev.kind === "session_ready") {
          session.valseaReady = true;
          session.valseaReconnectCount = 0;
          log("valsea_session_ready", { sessionId: session.sessionId });
          sendJson(socket, { type: "session.status", status: "listening" });
          continue;
        }
        if (ev.kind === "session_created") {
          log("valsea_session_created", {
            sessionId: session.sessionId,
            valseaSessionId: ev.sessionId,
          });
          continue;
        }
        if (ev.kind === "error") {
          log("valsea_error_event", {
            sessionId: session.sessionId,
            code: ev.code,
            message: ev.message,
          });
          sendJson(socket, {
            type: "error",
            message: ev.code ? `VALSEA ${ev.code}: ${ev.message}` : ev.message,
            recoverable: true,
          });
          continue;
        }
        if (ev.kind === "transcript_partial") {
          const t = session.processor.ingestPartial(ev.text);
          if (t) {
            session.lastPartial = t;
            log("transcript_received", { partial: true });
            sendJson(socket, { type: "transcript.partial", text: t });
          }
          continue;
        }
        if (ev.kind === "transcript_final") {
          session.lastPartial = "";
          if (ev.timestampMs !== undefined || ev.rawText || ev.corrections) {
            log("valsea_transcript_metadata", {
              sessionId: session.sessionId,
              timestampMs: ev.timestampMs,
              hasRawText: Boolean(ev.rawText),
              correctionCount: ev.corrections?.length ?? 0,
            });
          }
          const chunk = session.processor.ingestFinal(ev.text);
          log("transcript_received", { final: true });
          if (chunk) {
            pushTranscriptFinal(socket, session, chunk, sessionHolder);
          }
          continue;
        }
        if (ev.kind === "unknown") {
          log("valsea_unknown_event", { keys: Object.keys(ev.raw) });
        }
      }
    };

    const startSession = (sessionId: string): void => {
      closeValsea(session);
      let caughtError = false;

      try {
        assertValseaKey();
      } catch (e) {
        caughtError = true;
        sendJson(socket, {
          type: "error",
          message: e instanceof Error ? e.message : "VALSEA not configured",
          recoverable: false,
        });
        sendJson(socket, { type: "session.status", status: "error" });
        return;
      }

      if (caughtError) return;

      const processor = new TranscriptProcessor();
      session = {
        sessionId,
        valseaWs: null,
        processor,
        valseaReady: false,
        lastPartial: "",
        tickTimer: null,
        valseaReconnectCancelled: false,
        valseaReconnectCount: 0,
        valseaConnGeneration: 0,
        valseaReconnectTimer: null,
        liveAssistEnabled: false,
        liveAssistLastAt: 0,
        liveAssistInFlight: false,
      };

      sendJson(socket, { type: "session.status", status: "connecting" });
      log("session_started", { sessionId });
      store.ensureSessionStarted(sessionId);

      session.tickTimer = setInterval(() => {
        if (!session?.valseaReady) return;
        const flushed = session.processor.tick();
        if (flushed) {
          pushTranscriptFinal(socket, session, flushed, sessionHolder);
        }
      }, 10_000);

      const scheduleValReconnect = (detail: string): void => {
        if (!session || session.valseaReconnectCancelled) return;
        if (session.valseaReconnectCount >= VALSEA_MAX_RECONNECTS) {
          sendJson(socket, {
            type: "error",
            message:
              "VALSEA: đã thử kết nối lại quá nhiều lần. Dùng tải audio hoặc tạo ghi chú qua HTTP.",
            recoverable: true,
          });
          sendJson(socket, { type: "session.status", status: "error" });
          return;
        }
        session.valseaReconnectCount += 1;
        const delay = Math.min(
          VALSEA_RECONNECT_BASE_MS * Math.pow(2, session.valseaReconnectCount - 1),
          30_000
        );
        sendJson(socket, { type: "session.status", status: "connecting" });
        sendJson(socket, {
          type: "error",
          message: `${detail} — đang kết nối lại (${session.valseaReconnectCount}/${VALSEA_MAX_RECONNECTS}) sau ~${Math.round(delay / 1000)}s…`,
          recoverable: true,
        });
        session.valseaReconnectTimer = setTimeout(() => {
          if (!session) return;
          session.valseaReconnectTimer = null;
          connectValseaOnce();
        }, delay);
      };

      const connectValseaOnce = (): void => {
        if (!session || session.valseaReconnectCancelled) return;
        session.valseaConnGeneration += 1;
        const gen = session.valseaConnGeneration;
        session.valseaReady = false;

        try {
          const vw = connectValseaRealtime(
            env.valseaApiKey,
            handleValseaEvents,
            () => {
              if (!session || gen !== session.valseaConnGeneration) return;
              log("valsea_connected", { sessionId: session.sessionId });
            },
            (code, reason) => {
              log("valsea_closed", { sessionId, code, reason });
              if (!session || gen !== session.valseaConnGeneration) return;
              session.valseaWs = null;
              session.valseaReady = false;
              if (session.valseaReconnectCancelled) return;
              scheduleValReconnect(`VALSEA đóng (${code}${reason ? `: ${reason}` : ""})`);
            },
            (err) => {
              log("error", { where: "valsea_ws", message: err.message });
              if (!session || gen !== session.valseaConnGeneration) return;
              sendJson(socket, {
                type: "error",
                message: err.message,
                recoverable: true,
              });
            }
          );
          if (session && gen === session.valseaConnGeneration) {
            session.valseaWs = vw;
          } else {
            try {
              vw.close();
            } catch {
              /* ignore */
            }
          }
        } catch (e) {
          const s = session;
          if (s) closeValsea(s);
          session = null;
          sendJson(socket, {
            type: "error",
            message: e instanceof Error ? e.message : "VALSEA realtime connection failed",
            recoverable: true,
          });
          sendJson(socket, { type: "session.status", status: "error" });
        }
      };

      try {
        connectValseaOnce();
      } catch (e) {
        const s = session;
        if (s) closeValsea(s);
        session = null;
        sendJson(socket, {
          type: "error",
          message: e instanceof Error ? e.message : "VALSEA realtime connection failed",
          recoverable: true,
        });
        sendJson(socket, { type: "session.status", status: "error" });
      }
    };

    socket.on("message", async (rawMessage: Buffer | ArrayBuffer | Buffer[]) => {
      const raw =
        typeof rawMessage === "string"
          ? rawMessage
          : Buffer.isBuffer(rawMessage)
            ? rawMessage.toString("utf8")
            : Buffer.from(rawMessage as ArrayBuffer).toString("utf8");

      const msg = parseClientMessage(raw);
      if (!msg) {
        sendJson(socket, {
          type: "error",
          message: "Invalid client message",
          recoverable: true,
        });
        return;
      }

      switch (msg.type) {
        case "session.start":
          startSession(msg.sessionId);
          return;

        case "audio.chunk": {
          if (!session || session.sessionId !== msg.sessionId) {
            sendJson(socket, {
              type: "error",
              message: "No active session — send session.start first",
              recoverable: true,
            });
            return;
          }
          if (!session.valseaReady) {
            return;
          }
          log("audio_chunk_forwarded", { sessionId: session.sessionId });
          sendAudioAppend(session.valseaWs, msg.audio);
          return;
        }

        case "session.stop": {
          if (!session || session.sessionId !== msg.sessionId) return;
          const flushed = session.processor.forceFlush();
          if (flushed) {
            pushTranscriptFinal(socket, session, flushed, sessionHolder);
          }
          sendAudioCommit(session.valseaWs);
          sendSessionStop(session.valseaWs);
          store.finalizeSession(
            session.sessionId,
            await resolveTranscriptForLearning(session.sessionId, session)
          );
          closeValsea(session);
          sendJson(socket, { type: "session.status", status: "stopped" });
          log("session_stopped", { sessionId: msg.sessionId });
          session = null;
          return;
        }

        case "learning.generate": {
          if (session && session.sessionId !== msg.sessionId) {
            sendJson(socket, {
              type: "error",
              message: "Session id mismatch",
              recoverable: true,
            });
            return;
          }
          sendJson(socket, { type: "session.status", status: "generating_outputs" });
          log("learning_generation_started", { sessionId: msg.sessionId });
          try {
            const transcript = await resolveTranscriptForLearning(
              msg.sessionId,
              session && session.sessionId === msg.sessionId ? session : null
            );
            if (!transcript.trim()) {
              sendJson(socket, {
                type: "error",
                message:
                  "Transcript trống — hãy nói hoặc tải audio trước khi tạo ghi chú.",
                recoverable: true,
              });
              sendJson(socket, {
                type: "session.status",
                status: session ? (session.valseaReady ? "listening" : "stopped") : "idle",
              });
              return;
            }
            const valsea = await buildValseaLearningContext(transcript);
            log("valsea_learning_context", {
              sessionId: msg.sessionId,
              enabled: valsea.enabled,
              semanticTagCount: valsea.semanticTags.length,
              hasClarifiedText: Boolean(valsea.clarifiedText),
              hasFormattedNotes: Boolean(valsea.formattedNotes),
              hasTranslationEn: Boolean(valsea.translatedTextEn),
              errorCount: valsea.errors.length,
            });
            const output = await generateLearning(transcript, valsea);
            store.appendLearning(msg.sessionId, output);
            sendJson(socket, { type: "learning.output", output });
            const statusAfter: BackendToFrontend =
              session?.valseaReady
                ? { type: "session.status", status: "listening" }
                : {
                    type: "session.status",
                    status: session ? "stopped" : "idle",
                  };
            sendJson(socket, statusAfter);
            log("learning_generation_completed", { sessionId: msg.sessionId });
          } catch (e) {
            sendJson(socket, {
              type: "error",
              message: e instanceof Error ? e.message : "Learning generation failed",
              recoverable: true,
            });
            sendJson(socket, {
              type: "session.status",
              status: session?.valseaReady ? "listening" : session ? "stopped" : "idle",
            });
          }
          return;
        }

        case "confusion.mark":
          store.appendConfusion(msg.sessionId, msg.note, "ws");
          log("confusion_mark", { sessionId: msg.sessionId, note: msg.note });
          return;

        case "liveAssist.set": {
          if (!session || session.sessionId !== msg.sessionId) {
            sendJson(socket, {
              type: "error",
              message: "No active session — start listening before toggling live assist.",
              recoverable: true,
            });
            return;
          }
          session.liveAssistEnabled = msg.enabled;
          log("live_assist_config", { sessionId: msg.sessionId, enabled: msg.enabled });
          return;
        }

        default:
          return;
      }
    });

    socket.on("close", () => {
      closeValsea(session);
      session = null;
    });
  });

  await fastify.listen({ port: env.port, host: "0.0.0.0" });
  console.log(`Gateway listening on http://localhost:${env.port} (ws /ws)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
