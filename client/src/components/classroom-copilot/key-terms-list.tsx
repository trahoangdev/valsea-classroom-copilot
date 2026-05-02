"use client";

import type { KeyTerm } from "@/lib/classroom/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function KeyTermsList({ terms }: { terms: KeyTerm[] }) {
  if (!terms.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thuật ngữ chính</CardTitle>
        <CardDescription>Từ tiếng Anh trong bài, giải thích tiếng Việt</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {terms.map((t) => (
            <div
              key={t.term}
              className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-primary">{t.term}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.definitionVi}</p>
              {t.whyItMatters ? (
                <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-foreground/80">
                  <span className="font-medium text-muted-foreground">Vì sao: </span>
                  {t.whyItMatters}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
