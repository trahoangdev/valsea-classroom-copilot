import { env, assertLlmKey } from "./env.js";
import type { LearningOutput, LiveChunkAssist } from "./types.js";

const SYSTEM_USER_PROMPT = `You are a classroom learning assistant for Vietnamese university students.

Input is a transcript from a Vietnamese-English code-switching lecture.

Return valid JSON with exactly these keys:
- shortSummaryVi (string)
- keyTerms (array of { "term", "definitionVi", "whyItMatters" })
- simpleExplanationVi (string)
- englishRecapEn (string)
- quizQuestions (array of { "question", "choices" (4 strings), "answer" })
- possibleConfusingPoints (string array)

Rules:
- Write explanations in simple Vietnamese.
- englishRecapEn: clear, concise English summary of the same facts as the lecture — for international students or bilingual review. Use natural English; keep technical terms in standard English. Same fidelity as shortSummaryVi: do not invent content.
- If there is little Vietnamese prose (mostly English terms), englishRecapEn may closely mirror the technical content in polished English.
- Preserve English technical terms in Vietnamese fields where appropriate.
- Do not invent content outside the transcript.
- Keep summaries concise.
- If the transcript is too short, use empty arrays where appropriate, empty englishRecapEn, and put a short note in shortSummaryVi.
- Make quiz questions answerable from the transcript.
- quizQuestions: Always write "question", all four "choices", and "answer" in Vietnamese (simple, classroom-friendly). Even if the transcript is entirely in English, translate the quiz into Vietnamese. Keep English technical terms from the lecture inside Vietnamese sentences when needed (e.g. "Hàm gọi chính nó — recursion — để làm gì?"). Do not leave the quiz in English only.
- Avoid over-explaining.
- Respond with JSON only, no markdown fences.`;

function emptyOutput(note: string): LearningOutput {
  return {
    shortSummaryVi: note,
    keyTerms: [],
    simpleExplanationVi: "",
    englishRecapEn: "",
    quizQuestions: [],
    possibleConfusingPoints: [],
  };
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function coerceOutput(raw: Record<string, unknown>): LearningOutput {
  const shortSummaryVi =
    typeof raw.shortSummaryVi === "string" ? raw.shortSummaryVi : "";
  const simpleExplanationVi =
    typeof raw.simpleExplanationVi === "string" ? raw.simpleExplanationVi : "";
  const englishRecapEnRaw =
    raw.englishRecapEn ?? raw.english_recap_en ?? raw.lectureSummaryEn;
  const englishRecapEn =
    typeof englishRecapEnRaw === "string" ? englishRecapEnRaw : "";

  const keyTermsRaw = raw.keyTerms;
  const keyTerms: LearningOutput["keyTerms"] = [];
  if (Array.isArray(keyTermsRaw)) {
    for (const k of keyTermsRaw) {
      if (typeof k !== "object" || k === null) continue;
      const o = k as Record<string, unknown>;
      keyTerms.push({
        term: typeof o.term === "string" ? o.term : "",
        definitionVi:
          typeof o.definitionVi === "string" ? o.definitionVi : "",
        whyItMatters:
          typeof o.whyItMatters === "string" ? o.whyItMatters : "",
      });
    }
  }

  const quizRaw = raw.quizQuestions;
  const quizQuestions: LearningOutput["quizQuestions"] = [];
  if (Array.isArray(quizRaw)) {
    for (const q of quizRaw) {
      if (typeof q !== "object" || q === null) continue;
      const o = q as Record<string, unknown>;
      const choices = o.choices;
      let c: [string, string, string, string] = ["", "", "", ""];
      if (Array.isArray(choices) && choices.length >= 4) {
        c = [
          String(choices[0] ?? ""),
          String(choices[1] ?? ""),
          String(choices[2] ?? ""),
          String(choices[3] ?? ""),
        ];
      }
      quizQuestions.push({
        question: typeof o.question === "string" ? o.question : "",
        choices: c,
        answer: typeof o.answer === "string" ? o.answer : "",
      });
    }
  }

  let possibleConfusingPoints: string[] = [];
  const pcp = raw.possibleConfusingPoints;
  if (Array.isArray(pcp)) {
    possibleConfusingPoints = pcp.filter((x): x is string => typeof x === "string");
  }

  return {
    shortSummaryVi,
    keyTerms,
    simpleExplanationVi,
    englishRecapEn,
    quizQuestions,
    possibleConfusingPoints,
  };
}

const LIVE_CHUNK_PROMPT = `You help students during a live Vietnamese–English code-switching lecture.

You receive ONE short transcript segment (may mix Vietnamese and English technical terms).

Return valid JSON with exactly these keys:
- microSummaryVi (string): 1–2 sentences in simple Vietnamese — what this segment is about.
- explainVi (string): 1–3 short sentences in simple Vietnamese clarifying the segment for students.
- lineEn (string): One or two sentences in natural English — same meaning as the segment (translation / recap). Keep technical terms in standard English.

Rules:
- Do not invent facts not present in the segment.
- If the segment is too short or unclear, use brief honest placeholders like "Đoạn quá ngắn." and a minimal lineEn.
- Respond with JSON only, no markdown fences.`;

function coerceLiveChunk(raw: Record<string, unknown>): LiveChunkAssist {
  const micro =
    typeof raw.microSummaryVi === "string"
      ? raw.microSummaryVi
      : typeof raw.micro_summary_vi === "string"
        ? raw.micro_summary_vi
        : "";
  const explain =
    typeof raw.explainVi === "string"
      ? raw.explainVi
      : typeof raw.explain_vi === "string"
        ? raw.explain_vi
        : "";
  const line =
    typeof raw.lineEn === "string"
      ? raw.lineEn
      : typeof raw.line_en === "string"
        ? raw.line_en
        : "";
  return { microSummaryVi: micro, explainVi: explain, lineEn: line };
}

/**
 * Small, fast LLM call for one transcript chunk — used when "live assist" is enabled.
 * Returns null if input empty or LLM unusable.
 */
export async function generateLiveChunkAssist(segment: string): Promise<LiveChunkAssist | null> {
  assertLlmKey();
  const text = segment.trim();
  if (!text) return null;

  const url = `${env.llmBaseUrl}/chat/completions`;
  const body = {
    model: env.llmModel,
    temperature: 0.2,
    max_tokens: 380,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: LIVE_CHUNK_PROMPT },
      { role: "user", content: JSON.stringify({ segment: text.slice(0, 1200) }) },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.llmApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM live assist failed: ${res.status} ${t}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") return null;

  const parsed = extractJsonObject(content);
  if (!parsed) return null;
  return coerceLiveChunk(parsed);
}

export async function generateLearning(transcript: string): Promise<LearningOutput> {
  assertLlmKey();
  const text = transcript.trim();
  if (!text) {
    return emptyOutput("Chưa có transcript để tạo ghi chú.");
  }

  const url = `${env.llmBaseUrl}/chat/completions`;
  const body = {
    model: env.llmModel,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_USER_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ sessionId: "local", transcript: text, recentChunks: [] }),
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.llmApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${t}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return emptyOutput("LLM không trả về nội dung hợp lệ.");
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    return {
      shortSummaryVi: content.slice(0, 2000),
      keyTerms: [],
      simpleExplanationVi: "",
      englishRecapEn: "",
      quizQuestions: [],
      possibleConfusingPoints: [],
    };
  }

  return coerceOutput(parsed);
}
