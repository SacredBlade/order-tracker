# DESIGN.md

The full design system lives in **`src/app/globals.css`** (tokens + component
classes). This file explains the intent.

## Theme
Light. Scene: an operator at a desk on a wide monitor in a warehouse office in
daytime, scanning status and clicking to advance orders. Bright ambient light and
glance-and-act use force a light, high-legibility surface, not a dark tool aesthetic.

## Color (strategy: Restrained)
All colours are OKLCH. Neutrals are tinted slightly warm so nothing feels clinical.

- **Paper** `oklch(0.968 0.004 75)` — page background (warm off-white).
- **Card** `oklch(0.995 0.002 80)` — the centered white card.
- **Ink** `oklch(0.24 0.012 60)` — primary text (warm near-black, never #000).
- **Accent** `oklch(0.52 0.092 200)` — a deep teal. Primary actions + selection only.
  Deliberately not SaaS blue, and distinct from the warning/danger hues.
- **Warn (stuck)** amber → tints the whole card when an order is over threshold.
- **Danger** red, **Go/complete** green, used only on the relevant actions.
- **Stage hues** muted dots (slate / violet / amber / green) to tell stages apart
  without shouting.

## Typography
- **Geist Sans** for all UI; **Geist Mono** for order numbers and batch codes
  (they are codes; monospace aids scanning and alignment, functional not decorative).
- Fixed rem scale, tight ratio. Numbers use tabular figures.

## Layout
- One centered card (max 960px) on paper. Top bar above it: title, global search,
  Audit Log + Sign out.
- Four pill tabs with live counts. Orders are a single-column list of cards.
- Cards are the right affordance here: each order is a discrete unit you act on.

## Motion
- 150–250ms, ease-out-quint. Dialogs/dropdowns pop in (opacity + transform only).
- Respects `prefers-reduced-motion`.

## Components
Buttons, inputs, dialogs share one vocabulary (see `globals.css`). Every control
has hover/focus/active/disabled. Loading shows a skeleton list; empty states teach.
