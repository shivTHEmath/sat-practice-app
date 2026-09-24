import { readFileSync } from "node:fs";
import { normalizeQuestion } from "../src/lib/question-content.js";
import { parsePassage } from "../src/lib/passage-structure.js";

const sat = JSON.parse(readFileSync(new URL("./bank.json", import.meta.url), "utf8"))
  .map((question) => ({ assessment: "SAT", ...question }));
const psat = JSON.parse(readFileSync(new URL("./psat-bank.json", import.meta.url), "utf8"));
const raw = [...sat, ...psat];
const bank = raw.map(normalizeQuestion);
const errors = [];
const ids = new Set();
const letters = ["A", "B", "C", "D"];

for (const question of bank) {
  const label = question.id || "(missing id)";
  if (ids.has(question.id)) errors.push(`${label}: duplicate id`);
  ids.add(question.id);

  for (const field of ["id", "assessment", "domain", "skill", "difficulty", "passage", "prompt", "rationale"]) {
    if (typeof question[field] !== "string" || !question[field].trim()) {
      errors.push(`${label}: missing ${field}`);
    }
  }
  if (!["SAT", "PSAT"].includes(question.assessment)) errors.push(`${label}: invalid assessment`);
  if (!letters.includes(question.correct)) errors.push(`${label}: invalid correct answer`);
  for (const letter of letters) {
    if (typeof question.choices?.[letter] !== "string" || !question.choices[letter].trim()) {
      errors.push(`${label}: missing choice ${letter}`);
    }
  }

  const needsTable = /\btable\b/i.test(question.prompt);
  const hasRichTable = /<table\b/i.test(question.passage_html || "");
  if (needsTable && !question.table_data && !hasRichTable) errors.push(`${label}: prompt references a missing table`);
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

  const passage = parsePassage(question.passage);
  if (!question.passage_html && /^Text 1\b/i.test(question.passage) && passage.type !== "paired") {
    errors.push(`${label}: paired texts could not be separated`);
  }
  if (!question.passage_html && /^While researching a topic, a student has taken the following notes:/i.test(question.passage)) {
    if (passage.type !== "notes" || passage.items.length < 2) {
      errors.push(`${label}: research notes could not be structured`);
    }
  }
}

const assessmentCounts = raw.reduce((counts, question) => {
  counts[question.assessment] = (counts[question.assessment] || 0) + 1;
  return counts;
}, {});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const tableCount = bank.filter((question) => question.table_data).length;
const pairedCount = bank.filter((question) => parsePassage(question.passage).type === "paired").length;
const notesCount = bank.filter((question) => parsePassage(question.passage).type === "notes").length;
console.log(`Audited ${bank.length} questions (${assessmentCounts.SAT} SAT, ${assessmentCounts.PSAT} PSAT): ${tableCount} structured tables, ${pairedCount} paired passages, ${notesCount} note sets, no structural errors.`);
