"use client";

import { forwardRef, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { highlightEnglishTokens } from "@/lib/classroom/highlightEnglishTokens";

type Props = {
  partial: string;
  finals: { id: string; text: string }[];
};

/** Scroll inside the transcript ScrollArea only — avoids scrolling the page down onto Live assist. */
function scrollTranscriptViewportToBottom(anchor: HTMLElement | null): void {
  if (!anchor) return;
  const viewport = anchor.closest("[data-slot='scroll-area-viewport']");
  if (viewport instanceof HTMLElement) {
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    return;
  }
  anchor.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export const LiveTranscript = forwardRef<HTMLDivElement, Props>(function LiveTranscript(
  { partial, finals },
  ref
) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollTranscriptViewportToBottom(bottomRef.current);
  }, [partial, finals.length]);

  const empty = finals.length === 0 && !partial;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="min-h-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
    >
      <Card className="flex h-full min-h-[420px] flex-col gap-0 py-0">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-lg">Live transcript</CardTitle>
        <CardDescription>
          Stream from VALSEA Realtime ASR via gateway (PCM16 16kHz)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <ScrollArea className="h-[min(60vh,520px)] px-6 py-4">
          {empty ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-xl border bg-muted/50">
                <Mic className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <div className="max-w-sm space-y-2">
                <p className="font-semibold text-foreground">No audio yet</p>
                <p className="text-sm text-muted-foreground">
                  Click <span className="font-medium text-foreground">Start listening</span> to capture (VALSEA
                  realtime), upload audio, or <span className="font-medium text-foreground">Insert demo script</span>{" "}
                  to try <span className="font-medium text-foreground">Generate notes</span> without a mic.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pr-3">
              {finals.map((f, i) => (
                <article
                  key={f.id}
                  className="group relative border-l-2 border-primary/40 pl-4 transition-colors hover:border-primary"
                >
                  <span className="absolute -left-2.5 top-1 flex size-5 items-center justify-center rounded-full border bg-background text-[10px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">
                    {highlightEnglishTokens(f.text)}
                  </p>
                </article>
              ))}
              {partial ? (
                <div className="border-l-2 border-accent pl-4">
                  <p className="text-sm italic leading-relaxed text-muted-foreground">
                    {highlightEnglishTokens(partial)}
                    <span
                      className="ml-1 inline-block h-4 w-px animate-pulse bg-primary"
                      aria-hidden
                    />
                  </p>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
    </div>
  );
});

LiveTranscript.displayName = "LiveTranscript";
