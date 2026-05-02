export type SessionUiStatus =
  | "idle"
  | "requesting_microphone"
  | "connecting"
  | "listening"
  | "transcribing"
  | "generating_outputs"
  | "error"
  | "stopped";

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
