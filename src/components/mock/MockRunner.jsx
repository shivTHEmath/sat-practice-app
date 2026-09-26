"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MockExam from "./MockExam";
import {
  BREAK_MS,
  enterFullscreen,
  exitFullscreen,
  formatClock,
  fullscreenSupported,
  isFullscreen,
  moduleTitle,
  saveProgress,
} from "@/lib/mock";

const MODULE_OVER_MS = 2500;
// One departure can fire blur, visibility, and full-screen events together.
const LOCK_EVENT_MERGE_MS = 2000;
const LOCKED_STAGES = ["question", "review", "over", "break"];

function LockOverlay({ exits, canFullscreen, refused, onReturn, onContinue, onPause }) {
  return (
    <div className="mk-lock" role="alertdialog" aria-modal="true" aria-labelledby="mk-lock-title">
      <div className="mk-lock-card">
        <h2 id="mk-lock-title">Return to Your Test</h2>
        <p>
          Locked mode is on, so the test stays hidden while you’re outside full screen. The
          clock is still running.
        </p>
        {exits ? (
          <p className="mk-lock-count">
            You’ve left the test {exits} {exits === 1 ? "time" : "times"}. Each one is listed on
            your score report.
          </p>
        ) : null}
        {refused ? (
          <p className="mk-lock-count">
            Your browser didn’t allow full screen. You can continue without it; leaving this tab
            is still recorded.
          </p>
        ) : null}
        <div className="mk-lock-actions">
          {refused ? (
            <button type="button" className="mk-btn-yellow mk-btn-lg" onClick={onContinue}>
              Continue Without Full Screen
            </button>
          ) : canFullscreen ? (
            <button type="button" className="mk-btn-yellow mk-btn-lg" onClick={onReturn}>
              Return to Full Screen
            </button>
          ) : null}
          <button type="button" className="mk-btn-link" onClick={onPause}>
            Pause and exit
          </button>
        </div>
        <p className="mk-lock-note">
          Pausing saves your answers and the time left, and unlocks your browser until you resume.
        </p>
      </div>
    </div>
  );
}

function ModuleOver() {
  return (
    <div className="mk-transition">
      <h2>This Module Is Over</h2>
      <p>All your work has been saved.</p>
      <p>You’ll move on automatically in just a moment.</p>
      <p>Do not refresh this page or quit the app.</p>
      <div className="mk-spinner" aria-hidden="true" />
    </div>
  );
}

function BreakScreen({ remainingMs, username, onResume, onPause }) {
  return (
    <div className="mk-break">
      <div className="mk-break-main">
        <div className="mk-break-timer">
          <div className="mk-break-timer-label">Remaining Break Time:</div>
          <div className="mk-break-clock">{formatClock(remainingMs)}</div>
          <button type="button" className="mk-btn-yellow mk-btn-lg" onClick={onResume}>
            Resume Testing
          </button>
        </div>
        <div className="mk-break-copy">
          <h2>Practice Test Break</h2>
          <p>
            You can resume this practice test as soon as you’re ready to move on. On test day,
            you’ll wait until the clock counts down. Read below to see how breaks work on test
            day.
          </p>
          <hr />
          <h3>Take a Break: Do Not Close Your Device</h3>
          <p>
            After the break, a <strong>Resume Testing Now</strong> button will appear and you’ll
            start the next section.
          </p>
          <h4>Follow these rules during the break:</h4>
          <ol>
            <li>Do not disturb students who are still testing.</li>
            <li>Do not exit the app or close your laptop.</li>
            <li>Do not access phones, smartwatches, textbooks, notes, or the internet.</li>
            <li>Do not eat or drink near any testing device.</li>
            <li>
              Do not speak in the test room; outside the test room, do not discuss the exam
              with anyone.
            </li>
          </ol>
        </div>
      </div>
      <div className="mk-break-footer">
        <span>{username}</span>
        {onPause ? (
          <button type="button" className="mk-btn-link mk-break-pause" onClick={onPause}>
            Pause and exit
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: (i * 37) % 100,
        top: (i * 53) % 100,
        rotate: (i * 71) % 180,
        color: ["#f9d648", "#8fb3ff", "#f28b9b", "#ffffff", "#9be0b4"][i % 5],
      })),
    []
  );
  return (
    <div className="mk-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function FinishedScreen({ mockName, saving, error, onView }) {
  return (
    <div className="mk-finished">
      <Confetti />
      <h2>You’re All Finished!</h2>
      <div className="mk-finished-card">
        <svg width="150" height="110" viewBox="0 0 150 110" aria-hidden="true">
          <circle cx="75" cy="52" r="50" fill="#eef1fb" />
          <rect x="32" y="20" width="86" height="58" rx="4" fill="#fff" stroke="#3b3b3b" strokeWidth="2.5" />
          <rect x="39" y="27" width="72" height="44" fill="#dfe9ff" stroke="#3b3b3b" strokeWidth="1.5" />
          <path d="M20 82h110l-6 8H26z" fill="#e7e7e7" stroke="#3b3b3b" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="75" cy="49" r="15" fill="#bfe5f7" stroke="#3b3b3b" strokeWidth="2" />
          <path d="M68 46h.1M82 46h.1" stroke="#3b3b3b" strokeWidth="3" strokeLinecap="round" />
          <path d="M67 52q8 8 16 0" fill="none" stroke="#3b3b3b" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p>
          Congratulations on completing {mockName}! Your estimated score and a full answer
          review are ready.
        </p>
      </div>
      {error ? <p className="mk-finished-error">{error}</p> : null}
      <button type="button" className="mk-btn-yellow mk-btn-lg" disabled={saving} onClick={onView}>
        {saving ? "Saving…" : error ? "Try Again" : "View Your Score"}
      </button>
    </div>
  );
}

/**
 * Drives a sitting through its modules: timed modules with a review page,
 * the module-over transition, the break after Reading and Writing, and the
 * finish screen. Every change is saved so the sitting can be resumed.
 */
export default function MockRunner({ user, mock, questionsById, initial, onExit, onComplete }) {
  const [progress, setProgress] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const lastTick = useRef(null);

  const mod = mock.modules[progress.moduleIndex];
  const questions = useMemo(
    () => mod.question_ids.map((id) => questionsById.get(id)).filter(Boolean),
    [mod, questionsById]
  );
  const isMath = mod.section === "Math";
  const title = moduleTitle(mod);
  const timed = progress.stage === "question" || progress.stage === "review";

  useEffect(() => {
    saveProgress(user, mock.id, progress);
  }, [user, mock.id, progress]);

  // One clock drives both the module countdown and per-question time.
  useEffect(() => {
    if (!timed && progress.stage !== "break") return;
    lastTick.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick.current;
      lastTick.current = now;
      setProgress((p) => {
        if (p.stage === "break") {
          return { ...p, breakRemainingMs: Math.max(0, p.breakRemainingMs - elapsed) };
        }
        const next = { ...p, remainingMs: Math.max(0, p.remainingMs - elapsed) };
        if (p.stage === "question") {
          const qid = mock.modules[p.moduleIndex].question_ids[p.qIndex];
          const prev = p.answers[qid] || {};
          next.answers = { ...p.answers, [qid]: { ...prev, ms: (prev.ms || 0) + elapsed } };
        }
        if (next.remainingMs <= 0) next.stage = "over";
        return next;
      });
    }, 500);
    return () => clearInterval(id);
  }, [timed, progress.stage, mock.modules]);

  const advanceModule = useCallback(() => {
    setProgress((p) => {
      const nextIndex = p.moduleIndex + 1;
      if (nextIndex >= mock.modules.length) return { ...p, stage: "finished" };
      const nextMod = mock.modules[nextIndex];
      const base = {
        ...p,
        moduleIndex: nextIndex,
        qIndex: 0,
        remainingMs: nextMod.minutes * 60 * 1000,
      };
      const sectionChange = nextMod.section !== mock.modules[p.moduleIndex].section;
      return sectionChange
        ? { ...base, stage: "break", breakRemainingMs: BREAK_MS }
        : { ...base, stage: "question" };
    });
  }, [mock.modules]);

  useEffect(() => {
    if (progress.stage !== "over") return;
    const t = setTimeout(advanceModule, MODULE_OVER_MS);
    return () => clearTimeout(t);
  }, [progress.stage, advanceModule]);

  useEffect(() => {
    if (progress.stage === "break" && progress.breakRemainingMs <= 0) {
      setProgress((p) => ({ ...p, stage: "question" }));
    }
  }, [progress.stage, progress.breakRemainingMs]);

  const update = useCallback(
    (qid, fn) =>
      setProgress((p) => ({
        ...p,
        answers: { ...p.answers, [qid]: fn(p.answers[qid] || {}) },
      })),
    []
  );

  const currentId = questions[progress.qIndex]?.id;

  const handleSelect = useCallback(
    (value) =>
      update(currentId, (a) => ({
        ...a,
        selected: value,
        crossed: (a.crossed || []).filter((l) => l !== value),
      })),
    [update, currentId]
  );

  const handleCross = useCallback(
    (letter) =>
      update(currentId, (a) => {
        const crossed = a.crossed || [];
        const on = !crossed.includes(letter);
        return {
          ...a,
          crossed: on ? [...crossed, letter] : crossed.filter((l) => l !== letter),
          selected: on && a.selected === letter ? null : a.selected,
        };
      }),
    [update, currentId]
  );

  const handleMark = useCallback(
    () => update(currentId, (a) => ({ ...a, marked: !a.marked })),
    [update, currentId]
  );

  const sectionStart = mod.module === 1;
  const directionsKey = `${progress.moduleIndex}`;
  const showDirections =
    sectionStart && !(progress.directionsSeen || []).includes(directionsKey);

  // ---------- Locked mode ----------
  const lockActive = Boolean(progress.locked) && LOCKED_STAGES.includes(progress.stage);
  // A browser can refuse full screen (an embedded view, a policy, or a
  // denied permission); the sitting then continues with logging only.
  const [fullscreenRefused, setFullscreenRefused] = useState(false);
  const [withoutFullscreen, setWithoutFullscreen] = useState(false);
  const canFullscreen = fullscreenSupported() && !withoutFullscreen;
  const [away, setAway] = useState(false);
  const pausing = useRef(false);

  const recordExit = useCallback(
    (type) => {
      if (pausing.current) return;
      const now = Date.now();
      setProgress((p) => {
        const events = p.lockEvents || [];
        const last = events[events.length - 1];
        if (last && now - Date.parse(last.at) < LOCK_EVENT_MERGE_MS) {
          const types = [...new Set([...last.types, type])];
          return { ...p, lockEvents: [...events.slice(0, -1), { ...last, types }] };
        }
        const where =
          p.stage === "break"
            ? "Break"
            : `${moduleTitle(mock.modules[p.moduleIndex])}, Question ${p.qIndex + 1}`;
        return { ...p, lockEvents: [...events, { at: new Date(now).toISOString(), types: [type], where }] };
      });
    },
    [mock.modules]
  );

  useEffect(() => {
    if (!lockActive) {
      setAway(false);
      return;
    }
    // Without the Fullscreen API (for example iPhone Safari), departures are
    // still logged, but there is nothing to return to.
    setAway(canFullscreen && !isFullscreen());

    const onFullscreen = () => {
      const inside = isFullscreen();
      if (canFullscreen) setAway(!inside);
      if (!inside) recordExit("left full screen");
    };
    const onVisibility = () => {
      if (document.hidden) recordExit("switched tabs or apps");
    };
    let blurTimer;
    const onBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) recordExit("switched windows");
      }, 250);
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [lockActive, canFullscreen, recordExit]);

  // The lock ends with the test.
  useEffect(() => {
    if (progress.locked && progress.stage === "finished") exitFullscreen();
  }, [progress.locked, progress.stage]);

  /** Pausing is always allowed: save, release full screen, and leave. */
  const pause = useCallback(() => {
    pausing.current = true;
    saveProgress(user, mock.id, progress);
    exitFullscreen().finally(onExit);
  }, [user, mock.id, progress, onExit]);

  async function finish() {
    setSaving(true);
    setSaveError(null);
    try {
      await onComplete(progress);
    } catch (err) {
      setSaveError(err.message || "Could not save your results.");
      setSaving(false);
    }
  }

  let screen;
  if (progress.stage === "over") {
    screen = <ModuleOver />;
  } else if (progress.stage === "break") {
    screen = (
      <BreakScreen
        remainingMs={progress.breakRemainingMs}
        username={user.username}
        onResume={() => setProgress((p) => ({ ...p, stage: "question" }))}
        onPause={progress.locked ? pause : undefined}
      />
    );
  } else if (progress.stage === "finished") {
    screen = (
      <FinishedScreen mockName={mock.name} saving={saving} error={saveError} onView={finish} />
    );
  } else {
    screen = (
      <MockExam
        key={progress.moduleIndex}
        title={title}
        isMath={isMath}
        questions={questions}
        qIndex={progress.qIndex}
        stage={progress.stage}
        answers={progress.answers}
        remainingMs={progress.remainingMs}
        username={user.username}
        openDirections={showDirections}
        onDirectionsClosed={() =>
          setProgress((p) => ({
            ...p,
            directionsSeen: [...new Set([...(p.directionsSeen || []), directionsKey])],
          }))
        }
        onSelect={handleSelect}
        onCross={handleCross}
        onMark={handleMark}
        onGo={(i) => setProgress((p) => ({ ...p, qIndex: i, stage: "question" }))}
        onReview={() => setProgress((p) => ({ ...p, stage: "review" }))}
        onBack={() =>
          setProgress((p) =>
            p.stage === "review"
              ? { ...p, stage: "question", qIndex: questions.length - 1 }
              : { ...p, qIndex: Math.max(0, p.qIndex - 1) }
          )
        }
        onNext={() =>
          setProgress((p) => {
            if (p.stage === "review") return { ...p, stage: "over" };
            if (p.qIndex >= questions.length - 1) return { ...p, stage: "review" };
            return { ...p, qIndex: p.qIndex + 1 };
          })
        }
        onExit={pause}
        exitMessage={
          progress.locked
            ? "Your answers and the time left are saved on this device, and locked mode releases your browser until you resume. Resuming returns you to full screen."
            : undefined
        }
      />
    );
  }

  return (
    <>
      {screen}
      {lockActive && away ? (
        <LockOverlay
          exits={(progress.lockEvents || []).length}
          canFullscreen={canFullscreen}
          refused={fullscreenRefused}
          onReturn={() =>
            enterFullscreen().then((ok) => {
              if (!ok) setFullscreenRefused(true);
            })
          }
          onContinue={() => {
            setWithoutFullscreen(true);
            setFullscreenRefused(false);
          }}
          onPause={pause}
        />
      ) : null}
    </>
  );
}
