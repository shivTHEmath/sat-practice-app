"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { MathJax } from "better-react-mathjax";
import BaseQuestionContent from "../QuestionContent";
import BaseRichText from "../RichText";
import Calculator from "./Calculator";
import ReferenceSheet from "./ReferenceSheet";
import Highlighter from "./Highlighter";
import {
  MathDirections,
  ReadingWritingDirections,
  StudentResponseDirections,
} from "./Directions";
import {
  BookmarkIcon,
  BreakIcon,
  CalculatorIcon,
  ChevronIcon,
  CloseIcon,
  DashedBoxIcon,
  EliminatorIcon,
  GripIcon,
  HelpIcon,
  HighlightsIcon,
  KeyboardIcon,
  LineReaderIcon,
  MoreIcon,
  PinIcon,
  ReferenceIcon,
  StrikeLetterIcon,
  WarningIcon,
} from "./icons";
import { formatClock, isSpr, sanitizeSprInput } from "@/lib/mock";

// The clock re-renders the exam every tick. Typeset content must not re-render
// with it, or MathJax re-typesets and wipes any highlights inside it.
const QuestionContent = memo(BaseQuestionContent);
const RichText = memo(BaseRichText);

const LETTERS = ["A", "B", "C", "D"];
const FIVE_MINUTES = 5 * 60 * 1000;

function SprPreview({ value }) {
  if (!value) return null;
  const match = value.match(/^(-?)(\d*\.?\d*)\/(\d*\.?\d*)$/);
  const tex = match
    ? `\\(${match[1]}\\dfrac{${match[2] || "\\;"}}{${match[3] || "\\;"}}\\)`
    : `\\(${value}\\)`;
  return (
    <MathJax inline dynamic>
      {tex}
    </MathJax>
  );
}

function QuestionBlock({
  question,
  number,
  answer,
  crossOutOn,
  onToggleCrossOut,
  onSelect,
  onCross,
  onMark,
  showStimulus,
}) {
  const spr = isSpr(question);
  return (
    <div className="mk-question">
      <div className="mk-qbar">
        <span className="mk-qnum">{number}</span>
        <button
          type="button"
          className="mk-mark"
          aria-pressed={Boolean(answer.marked)}
          onClick={onMark}
        >
          <span className="mk-mark-icon">
            <BookmarkIcon filled={Boolean(answer.marked)} />
          </span>
          Mark for Review
        </button>
        {!spr ? (
          <button
            type="button"
            className="mk-eliminator"
            aria-pressed={crossOutOn}
            aria-label="Cross out answer choices you think are wrong"
            title="Cross out answer choices you think are wrong."
            onClick={onToggleCrossOut}
          >
            <EliminatorIcon />
          </button>
        ) : null}
      </div>
      <div className="mk-rule mk-rule-q" />

      {showStimulus && question.passage_html ? (
        <div className="mk-stimulus">
          <QuestionContent question={question} />
        </div>
      ) : null}

      <div className="mk-prompt">
        <RichText html={question.prompt_html} fallback={question.prompt} />
      </div>

      {spr ? (
        <div className="mk-spr">
          <input
            className="mk-spr-input"
            value={answer.selected || ""}
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            aria-label="Your answer"
            onChange={(e) => onSelect(sanitizeSprInput(e.target.value) || null)}
          />
          <div className="mk-spr-preview">
            Answer Preview: <SprPreview value={answer.selected} />
          </div>
        </div>
      ) : (
        <div className="mk-choices" data-eliminate={crossOutOn}>
          {LETTERS.filter((l) => question.choices?.[l] != null).map((letter) => {
            const crossed = answer.crossed?.includes(letter);
            const selected = answer.selected === letter;
            return (
              <div key={letter} className="mk-choice-row">
                <button
                  type="button"
                  className="mk-choice"
                  data-selected={selected}
                  data-crossed={crossed}
                  aria-pressed={selected}
                  onClick={() => onSelect(letter)}
                >
                  <span className="mk-choice-letter">{letter}</span>
                  <span className="mk-choice-text">
                    <RichText
                      html={question.choices_html?.[letter]}
                      fallback={question.choices[letter]}
                    />
                  </span>
                </button>
                {crossOutOn ? (
                  crossed ? (
                    <button type="button" className="mk-undo" onClick={() => onCross(letter)}>
                      Undo
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mk-strike"
                      aria-label={`Cross out choice ${letter}`}
                      onClick={() => onCross(letter)}
                    >
                      <StrikeLetterIcon letter={letter} />
                    </button>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionGrid({ questions, answers, current, onGo, big = false }) {
  return (
    <div className={big ? "mk-grid mk-grid-big" : "mk-grid"}>
      {questions.map((q, i) => {
        const a = answers[q.id] || {};
        const answered = a.selected != null && a.selected !== "";
        return (
          <button
            key={q.id}
            type="button"
            className="mk-grid-cell"
            data-answered={answered}
            data-current={i === current}
            onClick={() => onGo(i)}
            aria-label={`Question ${i + 1}${answered ? ", answered" : ", unanswered"}${a.marked ? ", marked for review" : ""}`}
          >
            {i === current ? (
              <span className="mk-grid-pin">
                <PinIcon />
              </span>
            ) : null}
            {i + 1}
            {a.marked ? (
              <span className="mk-grid-flag">
                <BookmarkIcon filled size={12} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function Legend({ current = true }) {
  return (
    <div className="mk-legend">
      {current ? (
        <span>
          <PinIcon /> Current
        </span>
      ) : null}
      <span>
        <DashedBoxIcon /> Unanswered
      </span>
      <span className="mk-legend-review">
        <BookmarkIcon filled size={14} /> For Review
      </span>
    </div>
  );
}

function Modal({ title, children, onClose, actions }) {
  return (
    <div className="mk-modal-backdrop" onMouseDown={onClose}>
      <div className="mk-modal" role="dialog" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mk-modal-head">
          <h2>{title}</h2>
          <button type="button" className="mk-icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="mk-modal-body">{children}</div>
        {actions ? <div className="mk-modal-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

function LineReader({ onClose }) {
  const [y, setY] = useState(() => window.innerHeight / 2);
  useEffect(() => {
    const move = (e) => setY(e.clientY);
    const key = (e) => e.key === "Escape" && onClose();
    window.addEventListener("mousemove", move);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);
  const band = 64;
  return (
    <div className="mk-line-reader" aria-hidden="true">
      <div style={{ top: 0, height: Math.max(0, y - band / 2) }} />
      <div style={{ top: y + band / 2, bottom: 0 }} />
    </div>
  );
}

/**
 * One module of the exam in the Bluebook frame. State lives in the runner;
 * this component owns only the view tools (panels, popups, pane split).
 */
export default function MockExam({
  title,
  isMath,
  questions,
  qIndex,
  stage,
  answers,
  remainingMs,
  username,
  openDirections,
  onDirectionsClosed,
  onSelect,
  onCross,
  onMark,
  onGo,
  onReview,
  onBack,
  onNext,
  onExit,
}) {
  const [split, setSplit] = useState(50);
  const [timerHidden, setTimerHidden] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(openDirections);
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [lineReader, setLineReader] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [crossOutOn, setCrossOutOn] = useState(false);
  const [fiveMinuteNotice, setFiveMinuteNotice] = useState(false);
  const noticeShown = useRef(false);
  const dragging = useRef(false);
  const mainRef = useRef(null);
  const rightRef = useRef(null);
  const leftRef = useRef(null);

  const question = questions[qIndex];
  const answer = (question && answers[question.id]) || {};
  const spr = isSpr(question);
  const split2 = !isMath || spr;
  const lowTime = remainingMs <= FIVE_MINUTES;

  useEffect(() => {
    if (lowTime && !noticeShown.current && remainingMs > 0) {
      noticeShown.current = true;
      setFiveMinuteNotice(true);
      const t = setTimeout(() => setFiveMinuteNotice(false), 6000);
      return () => clearTimeout(t);
    }
  }, [lowTime, remainingMs]);

  useEffect(() => {
    rightRef.current?.scrollTo(0, 0);
    leftRef.current?.scrollTo(0, 0);
    setNavOpen(false);
  }, [qIndex, stage]);

  const onMove = useCallback((event) => {
    if (!dragging.current || !mainRef.current) return;
    const box = mainRef.current.getBoundingClientRect();
    const pct = ((event.clientX - box.left) / box.width) * 100;
    setSplit(Math.min(80, Math.max(20, pct)));
  }, []);

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
      document.body.classList.remove("mk-col-resize");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [onMove]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setNavOpen(false);
        setMoreOpen(false);
        return;
      }
      if (stage !== "question" || !question || spr) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const letter = event.key.toUpperCase();
      if (LETTERS.includes(letter) && question.choices?.[letter] != null) {
        event.preventDefault();
        onSelect(letter);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [stage, question, spr, onSelect]);

  function closeDirections() {
    setDirectionsOpen(false);
    onDirectionsClosed?.();
  }

  const header = (
    <header className="mk-header">
      <div className="mk-header-left">
        <h1 className="mk-title">{title}</h1>
        <button
          type="button"
          className="mk-directions-toggle"
          aria-expanded={directionsOpen}
          onClick={() => (directionsOpen ? closeDirections() : setDirectionsOpen(true))}
        >
          Directions <ChevronIcon up={directionsOpen} />
        </button>
      </div>

      <div className="mk-header-center">
        {timerHidden && !lowTime ? (
          <div className="mk-timer mk-timer-hidden" aria-label="Timer hidden" />
        ) : (
          <div className="mk-timer" data-low={lowTime} role="timer" aria-live="off">
            {formatClock(remainingMs)}
          </div>
        )}
        {!lowTime ? (
          <button type="button" className="mk-timer-toggle" onClick={() => setTimerHidden((v) => !v)}>
            {timerHidden ? "Show" : "Hide"}
          </button>
        ) : null}
      </div>

      <div className="mk-header-right">
        {isMath ? (
          <>
            <button
              type="button"
              className="mk-tool"
              aria-pressed={calcOpen}
              onClick={() => setCalcOpen((v) => !v)}
            >
              <CalculatorIcon />
              <span>Calculator</span>
            </button>
            <button
              type="button"
              className="mk-tool"
              aria-pressed={refOpen}
              onClick={() => setRefOpen((v) => !v)}
            >
              <ReferenceIcon />
              <span>Reference</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="mk-tool"
            onClick={() => setModal("highlights")}
          >
            <HighlightsIcon />
            <span>Highlights &amp; Notes</span>
          </button>
        )}
        <div className="mk-more">
          <button
            type="button"
            className="mk-tool"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreIcon />
            <span>More</span>
          </button>
          {moreOpen ? (
            <>
              <div className="mk-click-away" onClick={() => setMoreOpen(false)} />
              <div className="mk-more-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setModal("help"); setMoreOpen(false); }}>
                  <HelpIcon /> Help
                </button>
                <button type="button" role="menuitem" onClick={() => { setModal("shortcuts"); setMoreOpen(false); }}>
                  <KeyboardIcon /> Shortcuts
                </button>
                <button type="button" role="menuitem" onClick={() => { setLineReader((v) => !v); setMoreOpen(false); }}>
                  <LineReaderIcon /> Line Reader
                </button>
                <button type="button" role="menuitem" onClick={() => { setModal("break"); setMoreOpen(false); }}>
                  <BreakIcon /> Unscheduled Break
                </button>
                <button type="button" role="menuitem" onClick={() => { setModal("exit"); setMoreOpen(false); }}>
                  <WarningIcon /> Exit the Exam
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {directionsOpen ? (
        <>
          <div className="mk-directions-backdrop" onClick={closeDirections} />
          <div className="mk-directions-panel">
            <div className="mk-directions-copy">
              {isMath ? <MathDirections /> : <ReadingWritingDirections />}
            </div>
            <div className="mk-directions-actions">
              <button type="button" className="mk-btn-yellow" onClick={closeDirections}>
                Close
              </button>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );

  const renderLeft = () => {
    if (isMath) {
      return (
        <div className="mk-pane-inner">
          <StudentResponseDirections />
        </div>
      );
    }
    // Every passage in the module stays mounted so highlights survive
    // navigating away and back, as they do in Bluebook.
    return questions.map((q, i) => (
      <div key={q.id} className="mk-pane-inner" hidden={i !== qIndex}>
        <Highlighter className="mk-passage">
          <QuestionContent question={q} />
        </Highlighter>
      </div>
    ));
  };

  const block = question ? (
    <QuestionBlock
      question={question}
      number={qIndex + 1}
      answer={answer}
      crossOutOn={crossOutOn}
      onToggleCrossOut={() => setCrossOutOn((v) => !v)}
      onSelect={onSelect}
      onCross={onCross}
      onMark={onMark}
      showStimulus={isMath}
    />
  ) : null;

  let body;
  if (stage === "review") {
    body = (
      <main className="mk-main mk-review">
        <h2 className="mk-review-title">Check Your Work</h2>
        <p>On test day, you won’t be able to move on to the next module until time expires.</p>
        <p>
          For these practice questions, you can click <strong>Next</strong> when you’re ready to
          move on.
        </p>
        <div className="mk-review-card">
          <div className="mk-review-card-head">
            <h3>{title} Questions</h3>
            <Legend current={false} />
          </div>
          <QuestionGrid questions={questions} answers={answers} current={-1} onGo={onGo} big />
        </div>
      </main>
    );
  } else if (split2) {
    body = (
      <main ref={mainRef} className="mk-main mk-split">
        <section ref={leftRef} className="mk-pane mk-pane-left" style={{ width: `${split}%` }}>
          {renderLeft()}
        </section>
        <div
          className="mk-divider"
          role="separator"
          aria-orientation="vertical"
          onPointerDown={(e) => {
            e.preventDefault();
            dragging.current = true;
            document.body.classList.add("mk-col-resize");
          }}
        >
          <span className="mk-divider-grip">
            <GripIcon />
          </span>
        </div>
        <section ref={rightRef} className="mk-pane mk-pane-right">
          <div className="mk-pane-inner">
            {isMath ? block : (
              <Highlighter key={question.id}>{block}</Highlighter>
            )}
          </div>
        </section>
      </main>
    );
  } else {
    body = (
      <main className="mk-main">
        <section ref={rightRef} className="mk-pane mk-pane-single">
          <div className="mk-single-column">{block}</div>
        </section>
      </main>
    );
  }

  return (
    <div className="mk-shell">
      {header}
      <div className="mk-rule" />
      {body}
      <div className="mk-rule" />

      <footer className="mk-footer">
        <div className="mk-footer-name">{username}</div>
        {stage === "question" ? (
          <div className="mk-footer-center">
            <button
              type="button"
              className="mk-nav-pill"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              Question {qIndex + 1} of {questions.length} <ChevronIcon up={!navOpen} />
            </button>
            {navOpen ? (
              <>
                <div className="mk-click-away" onClick={() => setNavOpen(false)} />
                <div className="mk-nav-popup" role="dialog" aria-label="Question navigator">
                  <div className="mk-nav-head">
                    <h3>{title} Questions</h3>
                    <button type="button" className="mk-icon-btn" aria-label="Close" onClick={() => setNavOpen(false)}>
                      <CloseIcon />
                    </button>
                  </div>
                  <Legend />
                  <QuestionGrid questions={questions} answers={answers} current={qIndex} onGo={onGo} />
                  <button type="button" className="mk-btn-outline" onClick={onReview}>
                    Go to Review Page
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="mk-footer-center" />
        )}
        <div className="mk-footer-actions">
          {stage === "review" || qIndex > 0 ? (
            <button type="button" className="mk-btn-blue" onClick={onBack}>
              Back
            </button>
          ) : null}
          <button type="button" className="mk-btn-blue" onClick={onNext}>
            Next
          </button>
        </div>
      </footer>

      {fiveMinuteNotice ? (
        <div className="mk-toast" role="status">
          5 minutes remaining in this module.
        </div>
      ) : null}

      {isMath ? (
        <>
          <Calculator open={calcOpen} onClose={() => setCalcOpen(false)} />
          <ReferenceSheet open={refOpen} onClose={() => setRefOpen(false)} />
        </>
      ) : null}

      {lineReader ? <LineReader onClose={() => setLineReader(false)} /> : null}

      {modal === "highlights" ? (
        <Modal title="Highlights & Notes" onClose={() => setModal(null)}>
          <p>
            Select any text in a passage or question to highlight it. Use the toolbar that
            appears to change the color, underline it, add a note, or delete the highlight.
            Click an existing highlight to open its toolbar again.
          </p>
        </Modal>
      ) : null}
      {modal === "help" ? (
        <Modal title="Help" onClose={() => setModal(null)}>
          <ul className="mk-help-list">
            <li><strong>Timer:</strong> Hide or show the countdown. It always shows in the last 5 minutes.</li>
            <li><strong>Mark for Review:</strong> Flag a question to come back to. Flags appear in the navigator.</li>
            <li><strong>Answer eliminator:</strong> Turn on the ABC tool to cross out choices you think are wrong.</li>
            <li><strong>Question navigator:</strong> Open “Question X of Y” to jump to any question or the review page.</li>
            {isMath ? (
              <li><strong>Calculator and Reference:</strong> Open the Desmos calculator or the formula sheet. Both can be moved and resized.</li>
            ) : (
              <li><strong>Highlights &amp; Notes:</strong> Select text to highlight it and attach notes.</li>
            )}
            <li><strong>Exit the Exam:</strong> Your answers and remaining time are saved on this device, and you can resume later.</li>
          </ul>
        </Modal>
      ) : null}
      {modal === "shortcuts" ? (
        <Modal title="Shortcuts" onClose={() => setModal(null)}>
          <table className="mk-shortcuts">
            <tbody>
              <tr><td>A, B, C, D</td><td>Select an answer choice</td></tr>
              <tr><td>Esc</td><td>Close the navigator, menus, or line reader</td></tr>
            </tbody>
          </table>
        </Modal>
      ) : null}
      {modal === "break" ? (
        <Modal
          title="Unscheduled Break"
          onClose={() => setModal(null)}
          actions={<button type="button" className="mk-btn-blue" onClick={() => setModal(null)}>Close</button>}
        >
          <p>
            The clock keeps running during an unscheduled break. To pause instead, choose Exit
            the Exam: your progress and remaining time are saved and you can resume later.
          </p>
        </Modal>
      ) : null}
      {modal === "exit" ? (
        <Modal
          title="Are You Sure You Want to Exit the Exam?"
          onClose={() => setModal(null)}
          actions={
            <>
              <button type="button" className="mk-btn-link" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="mk-btn-blue" onClick={onExit}>Exit</button>
            </>
          }
        >
          <p>
            Your answers and the time left in this module are saved on this device. You can
            resume this practice test from the mock test page.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
