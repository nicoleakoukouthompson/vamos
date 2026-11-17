# Adding and editing content

All curriculum content is TypeScript data in `src/content`. Text is a tuple `[English, Spanish]`. IDs are permanent: never rename or reuse an ID after release, because saved progress and exam history refer to it.

After any change, run:

```bash
npm test
```

```bash
npm run coverage
```

The content tests check: unique IDs, both languages present, a valid correct answer, a "why" explanation for every wrong choice, printed page citations, every question taught in exactly one lesson, no emojis and no em dashes.

## Add a question

1. Open the topic file in `src/content/questions/` (for example `signals.ts`).
2. Add an item with a helper from `src/content/build.ts`:
   - `mc({...})` for multiple choice, sign, scenario, compare and hazard questions (`k: 'sign'` and so on)
   - `tf({...})` for true or false (always fixed order; provide `whyWrong`)
   - `ord({...})` for sequence ordering (steps listed in the correct order; lesson-only by default)
3. Fill in:
   - `id`: new, unique, permanent (for example `sl-green-arrow`)
   - `t`: topic ID; `l`: level 1 (recognize) to 4 (competing hazards)
   - `p`: prompt; `c`: choices `[id, en, es, whyWrongEn, whyWrongEs]`; `a`: correct choice ID
   - `x`: why the correct answer is right; `n`: what to notice next time
   - `s`: `hb(pages, 'Chapter N: Section')` using **printed** page numbers
   - `cl`: `'law'` if the handbook states a requirement, `'guidance'` for handbook safety advice, `'app'` for a conservative tip that is not in the handbook (the UI labels it "App tip")
   - `fixed: true` only when choices refer to each other ("Both", "Neither", "A only")
   - `flags`: add a note when legal wording or amounts need expert review
4. Add the question ID to the lesson that teaches it in `src/content/lessons.ts`.
5. If answers or meanings changed, bump `CONTENT_VERSION` in `src/content/index.ts`.

Never copy the handbook's study questions word for word, and never present an app question as an official one.

## Add a lesson

1. In `src/content/lessons.ts`, add an `L(...)` entry with: ID, topic, minutes, title, situation, explanation paragraphs, optional visual and caption, worked example, question IDs, an observation task (never while driving), recap points and source references.
2. Add the lesson ID to its unit's `lessons` list in the `units` array (order there is the learning path order).

## Add or fix a translation

Edit the Spanish half of the tuple. Interface text is in `src/i18n/strings.ts` (the test checks that every key has both languages and matching `{placeholders}`). Keep U.S. sign lettering in English (STOP, YIELD) and explain it in Spanish. Prefer gender-neutral wording.

## Add a Chicago scenario

1. Check the place with an official or OpenStreetMap source and record how and when in `places` in `src/content/scenarios.ts` (`verified: { method, date, query }`). Pin areas or corridors, not specific addresses.
2. Add a `scenarios` entry linking `placeId`, `topic`, `difficulty` (1 to 3), `lessonId`, `questionId` and an optional `visual`.
3. Do not describe current lanes, signals, signs, speed limits, construction or restrictions as fact. Every scenario is displayed with the label "Illustrated practice scenario inspired by this area. Street conditions and controls may differ."

## Add a diagram

Add a `SceneId` in `src/content/types.ts` and its definition in `SCENES` in `src/visuals/Scene.tsx`. Use `you: true` for the learner's car, labels for every other road user, and `reveal: true` on anything that would give away the answer. Check that the diagram matches the explanation text exactly.
