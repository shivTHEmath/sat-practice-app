/**
 * Notes-style Reading and Writing passages ("While researching a topic, a
 * student has taken the following notes:") were imported as flattened text,
 * so their bullets had to be guessed by sentence splitting. This fetches each
 * one's original HTML list from College Board's question bank and stores it
 * as passage_html, after checking the source text matches what is stored.
 *
 * Usage:
 *   node scripts/backfill-notes-html.mjs [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(here, "..", ".env.local"), "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}
const dryRun = process.argv.includes("--dry-run");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const NOTES_PREFIX = "While researching a topic, a student has taken the following notes:";
const API = "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank";
const ASSESSMENT_IDS = { SAT: 99, PSAT: 100 };

async function post(path, body) {
  const response = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} from ${path}`);
  return response.json();
}

function cleanHtml(value) {
  return String(value || "")
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

const ENTITIES = { "&ldquo;": "“", "&rdquo;": "”", "&lsquo;": "‘", "&rsquo;": "’", "&mdash;": "—", "&ndash;": "–", "&nbsp;": " ", "&amp;": "&" };

/** Drop screen-reader-only copies and join sub/superscripts to their base (NH<sub>3</sub> -> NH3). */
function visibleText(text) {
  return text
    .replace(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<\/?(?:sub|sup)>/gi, "")
    .replace(/&sup([123]);/g, "$1");
}

/** Letters and digits only, so quote styles and spacing never block a match. */
function fingerprint(text) {
  return visibleText(text)
    .replace(/<[^>]+>/g, " ")
    // Accented letters (&oacute;, &aacute;, ...) keep their base letter.
    .replace(/&([a-z])(?:acute|grave|circ|tilde|uml|cedil|ring);/gi, "$1")
    .replace(/&[a-z]+;/g, (entity) => ENTITIES[entity] || " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]/g, "")
    .toLowerCase();
}

/** The same words in any order: an earlier content fix may have reordered notes. */
function wordBag(text) {
  return visibleText(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z])(?:acute|grave|circ|tilde|uml|cedil|ring);/gi, "$1")
    .replace(/&[a-z]+;/g, " ")
    .normalize("NFKD")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

const { data: rows, error } = await supabase
  .from("sat_questions")
  .select("id, assessment, passage")
  .eq("test", "Reading and Writing")
  .is("passage_html", null)
  .like("passage", `${NOTES_PREFIX}%`);
if (error) throw error;
console.log(`${rows.length} plain-text notes passages`);

const metadata = new Map();
for (const assessment of [...new Set(rows.map((r) => r.assessment))]) {
  const list = await post("digital/get-questions", {
    asmtEventId: ASSESSMENT_IDS[assessment],
    test: 1,
    domain: "INI,CAS,EOI,SEC",
  });
  for (const item of list) metadata.set(item.questionId, item);
}

const targets = rows.filter((row) => metadata.get(row.id)?.external_id);
const details = new Map();
for (let start = 0; start < targets.length; start += 25) {
  const group = targets.slice(start, start + 25).map((row) => metadata.get(row.id).external_id);
  for (const detail of await post("pdf-download", { external_ids: group })) {
    details.set(detail.externalid, detail);
  }
}

let updated = 0;
const skipped = [];
const reordered = [];
for (const row of targets) {
  const html = cleanHtml(details.get(metadata.get(row.id).external_id)?.stimulus);
  if (!/<li\b/i.test(html)) {
    skipped.push(`${row.id}: source has no list`);
    continue;
  }
  if (fingerprint(html) !== fingerprint(row.passage)) {
    if (wordBag(html) !== wordBag(row.passage)) {
      skipped.push(`${row.id}: source text differs from the stored passage`);
      continue;
    }
    reordered.push(row.id);
  }
  if (!dryRun) {
    const { error: updateError } = await supabase.from("sat_questions").update({ passage_html: html }).eq("id", row.id);
    if (updateError) throw updateError;
  }
  updated += 1;
}

console.log(`${dryRun ? "Would update" : "Updated"} ${updated} passages`);
const unmatched = rows.length - targets.length;
if (unmatched) console.log(`${unmatched} have no digital source record`);
if (reordered.length) console.log(`Same words in a different order (source order used): ${reordered.join(", ")}`);
if (skipped.length) console.log(`Skipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);
