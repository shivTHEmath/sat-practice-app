/** Upsert the generated Math bank with a service-role key. */
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
const rows = JSON.parse(readFileSync(join(here, "math-bank.json"), "utf8"));
const size = 100;
for (let start = 0; start < rows.length; start += size) {
  const { error } = await supabase.from("sat_questions").upsert(rows.slice(start, start + size));
  if (error) throw error;
  console.log(`seeded ${Math.min(start + size, rows.length)}/${rows.length}`);
}
console.log("Math bank seeded successfully");
