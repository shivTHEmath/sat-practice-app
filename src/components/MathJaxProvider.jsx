"use client";

import { MathJaxContext } from "better-react-mathjax";

// The importer preserves official MathML. MathJax gives it consistent,
// accessible browser typesetting and also supports future TeX/LaTeX content.
const config = {
  loader: { load: ["input/mml", "input/tex", "output/chtml"] },
  tex: { inlineMath: [["\\(", "\\)"], ["$", "$"]] },
};

export default function MathJaxProvider({ children }) {
  return <MathJaxContext config={config}>{children}</MathJaxContext>;
}
