import type { ReactNode } from "react";

/**
 * Common Vietnamese words often written without diacritics in ASR or informal text.
 * Avoid highlighting these as "English" when they match the ASCII-only pattern.
 */
const VI_ASCII_DENY = new Set(
  [
    "a",
    "ba",
    "bay",
    "ben",
    "bon",
    "buoc",
    "cai",
    "cac",
    "cho",
    "co",
    "con",
    "cua",
    "da",
    "danh",
    "de",
    "den",
    "doi",
    "du",
    "duoc",
    "gia",
    "giau",
    "gi",
    "hay",
    "ho",
    "hom",
    "khi",
    "khong",
    "la",
    "lam",
    "lai",
    "lon",
    "luon",
    "ma",
    "minh",
    "mot",
    "muon",
    "nam",
    "nay",
    "neu",
    "nhu",
    "no",
    "noi",
    "nua",
    "qua",
    "rat",
    "roi",
    "sao",
    "sau",
    "se",
    "tai",
    "tao",
    "tat",
    "thi",
    "thu",
    "tren",
    "trong",
    "tu",
    "tuy",
    "va",
    "vao",
    "ve",
    "vi",
    "voi",
    "vua",
    "xin",
    // Common 3–5 letter Vietnamese without diacritics (false positives)
    "sai",
    "cao",
    "thap",
    "giam",
    "lech",
    "muc",
    "biet",
    "giup",
    "chung",
    "tung",
    "cham",
    "nen",
    "cap",
    "nhat",
    "khac",
    "duoi",
    "nhieu",
    "dong",
    "hoac",
    "giai",
    "thich",
    "duong",
    "chinh",
    "phan",
    "loai",
    "hang",
    "ngay",
    "gio",
    "phut",
    "nhung",
    "cuon",
    "tich",
    "hop",
    "luu",
    "hieu",
    "tinh",
    "dung",
    "chay",
    "tim",
    "huan",
    "luyen",
    "thuat",
    "hoc",
    "toan",
    "van",
    "ban",
    "can",
    "gan",
    "hon",
    "ken",
    "len",
    "nen",
    "son",
    "tin",
    "xin",
    "yen",
  ].map((w) => w.toLowerCase())
);

/** Lowercase 3-letter tokens: usually Vietnamese syllables; allow only common ML/CS abbreviations. */
const EN_LOWERCASE_3_ALLOW = new Set(
  [
    "min",
    "max",
    "sum",
    "tan",
    "log",
    "mse",
    "mae",
    "bce",
    "cnn",
    "rnn",
    "gan",
    "api",
    "sql",
    "gpu",
    "cpu",
    "ram",
    "fps",
    "auc",
    "fpr",
    "tpr",
    "map",
    "std",
    "var",
    "csv",
    "pdf",
    "jpg",
    "png",
    "rgb",
    "hsv",
    "len",
    "fit",
    "dim",
    "seq",
    "dot",
    "pad",
  ].map((w) => w.toLowerCase())
);

const ASCII_TECH_WORD =
  /[A-Za-z][A-Za-z0-9]*(?:[-'][A-Za-z][A-Za-z0-9]*)*/g;

function isSimpleTitleCase(word: string): boolean {
  if (word.length < 2) return false;
  const first = word[0];
  const rest = word.slice(1);
  if (first !== first.toUpperCase() || first === first.toLowerCase()) return false;
  return rest === rest.toLowerCase() && /[a-z]/.test(rest);
}

function shouldHighlightEnglishToken(word: string): boolean {
  const lower = word.toLowerCase();
  if (VI_ASCII_DENY.has(lower)) return false;

  const lettersOnly = /^[A-Za-z]+$/.test(word);
  const allUpper = lettersOnly && word === word.toUpperCase() && word.length >= 2;
  if (allUpper) return true;

  if (word.length === 2 && /^[A-Z]{2}$/.test(word)) return true;

  const allLower = word === lower && lettersOnly;
  if (word.length === 3 && allLower) {
    return EN_LOWERCASE_3_ALLOW.has(lower);
  }

  // Sentence-initial Vietnamese 3-letter words often appear title-cased ("Khi", "Neu")
  if (word.length <= 3 && isSimpleTitleCase(word)) {
    return false;
  }

  if (word.length >= 4) return true;

  // Mixed case tech tokens shorter than 4 (e.g. internal caps) — rare; allow if not denied
  if (!allLower && word.length >= 3) return true;

  return false;
}

/**
 * Wraps likely English / technical tokens (ASCII Latin) for code-switched Vietnamese lecture text.
 * Heuristic only — not a full language ID. Short lowercase words are mostly Vietnamese syllables,
 * so only 3-letter lowercase English is highlighted if listed in {@link EN_LOWERCASE_3_ALLOW}.
 */
export function highlightEnglishTokens(text: string): ReactNode {
  if (!text) return null;

  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  ASCII_TECH_WORD.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ASCII_TECH_WORD.exec(text)) !== null) {
    const word = m[0];
    const start = m.index;
    if (start > last) {
      out.push(text.slice(last, start));
    }
    if (shouldHighlightEnglishToken(word)) {
      out.push(
        <span
          key={`en-${key++}`}
          className="rounded-md bg-sky-500/15 px-1 py-px font-medium text-sky-800 dark:text-sky-200"
          title="Likely English / technical term (auto)"
        >
          {word}
        </span>
      );
    } else {
      out.push(word);
    }
    last = start + word.length;
  }
  if (last < text.length) {
    out.push(text.slice(last));
  }

  return out.length === 1 ? out[0] : <>{out}</>;
}
