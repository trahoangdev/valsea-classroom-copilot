import { randomUUID } from "crypto";

export type TranscriptChunk = {
  id: string;
  chunkIndex: number;
  startTime: number;
  endTime: number;
  text: string;
  isFinal: boolean;
};

const WORD_SPLIT = /\s+/;

export class TranscriptProcessor {
  private buffer = "";
  private chunkIndex = 0;
  private sessionStart = Date.now();
  private lastFlush = Date.now();
  private lastPartial = "";
  private lastChunkEndSec = 0;

  reset(): void {
    this.buffer = "";
    this.chunkIndex = 0;
    this.sessionStart = Date.now();
    this.lastFlush = Date.now();
    this.lastPartial = "";
    this.lastChunkEndSec = 0;
  }

  /** Dedupe repeated partials from ASR. */
  ingestPartial(text: string): string | null {
    const t = text.trim();
    if (!t || t === this.lastPartial) return null;
    this.lastPartial = t;
    return t;
  }

  /**
   * Append final segment and optionally flush a merged chunk.
   * Returns chunk for transcript.final or null if caller should skip tiny emission.
   */
  ingestFinal(text: string): TranscriptChunk | null {
    const t = text.trim();
    if (!t) return null;
    const sep = this.buffer && !this.buffer.endsWith(" ") ? " " : "";
    this.buffer = (this.buffer + sep + t).trim();
    this.lastPartial = "";
    return this.maybeFlush(true);
  }

  /** Time/word-based flush for long-running speech without explicit finals. */
  tick(): TranscriptChunk | null {
    return this.maybeFlush(false);
  }

  forceFlush(): TranscriptChunk | null {
    return this.maybeFlush(true);
  }

  getFullTranscript(): string {
    return this.buffer.trim();
  }

  private wordCount(s: string): number {
    return s.split(WORD_SPLIT).filter(Boolean).length;
  }

  private maybeFlush(forceFromFinal: boolean): TranscriptChunk | null {
    const now = Date.now();
    const elapsedSec = (now - this.lastFlush) / 1000;
    const words = this.wordCount(this.buffer);
    const shouldFlush =
      forceFromFinal ||
      words >= 40 ||
      (words >= 8 && elapsedSec >= 25);

    if (!shouldFlush || !this.buffer.trim()) return null;

    const chunkText = this.buffer.trim();
    this.buffer = "";
    this.lastFlush = now;
    const endTime = (now - this.sessionStart) / 1000;
    const startTime = this.lastChunkEndSec;
    this.lastChunkEndSec = endTime;
    this.chunkIndex += 1;
    return {
      id: randomUUID(),
      chunkIndex: this.chunkIndex,
      startTime: Math.round(startTime * 10) / 10,
      endTime: Math.round(endTime * 10) / 10,
      text: chunkText,
      isFinal: true,
    };
  }
}
