import { env } from "./env.js";
import type { ValseaLearningArtifacts, ValseaSemanticTag } from "./types.js";

const VALSEA_API_BASE = "https://api.valsea.ai";
const MAX_TEXT_CHARS = 12_000;
const MAX_CONTEXT_CHARS = 4_000;

type ValseaCallResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

function trimForApi(text: string): string {
  return text.trim().slice(0, MAX_TEXT_CHARS);
}

function trimForContext(text: string): string {
  return text.trim().slice(0, MAX_CONTEXT_CHARS);
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function postValseaJson(
  path: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (!env.valseaApiKey) {
    throw new Error("VALSEA_API_KEY is not configured");
  }

  const res = await fetch(`${VALSEA_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.valseaApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`VALSEA ${path} failed: ${res.status} ${t}`);
  }

  const data = (await res.json()) as unknown;
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`VALSEA ${path} returned invalid JSON`);
  }
  return data as Record<string, unknown>;
}

async function safeCall(
  label: string,
  fn: () => Promise<Record<string, unknown>>
): Promise<ValseaCallResult> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: `${label}: ${errorMessage(e)}` };
  }
}

function stringField(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return trimForContext(value);
  }
  return "";
}

function compactObject(data: Record<string, unknown>): string {
  try {
    return trimForContext(JSON.stringify(data));
  } catch {
    return "";
  }
}

function textOrObject(data: Record<string, unknown>, keys: string[]): string {
  const direct = stringField(data, keys);
  if (direct) return direct;
  return compactObject(data);
}

function normalizeSemanticTags(raw: unknown): ValseaSemanticTag[] {
  if (!Array.isArray(raw)) return [];
  const out: ValseaSemanticTag[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const tag = typeof o.tag === "string" ? o.tag : "";
    const phrase = typeof o.phrase === "string" ? o.phrase : "";
    const meaning = typeof o.meaning === "string" ? o.meaning : "";
    if (tag || phrase || meaning) out.push({ tag, phrase, meaning });
  }
  return out.slice(0, 20);
}

export async function buildValseaLearningContext(
  transcript: string
): Promise<ValseaLearningArtifacts> {
  const text = trimForApi(transcript);
  const empty: ValseaLearningArtifacts = {
    enabled: false,
    semanticTags: [],
    annotatedText: "",
    clarifiedText: "",
    formattedNotes: "",
    errors: [],
  };

  if (!text) return empty;
  if (!env.valseaApiKey) {
    return { ...empty, errors: ["VALSEA_API_KEY is not configured"] };
  }

  const [annotation, clarification] = await Promise.all([
    safeCall("annotations", () =>
      postValseaJson("/v1/annotations", {
        model: "valsea-annotate",
        text,
        language: "vietnamese",
        response_format: "verbose_json",
        enable_correction: true,
        enable_tags: true,
      })
    ),
    safeCall("clarifications", () =>
      postValseaJson("/v1/clarifications", {
        model: "valsea-clarify",
        text,
        language: "vietnamese",
        response_format: "verbose_json",
      })
    ),
  ]);

  const errors: string[] = [];
  let semanticTags: ValseaSemanticTag[] = [];
  let annotatedText = "";
  let clarifiedText = "";

  if (annotation.ok) {
    semanticTags = normalizeSemanticTags(annotation.data.semantic_tags);
    annotatedText = stringField(annotation.data, ["annotated_text", "annotatedText", "text"]);
  } else {
    errors.push(annotation.error);
  }

  if (clarification.ok) {
    clarifiedText = stringField(clarification.data, [
      "clarified_text",
      "clarifiedText",
      "text",
    ]);
  } else {
    errors.push(clarification.error);
  }

  const formatting = await safeCall("formatting", () =>
    postValseaJson("/v1/formatting", {
      model: "valsea-format",
      transcript: text,
      response_format: "verbose_json",
      output_type: "meeting_minutes",
      semantic_tags: semanticTags,
    })
  );

  let formattedNotes = "";
  if (formatting.ok) {
    formattedNotes = textOrObject(formatting.data, [
      "formatted_text",
      "formattedText",
      "output",
      "result",
      "text",
      "content",
      "notes",
    ]);
  } else {
    errors.push(formatting.error);
  }

  return {
    enabled: annotation.ok || clarification.ok || formatting.ok,
    semanticTags,
    annotatedText,
    clarifiedText,
    formattedNotes,
    errors,
  };
}
