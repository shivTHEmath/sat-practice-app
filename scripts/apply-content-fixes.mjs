import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_CONTENT_FIXES } from "../src/lib/question-content.js";

const here = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(here, "..", ".env.local"), "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing configured Supabase maintenance values");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const allowedFields = ["passage", "choices", "table_data"];

for (const [id, fix] of Object.entries(QUESTION_CONTENT_FIXES)) {
  const patch = Object.fromEntries(
    allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(fix, field)).map((field) => [field, fix[field]])
  );
  const { data, error } = await supabase
    .from("sat_questions")
    .update(patch)
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw new Error(`${id}: ${error.message}`);
  if (data.id !== id) throw new Error(`${id}: update could not be verified`);
  console.log(`updated ${id}`);
}

console.log(`done: ${Object.keys(QUESTION_CONTENT_FIXES).length} targeted questions updated`);
