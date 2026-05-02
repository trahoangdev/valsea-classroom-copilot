"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { transcribeUpload } from "@/lib/classroom/api";
import { Button } from "@/components/ui/button";

type Props = {
  httpBase: string;
  sessionId: string;
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
};

export function UploadFallback({
  httpBase,
  sessionId,
  disabled,
  onTranscript,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.webm"
        className="hidden"
        disabled={disabled || uploading}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setLabel(file.name);
          setUploading(true);
          try {
            const res = await transcribeUpload(httpBase, file, sessionId);
            if (res.error) {
              onError(res.error);
              return;
            }
            if (res.text) onTranscript(res.text);
          } finally {
            setUploading(false);
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="gap-2 border-dashed"
      >
        <Upload className="size-4" aria-hidden />
        {uploading ? "Đang tải lên…" : "Tải file audio"}
      </Button>
      {label && !uploading ? (
        <span className="max-w-[200px] truncate text-xs text-muted-foreground" title={label}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
