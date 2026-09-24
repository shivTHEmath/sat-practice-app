import { supabase } from "./supabase";
import { normalizeQuestion } from "./question-content";

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export const DOMAINS = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
];

export const SKILLS_BY_DOMAIN = {
  "Information and Ideas": [
    "Central Ideas and Details",
    "Command of Evidence",
    "Inferences",
  ],
  "Craft and Structure": [
    "Cross-Text Connections",
    "Text Structure and Purpose",
    "Words in Context",
  ],
  "Expression of Ideas": ["Rhetorical Synthesis", "Transitions"],
  "Standard English Conventions": ["Boundaries", "Form, Structure, and Sense"],
};

export const SKILLS = DOMAINS.flatMap((domain) => SKILLS_BY_DOMAIN[domain]);

/** Real Bluebook R&W module shape: 27 questions in 32 minutes. */
export const MODULE_LENGTHS = [
  { key: "full", label: "Full module", count: 27, minutes: 32 },
  { key: "half", label: "Half module", count: 14, minutes: 16 },
  { key: "third", label: "Third module", count: 9, minutes: 11 },
];

/**
 * A real R&W module runs in domain order, roughly 13 / 14 / 21 / 22 percent
 * of questions per domain. Keeping that order makes a practice set feel like
 * the test even when it is shorter.
 */
const DOMAIN_SHARE = {
  "Information and Ideas": 0.26,
  "Craft and Structure": 0.28,
  "Expression of Ideas": 0.2,
  "Standard English Conventions": 0.26,
};

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let questionBankPromise;

/**
 * The bank is small enough to keep in memory. Fetching it once avoids the old
 * two-request cycle on every refill (all matching ids, then selected rows).
 */
function loadQuestionBank() {
  if (!questionBankPromise) {
    questionBankPromise = supabase
      .from("sat_questions")
      .select("*")
      .then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(normalizeQuestion);
      })
      .catch((error) => {
        questionBankPromise = undefined;
        throw error;
      });
  }
  return questionBankPromise;
}

/**
 * Pick `count` question ids honouring the domain mix, falling back to whatever
 * is available when a filter leaves a domain short.
 */
function pickIds(rows, count, weighted) {
  if (!weighted) return shuffle(rows.map((r) => r.id)).slice(0, count);

  const byDomain = new Map();
  for (const row of rows) {
    if (!byDomain.has(row.domain)) byDomain.set(row.domain, []);
    byDomain.get(row.domain).push(row.id);
  }

  const picked = [];
  const leftovers = [];
  for (const domain of DOMAINS) {
    const pool = shuffle(byDomain.get(domain) || []);
    const want = Math.round(count * (DOMAIN_SHARE[domain] || 0));
    picked.push(...pool.slice(0, want));
    leftovers.push(...pool.slice(want));
  }

  // Rounding and thin domains can leave the set over or under length.
  const filled = picked.concat(shuffle(leftovers));
  return filled.slice(0, Math.min(count, rows.length));
}

/** Order a set the way a module does: by domain, as the real test groups them. */
function orderLikeModule(questions) {
  const rank = new Map(DOMAINS.map((d, i) => [d, i]));
  return [...questions].sort(
    (a, b) => (rank.get(a.domain) ?? 9) - (rank.get(b.domain) ?? 9)
  );
}

/** Build a filtered question set from the cached bank. */
export async function buildSession({
  difficulties,
  domains,
  skills,
  count,
  weighted,
  exclude = [],
  skip = [],
}) {
  const bank = await loadQuestionBank();
  const skipped = new Set(skip);
  const candidates = bank.filter(
    (question) =>
      !skipped.has(question.id) &&
      (!difficulties?.length || difficulties.includes(question.difficulty)) &&
      (!domains?.length || domains.includes(question.domain)) &&
      (!skills?.length || skills.includes(question.skill))
  );
  if (!candidates?.length) return [];

  // Endless practice keeps pulling from the same filters without repeating a
  // question until the matching pool runs dry.
  const seen = new Set(exclude);
  let fresh = candidates.filter((c) => !seen.has(c.id));
  if (!fresh.length) fresh = candidates;

  const ids = pickIds(fresh, count, weighted);
  const byId = new Map(bank.map((q) => [q.id, q]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  return weighted ? orderLikeModule(ordered) : ordered;
}

export async function getQuestionById(questionId) {
  const bank = await loadQuestionBank();
  return bank.find((question) => question.id === questionId) || null;
}

async function loadAttemptRows(userId) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("sat_attempts")
      .select("question_id, selected, is_correct, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

/** Correct questions are mastered; only unresolved misses stay reviewable. */
export async function loadPracticeHistory(userId) {
  if (!userId) return { correctIds: [], missed: [] };

  const [attempts, bank] = await Promise.all([loadAttemptRows(userId), loadQuestionBank()]);
  const questionsById = new Map(bank.map((question) => [question.id, question]));
  const summaries = new Map();

  for (const attempt of attempts) {
    let summary = summaries.get(attempt.question_id);
    if (!summary) {
      summary = {
        questionId: attempt.question_id,
        latestAt: attempt.created_at,
        lastSelected: attempt.selected,
        correctEver: false,
        wrongEver: false,
      };
      summaries.set(attempt.question_id, summary);
    }
    if (attempt.is_correct) summary.correctEver = true;
    if (attempt.is_correct === false) summary.wrongEver = true;
  }

  return {
    correctIds: [...summaries.values()]
      .filter((summary) => summary.correctEver)
      .map((summary) => summary.questionId),
    missed: [...summaries.values()]
      .filter(
        (summary) =>
          summary.wrongEver &&
          !summary.correctEver &&
          questionsById.has(summary.questionId)
      )
      .map((summary) => ({ ...summary, question: questionsById.get(summary.questionId) })),
  };
}

/** Find or create a user by bare username. No password by design. */
export async function signIn(username) {
  const name = username.trim().toLowerCase();
  if (!name) throw new Error("Enter a username.");

  const { data: existing, error } = await supabase
    .from("sat_users")
    .select("*")
    .eq("username", name)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: created, error: insErr } = await supabase
    .from("sat_users")
    .insert({ username: name })
    .select()
    .single();
  // A second tab can win the race; fall back to reading the row it made.
  if (insErr) {
    const { data: retry } = await supabase
      .from("sat_users")
      .select("*")
      .eq("username", name)
      .maybeSingle();
    if (retry) return retry;
    throw insErr;
  }
  return created;
}

export async function saveAttempts(rows) {
  if (!rows.length) return;
  const { error } = await supabase.from("sat_attempts").insert(rows);
  if (error) throw error;
}

/** Per-skill accuracy across everything this user has ever answered. */
export async function loadStats(userId) {
  const { data, error } = await supabase
    .from("sat_attempts")
    .select("is_correct, ms_spent, question_id, sat_questions (skill, difficulty)")
    .eq("user_id", userId);
  if (error) throw error;

  const bySkill = new Map();
  const byDifficulty = new Map();
  let total = 0;
  let correct = 0;
  let ms = 0;

  const add = (map, key, row) => {
    if (!map.has(key)) map.set(key, { key, total: 0, correct: 0, ms: 0 });
    const bucket = map.get(key);
    bucket.total += 1;
    bucket.ms += row.ms_spent || 0;
    if (row.is_correct) bucket.correct += 1;
  };

  for (const row of data) {
    add(bySkill, row.sat_questions?.skill || "Unknown", row);
    add(byDifficulty, row.sat_questions?.difficulty || "Unknown", row);
    total += 1;
    ms += row.ms_spent || 0;
    if (row.is_correct) correct += 1;
  }

  return {
    total,
    correct,
    ms,
    skills: [...bySkill.values()].sort((a, b) => b.total - a.total),
    difficulties: DIFFICULTIES.map((d) => byDifficulty.get(d)).filter(Boolean),
  };
}
