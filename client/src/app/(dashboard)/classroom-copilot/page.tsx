"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ExternalLink, Eye, PlusCircle } from "lucide-react";
import { AudioControls } from "@/components/classroom-copilot/audio-controls";
import { ConfusionDialog } from "@/components/classroom-copilot/confusion-dialog";
import { ClassroomErrorAlert } from "@/components/classroom-copilot/classroom-error-alert";
import { LiveAssistFeed } from "@/components/classroom-copilot/live-assist-feed";
import { LiveTranscript } from "@/components/classroom-copilot/live-transcript";
import { LearningPanel } from "@/components/classroom-copilot/learning-panel";
import { SessionStatusBadge } from "@/components/classroom-copilot/session-status-badge";
import { UploadFallback } from "@/components/classroom-copilot/upload-fallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { startAudioCapture } from "@/lib/classroom/audio/capture";
import { postConfusion, postDemoTranscript } from "@/lib/classroom/api";
import { DEMO_SCRIPT_VI } from "@/lib/classroom/demoScript";
import type {
  BackendToFrontend,
  LearningOutput,
  LiveChunkAssist,
  SessionUiStatus,
} from "@/lib/classroom/types";
import { connectGateway, sendJson } from "@/lib/classroom/websocket";

const HTTP_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") ?? "http://localhost:3001";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

export default function ClassroomCopilotPage() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<SessionUiStatus>("idle");
  const [partial, setPartial] = useState("");
  const [finals, setFinals] = useState<{ id: string; text: string }[]>([]);
  const [learning, setLearning] = useState<LearningOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [confusionOpen, setConfusionOpen] = useState(false);
  const [autoNotesEnabled, setAutoNotesEnabled] = useState(false);
  const [liveAssistOn, setLiveAssistOn] = useState(false);
  const [liveAssistEntries, setLiveAssistEntries] = useState<
    { chunkId: string; chunkText: string; payload: LiveChunkAssist }[]
  >([]);
  const [micActive, setMicActive] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const liveAssistOnRef = useRef(false);
  const transcriptPanelRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<SessionUiStatus>("idle");
  const captureRef = useRef<{ stop: () => void } | null>(null);
  const micStartedRef = useRef(false);
  const captureCancelledRef = useRef(false);
  const transcriptTextRef = useRef("");
  const onGenerateRef = useRef<() => void | Promise<void>>(() => {});
  const lastAutoTranscriptSigRef = useRef<string>("");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    liveAssistOnRef.current = liveAssistOn;
  }, [liveAssistOn]);

  const focusLiveTranscriptPanel = useCallback(() => {
    requestAnimationFrame(() => {
      const el = transcriptPanelRef.current;
      if (!el) return;
      el.scrollIntoView({ block: "start", behavior: "smooth" });
      el.focus({ preventScroll: true });
    });
  }, []);

  const hasTranscript = finals.length > 0 || partial.trim().length > 0;

  const transcriptText = useMemo(() => {
    const parts = finals.map((f) => f.text.trim()).filter(Boolean);
    const tail = partial.trim();
    if (tail) parts.push(tail);
    return parts.join("\n\n");
  }, [finals, partial]);

  useEffect(() => {
    transcriptTextRef.current = transcriptText;
  }, [transcriptText]);

  const appendFinal = useCallback((chunk: { id: string; text: string }) => {
    setFinals((prev) => {
      if (prev.some((p) => p.id === chunk.id)) return prev;
      return [...prev, chunk];
    });
  }, []);

  const handleServerMessage = useCallback(
    (msg: BackendToFrontend) => {
      if (msg.type === "session.status") {
        if (msg.status === "listening") {
          return;
        }
        setStatus(msg.status);
        return;
      }
      if (msg.type === "transcript.partial") {
        setPartial(msg.text);
        setStatus((s) =>
          s === "listening" || s === "transcribing" ? "transcribing" : s
        );
        return;
      }
      if (msg.type === "transcript.final") {
        setPartial("");
        appendFinal({ id: msg.chunk.id, text: msg.chunk.text });
        setStatus((s) =>
          s === "transcribing" || s === "listening" ? "listening" : s
        );
        return;
      }
      if (msg.type === "learning.output") {
        setLearning(msg.output);
        return;
      }
      if (msg.type === "assist.live") {
        setLiveAssistEntries((prev) => {
          const entry = {
            chunkId: msg.chunkId,
            chunkText: msg.chunkText,
            payload: msg.payload,
          };
          const rest = prev.filter((e) => e.chunkId !== msg.chunkId);
          return [entry, ...rest].slice(0, 18);
        });
        return;
      }
      if (msg.type === "error") {
        setErrorMsg(msg.message);
        return;
      }
    },
    [appendFinal]
  );

  const startMic = useCallback(async () => {
    if (micStartedRef.current) return;
    setErrorMsg(null);
    const cap = await startAudioCapture(
      (audio) => {
        if (captureCancelledRef.current) return;
        sendJson(wsRef.current, { type: "audio.chunk", sessionId, audio });
      },
      (m) => {
        setErrorMsg(m);
        setStatus("error");
      }
    );
    if (captureCancelledRef.current) {
      cap.stop();
      return;
    }
    captureRef.current = cap;
    micStartedRef.current = true;
    setMicActive(true);
    setStatus("listening");
    focusLiveTranscriptPanel();
  }, [sessionId, focusLiveTranscriptPanel]);

  const stopMic = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    micStartedRef.current = false;
    setMicActive(false);
  }, []);

  const onLiveAssistToggle = useCallback(
    (on: boolean) => {
      setLiveAssistOn(on);
      liveAssistOnRef.current = on;
      sendJson(wsRef.current, { type: "liveAssist.set", sessionId, enabled: on });
    },
    [sessionId]
  );

  const onStart = useCallback(() => {
    setErrorMsg(null);
    setLearning(null);
    setLiveAssistEntries([]);
    captureCancelledRef.current = false;
    micStartedRef.current = false;
    setMicActive(false);
    stopMic();
    try {
      wsRef.current?.close();
    } catch {
      /* */
    }

    const ws = connectGateway(WS_URL, {
      onOpen: () => {
        sendJson(ws, { type: "session.start", sessionId });
        wsRef.current = ws;
      },
      onTransportError: () => {
        if (wsRef.current !== ws) return;
        setErrorMsg("Could not open WebSocket to gateway — check URL and firewall.");
        setStatus("error");
      },
      onClose: (ev) => {
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        stopMic();
        const s = statusRef.current;
        if (s === "stopped" || s === "idle" || s === "error") return;
        const extra = ev.wasClean ? "" : ` (close code ${ev.code})`;
        setErrorMsg(
          `Lost realtime connection to gateway${extra}. Try again, or use audio upload / demo script + Generate notes over HTTP.`
        );
        setStatus("error");
      },
      onMessage: (msg) => {
        if (msg.type === "session.status" && msg.status === "listening") {
          sendJson(ws, {
            type: "liveAssist.set",
            sessionId,
            enabled: liveAssistOnRef.current,
          });
          if (micStartedRef.current) {
            setStatus("listening");
            focusLiveTranscriptPanel();
            return;
          }
          setStatus("requesting_microphone");
          void startMic();
          return;
        }
        handleServerMessage(msg);
      },
    });
    wsRef.current = ws;
    setStatus("connecting");
  }, [focusLiveTranscriptPanel, handleServerMessage, sessionId, startMic, stopMic]);

  const onStop = useCallback(() => {
    captureCancelledRef.current = true;
    stopMic();
    sendJson(wsRef.current, { type: "session.stop", sessionId });
  }, [sessionId, stopMic]);

  /** New session: close WS/mic, stop old session on gateway, new UUID, clear transcript & notes (no F5). */
  const onNewSession = useCallback(() => {
    const prevId = sessionId;
    captureCancelledRef.current = true;
    stopMic();
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws?.readyState === WebSocket.OPEN) {
      sendJson(ws, { type: "session.stop", sessionId: prevId });
    }
    try {
      ws?.close();
    } catch {
      /* */
    }
    micStartedRef.current = false;
    setMicActive(false);
    setSessionId(crypto.randomUUID());
    setPartial("");
    setFinals([]);
    setLearning(null);
    setErrorMsg(null);
    setStatus("idle");
    lastAutoTranscriptSigRef.current = "";
    setConfusionOpen(false);
    setLiveAssistEntries([]);
  }, [sessionId, stopMic]);

  const onGenerate = useCallback(async () => {
    setErrorMsg(null);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendJson(ws, { type: "learning.generate", sessionId });
      return;
    }
    try {
      setStatus("generating_outputs");
      const res = await fetch(`${HTTP_BASE}/api/generate-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as { output?: LearningOutput; error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? `HTTP ${res.status}`);
        setStatus("idle");
        return;
      }
      if (data.output) setLearning(data.output);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Generate failed");
      setStatus("idle");
    }
  }, [sessionId]);

  onGenerateRef.current = onGenerate;

  const sendConfusionNote = useCallback(
    async (note: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendJson(ws, { type: "confusion.mark", sessionId, note });
        return;
      }
      try {
        const r = await postConfusion(HTTP_BASE, sessionId, note);
        if (r.error) setErrorMsg(r.error);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Could not send confusion signal");
      }
    },
    [sessionId]
  );

  /** §13: optional auto-generate every 60s while listening if transcript grew. */
  useEffect(() => {
    if (!autoNotesEnabled) return;
    const id = window.setInterval(() => {
      const s = statusRef.current;
      if (s !== "listening" && s !== "transcribing") return;
      const t = transcriptTextRef.current.trim();
      if (!t) return;
      const sig = t.length > 8000 ? t.slice(0, 8000) : t;
      if (sig === lastAutoTranscriptSigRef.current) return;
      lastAutoTranscriptSigRef.current = sig;
      void onGenerateRef.current();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [autoNotesEnabled]);

  const onUploadTranscript = useCallback(
    (text: string) => {
      setPartial("");
      appendFinal({ id: crypto.randomUUID(), text });
    },
    [appendFinal]
  );

  const onSeedDemoScript = useCallback(async () => {
    setErrorMsg(null);
    setDemoLoading(true);
    try {
      const r = await postDemoTranscript(HTTP_BASE, sessionId, DEMO_SCRIPT_VI);
      if (r.error) {
        setErrorMsg(r.error);
        return;
      }
      setPartial("");
      setFinals([{ id: crypto.randomUUID(), text: DEMO_SCRIPT_VI }]);
      setLearning(null);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not send demo script");
    } finally {
      setDemoLoading(false);
    }
  }, [sessionId]);

  const teacherPath = `/session/${encodeURIComponent(sessionId)}`;
  const snapshotUrl = `${HTTP_BASE}/api/session/${encodeURIComponent(sessionId)}`;
  const healthCheckUrl = `${HTTP_BASE}/health`;

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              VALSEA · Classroom Copilot
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Vietnamese – English Classroom Copilot</h1>
            <p className="max-w-2xl text-muted-foreground">
              Classroom speech (Vietnamese + English) → live transcript → summary, key terms, and quiz.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <SessionStatusBadge status={status} />
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>
                Session <span className="font-mono text-foreground">{sessionId.slice(0, 8)}</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={onNewSession}
              >
                <PlusCircle className="size-3.5" aria-hidden />
                New session
              </Button>
              <Button variant="link" className="h-auto gap-1 p-0 text-xs" asChild>
                <Link href={teacherPath}>
                  <Eye className="size-3" aria-hidden />
                  View session (instructor)
                </Link>
              </Button>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href={snapshotUrl} target="_blank" rel="noopener noreferrer">
                  JSON
                  <ExternalLink className="ml-1 size-3" aria-hidden />
                </Link>
              </Button>
            </p>
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div className="px-4 lg:px-6">
          <ClassroomErrorAlert
            message={errorMsg}
            healthCheckUrl={healthCheckUrl}
            onDismiss={() => setErrorMsg(null)}
          />
        </div>
      ) : null}

      <div className="@container/main isolate px-4 lg:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="flex min-h-0 min-w-0 flex-col gap-4">
            <div className="min-h-0 min-w-0 flex-1">
              <LiveTranscript ref={transcriptPanelRef} partial={partial} finals={finals} />
            </div>
            <div className="relative z-0 min-w-0 shrink-0 pb-1">
              <LiveAssistFeed entries={liveAssistEntries} enabled={liveAssistOn} />
            </div>
          </div>
          <div className="min-w-0">
            <LearningPanel
              output={learning}
              transcriptText={transcriptText}
              sessionId={sessionId}
              generating={status === "generating_outputs"}
            />
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-10 border-t border-border bg-background px-4 pb-8 pt-6 lg:px-6">
        <Card className="bg-card shadow-md">
          <CardContent className="flex flex-col gap-5 pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Live session
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <AudioControls
                    status={status}
                    hasTranscript={hasTranscript}
                    micHot={micActive}
                    onStart={onStart}
                    onStop={onStop}
                    onGenerate={onGenerate}
                    onConfused={() => setConfusionOpen(true)}
                  />
                  <div className="flex flex-col gap-2 sm:border-l sm:border-border sm:pl-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="auto-notes"
                        checked={autoNotesEnabled}
                        onCheckedChange={(v) => setAutoNotesEnabled(v === true)}
                      />
                      <Label
                        htmlFor="auto-notes"
                        className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
                      >
                        Auto notes every 60s while listening
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="live-assist"
                        checked={liveAssistOn}
                        onCheckedChange={(v) => onLiveAssistToggle(v === true)}
                      />
                      <Label
                        htmlFor="live-assist"
                        className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
                      >
                        Live assist during lesson (per segment, ~12s min gap)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-2 lg:items-end lg:border-l lg:border-border lg:pl-8">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground lg:text-right">
                  Demo and batch
                </p>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      demoLoading || status === "generating_outputs" || status === "connecting"
                    }
                    onClick={() => void onSeedDemoScript()}
                    className="gap-2"
                  >
                    <BookOpen className="size-4" aria-hidden />
                    {demoLoading ? "Syncing…" : "Insert demo script"}
                  </Button>
                  <UploadFallback
                    httpBase={HTTP_BASE}
                    sessionId={sessionId}
                    disabled={status === "generating_outputs" || demoLoading}
                    onTranscript={onUploadTranscript}
                    onError={(m) => setErrorMsg(m)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfusionDialog
        open={confusionOpen}
        onOpenChange={setConfusionOpen}
        onSubmit={(note) => void sendConfusionNote(note)}
      />
    </>
  );
}
