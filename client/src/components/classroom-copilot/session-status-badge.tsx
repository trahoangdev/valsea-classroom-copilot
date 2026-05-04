"use client";

import { Loader2 } from "lucide-react";
import type { SessionUiStatus } from "@/lib/classroom/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<SessionUiStatus, string> = {
  idle: "Ready",
  requesting_microphone: "Requesting mic…",
  connecting: "Connecting…",
  listening: "Listening",
  transcribing: "Transcribing…",
  generating_outputs: "Generating notes…",
  error: "Error",
  stopped: "Stopped",
};

export function SessionStatusBadge({ status }: { status: SessionUiStatus }) {
  const live = status === "listening" || status === "transcribing";
  const variant =
    status === "error" ? "destructive" : live ? "default" : "secondary";
  const showSpinner = status === "connecting" || status === "generating_outputs";

  return (
    <Badge variant={variant} className="gap-2 font-medium">
      {showSpinner ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <span
          className={cn(
            "size-2 rounded-full",
            live && "animate-pulse bg-primary-foreground/80",
            status === "error" && "bg-white",
            !live && status !== "error" && "bg-muted-foreground/60"
          )}
          aria-hidden
        />
      )}
      {LABELS[status] ?? status}
    </Badge>
  );
}
