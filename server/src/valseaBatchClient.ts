import { env } from "./env.js";

const BATCH_URL = "https://api.valsea.ai/v1/audio/transcriptions";

/** VALSEA batch `language` hint; wrong language biases script (e.g. EN audio + `vietnamese` → garbled VI). */
export type ValseaBatchLanguage = "vietnamese" | "english";

export type ValseaBatchResult = {
  text: string;
  raw: Record<string, unknown>;
};

export async function transcribeAudioFile(
  buffer: Buffer,
  filename: string,
  language: ValseaBatchLanguage = "vietnamese"
): Promise<ValseaBatchResult> {
  if (!env.valseaApiKey) {
    throw new Error("VALSEA_API_KEY is not configured");
  }

  const form = new FormData();
  form.set("model", "valsea-transcribe");
  form.set("language", language);
  form.set("response_format", "verbose_json");
  form.set("enable_correction", "true");
  form.set("enable_tags", "true");
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
  return { text, raw: data };
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
