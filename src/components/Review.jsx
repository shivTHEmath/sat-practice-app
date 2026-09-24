"use client";

import { useState } from "react";
import QuestionContent from "./QuestionContent";
import RichText from "./RichText";
import { clock, seconds } from "@/lib/format";

const LETTERS = ["A", "B", "C", "D"];

export default function Review({ questions, answers, totalMs, onDone }) {
  const [open, setOpen] = useState(null);

  const correct = answers.filter((a, i) => a.selected === questions[i].correct).length;
  const pct = Math.round((correct / questions.length) * 100);
  const times = answers.map((a) => a.ms);
  const slowest = Math.max(...times, 1);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold">
        {correct} of {questions.length} correct ({pct}%)
      </h1>
      <p className="mt-1 text-bb-muted">
        {clock(totalMs)} total · {seconds(avg)} average per question
      </p>

      <div className="mt-6 space-y-2">
        {questions.map((q, i) => {
          const a = answers[i];
          const right = a.selected === q.correct;
          const expanded = open === i;
          return (
            <div key={q.id} className="rounded-lg border border-bb-line">
              <button
                onClick={() => setOpen(expanded ? null : i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className={`grid h-7 w-7 flex-none place-items-center rounded-full text-sm font-bold text-white ${
                    right ? "bg-bb-correct" : "bg-bb-wrong"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm">
                  {q.assessment || "SAT"} · {q.skill} · {q.difficulty}
                  {a.marked ? " · ★" : ""}
                </span>
                <span className="flex-none text-sm tabular-nums text-bb-muted">
                  {a.selected ? a.selected : "blank"} / {q.correct}
                </span>
                {/* Time bar makes the slow questions obvious at a glance. */}
                <span className="h-2 w-28 flex-none overflow-hidden rounded bg-neutral-200">
                  <span
                    className="block h-full bg-bb-blue"
                    style={{ width: `${(a.ms / slowest) * 100}%` }}
                  />
                </span>
                <span className="w-16 flex-none text-right text-sm tabular-nums text-bb-muted">
                  {seconds(a.ms)}
                </span>
              </button>

              {expanded ? (
                <div className="border-t border-bb-line px-4 py-4">
                  <div className="text-[1.02rem] leading-[1.7]">
                    <QuestionContent question={q} />
                  </div>
                  <RichText className="mt-4 font-semibold" html={q.prompt_html} fallback={q.prompt} />
                  <div className="mt-3 space-y-2">
                    {LETTERS.map((l) => {
                      const isCorrect = l === q.correct;
                      const isPicked = a.selected === l;
                      return (
                        <div
                          key={l}
                          className="review-choice rounded border px-3 py-2 text-[0.98rem]"
                          data-state={isCorrect ? "correct" : isPicked ? "wrong" : undefined}
                        >
                          <span className="font-bold">{l}.</span>{" "}
                          <RichText
                            className="inline-rich-text"
                            html={q.choices_html?.[l]}
                            fallback={q.choices[l]}
                          />
                          {isPicked ? (
                            <span className="ml-2 text-xs text-bb-muted">your answer</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <RichText
                    className="mt-4 text-[0.98rem] leading-[1.65] text-bb-muted"
                    html={q.rationale_html}
                    fallback={q.rationale}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <button onClick={onDone} className="bb-btn-primary mt-8">
        Back to practice
      </button>
    </div>
  );
}
