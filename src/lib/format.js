export function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Whole seconds only: a timer that ticks on fractions is just noise. */
export function seconds(ms) {
  return `${Math.max(0, Math.floor(ms / 1000))}s`;
}
