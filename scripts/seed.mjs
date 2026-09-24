/**
 * Load the parsed question bank into Supabase. Idempotent: re-running upserts
 * by question id rather than duplicating rows.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeQuestion } from "../src/lib/question-content.js";

const here = dirname(fileURLToPath(import.meta.url));

// Minimal .env.local reader so seeding needs no extra dependency.
for (const line of readFileSync(join(here, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const satBank = JSON.parse(readFileSync(join(here, "bank.json"), "utf8"));
const psatBank = JSON.parse(readFileSync(join(here, "psat-bank.json"), "utf8"));
const bank = [
  ...satBank.map((question) => ({ assessment: "SAT", ...question })),
  ...psatBank,
];

const rows = bank.map(normalizeQuestion).map((q) => ({
  id: q.id,
  assessment: q.assessment,
  domain: q.domain,
  skill: q.skill,
  difficulty: q.difficulty,
  passage: q.passage,
  prompt: q.prompt,
  choices: q.choices,
  correct: q.correct,
  rationale: q.rationale,
  table_data: q.table_data,
  passage_html: q.passage_html || null,
  prompt_html: q.prompt_html || null,
  choices_html: q.choices_html || null,
  rationale_html: q.rationale_html || null,
}));

const SIZE = 100;
for (let i = 0; i < rows.length; i += SIZE) {
  const chunk = rows.slice(i, i + SIZE);
  const { error } = await supabase.from("sat_questions").upsert(chunk);
  if (error) {
    console.error("Failed at row", i, error.message);
    process.exit(1);
  }
  console.log(`seeded ${Math.min(i + SIZE, rows.length)}/${rows.length}`);
}
console.log("done");
