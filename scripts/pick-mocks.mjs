/**
 * Assemble fixed-form mocks from the question bank and append them to
 * scripts/<assessment>-mocks.json. Questions already used by any mock are never
 * reused, and with --prefer-unseen a user's answered questions are used only
 * when a slot has nothing fresh left.
 *
 * Usage:
 *   node scripts/pick-mocks.mjs psat 3
 *   node scripts/pick-mocks.mjs sat 5 --prefer-unseen shivsai
 * Then run `npm run seed-mocks`.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(here, "..", ".env.local"), "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const [kind, countArg, ...rest] = process.argv.slice(2);
const count = Number(countArg);
const unseenFor = rest[0] === "--prefer-unseen" ? rest[1] : null;
if (!["psat", "sat"].includes(kind) || !count) {
  console.error("Usage: node scripts/pick-mocks.mjs <psat|sat> <count> [--prefer-unseen <username>]");
  process.exit(1);
}
const assessment = kind.toUpperCase();

// ---------- Blueprints ----------

const RW_ORDER = [
  "Words in Context",
  "Text Structure and Purpose",
  "Cross-Text Connections",
  "Central Ideas and Details",
  "Command of Evidence",
  "Inferences",
  "Boundaries",
  "Form, Structure, and Sense",
  "Transitions",
  "Rhetorical Synthesis",
];

const ALG = "Algebra";
const ADV = "Advanced Math";
const PSDA = "Problem-Solving and Data Analysis";
const GEO = "Geometry and Trigonometry";

/*
 * Difficulty per skill slot, in RW_ORDER. PSAT follows a typical Bluebook
 * form: a balanced routing module, then the harder second module. SAT is
 * deliberately harder than Bluebook: both modules lean hard.
 */
const BLUEPRINTS = {
  PSAT: {
    rw: [
      ["EEMH", "EM", "M", "EM", "EMH", "MH", "EMH", "EEMH", "EMH", "MHH"],
      ["EMHH", "MH", "H", "MH", "MHH", "HH", "EMH", "EMHH", "MHH", "MMH"],
    ],
    // [domain, difficulty, student-produced response?]
    math: [
      [
        [ALG, "E", 1], [ALG, "E"], [ALG, "E"], [ALG, "M"], [ALG, "M"], [ALG, "M"], [ALG, "H", 1], [ALG, "H"],
        [ADV, "E"], [ADV, "E"], [ADV, "M", 1], [ADV, "M"], [ADV, "H", 1], [ADV, "H"], [ADV, "H"],
        [PSDA, "E"], [PSDA, "E"], [PSDA, "M", 1], [PSDA, "H"],
        [GEO, "M"], [GEO, "M"], [GEO, "H", 1],
      ],
      [
        [ALG, "E"], [ALG, "M", 1], [ALG, "M"], [ALG, "M"], [ALG, "H", 1], [ALG, "H"], [ALG, "H"], [ALG, "H"],
        [ADV, "E"], [ADV, "M"], [ADV, "M"], [ADV, "H", 1], [ADV, "H", 1], [ADV, "H"], [ADV, "H"],
        [PSDA, "E"], [PSDA, "M"], [PSDA, "H", 1], [PSDA, "H"],
        [GEO, "M"], [GEO, "H", 1], [GEO, "H"],
      ],
    ],
  },
  SAT: {
    // Module 1: 2 easy / 11 medium / 14 hard. Module 2: 0 / 5 / 22.
    rw: [
      ["EMHH", "MH", "H", "MH", "MHH", "MH", "MHH", "EMHH", "MMH", "MMH"],
      ["MHHH", "MH", "H", "HH", "HHH", "HH", "HHH", "MHHH", "MHH", "MHH"],
    ],
    // SAT Math weights Algebra and Advanced Math most heavily.
    math: [
      [
        [ALG, "E"], [ALG, "E", 1], [ALG, "M"], [ALG, "M", 1], [ALG, "M"], [ALG, "H"], [ALG, "H", 1], [ALG, "H"],
        [ADV, "E"], [ADV, "M"], [ADV, "M", 1], [ADV, "M"], [ADV, "H"], [ADV, "H", 1], [ADV, "H"], [ADV, "H"],
        [PSDA, "M"], [PSDA, "M"], [PSDA, "H", 1],
        [GEO, "M"], [GEO, "H"], [GEO, "H"],
      ],
      [
        [ALG, "M"], [ALG, "M", 1], [ALG, "H"], [ALG, "H", 1], [ALG, "H"], [ALG, "H"], [ALG, "H"], [ALG, "H"],
        [ADV, "M"], [ADV, "M"], [ADV, "H", 1], [ADV, "H"], [ADV, "H", 1], [ADV, "H"], [ADV, "H"], [ADV, "H"],
        [PSDA, "M"], [PSDA, "H"], [PSDA, "H", 1],
        [GEO, "H"], [GEO, "H", 1], [GEO, "H"],
      ],
    ],
  },
};

const DESCRIPTIONS = {
  SAT:
    "Harder than Bluebook: both modules lean toward hard questions, so expect a tougher test than the official Bluebook practice tests. Scores are estimated on a curve adjusted for the extra difficulty.",
};

// ---------- Data ----------

async function fetchAll(query) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query().range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const bank = (
  await fetchAll(() =>
    supabase
      .from("sat_questions")
      .select("id, test, domain, skill, difficulty, response_type")
      .eq("assessment", assessment)
      .order("id")
  )
).map((q) => ({ ...q, skill: q.skill.trim() }));

const outPath = join(here, `${kind}-mocks.json`);
const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : [];
const otherPath = join(here, `${kind === "psat" ? "sat" : "psat"}-mocks.json`);
const other = existsSync(otherPath) ? JSON.parse(readFileSync(otherPath, "utf8")) : [];
const used = new Set(
  [...existing, ...other].flatMap((m) => m.modules.flatMap((mod) => mod.question_ids))
);

let seen = new Set();
if (unseenFor) {
  const { data: user, error } = await supabase
    .from("sat_users")
    .select("id")
    .eq("username", unseenFor)
    .maybeSingle();
  if (error) throw error;
  if (user) {
    const attempts = await fetchAll(() =>
      supabase.from("sat_attempts").select("question_id").eq("user_id", user.id).order("id")
    );
    seen = new Set(attempts.map((a) => a.question_id));
  }
}

// ---------- Selection ----------

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260925 + existing.length * 97 + (kind === "sat" ? 7919 : 0));
const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const DIFF = { E: "Easy", M: "Medium", H: "Hard" };
// When a pool runs dry, borrow from the nearest difficulty.
const FALLBACK = { E: ["E", "M"], M: ["M", "H", "E"], H: ["H", "M"] };
let reusedSeen = 0;
const shifted = [];

/** Fresh questions first; a question the user has answered only as a fallback. */
function take(filter, label) {
  const pool = shuffle(bank.filter((q) => !used.has(q.id) && filter(q)));
  const fresh = pool.filter((q) => !seen.has(q.id));
  const choice = fresh[0] || pool[0];
  if (!choice) throw new Error(`Not enough questions for ${label}`);
  if (!fresh.length) reusedSeen += 1;
  used.add(choice.id);
  return choice;
}

function takeNearest(d, filter, label) {
  for (const option of FALLBACK[d]) {
    if (bank.some((q) => !used.has(q.id) && filter(q, DIFF[option]))) {
      if (option !== d) shifted.push(`${label}: ${DIFF[d]} -> ${DIFF[option]}`);
      return take((q) => filter(q, DIFF[option]), `${label} ${DIFF[option]}`);
    }
  }
  throw new Error(`Not enough questions for ${label} ${DIFF[d]}`);
}

function buildRw(plan) {
  const out = [];
  RW_ORDER.forEach((skill, i) => {
    for (const d of plan[i]) {
      out.push(
        takeNearest(
          d,
          (q, difficulty) =>
            q.test === "Reading and Writing" && q.skill === skill && q.difficulty === difficulty,
          skill
        )
      );
    }
  });
  // Within each skill, keep Bluebook's easy-to-hard order.
  const rank = { Easy: 0, Medium: 1, Hard: 2 };
  return out
    .map((q, i) => ({ q, i }))
    .sort((a, b) =>
      RW_ORDER.indexOf(a.q.skill) - RW_ORDER.indexOf(b.q.skill) ||
      rank[a.q.difficulty] - rank[b.q.difficulty] ||
      a.i - b.i
    )
    .map(({ q }) => q);
}

function buildMath(plan) {
  const skillUse = new Map();
  const picked = plan.map(([domain, d, spr]) => {
    const type = spr ? "student_produced_response" : "multiple_choice";
    const level = FALLBACK[d].find((option) =>
      bank.some(
        (q) =>
          !used.has(q.id) && q.test === "Math" && q.domain === domain &&
          q.difficulty === DIFF[option] && q.response_type === type
      )
    );
    if (!level) throw new Error(`Not enough questions for ${domain} ${DIFF[d]} ${type}`);
    if (level !== d) shifted.push(`${domain} ${type}: ${DIFF[d]} -> ${DIFF[level]}`);
    const matches = (q) =>
      q.test === "Math" && q.domain === domain && q.difficulty === DIFF[level] && q.response_type === type;
    // Spread skills within a domain: prefer the least-used skill in this module.
    const skills = [...new Set(bank.filter((q) => matches(q) && !used.has(q.id)).map((q) => q.skill))];
    const skill = shuffle(skills).sort((a, b) => (skillUse.get(a) || 0) - (skillUse.get(b) || 0))[0];
    const q = take((row) => matches(row) && (!skill || row.skill === skill), `${domain} ${DIFF[d]} ${type}`);
    skillUse.set(q.skill, (skillUse.get(q.skill) || 0) + 1);
    return q;
  });
  const rank = { Easy: 0, Medium: 1, Hard: 2 };
  return [0, 1, 2].flatMap((k) => shuffle(picked.filter((q) => rank[q.difficulty] === k)));
}

const blueprint = BLUEPRINTS[assessment];
const hasMath = bank.some((q) => q.test === "Math");
if (!hasMath) throw new Error(`The bank has no ${assessment} Math questions yet.`);

const created = [];
for (let n = 0; n < count; n += 1) {
  const number = existing.length + created.length + 1;
  const modules = [
    ...blueprint.rw.map((plan, i) => ({ section: "Reading and Writing", module: i + 1, minutes: 32, questions: buildRw(plan) })),
    ...blueprint.math.map((plan, i) => ({ section: "Math", module: i + 1, minutes: 35, questions: buildMath(plan) })),
  ];
  created.push({ number, modules });
}

const output = created.map(({ number, modules }) => ({
  id: `${kind}-mock-${number}`,
  name: `${assessment} Mock ${number}`,
  assessment,
  description: DESCRIPTIONS[assessment] || null,
  sort_order: (kind === "psat" ? 0 : 100) + number,
  modules: modules.map((mod) => ({
    section: mod.section,
    module: mod.module,
    minutes: mod.minutes,
    question_ids: mod.questions.map((q) => q.id),
  })),
}));

writeFileSync(outPath, `${JSON.stringify([...existing, ...output], null, 2)}\n`);

for (const [i, mock] of output.entries()) {
  console.log(`\n${mock.name}`);
  created[i].modules.forEach((mod) => {
    const c = { Easy: 0, Medium: 0, Hard: 0 };
    mod.questions.forEach((q) => c[q.difficulty]++);
    const spr = mod.questions.filter((q) => q.response_type === "student_produced_response").length;
    console.log(
      `  ${mod.section} M${mod.module}: ${mod.questions.length} Q  E${c.Easy}/M${c.Medium}/H${c.Hard}${spr ? `  SPR ${spr}` : ""}`
    );
  });
}
if (shifted.length) console.log(`\nDifficulty shifts where a pool ran out (${shifted.length}):\n  ${shifted.join("\n  ")}`);
if (unseenFor) console.log(`\nSlots that had to reuse a question ${unseenFor} already answered: ${reusedSeen}`);
console.log(`Wrote ${outPath}`);
