import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { LearningOutput } from "./types.js";
import type { TranscriptChunk } from "./transcriptProcessor.js";
import type { ConfusionEvent, StoredSession } from "./storage.js";
import type { SessionListItem } from "./sessionListTypes.js";

function countSessionIds(rows: { session_id: string }[]): Record<string, number> {
  const o: Record<string, number> = {};
  for (const r of rows) {
    const k = r.session_id;
    o[k] = (o[k] ?? 0) + 1;
  }
  return o;
}

export function createSupabasePersistence(
  url: string,
  serviceRoleKey: string
): SupabasePersistence | null {
  if (!url.trim() || !serviceRoleKey.trim()) return null;
  return new SupabasePersistence(
    createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  );
}

export class SupabasePersistence {
  constructor(private readonly client: SupabaseClient) {}

  /** Lightweight check: table exists and credentials work. */
  async ping(): Promise<{ ok: boolean; message?: string }> {
    const { error } = await this.client.from("class_sessions").select("id").limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  async ensureSession(sessionId: string, title?: string | null): Promise<void> {
    const { error } = await this.client.from("class_sessions").upsert(
      {
        id: sessionId,
        title: title ?? null,
        status: "active",
        ended_at: null,
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  async markSessionEnded(sessionId: string): Promise<void> {
    await this.client
      .from("class_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  }

  async insertTranscriptChunk(sessionId: string, chunk: TranscriptChunk): Promise<void> {
    const { error } = await this.client.from("transcript_chunks").insert({
      session_id: sessionId,
      chunk_index: chunk.chunkIndex,
      start_time: chunk.startTime,
      end_time: chunk.endTime,
      text: chunk.text,
      is_final: chunk.isFinal,
    });
    if (error) throw error;
  }

  /** Batch / upload: replace all chunks with one segment (demo-friendly). */
  async replaceTranscriptChunksBulk(sessionId: string, text: string): Promise<void> {
    await this.client.from("transcript_chunks").delete().eq("session_id", sessionId);
    const trimmed = text.trim();
    if (!trimmed) return;
    const { error } = await this.client.from("transcript_chunks").insert({
      session_id: sessionId,
      chunk_index: 0,
      start_time: 0,
      end_time: 0,
      text: trimmed,
      is_final: true,
    });
    if (error) throw error;
  }

  async saveLearningOutput(sessionId: string, output: LearningOutput): Promise<void> {
    const { error } = await this.client.from("learning_outputs").insert({
      session_id: sessionId,
      chunk_id: null,
      short_summary_vi: output.shortSummaryVi,
      key_terms_json: output.keyTerms,
      simple_explanation_vi: output.simpleExplanationVi,
      quiz_json: output.quizQuestions,
      confusing_points_json: output.possibleConfusingPoints,
    });
    if (error) throw error;
  }

  async saveConfusion(sessionId: string, note: string, source: string): Promise<void> {
    const { error } = await this.client.from("confusion_events").insert({
      session_id: sessionId,
      timestamp: Date.now(),
      source,
      label: null,
      note,
    });
    if (error) throw error;
  }

  /** Recent sessions with lightweight stats for GET /api/sessions. */
  async listSessionsEnriched(limit: number): Promise<SessionListItem[]> {
    const { data: rows, error } = await this.client
      .from("class_sessions")
      .select("id, title, status, created_at, ended_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!rows?.length) return [];

    const ids = rows.map((r) => r.id as string);

    const { data: chunks } = await this.client
      .from("transcript_chunks")
      .select("session_id, text, chunk_index")
      .in("session_id", ids)
      .order("chunk_index", { ascending: true });

    const firstPreview = new Map<string, string>();
    const hasChunks = new Set<string>();
    for (const c of chunks ?? []) {
      const sid = c.session_id as string;
      hasChunks.add(sid);
      if (!firstPreview.has(sid)) {
        firstPreview.set(sid, String(c.text ?? "").trim());
      }
    }

    const { data: learnRows } = await this.client
      .from("learning_outputs")
      .select("session_id")
      .in("session_id", ids);
    const learnBy = countSessionIds(learnRows ?? []);

    const { data: confRows } = await this.client
      .from("confusion_events")
      .select("session_id")
      .in("session_id", ids);
    const confBy = countSessionIds(confRows ?? []);

    return rows.map((r) => {
      const id = r.id as string;
      const createdAt = new Date(r.created_at as string).getTime();
      const endedAt = r.ended_at ? new Date(r.ended_at as string).getTime() : null;
      const preview = (firstPreview.get(id) ?? "").replace(/\s+/g, " ").slice(0, 140);
      return {
        sessionId: id,
        title: (r.title as string | null) ?? null,
        status: String(r.status ?? "active"),
        createdAt,
        endedAt,
        updatedAt: Math.max(createdAt, endedAt ?? 0),
        transcriptPreview: preview,
        hasTranscript: hasChunks.has(id),
        learningCount: learnBy[id] ?? 0,
        confusionCount: confBy[id] ?? 0,
      };
    });
  }

  async loadSession(sessionId: string): Promise<StoredSession | null> {
    const { data: row, error: sessErr } = await this.client
      .from("class_sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr || !row) return null;

    const { data: chunks } = await this.client
      .from("transcript_chunks")
      .select("text")
      .eq("session_id", sessionId)
      .order("chunk_index", { ascending: true });

    const transcript = (chunks ?? []).map((c) => c.text).join("\n\n");

    const { data: learnings } = await this.client
      .from("learning_outputs")
      .select(
        "short_summary_vi, key_terms_json, simple_explanation_vi, quiz_json, confusing_points_json"
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const learningOutputs: LearningOutput[] = (learnings ?? []).map((r) => ({
      shortSummaryVi: r.short_summary_vi ?? "",
      keyTerms: (r.key_terms_json as LearningOutput["keyTerms"]) ?? [],
      simpleExplanationVi: r.simple_explanation_vi ?? "",
      quizQuestions: (r.quiz_json as LearningOutput["quizQuestions"]) ?? [],
      possibleConfusingPoints: (r.confusing_points_json as string[]) ?? [],
    }));

    const { data: confusions } = await this.client
      .from("confusion_events")
      .select("note, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const confusionEvents: ConfusionEvent[] = (confusions ?? []).map((c) => ({
      note: c.note ?? "",
      at: new Date(c.created_at as string).getTime(),
    }));

    return {
      sessionId,
      transcript,
      learningOutputs,
      confusionEvents,
      updatedAt: Date.now(),
    };
  }
}
