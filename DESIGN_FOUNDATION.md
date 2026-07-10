# Neuron — Design Foundation

> **Single source of truth** for all UI and component development in Neuron.
> Stage 1 of the SciOS design program. Every future page, component, and token
> MUST conform to this document.

Neuron is an AI-powered scientific learning platform. The interface must
communicate **intelligence, precision, exploration, scientific discovery,
simplicity, premium quality, focus, and trust** — timeless rather than trendy.

This document defines the *design language*, not pages. It builds directly on
the tokens already present in `app/globals.css` (emerald/cyan signature on a
near-black ink canvas, shadcn CSS-variable base, Lucide icons) and extends them
into a complete, scale-complete system.

---

## 1. Design Philosophy

### Visual Personality
A fusion of **Apple, Linear, Notion, Cursor, Perplexity, OpenAI Platform,
Vercel, and Arc** — without copying any product. The result has its own
identity: *calm, exact, spatial, confident.*

The signature is a single restrained accent (emerald) on a deep ink canvas,
with cyan as a secondary "exploration" accent and indigo reserved for the AI
layer. Color is used as signal, not decoration.

### Keywords
Modern · Scientific · Premium · Minimal · Elegant · Spatial · Confident ·
Readable · Human-centered · Future-ready

### Avoid (hard rules)
- Gaming UI, crypto aesthetics, neon overload
- Heavy glassmorphism, excessive gradients, visual noise
- Old SaaS dashboard density, Bootstrap appearance
- Decorative glow/neon text (see §14 Migration — legacy utilities are deprecated)

### Core Principles (every component must follow)
Consistency · Accessibility · Scalability · Responsiveness · Reusability ·
Performance · Visual hierarchy · Clarity

### Contrast Direction
- **Dark mode is the primary experience.** The ink canvas (`--neutral-950`)
  is the default. Surfaces step *up* toward lightness as they elevate.
- **Light mode is supported** via a `.theme-light` override block (§3). It
  inverts the neutral ramp only; accent hues are unchanged so brand identity
  survives the switch.

---

## 2. Color System

All colors are stored as **HSL channel triplets** (`H S% L%`) and consumed via
`hsl(var(--token))`, matching the existing `globals.css` convention. This keeps
Tailwind v4's `@theme` bridge and shadcn components working unchanged.

> **Scale convention.** Hue-based colors (brand, neutral, semantic, domain)
> ship a full **50–950** ramp. Functional/state colors (focus, selection,
> overlay) and **categorical systems** (chart, knowledge-graph, AI, simulation,
> evolution, leaderboard) are defined as named tokens rather than ramps,
> because a 50–950 scale is not meaningful for a focus ring or a rank tier.

### 2.1 Neutral (Ink) — `neutral`
Base for background, surfaces, text, borders, dividers.

| Token | HSL | Usage |
|---|---|---|
| `--neutral-50` | `222 47% 97%` | Text on dark; light-mode bg |
| `--neutral-100` | `220 39% 92%` | Light-mode surface text |
| `--neutral-200` | `218 33% 82%` | Light-mode muted text |
| `--neutral-300` | `216 28% 68%` | Light-mode border |
| `--neutral-400` | `215 25% 55%` | Muted text (`--muted-foreground`) |
| `--neutral-500` | `217 30% 45%` | Disabled text |
| `--neutral-600` | `217 33% 32%` | Strong border |
| `--neutral-700` | `217 36% 22%` | Divider |
| `--neutral-800` | `218 39% 15%` | Card / surface |
| `--neutral-900` | `222 44% 9%`  | Elevated surface |
| `--neutral-950` | `222 47% 5%`  | Background (anchor) |

### 2.2 Primary (Emerald) — `primary`
The Neuron signature. Precision, growth, "the answer." Used sparingly:
primary actions, active states, key data points.

| Token | HSL | Usage |
|---|---|---|
| `--primary-50` | `157 80% 95%` | Tint backgrounds |
| `--primary-100` | `157 90% 88%` | Hover tints |
| `--primary-200` | `157 95% 76%` | Soft fills |
| `--primary-300` | `158 96% 64%` | Icon accents |
| `--primary-400` | `157 98% 56%` | Focusable accent |
| `--primary-500` | `157 100% 50%` | **Brand / primary action** |
| `--primary-600` | `158 92% 42%` | Pressed |
| `--primary-700` | `159 84% 34%` | Dense UI |
| `--primary-800` | `159 77% 27%` | Deep tint |
| `--primary-900` | `160 70% 21%` | Darkest tint |
| `--primary-950` | `161 70% 12%` | Borders on tint |

### 2.3 Secondary (Cyan) — `secondary`
"Exploration" accent. Filters, navigation aids, informational highlights,
progress tracks. Never the primary CTA.

| Token | HSL | Usage |
|---|---|---|
| `--secondary-50` | `195 90% 94%` | Tint |
| `--secondary-100` | `195 95% 85%` | Hover tint |
| `--secondary-200` | `195 98% 72%` | Soft fill |
| `--secondary-300` | `195 99% 60%` | Icon accent |
| `--secondary-400` | `195 100% 52%` | Track fill |
| `--secondary-500` | `195 100% 50%` | **Exploration accent** |
| `--secondary-600` | `196 90% 42%` | Pressed |
| `--secondary-700` | `197 82% 34%` | Dense UI |
| `--secondary-800` | `198 75% 27%` | Deep tint |
| `--secondary-900` | `199 68% 21%` | Darkest tint |
| `--secondary-950` | `200 65% 13%` | Borders on tint |

### 2.4 Accent (Indigo) — `accent`
Reserved for the **AI / intelligence layer** and premium highlights (badges,
spotlights). Distinct from primary so AI surfaces read as "the system, not you."

| Token | HSL |
|---|---|
| `--accent-50` | `240 90% 96%` |
| `--accent-100` | `240 91% 88%` |
| `--accent-200` | `240 92% 78%` |
| `--accent-300` | `240 90% 68%` |
| `--accent-400` | `240 87% 60%` |
| `--accent-500` | `239 84% 67%` |
| `--accent-600` | `240 80% 56%` |
| `--accent-700` | `240 76% 47%` |
| `--accent-800` | `240 72% 39%` |
| `--accent-900` | `240 68% 32%` |
| `--accent-950` | `240 65% 24%` |

### 2.5 Semantic — Success / Warning / Danger / Info
State communication. Success is a true green (distinct from emerald primary so
a green check never reads as "the brand button").

**Success** (`--success-*`, anchor `142 71% 45%`):
`50 142 70% 95%` · `100 142 72% 86%` · `200 142 73% 74%` · `300 142 72% 62%` ·
`400 142 72% 52%` · `500 142 71% 45%` · `600 142 70% 38%` · `700 142 68% 31%` ·
`800 142 66% 25%` · `900 142 64% 20%` · `950 142 65% 13%`

**Warning** (`--warning-*`, anchor `38 92% 50%`):
`50 38 92% 95%` · `100 38 94% 86%` · `200 38 95% 74%` · `300 38 95% 62%` ·
`400 38 95% 55%` · `500 38 92% 50%` · `600 38 90% 42%` · `700 38 88% 34%` ·
`800 38 85% 28%` · `900 38 82% 22%` · `950 38 80% 14%`

**Danger** (`--danger-*`, anchor `0 75% 50%`):
`50 0 80% 96%` · `100 0 84% 88%` · `200 0 85% 76%` · `300 0 82% 64%` ·
`400 0 78% 56%` · `500 0 75% 50%` · `600 0 74% 43%` · `700 0 72% 36%` ·
`800 0 70% 30%` · `900 0 68% 24%` · `950 0 70% 16%`

**Info** (`--info-*`, anchor `210 100% 60%`):
`50 210 90% 95%` · `100 210 94% 86%` · `200 210 96% 74%` · `300 210 98% 62%` ·
`400 210 100% 54%` · `500 210 100% 60%` · `600 211 92% 48%` · `700 212 84% 40%` ·
`800 213 76% 33%` · `900 214 68% 27%` · `950 215 65% 18%`

### 2.6 Surface & Structure tokens
Mapped onto the neutral ramp so elevation is always "step up in lightness."

| Token | Dark value | Light value | Purpose |
|---|---|---|---|
| `--background` | `222 47% 5%` (`neutral-950`) | `222 47% 97%` (`neutral-50`) | App canvas |
| `--foreground` | `213 31% 91%` (`neutral-100`) | `222 47% 9%` (`neutral-900`) | Body text |
| `--surface` | `218 39% 15%` (`neutral-800`) | `0 0% 100%` | Base surface |
| `--card` | `217 41% 8%` | `0 0% 100%` | Card surface |
| `--card-foreground` | `213 31% 91%` | `222 47% 9%` | Card text |
| `--elevated` | `222 44% 9%` (`neutral-900`) | `220 39% 96%` | Popovers, menus |
| `--border` | `217 41% 13%` | `217 33% 82%` | Default border |
| `--divider` | `217 36% 22%` (`neutral-700`) | `218 33% 82%` | Section dividers |
| `--input` | `217 41% 13%` | `217 33% 82%` | Input borders |
| `--ring` | `157 100% 50%` (`primary-500`) | `157 100% 42%` | Focus ring |
| `--muted` | `217 41% 12%` | `218 33% 90%` | Muted surface |
| `--muted-foreground` | `215 20% 55%` (`neutral-400`) | `215 20% 40%` | Muted text |

### 2.7 Functional state tokens
Not ramps — single-purpose.

| Token | Value | Purpose |
|---|---|---|
| `--focus-ring` | `157 100% 50%` @ 50% alpha | Keyboard focus halo |
| `--selection-bg` | `157 100% 50%` @ 22% alpha | Text selection |
| `--overlay` | `222 47% 3%` @ 60% alpha | Modal scrim |
| `--selection-text` | `213 31% 98%` | Selected text color |

### 2.8 Domain Colors (SciOS) — `sci-*`
Domain-specific accents. Single anchor each (the 50–950 ramp is rarely needed;
use the anchor at tints via `hsl(var(--sci-x) / <alpha>)`).

| Domain | Token | HSL |
|---|---|---|
| Physics | `--sci-physics` | `210 100% 60%` |
| Biology | `--sci-biology` | `142 71% 45%` |
| Math | `--sci-math` | `271 91% 65%` |
| Quantum | `--sci-quantum` | `258 90% 66%` |
| Space | `--sci-space` | `186 100% 50%` |
| Technology | `--sci-tech` | `25 95% 55%` |
| AI | `--sci-ai` | `239 84% 67%` |
| Chemistry | `--sci-chemistry` | `45 95% 55%` |
| Anatomy | `--sci-anatomy` | `0 72% 60%` |
| Astronomy | `--sci-astronomy` | `200 100% 55%` |

Existing `.domain-*` / `.domain-bg-*` utility classes in `globals.css` map to
these and remain valid.

### 2.9 Chart Colors
Categorical palette for data viz. 12 distinct, colorblind-aware hues built
from the domain anchors plus supplements.

`--chart-1` … `--chart-12` =
`210 100% 60%` (physics) · `157 100% 50%` (emerald) · `271 91% 65%` (math) ·
`186 100% 50%` (space) · `25 95% 55%` (tech) · `239 84% 67%` (ai) ·
`45 95% 55%` (chem) · `0 72% 60%` (anatomy) · `330 85% 62%` (magenta) ·
`95 70% 50%` (lime) · `200 100% 55%` (astro) · `285 80% 65%` (violet).

### 2.10 Knowledge Graph Colors
- **Nodes** inherit their domain color (`sci-*`). Unknown domain → `--neutral-400`.
- **Edges** are colored by the **14 relationship types** (per the relationship
  engine). Categorical assignment:

| # | Relationship type | Edge color |
|---|---|---|
| 1 | `prerequisite` | `157 100% 50%` (emerald) |
| 2 | `builds_on` | `158 96% 64%` |
| 3 | `related` | `195 100% 50%` (cyan) |
| 4 | `part_of` | `210 100% 60%` (physics blue) |
| 5 | `instance_of` | `200 100% 55%` |
| 6 | `analogous_to` | `186 100% 50%` (space) |
| 7 | `contrasts_with` | `0 72% 60%` (anatomy red) |
| 8 | `causes` | `25 95% 55%` (tech orange) |
| 9 | `measured_by` | `45 95% 55%` (chem) |
| 10 | `proven_by` | `142 71% 45%` (biology) |
| 11 | `generalizes` | `271 91% 65%` (math) |
| 12 | `specializes` | `285 80% 65%` |
| 13 | `applies_to` | `239 84% 67%` (ai indigo) |
| 14 | `discovered_by` | `330 85% 62%` (magenta) |

Edge opacity scales with relationship weight (0.25 → 0.9). Hover raises
opacity and adds `--focus-ring` halo.

### 2.11 AI Response Colors — `ai-*`
The intelligence layer (Spark chat, suggestions, explanations).

| Token | Value | Purpose |
|---|---|---|
| `--ai-assistant-bg` | `239 84% 67%` @ 8% alpha | Assistant message surface |
| `--ai-assistant-border` | `239 84% 67%` @ 22% alpha | Assistant message border |
| `--ai-user-bg` | `217 41% 17%` (`accent` neutral) | User message surface |
| `--ai-stream-cursor` | `157 100% 50%` | Blinking streaming caret |
| `--ai-citation` | `239 84% 67%` | Inline citation chip |
| `--ai-confidence` | `157 100% 50%` → `38 92% 50%` gradient | Confidence meter |
| `--ai-thinking` | `215 20% 55%` | "Reasoning" placeholder pulse |

### 2.12 Simulation Colors — `sim-*`

| Token | Value | State |
|---|---|---|
| `--sim-input` | `195 100% 50%` | Parameter / input |
| `--sim-running` | `38 92% 50%` | Active / computing |
| `--sim-output` | `157 100% 50%` | Result / success |
| `--sim-error` | `0 75% 50%` | Failure |
| `--sim-paused` | `215 20% 55%` | Paused / idle |
| `--sim-track` | `217 41% 13%` | Progress track |

### 2.13 Evolution Colors — `evo-*`

| Token | Value | Meaning |
|---|---|---|
| `--evo-xp` | `157 100% 50%` | Earned XP |
| `--evo-streak` | `25 95% 55%` | Daily streak |
| `--evo-level` | `239 84% 67%` | Level-up |
| `--evo-milestone` | `186 100% 50%` | Milestone reached |
| `--evo-reward` | `45 95% 55%` | Reward / loot |

### 2.14 Leaderboard Colors (rank tiers)

| Tier | Token | HSL |
|---|---|---|
| Diamond | `--rank-diamond` | `186 100% 50%` |
| Platinum | `--rank-platinum` | `213 31% 91%` |
| Gold | `--rank-gold` | `45 95% 55%` |
| Silver | `--rank-silver` | `215 16% 70%` |
| Bronze | `--rank-bronze` | `25 70% 50%` |
| Standard | `--rank-standard` | `217 36% 22%` |

---

## 3. Light Mode Override

Apply by adding class `theme-light` to `<html>`. Only the **neutral-based**
tokens invert; accent/domain hues are preserved for brand continuity.

```css
.theme-light {
  --background: 222 47% 97%;
  --foreground: 222 47% 9%;
  --surface: 0 0% 100%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 9%;
  --elevated: 220 39% 96%;
  --border: 217 33% 82%;
  --divider: 218 33% 82%;
  --input: 217 33% 82%;
  --muted: 218 33% 90%;
  --muted-foreground: 215 20% 40%;
  --ring: 157 100% 42%;
}
```

> Light-mode shadows (§9) use low-alpha dark shadows instead of glows.

---

## 4. Typography

**Font stacks** (set via `--font-sans` / `--font-mono`):
- Sans: `Geist Sans` → `Inter` → `system-ui` → `sans-serif`
  *(Geist is the intended premium default; Inter is the current fallback already
  loaded in `globals.css`.)*
- Mono: `Geist Mono` → `ui-monospace` → `SFMono-Regular` → `monospace`
  (code, equations, IDs, terminal/simulation output).

**Scale** (size / weight / letter-spacing / line-height / usage):

| Style | Size | Weight | Tracking | Line-height | Usage |
|---|---|---|---|---|---|
| Display XL | 60px | 600 | `-0.03em` | 1.05 | Hero, landing headline |
| Display L | 48px | 600 | `-0.025em` | 1.08 | Section heroes |
| Heading XL | 36px | 600 | `-0.02em` | 1.15 | Page title |
| Heading L | 28px | 600 | `-0.015em` | 1.2 | Major section |
| Heading M | 22px | 600 | `-0.01em` | 1.25 | Card / block title |
| Heading S | 18px | 600 | `0` | 1.3 | Sub-section |
| Title | 16px | 600 | `0` | 1.4 | List / row title |
| Subtitle | 15px | 500 | `0` | 1.45 | Supporting title |
| Body Large | 17px | 400 | `0` | 1.6 | Long-form reading |
| Body Medium | 15px | 400 | `0` | 1.55 | Default body |
| Body Small | 13px | 400 | `0` | 1.5 | Dense UI, captions-inline |
| Caption | 12px | 500 | `0.02em` | 1.4 | Metadata, hints |
| Label | 13px | 600 | `0.02em` | 1.4 | Form labels, eyebrows |
| Button | 14px | 600 | `0` | 1 | Button / control text |
| Badge | 11px | 600 | `0.04em` | 1.2 | Tags, status pills (uppercase) |
| Code | 13px | 400 | `0` | 1.5 | Inline & block code |

**Rules**
- One Display per screen. Max two heading levels of change per view.
- Body text never below 13px. Reading content ≥ 15px.
- Numerals: use `font-variant-numeric: tabular-nums` for stats, XP, dates.
- `font-feature-settings: "cv02","cv03","cv04","rlig"` enabled globally (already in `globals.css`).

---

## 5. Spacing System (8-point)

Base unit **8px**. Half-steps (4px) permitted only for tight internal gaps.

| Token | px | Tailwind |
|---|---|---|
| `--space-0` | 0 | `0` |
| `--space-1` | 4 | `1` |
| `--space-2` | 8 | `2` |
| `--space-3` | 12 | `3` |
| `--space-4` | 16 | `4` |
| `--space-5` | 20 | `5` |
| `--space-6` | 24 | `6` |
| `--space-8` | 32 | `8` |
| `--space-10` | 40 | `10` |
| `--space-12` | 48 | `12` |
| `--space-16` | 64 | `16` |
| `--space-20` | 80 | `20` |
| `--space-24` | 96 | `24` |
| `--space-32` | 128 | `32` |

**Rules**
- Card padding: `--space-6` (24px) default; compact cards `--space-4`.
- Component internal gap: `--space-2`–`--space-3`.
- Between sibling blocks: `--space-8`.
- Section vertical rhythm: `--space-16`–`--space-24`.
- Dashboard content padding: `--space-6` min, scaling to `--space-8` on desktop.
- Form field stack: `--space-4` between fields, `--space-2` label→input.

---

## 6. Grid System

| Breakpoint | Min width | Columns (12-col) | Gutter | Container max |
|---|---|---|---|---|
| Mobile | 0 | 4 | 16px | 100% (pad 16) |
| Tablet | 768px | 8 | 20px | 720px |
| Laptop | 1024px | 12 | 24px | 960px |
| Desktop | 1280px | 12 | 24px | 1200px |
| Ultra Wide | 1536px | 12 | 32px | 1440px |

- Content `max-width`: 1440px, centered, with `--space-6` side padding.
- Workspace shell (command bar / nav rail / context panel / dock) is laid out
  via the existing `.sci-workspace` CSS grid in `globals.css` and is exempt
  from the 12-col content grid.
- Gap between cards in a grid: `--space-4` (mobile) → `--space-6` (desktop).

---

## 7. Radius System

Base `--radius: 0.5rem` (8px) = MD.

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 4px | Badges, chips, tags, tiny controls |
| `--radius-sm` | 6px | Inputs, small buttons, checkboxes |
| `--radius-md` | 8px | Buttons, cards, default surfaces |
| `--radius-lg` | 12px | Large cards, panels, popovers |
| `--radius-xl` | 16px | Modals, drawers, hero cards |
| `--radius-2xl` | 24px | Feature showcases, full-bleed blocks |
| `--radius-full` | 9999px | Avatars, pills, toggles, progress |

**Rules**: never mix more than two radii in one component. Avatars, toggles, and
progress bars are always `full`.

---

## 8. Border System

| Token | Value | Use |
|---|---|---|
| `--border-width` | 1px | Default |
| `--border-width-thick` | 2px | Emphasis / active nav |
| `--border` | `217 41% 13%` | Resting border |
| `--border-hover` | `217 36% 22%` | Hover state |
| `--border-focus` | `157 100% 50%` @ 60% | Keyboard focus |
| `--border-active` | `157 100% 50%` | Selected/active |
| `--border-disabled` | `217 41% 13%` @ 50% | Disabled |

**Rules**: hairlines over heavy frames; prefer 1px + surface-step for separation
before reaching for a border. Avoid double borders.

---

## 9. Shadow System

Dark UI uses **restraint**: most elevation comes from surface-step + 1px
border. Shadows are subtle; glows are reserved for primary/active only.

| Token | Definition (dark) | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px hsl(222 47% 3% / 0.4)` | Inset cards |
| `--shadow-sm` | `0 1px 3px hsl(222 47% 3% / 0.5)` | Buttons rest |
| `--shadow-md` | `0 4px 12px hsl(222 47% 3% / 0.55)` | Cards |
| `--shadow-lg` | `0 12px 32px hsl(222 47% 3% / 0.6)` | Popovers, menus |
| `--shadow-xl` | `0 24px 64px hsl(222 47% 3% / 0.65)` | Modals, drawers |
| `--shadow-floating` | `0 8px 28px hsl(222 47% 3% / 0.6)` | Sticky bars, toasts |
| `--shadow-focus` | `0 0 0 3px hsl(157 100% 50% / 0.35)` | Focus ring |
| `--shadow-glow` | `0 0 24px hsl(157 100% 50% / 0.25)` | Primary CTA / active node |
| `--shadow-glass` | `inset 0 1px 0 hsl(0 0% 100% / 0.04)` | Glass panels (sparingly) |

Light-mode shadow equivalents use `hsl(222 47% 9% / 0.08–0.18)`.

---

## 10. Iconography

**Family: Lucide** (already the project icon library — `lucide-react`).

| Property | Value |
|---|---|
| Stroke width | `1.75` (default `1.5` for dense tables) |
| Corner style | Rounded (`round` linecap/linejoin) |
| Filled usage | Status only (active nav, selected) — prefer stroke |
| Outlined usage | Default for all UI actions & labels |
| Sizes | `16` (xs) · `20` (sm) · `24` (md, default) · `32` (lg) |
| Color | `currentColor`; active = `--primary-400`, muted = `--neutral-400` |

**Rules**: one icon per concept; never decorate with icons where text suffices;
icon + label spacing = `--space-2`.

---

## 11. Illustration Style

Geometric, line-based, scientifically literate — **not** skeuomorphic or cartoon.

| Context | Style |
|---|---|
| Empty state | Minimal line illustration, single accent stroke, centered, `--neutral-400` |
| Scientific | Isometric / schematic line art, domain-colored strokes |
| Knowledge | Node-graph motifs echoing the Knowledge Graph edge palette |
| AI | Indigo gradient mesh, soft, abstract — signals "the system" |
| Simulation | Blueprint/schematic with `--sim-*` coded parts |
| Error | Calm line icon + short recovery copy; never alarming red art |
| Success | Single check in `--success-500`, restrained |
| Loading | Determinate progress or subtle pulse (`animate-pulse-ring`), never spinners that imply "broken" |

**Rules**: illustrations are accents, not backgrounds. Keep them ≤ 1 per view.

---

## 12. Surface System

| Surface | Token | Definition |
|---|---|---|
| Primary | `--surface` | Base app surface (`neutral-800`) |
| Secondary | `--muted` | Nested / inset regions |
| Glass | `sci-panel` class | `rgba(255,255,255,0.02)` + blur 12px (use sparingly) |
| Elevated | `--elevated` | Popovers, menus, tooltips (`neutral-900`) |
| Interactive | hover | Surface steps up 1 lightness + `--border-hover` |
| Selected | active | `hsl(var(--primary-500) / 0.10)` fill + `--border-active` |
| Disabled | disabled | `--muted` @ reduced contrast, `--border-disabled` |

**Rules**: depth = surface-step + border, not shadow stacking. Max two surface
levels visible at once outside modals.

---

## 13. Motion Foundation

**Philosophy**: motion confirms state and guides attention — never decorative.
Short, eased, physically plausible. Respect `prefers-reduced-motion` (already
handled globally in `globals.css`).

| Token | Value |
|---|---|
| `--motion-fast` | `150ms` |
| `--motion-normal` | `200ms` |
| `--motion-slow` | `350ms` |
| `--ease-sci` | `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |

| Interaction | Duration | Ease |
|---|---|---|
| Hover | `150ms` | `--ease-sci` |
| Focus | `150ms` | `--ease-standard` |
| Press / tap | `100ms` | `--ease-standard` |
| Fade in/out | `200ms` | `--ease-sci` |
| Slide (panels) | `250ms` | `--ease-sci` |
| Scale (popover) | `150ms` | `--ease-sci` |
| AI streaming caret | `1.0s` blink | linear |
| Knowledge graph layout | `350ms` spring | `--ease-sci` |
| Page transition | `250ms` fade + 8px rise | `--ease-sci` |

**Rules**: no layout-shifting animations; transform/opacity only. Graph node
motion uses spring easing with damped overshoot. Page transitions fade, never
slide full-screen.

---

## 14. Accessibility Foundation

- **Contrast**: text ≥ 4.5:1 (body), ≥ 3:1 (large text / UI). Emerald
  primary on dark meets AA for large text; pair with `--neutral-100` for body.
- **Focus**: visible keyboard focus via `--shadow-focus` on every interactive
  element. Never remove `outline` without a replacement.
- **Touch targets**: ≥ 44×44px for all controls.
- **Reduced motion**: `prefers-reduced-motion` disables all non-essential
  animation (global rule already in `globals.css`).
- **Text scaling**: layouts must hold at 200% zoom; no fixed-height text
  containers.
- **Semantics**: native elements first; `aria-*` only when needed; icons get
  `aria-label` or `aria-hidden`.
- **Color independence**: never encode meaning by color alone — pair with
  icon/label (e.g., danger state shows icon + text, not just red).

---

## 15. Responsive Foundation

- Mobile-first; one primary action per view on small screens.
- Navigation collapses to the existing nav rail / bottom dock below Laptop.
- Density: comfortable (default) on Desktop+, compact (`--space` −1 step) on
  Tablet/Mobile where space-constrained.
- Type scales down one step under 768px (Display XL → Display L, etc.).
- Touch vs pointer: hover affordances hidden on coarse pointers.

---

## 16. Design Tokens — Quick Reference (Source of Truth)

| Semantic | CSS variable | Dark | Light |
|---|---|---|---|
| Background | `--background` | `222 47% 5%` | `222 47% 97%` |
| Foreground | `--foreground` | `213 31% 91%` | `222 47% 9%` |
| Surface | `--surface` | `218 39% 15%` | `0 0% 100%` |
| Card | `--card` | `217 41% 8%` | `0 0% 100%` |
| Elevated | `--elevated` | `222 44% 9%` | `220 39% 96%` |
| Border | `--border` | `217 41% 13%` | `217 33% 82%` |
| Divider | `--divider` | `217 36% 22%` | `218 33% 82%` |
| Muted fg | `--muted-foreground` | `215 20% 55%` | `215 20% 40%` |
| Primary | `--primary-500` | `157 100% 50%` | `157 100% 50%` |
| Secondary | `--secondary-500` | `195 100% 50%` | `195 100% 50%` |
| Accent (AI) | `--accent-500` | `239 84% 67%` | `239 84% 67%` |
| Success | `--success-500` | `142 71% 45%` | `142 71% 45%` |
| Warning | `--warning-500` | `38 92% 50%` | `38 92% 50%` |
| Danger | `--danger-500` | `0 75% 50%` | `0 75% 50%` |
| Info | `--info-500` | `210 100% 60%` | `210 100% 60%` |
| Focus ring | `--ring` | `157 100% 50%` | `157 100% 42%` |
| Radius MD | `--radius` | `0.5rem` | `0.5rem` |

---

## 17. Migration Notes (legacy utilities)

`app/globals.css` contains **legacy** utilities from an earlier aesthetic that
conflict with this Foundation's "no neon overload / no heavy glassmorphism"
direction:

`neon-text`, `text-glow`, `holo-btn`, `holo-panel`, `input-cyber`,
`neon-glow-primary`, `progress-glow`, `glow-border`, `.glass`/`.glass-panel`.

These are **deprecated**. New components MUST use Foundation tokens
(`--primary-*`, `--shadow-glow` used sparingly, surface-step elevation).
Existing components using legacy classes should be migrated opportunistically;
do not introduce new usages. The workspace primitives (`.sci-workspace`,
`.sci-panel`, `.sci-nav`, `.sci-context-panel`, `.sci-dock`, `.sci-command-bar`,
`.sci-toolbar`, `.sci-inspector`) and the `.domain-*` utilities are **retained**
and conform to this Foundation.

---

*End of Neuron Design Foundation — Stage 1. This document is authoritative;
when code and doc disagree, update the code to match the doc and note the
change here.*
