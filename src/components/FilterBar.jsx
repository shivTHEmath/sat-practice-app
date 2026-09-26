"use client";

import { DIFFICULTIES, DOMAINS, SKILLS, SKILLS_BY_DOMAIN } from "@/lib/exam";

export default function FilterBar({ assessment, range, domain, skill, onAssessment, onRange, onDomain, onSkill, onHide }) {
  const [lo, hi] = range;
  const allDifficulties = lo === 1 && hi === DIFFICULTIES.length;
  const value = allDifficulties ? 0 : lo;
  const label = value === 0 ? "Mixed" : DIFFICULTIES[value - 1];
  const skills = domain ? SKILLS_BY_DOMAIN[domain] : SKILLS;

  return (
    <div className="difficulty-bar">
      <div className="difficulty-filter">
        <div className="difficulty-copy">
          <span>Difficulty</span>
          <strong>{label}</strong>
        </div>
        <div className="difficulty-control">
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={value}
            onChange={(event) => {
              const next = Number(event.target.value);
              onRange(next === 0 ? [1, 3] : [next, next]);
            }}
            aria-label="Question difficulty"
            aria-valuetext={label}
          />
          <div className="difficulty-labels" aria-hidden="true">
            <span>Mixed</span>
            <span>Easy</span>
            <span>Medium</span>
            <span>Hard</span>
          </div>
        </div>
      </div>

      <div className="topic-filters">
        <label className="filter-select-group assessment-select">
          <span>Test</span>
          <select value={assessment} onChange={(event) => onAssessment(event.target.value)}>
            <option value="SAT">SAT</option>
            <option value="PSAT">PSAT</option>
            <option value="Both">Both</option>
          </select>
        </label>
        <label className="filter-select-group">
          <span>Domain</span>
          <select value={domain} onChange={(event) => onDomain(event.target.value)}>
            <option value="">All domains</option>
            {DOMAINS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="filter-select-group">
          <span>Skill</span>
          <select value={skill} onChange={(event) => onSkill(event.target.value)}>
            <option value="">All skills</option>
            {skills.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {onHide ? (
        <button
          type="button"
          className="filter-hide"
          onClick={onHide}
          aria-label="Hide filters"
          title="Hide filters (show them again from the More menu)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2.5 9.5 7 5l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
