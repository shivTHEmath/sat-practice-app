"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BluebookExam from "./BluebookExam";
import FilterBar from "./FilterBar";
import MissedQuestions from "./MissedQuestions";
import Review from "./Review";
import Stats from "./Stats";
import {
  DIFFICULTIES,
  MODULE_LENGTHS,
  SKILLS_BY_DOMAIN,
  buildSession,
  getQuestionById,
  loadPracticeHistory,
  saveAttempts,
} from "@/lib/exam";
import { clock, seconds } from "@/lib/format";

const BATCH = 15;
const FULL_RANGE = [1, DIFFICULTIES.length];

/** [1,3] means "no difficulty filter"; anything narrower becomes an IN list. */
function rangeToDifficulties([lo, hi]) {
  if (lo === FULL_RANGE[0] && hi === FULL_RANGE[1]) return [];
  return DIFFICULTIES.slice(lo - 1, hi);
}

function assessmentToValues(assessment) {
  return assessment === "Both" ? [] : [assessment];
}

const blank = () => ({ selected: null, crossed: [], marked: false, ms: 0, checked: false });

/**
 * The default view: an endless stream of questions. A test is the same stream
 * with a fixed length and a countdown, so both share one code path.
 */
export default function Practice({ user, onSignOut, theme, onToggleTheme }) {
  const [filters, setFilters] = useState({ assessment: "SAT", range: FULL_RANGE, domain: "", skill: "" });
  // Mirrors `filters` synchronously: several chips can be clicked inside one
  // render, and each needs to build on the previous click, not on stale props.
  const filtersRef = useRef(filters);
  const [questions, setQuestions] = useState([]);
  const [states, setStates] = useState([]);
  const [index, setIndex] = useState(0);
  const [test, setTest] = useState(null);
  const [panel, setPanel] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reviewQuestion, setReviewQuestion] = useState(null);
  const [history, setHistory] = useState({ missed: [], loading: Boolean(user.id), error: null });
  const [tick, setTick] = useState(0);

  const enteredAt = useRef(Date.now());
  const startedAt = useRef(Date.now());
  const loading = useRef(false);
  const finished = useRef(false);
  // Endless practice has no "finish", so each answer is logged as you leave it.
  const logged = useRef(new Set());
  const mastered = useRef(new Set());
  const sessionId = useRef(null);
  // Filters apply on click, so a slow request must never overwrite a newer one.
  const seq = useRef(0);

  const loadMore = useCallback(
    async (reset, nextFilters, nextTest) => {
      if (loading.current && !reset) return;
      loading.current = true;
      const mine = reset ? ++seq.current : seq.current;
      try {
        const active = nextFilters ?? filters;
        const preset = nextTest !== undefined ? nextTest : test;
        const set = await buildSession({
          assessments: assessmentToValues(active.assessment),
          difficulties: rangeToDifficulties(active.range),
          domains: active.domain ? [active.domain] : [],
          skills: active.skill ? [active.skill] : [],
          count: preset ? preset.count : BATCH,
          weighted: Boolean(preset),
          exclude: reset ? [] : questions.map((q) => q.id),
          skip: [...mastered.current],
        });
        if (mine !== seq.current) return; // a newer filter click superseded this
        if (!set.length) {
          setError(
            user.id
              ? "You’ve completed every available question matching these filters."
              : "No questions match these filters."
          );
          setQuestions([]);
          return;
        }
        setError(null);
        if (reset) {
          setQuestions(set);
          setStates(set.map(blank));
          setIndex(0);
          logged.current = new Set();
          sessionId.current = null;
          startedAt.current = Date.now();
          enteredAt.current = Date.now();
          finished.current = false;
        } else {
          setQuestions((prev) => [...prev, ...set]);
          setStates((prev) => [...prev, ...set.map(blank)]);
        }
      } catch (err) {
        setError(err.message || "Could not load questions.");
      } finally {
        loading.current = false;
      }
    },
    [filters, questions, test, user.id]
  );

  // Load progress before the first question so mastered questions are skipped.
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (user.id) {
        try {
          const saved = await loadPracticeHistory(user.id);
          if (cancelled) return;
          mastered.current = new Set(saved.correctIds);
          setHistory({ missed: saved.missed, loading: false, error: null });
        } catch {
          if (cancelled) return;
          setHistory({ missed: [], loading: false, error: "Could not load missed questions." });
        }
      }

      const questionId = new URLSearchParams(window.location.search).get("question");
      if (questionId) {
        const linkedQuestion = await getQuestionById(questionId);
        if (cancelled) return;
        if (linkedQuestion) {
          openReviewQuestion(linkedQuestion, false);
          return;
        }
      }
      if (!cancelled) loadMore(true);
    }

    initialize();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const limitMs = test?.minutes ? test.minutes * 60 * 1000 : null;
  const sessionElapsed = Date.now() - startedAt.current;

  function rememberResult(question, selected, isCorrect) {
    if (isCorrect) mastered.current.add(question.id);
    setHistory((previous) => {
      const existing = previous.missed.find((item) => item.questionId === question.id);
      if (isCorrect) {
        if (!existing) return previous;
        return {
          ...previous,
          missed: previous.missed.filter((item) => item.questionId !== question.id),
        };
      }

      const item = existing
        ? { ...existing, lastSelected: selected }
        : {
            questionId: question.id,
            question,
            correctEver: false,
            wrongEver: true,
            lastSelected: selected,
            latestAt: new Date().toISOString(),
          };
      return {
        ...previous,
        missed: [item, ...previous.missed.filter((row) => row.questionId !== question.id)],
      };
    });
  }

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const now = Date.now();
    const answers = states.map((s, i) =>
      i === index ? { ...s, ms: s.ms + (now - enteredAt.current) } : s
    );
    setResult({ answers, questions, totalMs: now - startedAt.current });

    if (user.id) {
      const sessionId = crypto.randomUUID();
      const rows = answers.map((a, i) => ({
          user_id: user.id,
          question_id: questions[i].id,
          session_id: sessionId,
          selected: a.selected,
          is_correct: a.selected === questions[i].correct,
          ms_spent: Math.round(a.ms),
          marked: a.marked,
        }));
      saveAttempts(rows)
        .then(() => {
          answers.forEach((answer, i) => {
            rememberResult(
              questions[i],
              answer.selected,
              answer.selected === questions[i].correct
            );
          });
        })
        .catch(() => {});
    }
  }, [states, index, questions, user.id]);

  useEffect(() => {
    if (limitMs && sessionElapsed >= limitMs) finish();
  }, [limitMs, sessionElapsed, finish]);

  /** Record one practice answer. Tests log everything at once on finish. */
  function logAttempt(i, extraMs, selectedOverride) {
    if (test || !user.id) return;
    const q = questions[i];
    const st = states[i];
    const selected = selectedOverride ?? st?.selected;
    if (!q || !selected || logged.current.has(q.id)) return;
    logged.current.add(q.id);
    if (!sessionId.current) sessionId.current = crypto.randomUUID();
    const isCorrect = selected === q.correct;
    saveAttempts([
      {
        user_id: user.id,
        question_id: q.id,
        session_id: sessionId.current,
        selected,
        is_correct: isCorrect,
        ms_spent: Math.round(st.ms + extraMs),
        marked: st.marked,
      },
    ])
      .then(() => rememberResult(q, selected, isCorrect))
      .catch(() => {
        // A dropped log should never interrupt practice; allow a later retry.
        logged.current.delete(q.id);
      });
  }

  function flushInto(i) {
    const now = Date.now();
    const delta = now - enteredAt.current;
    enteredAt.current = now;
    setStates((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ms: next[i].ms + delta };
      return next;
    });
  }

  function go(to) {
    if (to < 0 || to >= questions.length) return;
    logAttempt(index, Date.now() - enteredAt.current);
    flushInto(index);
    setIndex(to);
    // Endless mode tops the pool up before the user reaches the end.
    if (!test && to >= questions.length - 3) loadMore(false);
  }

  function choose(letter) {
    const currentState = states[index];
    if (!currentState || currentState.crossed.includes(letter)) return;
    if (instantCheck && currentState.checked) return;
    setStates((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (cur.crossed.includes(letter)) return prev;
      // Practice answers lock and reveal at once; a test stays changeable.
      if (instantCheck && cur.checked) return prev;
      next[index] = { ...cur, selected: letter, checked: instantCheck || cur.checked };
      return next;
    });
    if (instantCheck) {
      logAttempt(index, Date.now() - enteredAt.current, letter);
    }
  }

  function toggleCross(letter) {
    setStates((prev) => {
      const next = [...prev];
      const cur = next[index];
      const crossed = cur.crossed.includes(letter)
        ? cur.crossed.filter((l) => l !== letter)
        : [...cur.crossed, letter];
      next[index] = {
        ...cur,
        crossed,
        selected: crossed.includes(letter) && cur.selected === letter ? null : cur.selected,
      };
      return next;
    });
  }

  function toggleMark() {
    setStates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], marked: !next[index].marked };
      return next;
    });
  }

  function applyFilters(nextFilters) {
    logAttempt(index, Date.now() - enteredAt.current);
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    setTest(null);
    setResult(null);
    loadMore(true, nextFilters, null);
  }

  function setRange(range) {
    applyFilters({ ...filtersRef.current, range });
  }

  function setAssessment(assessment) {
    applyFilters({ ...filtersRef.current, assessment });
  }

  function setDomain(domain) {
    const currentSkill = filtersRef.current.skill;
    const skill = !domain || SKILLS_BY_DOMAIN[domain].includes(currentSkill) ? currentSkill : "";
    applyFilters({ ...filtersRef.current, domain, skill });
  }

  function setSkill(skill) {
    applyFilters({ ...filtersRef.current, skill });
  }

  function filterSummary() {
    const difficulty = rangeToDifficulties(filters.range);
    return [
      filters.assessment,
      difficulty.length === 1 ? difficulty[0] : "Mixed difficulty",
      filters.domain || "All domains",
      filters.skill || "All skills",
    ].join(" · ");
  }

  function startTest(preset) {
    setTest(preset);
    setReviewQuestion(null);
    setPanel(null);
    setResult(null);
    setQuestions([]);
    window.history.replaceState(null, "", window.location.pathname);
    loadMore(true, filters, preset);
  }

  function backToPractice() {
    setTest(null);
    setReviewQuestion(null);
    setPanel(null);
    setResult(null);
    setQuestions([]);
    window.history.replaceState(null, "", window.location.pathname);
    loadMore(true, filters, null);
  }

  function openReviewQuestion(question, pushHistory = true) {
    setTest(null);
    setReviewQuestion(question);
    setPanel(null);
    setResult(null);
    setQuestions([question]);
    setStates([blank()]);
    setIndex(0);
    logged.current.delete(question.id);
    enteredAt.current = Date.now();
    startedAt.current = Date.now();
    finished.current = false;

    const url = new URL(window.location.href);
    url.searchParams.set("question", question.id);
    window.history[pushHistory ? "pushState" : "replaceState"](null, "", url);
  }

  const visibleQuestion = questions[index];

  useEffect(() => {
    if (!visibleQuestion || test) return;
    const url = new URL(window.location.href);
    url.searchParams.set("question", visibleQuestion.id);
    window.history.replaceState(null, "", url);
  }, [visibleQuestion?.id, test]);

  if (result) {
    return (
      <Review
        questions={result.questions}
        answers={result.answers}
        totalMs={result.totalMs}
        onDone={backToPractice}
      />
    );
  }

  const current = visibleQuestion;
  const answer = states[index] || blank();
  const onThisQuestion = answer.ms + (Date.now() - enteredAt.current);

  const instantCheck = !test;
  const toolbar = (
    <div className="header-actions">
      <button
        onClick={() => setPanel(panel === "menu" ? null : "menu")}
        className="header-tool icon-only"
        aria-label="More options"
        aria-expanded={panel === "menu"}
      >
        <span aria-hidden="true">•••</span>
      </button>
    </div>
  );

  let secondaryPanel = null;
  if (panel === "stats") {
    secondaryPanel = <Stats userId={user.id} onClose={() => setPanel(null)} />;
  } else if (panel === "menu") {
    secondaryPanel = (
      <div className="quick-menu" role="menu">
        {test ? (
          <button type="button" onClick={backToPractice}>Return to endless practice <span>›</span></button>
        ) : (
          <button type="button" onClick={() => setPanel("test")}>Take a timed practice test <span>›</span></button>
        )}
        {user.id && !test ? <button type="button" onClick={() => setPanel("missed")}>Review missed questions <span>{history.missed.length || ""} ›</span></button> : null}
        {user.id && !test ? <button type="button" onClick={() => setPanel("stats")}>View performance <span>›</span></button> : null}
        <button type="button" onClick={onToggleTheme} aria-pressed={theme === "dark"}>
          {theme === "dark" ? "Use light mode" : "Use dark mode"}
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
        <button type="button" onClick={onSignOut}>Exit practice <span>›</span></button>
      </div>
    );
  } else if (panel === "test") {
    secondaryPanel = (
      <div className="test-picker">
        <div className="test-picker-copy">
          <h2>Timed practice test</h2>
          <p>Answers are reviewed after the module.</p>
          <p className="test-filter-summary">Uses current filters: {filterSummary()}</p>
        </div>
        <div className="test-presets">
          {MODULE_LENGTHS.map((preset) => (
            <button key={preset.key} onClick={() => startTest(preset)}>
              <strong>{preset.label}</strong>
              <span>{preset.count} questions · {preset.minutes} minutes</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setPanel(null)} className="text-link">Cancel</button>
      </div>
    );
  } else if (panel === "missed") {
    secondaryPanel = (
      <MissedQuestions
        items={history.missed}
        loading={history.loading}
        error={history.error}
        onOpen={openReviewQuestion}
        onClose={() => setPanel(null)}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        {!questions.length ? (
          <div className="loading-state">
            <span className="loading-spinner" aria-hidden="true" />
            <span>{error || "Loading questions…"}</span>
          </div>
        ) : (
        <BluebookExam
          username={user.username}
          moduleLabel={
            reviewQuestion
              ? "Review problem"
              : test
                ? `${test.label}: Reading and Writing`
                : filters.assessment === "Both"
                  ? "SAT + PSAT Practice"
                  : `${filters.assessment} Practice`
          }
          timeLabel={
            limitMs ? clock(Math.max(0, limitMs - sessionElapsed)) : seconds(onThisQuestion)
          }
          question={current}
          qNumber={index + 1}
          total={test ? questions.length : null}
          answer={answer}
          instantCheck={instantCheck}
          states={states}
          onChoose={choose}
          onToggleCross={toggleCross}
          onToggleMark={toggleMark}
          onBack={() => go(index - 1)}
          onNext={reviewQuestion ? backToPractice : () => go(index + 1)}
          onJump={go}
          onFinish={test ? finish : undefined}
          examTools={Boolean(test)}
          canBack={index > 0}
          canNext={reviewQuestion ? true : index < questions.length - 1}
          primaryLabel={reviewQuestion ? "Back to practice" : "Next"}
          toolbar={toolbar}
          filters={
            <>
              {!test && !reviewQuestion ? (
                <FilterBar
                  assessment={filters.assessment}
                  range={filters.range}
                  domain={filters.domain}
                  skill={filters.skill}
                  onAssessment={setAssessment}
                  onRange={setRange}
                  onDomain={setDomain}
                  onSkill={setSkill}
                />
              ) : null}
              {secondaryPanel}
            </>
          }
        />
        )}
      </div>
    </div>
  );
}
