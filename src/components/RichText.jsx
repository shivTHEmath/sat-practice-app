export default function RichText({ html, fallback, className = "" }) {
  if (!html) return fallback;
  return (
    <div
      className={`rich-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
