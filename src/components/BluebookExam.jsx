"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Passage from "./Passage";
import RichText from "./RichText";

const LETTERS = ["A", "B", "C", "D"];

/**
 * The exam chrome: header with clock, a draggable split of
 * passage and question, and the footer navigator. Purely presentational so the
 * same frame serves endless practice and fixed-length tests.
 */
export default function BluebookExam({
  username,
  moduleLabel,
  timeLabel,
  question,
  qNumber,
  total,
  answer,
  instantCheck,
  examTools,
  states,
  onChoose,
  onToggleCross,
  onToggleMark,
  onBack,
  onNext,
  onJump,
  onFinish,
  canBack,
  canNext,
  primaryLabel = "Next",
  toolbar,
  filters,
}) {
  const [split, setSplit] = useState(50);
  const [timerHidden, setTimerHidden] = useState(false);
  const [crossOutOn, setCrossOutOn] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const dragging = useRef(false);
  const shellRef = useRef(null);
  const passageRef = useRef(null);
  const questionRef = useRef(null);
  const revealed = instantCheck && answer.checked;
  const gotItRight = answer.selected === question.correct;

  // Bluebook lets you drag the divider between the two panes.
  const onMove = useCallback((event) => {
    if (!dragging.current || !shellRef.current) return;
    const box = shellRef.current.getBoundingClientRect();
    const pct = ((event.clientX - box.left) / box.width) * 100;
    setSplit(Math.min(75, Math.max(25, pct)));
  }, []);

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [onMove]);

  useEffect(() => {
    passageRef.current?.scrollTo(0, 0);
    questionRef.current?.scrollTo(0, 0);
    setCrossOutOn(false);
  }, [question.id]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const letter = event.key.toUpperCase();
      if (LETTERS.includes(letter) && !revealed) {
        event.preventDefault();
        onChoose(letter);
      } else if ((event.key === "Enter" || event.key === "ArrowRight") && canNext) {
        event.preventDefault();
        onNext();
      } else if (event.key === "ArrowLeft" && examTools && canBack) {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [revealed, canNext, canBack, examTools, onChoose, onNext, onBack]);

  return (
    <div className="exam-shell">
      <header className="exam-header">
        <div className="exam-header-row">
          <div className="exam-title">
            <div>{moduleLabel}</div>
          </div>

          <div className="exam-timer">
            <div className="timer-value">
              {timerHidden ? " " : timeLabel}
            </div>
            <button
              onClick={() => setTimerHidden((v) => !v)}
              className="timer-toggle"
            >
              {timerHidden ? "Show" : "Hide"}
            </button>
          </div>

          <div className="exam-tools">
            {toolbar}
          </div>
        </div>

        <div className="bb-rule-dashed" />
      </header>

      {filters}

      <main ref={shellRef} className="flex min-h-0 flex-1">
        <section
          ref={passageRef}
          style={{ width: `${split}%` }}
          className="passage-pane"
        >
          <Passage question={question} highlightOn />
        </section>

        <div
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.cursor = "col-resize";
          }}
          role="separator"
          aria-orientation="vertical"
          className="w-px flex-none cursor-col-resize bg-bb-line transition-colors hover:bg-bb-blue"
        />

        <section ref={questionRef} className="question-pane">
          <div className="question-toolbar">
            <div className="flex items-center gap-3">
              <span className="question-number">
                {qNumber}
              </span>
              {examTools ? (
                <button
                  onClick={onToggleMark}
                  className="flex items-center gap-1.5 whitespace-nowrap text-sm"
                >
                  <span className={answer.marked ? "text-bb-wrong" : ""}>
                    {answer.marked ? "🔖" : "☐"}
                  </span>
                  Mark for Review
                </button>
              ) : null}
            </div>
            <button
              onClick={() => setCrossOutOn((v) => !v)}
              aria-pressed={crossOutOn}
              className={`crossout-button ${
                crossOutOn ? "border-bb-ink bg-bb-ink text-white" : "border-bb-line"
              }`}
              aria-label="Toggle answer eliminator"
            >
              <span className="line-through">ABC</span>
            </button>
          </div>

          <div className="question-prompt">
            <RichText html={question.prompt_html} fallback={question.prompt} />
          </div>

          <div className="choice-list">
            {LETTERS.map((letter) => {
              const crossed = answer.crossed.includes(letter);
              const selected = answer.selected === letter;
              let feedback;
              if (revealed) {
                if (letter === question.correct) feedback = "correct";
                else if (selected) feedback = "wrong";
              }
              return (
                <div key={letter} className="flex items-center gap-2">
                  <button
                    onClick={() => onChoose(letter)}
                    disabled={crossed}
                    data-selected={selected}
                    data-crossed={crossed}
                    data-state={feedback}
                    className="bb-choice"
                    aria-label={`${letter}. ${question.choices[letter]}`}
                  >
                    <span className="bb-choice-letter">{letter}</span>
                    <RichText
                      className="bb-choice-body"
                      html={question.choices_html?.[letter]}
                      fallback={question.choices[letter]}
                    />
                  </button>
                  {crossOutOn ? (
                    <button
                      onClick={() => onToggleCross(letter)}
                      aria-label={`${crossed ? "Restore" : "Cross out"} choice ${letter}`}
                      className="flex-none text-xs font-bold text-bb-muted"
                    >
                      {crossed ? (
                        "Undo"
                      ) : (
                        <span className="grid h-6 w-6 place-items-center rounded-full border border-bb-muted line-through">
                          {letter}
                        </span>
                      )}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {revealed ? (
            <div className="mt-6 border-t border-bb-line pt-4">
              <p
                className={`mb-2 font-bold ${
                  gotItRight ? "text-bb-correct" : "text-bb-wrong"
                }`}
              >
                {gotItRight ? "Correct" : `Incorrect — the answer is ${question.correct}`}
              </p>
              <RichText
                className="text-[0.98rem] leading-[1.65] text-bb-muted"
                html={question.rationale_html}
                fallback={question.rationale}
              />
              <p className="mt-3 text-xs text-bb-muted">
                {question.assessment || "SAT"} · {question.domain} · {question.skill} · {question.difficulty}
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="exam-footer">
        <div className="footer-user">{username}</div>

        {examTools ? (
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="flex-none whitespace-nowrap rounded bg-bb-ink px-4 py-1.5 text-sm font-bold text-white"
          >
            Question {qNumber} of {total} ⌃
          </button>
        ) : (
          <span className="practice-progress">
            Question {qNumber}
          </span>
        )}

        <div className="footer-actions">
          {examTools ? (
            <button
              onClick={onBack}
              disabled={!canBack}
              className="bb-btn-ghost disabled:opacity-40"
            >
              Back
            </button>
          ) : null}
          {onFinish && !canNext ? (
            <button onClick={onFinish} className="bb-btn-primary">
              Finish
            </button>
          ) : (
            <button onClick={onNext} disabled={!canNext} className="bb-btn-primary disabled:cursor-wait disabled:opacity-45">
              {primaryLabel}
            </button>
          )}
        </div>

        {navOpen && examTools ? (
          <div className="absolute bottom-16 left-1/2 max-h-80 w-[30rem] -translate-x-1/2 overflow-y-auto rounded-lg border border-bb-line bg-white p-4 shadow-xl">
            <div className="mb-3 text-center text-sm font-bold">
              {states.filter((s) => s.selected).length} of {states.length} answered
            </div>
            <div className="grid grid-cols-9 gap-2">
              {states.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onJump(i);
                    setNavOpen(false);
                  }}
                  className={`relative h-8 rounded border text-sm ${
                    i === qNumber - 1
                      ? "border-bb-blue bg-bb-blue text-white"
                      : s.selected
                        ? "border-bb-ink bg-neutral-200"
                        : "border-dashed border-bb-line"
                  }`}
                >
                  {i + 1}
                  {s.marked ? (
                    <span className="absolute -top-1 -right-1 text-[10px]">🔖</span>
                  ) : null}
                </button>
              ))}
            </div>
            {onFinish ? (
              <button onClick={onFinish} className="bb-btn-primary mt-4 w-full">
                Finish and review
              </button>
            ) : null}
          </div>
        ) : null}
      </footer>
    </div>
  );
}
