"use client";

import type { ReactNode } from "react";
import { FileJson, FileText } from "lucide-react";
import type { LearningOutput } from "@/lib/classroom/types";
import {
  buildNotesJson,
  buildNotesMarkdown,
  downloadTextFile,
} from "@/lib/classroom/exportNotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyTermsList } from "@/components/classroom-copilot/key-terms-list";
import { QuizPanel } from "@/components/classroom-copilot/quiz-panel";

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type LearningPanelProps = {
  output: LearningOutput | null;
  transcriptText: string;
  sessionId: string;
  generating?: boolean;
};

function GeneratingSkeleton() {
  return (
    <div className="space-y-4 px-6 py-6" aria-busy="true" aria-label="Generating notes">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export function LearningPanel({ output, transcriptText, sessionId, generating }: LearningPanelProps) {
  const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const baseName = `classroom-notes-${sessionId.slice(0, 8)}-${stamp()}`;

  const exportMd = () => {
    if (!output) return;
    const md = buildNotesMarkdown(transcriptText, output);
    downloadTextFile(`${baseName}.md`, md, "text/markdown;charset=utf-8");
  };

  const exportJson = () => {
    if (!output) return;
    const json = buildNotesJson({
      sessionId,
      transcript: transcriptText,
      output,
      exportedAt: new Date().toISOString(),
    });
    downloadTextFile(`${baseName}.json`, json, "application/json;charset=utf-8");
  };

  return (
    <Card className="flex h-full min-h-[420px] flex-col gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <CardTitle className="text-lg">Learning notes</CardTitle>
          <CardDescription>
            Summary (VI + EN), key terms, and quiz from the LLM (via gateway)
          </CardDescription>
        </div>
        {output ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={exportMd} className="gap-1.5">
              <FileText className="size-3.5" aria-hidden />
              Download .md
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportJson} className="gap-1.5">
              <FileJson className="size-3.5" aria-hidden />
              Download .json
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        {generating ? (
          <GeneratingSkeleton />
        ) : !output ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl border bg-muted/50">
              <FileText className="size-7 text-muted-foreground" aria-hidden />
            </div>
            <div className="max-w-sm space-y-2">
              <p className="font-semibold text-foreground">No notes yet</p>
              <p className="text-sm text-muted-foreground">
                Once you have a transcript, click <span className="font-medium text-foreground">Generate notes</span>{" "}
                (or use the demo script).
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[min(60vh,520px)] px-6 py-4">
            <div className="space-y-4 pr-3">
              <SectionCard title="Summary (Vietnamese)">
                <p className="text-sm leading-relaxed text-foreground">{output.shortSummaryVi}</p>
              </SectionCard>

              {output.englishRecapEn?.trim() ? (
                <SectionCard
                  title="Lecture recap (English)"
                  description="Same lecture content — bilingual support / review"
                >
                  <p className="text-sm leading-relaxed text-foreground">{output.englishRecapEn}</p>
                </SectionCard>
              ) : null}

              {output.simpleExplanationVi ? (
                <SectionCard title="Simple explanation">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {output.simpleExplanationVi}
                  </p>
                </SectionCard>
              ) : null}

              <KeyTermsList terms={output.keyTerms} />
              <QuizPanel questions={output.quizQuestions} />

              {output.possibleConfusingPoints.length ? (
                <SectionCard title="Possibly confusing">
                  <ul className="space-y-2">
                    {output.possibleConfusingPoints.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          !
                        </span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ) : null}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
