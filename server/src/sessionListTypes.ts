export type SessionListItem = {
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
