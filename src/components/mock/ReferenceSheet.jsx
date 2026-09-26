"use client";

import FloatingPanel from "./FloatingPanel";
import { CloseIcon } from "./icons";

const label = { fontFamily: "var(--mk-serif), Georgia, serif", fontStyle: "italic", fontSize: 13 };
const stroke = { fill: "none", stroke: "#1e1e1e", strokeWidth: 1.3 };

function Figure({ children, formulas, w = 120, h = 96 }) {
  return (
    <figure className="mk-ref-fig">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {children}
      </svg>
      <figcaption>{formulas}</figcaption>
    </figure>
  );
}

const pi = <i>π</i>;

/** The PSAT/SAT math reference sheet as a movable panel. */
export default function ReferenceSheet({ open, onClose }) {
  return (
    <FloatingPanel
      open={open}
      initial={() => {
        const width = Math.min(560, window.innerWidth - 32);
        return {
          left: Math.max(16, window.innerWidth - width - 24),
          top: 90,
          width,
          height: Math.min(640, window.innerHeight - 170),
        };
      }}
      minWidth={380}
      className="mk-ref"
      titleLeft={<span className="mk-ref-title">Reference Sheet</span>}
      titleRight={
        <button type="button" className="mk-panel-close" aria-label="Close reference sheet" onClick={onClose}>
          <CloseIcon />
        </button>
      }
    >
      <div className="mk-ref-body">
        <div className="mk-ref-grid">
          <Figure formulas={<>A = {pi}<i>r</i>²<br />C = 2{pi}<i>r</i></>}>
            <circle cx="60" cy="48" r="38" {...stroke} />
            <line x1="60" y1="48" x2="98" y2="48" {...stroke} />
            <circle cx="60" cy="48" r="2" fill="#1e1e1e" />
            <text x="76" y="42" style={label}>r</text>
          </Figure>
          <Figure formulas={<>A = <i>ℓw</i></>}>
            <rect x="12" y="24" width="96" height="52" {...stroke} />
            <text x="56" y="92" style={label}>ℓ</text>
            <text x="0" y="54" style={label}>w</text>
          </Figure>
          <Figure formulas={<>A = ½<i>bh</i></>}>
            <path d="M8 80h104L78 14z" {...stroke} />
            <line x1="78" y1="14" x2="78" y2="80" {...stroke} strokeDasharray="3 3" />
            <path d="M78 72h8v8" {...stroke} />
            <text x="82" y="50" style={label}>h</text>
            <text x="56" y="94" style={label}>b</text>
          </Figure>
          <Figure formulas={<><i>c</i>² = <i>a</i>² + <i>b</i>²</>}>
            <path d="M16 78h86V18z" {...stroke} />
            <path d="M94 78v-8h8" {...stroke} />
            <text x="52" y="44" style={label}>c</text>
            <text x="106" y="52" style={label}>a</text>
            <text x="56" y="93" style={label}>b</text>
          </Figure>
          <Figure w={130} formulas={<>Special Right Triangles</>}>
            <path d="M10 82h70V22z" {...stroke} />
            <path d="M72 82v-8h8" {...stroke} />
            <text x="30" y="44" style={label}>2x</text>
            <text x="84" y="56" style={label}>x</text>
            <text x="30" y="95" style={label}>x√3</text>
            <text x="16" y="78" fontSize="10">30°</text>
            <text x="62" y="36" fontSize="10">60°</text>
          </Figure>
          <Figure w={120} formulas={<>&nbsp;</>}>
            <path d="M14 82h64V18z" {...stroke} />
            <path d="M70 82v-8h8" {...stroke} />
            <text x="30" y="44" style={label}>s√2</text>
            <text x="82" y="54" style={label}>s</text>
            <text x="42" y="95" style={label}>s</text>
            <text x="22" y="78" fontSize="10">45°</text>
            <text x="58" y="34" fontSize="10">45°</text>
          </Figure>
          <Figure formulas={<>V = <i>ℓwh</i></>}>
            <path d="M12 34h66v48H12zM12 34l24-20h66L78 34M102 14v48L78 82" {...stroke} />
            <text x="42" y="95" style={label}>ℓ</text>
            <text x="92" y="82" style={label}>w</text>
            <text x="0" y="62" style={label}>h</text>
          </Figure>
          <Figure formulas={<>V = {pi}<i>r</i>²<i>h</i></>}>
            <ellipse cx="60" cy="18" rx="34" ry="9" {...stroke} />
            <path d="M26 18v58M94 18v58" {...stroke} />
            <path d="M26 76a34 9 0 0 0 68 0" {...stroke} />
            <line x1="60" y1="18" x2="94" y2="18" {...stroke} />
            <text x="72" y="14" style={label}>r</text>
            <text x="98" y="52" style={label}>h</text>
          </Figure>
          <Figure formulas={<>V = <sup>4</sup>⁄<sub>3</sub>{pi}<i>r</i>³</>}>
            <circle cx="60" cy="48" r="38" {...stroke} />
            <ellipse cx="60" cy="48" rx="38" ry="10" {...stroke} strokeDasharray="3 3" />
            <line x1="60" y1="48" x2="98" y2="48" {...stroke} />
            <text x="76" y="44" style={label}>r</text>
          </Figure>
          <Figure formulas={<>V = <sup>1</sup>⁄<sub>3</sub>{pi}<i>r</i>²<i>h</i></>}>
            <path d="M26 76 60 10l34 66" {...stroke} />
            <ellipse cx="60" cy="76" rx="34" ry="9" {...stroke} />
            <line x1="60" y1="10" x2="60" y2="76" {...stroke} strokeDasharray="3 3" />
            <line x1="60" y1="76" x2="94" y2="76" {...stroke} />
            <text x="64" y="50" style={label}>h</text>
            <text x="74" y="72" style={label}>r</text>
          </Figure>
          <Figure formulas={<>V = <sup>1</sup>⁄<sub>3</sub><i>ℓwh</i></>}>
            <path d="M14 70h62l28-18M14 70l44-60 46 42M76 70 58 10" {...stroke} />
            <path d="M14 70l28-18h62" {...stroke} strokeDasharray="3 3" />
            <line x1="58" y1="10" x2="58" y2="61" {...stroke} strokeDasharray="3 3" />
            <text x="62" y="44" style={label}>h</text>
            <text x="42" y="86" style={label}>ℓ</text>
            <text x="94" y="70" style={label}>w</text>
          </Figure>
        </div>
        <p>The number of degrees of arc in a circle is 360.</p>
        <p>The number of radians of arc in a circle is 2{pi}.</p>
        <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
      </div>
    </FloatingPanel>
  );
}
