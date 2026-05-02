"use client";

import { Languages, Sparkles } from "lucide-react";
import type { LiveChunkAssist } from "@/lib/classroom/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export type LiveAssistEntry = {
  chunkId: string;
  chunkText: string;
  payload: LiveChunkAssist;
};

type Props = {
  entries: LiveAssistEntry[];
  enabled: boolean;
};

export function LiveAssistFeed({ entries, enabled }: Props) {
  return (
    <Card className="bg-card flex min-h-0 shrink-0 flex-col gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="shrink-0 border-b px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/8">
            <Languages className="size-5 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg">Live assist</CardTitle>
            <CardDescription>
              Summary, short explanation (VI), and English line per transcript segment — updates while you listen
              {enabled ? "" : " (off)"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 overflow-hidden p-0">
        {!enabled ? (
          <p className="px-6 py-8 pb-10 text-center text-sm leading-relaxed text-muted-foreground">
            Turn on <span className="font-medium text-foreground">Live assist during lesson</span> below, then start
            listening. Segments are sent at most about every 12s to keep the demo stable.
          </p>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 pb-12 text-center">
            <Sparkles className="size-8 shrink-0 text-muted-foreground/70" aria-hidden />
            <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
              Waiting for finalized transcript chunks from VALSEA.
              <span className="mt-2 block">
                Speak or use the demo script — explanations appear here after each segment.
              </span>
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[min(32vh,320px)] w-full px-6 py-4">
            <ul className="space-y-4 pr-3 pb-1">
              {entries.map((e) => (
                <li
                  key={e.chunkId}
                  className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm shadow-sm break-words"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Segment</p>
                  <p className="mt-1 break-words leading-relaxed text-foreground/90">{e.chunkText}</p>
                  <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                    <p>
                      <span className="font-medium text-foreground">Summary: </span>
                      <span className="text-muted-foreground">{e.payload.microSummaryVi}</span>
                    </p>
                    {e.payload.explainVi ? (
                      <p>
                        <span className="font-medium text-foreground">Explain: </span>
                        <span className="text-muted-foreground">{e.payload.explainVi}</span>
                      </p>
                    ) : null}
                    {e.payload.lineEn ? (
                      <p className="text-foreground/95">
                        <span className="font-medium">EN: </span>
                        {e.payload.lineEn}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
