const NOTES_PREFIX = "While researching a topic, a student has taken the following notes:";

// A period after a title, a common abbreviation, or a lone initial rarely ends
// a note ("Ecologist Dr. Suzanne Simard", "John F. Kennedy", "et al.").
const ABBREVIATION_END =
  /(?:\b(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|Mt|Ft|Gen|Col|Lt|Capt|Rev|Gov|Sen|Rep|No|Vol|vs|Inc|Corp|Ltd|approx|ca)\.|\bet al\.|\b(?:e\.g|i\.e|U\.S|U\.K|Ph\.D)\.|\b[A-Z]\.)$/;

/** Rejoin sentence splits that landed after an abbreviation or before lowercase text. */
function mergeFalseBreaks(parts) {
  const out = [];
  for (const part of parts) {
    const previous = out[out.length - 1];
    if (previous && (ABBREVIATION_END.test(previous) || /^[a-z]/.test(part))) {
      out[out.length - 1] = `${previous} ${part}`;
    } else {
      out.push(part);
    }
  }
  return out;
}

/*
 * Notes imported as flattened text lose their bullets, so they are recovered
 * by sentence. Imports with the source HTML list render it directly instead.
 */
function sentences(text) {
  let parts;
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    parts = [...segmenter.segment(text)].map(({ segment }) => segment.trim()).filter(Boolean);
  } else {
    parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9“])/).filter(Boolean);
  }
  return mergeFalseBreaks(parts);
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
