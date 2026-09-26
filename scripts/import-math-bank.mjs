/**
 * Builds a website-ready Math question bank from a College Board PDF export.
 *
 * The PDF tells us exactly which question IDs the user selected. Metadata and
 * detailed disclosed records supply semantic HTML/MathML, answer choices, and
 * the accepted answers for student-produced responses. It writes a local JSON
 * bank; run `node scripts/seed-math.mjs` afterwards to upsert it to Supabase.
 *
 * Usage:
 *   node scripts/import-math-bank.mjs /path/to/questionbank-export.pdf
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = join(here, "math-bank.json");
const pdfPath = process.argv[2];
const assessmentId = 100; // PSAT/NMSQT and PSAT 10, matching this export.
const metadataUrl = "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";
const detailUrl = "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question";
const bulkDetailUrl = "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/pdf-download";
const legacyBaseUrl = "https://saic.collegeboard.org/disclosed";

if (!pdfPath) {
  console.error("Usage: node scripts/import-math-bank.mjs /path/to/questionbank-export.pdf");
  process.exit(1);
}

function runPdfToText(path) {
  const candidates = [
    process.env.PDFTOTEXT_BIN,
    "/Users/kavitasharda/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftotext",
    "pdftotext",
  ].filter(Boolean);
  for (const binary of candidates) {
    try {
      return execFileSync(binary, ["-layout", path, "-"], {
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      });
    } catch {
      // Try the next available Poppler binary.
    }
  }
  throw new Error("Could not run pdftotext. Set PDFTOTEXT_BIN to a Poppler binary.");
}

function selectedQuestionIds(pdfText) {
  const ids = [...pdfText.matchAll(/Question ID:\s*([a-z0-9]+)/gi)].map((match) => match[1]);
  return [...new Set(ids)];
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
  return response.json();
}

function cleanHtml(value) {
  return String(value || "")
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(?:script|style|iframe|object|embed)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function textFromHtml(html) {
  return cleanHtml(html)
    .replace(/<math\b[^>]*\balttext=(?:"([^"]*)"|'([^']*)')[^>]*>[\s\S]*?<\/math>/gi, (_, a, b) => ` ${a || b || "math"} `)
    .replace(/<img\b[^>]*\balt=(?:"([^"]*)"|'([^']*)')[^>]*>/gi, (_, a, b) => ` ${a || b || "image"} `)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function responseType(type) {
  const normalized = String(type || "").toLowerCase();
  return normalized.includes("multiple") || normalized === "mc" || normalized === "mcq"
    ? "multiple_choice"
    : "student_produced_response";
}

function validationFor(acceptedAnswers) {
  return {
    kind: "numeric_or_fraction",
    normalization: ["trim", "unicode_minus", "remove_commas"],
    comparison: "exact_rational_or_decimal",
    accepted_answers: acceptedAnswers,
    allow_fraction: true,
    allow_decimal: true,
  };
}

function answersFromRationale(html) {
  const text = textFromHtml(html);
  const match = text.match(
    /\bthe correct answer is\s+(-?(?:\d[\d,]*(?:\.\d+)?|\d+\/\d+))\b/i
  );
  if (match) return [match[1].replace(/,/g, "")];

  // Some older SPR rationales spell out the result but explicitly list the
  // keyboard-safe numeric forms that students may enter.
  const examples = text.match(/\bnote that\s+(.+?)\s+(?:is|are) examples? of ways to enter a correct answer\b/i);
  return examples
    ? [...examples[1].matchAll(/-?\d+(?:\.\d+)?(?:\/\d+)?/g)].map((value) => value[0])
    : [];
}

function choiceFromRationale(html) {
  const match = textFromHtml(html).match(/\bchoice\s+([A-D])\s+is correct\b/i);
  return match ? match[1].toUpperCase() : null;
}

function toRow(metadata, payload, source) {
  // Some current-bank records retain the disclosed (HTML/image) item shape,
  // even when their metadata gives them an external digital ID.
  const disclosedShape = Boolean(payload?.answer);
  const answer = disclosedShape ? payload.answer : payload;
  const choices = disclosedShape
    ? Object.fromEntries(Object.entries(answer.choices || {}).map(([key, value]) => [key.toUpperCase(), cleanHtml(value?.body)]))
    : Object.fromEntries((payload.answerOptions || []).map((value, index) => [String.fromCharCode(65 + index), cleanHtml(value?.content)]));
  const type = disclosedShape ? answer.style : payload.type;
  const kind = responseType(type);
  const rationaleHtml = cleanHtml(disclosedShape ? (answer.rationale || answer.correct_spr?.rationale) : payload.rationale);
  const suppliedAnswers = disclosedShape
    ? [answer.correct_choice, ...(answer.correct_spr?.absolute || [])].filter(Boolean).map((value) => String(value).toUpperCase())
    : (payload.correct_answer || payload.keys || []).map(String);
  // A small disclosed SPR subset intentionally omits its key in both public
  // record formats, but states its numeric answer in the supplied rationale.
  const acceptedAnswers = suppliedAnswers.length
    ? suppliedAnswers
    : (kind === "student_produced_response"
      ? answersFromRationale(rationaleHtml)
      : [choiceFromRationale(rationaleHtml)].filter(Boolean));
  const passageHtml = cleanHtml(disclosedShape ? payload.body : (payload.stimulus || payload.prompt));
  const promptHtml = cleanHtml(disclosedShape ? payload.prompt : payload.stem);

  if (!acceptedAnswers.length) {
    throw new Error(`${metadata.questionId} has no accepted answer`);
  }
  if (kind === "multiple_choice" && !Object.keys(choices).length) {
    throw new Error(`${metadata.questionId} is multiple choice but has no options`);
  }

  return {
    id: metadata.questionId,
    assessment: "PSAT",
    test: "Math",
    domain: metadata.primary_class_cd_desc,
    skill: metadata.skill_desc,
    difficulty: { E: "Easy", M: "Medium", H: "Hard" }[metadata.difficulty] || metadata.difficulty,
    passage: textFromHtml(passageHtml),
    prompt: textFromHtml(promptHtml),
    choices: kind === "multiple_choice" ? Object.fromEntries(Object.entries(choices).map(([key, value]) => [key, textFromHtml(value)])) : {},
    correct: acceptedAnswers[0],
    rationale: textFromHtml(rationaleHtml),
    table_data: null,
    passage_html: passageHtml || null,
    prompt_html: promptHtml || null,
    choices_html: kind === "multiple_choice" ? choices : null,
    rationale_html: rationaleHtml || null,
    response_type: kind,
    accepted_answers: acceptedAnswers,
    answer_validation: kind === "student_produced_response" ? validationFor(acceptedAnswers) : null,
    source_metadata: {
      provider: "College Board Educator Question Bank",
      source_kind: source,
      external_id: metadata.external_id || null,
      ibn: metadata.ibn || null,
      source_question_id: metadata.questionId,
    },
  };
}

const pdfText = runPdfToText(pdfPath);
const ids = selectedQuestionIds(pdfText);
const allMetadata = await jsonFetch(metadataUrl, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ asmtEventId: assessmentId, test: 2, domain: "H,P,Q,S" }),
});
const wanted = new Map(ids.map((id) => [id, true]));
const metadata = allMetadata.filter((row) => wanted.has(row.questionId));
const foundIds = new Set(metadata.map((row) => row.questionId));
const missing = ids.filter((id) => !foundIds.has(id));
if (missing.length) throw new Error(`Could not find metadata for: ${missing.join(", ")}`);

const digitalRows = metadata.filter((row) => row.external_id);
const legacyRows = metadata.filter((row) => row.ibn);
const digitalPayloads = new Map();
for (let start = 0; start < digitalRows.length; start += 25) {
  const group = digitalRows.slice(start, start + 25).map((row) => row.external_id);
  const details = await jsonFetch(bulkDetailUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ external_ids: group }),
  });
  for (const detail of details) digitalPayloads.set(detail.externalid, detail);
  console.log(`Downloaded structured MathML for ${Math.min(start + group.length, digitalRows.length)}/${digitalRows.length} digital questions`);
}

const rows = [];
for (const row of metadata) {
  if (row.external_id) {
    let detail = digitalPayloads.get(row.external_id);
    if (!detail) detail = await jsonFetch(detailUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ external_id: row.external_id }),
    });
    // The bulk endpoint suppresses the SPR key for a legacy-style subset.
    // Fetch those records individually to retain the actual accepted value.
    if (detail?.answer?.style === "SPR" && !detail.answer.correct_spr) {
      detail = await jsonFetch(detailUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ external_id: row.external_id }),
      });
    }
    rows.push(toRow(row, detail, "digital"));
  } else {
    const details = await jsonFetch(`${legacyBaseUrl}/${row.ibn}.json`);
    rows.push(toRow(row, details[0], "legacy"));
    // Keep this public source gentle; legacy records are fetched one at a time.
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  if (rows.length % 25 === 0 || rows.length === metadata.length) {
    console.log(`Normalized ${rows.length}/${metadata.length} Math questions`);
  }
}

writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} questions to ${outputPath}`);
