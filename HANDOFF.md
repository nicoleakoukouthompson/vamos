# Vamos: handoff and implementation checklist

Keep this file current at the end of each work session. It is the starting point for the next one.

Legend: [x] done and tested · [~] done, partly tested or needs review · [ ] not done

## Status (2026-11-17)

### Foundations
- [x] TypeScript + React + Vite project, hash routing that survives reload
- [x] Typed content model with stable IDs; `[en, es]` text tuples; content version recorded on exam attempts
- [x] Versioned local storage with Zod validation, migrations, corrupt-data recovery, unavailable-storage banner
- [x] Two independent profiles ("Learner 1", "Learner 2"), rename, switch; nothing seeded
- [x] Export, import (validated, size-limited) and scoped resets with confirmation
- [x] Production build, type checks, unit tests (50), browser tests (30 across 3 widths)
- [x] GitHub Actions workflow for tests and GitHub Pages deploy

### Learning
- [x] 31 lessons in 19 units covering every handbook driving topic in the brief (eight-part structure)
- [x] 154 distinct bilingual questions; formats: multiple choice, sign, scenario, compare, hazard, true/false, ordering
- [x] Feedback: why it is right, why the chosen answer is wrong, what to notice, printed page citation, claim type label
- [x] Wrong answers re-asked once per lesson; "I was unsure" option; choices shuffled except where order matters
- [x] Spaced review, prioritized and capped; mastery needs correct answers on different days
- [x] Points ledger (no double awards); optional streak (off by default); weekly consistency; no hearts, locks or rankings
- [~] SVG signs, signals and 29 scenes; several reviewed visually, not all scenes individually inspected at every size

### Planning
- [x] 1, 2, 3 months, custom date, flexible; study days; minutes; time zone (America/Chicago default)
- [x] Even lesson spread, practice-test days at the end, honest messages for past, too-close, no-days, needs-more-time, ahead
- [x] Returning after 3+ days: "Welcome back. Let's begin with five minutes."
- [~] Calendar (.ics) reminders generated and unit-tested; not yet opened in real calendar apps
- [ ] Push notifications: not possible without a server; documented as unavailable

### Practice test
- [x] 35 questions, at least 10 signs, all topics, untimed default, optional app timer, flags, question list, confirmation, results, topic breakdown, missed-answer review, history
- [~] Format unverified against the official regulation (see limitations)

### Chicago
- [x] Leaflet + OpenStreetMap (lazy-loaded), 9 verified places, 13 scenarios, topic and difficulty filters, list view, tile-failure fallback, scenario labels

### Road-ready
- [x] 11-step path, pre-lesson observation tasks, provider comparison (empty until the learner fills it), EN/ES inquiry scripts, nervous-driver plan
- [x] Supervised practice log (add, edit, delete), separate from scenarios and observation

### Voice
- [x] Read aloud (voice selection by language, rate, pause/resume/stop, no overlap, stops on navigation and profile switch)
- [x] Spoken answers (explicit start, shows heard text, interpreted answer, confirm, retry, cancel; denied and unsupported handled)
- [~] Not tested with real audio or on real devices

### Accessibility
- [x] Semantic landmarks, skip link, focus moved to the page heading on navigation, visible focus, native radio groups, native dialogs, labels, `lang` attributes, no color-only meaning, reduced motion, 44px targets, no overflow at 360px
- [ ] Screen reader and zoom testing on real devices

## Known limitations

1. **Exam format unverified.** The handbook (printed p.14) lists exam content but not the question count or passing score. The regulation at ilga.gov failed its certificate check from the build environment. The 35 / 80% format is labeled as an app setting everywhere it appears.
2. **Handbook currency.** ilsos.gov refused connections from the build environment, so the supplied copy (2026, July 2026, DSD A 112.47) was not compared with the live version, and no official Spanish handbook was located.
3. **Translation.** Spanish was written alongside the English, without professional review. Four questions carry review flags for legal details (`reviewFlags` in content; listed in docs/COVERAGE.md).
4. **Internal handbook inconsistency noted:** printed p.54 says crash reports for uninsured vehicles apply at "$500 or more" while the p.56 study question says "more than $500". The app question avoids the boundary.
5. **No sync, no accounts, no push.** By design for this version; local-only.
6. **Bundle size.** Main bundle is about 243 KB gzipped (React, Zod, and the bilingual curriculum). Acceptable, but could be split further.
7. The .ics file has no VTIMEZONE block; major calendar apps accept the TZID, but this was not tested.

## Next steps (suggested order)

1. Verify the written test format and current handbook with official sources (from a normal network), then update `EXAM_FORMAT` and `SOURCE_DOCS`.
2. Fluent Spanish review of all content, starting with flagged items and legal wording.
3. Real-device pass: iPhone Safari (voice support differs), Android Chrome, VoiceOver and TalkBack, 200% zoom.
4. Open the .ics file in Google and Apple calendars.
5. Grow the bank with more level 3 and 4 scenario items and more Chicago scenarios.
6. Optional: cloud sync behind the existing `loadData` / `saveData` interface, with real authentication and server-side ownership checks.

## Where things are

- Content: `src/content` (questions, lessons, scenarios, road-ready, sources, glossary)
- Logic: `src/core`; storage: `src/store`; voice: `src/voice`; visuals: `src/visuals`; screens: `src/screens`; shared UI: `src/ui`; strings: `src/i18n/strings.ts`
- Tests: `tests/unit`, `tests/e2e`; docs: `docs/`
