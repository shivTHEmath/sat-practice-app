"use client";

import { useCallback, useRef, useState } from "react";
import { NoteIcon, TrashIcon, UnderlineIcon } from "./icons";

const COLORS = ["yellow", "blue", "pink"];

/**
 * Wrap each text node the range touches in its own <mark>, so a highlight can
 * cross paragraph or inline-element boundaries without restructuring the DOM.
 */
function wrapRange(container, range, id) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim() || !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest("mjx-container, .sr-only, .mk-hl-toolbar")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  let wrapped = 0;
  for (const node of nodes) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
    if (start >= end) continue;
    let target = node;
    if (end < target.nodeValue.length) target.splitText(end);
    if (start > 0) target = target.splitText(start);
    const mark = document.createElement("mark");
    mark.className = "mk-hl";
    mark.dataset.hl = id;
    mark.dataset.color = "yellow";
    target.parentNode.insertBefore(mark, target);
    mark.appendChild(target);
    wrapped += 1;
  }
  return wrapped;
}

function marksFor(container, id) {
  return [...container.querySelectorAll(`mark[data-hl="${id}"]`)];
}

/**
 * A highlightable region. Selecting text highlights it in yellow and opens the
 * Bluebook-style toolbar: three colors, underline, delete, and a note.
 */
export default function Highlighter({ children, className = "" }) {
  const ref = useRef(null);
  const [active, setActive] = useState(null);
  const [notes, setNotes] = useState({});
  const [editingNote, setEditingNote] = useState(false);

  const place = useCallback((id) => {
    const container = ref.current;
    const marks = marksFor(container, id);
    if (!marks.length) return setActive(null);
    const box = container.getBoundingClientRect();
    const last = marks[marks.length - 1].getBoundingClientRect();
    const first = marks[0].getBoundingClientRect();
    setActive({
      id,
      top: last.bottom - box.top + 8,
      left: Math.max(0, Math.min(first.left - box.left, box.width - 260)),
    });
  }, []);

  function handleMouseUp(event) {
    if (event.target.closest(".mk-hl-toolbar")) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !ref.current) return;
    const range = selection.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;
    const id = `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const count = wrapRange(ref.current, range, id);
    selection.removeAllRanges();
    if (count) {
      setEditingNote(false);
      place(id);
    }
  }

  function handleClick(event) {
    if (event.target.closest(".mk-hl-toolbar")) return;
    const mark = event.target.closest("mark.mk-hl");
    if (mark && window.getSelection()?.isCollapsed) {
      setEditingNote(Boolean(notes[mark.dataset.hl]));
      place(mark.dataset.hl);
    } else if (!mark) {
      setActive(null);
      setEditingNote(false);
    }
  }

  function setColor(color) {
    marksFor(ref.current, active.id).forEach((m) => {
      m.dataset.color = color;
    });
    setActive({ ...active });
  }

  function toggleUnderline() {
    const marks = marksFor(ref.current, active.id);
    const on = marks[0]?.dataset.underline !== "true";
    marks.forEach((m) => {
      m.dataset.underline = String(on);
    });
    setActive({ ...active });
  }

  function remove() {
    marksFor(ref.current, active.id).forEach((mark) => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
    setNotes(({ [active.id]: _gone, ...rest }) => rest);
    setActive(null);
    setEditingNote(false);
  }

  function saveNote(text) {
    setNotes((current) => ({ ...current, [active.id]: text }));
    marksFor(ref.current, active.id).forEach((m) => {
      m.dataset.note = text.trim() ? "true" : "false";
    });
  }

  const activeMarks = active && ref.current ? marksFor(ref.current, active.id) : [];
  const activeColor = activeMarks[0]?.dataset.color;
  const underlined = activeMarks[0]?.dataset.underline === "true";

  return (
    <div
      ref={ref}
      className={`mk-hl-scope ${className}`.trim()}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      {children}
      {active ? (
        <div
          className="mk-hl-toolbar"
          style={{ top: active.top, left: active.left }}
          onMouseDown={(e) => {
            if (e.target.tagName !== "TEXTAREA") e.preventDefault();
          }}
        >
          <div className="mk-hl-row">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="mk-hl-swatch"
                data-color={color}
                aria-pressed={activeColor === color}
                aria-label={`Highlight ${color}`}
                onClick={() => setColor(color)}
              />
            ))}
            <span className="mk-hl-sep" />
            <button
              type="button"
              className="mk-hl-action"
              aria-pressed={underlined}
              aria-label="Underline"
              onClick={toggleUnderline}
            >
              <UnderlineIcon />
            </button>
            <button type="button" className="mk-hl-action" aria-label="Delete highlight" onClick={remove}>
              <TrashIcon />
            </button>
            <span className="mk-hl-sep" />
            <button
              type="button"
              className="mk-hl-action mk-hl-note-btn"
              aria-pressed={editingNote}
              onClick={() => setEditingNote((v) => !v)}
            >
              <NoteIcon /> Note
            </button>
          </div>
          {editingNote ? (
            <textarea
              className="mk-hl-note"
              autoFocus
              placeholder="Add a note"
              value={notes[active.id] || ""}
              onChange={(e) => saveNote(e.target.value)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
