import { env } from "./env.js";

const BATCH_URL = "https://api.valsea.ai/v1/audio/transcriptions";

export async function transcribeAudioFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  if (!env.valseaApiKey) {
    throw new Error("VALSEA_API_KEY is not configured");
  }

  const form = new FormData();
  form.set("model", "valsea-transcribe");
  form.set("language", "vietnamese");
  const name = filename || "upload.wav";
  const copy = Buffer.from(buffer);
  const body =
    typeof File !== "undefined"
      ? new File([copy], name)
      : new Blob([copy]);
  form.set("file", body, name);

  const res = await fetch(BATCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.valseaApiKey}`,
    },
    body: form,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`VALSEA batch failed: ${res.status} ${t}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const text =
    (typeof data.text === "string" && data.text) ||
    (typeof data.transcript === "string" && data.transcript) ||
    extractOpenAiStyle(data);

  if (!text) {
    throw new Error("VALSEA batch: could not parse transcript from response");
  }
  return text;
}

function extractOpenAiStyle(data: Record<string, unknown>): string | undefined {
  const results = data.results;
  if (!Array.isArray(results) || results.length === 0) return undefined;
  const first = results[0] as Record<string, unknown>;
  if (typeof first.alternatives === "object" && first.alternatives !== null) {
    const alts = first.alternatives as unknown[];
    const a0 = alts[0] as Record<string, unknown> | undefined;
    if (a0 && typeof a0.transcript === "string") return a0.transcript;
  }
  return undefined;
}
