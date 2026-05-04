"use client";

import { Loader2, Mic, Square, Sparkles, HelpCircle } from "lucide-react";
import type { SessionUiStatus } from "@/lib/classroom/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  status: SessionUiStatus;
  hasTranscript: boolean;
  /** True while mic capture is running (e.g. VALSEA reconnecting but user can still stop). */
  micHot?: boolean;
  onStart: () => void;
  onStop: () => void;
  onGenerate: () => void;
  onConfused: () => void;
};

export function AudioControls({
  status,
  hasTranscript,
  micHot = false,
  onStart,
  onStop,
  onGenerate,
  onConfused,
}: Props) {
  const listening =
    status === "listening" ||
    status === "transcribing" ||
    status === "requesting_microphone";
  const busyConnect = status === "connecting" || status === "generating_outputs";
  const isConnecting = status === "connecting";
  const isGenerating = status === "generating_outputs";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="default"
        disabled={listening || busyConnect}
        onClick={onStart}
        className="gap-2"
      >
        {isConnecting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Mic className="size-4" aria-hidden />
        )}
        {isConnecting ? "Connecting…" : "Start listening"}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!listening && !micHot}
        onClick={onStop}
        className="gap-2"
      >
        <Square className="size-3.5 fill-current" aria-hidden />
        Stop
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!hasTranscript || busyConnect}
        onClick={onGenerate}
        className={cn("gap-2", hasTranscript && !busyConnect && "border-primary/30")}
      >
        {isGenerating ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        {isGenerating ? "Generating notes…" : "Generate notes"}
      </Button>

      <Button type="button" variant="ghost" onClick={onConfused} className="gap-2 text-muted-foreground">
        <HelpCircle className="size-4" aria-hidden />
        I&apos;m confused
      </Button>
    </div>
  );
}
