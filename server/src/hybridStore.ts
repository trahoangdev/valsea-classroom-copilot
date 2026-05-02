import type { TranscriptChunk } from "./transcriptProcessor.js";
import type { LearningOutput } from "./types.js";
import { MemorySessionStore, type StoredSession } from "./storage.js";
import type { SupabasePersistence } from "./supabasePersistence.js";
import type { SessionListItem } from "./sessionListTypes.js";

function memRowToListItem(m: ReturnType<MemorySessionStore["listSummaries"]>[number]): SessionListItem {
  return {
    sessionId: m.sessionId,
    title: null,
    status: "active",
    createdAt: m.updatedAt,
    endedAt: null,
    updatedAt: m.updatedAt,
    transcriptPreview: m.transcriptPreview,
    hasTranscript: m.hasTranscript,
    learningCount: m.learningCount,
    confusionCount: m.confusionCount,
  };
}

function mergeDbAndMem(dbItems: SessionListItem[], memSummaries: ReturnType<MemorySessionStore["listSummaries"]>): SessionListItem[] {
  const map = new Map<string, SessionListItem>();
  for (const d of dbItems) map.set(d.sessionId, d);
  for (const m of memSummaries) {
    const row = memRowToListItem(m);
    const d = map.get(m.sessionId);
    if (!d) {
      map.set(m.sessionId, row);
      continue;
    }
    const useMemPreview = m.updatedAt >= d.updatedAt && m.transcriptPreview.length > 0;
    map.set(m.sessionId, {
      ...d,
      transcriptPreview: useMemPreview ? m.transcriptPreview : d.transcriptPreview,
      hasTranscript: d.hasTranscript || m.hasTranscript,
      learningCount: Math.max(d.learningCount, m.learningCount),
      confusionCount: Math.max(d.confusionCount, m.confusionCount),
      updatedAt: Math.max(d.updatedAt, m.updatedAt),
    });
  }
  return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export class HybridSessionStore {
  private mem = new MemorySessionStore();

  constructor(private readonly persist: SupabasePersistence | null) {}

  private fire(p: Promise<unknown>, ctx: string): void {
    p.catch((e) =>
      console.error(`[supabase:${ctx}]`, e instanceof Error ? e.message : String(e))
    );
  }

  /** Memory hit, else load from Supabase into memory. */
  async get(sessionId: string): Promise<StoredSession | undefined> {
    const m = this.mem.get(sessionId);
    if (m) return m;
    if (!this.persist) return undefined;
    const loaded = await this.persist.loadSession(sessionId);
    if (loaded) this.mem.importSession(loaded);
    return loaded ?? undefined;
  }

  getSync(sessionId: string): StoredSession | undefined {
    return this.mem.get(sessionId);
  }

  ensureSessionStarted(sessionId: string): void {
    this.mem.ensure(sessionId);
    if (!this.persist) return;
    this.fire(this.persist.ensureSession(sessionId), "ensureSession");
  }

  appendFinalChunk(sessionId: string, chunk: TranscriptChunk): void {
    this.mem.appendTranscriptChunk(sessionId, chunk.text);
    if (!this.persist) return;
    this.fire(
      (async () => {
        await this.persist!.ensureSession(sessionId);
        await this.persist!.insertTranscriptChunk(sessionId, chunk);
      })(),
      "insertChunk"
    );
  }

  /** HTTP batch transcribe: replace transcript + single chunk row in DB. */
  replaceTranscriptFromBulk(sessionId: string, text: string): void {
    this.mem.replaceTranscript(sessionId, text);
    if (!this.persist) return;
    this.fire(
      (async () => {
        await this.persist!.ensureSession(sessionId);
        await this.persist!.replaceTranscriptChunksBulk(sessionId, text);
      })(),
      "replaceBulk"
    );
  }

  /**
   * Stop listening: authoritative full text, collapse chunks in DB for reload,
   * mark session ended.
   */
  finalizeSession(sessionId: string, fullTranscript: string): void {
    this.mem.replaceTranscript(sessionId, fullTranscript);
    if (!this.persist) return;
    this.fire(
      (async () => {
        await this.persist!.ensureSession(sessionId);
        await this.persist!.replaceTranscriptChunksBulk(sessionId, fullTranscript);
        await this.persist!.markSessionEnded(sessionId);
      })(),
      "finalizeSession"
    );
  }

  appendLearning(sessionId: string, output: LearningOutput): void {
    this.mem.appendLearning(sessionId, output);
    if (!this.persist) return;
    this.fire(
      (async () => {
        await this.persist!.ensureSession(sessionId);
        await this.persist!.saveLearningOutput(sessionId, output);
      })(),
      "learning"
    );
  }

  appendConfusion(sessionId: string, note: string, source: "ws" | "http"): void {
    this.mem.appendConfusion(sessionId, note);
    if (!this.persist) return;
    this.fire(
      (async () => {
        await this.persist!.ensureSession(sessionId);
        await this.persist!.saveConfusion(sessionId, note, source);
      })(),
      "confusion"
    );
  }

  /** Union of Supabase rows and in-memory cache, sorted by `updatedAt` desc. */
  async listAllSummaries(limit = 100): Promise<SessionListItem[]> {
    const cap = Math.min(500, Math.max(1, limit));
    const memSummaries = this.mem.listSummaries();
    if (!this.persist) {
      return memSummaries
        .map(memRowToListItem)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, cap);
    }
    const dbItems = await this.persist.listSessionsEnriched(cap + memSummaries.length);
    return mergeDbAndMem(dbItems, memSummaries).slice(0, cap);
  }
}
