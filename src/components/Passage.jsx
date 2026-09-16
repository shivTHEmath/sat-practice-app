"use client";

import { useRef } from "react";
import QuestionContent from "./QuestionContent";

/**
 * The passage pane. Selecting text and releasing highlights it, and clicking an
 * existing highlight removes it, mirroring Bluebook's highlighter.
 */
export default function Passage({ question, highlightOn }) {
  const ref = useRef(null);

  function handleMouseUp() {
    if (!highlightOn) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) return;

    const range = sel.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;

    const mark = document.createElement("mark");
    try {
      range.surroundContents(mark);
    } catch {
      // surroundContents throws when the range straddles element boundaries;
      // moving the nodes achieves the same result.
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
    }
    sel.removeAllRanges();
  }

  function handleClick(event) {
    if (event.target.tagName !== "MARK") return;
    const mark = event.target;
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }

  return (
    <div
      ref={ref}
      key={question.id}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      className="bb-passage text-[1.05rem] leading-[1.7]"
    >
      <QuestionContent question={question} />
    </div>
  );
}
