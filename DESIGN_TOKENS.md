# Neuron UI V2 — Design Token System (Sprint 2)

> **Single source of truth** for Tailwind CSS, CSS Variables, Figma Variables,
> React components, and the future design system.
> Converts the approved [Design Foundation](./DESIGN_FOUNDATION.md) into a
> complete, implementation-ready token architecture.

This document defines **tokens only**. No pages, no components, no mockups.

---

## 0. Token Architecture

### Three tiers (Primitive → Semantic → Component)

| Tier | Purpose | Example | Lives in |
|---|---|---|---|
| **Primitive** | Raw scale values, theme-independent hue families | `primary.500`, `neutral.800` | `--color-primary-500` |
| **Semantic** | Meaning-bound tokens consumed by features | `color.background`, `color.text.primary` | `--background`, `--foreground` |
| **Component** | Per-component intent tokens | `button.bg.default`, `card.border` | utility classes in `components/ui/*` |

The current `globals.css` realizes **Primitive + Semantic** tiers. Components bind
to semantics (e.g. `bg-card`, `text-muted-foreground`) so a future **Primitive**
remap (new hues, high-contrast) never touches component code.

### How a token resolves

```
color.primary.500            (canonical, platform-agnostic name)
   └─ --color-primary-500     (Tailwind v4 @theme bridge)
        └─ hsl(var(--primary-500))   (computed value)
             └─ --primary-500: 157 100% 50%  (raw value, in :root)
```

---

## 1. Naming Convention

Canonical tokens use **dot notation** `group.subgroup.modifier`. This is the
name used in Figma Variables, TypeScript, and docs.

| Category | Pattern | Examples |
|---|---|---|
| Color | `color.<role>.<scale>` | `color.primary.500`, `color.text.muted` |
| Typography | `font.<role>.<modifier>` | `font.family.sans`, `font.heading.lg` |
| Spacing | `space.<step>` | `space.6`, `space.16` |
| Size | `size.<target>` | `size.button.md`, `size.icon.lg` |
| Radius | `radius.<scale>` | `radius.lg`, `radius.full` |
| Border | `border.<aspect>` | `border.width.default`, `border.color.focus` |
| Shadow | `shadow.<scale>` | `shadow.md`, `shadow.floating` |
| Opacity | `opacity.<role>` | `opacity.disabled`, `opacity.overlay` |
| Motion | `motion.<kind>.<name>` | `motion.duration.fast`, `motion.ease.standard` |
| Z-index | `z.<layer>` | `z.modal`, `z.toast` |
| Breakpoint | `bp.<name>` | `bp.laptop`, `bp.ultrawide` |
| Layer | `layer.<name>` | `layer.modal`, `layer.overlay` |

**CSS binding rule:** dots → hyphens, prefixed by category.
`color.primary.500` → `--color-primary-500`; `z.modal` → `--z-modal`;
`motion.duration.fast` → `--motion-fast`.

**Tailwind utility:** derived automatically (`bg-primary-500`, `z-modal`,
`duration-fast`, `shadow-md`).

---

## 2. Color Tokens

### 2.1 Scale tokens (Primitive) — `color.<role>.<50..950>`

Each hue ships a full 50–950 ramp. Values are **HSL channel triplets**
(`H S% L%`), stored in `:root` and exposed via `@theme` as `--color-<role>-<step>`.

**Neutral (Ink)** — base for surfaces, text, borders:

| Step | Neutral | Primary (Emerald) | Secondary (Cyan) | Accent (Indigo) |
|---|---|---|---|---|
| 50 | `222 47% 97%` | `157 80% 95%` | `195 90% 94%` | `240 90% 96%` |
| 100 | `220 39% 92%` | `157 90% 88%` | `195 95% 85%` | `240 91% 88%` |
| 200 | `218 33% 82%` | `157 95% 76%` | `195 98% 72%` | `240 92% 78%` |
| 300 | `216 28% 68%` | `158 96% 64%` | `195 99% 60%` | `240 90% 68%` |
| 400 | `215 20% 55%` | `157 98% 56%` | `195 100% 52%` | `240 87% 60%` |
| 500 | `217 30% 45%` | `157 100% 50%` | `195 100% 50%` | `239 84% 67%` |
| 600 | `217 33% 32%` | `158 92% 42%` | `196 90% 42%` | `240 80% 56%` |
| 700 | `217 36% 22%` | `159 84% 34%` | `197 82% 34%` | `240 76% 47%` |
| 800 | `218 39% 15%` | `159 77% 27%` | `198 75% 27%` | `240 72% 39%` |
| 900 | `222 44% 9%` | `160 70% 21%` | `199 68% 21%` | `240 68% 32%` |
| 950 | `222 47% 5%` | `161 70% 12%` | `200 65% 13%` | `240 65% 24%` |

**Semantic ramps** (Success / Warning / Danger / Info):

| Step | Success | Warning | Danger | Info |
|---|---|---|---|---|
| 50 | `142 70% 95%` | `38 92% 95%` | `0 80% 96%` | `210 90% 95%` |
| 100 | `142 72% 86%` | `38 94% 86%` | `0 84% 88%` | `210 94% 86%` |
| 200 | `142 73% 74%` | `38 95% 74%` | `0 85% 76%` | `210 96% 74%` |
| 300 | `142 72% 62%` | `38 95% 62%` | `0 82% 64%` | `210 98% 62%` |
| 400 | `142 72% 52%` | `38 95% 55%` | `0 78% 56%` | `210 100% 54%` |
| 500 | `142 71% 45%` | `38 92% 50%` | `0 75% 50%` | `210 100% 60%` |
| 600 | `142 70% 38%` | `38 90% 42%` | `0 74% 43%` | `211 92% 48%` |
| 700 | `142 68% 31%` | `38 88% 34%` | `0 72% 36%` | `212 84% 40%` |
| 800 | `142 66% 25%` | `38 85% 28%` | `0 70% 30%` | `213 76% 33%` |
| 900 | `142 64% 20%` | `38 82% 22%` | `0 68% 24%` | `214 68% 27%` |
| 950 | `142 65% 13%` | `38 80% 14%` | `0 70% 16%` | `215 65% 18%` |

### 2.2 Semantic aliases (the only colors components use)

| Canonical | CSS var | Dark value | Light value | Tailwind |
|---|---|---|---|---|
| `color.background` | `--background` | `222 47% 5%` | `222 47% 97%` | `bg-background` |
| `color.surface` | `--surface` | `218 39% 15%` | `0 0% 100%` | `bg-surface` |
| `color.elevated` | `--elevated` | `222 44% 9%` | `220 39% 96%` | `bg-elevated` |
| `color.card` | `--card` | `217 41% 8%` | `0 0% 100%` | `bg-card` |
| `color.card-foreground` | `--card-foreground` | `213 31% 91%` | `222 47% 9%` | `text-card-foreground` |
| `color.text.primary` | `--foreground` | `213 31% 91%` | `222 47% 9%` | `text-foreground` |
| `color.text.secondary` | `--muted-foreground` | `215 20% 55%` | `215 20% 40%` | `text-muted-foreground` |
| `color.text.muted` | `--muted` | `217 41% 12%` | `218 33% 90%` | `bg-muted` / `text-muted-foreground` |
| `color.primary` | `--primary` | `157 100% 50%` | `157 100% 50%` | `bg-primary` |
| `color.primary-foreground` | `--primary-foreground` | `222 47% 5%` | `222 47% 5%` | `text-primary-foreground` |
| `color.secondary` | `--secondary` | `195 100% 50%` | `195 100% 50%` | `bg-secondary` |
| `color.accent` | `--accent` | `217 41% 17%` | `217 41% 17%` | `bg-accent` |
| `color.success` | `--success-500` | `142 71% 45%` | `142 71% 45%` | `bg-success-500` |
| `color.warning` | `--warning-500` | `38 92% 50%` | `38 92% 50%` | `bg-warning-500` |
| `color.danger` | `--danger-500` | `0 75% 50%` | `0 75% 50%` | `bg-danger-500` |
| `color.info` | `--info-500` | `210 100% 60%` | `210 100% 60%` | `bg-info-500` |
| `color.border` | `--border` | `217 41% 13%` | `217 33% 82%` | `border-border` |
| `color.divider` | `--divider` | `217 36% 22%` | `218 33% 82%` | `border-divider` |
| `color.input` | `--input` | `217 41% 13%` | `217 33% 82%` | `border-input` |
| `color.ring` / focus | `--ring` | `157 100% 50%` | `157 100% 42%` | `ring-ring` |
| `color.overlay` | `--overlay` | `222 47% 3% / 0.6` | `222 47% 9% / 0.5` | `bg-overlay`* |
| `color.selection` | `--selection-bg` | `157 100% 50% / 0.22` | `157 100% 50% / 0.18` | `::selection` |
| `color.selection-text` | `--selection-text` | `213 31% 98%` | `213 31% 98%` | `::selection` |

\* `bg-overlay` via `bg-[hsl(var(--overlay))]` or a dedicated utility.

### 2.3 Feature color systems

| System | Canonical prefix | CSS vars | Use |
|---|---|---|---|
| Knowledge / Domain | `color.domain.*` | `--sci-physics` … `--sci-astronomy` | Domain accents, graph nodes |
| Knowledge Graph edges | `color.graph.*` | categorical 14-type scale (see Foundation §2.10) | Relationship edges |
| Charts | `color.chart.*` | `--chart-1` … `--chart-12` | Categorical data viz |
| AI Response | `color.ai.*` | `--ai-assistant-bg`, `--ai-citation`, `--ai-stream-cursor`, … | Spark chat, explanations |
| Simulation | `color.sim.*` | `--sim-input`, `--sim-running`, `--sim-output`, `--sim-error`, `--sim-paused`, `--sim-track` | Sim states |
| Evolution | `color.evo.*` | `--evo-xp`, `--evo-streak`, `--evo-level`, `--evo-milestone`, `--evo-reward` | XP / streak / rewards |
| Leaderboard | `color.rank.*` | `--rank-diamond` … `--rank-standard` | Rank tiers |

All exposed as Tailwind colors (`bg-sci-physics`, `text-chart-3`, `bg-evo-xp`, …).

---

## 3. Typography Tokens

### 3.1 Font families — `font.family.*`

| Token | Value | Notes |
|---|---|---|
| `font.family.sans` | `Geist Sans`, `Inter`, `system-ui`, `sans-serif` | Primary UI (Geist = intended; Inter = current fallback) |
| `font.family.mono` | `Geist Mono`, `ui-monospace`, `SFMono-Regular`, `monospace` | Code, equations, IDs |

Bound as `--font-sans` / `--font-mono`; set on `:root`, applied via `font-sans` / `font-mono`.

### 3.2 Type scale — `font.<role>`

Each entry defines Size / Weight / Tracking / Line-height / Paragraph / Transform / Usage.

| Token | Size | Weight | Tracking | Line-h | Para | Transform | Usage |
|---|---|---|---|---|---|---|---|
| `font.display.xl` | 60px (3.75rem) | 600 | -0.03em | 1.05 | — | none | Hero |
| `font.display.l` | 48px (3rem) | 600 | -0.025em | 1.08 | — | none | Section hero |
| `font.heading.xl` | 36px (2.25rem) | 600 | -0.02em | 1.15 | — | none | Page title |
| `font.heading.l` | 28px (1.75rem) | 600 | -0.015em | 1.2 | — | none | Major section |
| `font.heading.m` | 22px (1.375rem) | 600 | -0.01em | 1.25 | — | none | Card/block title |
| `font.heading.s` | 18px (1.125rem) | 600 | 0 | 1.3 | — | none | Sub-section |
| `font.title` | 16px (1rem) | 600 | 0 | 1.4 | — | none | List/row title |
| `font.subtitle` | 15px (0.9375rem) | 500 | 0 | 1.45 | — | none | Supporting title |
| `font.body.l` | 17px (1.0625rem) | 400 | 0 | 1.6 | 0.75em | none | Long-form |
| `font.body.m` | 15px (0.9375rem) | 400 | 0 | 1.55 | 0.5em | none | Default body |
| `font.body.s` | 13px (0.8125rem) | 400 | 0 | 1.5 | 0.5em | none | Dense UI |
| `font.caption` | 12px (0.75rem) | 500 | 0.02em | 1.4 | — | none | Metadata |
| `font.label` | 13px (0.8125rem) | 600 | 0.02em | 1.4 | — | none | Form labels |
| `font.button` | 14px (0.875rem) | 600 | 0 | 1 | — | none | Buttons |
| `font.badge` | 11px (0.6875rem) | 600 | 0.04em | 1.2 | — | uppercase | Tags |
| `font.code` | 13px (0.8125rem) | 400 | 0 | 1.5 | — | none | Code |

**Font smoothing:** `antialiased` globally; `font-feature-settings: "cv02","cv03","cv04","rlig"`.
**Numerals:** `tabular-nums` for stats, XP, dates.

Bound as Tailwind text tokens (`text-display-xl` … `text-code`) via `@theme --text-*`.

---

## 4. Spacing Tokens

8-point base. Tailwind's default spacing scale **already matches** (step × 0.25rem),
so `space.<step>` maps 1:1 to `p-<step>`, `gap-<step>`, `m-<step>`.

| Token | px | Tailwind |
|---|---|---|
| `space.0` | 0 | `0` |
| `space.1` | 4 | `1` |
| `space.2` | 8 | `2` |
| `space.3` | 12 | `3` |
| `space.4` | 16 | `4` |
| `space.5` | 20 | `5` |
| `space.6` | 24 | `6` |
| `space.8` | 32 | `8` |
| `space.10` | 40 | `10` |
| `space.12` | 48 | `12` |
| `space.16` | 64 | `16` |
| `space.20` | 80 | `20` |
| `space.24` | 96 | `24` |
| `space.32` | 128 | `32` |

**Semantic spacing tokens:**

| Token | Value | Use |
|---|---|---|
| `space.container-padding` | `space.6` → `space.8` (resp.) | Page side padding |
| `space.section-gap` | `space.16`–`space.24` | Vertical rhythm between sections |
| `space.component-gap` | `space.2`–`space.3` | Internal control gaps |
| `space.card-padding` | `space.6` (compact `space.4`) | Card inner padding |
| `space.dashboard-gap` | `space.6`→`space.8` | Dashboard content gaps |
| `space.grid-gap` | `space.4`→`space.6` | Card grid gutters |

---

## 5. Size Tokens

| Token | Value | Tailwind / CSS var |
|---|---|---|
| `size.button.sm` | 32px (2rem) | `h-8` |
| `size.button.md` | 40px (2.5rem) | `h-10` |
| `size.button.lg` | 44px (2.75rem) | `h-11` |
| `size.button.icon` | 40px (2.5rem) | `size-10` |
| `size.button.icon-sm` | 32px (2rem) | `size-8` |
| `size.input` | 40px (2.5rem) | `h-10` |
| `size.avatar.sm` | 24px (1.5rem) | `size-6` |
| `size.avatar.md` | 32px (2rem) | `size-8` |
| `size.avatar.lg` | 40px (2.5rem) | `size-10` |
| `size.icon.sm` | 16px (1rem) | `size-4` |
| `size.icon.md` | 20px (1.25rem) | `size-5` |
| `size.icon.lg` | 24px (1.5rem) | `size-6` |
| `size.sidebar` | 208px (13rem) | `--nav-expanded-width` |
| `size.sidebar.collapsed` | 56px (3.5rem) | `--nav-collapsed-width` |
| `size.navbar` | 56px (3.5rem) | `--command-bar-height` |
| `size.card.max` | 384px (24rem) | `--width-card` |
| `size.modal` | 512px (32rem) | `--width-modal` |
| `size.drawer` | 384px (24rem) | `--width-drawer` |
| `size.container` | 1440px (90rem) | `--width-container` |

---

## 6. Radius Tokens

Base `--radius: 0.5rem` (8px) = `radius.md`.

| Token | Value | Use |
|---|---|---|
| `radius.none` | 0 | Hard edges (opt-in) |
| `radius.xs` | 4px (0.25rem) | Badges, chips, tiny controls |
| `radius.sm` | 6px (calc `--radius`−2px) | Inputs, small buttons |
| `radius.md` | 8px (`--radius`) | Buttons, cards (default) |
| `radius.lg` | 12px (calc `+0.25rem`) | Large cards, popovers |
| `radius.xl` | 16px (calc `+0.5rem`) | Modals, drawers |
| `radius.2xl` | 24px (calc `+1rem`) | Hero/showcase blocks |
| `radius.full` | 9999px | Avatars, pills, toggles, progress |

---

## 7. Border Tokens

| Token | Value | Tailwind / var |
|---|---|---|
| `border.width.default` | 1px | `border` |
| `border.width.thick` | 2px | `border-2` |
| `border.color.default` | `217 41% 13%` | `border-border` (`--border`) |
| `border.color.hover` | `217 36% 22%` | `hover:border-divider` |
| `border.color.focus` | `157 100% 50% / 0.6` | `focus-visible:ring-ring` |
| `border.color.active` | `157 100% 50%` | `border-primary` |
| `border.color.disabled` | `217 41% 13% / 0.5` | via `disabled:` state |
| `border.radius.ref` | `var(--radius)` | `rounded-md` |
| `border.style.solid` | solid | default |
| `border.style.dashed` | dashed | dividers-in-progress |

---

## 8. Shadow Tokens

Dark UI: elevation comes mostly from surface-step + 1px border; shadows are subtle.

| Token | Dark value | Tailwind |
|---|---|---|
| `shadow.xs` | `0 1px 2px hsl(222 47% 3% / 0.4)` | `shadow-xs` |
| `shadow.sm` | `0 1px 3px hsl(222 47% 3% / 0.5)` | `shadow-sm` |
| `shadow.md` | `0 4px 12px hsl(222 47% 3% / 0.55)` | `shadow-md` |
| `shadow.lg` | `0 12px 32px hsl(222 47% 3% / 0.6)` | `shadow-lg` |
| `shadow.xl` | `0 24px 64px hsl(222 47% 3% / 0.65)` | `shadow-xl` |
| `shadow.floating` | `0 8px 28px hsl(222 47% 3% / 0.6)` | `shadow-floating` |
| `shadow.focus` | `0 0 0 3px hsl(157 100% 50% / 0.35)` | `shadow-focus` |
| `shadow.overlay` | `0 24px 64px hsl(222 47% 3% / 0.7)` | `shadow-xl` (modal) |
| `shadow.glow` | `0 0 24px hsl(157 100% 50% / 0.25)` | `shadow-glow` (primary/active only) |

Light-mode overrides swap to low-alpha dark shadows (see §15).

---

## 9. Opacity Tokens

| Token | Value | Use |
|---|---|---|
| `opacity.disabled` | 0.4 | Disabled controls (`disabled:opacity-40`) |
| `opacity.muted` | 0.6 | De-emphasized content |
| `opacity.subtle` | 0.5 | Hover overlays, hairlines |
| `opacity.hover` | 0.08 | Surface tint on hover |
| `opacity.selected` | 0.1 | Selected fill (`hsl(var(--primary-500) / 0.1)`) |
| `opacity.overlay` | 0.6 | Modal scrim (`--overlay`) |

Bound as `--opacity-*` → Tailwind `opacity-disabled`, `opacity-hover`, etc.

---

## 10. Motion Tokens

### Durations — `motion.duration.*`
| Token | Value | Tailwind |
|---|---|---|
| `motion.duration.fast` | 150ms | `duration-fast` (`--motion-fast`) |
| `motion.duration.normal` | 200ms | `duration-normal` (`--motion-normal`) |
| `motion.duration.slow` | 350ms | `duration-slow` (`--motion-slow`) |
| `motion.duration.veryslow` | 500ms | `duration-veryslow` |

### Easings — `motion.ease.*`
| Token | Value |
|---|---|
| `motion.ease.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `motion.ease.accelerate` | `cubic-bezier(0.4, 0, 1, 1)` |
| `motion.ease.decelerate` | `cubic-bezier(0, 0, 0.2, 1)` |
| `motion.ease.sharp` | `cubic-bezier(0.4, 0, 1, 1)` (snappy) |
| `motion.ease.bounce` | spring (damped overshoot) for graph |

### Animations — `motion.anim.*`
| Token | Duration / Ease | Use |
|---|---|---|
| `motion.anim.hover` | fast / standard | Hover state |
| `motion.anim.press` | 100ms / standard | Tap/click |
| `motion.anim.focus` | fast / standard | Focus ring |
| `motion.anim.fade` | normal / sci | Fade in/out |
| `motion.anim.slide` | 250ms / sci | Panels, drawers |
| `motion.anim.scale` | fast / sci | Popovers, menus |
| `motion.anim.dialog` | 250ms fade + 8px rise / sci | Modal enter |
| `motion.anim.sidebar` | normal / sci | Nav rail expand/collapse |
| `motion.anim.dropdown` | fast / sci | Menu open |
| `motion.anim.toast` | normal / sci | Toast enter |
| `motion.anim.tooltip` | fast / sci | Tooltip pop |
| `motion.anim.ai-stream` | 1s blink / linear | Streaming caret |
| `motion.anim.knowledge-graph` | slow spring | Node layout/force |

All non-essential motion disabled under `prefers-reduced-motion` (global rule in `globals.css`).

---

## 11. Z-Index Tokens

| Token | Value | Tailwind |
|---|---|---|
| `z.base` | 0 | `z-base` |
| `z.dropdown` | 1000 | `z-dropdown` |
| `z.navbar` | 1100 | `z-navbar` |
| `z.sidebar` | 1100 | `z-sidebar` |
| `z.overlay` | 1200 | `z-overlay` |
| `z.modal` | 1300 | `z-modal` |
| `z.toast` | 1400 | `z-toast` |
| `z.tooltip` | 1500 | `z-tooltip` |
| `z.max` | 9999 | `z-max` |

---

## 12. Breakpoint Tokens

| Token | Min width | Tailwind | Columns |
|---|---|---|---|
| `bp.mobile` | 0 | (base) | 4 |
| `bp.tablet` | 768px | `md` | 8 |
| `bp.laptop` | 1024px | `lg` | 12 |
| `bp.desktop` | 1280px | `xl` | 12 |
| `bp.wide` | 1440px | (custom) | 12 |
| `bp.ultrawide` | 1536px | `2xl` | 12 |

`bp.wide` is satisfied by `2xl` (1536px ≥ 1440px); no extra query required for the
1440px container. Mobile-first; one primary action per view on small screens.

---

## 13. Layer Tokens

Stacking contexts for composite surfaces. Map to `z.*` (§11) and surface tokens.

| Token | Binds to | Purpose |
|---|---|---|
| `layer.background` | `color.background` (z-base) | App canvas |
| `layer.content` | cards/surfaces (z-base) | Primary content |
| `layer.navigation` | `z.navbar`/`z.sidebar` | Persistent nav |
| `layer.floating` | `z-dropdown`/`z-toast` | Popovers, toasts |
| `layer.modal` | `z-modal` + `layer.overlay` | Dialogs |
| `layer.notifications` | `z-toast` | Toasts (sonner) |
| `layer.overlay` | `color.overlay` (z-overlay) | Scrim behind modal/drawer |

---

## 14. Grid Tokens

| Token | Value |
|---|---|
| `grid.container-width` | 1440px (`--width-container`) |
| `grid.max-width` | 1440px, centered |
| `grid.columns` | 12 (desktop), 8 (tablet), 4 (mobile) |
| `grid.margins` | `space.6` min side padding (→ `space.8` desktop) |
| `grid.gutters` | 24px (desktop) / 20px (tablet) / 16px (mobile) |

Workspace shell (command bar / nav rail / context panel / dock) uses the existing
`.sci-workspace` CSS grid and is exempt from the 12-col content grid.

---

## 15. Theme Tokens

Themes are **override blocks** on `:root`. Only neutral-based tokens invert;
accent/domain hues are preserved for brand continuity.

| Theme | Selector | Strategy |
|---|---|---|
| **Dark** (default) | `:root` | Base values as specified above |
| **Light** | `.theme-light` on `<html>` | Inverts neutral ramp + shadows; accents unchanged |
| **High-Contrast** | `.theme-high-contrast` on `<html>` | Pure `0 0% 0%`/`0 0% 100%` surfaces, full-saturation accents, no low-alpha |
| **Future** | `.theme-<name>` | Same override mechanism; no component changes needed |

High-contrast overrides (additive to `globals.css`):

```css
.theme-high-contrast {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --surface: 0 0% 4%;
  --card: 0 0% 6%;
  --card-foreground: 0 0% 100%;
  --border: 0 0% 100% / 0.9;
  --divider: 0 0% 100% / 0.9;
  --primary: 157 100% 55%;
  --secondary: 195 100% 55%;
  --ring: 157 100% 70%;
  --overlay: 0 0% 0% / 0.85;
  --shadow-md: 0 0 0 1px hsl(0 0% 100% / 0.4);
}
```

---

## 16. Implementation Strategy

| Target | Binding |
|---|---|
| **Tailwind CSS** | `@theme` bridge in `globals.css` maps every token to a utility (`bg-primary-500`, `z-modal`, `duration-fast`, `text-display-xl`). |
| **CSS Variables** | Raw values live in `:root`; themes override via `.theme-*` blocks. |
| **TypeScript** | Optional typed token map: `export const tokens = { color: { primary: { 500: 'var(--color-primary-500)' } } }` for non-class usage (charts, canvas, three.js). |
| **React** | Consume via `className` utilities; read raw values with `getComputedStyle`/`CSS.registerProperty` only for canvas/WebGL (Knowledge Graph, Simulations). |
| **Next.js** | `app/globals.css` imported in root layout; theme class toggled on `<html>`. |
| **Shadcn UI** | `components/ui/*` already bind to semantic tokens (`bg-card`, `text-muted-foreground`, `ring-ring`). New primitives follow the same pattern. |

---

## 17. Future Compatibility

The semantic tier isolates feature modules from raw values, so adding modules
needs **no structural change**:

| Future module | Consumes |
|---|---|
| **Spark AI** | `color.ai.*`, `motion.anim.ai-stream`, `shadow-floating` |
| **Knowledge Matrix** | `color.domain.*`, `color.graph.*`, `motion.anim.knowledge-graph` |
| **Scientific Simulations** | `color.sim.*`, `motion.duration.*` |
| **Learning Paths** | `color.evo.*`, `size.*`, `shadow.md` |
| **Evolution** | `color.evo.*`, `color.rank.*` |
| **Analytics** | `color.chart.*`, `radius.*`, `space.*` |
| **Research Workspace** | `layer.*`, `z.*`, `color.surface` |
| **Future AI Modules** | New `--color-ai-*` / `--color-*` ramp added to `:root` + `@theme`; components unchanged |

New themes = new `.theme-*` override block. New hues = new `--color-*` ramp.
Component code is never edited to support either.

---

*End of Neuron UI V2 Design Token System (Sprint 2). This document is
authoritative; when code and tokens disagree, update the code and note the change
here. Companion to [Design Foundation](./DESIGN_FOUNDATION.md).*
