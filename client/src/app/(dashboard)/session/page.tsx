"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchSessionList } from "@/lib/classroom/api";
import type { SessionListEntry } from "@/lib/classroom/types";

const HTTP_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

function formatTs(ms: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  const s = status.toLowerCase();
  if (s === "ended") return "secondary";
  if (s === "error") return "destructive";
  return "outline";
}

export default function SessionsManagerPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SessionListEntry[]>([]);
  const [persistence, setPersistence] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pasteId, setPasteId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchSessionList(HTTP_BASE, 200);
    setLoading(false);
    if (res.error) {
      setRows([]);
      setError(res.error);
      return;
    }
    setRows(res.sessions ?? []);
    setPersistence(res.persistence);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openById = () => {
    const id = pasteId.trim();
    if (!id) return;
    router.push(`/session/${encodeURIComponent(id)}`);
  };

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Giảng viên · gateway
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight">
            <ClipboardList className="size-7 shrink-0" aria-hidden />
            Quản lý phiên học
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Danh sách phiên đã tạo qua Classroom Copilot (bộ nhớ gateway và Supabase nếu bật). Mở chi
            tiết để xem transcript, ghi chú LLM và tín hiệu bối rối.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {persistence ? (
              <Badge variant="secondary" className="font-normal">
                Lưu trữ: {persistence === "supabase" ? "Supabase + RAM" : "Chỉ RAM (gateway)"}
              </Badge>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
              Làm mới
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`${HTTP_BASE}/api/sessions`} target="_blank" rel="noopener noreferrer">
                API JSON
                <ExternalLink className="ml-2 size-3" aria-hidden />
              </a>
            </Button>
          </div>
        </div>
        <Button variant="default" className="shrink-0 gap-2" asChild>
          <Link href="/classroom-copilot">
            <BookOpen className="size-4" aria-hidden />
            Classroom Copilot
          </Link>
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex gap-3 pt-6">
            <AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-medium text-destructive">Không tải được danh sách</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tất cả phiên</CardTitle>
          <CardDescription>
            {loading
              ? "Đang tải…"
              : rows.length === 0
                ? "Chưa có phiên — mở Copilot và bắt đầu nghe hoặc chèn kịch bản demo."
                : `${rows.length} phiên (sắp xếp theo cập nhật gần nhất)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:px-6 sm:pb-6">
          {!loading && rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Phiên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tạo</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="min-w-[200px] max-w-[320px]">Transcript</TableHead>
                  <TableHead className="text-center">Ghi chú</TableHead>
                  <TableHead className="text-center">Bối rối</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.sessionId}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <code className="text-xs font-medium text-foreground">
                          {r.sessionId.slice(0, 8)}…
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-fit px-2 text-xs text-muted-foreground"
                          onClick={() => void copyId(r.sessionId)}
                        >
                          Copy ID
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(r.status)} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatTs(r.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatTs(r.updatedAt)}</TableCell>
                    <TableCell className="max-w-[320px] whitespace-normal align-top text-muted-foreground">
                      {r.hasTranscript ? (
                        <span className="line-clamp-2 text-sm" title={r.transcriptPreview}>
                          {r.transcriptPreview || "_(có nội dung)_"}
                        </span>
                      ) : (
                        <span className="text-sm italic">Trống</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{r.learningCount}</TableCell>
                    <TableCell className="text-center tabular-nums">{r.confusionCount}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/session/${encodeURIComponent(r.sessionId)}`}>Chi tiết</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

          {!loading && rows.length === 0 && !error ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Bắt đầu từ{" "}
              <Link href="/classroom-copilot" className="font-medium text-primary underline-offset-4 hover:underline">
                Classroom Copilot
              </Link>
              .
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Mở phiên theo ID</CardTitle>
          <CardDescription>Dán UUID đầy đủ nếu bạn đã copy từ Copilot hoặc từ bảng trên.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="550e8400-e29b-41d4-a716-446655440000"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openById()}
            className="font-mono text-sm"
          />
          <Button type="button" onClick={openById} disabled={!pasteId.trim()}>
            Mở
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
