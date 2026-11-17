# QA report

Date: 2026-11-17. Build environment: Linux container, Node 22, headless Chromium 1243 (Playwright). Content version 2026.11.1.

## Automated: unit tests (Vitest), 51 passing

Run: `npm test`

| Area | What is checked |
|---|---|
| Curriculum (12) | 154 unique question IDs; English and Spanish prompt, explanation, notice and choices; valid correct answer; a "why" for every wrong choice; true/false wrong-answer explanations; "both/neither" items keep fixed order; printed page citations 1 to 106; every question taught in exactly one lesson with matching topic; all eight lesson parts in both languages; units cover each lesson once; scenarios link to real places, lessons and questions with Chicago-range coordinates; no emojis or em dashes; STOP lettering kept in Spanish text |
| Dates (2) | Chicago dates across the 2026-11-01 DST change with no duplicate or skipped days; month arithmetic; invalid time zone falls back |
| Review (5) | Wrong answers return in 1 day at box 1; correct answers space out; repeating before due does not advance; unsure does not advance; first exposure is not mastery; due list prioritizes wrong answers and caps at 15 |
| Planner (6) | 30, 60 and 90 day plans differ; no day exceeds the session length; past date, too-close date and no study days; workload too large reports extra minutes needed; completed work preserved and "ahead" detected; flexible plans |
| Exam (6) | 35 questions with no duplicate IDs over 39 seeds; at least 10 sign questions and every topic present; fixed-order items keep order; recently seen questions avoided; 28/35 passes and 27/35 fails; unanswered count as incorrect; one strong attempt or the same questions repeated is not "consistent" |
| Points (1) | Ledger cannot award a key twice |
| Store (13, jsdom) | Older saved data without the theme setting loads unchanged;  Two neutral learners and no seeded progress; learners independent (review, language, unfinished lesson); reload restores active learner, names and progress; interrupted lesson resumes at the same step and question; corrupt storage recovered with a copy kept; invalid structure rejected; backup round-trip; import rejects non-JSON, non-Vamos, invalid, oversized and newer-version files; HTML in notes stays plain text; scoped reset affects only the chosen data and learner; lesson points not farmable; review points once per question per day; wrong answers enter review; exam resume, single submit, history not overwritten, discard, answers ignored without an active exam |
| Strings (2) | Every interface key has both languages with matching placeholders, no emojis or em dashes; every `t('key')` used in source exists |
| Voice parsing (1) | "B", "option three", "la segunda", "opción uno", "verdadero", "false"; nonsense and out-of-range rejected |
| Calendar (1) | Weekly RRULE on chosen days, local time zone start and end, alarm |

## Automated: browser tests (Playwright), 42 passing

Run: `npm run e2e`. Each test runs at 360x780 (phone), 820x1100 (tablet) and 1366x900 (desktop).

1. Every screen renders with no page errors, no console errors and no horizontal overflow
2. Switching language mid-question keeps the same question and selection, changes `<html lang>`, and survives reload
3. A double-clicked "Check answer" grades once; the wrong answer is explained; the item enters review and is re-queued once in the lesson
4. A lesson can be completed with the keyboard only; focus moves to Continue after feedback
5. Practice test: no correctness shown before submit; flag and unanswered counts in the confirmation dialog; results and history saved
6. Rename the second learner, switch to them, and confirm the first learner's unfinished lesson did not carry over
7. Denied microphone shows a message and touch answering still works; navigation cancels speech
8. A recognized spoken answer is shown and requires "Use this answer" before grading
9. With map tiles blocked, a fallback notice appears, the list still works, scenario labels and OpenStreetMap attribution are visible
10. Corrupt stored data shows a notice and the app still loads
11. Renaming shows "Unsaved changes", then an inline "Saved as" confirmation, and survives reload
12. Settings changes are not stored until Save; leaving with unsaved changes asks first and can be cancelled
13. The header save button confirms saving
14. A practice test can be saved, exited and resumed after reload with answers intact

## Manual checks performed (headless Chromium screenshots)

- Today, Learn, lesson steps, question feedback, Scenarios (map with 9 pins and detail card), Spanish lesson question: reviewed visually at 375px and 1280px
- Fixed after review: brand mark size, a focus ring showing on page headings after navigation, header overflow at 360px, map pins not appearing (marker layer raced map creation), tile-failure detection on small maps, hill-parking wheel markers overlapping the label, a planner that front-loaded three lessons a day
- Map tiles from tile.openstreetmap.org loaded in the build environment

## Not performed

- Real devices (iPhone Safari, Android Chrome), Firefox and Safari engines
- Screen reader testing (VoiceOver, TalkBack, NVDA); only semantic markup and labels were checked in code and through accessible-name queries in tests
- Formal contrast audit with a tool; colors were chosen to exceed 4.5:1 for text but not measured for every state
- 200% and 400% zoom testing
- Actual speech synthesis and recognition audio (headless browser; the APIs were stubbed in tests)
- Opening the generated .ics file in Google, Apple or Outlook calendars
- Service worker offline behavior after deployment
- Review of the Spanish by a fluent professional translator
- Verification of legal details against current statute or the official regulation (site unreachable from the build environment)
