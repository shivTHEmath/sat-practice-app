const NOTES_PREFIX = "While researching a topic, a student has taken the following notes:";

function sentences(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    return [...segmenter.segment(text)]
      .map(({ segment }) => segment.trim())
      .filter(Boolean);
  }
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9“])/).filter(Boolean);
}

/** Recover semantic blocks that were flattened during source extraction. */
export function parsePassage(text) {
  const paired = text.match(/^Text 1\s+([\s\S]+?)\s+Text 2\s+([\s\S]+)$/i);
  if (paired) {
    return {
      type: "paired",
      sections: [
        { label: "Text 1", text: paired[1].trim() },
        { label: "Text 2", text: paired[2].trim() },
      ],
    };
  }

  if (text.startsWith(NOTES_PREFIX)) {
    return {
      type: "notes",
      introduction: NOTES_PREFIX,
      items: sentences(text.slice(NOTES_PREFIX.length).trim()),
    };
  }

  return { type: "standard", text };
}
