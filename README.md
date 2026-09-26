# SAT + PSAT Reading & Writing Practice

A deliberately small Bluebook-style practice app for SAT and PSAT Reading and Writing.
It serves questions from a College Board question-bank export, with optional
instant answer checking and per-question timing.

## How it works

Open it, pick a username or continue as guest, and questions start immediately.
It is a problem spewer first: the stream never ends, topping itself up as you
go. Everything else is secondary and lives in the toolbar.

- **Bluebook exam UI**: practice, timed modules, and full mocks share one
  Bluebook testing frame: pale-blue header and footer with dashed rules,
  centered clock with a hide toggle, Directions dropdown, draggable split
  between passage and question, highlights and notes, ABC cross-out, mark for
  review, line reader, and the More menu. Practice keeps the dark theme.
- **Instant answer checking** in practice: selecting a choice locks it, marks
  it right or wrong, and expands the College Board rationale. There is no cap,
  no going back, and no navigator; practice is just answer, see why, next.
- **Difficulty**: an always-visible slider under the header switches between a
  mixed stream and easy, medium, or hard questions. Changes apply immediately.
- **Fast practice loop**: press A–D to answer and Enter or the right arrow to
  move on. The question bank is cached after its first load, so later refills
  and filter changes do not repeatedly fetch the same data.
- **Persistent progress**: signed-in users do not receive questions they have
  already answered correctly. Every missed question remains available from
  **Review missed questions** in the More menu until it is answered
  correctly.
- **Question links**: every displayed question updates the URL with its stable
  question ID. Opening that link returns directly to the problem in review
  mode after sign-in (or after continuing as a guest).
- **Practice test**: available from the More menu as a full module (27 Q /
  32 min), half (14 / 16), or third
  (9 / 11). Tests add Back, the question navigator, a countdown, and Bluebook's
  Check Your Work page, with feedback held until the end review that
  bar-charts how long each question took. Filters are hidden during a test.
  Preset modules follow the real domain mix and order.
- **PSAT mock tests**: `/mock` runs two full-length, fixed-form PSAT mocks
  (Reading and Writing, a 10-minute break, then Math with Desmos and the
  reference sheet) and reports an estimated score with an answer review.
- **Stats**: one line by default, "X / Y correct" plus the average time per
  question. An `advanced` link expands accuracy and average time broken down by
  subject and by difficulty. Practice answers are recorded as soon as an answer
  is selected.
  Guests record nothing, so the Stats button only appears when you sign in with
  a username.

## Login

Username only, no password, or continue as guest. Type a name to start; type the
same name later to pick your history back up. This means there is no security
boundary: anyone who knows a username can open that account. That is fine for
personal practice and not fine for anything sensitive. Guest sessions record
nothing.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase URL and keys
npm run seed                       # loads scripts/bank.json into Supabase
npm run dev
```

The schema lives in `supabase/migrations/0001_sat_practice.sql`.

## The question bank

`scripts/bank.json` holds 679 questions parsed from the PDF export, each with
its passage, stem, four choices, correct answer, rationale, domain, skill, and
difficulty. Tables are preserved as structured rows.

Two groups of questions were left out on purpose, because the PDF does not
carry what they depend on:

- **31 chart questions**: the charts are vector drawings, not text, so the data
  the question asks about cannot be read off the page.
- **43 underline questions**: the PDF loses which span was underlined, so
  "the underlined portion" has no referent.

Everything else from the export is included.
