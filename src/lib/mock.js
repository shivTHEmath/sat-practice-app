import { supabase } from "./supabase";
import { normalizeQuestion } from "./question-content";

export const BREAK_MS = 10 * 60 * 1000;
export const SECTIONS = ["Reading and Writing", "Math"];

export async function loadMocks() {
  const { data, error } = await supabase
    .from("sat_mocks")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

/** Fetch every question a mock references, keyed by id. */
export async function loadMockQuestions(mock) {
  const ids = [...new Set(mock.modules.flatMap((m) => m.question_ids))];
  const rows = [];
  for (let start = 0; start < ids.length; start += 100) {
    const { data, error } = await supabase
      .from("sat_questions")
      .select("*")
      .in("id", ids.slice(start, start + 100));
    if (error) throw error;
    rows.push(...(data || []));
  }
  return new Map(rows.map((row) => [row.id, normalizeQuestion(row)]));
}

export async function loadMockResults(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("sat_mock_results")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** "Section 1, Module 2: Reading and Writing", as Bluebook titles a module. */
export function moduleTitle(mod) {
  const section = SECTIONS.indexOf(mod.section) + 1;
  return `Section ${section}, Module ${mod.module}: ${mod.section}`;
}

export function isSpr(question) {
  return question?.response_type === "student_produced_response";
}

/**
 * Bluebook's grid-in box: digits, one decimal point, one slash, and a leading
 * minus. Five characters for a positive answer, six when negative.
 */
export function sanitizeSprInput(raw) {
  let out = "";
  for (const ch of raw.replace(/−/g, "-")) {
    if (/[0-9]/.test(ch)) out += ch;
    else if (ch === "-" && out === "") out += ch;
    else if (ch === "." && !out.includes(".") && !out.includes("/")) out += ch;
    else if (ch === "/" && !out.includes("/") && !out.includes(".")) out += ch;
  }
  return out.slice(0, out.startsWith("-") ? 6 : 5);
}

function toRational(text) {
  const value = String(text).trim().replace(/−/g, "-").replace(/,/g, "");
  let match = value.match(/^(-?)(\d+)\/(\d+)$/);
  if (match) {
    const d = BigInt(match[3]);
    if (d === 0n) return null;
    const n = BigInt(match[2]) * (match[1] ? -1n : 1n);
    return { n, d };
  }
  match = value.match(/^(-?)(\d*)(?:\.(\d*))?$/);
  if (!match || (!match[2] && !match[3])) return null;
  const decimals = match[3] || "";
  const d = 10n ** BigInt(decimals.length);
  const n = BigInt((match[2] || "0") + decimals) * (match[1] ? -1n : 1n);
  return { n, d };
}

/** Exact rational comparison against every accepted form of the answer. */
export function isSprCorrect(input, accepted) {
  const given = toRational(input ?? "");
  if (!given) return false;
  return accepted.some((answer) => {
    const target = toRational(answer);
    return target && given.n * target.d === target.n * given.d;
  });
}

export function acceptedAnswers(question) {
  return question.accepted_answers?.length ? question.accepted_answers : [question.correct];
}

export function isAnswerCorrect(question, selected) {
  if (selected == null || selected === "") return false;
  return isSpr(question)
    ? isSprCorrect(selected, acceptedAnswers(question))
    : selected === question.correct;
}

/*
 * Estimated section scaling. Official conversions for adaptive forms are not
 * published, so each curve is interpolated between anchor points and rounded
 * to the nearest 10. PSAT forms use the harder second module; SAT forms are
 * harder than Bluebook throughout, so their curve is more generous.
 */
const CURVES = {
  PSAT: [
    [0, 160],
    [0.2, 290],
    [0.35, 390],
    [0.5, 480],
    [0.65, 570],
    [0.8, 650],
    [0.9, 700],
    [0.96, 740],
    [1, 760],
  ],
  SAT: [
    [0, 200],
    [0.2, 340],
    [0.35, 450],
    [0.5, 550],
    [0.65, 630],
    [0.8, 710],
    [0.9, 760],
    [0.96, 790],
    [1, 800],
  ],
};

/** Section and total score ranges for the score report. */
export function scoreRange(assessment = "PSAT") {
  const curve = CURVES[assessment] || CURVES.PSAT;
  const low = curve[0][1];
  const high = curve[curve.length - 1][1];
  return { section: `${low}–${high}`, total: `${low * 2}–${high * 2}` };
}

export function scaleScore(raw, total, assessment = "PSAT") {
  const curve = CURVES[assessment] || CURVES.PSAT;
  if (!total) return curve[0][1];
  const pct = raw / total;
  for (let i = 1; i < curve.length; i += 1) {
    const [x1, y1] = curve[i];
    const [x0, y0] = curve[i - 1];
    if (pct <= x1) {
      const score = y0 + ((pct - x0) / (x1 - x0)) * (y1 - y0);
      return Math.round(score / 10) * 10;
    }
  }
  return curve[curve.length - 1][1];
}

/** Raw and scaled results plus a per-question row for the score report. */
export function scoreMock(mock, questionsById, answers) {
  const rows = [];
  const sections = Object.fromEntries(SECTIONS.map((s) => [s, { raw: 0, total: 0 }]));
  const modules = mock.modules.map((mod, moduleIndex) => {
    let raw = 0;
    mod.question_ids.forEach((id, index) => {
      const question = questionsById.get(id);
      const answer = answers[id] || {};
      const correct = isAnswerCorrect(question, answer.selected);
      if (correct) raw += 1;
      rows.push({
        id,
        moduleIndex,
        number: index + 1,
        section: mod.section,
        module: mod.module,
        selected: answer.selected ?? null,
        marked: Boolean(answer.marked),
        ms: Math.round(answer.ms || 0),
        correct,
      });
    });
    sections[mod.section].raw += raw;
    sections[mod.section].total += mod.question_ids.length;
    return { raw, total: mod.question_ids.length };
  });
  const rw = sections["Reading and Writing"];
  const math = sections.Math;
  const rwScore = scaleScore(rw.raw, rw.total, mock.assessment);
  const mathScore = scaleScore(math.raw, math.total, mock.assessment);
  return {
    rw: { ...rw, score: rwScore },
    math: { ...math, score: mathScore },
    total: rwScore + mathScore,
    modules,
    rows,
  };
}

/** Record every answer in the practice log and store the score report. */
export async function saveMockResult({ user, mock, sessionId, questionsById, answers }) {
  const score = scoreMock(mock, questionsById, answers);
  if (!user?.id) return score;

  const attempts = score.rows.map((row) => ({
    user_id: user.id,
    question_id: row.id,
    session_id: sessionId,
    selected: row.selected,
    is_correct: row.correct,
    ms_spent: row.ms,
    marked: row.marked,
  }));
  const { error: attemptError } = await supabase.from("sat_attempts").insert(attempts);
  if (attemptError) throw attemptError;

  const { error } = await supabase.from("sat_mock_results").upsert(
    {
      user_id: user.id,
      mock_id: mock.id,
      session_id: sessionId,
      rw_raw: score.rw.raw,
      rw_total: score.rw.total,
      math_raw: score.math.raw,
      math_total: score.math.total,
      rw_score: score.rw.score,
      math_score: score.math.score,
      total_score: score.total,
      answers,
    },
    { onConflict: "session_id" }
  );
  if (error) throw error;
  return score;
}

/*
 * In-progress sittings live in this browser only, like a Bluebook practice
 * test saved on one device. The clock is stored as time remaining, so it is
 * paused while the test is closed.
 */
function progressKey(user, mockId) {
  return `sat-mock-progress:${user?.id || "guest"}:${mockId}`;
}

export function loadProgress(user, mockId) {
  try {
    const raw = localStorage.getItem(progressKey(user, mockId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProgress(user, mockId, progress) {
  try {
    localStorage.setItem(progressKey(user, mockId), JSON.stringify(progress));
  } catch {
    // A full or blocked store only costs the ability to resume.
  }
}

export function clearProgress(user, mockId) {
  try {
    localStorage.removeItem(progressKey(user, mockId));
  } catch {
    // ignore
  }
}

export function newProgress(mock) {
  return {
    sessionId: crypto.randomUUID(),
    moduleIndex: 0,
    qIndex: 0,
    stage: "question",
    remainingMs: mock.modules[0].minutes * 60 * 1000,
    breakRemainingMs: BREAK_MS,
    answers: {},
    directionsSeen: [],
    startedAt: new Date().toISOString(),
  };
}

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
