"use client";

import { MathJax } from "better-react-mathjax";

export default function RichText({ html, fallback, className = "" }) {
  if (!html) return fallback;
  return (
    <MathJax dynamic hideUntilTypeset="first">
      <div
        className={`rich-text ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </MathJax>
  );
}
