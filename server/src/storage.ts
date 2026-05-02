import type { LearningOutput } from "./types.js";

export type ConfusionEvent = { note: string; at: number };

export type StoredSession = {
  sessionId: string;
  transcript: string;
  learningOutputs: LearningOutput[];
  confusionEvents: ConfusionEvent[];
  updatedAt: number;
};

/** In-memory hot cache; Supabase backs durability via HybridSessionStore. */
export class MemorySessionStore {
  private sessions = new Map<string, StoredSession>();

  /** Full replace (batch transcribe, post-stop snapshot). */
  replaceTranscript(sessionId: string, transcript: string): void {
    const prev = this.sessions.get(sessionId);
    const t = transcript.trim();
    this.sessions.set(sessionId, {
      sessionId,
      transcript: t,
      learningOutputs: prev?.learningOutputs ?? [],
      confusionEvents: prev?.confusionEvents ?? [],
      updatedAt: Date.now(),
    });
  }

  /** Append one ASR final segment (join with blank line). */
  appendTranscriptChunk(sessionId: string, chunkText: string): void {
    const part = chunkText.trim();
    if (!part) return;
    const prev = this.sessions.get(sessionId);
    const base = prev?.transcript?.trim() ?? "";
    const transcript = base ? `${base}\n\n${part}` : part;
    this.sessions.set(sessionId, {
      sessionId,
      transcript,
      learningOutputs: prev?.learningOutputs ?? [],
      confusionEvents: prev?.confusionEvents ?? [],
      updatedAt: Date.now(),
    });
  }

  appendLearning(sessionId: string, output: LearningOutput): void {
    const prev = this.sessions.get(sessionId);
    const list = [...(prev?.learningOutputs ?? []), output];
    this.sessions.set(sessionId, {
      sessionId,
      transcript: prev?.transcript ?? "",
      learningOutputs: list,
      confusionEvents: prev?.confusionEvents ?? [],
      updatedAt: Date.now(),
    });
  }

  appendConfusion(sessionId: string, note: string): void {
    const prev = this.sessions.get(sessionId);
    const events = [...(prev?.confusionEvents ?? []), { note, at: Date.now() }];
    this.sessions.set(sessionId, {
      sessionId,
      transcript: prev?.transcript ?? "",
      learningOutputs: prev?.learningOutputs ?? [],
      confusionEvents: events,
      updatedAt: Date.now(),
    });
  }

  get(sessionId: string): StoredSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** Empty shell so snapshot / HTTP APIs work before first transcript chunk. */
  ensure(sessionId: string): void {
    if (this.sessions.has(sessionId)) return;
    this.sessions.set(sessionId, {
      sessionId,
      transcript: "",
      learningOutputs: [],
      confusionEvents: [],
      updatedAt: Date.now(),
    });
  }

  importSession(s: StoredSession): void {
    this.sessions.set(s.sessionId, { ...s, updatedAt: Date.now() });
  }

  /** Summaries for session manager UI (memory-backed sessions). */
  listSummaries(): Array<{
    sessionId: string;
    updatedAt: number;
    transcriptPreview: string;
    hasTranscript: boolean;
    learningCount: number;
    confusionCount: number;
  }> {
    return [...this.sessions.values()].map((s) => ({
      sessionId: s.sessionId,
      updatedAt: s.updatedAt,
      transcriptPreview: s.transcript.trim().replace(/\s+/g, " ").slice(0, 140),
      hasTranscript: s.transcript.trim().length > 0,
      learningCount: s.learningOutputs.length,
      confusionCount: s.confusionEvents.length,
    }));
  }
}
