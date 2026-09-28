"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AddNoteIcon,
  ChevronIcon,
  DropIcon,
  HighlightsIcon,
  SideChevronIcon,
  TrashIcon,
  UnderlineStyleIcon,
} from "./icons";

/**
 * Bluebook's Highlights & Notes, as it behaves in the app:
 *
 * - Selecting text shows a toolbar above it (three colors, an underline style,
 *   delete, and add note); choosing an option creates the highlight. With
 *   highlight mode on, selecting text highlights it right away.
 * - New highlights reuse the last color and underline style chosen.
 * - The selected highlight is drawn in full color and the rest are pale.
 * - Notes are cards in a column beside the passage, lined up with their
 *   highlights. They save as you type, and deleting one asks first.
 *
 * Highlights are <mark> elements wrapped around the text itself, so the
 * regions they live in stay mounted while the student moves between questions.
 */

const COLORS = ["yellow", "blue", "pink"];
const UNDERLINES = ["solid", "dashed", "dotted"];
const SKIP = "mjx-container, .sr-only, .mk-qbar, .mk-choice-letter, .mk-strike, .mk-undo, .mk-hl-toolbar";

const AnnotationContext = createContext(null);

const label = (word) => word[0].toUpperCase() + word.slice(1);
const newId = () => `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function marksFor(id) {
  return id ? [...document.querySelectorAll(`mark.mk-hl[data-hl="${id}"]`)] : [];
}

function rectsOf(target) {
  const list = Array.isArray(target)
    ? target.flatMap((mark) => [...mark.getClientRects()])
    : target
      ? [...target.getClientRects()]
      : [];
  return list.filter((r) => r.width > 0 || r.height > 0);
}

function quoteOf(marks) {
  return marks
    .map((m) => m.textContent)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Wrap each text node the range touches in its own <mark>, so a highlight can
 * cross paragraph or inline-element boundaries without restructuring the DOM.
 */
function wrapRange(container, range, id, style) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim() || !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(SKIP)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  let wrapped = 0;
  for (const node of nodes) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
    if (start >= end || !node.nodeValue.slice(start, end).trim()) continue;
    let target = node;
    if (end < target.nodeValue.length) target.splitText(end);
    if (start > 0) target = target.splitText(start);
    const mark = document.createElement("mark");
    mark.className = "mk-hl";
    mark.dataset.hl = id;
    mark.dataset.color = style.color;
    mark.dataset.underline = style.underline;
    target.parentNode.insertBefore(mark, target);
    mark.appendChild(target);
    wrapped += 1;
  }
  return wrapped;
}

function unwrap(id) {
  for (const mark of marksFor(id)) {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }
}

function withoutNote(notes, key, id) {
  if (!notes[key] || !(id in notes[key])) return notes;
  const { [id]: _gone, ...rest } = notes[key];
  return { ...notes, [key]: rest };
}

/** Holds every highlight and note for one module of the exam. */
export function AnnotationProvider({ children }) {
  const [notes, setNotes] = useState({});
  const [active, setActive] = useState(null);
  const [toolbar, setToolbar] = useState(null);
  const [style, setStyle] = useState({ color: "yellow", underline: "none" });
  const [mode, setMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [revision, setRevision] = useState(0);
  const pending = useRef(null);
  const swallow = useRef(false);
  const focusNote = useRef(null);

  const touch = () => setRevision((r) => r + 1);

  // Clicking anywhere else puts the toolbar away and deselects the highlight.
  useEffect(() => {
    const down = (event) => {
      swallow.current = false;
      if (event.target.closest?.(".mk-hl-toolbar, .mk-note-card, .mk-notes-toggle, mark.mk-hl")) return;
      pending.current = null;
      setToolbar(null);
      setActive(null);
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  useEffect(() => {
    document.querySelectorAll("mark.mk-hl[data-active]").forEach((m) => m.removeAttribute("data-active"));
    for (const mark of marksFor(active?.id)) mark.dataset.active = "true";
  }, [active, revision]);

  function select(key, region, id) {
    pending.current = null;
    setActive({ key, id });
    setToolbar({ key, region, id });
  }

  function selectEnd(event, key, region, element) {
    if (event.target.closest(".mk-hl-toolbar")) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!element.contains(range.commonAncestorContainer) || !range.toString().trim()) return;
    // The drag that made the selection must not also pick an answer choice.
    swallow.current = true;
    if (mode) {
      const id = newId();
      const count = wrapRange(element, range, id, style);
      selection.removeAllRanges();
      if (!count) return;
      select(key, region, id);
      touch();
    } else {
      pending.current = { range: range.cloneRange(), element };
      setActive(null);
      setToolbar({ key, region, pending: Date.now() });
    }
  }

  function swallowClick(event) {
    if (!swallow.current) return;
    swallow.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function markClick(event, key, region) {
    const mark = event.target.closest("mark.mk-hl");
    if (!mark || !window.getSelection()?.isCollapsed) return;
    select(key, region, mark.dataset.hl);
  }

  /** Turn the pending selection into a highlight, returning its id. */
  function commit(overrides) {
    const selected = pending.current;
    if (!selected || !toolbar) return null;
    const id = newId();
    const count = wrapRange(selected.element, selected.range, id, { ...style, ...overrides });
    window.getSelection()?.removeAllRanges();
    pending.current = null;
    if (!count) {
      setToolbar(null);
      return null;
    }
    select(toolbar.key, toolbar.region, id);
    touch();
    return id;
  }

  function restyle(change) {
    setStyle((s) => ({ ...s, ...change }));
    if (toolbar?.pending) {
      commit(change);
    } else if (active) {
      for (const mark of marksFor(active.id)) Object.assign(mark.dataset, change);
      touch();
    }
  }

  function remove() {
    if (toolbar?.pending) {
      pending.current = null;
      window.getSelection()?.removeAllRanges();
    } else if (active) {
      unwrap(active.id);
      setNotes((n) => withoutNote(n, active.key, active.id));
      setActive(null);
      touch();
    }
    setToolbar(null);
  }

  function addNote() {
    if (!toolbar) return;
    const key = toolbar.key;
    const id = toolbar.pending ? commit({}) : active?.id;
    if (!id) return;
    setNotes((n) => ({ ...n, [key]: { ...n[key], [id]: n[key]?.[id] ?? "" } }));
    setCollapsed(false);
    setToolbar(null);
    setActive({ key, id });
    focusNote.current = id;
  }

  const value = {
    notes,
    active,
    toolbar,
    mode,
    collapsed,
    revision,
    pendingRange: () => pending.current?.range,
    focusNote,
    setMode,
    setCollapsed,
    selectEnd,
    swallowClick,
    markClick,
    restyle,
    remove,
    addNote,
    focusCard(key, id) {
      pending.current = null;
      setToolbar(null);
      setActive({ key, id });
    },
    writeNote(key, id, text) {
      setNotes((n) => ({ ...n, [key]: { ...n[key], [id]: text } }));
    },
    deleteNote(key, id) {
      setNotes((n) => withoutNote(n, key, id));
      setActive(null);
    },
  };

  return <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>;
}

function Toolbar({ regionRef }) {
  const ann = useContext(AnnotationContext);
  const ref = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toolbar } = ann;
  const current = toolbar.pending ? null : marksFor(toolbar.id)[0]?.dataset;
  const color = current?.color;
  const underline = current?.underline;

  const place = useCallback(() => {
    const el = ref.current;
    const region = regionRef.current;
    if (!el || !region) return;
    const rects = rectsOf(toolbar.pending ? ann.pendingRange() : marksFor(toolbar.id));
    if (!rects.length) return;
    const box = region.getBoundingClientRect();
    const pane = region.closest(".mk-pane")?.getBoundingClientRect() || box;
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const middle = (Math.min(...rects.map((r) => r.left)) + Math.max(...rects.map((r) => r.right))) / 2;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const x = Math.max(pane.left + 8, Math.min(middle - width / 2, pane.right - width - 8));
    const y = top - height - 6 >= pane.top + 4 ? top - height - 6 : bottom + 6;
    el.style.left = `${x - box.left}px`;
    el.style.top = `${y - box.top}px`;
    el.style.visibility = "visible";
  }, [ann, regionRef, toolbar]);

  const placeLatest = useRef(place);
  useLayoutEffect(() => {
    placeLatest.current = place;
    place();
  });

  // Dragging the pane divider reflows the text under the toolbar.
  useEffect(() => {
    const observer = new ResizeObserver(() => placeLatest.current());
    observer.observe(regionRef.current);
    return () => observer.disconnect();
  }, [regionRef]);

  useEffect(() => setMenuOpen(false), [toolbar]);

  return (
    <div
      ref={ref}
      className="mk-hl-toolbar"
      role="toolbar"
      aria-label="Highlight options"
      style={{ visibility: "hidden" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className="mk-hl-swatch"
          data-color={c}
          aria-pressed={color === c}
          aria-label={`${label(c)} highlight`}
          onClick={() => ann.restyle({ color: c })}
        >
          {color === c ? <DropIcon /> : null}
        </button>
      ))}
      <div className="mk-hl-underline">
        <button
          type="button"
          className="mk-hl-underline-btn"
          aria-label="Underline style"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <UnderlineStyleIcon variant={underline && underline !== "none" ? underline : null} />
          <ChevronIcon up={menuOpen} size={12} />
        </button>
        {menuOpen ? (
          <div className="mk-hl-underline-menu" role="menu">
            {UNDERLINES.map((u) => (
              <button
                key={u}
                type="button"
                role="menuitemradio"
                aria-checked={underline === u}
                aria-label={`${label(u)} underline`}
                onClick={() => ann.restyle({ underline: u })}
              >
                <UnderlineStyleIcon variant={u} />
              </button>
            ))}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={underline === "none"}
              onClick={() => ann.restyle({ underline: "none" })}
            >
              None
            </button>
          </div>
        ) : null}
      </div>
      <button type="button" className="mk-hl-circle" aria-label="Delete highlight" onClick={ann.remove}>
        <TrashIcon />
      </button>
      <span className="mk-hl-sep" />
      <button type="button" className="mk-hl-circle" aria-label="Add note" onClick={ann.addNote}>
        <AddNoteIcon />
      </button>
    </div>
  );
}

/** Text the student can highlight: a passage, or a question and its choices. */
export function AnnotationRegion({ qkey, region, className = "", children }) {
  const ann = useContext(AnnotationContext);
  const ref = useRef(null);
  const showToolbar = ann.toolbar?.key === qkey && ann.toolbar.region === region;
  return (
    <div
      ref={ref}
      className={`mk-hl-scope ${className}`.trim()}
      onMouseUp={(e) => ann.selectEnd(e, qkey, region, ref.current)}
      onClickCapture={ann.swallowClick}
      onClick={(e) => ann.markClick(e, qkey, region)}
    >
      {children}
      {showToolbar ? <Toolbar regionRef={ref} /> : null}
    </div>
  );
}

function NoteCard({ qkey, id, text, active, confirming, onConfirm }) {
  const ann = useContext(AnnotationContext);
  const marks = marksFor(id);
  const quote = quoteOf(marks);
  const { color = "yellow", underline = "none" } = marks[0]?.dataset || {};
  return (
    <div
      className="mk-note-card"
      data-id={id}
      data-active={active}
      data-color={color}
      onMouseDown={() => ann.focusCard(qkey, id)}
    >
      <div className="mk-note-head">
        <span className="mk-note-quote" data-underline={underline}>
          {quote}
        </span>
        <button type="button" className="mk-note-delete" aria-label="Delete note" onClick={() => onConfirm(id)}>
          <TrashIcon />
        </button>
      </div>
      <textarea
        className="mk-note-text"
        rows={1}
        placeholder="Notes are saved automatically."
        aria-label={`Note on “${quote}”`}
        value={text}
        onChange={(e) => ann.writeNote(qkey, id, e.target.value)}
      />
      {confirming ? (
        <div className="mk-note-confirm" role="alertdialog" aria-label="Delete this note?">
          <p>Delete This Note?</p>
          <div>
            <button type="button" className="mk-note-no" autoFocus onClick={() => onConfirm(null)}>
              No
            </button>
            <button
              type="button"
              className="mk-note-yes"
              onClick={() => {
                onConfirm(null);
                ann.deleteNote(qkey, id);
              }}
            >
              Yes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The column of note cards beside the passage, for the question on screen. */
export function NotesColumn({ qkey }) {
  const ann = useContext(AnnotationContext);
  const ref = useRef(null);
  const [confirming, setConfirming] = useState(null);
  // Highlights are found in the page, so look again once the question renders.
  const [, setMounted] = useState(0);
  useLayoutEffect(() => setMounted((n) => n + 1), [qkey]);

  const entries = Object.entries((qkey && ann.notes[qkey]) || {}).filter(([id]) => marksFor(id).length);

  const layout = useCallback(() => {
    const column = ref.current;
    if (!column) return;
    const box = column.getBoundingClientRect();
    const cards = [...column.querySelectorAll(".mk-note-card")].map((card) => {
      const text = card.querySelector("textarea");
      text.style.height = "auto";
      text.style.height = `${text.scrollHeight}px`;
      const first = rectsOf(marksFor(card.dataset.id))[0];
      return { card, want: first ? first.top - box.top : 0 };
    });
    cards.sort((a, b) => a.want - b.want);
    let floor = -Infinity;
    for (const { card, want } of cards) {
      const top = Math.max(want, floor);
      card.style.top = `${top}px`;
      floor = top + card.offsetHeight + 8;
    }
    const focus = ann.focusNote.current;
    const target = focus && column.querySelector(`.mk-note-card[data-id="${focus}"] textarea`);
    if (target) {
      ann.focusNote.current = null;
      target.focus();
    }
  }, [ann.focusNote]);

  useLayoutEffect(layout);

  useEffect(() => {
    document.addEventListener("scroll", layout, true);
    window.addEventListener("resize", layout);
    return () => {
      document.removeEventListener("scroll", layout, true);
      window.removeEventListener("resize", layout);
    };
  }, [layout]);

  if (!entries.length) return null;
  if (ann.collapsed) {
    return (
      <aside className="mk-notes" data-collapsed="true" aria-label="Notes">
        <button
          type="button"
          className="mk-notes-toggle"
          aria-label="Show notes"
          onClick={() => ann.setCollapsed(false)}
        >
          <SideChevronIcon left />
        </button>
      </aside>
    );
  }
  return (
    <aside ref={ref} className="mk-notes" aria-label="Notes">
      {entries.map(([id, text]) => (
        <NoteCard
          key={id}
          qkey={qkey}
          id={id}
          text={text}
          active={ann.active?.id === id}
          confirming={confirming === id}
          onConfirm={setConfirming}
        />
      ))}
      <button
        type="button"
        className="mk-notes-toggle"
        aria-label="Hide notes"
        onClick={() => ann.setCollapsed(true)}
      >
        <SideChevronIcon />
      </button>
    </aside>
  );
}

/** The header button, which turns highlight mode on and off. */
export function HighlightModeButton() {
  const ann = useContext(AnnotationContext);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    if (!tip) return undefined;
    const timer = setTimeout(() => setTip(false), 3500);
    return () => clearTimeout(timer);
  }, [tip]);

  return (
    <div className="mk-hl-mode">
      <button
        type="button"
        className="mk-tool"
        aria-pressed={ann.mode}
        onClick={() => {
          setTip(!ann.mode);
          ann.setMode((m) => !m);
        }}
      >
        <HighlightsIcon />
        <span>Highlights &amp; Notes</span>
      </button>
      {tip ? (
        <div className="mk-hl-tip" role="status">
          <strong>Highlight mode on:</strong> Select text to create a highlight automatically.
        </div>
      ) : null}
    </div>
  );
}
