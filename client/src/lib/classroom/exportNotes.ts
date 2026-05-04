import type { LearningOutput } from "@/lib/classroom/types";

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|");
}

export function buildNotesMarkdown(transcript: string, output: LearningOutput): string {
  const lines: string[] = [
    "# Vietnamese–English Classroom Copilot — export",
    "",
    "## Transcript",
    "",
    transcript.trim() || "_(empty)_",
    "",
    "## Summary (VI)",
    "",
    output.shortSummaryVi || "_(none)_",
    "",
  ];
  if (output.englishRecapEn?.trim()) {
    lines.push("## Lecture recap (EN)", "", output.englishRecapEn.trim(), "");
  }
  if (output.simpleExplanationVi) {
    lines.push("## Simple explanation (VI)", "", output.simpleExplanationVi, "");
  }
  if (output.keyTerms.length) {
    lines.push("## Key terms", "", "| Term | Definition (VI) | Why it matters |", "| --- | --- | --- |");
    for (const t of output.keyTerms) {
      lines.push(
        `| ${escapeMd(t.term)} | ${escapeMd(t.definitionVi)} | ${escapeMd(t.whyItMatters)} |`
      );
    }
    lines.push("");
  }
  if (output.quizQuestions.length) {
    lines.push("## Quiz", "");
    output.quizQuestions.forEach((q, i) => {
      lines.push(`### ${i + 1}. ${q.question}`, "");
      q.choices.forEach((c, j) => lines.push(`${String.fromCharCode(65 + j)}. ${c}`));
      lines.push("", `**Answer:** ${q.answer}`, "");
    });
  }
  if (output.valsea?.enabled) {
    lines.push("## VALSEA learning context", "");
    if (output.valsea.semanticTags.length) {
      lines.push("### Semantic tags", "");
      output.valsea.semanticTags.forEach((tag) => {
        lines.push(`- **${tag.phrase || tag.tag}**: ${tag.meaning || tag.tag}`);
      });
      lines.push("");
    }
    if (output.valsea.formattedNotes) {
      lines.push("### Formatted notes", "", output.valsea.formattedNotes, "");
    }
    if (output.valsea.translatedTextEn) {
      lines.push("### Translation (EN)", "", output.valsea.translatedTextEn, "");
    }
  }
  if (output.possibleConfusingPoints.length) {
    lines.push("## Possibly confusing", "");
    output.possibleConfusingPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  return lines.join("\n");
}

export function buildNotesJson(params: {
  sessionId: string;
  transcript: string;
  output: LearningOutput;
  exportedAt: string;
}): string {
  return JSON.stringify(
    {
      sessionId: params.sessionId,
      exportedAt: params.exportedAt,
      transcript: params.transcript,
      learning: params.output,
    },
    null,
    2
  );
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
