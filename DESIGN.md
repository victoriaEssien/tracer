# Design

The visual world for Tracer. Product truth lives in [PRODUCT.md](PRODUCT.md).

## The idea

**An instrument for deciding.**

Tracer is not a browsing experience. Someone opens it with a free evening and a question: which of these forty issues is worth it? The interface is the instrument they read that answer off, and instruments earn trust by being precise, legible and unembellished.

Two registers, because the product has two jobs:

- **The queue** (feed, saved, dismissed) is a **console**. Rows, not cards. Score as the primary axis. Dense enough to compare twenty things without scrolling, quiet enough to read forty without fatigue. Operate mode: scanability beats expression.
- **The dossier** (opportunity detail) is **editorial**. This is where the reasoning lives, and reasoning needs measure, rhythm and room. Serif display, 65 to 75 characters, real paragraph structure.

The two registers share tokens, spacing and icons, so moving between them reads as one product changing gear rather than two designs.

## Type

Self-hosted through `next/font/google`, subset and preloaded.

| Role | Face | Use |
| --- | --- | --- |
| UI and body | **Instrument Sans** | Every interface label, control, list row, paragraph in the console register. |
| Display | **Instrument Serif** | The dossier title, the landing statement, section openers in Read surfaces. Never in the console. |
| Data | **JetBrains Mono** | Scores, counts, repository identifiers, file paths, latencies, weights. Measurement only, never as a costume for "technical". |

Scale steps: 0.75 / 0.8125 / 0.875 / 1 / 1.125 / 1.5 / 2 / 3rem. Tracking tightens as size grows, floor -0.03em. Display is balanced and capped at 3rem; the landing statement is the only place it runs large.

Numerals are tabular everywhere a number can change: scores, weights, counts, latencies.

## Colour

Warm paper neutrals rather than blue-grey, so the surface reads as a document rather than a dashboard chrome. One brand accent, deliberately not a verdict colour, so that colour carrying meaning is never confused with colour carrying identity.

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `canvas` | `#faf9f7` | `#0f1011` | Page ground |
| `surface` | `#ffffff` | `#17191a` | Rows, panels |
| `raised` | `#f2f0ec` | `#212425` | Meters, inset fields |
| `line` | `#e4e1da` | `#2b2f30` | Rules and borders |
| `ink` | `#191817` | `#eceae5` | Primary text |
| `ink-soft` | `#575450` | `#a3a09a` | Secondary text |
| `ink-faint` | `#6f6c66` | `#8d8a82` | Tertiary, metadata (4.5:1 against canvas and raised) |
| `accent` | `#1b4ea8` | `#8fb3ff` | Brand: links, focus, active state |
| `good` | `#1a6b3c` | `#63c58d` | Recommended |
| `warn` | `#8a5410` | `#dda94f` | Possible |
| `bad` | `#9c3025` | `#e28b7f` | Not recommended |

Verdict is never carried by colour alone: every verdict also has a label and a distinct meter fill.

## Motion

**Confident restraint.** This is a tool someone uses weekly; decoration becomes irritation. Motion exists only where it carries information.

- One authored moment: the score meter fills from zero on first paint of a row, 420ms, exponential ease-out, staggered 25ms down the list. It communicates the ranking as the list settles, then never repeats.
- State transitions (hover, focus, save, dismiss) are 120ms, opacity and background only.
- Everything honours `prefers-reduced-motion`.

No entrance animations on sections, no parallax, no scroll-driven effects.

## Components

- **Row** is the queue's atom: score meter, title, repository, signal chips, age, actions. Full-row hover, keyboard focusable, `j`/`k`/`Enter`/`s`/`d` operable.
- **Meter** renders a 0 to 100 score as a filled track tinted by verdict. The one piece of data visualisation in the product.
- **Chip** carries a single fact: a technology, a difficulty, an estimate.
- **Evidence list** pairs an icon with a claim. Positive and cautionary variants.
- **Panel** is the dossier's container: a rule, a heading, content. Not a card, and never nested.

Icons come from **lucide-react** at 16px, 1.5 stroke. No emoji, no unicode glyphs standing in for icons.

## Browser surfaces

Selection, caret, scrollbars, focus rings and underline offsets are themed from the palette rather than left to the browser.

## Refusals

Specific to this project, beyond the general floor:

- No cards as page scaffolding. The console uses rules and rows; the dossier uses panels with rules.
- No eyebrow or kicker above any heading.
- No progress rings, sparklines or stat tiles standing in for the score. The meter is the only chart.
- No monospace outside data.
- No colour-only verdict encoding.
