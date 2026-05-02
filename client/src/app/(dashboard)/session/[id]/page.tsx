"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { fetchSessionSnapshot } from "@/lib/classroom/api";
import type { GatewaySessionSnapshot, LearningOutput } from "@/lib/classroom/types";

const HTTP_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

function formatTime(ms: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString("vi-VN");
  } catch {
    return String(ms);
  }
}

function LearningOutputCard({ output, index }: { output: LearningOutput; index: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ghi chú #{index + 1}</CardTitle>
        <CardDescription>Tóm tắt & thuật ngữ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">Tóm tắt</p>
          <p className="mt-1 leading-relaxed text-foreground">{output.shortSummaryVi || "—"}</p>
        </div>
        {output.simpleExplanationVi?.trim() ? (
          <div>
            <p className="font-medium text-muted-foreground">Giải thích đơn giản</p>
            <p className="mt-1 leading-relaxed text-foreground">{output.simpleExplanationVi}</p>
          </div>
        ) : null}
        {output.keyTerms?.length ? (
          <div>
            <p className="font-medium text-muted-foreground">Thuật ngữ ({output.keyTerms.length})</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {output.keyTerms.map((t) => (
                <li key={t.term}>
                  <span className="font-medium text-foreground">{t.term}</span>
                  {t.definitionVi ? ` — ${t.definitionVi}` : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {output.quizQuestions?.length ? (
          <div>
            <p className="font-medium text-muted-foreground">Quiz ({output.quizQuestions.length})</p>
            <ol className="mt-2 list-decimal space-y-3 pl-5">
              {output.quizQuestions.map((q, qi) => (
                <li key={qi} className="text-foreground">
                  <p className="font-medium">{q.question}</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                    {q.choices.map((c, ci) => (
                      <li key={ci}>{c}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đáp án: <span className="font-medium text-foreground">{q.answer}</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {output.possibleConfusingPoints?.length ? (
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">Có thể gây nhầm lẫn</p>
            <ul className="mt-1 list-inside list-disc">
              {output.possibleConfusingPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = typeof params.id === "string" ? params.id : "";

  const [data, setData] = useState<GatewaySessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    const res = await fetchSessionSnapshot(HTTP_BASE, sessionId);
    setLoading(false);
    if (res.error) {
      setData(null);
      setError(res.error);
      return;
    }
    setData(res.data ?? null);
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Giảng viên · quản lý phiên
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Chi tiết phiên</h1>
          <p className="mt-1 break-all font-mono text-sm text-muted-foreground">{sessionId || "(thiếu id)"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`${HTTP_BASE}/api/session/${encodeURIComponent(sessionId)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              JSON
              <ExternalLink className="ml-2 size-3" aria-hidden />
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/session">Phiên khác</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/classroom-copilot">Copilot</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Đang tải dữ liệu từ gateway…
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex gap-3 pt-6">
            <AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-medium text-destructive">Không lấy được phiên</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Kiểm tra gateway đang chạy, <span className="font-mono">NEXT_PUBLIC_GATEWAY_URL</span>, và đã có
                hoạt động / lưu Supabase cho session này.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {data && !loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Transcript (gateway)</CardTitle>
                <CardDescription>
                  Cập nhật lần cuối: {formatTime(data.updatedAt)}
                </CardDescription>
              </div>
              <Badge variant="secondary">{data.transcript?.trim() ? "Có nội dung" : "Trống"}</Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[min(40vh,360px)] rounded-md border p-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
                  {data.transcript?.trim() || "_(Chưa có transcript)_"}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tín hiệu bối rối</CardTitle>
              <CardDescription>{data.confusionEvents.length} sự kiện</CardDescription>
            </CardHeader>
            <CardContent>
              {data.confusionEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.confusionEvents.map((ev, i) => (
                    <li key={`${ev.at}-${i}`} className="rounded-md border bg-muted/30 px-3 py-2">
                      <span className="text-xs text-muted-foreground">{formatTime(ev.at)}</span>
                      <p className="mt-0.5">{ev.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ghi chú học tập</CardTitle>
              <CardDescription>{data.learningOutputs.length} lần tạo</CardDescription>
            </CardHeader>
            <CardContent>
              {data.learningOutputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có — sinh viên có thể bấm Tạo ghi chú trên Copilot.</p>
              ) : (
                <div className="space-y-4">
                  {data.learningOutputs.map((out, i) => (
                    <LearningOutputCard key={i} output={out} index={i} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
