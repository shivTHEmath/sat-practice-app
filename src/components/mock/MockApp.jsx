"use client";

import { useCallback, useEffect, useState } from "react";
import Login from "../Login";
import MockResults from "./MockResults";
import MockRunner from "./MockRunner";
import { signIn } from "@/lib/exam";
import {
  clearProgress,
  formatClock,
  loadMockQuestions,
  loadMockResults,
  loadMocks,
  loadProgress,
  moduleTitle,
  newProgress,
  saveMockResult,
} from "@/lib/mock";

const STORAGE_KEY = "sat-practice-user";
const GUEST = { id: null, username: "Guest" };

function totalMinutes(mock) {
  return mock.modules.reduce((sum, m) => sum + m.minutes, 0);
}

function describeProgress(mock, progress) {
  if (!progress) return null;
  if (progress.stage === "finished") return "Finished: results not saved yet";
  if (progress.stage === "break") return "On the break before Math";
  const mod = mock.modules[progress.moduleIndex];
  return `${moduleTitle(mod)} · ${formatClock(progress.remainingMs)} left`;
}

const GROUPS = [
  { assessment: "PSAT", title: "PSAT/NMSQT" },
  { assessment: "SAT", title: "SAT" },
];

function sectionTotals(mock) {
  return mock.modules.reduce((acc, m) => {
    const entry = acc[m.section] || { questions: 0, minutes: 0 };
    entry.questions += m.question_ids.length;
    entry.minutes += m.minutes;
    acc[m.section] = entry;
    return acc;
  }, {});
}

function MockCard({ mock, user, results, onStart, onResume, onRestart, onViewResult }) {
  const progress = loadProgress(user, mock.id);
  const past = results.filter((r) => r.mock_id === mock.id);
  const totals = sectionTotals(mock);
  const rw = totals["Reading and Writing"];
  const math = totals.Math;
  return (
    <article className="mk-home-card">
      <div className="mk-home-card-kicker">
        {mock.assessment}
        {mock.assessment === "SAT" && mock.description ? (
          <span className="mk-hard-badge">Harder than Bluebook</span>
        ) : null}
      </div>
      <h2>{mock.name}</h2>
      <ul className="mk-home-facts">
        {rw ? <li>Reading and Writing: {rw.questions} questions, {rw.minutes} min</li> : null}
        {math ? <li>Math: {math.questions} questions, {math.minutes} min</li> : null}
        <li>About {Math.round((totalMinutes(mock) + 10) / 6) / 10} hours with the break</li>
      </ul>
      {progress ? (
        <p className="mk-home-progress">In progress: {describeProgress(mock, progress)}</p>
      ) : null}
      <div className="mk-home-actions">
        {progress ? (
          <>
            <button type="button" className="mk-btn-blue" onClick={() => onResume(mock, progress)}>
              Resume
            </button>
            <button type="button" className="mk-btn-link" onClick={() => onRestart(mock)}>
              Start over
            </button>
          </>
        ) : (
          <button type="button" className="mk-btn-blue" onClick={() => onStart(mock)}>
            {past.length ? "Take Again" : "Start"}
          </button>
        )}
      </div>
      {past.length ? (
        <div className="mk-home-history">
          <h3>Your scores</h3>
          {past.map((r) => (
            <button key={r.id} type="button" className="mk-home-history-row" onClick={() => onViewResult(mock, r)}>
              <span>{new Date(r.completed_at).toLocaleDateString()}</span>
              <strong>{r.total_score}</strong>
              <span>
                R&amp;W {r.rw_score} · Math {r.math_score}
              </span>
              <span className="mk-home-history-link">View</span>
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function MockHome({ user, mocks, results, onSignOut, ...actions }) {
  return (
    <div className="mk-home">
      <header className="mk-home-header">
        <div className="mk-home-brand">Mock Tests</div>
        <div className="mk-home-user">
          <a href="/" className="mk-btn-link">Practice</a>
          <span>{user.username}</span>
          <button type="button" className="mk-btn-link" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="mk-home-main">
        <h1>Full-Length Practice</h1>
        <p className="mk-home-lede">
          Timed, full-length mocks in the Bluebook testing layout. Each has two Reading and
          Writing modules, a 10-minute break, and two Math modules with the Desmos calculator.
        </p>
        {!user.id ? (
          <p className="mk-home-guest">
            You’re testing as a guest. Your score will be shown when you finish but not saved.
          </p>
        ) : null}
        {GROUPS.map(({ assessment, title }) => {
          const group = mocks.filter((m) => m.assessment === assessment);
          if (!group.length) return null;
          const note = group.find((m) => m.description)?.description;
          return (
            <section key={assessment} className="mk-home-group">
              <h2 className="mk-home-group-title">{title}</h2>
              {note ? (
                <p className="mk-home-note" data-assessment={assessment}>
                  {note}
                </p>
              ) : null}
              <div className="mk-home-cards">
                {group.map((mock) => (
                  <MockCard key={mock.id} mock={mock} user={user} results={results} {...actions} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

export default function MockApp() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [results, setResults] = useState([]);
  const [view, setView] = useState({ name: "home" });
  const [loading, setLoading] = useState(false);

  // Bluebook is light-only; restore the practice app's theme on the way out.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = "light";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // Signing in again is enough.
    }
    setReady(true);
    return () => {
      root.dataset.theme = previous || "light";
    };
  }, []);

  const refresh = useCallback(async (account) => {
    const [list, past] = await Promise.all([loadMocks(), loadMockResults(account?.id)]);
    setMocks(list);
    setResults(past);
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh(user).catch((err) => setError(err.message || "Could not load the mock tests."));
  }, [user, refresh]);

  async function handleSignIn(name) {
    setBusy(true);
    setError(null);
    try {
      const account = await signIn(name);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
      } catch {
        // The session still works for this visit.
      }
      setUser(account);
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setView({ name: "home" });
  }

  async function open(mock, next) {
    setLoading(true);
    setError(null);
    try {
      const questionsById = await loadMockQuestions(mock);
      next(questionsById);
    } catch (err) {
      setError(err.message || "Could not load this mock.");
    } finally {
      setLoading(false);
    }
  }

  function start(mock, progress) {
    open(mock, (questionsById) =>
      setView({ name: "test", mock, questionsById, progress: progress || newProgress(mock) })
    );
  }

  function restart(mock) {
    if (!window.confirm(`Start ${mock.name} over? Your saved answers for this sitting will be erased.`)) return;
    clearProgress(user, mock.id);
    start(mock);
  }

  async function complete(mock, questionsById, progress) {
    await saveMockResult({
      user,
      mock,
      sessionId: progress.sessionId,
      questionsById,
      answers: progress.answers,
    });
    clearProgress(user, mock.id);
    setView({ name: "results", mock, questionsById, answers: progress.answers });
    refresh(user).catch(() => {});
  }

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mk-root mk-login">
        <Login onSignIn={handleSignIn} onGuest={() => setUser(GUEST)} busy={busy} error={error} />
      </div>
    );
  }

  if (view.name === "test") {
    return (
      <div className="mk-root">
        <MockRunner
          user={user}
          mock={view.mock}
          questionsById={view.questionsById}
          initial={view.progress}
          onExit={() => setView({ name: "home" })}
          onComplete={(progress) => complete(view.mock, view.questionsById, progress)}
        />
      </div>
    );
  }

  if (view.name === "results") {
    return (
      <div className="mk-root">
        <MockResults
          mock={view.mock}
          questionsById={view.questionsById}
          answers={view.answers}
          onHome={() => setView({ name: "home" })}
        />
      </div>
    );
  }

  return (
    <div className="mk-root">
      <MockHome
        user={user}
        mocks={mocks}
        results={results}
        onStart={(mock) => start(mock)}
        onResume={(mock, progress) => start(mock, progress)}
        onRestart={restart}
        onViewResult={(mock, result) =>
          open(mock, (questionsById) =>
            setView({ name: "results", mock, questionsById, answers: result.answers })
          )
        }
        onSignOut={handleSignOut}
      />
      {loading ? <div className="mk-loading">Loading…</div> : null}
      {error ? <p className="mk-home-error">{error}</p> : null}
    </div>
  );
}
