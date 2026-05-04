export type SessionUiStatus =
  | "idle"
  | "requesting_microphone"
  | "connecting"
  | "listening"
  | "transcribing"
  | "generating_outputs"
  | "error"
  | "stopped";

export type FrontendToBackend =
  | { type: "session.start"; sessionId: string }
  | { type: "audio.chunk"; sessionId: string; audio: string }
  | { type: "session.stop"; sessionId: string }
  | { type: "learning.generate"; sessionId: string }
  | { type: "confusion.mark"; sessionId: string; note: string }
  | { type: "liveAssist.set"; sessionId: string; enabled: boolean };

/** Lightweight LLM output per finalized transcript segment (hackathon track: live assist). */
export type LiveChunkAssist = {
  microSummaryVi: string;
  explainVi: string;
  /** Natural English for this segment — translation / recap for bilingual students. */
  lineEn: string;
};

export type BackendToFrontend =
  | { type: "session.status"; status: SessionUiStatus }
  | { type: "transcript.partial"; text: string }
  | {
      type: "transcript.final";
      chunk: {
        id: string;
        startTime: number;
        endTime: number;
        text: string;
      };
    }
  | {
      type: "assist.live";
      chunkId: string;
      chunkText: string;
      payload: LiveChunkAssist;
    }
  | {
      type: "learning.output";
      output: LearningOutput;
    }
  | { type: "error"; message: string; recoverable: boolean };

export type KeyTerm = {
  term: string;
  definitionVi: string;
  whyItMatters: string;
};

export type QuizQuestion = {
  question: string;
  choices: [string, string, string, string];
  answer: string;
};

export type LearningOutput = {
  shortSummaryVi: string;
  keyTerms: KeyTerm[];
  simpleExplanationVi: string;
  /** English recap of the same lecture content (for international students / review). */
  englishRecapEn: string;
  quizQuestions: QuizQuestion[];
  possibleConfusingPoints: string[];
};
