"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { gatewayErrorHint } from "@/lib/classroom/errorHints";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  message: string;
  healthCheckUrl: string;
  onDismiss: () => void;
};

export function ClassroomErrorAlert({ message, healthCheckUrl, onDismiss }: Props) {
  const hint = gatewayErrorHint(message);

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="space-y-3 pt-6">
        <div className="flex gap-3">
          <AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-destructive">Có lỗi xảy ra</p>
            <p className="text-sm text-foreground">{message}</p>
            {hint ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Gợi ý:</span> {hint}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href={healthCheckUrl} target="_blank" rel="noopener noreferrer">
                  Kiểm tra /health trên gateway
                </Link>
              </Button>
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
            Đóng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
