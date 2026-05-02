export type SessionUiStatus =
  | "idle"
  | "requesting_microphone"
  | "connecting"
  | "listening"
  | "transcribing"
  | "generating_outputs"
  | "error"
  | "stopped";

export type LiveChunkAssist = {
  microSummaryVi: string;
  explainVi: string;
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

/** Messages accepted by the gateway (subset; see AGENTS.md §11). */
export type FrontendToGateway =
  | { type: "session.start"; sessionId: string }
  | { type: "audio.chunk"; sessionId: string; audio: string }
  | { type: "session.stop"; sessionId: string }
  | { type: "learning.generate"; sessionId: string }
  | { type: "confusion.mark"; sessionId: string; note: string }
  | { type: "liveAssist.set"; sessionId: string; enabled: boolean };

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
  /** English recap — same lecture facts, for bilingual review. */
  englishRecapEn: string;
  quizQuestions: QuizQuestion[];
  possibleConfusingPoints: string[];
};

export type GatewaySessionSnapshot = {
  sessionId: string;
  transcript: string;
  learningOutputs: LearningOutput[];
  confusionEvents: { note: string; at: number }[];
  updatedAt: number;
};

/** Row from GET /api/sessions */
export type SessionListEntry = {
  sessionId: string;
  title: string | null;
  status: string;
  createdAt: number;
  endedAt: number | null;
  updatedAt: number;
  transcriptPreview: string;
  hasTranscript: boolean;
  learningCount: number;
  confusionCount: number;
};
