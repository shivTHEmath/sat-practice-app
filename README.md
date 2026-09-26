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
- **Mock tests**: `/mock` runs full-length, fixed-form mocks (Reading and
  Writing, a 10-minute break, then Math with Desmos and the reference sheet)
  and reports an estimated score with an answer review. There are five PSAT
  mocks in a typical Bluebook difficulty mix and five SAT mocks that are
  deliberately harder than Bluebook, which the page says up front. Mocks are
  assembled by `scripts/pick-mocks.mjs` (no question appears in two mocks) and
  loaded with `npm run seed-mocks`.
- **Locked mode** (mocks, on by default at the start screen): the test runs in
  full screen. Leaving full screen or switching tabs or apps hides the test
  behind a "Return to Your Test" screen while the clock keeps running, and each
  exit is listed with its time on the score report. Pausing (Exit the Exam)
  saves the sitting and releases the browser; resuming returns to full screen.
  A web page can't block other apps the way the Bluebook app does, so this
  hides and records rather than prevents. If a browser refuses full screen,
  the sitting continues with exits still recorded.
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

`scripts/bank.json` holds 679 SAT Reading and Writing questions parsed from a
PDF export, each with its passage, stem, four choices, correct answer,
rationale, domain, skill, and difficulty. Tables are preserved as structured
rows.

The PDF couldn't carry 74 of the export's questions, mostly ones whose charts
are vector drawings or that refer to an underlined portion the PDF drops.
Those came from College Board's question bank API instead, which supplies the
full HTML: 26 charts as accessible SVG and 44 underlined spans marked up. They
live in `scripts/sat-rw-bank.json`, so the SAT Reading and Writing bank now has
all 753 questions from the export.

The 81 SAT notes-style questions ("While researching a topic, a student has
taken the following notes:") were flattened to plain text by the PDF parser,
so their bullets were guessed by sentence. `scripts/backfill-notes-html.mjs`
replaced each with its source HTML list after checking the text matches.

Math comes from the same API: `scripts/math-bank.json` (PSAT) and
`scripts/sat-math-bank.json` (SAT). Mocks use only the digital Math questions,
whose math is MathML; older legacy questions store equations as images.

To import another export, run
`node scripts/import-bank.mjs <export.pdf> [--skip-existing]`, then
`node scripts/seed-bank.mjs <output file>`. The export's Assessment and Test
columns choose the output file, and `--skip-existing` leaves rows already in
Supabase untouched.
