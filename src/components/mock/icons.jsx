/* Line icons drawn to match Bluebook's toolbar glyphs. */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function BookmarkIcon({ filled = false, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 1.75h9v12.5L8 10.9l-4.5 3.35z"
        {...base}
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function ChevronIcon({ up = false, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d={up ? "M2.5 9.5 7 5l4.5 4.5" : "M2.5 5 7 9.5 11.5 5"} {...base} />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="3.5" r="1.6" fill="currentColor" />
      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
      <circle cx="10" cy="16.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function HighlightsIcon() {
  return (
    <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true">
      <path d="M4 16.5h6M5.5 12.8l7.6-7.6 2.4 2.4-7.6 7.6-3.1.7z" {...base} strokeWidth="1.4" />
      <rect x="19.5" y="4" width="11" height="11" rx="1.5" {...base} strokeWidth="1.4" />
      <path d="M22 7.5h6M22 10h6M22 12.5h3.5" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function CalculatorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="1.5" {...base} strokeWidth="1.4" />
      <rect x="6.5" y="4.5" width="7" height="3" rx="0.5" {...base} strokeWidth="1.2" />
      <path d="M7 10.5h.01M10 10.5h.01M13 10.5h.01M7 13.5h.01M10 13.5h.01M13 13.5h.01M7 16h.01M10 16h.01M13 16h.01" {...base} strokeWidth="2" />
    </svg>
  );
}

export function ReferenceIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" aria-hidden="true">
      <text x="3" y="16" fontSize="14" fontStyle="italic" fontWeight="700" fontFamily="Georgia, serif" fill="currentColor">x</text>
      <text x="12" y="9" fontSize="9" fontWeight="700" fontFamily="Georgia, serif" fill="currentColor">2</text>
    </svg>
  );
}

export function CloseIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3.5 3.5l11 11M14.5 3.5l-11 11" {...base} strokeWidth="1.8" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
      <path d="M7 15s5-4.6 5-8.5A5 5 0 0 0 2 6.5C2 10.4 7 15 7 15z" {...base} strokeWidth="1.5" />
      <circle cx="7" cy="6.4" r="1.8" {...base} strokeWidth="1.5" />
    </svg>
  );
}

export function DashedBoxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="1" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.6" />
    </svg>
  );
}

/** The ABC-with-a-slash eliminator toggle. */
export function EliminatorIcon() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
      <text x="1.5" y="13.5" fontSize="10.5" fontWeight="700" fontFamily="Roboto, Arial, sans-serif" fill="currentColor" letterSpacing="-0.3">ABC</text>
      <path d="M4 16 22 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Circled letter with a strike line, shown beside each choice in eliminate mode. */
export function StrikeLetterIcon({ letter }) {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" aria-hidden="true">
      <circle cx="14" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text x="14" y="15" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="Roboto, Arial, sans-serif" fill="currentColor">{letter}</text>
      <path d="M1 11h26" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function GripIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
      <path d="M3.8 3 1 6l2.8 3M6.2 3 9 6 6.2 9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function DragDotsIcon() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
      {[3, 11, 19].flatMap((x) => [3, 11].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />))}
    </svg>
  );
}

export function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7.3" {...base} strokeWidth="1.3" />
      <path d="M6.9 7a2.2 2.2 0 1 1 3 2.05c-.6.25-.9.7-.9 1.35v.3M9 13.2h.01" {...base} strokeWidth="1.4" />
    </svg>
  );
}

export function KeyboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="1.5" y="4.5" width="15" height="9" rx="1.2" {...base} strokeWidth="1.2" />
      <path d="M4 7.3h.01M6.5 7.3h.01M9 7.3h.01M11.5 7.3h.01M14 7.3h.01M5 10.5h8" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function LineReaderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 4.5h14M2 9h14M2 13.5h9" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function BreakIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 2.5h6M5.5 2.5v4.2l-2.7 8.8M8.5 2.5v4.2l4.5 8.8M5 11h6" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 2.2 16.3 15H1.7z" {...base} strokeWidth="1.3" />
      <path d="M9 7v3.8M9 12.9h.01" {...base} strokeWidth="1.5" />
    </svg>
  );
}

export function ResizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 12 12 4M8.5 4H12v3.5M4 8.5V12h3.5" {...base} strokeWidth="1.5" />
    </svg>
  );
}

export function GraphIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
      <path d="M1 12c2.5-9 4.5-9 7-4s4.5 5 9-6" {...base} strokeWidth="1.5" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.8 6.5v4.5M9.2 6.5v4.5" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 2.5h11v7.5l-3.5 3.5h-7.5z M10 13.5V10h3.5" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function UnderlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.5 2.5v5a3.5 3.5 0 0 0 7 0v-5M3 14h10" {...base} strokeWidth="1.4" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7.2" {...base} strokeWidth="1.3" />
      <path d="M9 5v4.2l2.8 1.8" {...base} strokeWidth="1.4" />
    </svg>
  );
}

export function TestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="3.5" y="2" width="11" height="14" rx="1.3" {...base} strokeWidth="1.3" />
      <path d="M6 6h6M6 9h6M6 12h3.5" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M6.5 4.5h9M6.5 9h9M6.5 13.5h9M2.8 4.5h.01M2.8 9h.01M2.8 13.5h.01" {...base} strokeWidth="1.5" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2.5 15.5h13M4.5 12.5V9M8.5 12.5V5M12.5 12.5V7.5" {...base} strokeWidth="1.6" />
    </svg>
  );
}

export function ThemeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M14.8 11.2A6.3 6.3 0 1 1 6.8 3.2a5 5 0 0 0 8 8z" {...base} strokeWidth="1.3" />
    </svg>
  );
}

export function ExitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M7 3H3.5v12H7M11.5 5.5 15 9l-3.5 3.5M15 9H7" {...base} strokeWidth="1.4" />
    </svg>
  );
}
