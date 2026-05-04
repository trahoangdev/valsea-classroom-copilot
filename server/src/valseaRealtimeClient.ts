import WebSocket from "ws";

const VALSEA_REALTIME_URL = "wss://api.valsea.ai/v1/realtime";

export type NormalizedValsea =
  | { kind: "session_created"; sessionId?: string }
  | { kind: "session_ready" }
  | { kind: "transcript_partial"; text: string }
  | {
      kind: "transcript_final";
      text: string;
      rawText?: string;
      timestampMs?: number;
      corrections?: unknown[];
    }
  | { kind: "error"; message: string; code?: string }
  | { kind: "unknown"; raw: Record<string, unknown> };

function pickText(obj: Record<string, unknown>): string | undefined {
  const t = obj.text ?? obj.transcript ?? obj.content;
  if (typeof t === "string" && t.trim()) return t;
  const alt = obj.result;
  if (typeof alt === "object" && alt && "text" in alt) {
    const x = (alt as { text?: unknown }).text;
    if (typeof x === "string") return x;
  }
  return undefined;
}

/** Best-effort normalization — VALSEA may evolve event shapes; keep logs in dev. */
export function normalizeValseaMessage(raw: unknown): NormalizedValsea[] {
  if (typeof raw !== "object" || raw === null) return [];
  const o = raw as Record<string, unknown>;
  const type = typeof o.type === "string" ? o.type.toLowerCase() : "";
  const code = typeof o.code === "string" ? o.code : undefined;
  const message = typeof o.message === "string" ? o.message : undefined;

  if (type === "error" || code || (message && type.includes("error"))) {
    return [{ kind: "error", message: message ?? "VALSEA realtime error", code }];
  }

  if (type === "session.created") {
    return [
      {
        kind: "session_created",
        sessionId: typeof o.sessionId === "string" ? o.sessionId : undefined,
      },
    ];
  }

  if (
    type.includes("session") &&
    (type.includes("ready") || type === "session.ready" || o.ready === true)
  ) {
    return [{ kind: "session_ready" }];
  }

  const text = pickText(o);
  if (text) {
    const finalFlag =
      o.is_final === true ||
      o.final === true ||
      o.isFinal === true ||
      type.includes("final") ||
      type === "transcript.final";
    const partialFlag =
      !finalFlag &&
      (o.is_partial === true ||
        type.includes("partial") ||
        type === "transcript.partial");

    if (finalFlag) {
      return [
        {
          kind: "transcript_final",
          text,
          rawText: typeof o.raw_text === "string" ? o.raw_text : undefined,
          timestampMs:
            typeof o.timestampMs === "number"
              ? o.timestampMs
              : typeof o.timestamp_ms === "number"
                ? o.timestamp_ms
                : undefined,
          corrections: Array.isArray(o.corrections) ? o.corrections : undefined,
        },
      ];
    }
    if (partialFlag || type.includes("transcript")) {
      return [{ kind: "transcript_partial", text }];
    }
    if (type === "" && text) {
      return [{ kind: "transcript_partial", text }];
    }
  }

  if (
    o.delta &&
    typeof o.delta === "object" &&
    o.delta !== null &&
    "text" in (o.delta as object)
  ) {
    const dt = (o.delta as { text?: unknown }).text;
    if (typeof dt === "string" && dt.trim()) {
      return [{ kind: "transcript_partial", text: dt }];
    }
  }

  return [{ kind: "unknown", raw: o }];
}

export function connectValseaRealtime(
  apiKey: string,
  onMessage: (ev: NormalizedValsea[]) => void,
  onOpen: () => void,
  onClose: (code: number, reason: string) => void,
  onError: (err: Error) => void
): WebSocket {
  const ws = new WebSocket(VALSEA_REALTIME_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  ws.on("open", () => {
    ws.send(
      JSON.stringify({
        type: "session.start",
        model: "valsea-rtt",
        language: "vietnamese",
        enable_correction: true,
      })
    );
    onOpen();
  });

  ws.on("message", (data) => {
    try {
      const parsed = JSON.parse(data.toString()) as unknown;
      if (Array.isArray(parsed)) {
        const out: NormalizedValsea[] = [];
        for (const item of parsed) {
          out.push(...normalizeValseaMessage(item));
        }
        onMessage(out);
        return;
      }
      if (typeof parsed === "object" && parsed !== null && "events" in parsed) {
        const evs = (parsed as { events?: unknown }).events;
        if (Array.isArray(evs)) {
          const out: NormalizedValsea[] = [];
          for (const item of evs) {
            out.push(...normalizeValseaMessage(item));
          }
          onMessage(out);
          return;
        }
      }
      onMessage(normalizeValseaMessage(parsed));
    } catch {
      onMessage([]);
    }
  });

  ws.on("close", (code, reason) => {
    onClose(code, reason.toString());
  });

  ws.on("error", (err) => {
    onError(err instanceof Error ? err : new Error(String(err)));
  });

  return ws;
}

export function sendAudioAppend(ws: WebSocket | null, base64Pcm16: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: "audio.append", audio: base64Pcm16 }));
}

export function sendAudioCommit(ws: WebSocket | null): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: "audio.commit" }));
}

export function sendSessionStop(ws: WebSocket | null): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: "session.stop" }));
}
