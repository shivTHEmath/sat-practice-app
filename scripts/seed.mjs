/**
 * Load the parsed question bank into Supabase. Idempotent: re-running upserts
 * by question id rather than duplicating rows.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
const bank = JSON.parse(readFileSync(join(here, "bank.json"), "utf8"));

const rows = bank.map((q) => ({
  id: q.id,
  domain: q.domain,
  skill: q.skill,
  difficulty: q.difficulty,
  passage: q.passage,
  prompt: q.prompt,
  choices: q.choices,
  correct: q.correct,
  rationale: q.rationale,
  table_data: q.table ?? null,
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
