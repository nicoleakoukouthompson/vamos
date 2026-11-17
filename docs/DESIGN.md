# Vamos design system

Sleek, high-contrast and calm: a white canvas, black type and controls, soft gray tiles, and an electric blue accent, with strong type and generous space. Inspired by the clarity of modern ride-hailing apps without copying any brand. Tokens live in `src/index.css` under `:root`; the "Sleek theme layer" at the end of that file holds component styling.

## Color

| Token | Value | Role |
|---|---|---|
| page background | #ffffff | Canvas |
| `--cream` / `--cream-2` | #f3f3f3 / #eeeeee | Gray tiles: choices, inputs, chips, list items |
| `--ink` | #000000 | Text, primary buttons, selected states, active navigation |
| `--ink-2`, `--muted` | #333333, #5e5e5e | Secondary text (both pass 4.5:1 on white and gray tiles) |
| `--cobalt` | #1f5bff | Accent: the main Today action, progress, links, the learner's car, focus ring |
| `--teal` | #05823f | Success, completed lessons, studied days |
| `--amber` | #ffb000 | Attention feedback, scenario labels |
| `--coral` | #d32f1e | Wrong answer marker, destructive actions |

Meaning never depends on color alone: correct and wrong answers also get icons, text tags and a dashed border for wrong; signals carry text captions; scene vehicles carry text labels.

## Type and spacing

System font stack, 17px base, 800 weight headings, 1.55 line height. Base spacing 16px; cards use 18px padding and 14px radius.

## Components

- **Buttons:** primary (black), secondary (gray tile), ghost (underlined text), danger. On the dark Today card the primary action is electric blue. Minimum height 44 to 46px.
- **Cards:** white, borderless, soft shadow, 16px radius. Today's session card is dark (black with a deep blue glow). The lesson-complete card is green.
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
