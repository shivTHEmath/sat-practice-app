/** Upsert the fixed-form mock exams in scripts/psat-mocks.json. */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(here, "..", ".env.local"), "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const mocks = JSON.parse(readFileSync(join(here, "psat-mocks.json"), "utf8"));

// Every referenced question must exist before a mock can point at it.
const ids = [...new Set(mocks.flatMap((m) => m.modules.flatMap((mod) => mod.question_ids)))];
const { data: found, error: lookupError } = await supabase
  .from("sat_questions")
  .select("id")
  .in("id", ids);
if (lookupError) throw lookupError;
const missing = ids.filter((id) => !found.some((row) => row.id === id));
if (missing.length) throw new Error(`Missing questions: ${missing.join(", ")}`);

const { error } = await supabase.from("sat_mocks").upsert(mocks);
if (error) throw error;
console.log(`seeded ${mocks.length} mocks (${ids.length} unique questions)`);
