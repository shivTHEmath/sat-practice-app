"use client";

import { useEffect, useRef, useState } from "react";
import { DragDotsIcon, ResizeIcon } from "./icons";

/**
 * A draggable, resizable tool window with Bluebook's black title bar. It stays
 * mounted while hidden so a calculator keeps its state between questions.
 */
export default function FloatingPanel({
  open,
  initial,
  minWidth = 320,
  minHeight = 300,
  titleLeft,
  titleRight,
  onResize,
  className = "",
  children,
}) {
  const [box, setBox] = useState(initial);
  const drag = useRef(null);

  useEffect(() => {
    const onMove = (event) => {
      const d = drag.current;
      if (!d) return;
      const dx = event.clientX - d.x;
      const dy = event.clientY - d.y;
      if (d.mode === "move") {
        setBox((b) => ({
          ...b,
          left: Math.min(Math.max(0, d.box.left + dx), window.innerWidth - 120),
          top: Math.min(Math.max(0, d.box.top + dy), window.innerHeight - 60),
        }));
      } else {
        setBox((b) => ({
          ...b,
          width: Math.max(minWidth, d.box.width + dx),
          height: Math.max(minHeight, d.box.height + dy),
        }));
      }
    };
    const onUp = () => {
      if (drag.current?.mode === "resize") onResize?.();
      drag.current = null;
      document.body.classList.remove("mk-dragging");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [minWidth, minHeight, onResize]);

  useEffect(() => {
    onResize?.();
  }, [box.width, box.height, open, onResize]);

  function start(mode, event) {
    event.preventDefault();
    drag.current = { mode, x: event.clientX, y: event.clientY, box };
    document.body.classList.add("mk-dragging");
  }

  return (
    <div
      className={`mk-panel ${className}`.trim()}
      style={{ ...box, display: open ? "flex" : "none" }}
      role="dialog"
    >
      <div className="mk-panel-bar">
        <div className="mk-panel-bar-left">{titleLeft}</div>
        <button
          type="button"
          className="mk-panel-drag"
          aria-label="Move"
          onPointerDown={(e) => start("move", e)}
        >
          <DragDotsIcon />
        </button>
        <div className="mk-panel-bar-right">{titleRight}</div>
      </div>
      <div className="mk-panel-body">{children}</div>
      <button
        type="button"
        className="mk-panel-resize"
        aria-label="Resize"
        onPointerDown={(e) => start("resize", e)}
      >
        <ResizeIcon />
      </button>
    </div>
  );
}
