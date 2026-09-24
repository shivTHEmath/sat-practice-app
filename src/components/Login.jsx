"use client";

import { useState } from "react";

export default function Login({ onSignIn, onGuest, busy, error }) {
  const [name, setName] = useState("");

  return (
    <div className="mx-auto flex h-full max-w-sm flex-col justify-center px-6">
      <h1 className="text-center text-2xl font-bold">SAT + PSAT Reading &amp; Writing</h1>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          onSignIn(name);
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          aria-label="Username"
          placeholder="Username"
          className="w-full rounded-lg border border-bb-line px-4 py-3 text-lg outline-none focus:border-bb-blue"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="bb-btn-primary mt-3 w-full disabled:opacity-40"
        >
          {busy ? "Starting..." : "Start"}
        </button>
      </form>

      <button
        onClick={onGuest}
        disabled={busy}
        className="bb-btn-ghost mt-3 w-full disabled:opacity-40"
      >
        Continue as guest
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm text-bb-wrong">{error}</p>
      ) : null}
    </div>
  );
}
