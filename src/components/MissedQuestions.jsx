"use client";

export default function MissedQuestions({ items, loading, error, onOpen, onClose }) {
  return (
    <section className="missed-panel" aria-label="Missed questions">
      <div className="missed-head">
        <div>
          <h2>Missed questions</h2>
          <p>Every question you have answered incorrectly is saved here.</p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close missed questions">×</button>
      </div>

      {loading ? <p className="missed-empty">Loading missed questions…</p> : null}
      {error ? <p className="missed-empty text-bb-wrong">{error}</p> : null}
      {!loading && !error && !items.length ? (
        <p className="missed-empty">No missed questions yet.</p>
      ) : null}

      {items.length ? (
        <div className="missed-list">
          {items.map((item, index) => (
            <button
              type="button"
              key={item.questionId}
              onClick={() => onOpen(item.question)}
              className="missed-row"
            >
              <span className="missed-number">{index + 1}</span>
              <span className="missed-main">
                <strong>{item.question.prompt}</strong>
                <span>{item.question.difficulty} · {item.question.domain}</span>
              </span>
              <span className={item.correctEver ? "missed-status mastered" : "missed-status"}>
                {item.correctEver ? "Corrected" : "Review"}
              </span>
              <span aria-hidden="true" className="missed-arrow">›</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
