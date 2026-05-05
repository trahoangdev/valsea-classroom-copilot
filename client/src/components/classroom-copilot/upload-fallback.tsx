"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { transcribeUpload, type TranscribeUploadLanguage } from "@/lib/classroom/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Props = {
  httpBase: string;
  sessionId: string;
  disabled?: boolean;
  willReplace?: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
};

export function UploadFallback({
  httpBase,
  sessionId,
  disabled,
  willReplace,
  onTranscript,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLanguage, setUploadLanguage] = useState<TranscribeUploadLanguage>("vietnamese");

  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
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
          setUploadProgress(0);
          try {
            const res = await transcribeUpload(httpBase, file, sessionId, uploadLanguage, setUploadProgress);
            if (res.error) {
              onError(res.error);
              return;
            }
            if (res.text) onTranscript(res.text);
          } finally {
            setUploading(false);
            setUploadProgress(0);
          }
        }}
      />
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="upload-asr-lang" className="sr-only">
            Upload transcript language
          </Label>
          <select
            id="upload-asr-lang"
            className="h-9 min-w-[7.5rem] rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={uploadLanguage}
            disabled={disabled || uploading}
            onChange={(e) => setUploadLanguage(e.target.value as TranscribeUploadLanguage)}
            aria-label="Language hint for batch transcription"
          >
            <option value="vietnamese">Vietnamese</option>
            <option value="english">English</option>
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="size-4" aria-hidden />
          {uploading ? "Uploading…" : "Replace with audio"}
        </Button>
        {label && !uploading ? (
          <span className="max-w-[200px] truncate text-xs text-muted-foreground" title={label}>
            {label}
          </span>
        ) : null}
      </div>
      {uploading ? (
        <div className="w-full max-w-sm space-y-1 sm:text-right" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate" title={label ?? undefined}>
              {label ?? "Uploading audio"}
            </span>
            <span className="font-medium text-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} aria-label="Audio upload progress" />
        </div>
      ) : null}
      <p className="max-w-sm text-xs leading-snug text-muted-foreground sm:text-right">
        {/* Powered by VALSEA Batch. Upload audio replaces the current transcript
        {willReplace ? " and clears generated notes." : "."} */}
      </p>
    </div>
  );
}
