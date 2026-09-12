"use client";

import { useEffect, useState } from "react";
import { loadStats } from "@/lib/exam";
import { seconds } from "@/lib/format";

function Breakdown({ title, rows }) {
  if (!rows.length) return null;
  return (
    <div className="min-w-[16rem] flex-1">
      <div className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-bb-muted">
        {title}
      </div>
      <div className="grid gap-1">
        {rows.map((r) => {
          const pct = Math.round((r.correct / r.total) * 100);
          return (
            <div key={r.key} className="flex items-center gap-2 text-xs">
              <span className="w-44 flex-none truncate">{r.key}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded bg-neutral-200">
                <span className="block h-full bg-bb-blue" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-20 flex-none text-right tabular-nums text-bb-muted">
                {r.correct}/{r.total}
              </span>
              <span className="w-12 flex-none text-right tabular-nums text-bb-muted">
                {seconds(r.ms / r.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Stats({ userId, onClose }) {
  const [stats, setStats] = useState(null);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    loadStats(userId).then(setStats).catch(() => setStats(null));
  }, [userId]);

  if (!stats) {
    return (
      <div className="flex-none border-b border-bb-line bg-neutral-50 px-6 py-3 text-sm text-bb-muted">
        Loading stats...
      </div>
    );
  }

  if (!stats.total) {
    return (
      <div className="flex flex-none items-center gap-4 border-b border-bb-line bg-neutral-50 px-6 py-3 text-sm text-bb-muted">
        No answers recorded yet.
        <button onClick={onClose} className="underline underline-offset-2">
          close
        </button>
      </div>
    );
  }

  const pct = Math.round((stats.correct / stats.total) * 100);

  return (
    <div className="max-h-72 flex-none overflow-y-auto border-b border-bb-line bg-neutral-50 px-6 py-3">
      {/* The headline is the whole story; detail is opt-in. */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-lg font-bold">
          {stats.correct} / {stats.total} correct
        </span>
        <span className="text-sm text-bb-muted">({pct}%)</span>
        <span className="text-sm text-bb-muted">
          {seconds(stats.ms / stats.total)} average
        </span>
        <button
          onClick={() => setAdvanced((v) => !v)}
          className="ml-auto text-xs text-bb-muted underline underline-offset-2"
        >
          {advanced ? "hide detail" : "advanced"}
        </button>
        <button
          onClick={onClose}
          className="text-xs text-bb-muted underline underline-offset-2"
        >
          close
        </button>
      </div>

      {advanced ? (
        <div className="mt-3 flex flex-wrap gap-6">
          <Breakdown title="By subject" rows={stats.skills} />
          <Breakdown title="By difficulty" rows={stats.difficulties} />
        </div>
      ) : null}
    </div>
  );
}
