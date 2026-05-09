"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type HeroMockPreviewProps = {
  transcriptLabel: string;
  listeningLabel: string;
  line1: string;
  line2: string;
  assistantLabel: string;
  assistantBadge: string;
  bullets: [string, string, string];
};

export function HeroMockPreview({
  transcriptLabel,
  listeningLabel,
  line1,
  line2,
  assistantLabel,
  assistantBadge,
  bullets,
}: HeroMockPreviewProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [line1Len, setLine1Len] = useState(0);
  const [line2Len, setLine2Len] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setLine1Len(line1.length);
      setLine2Len(line2.length);
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const runCycle = () => {
      const typeL1 = (i: number) => {
        if (cancelled) return;
        if (i <= line1.length) {
          setLine1Len(i);
          timeout = setTimeout(() => typeL1(i + 1), i === 0 ? 450 : 26);
        } else {
          timeout = setTimeout(() => typeL2(0), 280);
        }
      };

      const typeL2 = (i: number) => {
        if (cancelled) return;
        if (i <= line2.length) {
          setLine2Len(i);
          timeout = setTimeout(() => typeL2(i + 1), 20);
        } else {
          timeout = setTimeout(() => {
            if (cancelled) return;
            setLine1Len(0);
            setLine2Len(0);
            setTick((x) => x + 1);
            timeout = setTimeout(() => typeL1(0), 500);
          }, 3200);
        }
      };

      typeL1(0);
    };

    runCycle();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [line1, line2, line1.length, line2.length, reduceMotion]);

  const line1Shown = line1.slice(0, line1Len);
  const line2Shown = line2.slice(0, line2Len);
  const line2Complete = line2Len >= line2.length && line1Len >= line1.length;
  const showCaretL1 = !reduceMotion && line1Len < line1.length;
  const showCaretL2 = !reduceMotion && line1Len >= line1.length && line2Len < line2.length;

  return (
    <div className="relative group/mock">
      <div className="absolute top-2 lg:-top-6 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-64 bg-primary/40 rounded-full blur-3xl motion-reduce:opacity-80" />

      <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden transition-[transform,box-shadow] duration-300 ease-out motion-safe:group-hover/mock:scale-[1.008] motion-safe:group-hover/mock:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.18)] dark:motion-safe:group-hover/mock:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]">
        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border min-h-[280px] md:min-h-[320px]">
          <div className="p-6 text-left space-y-4 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {transcriptLabel}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 motion-safe:animate-pulse" />
                </span>
                {listeningLabel}
              </span>
            </div>
            <div className="space-y-2 font-mono text-sm leading-relaxed min-h-[4.5rem]">
              <p className="text-foreground/90 whitespace-pre-wrap break-words">
                {line1Shown}
                {showCaretL1 ? (
                  <span className="hero-mock-caret inline-block w-0.5 h-4 align-[-0.15em] bg-primary ml-0.5" />
                ) : null}
              </p>
              <p className="text-muted-foreground border-l-2 border-primary/40 pl-3 flex gap-1.5 items-start min-h-[1.5rem]">
                {line1Len >= line1.length ? (
                  <span
                    className="hero-mock-caret text-primary font-light shrink-0 leading-none mt-0.5"
                    aria-hidden
                  >
                    |
                  </span>
                ) : (
                  <span className="w-2 shrink-0" aria-hidden />
                )}
                <span className="flex-1 whitespace-pre-wrap break-words">
                  {line2Shown}
                  {showCaretL2 ? (
                    <span className="hero-mock-caret inline-block w-px h-4 align-[-0.15em] bg-muted-foreground/80 ml-0.5" />
                  ) : null}
                </span>
              </p>
            </div>
          </div>

          <div className="p-6 text-left space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {assistantLabel}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/mock:scale-[1.03]"
              >
                {assistantBadge}
              </Badge>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {bullets.map((text, i) => (
                <li
                  key={`${tick}-${i}`}
                  className={`flex gap-2 hero-mock-bullet ${
                    line2Complete ? "hero-mock-bullet-in" : "opacity-0"
                  }`}
                  style={{ ["--hero-bullet-delay" as string]: `${i * 140}ms` }}
                >
                  <span className="text-primary shrink-0">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      </div>
    </div>
  );
}
