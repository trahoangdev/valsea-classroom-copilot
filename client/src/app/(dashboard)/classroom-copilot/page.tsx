"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ExternalLink, Eye } from "lucide-react";
import { AudioControls } from "@/components/classroom-copilot/audio-controls";
import { ClassroomErrorAlert } from "@/components/classroom-copilot/classroom-error-alert";
import { LiveTranscript } from "@/components/classroom-copilot/live-transcript";
import { LearningPanel } from "@/components/classroom-copilot/learning-panel";
import { SessionStatusBadge } from "@/components/classroom-copilot/session-status-badge";
import { UploadFallback } from "@/components/classroom-copilot/upload-fallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { startAudioCapture } from "@/lib/classroom/audio/capture";
import { postConfusion, postDemoTranscript } from "@/lib/classroom/api";
import { DEMO_SCRIPT_VI } from "@/lib/classroom/demoScript";
import type { BackendToFrontend, LearningOutput, SessionUiStatus } from "@/lib/classroom/types";
import { connectGateway, sendJson } from "@/lib/classroom/websocket";

const HTTP_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") ?? "http://localhost:3001";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

export default function ClassroomCopilotPage() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<SessionUiStatus>("idle");
  const [partial, setPartial] = useState("");
  const [finals, setFinals] = useState<{ id: string; text: string }[]>([]);
  const [learning, setLearning] = useState<LearningOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<SessionUiStatus>("idle");
  const captureRef = useRef<{ stop: () => void } | null>(null);
  const micStartedRef = useRef(false);
  const captureCancelledRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const hasTranscript = finals.length > 0 || partial.trim().length > 0;

  const transcriptText = useMemo(() => {
    const parts = finals.map((f) => f.text.trim()).filter(Boolean);
    const tail = partial.trim();
    if (tail) parts.push(tail);
    return parts.join("\n\n");
  }, [finals, partial]);

  const appendFinal = useCallback((chunk: { id: string; text: string }) => {
    setFinals((prev) => {
      if (prev.some((p) => p.id === chunk.id)) return prev;
      return [...prev, chunk];
    });
  }, []);

  const handleServerMessage = useCallback(
    (msg: BackendToFrontend) => {
      if (msg.type === "session.status") {
        setStatus(msg.status);
        return;
      }
      if (msg.type === "transcript.partial") {
        setPartial(msg.text);
        return;
      }
      if (msg.type === "transcript.final") {
        setPartial("");
        appendFinal({ id: msg.chunk.id, text: msg.chunk.text });
        return;
      }
      if (msg.type === "learning.output") {
        setLearning(msg.output);
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
    setStatus("listening");
  }, [sessionId]);

  const stopMic = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    micStartedRef.current = false;
  }, []);

  const onStart = useCallback(() => {
    setErrorMsg(null);
    setLearning(null);
    captureCancelledRef.current = false;
    micStartedRef.current = false;
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
        setErrorMsg("Không mở được WebSocket tới gateway — kiểm tra URL và firewall.");
        setStatus("error");
      },
      onClose: (ev) => {
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        stopMic();
        const s = statusRef.current;
        if (s === "stopped" || s === "idle" || s === "error") return;
        const extra = ev.wasClean ? "" : ` (đóng mã ${ev.code})`;
        setErrorMsg(
          `Mất kết nối realtime tới gateway${extra}. Thử chạy lại hoặc dùng tải audio / kịch bản demo + Tạo ghi chú qua HTTP.`
        );
        setStatus("error");
      },
      onMessage: (msg) => {
        handleServerMessage(msg);
        if (msg.type === "session.status" && msg.status === "listening") void startMic();
      },
    });
    wsRef.current = ws;
    setStatus("connecting");
  }, [handleServerMessage, sessionId, startMic, stopMic]);

  const onStop = useCallback(() => {
    captureCancelledRef.current = true;
    stopMic();
    sendJson(wsRef.current, { type: "session.stop", sessionId });
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

  const onConfused = useCallback(async () => {
    const note = "Confused during demo";
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendJson(ws, { type: "confusion.mark", sessionId, note });
      return;
    }
    try {
      const r = await postConfusion(HTTP_BASE, sessionId, note);
      if (r.error) setErrorMsg(r.error);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Không gửi được tín hiệu bối rối");
    }
  }, [sessionId]);

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
      setErrorMsg(e instanceof Error ? e.message : "Không gửi được kịch bản demo");
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
            <h1 className="text-2xl font-bold tracking-tight">Vietnamese–English Classroom Copilot</h1>
            <p className="max-w-2xl text-muted-foreground">
              Giọng nói lớp học (Việt + Anh) → transcript trực tiếp → tóm tắt, thuật ngữ, quiz.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <SessionStatusBadge status={status} />
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>
                Session <span className="font-mono text-foreground">{sessionId.slice(0, 8)}</span>
              </span>
              <Button variant="link" className="h-auto gap-1 p-0 text-xs" asChild>
                <Link href={teacherPath}>
                  <Eye className="size-3" aria-hidden />
                  Xem phiên (giảng viên)
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

      <div className="@container/main px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <LiveTranscript partial={partial} finals={finals} />
          <LearningPanel
            output={learning}
            transcriptText={transcriptText}
            sessionId={sessionId}
            generating={status === "generating_outputs"}
          />
        </div>
      </div>

      <div className="px-4 pb-6 lg:px-6">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:flex-wrap md:items-center md:justify-between">
            <AudioControls
              status={status}
              hasTranscript={hasTranscript}
              onStart={onStart}
              onStop={onStop}
              onGenerate={onGenerate}
              onConfused={onConfused}
            />
            <div className="flex flex-wrap items-center gap-2">
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
                {demoLoading ? "Đang đồng bộ…" : "Chèn kịch bản demo (§17)"}
              </Button>
              <UploadFallback
                httpBase={HTTP_BASE}
                sessionId={sessionId}
                disabled={status === "generating_outputs" || demoLoading}
                onTranscript={onUploadTranscript}
                onError={(m) => setErrorMsg(m)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
