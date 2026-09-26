"use client";

import { useEffect, useMemo, useState } from "react";
import QuestionContent from "../QuestionContent";
import RichText from "../RichText";
import { ChevronIcon, CloseIcon } from "./icons";
import { acceptedAnswers, isSpr, moduleTitle, scoreMock, scoreRange } from "@/lib/mock";

const LETTERS = ["A", "B", "C", "D"];
const FILTERS = [
  ["all", "All"],
  ["Reading and Writing", "Reading and Writing"],
  ["Math", "Math"],
  ["incorrect", "Incorrect"],
  ["omitted", "Omitted"],
  ["marked", "Marked"],
];

function formatSeconds(ms) {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

function ReviewQuestion({ row, question, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const spr = isSpr(question);
  const isMath = question.test === "Math";

  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div className="mk-modal-backdrop" onMouseDown={onClose}>
      <div className="mk-review-sheet" role="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mk-review-sheet-head">
          <div>
            <div className="mk-review-sheet-kicker">
              {moduleTitle({ section: row.section, module: row.module })} · Question {row.number}
            </div>
            <div className="mk-review-sheet-meta">
              {question.domain} · {question.skill} · {question.difficulty}
            </div>
          </div>
          <div className="mk-review-sheet-nav">
            <button type="button" className="mk-icon-btn" disabled={!hasPrev} onClick={onPrev} aria-label="Previous question">
              <span className="mk-rot90"><ChevronIcon up /></span>
            </button>
            <button type="button" className="mk-icon-btn" disabled={!hasNext} onClick={onNext} aria-label="Next question">
              <span className="mk-rot-90"><ChevronIcon up /></span>
            </button>
            <button type="button" className="mk-icon-btn" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className={isMath ? "mk-review-sheet-body" : "mk-review-sheet-body mk-review-sheet-split"}>
          {!isMath ? (
            <div className="mk-review-passage">
              <QuestionContent question={question} />
            </div>
          ) : null}
          <div className="mk-review-question">
            {isMath && question.passage_html ? (
              <div className="mk-stimulus">
                <QuestionContent question={question} />
              </div>
            ) : null}
            <div className="mk-prompt">
              <RichText html={question.prompt_html} fallback={question.prompt} />
            </div>
            {spr ? (
              <div className="mk-review-spr">
                <div>
                  Your answer:{" "}
                  <strong data-state={row.correct ? "correct" : "wrong"}>
                    {row.selected || "Omitted"}
                  </strong>
                </div>
                <div>
                  Correct answer: <strong>{acceptedAnswers(question).join(", ")}</strong>
                </div>
              </div>
            ) : (
              <div className="mk-choices">
                {LETTERS.filter((l) => question.choices?.[l] != null).map((letter) => {
                  let state;
                  if (letter === question.correct) state = "correct";
                  else if (letter === row.selected) state = "wrong";
                  return (
                    <div key={letter} className="mk-choice-row">
                      <div className="mk-choice mk-choice-static" data-state={state}>
                        <span className="mk-choice-letter">{letter}</span>
                        <span className="mk-choice-text">
                          <RichText html={question.choices_html?.[letter]} fallback={question.choices[letter]} />
                        </span>
                      </div>
                      <span className="mk-choice-tag">
                        {state === "correct" ? "Correct" : state === "wrong" ? "Your answer" : ""}
                      </span>
                    </div>
                  );
                })}
                {!row.selected ? <p className="mk-omitted">You didn’t answer this question.</p> : null}
              </div>
            )}
            <div className="mk-rationale">
              <h4>Explanation</h4>
              <RichText html={question.rationale_html} fallback={question.rationale} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Score report: estimated scaled scores, module raw scores, answer review. */
export default function MockResults({ mock, questionsById, answers, onHome }) {
  const score = useMemo(() => scoreMock(mock, questionsById, answers), [mock, questionsById, answers]);
  const range = scoreRange(mock.assessment);
  const [filter, setFilter] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);

  const rows = score.rows.filter((row) => {
    if (filter === "all") return true;
    if (filter === "incorrect") return row.selected && !row.correct;
    if (filter === "omitted") return !row.selected;
    if (filter === "marked") return row.marked;
    return row.section === filter;
  });
  const open = openIndex != null ? rows[openIndex] : null;

  return (
    <div className="mk-results">
      <header className="mk-home-header">
        <div className="mk-home-brand">Mock Tests</div>
        <button type="button" className="mk-btn-outline" onClick={onHome}>
          Back to Mock Tests
        </button>
      </header>

      <main className="mk-results-main">
        <h1>{mock.name}: Score Details</h1>
        <section className="mk-score-card">
          <div className="mk-score-total">
            <div className="mk-score-label">Your Total Score</div>
            <div className="mk-score-number">{score.total}</div>
            <div className="mk-score-range">{range.total}</div>
          </div>
          <div className="mk-score-sections">
            <div>
              <div className="mk-score-label">Reading and Writing</div>
              <div className="mk-score-number mk-score-sm">{score.rw.score}</div>
              <div className="mk-score-range">
                {range.section} · {score.rw.raw} of {score.rw.total} correct
              </div>
            </div>
            <div>
              <div className="mk-score-label">Math</div>
              <div className="mk-score-number mk-score-sm">{score.math.score}</div>
              <div className="mk-score-range">
                {range.section} · {score.math.raw} of {score.math.total} correct
              </div>
            </div>
          </div>
          <p className="mk-score-note">
            {mock.assessment === "SAT"
              ? "Estimated score. This mock is harder than Bluebook’s practice tests, so the estimate uses a more generous curve than a standard SAT form. Official scoring for adaptive tests isn’t published."
              : "Estimated score. Official PSAT scores come from College Board’s adaptive scoring, which isn’t published; this estimate uses a fixed curve for a harder-route Module 2."}
          </p>
        </section>

        <section className="mk-module-scores">
          {mock.modules.map((mod, i) => (
            <div key={i} className="mk-module-score">
              <div>{moduleTitle(mod)}</div>
              <strong>
                {score.modules[i].raw} / {score.modules[i].total}
              </strong>
            </div>
          ))}
        </section>

        <section>
          <div className="mk-filter-row" role="tablist">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => {
                  setFilter(key);
                  setOpenIndex(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <table className="mk-answer-table">
            <thead>
              <tr>
                <th scope="col">Question</th>
                <th scope="col">Section</th>
                <th scope="col">Correct Answer</th>
                <th scope="col">Your Answer</th>
                <th scope="col">Time</th>
                <th scope="col" aria-label="Review" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const question = questionsById.get(row.id);
                return (
                  <tr key={row.id}>
                    <td>{row.number}</td>
                    <td>
                      {row.section}, Module {row.module}
                    </td>
                    <td>{isSpr(question) ? acceptedAnswers(question).join(", ") : question.correct}</td>
                    <td>
                      <span className="mk-answer-pill" data-state={!row.selected ? "omitted" : row.correct ? "correct" : "wrong"}>
                        {row.selected || "Omitted"}
                        {row.selected ? (row.correct ? " · Correct" : " · Incorrect") : ""}
                      </span>
                      {row.marked ? <span className="mk-answer-marked">Marked</span> : null}
                    </td>
                    <td>{formatSeconds(row.ms)}</td>
                    <td>
                      <button type="button" className="mk-btn-outline mk-btn-sm" onClick={() => setOpenIndex(i)}>
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length ? <p className="mk-empty">No questions match this filter.</p> : null}
        </section>
      </main>

      {open ? (
        <ReviewQuestion
          row={open}
          question={questionsById.get(open.id)}
          onClose={() => setOpenIndex(null)}
          hasPrev={openIndex > 0}
          hasNext={openIndex < rows.length - 1}
          onPrev={() => setOpenIndex((i) => i - 1)}
          onNext={() => setOpenIndex((i) => i + 1)}
        />
      ) : null}
    </div>
  );
}
