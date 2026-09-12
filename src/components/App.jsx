"use client";

import { useEffect, useState } from "react";
import Login from "./Login";
import Practice from "./Practice";
import { signIn } from "@/lib/exam";

const STORAGE_KEY = "sat-practice-user";
const THEME_KEY = "sat-practice-theme";
const GUEST = { id: null, username: "Guest" };

export default function App() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "light");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // A blocked or corrupt store just means signing in again.
    }
  }, []);

  async function handleSignIn(name) {
    setBusy(true);
    setError(null);
    try {
      const account = await signIn(name);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
      } catch {
        // Non-fatal: the session works, it just will not be remembered.
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
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Non-fatal: the theme still changes for the current visit.
    }
  }

  if (!user) {
    return (
      <Login
        onSignIn={handleSignIn}
        onGuest={() => setUser(GUEST)}
        busy={busy}
        error={error}
      />
    );
  }

  return (
    <Practice
      user={user}
      onSignOut={handleSignOut}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
