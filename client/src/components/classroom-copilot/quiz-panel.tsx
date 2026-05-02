"use client";

import { useMemo, useState } from "react";
import type { QuizQuestion } from "@/lib/classroom/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QuizPanel({ questions }: { questions: QuizQuestion[] }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const hasQuiz = useMemo(() => questions.some((q) => q.question.trim()), [questions]);

  if (!hasQuiz) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quiz nhanh</CardTitle>
        <CardDescription>Ôn lại nội dung từ transcript</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-4">
          {questions.map((q, idx) => (
            <li key={idx} className="rounded-lg border bg-muted/30 p-4">
              <p className="flex gap-2 text-sm font-medium leading-snug text-foreground">
                <span className="shrink-0 text-primary">{idx + 1}.</span>
                {q.question}
              </p>
              <ul className="mt-3 space-y-1 pl-5">
                {q.choices.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="w-4 shrink-0 font-medium text-foreground/70">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealed((r) => ({ ...r, [idx]: !r[idx] }))}
                  className={cn(revealed[idx] && "border-primary/40 bg-primary/5")}
                >
                  {revealed[idx] ? "Ẩn đáp án" : "Xem đáp án"}
                </Button>
                {revealed[idx] ? (
                  <span className="text-sm font-medium text-primary">{q.answer}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
