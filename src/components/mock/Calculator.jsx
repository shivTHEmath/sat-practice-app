"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";
import { CalculatorIcon, CloseIcon, GraphIcon } from "./icons";

// Desmos's documented demo key works for local and personal use. Set
// NEXT_PUBLIC_DESMOS_API_KEY to a free production key before hosting publicly.
const DESMOS_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY || "dcb31709b452b1cf9dc26972add0fda6";

let desmosPromise;

function loadDesmos() {
  if (typeof window !== "undefined" && window.Desmos) return Promise.resolve(window.Desmos);
  if (!desmosPromise) {
    desmosPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_KEY}`;
      script.async = true;
      script.onload = () => resolve(window.Desmos);
      script.onerror = () => {
        desmosPromise = undefined;
        reject(new Error("The Desmos calculator could not be loaded."));
      };
      document.head.appendChild(script);
    });
  }
  return desmosPromise;
}

/** Bluebook's embedded Desmos, with the Graphing / Scientific switch. */
export default function Calculator({ open, onClose }) {
  const [mode, setMode] = useState("graphing");
  const [error, setError] = useState(null);
  const graphRef = useRef(null);
  const sciRef = useRef(null);
  const calcs = useRef({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadDesmos()
      .then((Desmos) => {
        if (cancelled) return;
        if (mode === "graphing" && !calcs.current.graphing && graphRef.current) {
          calcs.current.graphing = Desmos.GraphingCalculator(graphRef.current, {
            keypad: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
            border: false,
          });
        }
        if (mode === "scientific" && !calcs.current.scientific && sciRef.current) {
          calcs.current.scientific = Desmos.ScientificCalculator(sciRef.current, {
            border: false,
          });
        }
        calcs.current[mode]?.resize?.();
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [open, mode]);

  useEffect(
    () => () => {
      Object.values(calcs.current).forEach((calc) => calc?.destroy?.());
      calcs.current = {};
    },
    []
  );

  const handleResize = useCallback(() => {
    Object.values(calcs.current).forEach((calc) => calc?.resize?.());
  }, []);

  return (
    <FloatingPanel
      open={open}
      initial={() => ({ left: 0, top: 0, width: 460, height: Math.min(640, window.innerHeight - 70) })}
      onResize={handleResize}
      className="mk-calc"
      titleLeft={
        <div className="mk-calc-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "graphing"}
            onClick={() => setMode("graphing")}
          >
            <GraphIcon /> Graphing
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "scientific"}
            onClick={() => setMode("scientific")}
          >
            <CalculatorIcon /> Scientific
          </button>
        </div>
      }
      titleRight={
        <button type="button" className="mk-panel-close" aria-label="Close calculator" onClick={onClose}>
          <CloseIcon />
        </button>
      }
    >
      {error ? <p className="mk-calc-error">{error}</p> : null}
      <div ref={graphRef} className="mk-calc-surface" hidden={mode !== "graphing"} />
      <div ref={sciRef} className="mk-calc-surface" hidden={mode !== "scientific"} />
    </FloatingPanel>
  );
}
