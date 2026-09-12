"use client";

import { useEffect, useState } from "react";
import Login from "./Login";
import Practice from "./Practice";
import { signIn } from "@/lib/exam";

const STORAGE_KEY = "sat-practice-user";
const GUEST = { id: null, username: "Guest" };

export default function App() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  return <Practice user={user} onSignOut={handleSignOut} />;
}
