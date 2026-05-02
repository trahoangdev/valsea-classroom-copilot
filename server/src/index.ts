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
  type NormalizedValsea,
} from "./valseaRealtimeClient.js";
import { transcribeAudioFile } from "./valseaBatchClient.js";
import { TranscriptProcessor } from "./transcriptProcessor.js";
import { generateLearning } from "./intelligence.js";
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
      default:
        return null;
    }
  } catch {
    return null;
  }
}

type SessionRuntime = {
  sessionId: string;
  valseaWs: WebSocket | null;
  processor: TranscriptProcessor;
  valseaReady: boolean;
  lastPartial: string;
  tickTimer: NodeJS.Timeout | null;
};

function closeValsea(rt: SessionRuntime | null): void {
  if (!rt) return;
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

function buildTranscriptForLearning(rt: SessionRuntime): string {
  const base = rt.processor.getFullTranscript();
  const tail = rt.lastPartial.trim();
  if (tail && !base.includes(tail)) {
    return [base, tail].filter(Boolean).join("\n");
  }
  return base;
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
      const output = await generateLearning(transcript);
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

    const q = req.query as { sessionId?: string };
    const mp = await req.file();
    if (!mp) {
      reply.code(400);
      return { error: "Missing file field" };
    }
    const chunks: Buffer[] = [];
    for await (const ch of mp.file) {
      chunks.push(ch);
    }
    const buffer = Buffer.concat(chunks);
    try {
      const text = await transcribeAudioFile(buffer, mp.filename || "upload.wav");
      if (typeof q.sessionId === "string" && q.sessionId.trim()) {
        store.replaceTranscriptFromBulk(q.sessionId.trim(), text);
      }
      return { text };
    } catch (e) {
      reply.code(502);
      return {
        error: e instanceof Error ? e.message : "Transcription failed",
      };
    }
  });

  fastify.get("/ws", { websocket: true }, (socket, _req) => {
    let session: SessionRuntime | null = null;

    const handleValseaEvents = (events: NormalizedValsea[]): void => {
      if (!session) return;
      for (const ev of events) {
        if (ev.kind === "session_ready") {
          session.valseaReady = true;
          log("valsea_session_ready", { sessionId: session.sessionId });
          sendJson(socket, { type: "session.status", status: "listening" });
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
          const chunk = session.processor.ingestFinal(ev.text);
          log("transcript_received", { final: true });
          if (chunk) {
            sendJson(socket, {
              type: "transcript.final",
              chunk: {
                id: chunk.id,
                startTime: chunk.startTime,
                endTime: chunk.endTime,
                text: chunk.text,
              },
            });
            store.appendFinalChunk(session.sessionId, chunk);
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
      };

      sendJson(socket, { type: "session.status", status: "connecting" });
      log("session_started", { sessionId });
      store.ensureSessionStarted(sessionId);

      try {
        const vw = connectValseaRealtime(
          env.valseaApiKey,
          handleValseaEvents,
          () => {
            log("valsea_connected", { sessionId });
          },
          (code, reason) => {
            log("valsea_closed", { sessionId, code, reason });
            sendJson(socket, {
              type: "error",
              message: `VALSEA connection closed (${code})`,
              recoverable: true,
            });
            sendJson(socket, { type: "session.status", status: "stopped" });
          },
          (err) => {
            log("error", { where: "valsea_ws", message: err.message });
            sendJson(socket, {
              type: "error",
              message: err.message,
              recoverable: true,
            });
            sendJson(socket, { type: "session.status", status: "error" });
          }
        );
        if (session) session.valseaWs = vw;

        session!.tickTimer = setInterval(() => {
          if (!session?.valseaReady) return;
          const flushed = session.processor.tick();
          if (flushed) {
            sendJson(socket, {
              type: "transcript.final",
              chunk: {
                id: flushed.id,
                startTime: flushed.startTime,
                endTime: flushed.endTime,
                text: flushed.text,
              },
            });
            store.appendFinalChunk(session.sessionId, flushed);
          }
        }, 10_000);
      } catch (e) {
        sendJson(socket, {
          type: "error",
          message: e instanceof Error ? e.message : "VALSEA realtime connection failed",
          recoverable: true,
        });
        sendJson(socket, { type: "session.status", status: "error" });
        session = null;
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
            sendJson(socket, {
              type: "transcript.final",
              chunk: {
                id: flushed.id,
                startTime: flushed.startTime,
                endTime: flushed.endTime,
                text: flushed.text,
              },
            });
          }
          store.finalizeSession(session.sessionId, buildTranscriptForLearning(session));
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
            let transcript = "";
            if (session && session.sessionId === msg.sessionId) {
              transcript = buildTranscriptForLearning(session);
            } else {
              transcript = (await store.get(msg.sessionId))?.transcript ?? "";
            }
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
            const output = await generateLearning(transcript);
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
