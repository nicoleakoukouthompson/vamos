# Vamos

**Chicago driving, one calm step at a time.**
*Manejar en Chicago, paso a paso y con calma.*

Vamos is a bilingual (English and Spanish) web app that helps two adult beginners prepare for the Illinois written permit test and, separately, prepare for supervised driving in Chicago. It runs in any modern browser, phone first, and saves progress on the device.

> Vamos is a study aid. Finishing lessons, meeting a date or scoring well on practice tests does not guarantee passing the official test or being a safe driver. Its questions were written for this app and are not official exam questions.

## What is in it

| Area | What it does |
|---|---|
| Today | The next action (continue, review, or start a lesson), goal and time left, a short week plan |
| Learn | 31 short lessons in 19 units. Each lesson: situation, explanation, visual, worked example, questions with reasoning, observation task, recap |
| Review | Spaced review: wrong or unsure answers come back sooner; known items space out to 30 days |
| Chicago scenarios | 13 illustrated scenarios at 9 real Chicago areas on an OpenStreetMap map, with a list view, filters and a fallback when tiles fail |
| Practice test | 35 balanced questions, untimed by default, flags, question list, submit confirmation, topic breakdown, explanations, history |
| Road-ready | An 11-step path to supervised driving, pre-lesson observation tasks, a driving school comparison table, English and Spanish inquiry scripts, a plan for nervous drivers |
| Practice log | Supervised driving sessions (separate from quizzes and observation) |
| Progress | Knowledge, confidence and practical experience kept as three separate measures; weekly consistency; points |
| Goals and settings | 1, 2 or 3 months, custom date, or flexible; study days; minutes; time zone; calendar reminders; names; language; accessibility; voice; backup, import and scoped resets |
| Sources and help | Handbook edition and citation method, official links, coverage matrix, privacy, voice, offline, glossary, known limitations |

Curriculum: **154 distinct questions**, each in English and Spanish, each citing a printed handbook page. See [docs/COVERAGE.md](docs/COVERAGE.md).

## Quick start

Requirements: Node.js 20 or newer (22 recommended).

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints (usually http://localhost:5173).

Other commands:

| Command | Purpose |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npx vite preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript checks |
| `npm test` | Unit tests (Vitest): content, engine, storage, strings, voice parsing, calendar |
| `npm run e2e` | Browser tests (Playwright) at phone, tablet and desktop widths |
| `npm run coverage` | Regenerate `docs/COVERAGE.md` from the content |

For browser tests, either run `npx playwright install chromium` once, or point `PW_EXECUTABLE` at an existing Chromium (see `.env.example`).

No environment variables or secrets are required. `.env.example` lists the optional ones.

## Deploying

The repository includes `.github/workflows/deploy.yml`. On every push to `main` it type-checks, runs unit tests, builds with the right base path and publishes to GitHub Pages. In the repository settings, under **Pages**, set **Source** to **GitHub Actions** once.

Any static host works: run `npm run build` and upload `dist/`. Routing uses `#/` URLs, so reloads work without server rewrites.

## How to use it

- **Open it:** on a phone, open the site link in the browser. To make it feel like an app, use "Add to Home Screen".
- **Create or rename the two profiles:** both exist from the start as "Learner 1" and "Learner 2". Rename them in **Goals and settings > Learners**. Switch with the name button at the top right.
- **Change the target date:** **Goals and settings > Study goal**. Pick 1, 2 or 3 months, a custom date, or flexible. Completed work is always kept.
- **Switch languages:** the **EN / ES** button at the top right, on every screen. Each learner keeps their own language. Switching mid-question keeps the question and your selection.
- **Use voice:** **Read aloud** on lessons, questions and feedback (pause, resume, stop). **Speak your answer** listens once after you press it, shows what it heard, and asks you to confirm before grading. Reading speed is in settings. Voice is for studying while stationary, never while driving.
- **Reminders:** set a time and download the calendar file (.ics). Your phone's calendar sends the reminders. Vamos itself has no server and cannot send push notifications.

## Where progress is saved

- In this browser on this device only (`localStorage`), with a versioned schema, validation and migrations.
- It does **not** sync across devices. Use **Export backup** and **Import backup** to move it.
- The two profiles share one device. They keep progress separate, but they are not password protected and are not a privacy boundary.
- If stored data cannot be read, Vamos starts fresh, keeps a copy of the unreadable data in browser storage, and tells you.
- The storage layer (`src/store/storage.ts`) is a small load/save interface so cloud sync can be added later.

## Privacy

No accounts, advertising, analytics or tracking. Vamos never asks for a legal name, address, license number, immigration status or medical history, and never requests location. The only external service is OpenStreetMap's tile server when the map is open. Speech recognition is provided by the browser; in some browsers (for example Chrome) audio is sent to the browser maker for transcription. Vamos never records or stores audio.

## Architecture

- **TypeScript + React 19 + Vite.** No router or state library: a hash router (`src/ui/router.ts`) and a small external store (`src/store/store.ts`) keep it simple and portable.
- **Content is data** (`src/content`), separate from UI. Stable IDs for lessons, questions, choices and scenarios. Text is `[English, Spanish]` tuples.
- **Core logic is pure and tested** (`src/core`): dates in the learner's time zone (calendar dates, not timestamps), spaced review, mastery, planner, exam building and grading, points ledger, calendar export.
- **Persistence** (`src/store`): versioned schema, Zod validation for stored data and imports, size limits, migrations, scoped resets.
- **Visuals** (`src/visuals`): road signs, signals and traffic scenes as SVG. No generated images.
- **Voice** (`src/voice`): Web Speech API with feature detection and fallbacks.
- **Offline:** a service worker (`public/sw.js`) caches the app shell and built assets after the first visit. The map, speech recognition and some voices need a connection.
- **Map:** Leaflet, lazy-loaded only on the scenarios screen, with OpenStreetMap attribution.

## Documentation

- [HANDOFF.md](HANDOFF.md): implementation checklist, status and next steps
- [docs/COVERAGE.md](docs/COVERAGE.md): curriculum and source coverage matrix (generated)
- [docs/QA_REPORT.md](docs/QA_REPORT.md): what was tested, how, and what was not
- [docs/DESIGN.md](docs/DESIGN.md): design system reference
- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md): how to add a lesson, question, translation or Chicago scenario

## Known limitations

See the **Known limitations** section of [HANDOFF.md](HANDOFF.md). The most important ones:

1. The practice test format (35 questions, 80%) is **not verified** against the official regulation. The handbook does not state it, and the regulation site could not be reached from the build environment.
2. The handbook copy (Rules of the Road 2026, July 2026, DSD A 112.47) was supplied by the project administrator and **not compared** with the version currently posted online. No official Spanish handbook was compared.
3. Spanish text has **not** been reviewed by a professional translator. Items with legal detail carry review flags.
4. No cross-device sync, no push notifications, no accounts.
