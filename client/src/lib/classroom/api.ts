import type { GatewaySessionSnapshot, SessionListEntry } from "@/lib/classroom/types";

export async function fetchSessionList(
  httpBase: string,
  limit = 100
): Promise<{ sessions?: SessionListEntry[]; persistence?: string; error?: string }> {
  const base = httpBase.replace(/\/$/, "");
  const res = await fetch(`${base}/api/sessions?limit=${encodeURIComponent(String(limit))}`);
  const json = (await res.json()) as {
    sessions?: SessionListEntry[];
    persistence?: string;
    error?: string;
  };
  if (!res.ok) {
    return { error: json.error ?? `HTTP ${res.status}` };
  }
  return {
    sessions: Array.isArray(json.sessions) ? json.sessions : [],
    persistence: json.persistence,
  };
}

export async function fetchSessionSnapshot(
  httpBase: string,
  sessionId: string
): Promise<{ data?: GatewaySessionSnapshot; error?: string }> {
  const base = httpBase.replace(/\/$/, "");
  const res = await fetch(`${base}/api/session/${encodeURIComponent(sessionId)}`);
  const json = (await res.json()) as Partial<GatewaySessionSnapshot> & { error?: string };
  if (!res.ok) {
    return { error: json.error ?? `HTTP ${res.status}` };
  }
  if (typeof json.sessionId !== "string") {
    return { error: "Invalid gateway response" };
  }
  return {
    data: {
      sessionId: json.sessionId,
      transcript: json.transcript ?? "",
      learningOutputs: json.learningOutputs ?? [],
      confusionEvents: json.confusionEvents ?? [],
      updatedAt: typeof json.updatedAt === "number" ? json.updatedAt : 0,
    },
  };
}

export async function postConfusion(
  httpBase: string,
  sessionId: string,
  note: string
): Promise<{ ok?: boolean; error?: string }> {
  const url = `${httpBase.replace(/\/$/, "")}/api/confusion`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, note }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) {
    return { error: data.error ?? `HTTP ${res.status}` };
  }
  return { ok: data.ok ?? true };
}

/** Seed transcript on gateway (demo / offline) — same persistence as batch transcribe. */
export async function postDemoTranscript(
  httpBase: string,
  sessionId: string,
  text: string
): Promise<{ ok?: boolean; error?: string }> {
  const url = `${httpBase.replace(/\/$/, "")}/api/demo-transcript`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, text }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) {
    return { error: data.error ?? `HTTP ${res.status}` };
  }
  return { ok: data.ok ?? true };
}

export async function transcribeUpload(
  httpBase: string,
  file: File,
  sessionId: string
): Promise<{ text?: string; error?: string }> {
  const form = new FormData();
  form.set("file", file);
  const url = `${httpBase.replace(/\/$/, "")}/api/transcribe?sessionId=${encodeURIComponent(sessionId)}`;
  const res = await fetch(url, { method: "POST", body: form });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) {
    return { error: data.error ?? `HTTP ${res.status}` };
  }
  return { text: data.text };
}
