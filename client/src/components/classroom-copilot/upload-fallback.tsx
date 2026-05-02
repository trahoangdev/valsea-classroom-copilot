"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { transcribeUpload, type TranscribeUploadLanguage } from "@/lib/classroom/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  const [uploadLanguage, setUploadLanguage] = useState<TranscribeUploadLanguage>("vietnamese");

  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
            const res = await transcribeUpload(httpBase, file, sessionId, uploadLanguage);
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
        {uploading ? "Uploading…" : "Upload audio file"}
      </Button>
      {label && !uploading ? (
        <span className="max-w-[200px] truncate text-xs text-muted-foreground" title={label}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
