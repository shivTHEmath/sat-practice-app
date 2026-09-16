import { readFileSync } from "node:fs";
import { normalizeQuestion } from "../src/lib/question-content.js";

const raw = JSON.parse(readFileSync(new URL("./bank.json", import.meta.url), "utf8"));
const bank = raw.map(normalizeQuestion);
const errors = [];
const ids = new Set();
const letters = ["A", "B", "C", "D"];

for (const question of bank) {
  const label = question.id || "(missing id)";
  if (ids.has(question.id)) errors.push(`${label}: duplicate id`);
  ids.add(question.id);

  for (const field of ["id", "domain", "skill", "difficulty", "passage", "prompt", "rationale"]) {
    if (typeof question[field] !== "string" || !question[field].trim()) {
      errors.push(`${label}: missing ${field}`);
    }
  }
  if (!letters.includes(question.correct)) errors.push(`${label}: invalid correct answer`);
  for (const letter of letters) {
    if (typeof question.choices?.[letter] !== "string" || !question.choices[letter].trim()) {
      errors.push(`${label}: missing choice ${letter}`);
    }
  }

  const needsTable = /\btable\b/i.test(question.prompt);
  if (needsTable && !question.table_data) errors.push(`${label}: prompt references a missing table`);
  if (!needsTable && question.table_data) errors.push(`${label}: unexpected table data`);

  if (question.table_data) {
    const { caption, headers, rows } = question.table_data;
    if (typeof caption !== "string" || !caption.trim()) errors.push(`${label}: table has no caption`);
    if (!Array.isArray(headers) || headers.length < 2) errors.push(`${label}: invalid table headers`);
    if (!Array.isArray(rows) || !rows.length) errors.push(`${label}: table has no rows`);
    for (const [index, row] of (rows || []).entries()) {
      if (!Array.isArray(row) || row.length !== headers?.length) {
        errors.push(`${label}: table row ${index + 1} does not match its headers`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const tableCount = bank.filter((question) => question.table_data).length;
console.log(`Audited ${bank.length} questions: ${tableCount} tables, no structural errors.`);
