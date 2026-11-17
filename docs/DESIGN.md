# Vamos design system

Adult, warm and calm, inspired by Chicago transit wayfinding: strong type, clear color roles, generous space. All tokens live in `src/index.css` under `:root`.

## Color

| Token | Value | Role |
|---|---|---|
| `--cream` | #fbf7ef | Page background |
| `--card` | #ffffff | Cards, inputs |
| `--ink` | #14213d | Primary text, selected segmented controls |
| `--ink-2`, `--muted` | #3d4a63, #5b6577 | Secondary text (both pass 4.5:1 on cream and white) |
| `--cobalt` | #1f4fd1 | Primary actions, links, current navigation, the learner's car |
| `--teal` | #0b7a62 | Success, completed lessons, studied days |
| `--amber` | #e9a23b | Accent, scenario cards, "needs attention" feedback |
| `--coral` | #b9381f | Wrong answer marker, destructive actions |
| `--focus` | #f2b705 | 3px focus ring on every interactive element |

Meaning never depends on color alone: correct and wrong answers also get icons, text tags and a dashed border for wrong; signals carry text captions; scene vehicles carry text labels.

## Type and spacing

System font stack, 17px base, 800 weight headings, 1.55 line height. Base spacing 16px; cards use 18px padding and 14px radius.

## Components

- **Buttons:** primary (cobalt), secondary (outlined), ghost, danger. Minimum height 44 to 46px.
- **Cards:** white with a 1px warm border and a soft shadow. The hero card on Today has a cobalt left rule.
- **Choices:** full-width cards with letter badges. Native radio inputs underneath, so arrow keys, Tab and screen readers work; number keys 1 to 4 also select.
- **Rating:** 1 to 5 radio group labeled from "Not yet" to "Very".
- **Dialogs:** native `<dialog>` with focus containment and Escape to close.
- **Status pills:** level-new, learning, practicing, solid.
- **Navigation:** five-item bottom bar on phones (Today, Learn, Review, Test, More); full sidebar from 960px.

## Visuals

- **Signs** (`src/visuals/Sign.tsx`): official shape and color per type; lettering stays in English as on U.S. roads; bilingual accessible names.
- **Signals** (`src/visuals/Signal.tsx`): lamp housings with a visible text caption; flashing uses a blink animation that stops under reduced motion.
- **Scenes** (`src/visuals/Scene.tsx`): 320x240 top-down diagrams. The learner's car is always blue with a white outline, a center stripe and a "YOU / USTED" label. Every vehicle has a pointed front for direction of travel. Answer annotations (order badges, arrows) are marked `reveal` and appear only after answering.

## Motion

Short transitions only (progress fill, button press). No confetti or surprise sounds. `prefers-reduced-motion` and the in-app "Reduce motion" setting disable animation.

## Voice and tone

Clear, adult and friendly. No emojis, no em dashes, no "you should know this". Spanish uses usted, Mexican Spanish vocabulary (banqueta, rebasar, direccional, acotamiento) and gender-neutral phrasing where possible.
