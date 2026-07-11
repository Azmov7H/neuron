# Neuron UI V2 — Layout System (Sprint 4)

> **Single source of truth for the application shell and layout architecture.**
> Stage 4 of the SciOS design program. Every future Neuron page, module, and
> route MUST conform to this document.
>
> This document is **layout-only**. It defines the shell, structural regions,
> and composition rules that every page inherits. It explicitly does **NOT**
> define dashboard pages, business logic, data shapes, or feature components.
> Consume the [Design Foundation](./DESIGN_FOUNDATION.md) and the
> [Design Token System (Sprint 2)](./DESIGN_TOKENS.md); this document binds
> those tokens into a layout contract.

---

## 0. Scope & Relationship to Other Docs

| Document | Owns | This doc consumes it for |
|---|---|---|
| Design Foundation | Visual language, color, type, motion, a11y principles | Aesthetic direction |
| Design Tokens (Sprint 2) | All primitive/semantic/component token values | Every spacing/width/z/color decision |
| **Layout System (this)** | Shell, regions, layout primitives, responsive rules | — |
| Core Components | `components/ui/*` primitives (button, card, input…) | Structural building blocks |

**Inheritance rule:** A page never decides its own skeleton. A page is rendered
*inside* a layout. Layouts compose regions (sidebar, top bar, content, panels);
pages fill the content region. Re-using a layout is mandatory — no page may
rebuild the shell.

### Terminology

| Term | Definition |
|---|---|
| **Region** | A persistent structural area of the shell (sidebar, top bar, content, panels, dock). |
| **Layout** | A named composition of regions applied to a route group (e.g. `DashboardLayout`). |
| **Shell** | The full persistent frame rendered by a layout; excludes page content. |
| **Module** | A feature surface (Spark AI, Knowledge Matrix, Simulations…). Modules plug into layouts; they do not define them. |
| **Page** | The routed content rendered into the content region. |

---

## 1. Application Shell

The shell is the persistent frame. It defines which regions are visible and how
they relate. Choose exactly one shell per route group.

### 1.0 Shell registry

| Shell | Applies to | Regions present | Base component |
|---|---|---|---|
| **Root** | `app/layout.tsx` | `<html>` + `<body>` + `CsrfFetchProvider` | — |
| **Public/Mktg** | `app/(marketing)/*` | Top bar + content + footer | `Navbar` + `Footer` |
| **Authentication** | `app/auth/*` | Full-screen split (no persistent nav) | local split |
| **Platform / Dashboard** | `app/(platform)/*` | Command bar + sidebar + content + context panel + dock | `WorkspaceLayout` |
| **Full-screen Workspace** | modules (Spark, Matrix, Simulations) | Command bar + sidebar + content (+ context) + dock | `WorkspaceLayout` (immersive variant) |
| **Settings** | `app/(platform)/dashboard/settings` | Platform shell + settings sub-nav (secondary) | `WorkspaceLayout` |
| **Landing** | `app/page.tsx` | Marketing top bar + hero + content | `Navbar` |
| **Error** | `app/error.tsx`, `error.tsx` per group | Centered error region (no shell chrome) | local |
| **Empty** | state-driven, not a route | Inherits parent shell; content replaced by empty state | local |

### 1.1 Root Shell

- Owns `<html lang="en" class="h-full antialiased dark">`, font variable
  (`--font-sans`), `<body class="min-h-full flex flex-col">`.
- Wraps children in `<CsrfFetchProvider/>` (security boundary — never remove).
- Does **not** render nav, top bar, or footer. Those belong to route-group shells.
- Theme class (`theme-light` / `theme-high-contrast`) is toggled on `<html>`
  here, never deeper in the tree.

### 1.2 Dashboard / Platform Shell (`WorkspaceLayout`)

The canonical app shell. Structure (matches existing
`components/workspace/workspace-layout.tsx`):

```
┌─────────────────────────────────────────────────────────┐
│ COMMAND BAR (row 1, --command-bar-height)               │
├──────────┬──────────────────────────────┬──────────────┤
│ SIDEBAR  │  CONTENT (main #main-content) │ CONTEXT      │
│ (rail)   │  scrollable                   │ PANEL        │
│          │                               │ (collapsible)│
├──────────┴──────────────────────────────┴──────────────┤
│ BOTTOM DOCK (row 3, --bottom-dock-height)               │
└─────────────────────────────────────────────────────────┘
```

- **Purpose:** persistent navigation + global command surface + module context.
- **Structure:** `flex flex-col h-dvh overflow-hidden` → `CommandBar` (row 1),
  `flex flex-1` row containing `WorkspaceNav` + `main` + `ContextPanel`, then
  `BottomDock` (row 3).
- **Spacing:** sidebar uses `--nav-expanded-width` (208px) / `--nav-collapsed-width` (56px);
  context panel `--context-panel-width` (264px); rows sized by `--command-bar-height` (40px)
  and `--bottom-dock-height` (32px).
- **Container behavior:** only `main` scrolls (`overflow-y-auto`); the shell is
  fixed to viewport (`h-dvh`, `overflow-hidden`). Decorative ambient glows are
  `fixed inset-0 pointer-events-none z-0`; page content is `relative z-10`.
- **Responsive behavior:** sidebar collapses to an overlay/`Sheet` below Laptop
  (see §10). Context panel hidden below Tablet. Dock persists but condenses.
- **Navigation behavior:** sidebar = primary nav (`WorkspaceNav`); command bar =
  command palette entry + global AI; context panel = secondary/context nav.
- **Provider:** wrapped in `WorkspaceProvider`; children access state via
  `useWorkspace()` (`navCollapsed`, `toggleNav`, `setNavCollapsed`, context panel
  open/close). The shell MUST remain the single source of this state.

### 1.3 Workspace Shell (Full-screen / Immersive variant)

Same as §1.2 but content region is a **module canvas** (Spark chat, Knowledge
Matrix graph, Simulation stage). Differences:

- Content region disables default page padding (canvas is edge-to-edge).
- May hide the dock or context panel per module (state in `useWorkspace`).
- Still `h-dvh`, no body scroll; the module owns its internal scroll/zoom panes.

### 1.4 Settings Shell

Reuses the Platform shell (§1.2). Inside the content region, a **secondary
sub-navigation** (vertical or tabbed) selects settings sections. The secondary
nav is a layout region owned by the settings page tree, not the shell.

### 1.5 Authentication Shell

No persistent nav. Full-viewport split composition:

```
┌──────────────────────┬──────────────────────┐
│ Left brand panel      │ Form panel           │
│ (decorative, sticky)  │ (scrollable if tall) │
└──────────────────────┴──────────────────────┘
```

- **Structure:** `main.min-h-screen.flex.relative.bg-grid` + fixed ambient
  glows (`bg-secondary/10`, `bg-primary/10`, `blur-[150px]`) + centered
  `max-w-[1200px] grid lg:grid-cols-2`.
- **Purpose:** focused, low-distraction entry. No shell chrome, no footer.
- **Responsive:** single column on `< lg`; left brand panel hidden, replaced by
  a compact logo header on mobile.
- **Spacing:** `p-6 md:p-12`; gap `gap-20` on desktop.

### 1.6 Public / Marketing Shell

```
┌──────────────────────────────────────────┐
│ STICKY TOP BAR (Navbar, transparent→solid)│
├──────────────────────────────────────────┤
│ CONTENT (flows, page-scrolled)            │
├──────────────────────────────────────────┤
│ FOOTER                                    │
└──────────────────────────────────────────┘
```

- **Structure:** `Navbar` (`sticky top-0 z-50`, `border-b border-border/50`,
  `bg-background/80 backdrop-blur-xl`) + flowing `<main>` + `Footer`.
- **Purpose:** SEO/landing surface; scrolls naturally (no `h-dvh` lock).
- **Container:** content centered at `--width-container` (90rem) with
  `--space-container-padding` side padding.
- **Navigation behavior:** top bar links are in-page anchors (`#features`) or
  external routes; no app shell auth gating.

### 1.7 Landing Shell

Specialization of §1.6 with a hero-first composition (marketing `hero` +
`features-grid`). Same top bar/footer frame.

### 1.8 Error Shell

Rendered by `error.tsx` (route-group scoped) and `global-error` if needed.

- **Structure:** centered `main` on `bg-background`, no nav chrome, minimal.
  Calm line icon + short recovery copy (Foundation §11: never alarming).
- **Behavior:** offers "Back" and "Reload"; respects `reset()` from
  `ErrorBoundary` props. Never blocks the root layout's `<html>`.

### 1.9 Empty Shell (state-driven)

Not a route. Any content region may render an empty state while **inheriting its
parent shell**. Defined in §11.

### 1.10 Shell selection matrix

| Route group | Shell | Sidebar | Top/Command bar | Context | Dock | Footer |
|---|---|---|---|---|---|---|
| `app/(marketing)/*` | Public | — | Navbar | — | — | ✓ |
| `app/auth/*` | Auth | — | — | — | — | — |
| `app/(platform)/*` | Platform | ✓ | CommandBar | ✓ | ✓ | — |
| `app/(platform)/dashboard/settings` | Platform | ✓ | CommandBar | ✓ | ✓ | — |
| module routes | Workspace (immersive) | ✓ | CommandBar | opt | opt | — |
| `app/error.tsx` | Error | — | — | — | — | — |

---

## 2. Sidebar System

Primary navigation rail (`WorkspaceNav`). Built on `.sci-nav` (see globals.css).
One component, multiple behavioral **modes**.

### 2.1 Modes

| Mode | Trigger | Width | Behavior |
|---|---|---|---|
| **Expanded** | default (desktop) | `--nav-expanded-width` (208px) | full labels, section headers, pins, tooltips off |
| **Collapsed** | toggle / `[` key / narrow viewport | `--nav-collapsed-width` (56px) | icon-only, hover tooltips, no labels |
| **Floating** | transient hover over collapsed | auto | expands on hover, collapses on leave |
| **Overlay** | `< Tablet` | full rail | slides over content via `Sheet` (Radix Dialog), scrim `--overlay` |
| **Pinned** | user pins items | n/a (section) | pinned items surface in a PINNED section above groups |
| **Auto-collapse** | viewport crosses Laptop threshold | → collapsed | respects persisted user preference when present |

State lives in `useWorkspace()` (`navCollapsed`, `toggleNav`). Persistence/keyboard
for collapse is handled in the existing `WorkspaceNav` (`[` shortcut, `localStorage` pins).

### 2.2 Structure & nesting

- **Logo row** (h-10, `border-b border-white/5`): wordmark when expanded, icon
  when collapsed.
- **Scrollable body** (`flex-1 overflow-y-auto scrollbar-none py-2 px-1.5`):
  - Optional **PINNED** section (items persisted in `localStorage` key `sci-nav-pinned`).
  - **Nav sections** with `section.title` eyebrow (`text-[9px] uppercase tracking-[0.2em]`).
  - Each item: icon (size 15, `aria-hidden`) + label + active dot + pin button.
- **Collapse toggle** row at bottom (`border-t`, `ChevronLeft/Right`, `kbd "["`).

Nested navigation (e.g. Neural Paths → path → chapter) is **not** rendered as a
tree inside the rail. The rail links to the module's landing; deep nesting is
handled by **breadcrumbs** (§9) and in-page secondary nav. (Keeps the rail flat
and fast — see §13 perf rules.)

### 2.3 Badges, section headers, quick actions

- **Badges:** small `font-badge` pill on the right of an item (e.g. unread count).
  Use `--ai-citation`/success/danger tokens, never raw color alone (pair with
  label/icon — Foundation §14).
- **Section headers:** eyebrow labels as above; never interactive.
- **Quick actions:** a single primary action per section may appear as a
  "+" affordance (e.g. New Path). Rendered as a `Button` sized `size-button.icon-sm`.

### 2.4 Workspace shortcuts, favorites, recently visited

- **Workspace shortcuts:** pinned items (§2.1) satisfy "frequent modules."
- **Favorites:** a dedicated FAVORITES section, populated from user state
  (persisted, same `localStorage` pattern as pins).
- **Recently visited:** optional section, last-N routes from history; collapses
  to icons when rail is collapsed. Must not exceed 5 entries to bound DOM (§13).

### 2.5 Resizable

The rail is **not** user-resizable by drag in v1 (widths are token-fixed for CLS
safety). Future: expose `--nav-expanded-width` as a CSS var adjustable within
`[208px … 320px]` with `transition-[width]` only (never animate `left`/`margin`).

### 2.6 Keyboard navigation

- `Tab` moves through items in DOM order; `ArrowUp/Down` move within the rail
  (roving tabindex).
- `[` toggles collapse (global, ignored in inputs — existing behavior).
- Active item: `aria-current="page"`; focus ring via `focus-visible:ring-1
  ring-primary/40` (never remove outline without replacement).
- Collapsed tooltips: `role="tooltip"`, appear on `:focus` and `:hover`.

---

## 3. Top Bar

Two distinct top surfaces, never mixed in one shell:

- **`Navbar`** — Public/Marketing shell (transparent → solid on scroll).
- **`CommandBar`** — Platform/Workspace shell (global command + AI + presence).

### 3.1 Command Bar (Platform)

Structure (matches `components/workspace/command-bar.tsx`): `sci-command-bar`,
`h-[var(--command-bar-height)]`, `border-b`, `bg-background/85 backdrop-blur`,
`z-50`.

| Slot (left→right) | Element | Token/notes |
|---|---|---|
| Command palette trigger | search-like button → opens `CommandPalette` | `Cmd/Ctrl+K`; placeholder "Search or run a command" |
| Global AI | Spark entry button (indigo accent) | opens Spark module or AI drawer |
| Context title | current module/breadcrumb crumb | `font-label` |
| Right cluster | notifications · theme toggle · user menu · workspace switcher | dropdown via `components/ui/dropdown-menu` |

- **Sticky:** always pinned to row 1; never scrolls away.
- **Responsive:** on `< Tablet`, secondary slots collapse into a single
  `More` `DropdownMenu`; command trigger becomes icon-only.

### 3.2 Public Navbar

`sticky top-0 z-50`, `border-b border-border/50`, `bg-background/80
backdrop-blur-xl`, `h-16`, `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

- Links hidden `< md` → hamburger opens `Sheet` (mobile nav).
- Primary CTA = `Button` (`bg-primary`, "Begin Evolution").

### 3.3 Common top-bar rules

- **Search:** `Input` styled, never a raw `<input>`. In command bar it is a
  palette trigger, not a live field.
- **Notifications:** bell icon + unread dot (danger token); opens a Radix
  popover/list.
- **User menu:** `DropdownMenu` with avatar (`size-avatar-md`), profile,
  settings, sign-out.
- **Workspace switcher:** if multi-tenant, a `DropdownMenu` between logo and
  nav; otherwise omitted.
- **Breadcrumbs:** live in the **Page Header** (§5), not the top bar, except the
  single context crumb shown in the command bar.
- **Quick actions:** primary action rendered as a `Button` in the right cluster.
- **Theme toggle:** cycles dark → light → high-contrast; toggles `<html>` class
  only.
- **Profile:** same `DropdownMenu` as user menu.

---

## 4. Content Area

The `main#main-content` region of the Platform shell (and the flowing `<main>`
of Public/Auth shells).

### 4.1 Width & max-width

| Shell | Container | Side padding |
|---|---|---|
| Platform content | fluid `flex-1`, internal `mx-auto max-w-[var(--width-container)]` for reading views | `--space-container-padding` (1.5rem) → `--space-8` desktop |
| Public/Auth | `max-w-7xl` / `max-w-[1200px]` centered | `px-4 sm:px-6 lg:px-8` |
| Workspace canvas | edge-to-edge (no max-width, no padding) | n/a |

### 4.2 Scrollable vs fixed

- Platform: **only `main` scrolls** (`overflow-y-auto`). Shell is `overflow-hidden`.
- Public: the page scrolls naturally; `main` has no scroll lock.
- Workspace canvas: module owns internal panes; `main` itself stays `overflow-hidden`.

### 4.3 Page padding

- Reading/settings pages: `p-[var(--space-container-padding)]` (1.5rem) min,
  scaling to `--space-8` (2rem) at desktop, wrapped in `mx-auto max-w-container`.
- Lists/grids: same padding; inner grid uses `space-dashboard-gap`/`space-grid-gap`.
- Canvas modules: zero padding.

### 4.4 Composition rules (section / widget / card / grid)

- **Section:** vertical stack with `space-section-gap` (4rem) between major
  sections; a section may have a `font-heading-l` heading.
- **Widget:** a self-contained block, usually a `Card`, with
  `space-card-padding` (1.5rem) inner padding (compact: `space-4`).
- **Card:** always `bg-card border border-border rounded-md shadow-md`
  (Foundation §12: depth = surface-step + border, not shadow stacking).
- **Grid:** 12-col mental model on desktop (Foundation §6). Utility:
  `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` with
  `gap-[var(--space-grid-gap)]`. Never nest more than 3 grid levels.

---

## 5. Page Header

The consistent intro block at the top of every content view (distinct from the
top bar). Rendered by pages, composed from tokens + `components/ui`.

### 5.1 Anatomy

| Slot | Element | Token |
|---|---|---|
| (optional) Breadcrumb | `nav[aria-label=breadcrumb]` | `font-caption` |
| Title | `font-heading-xl` (36px) | `text-foreground` |
| Subtitle | `font-subtitle` | `text-muted-foreground` |
| Stats | inline `font-body-s` + `tabular-nums` chips | success/danger tokens |
| Badges | `font-badge` pills | domain/state tokens |
| Tabs | `Tabs` (Radix) or segmented control | `border-b` underline |
| Filters | `Select`/`DropdownMenu` cluster | `size-input` |
| Search | `Input` with icon | `size-input` |
| Actions | `Button` cluster (primary + ghost) | `size-button.md` |

### 5.2 Layout

- Desktop: title/subtitle left, actions/filters right (`flex items-start
  justify-between gap-4`). Tabs/filters sit on a second row beneath.
- **Responsive stacking:** below Tablet, the header stacks vertically
  (`flex-col`); actions wrap (`flex-wrap`); filters/search move below title;
  tabs become a horizontally scrollable row (`overflow-x-auto`).

### 5.3 Rules

- One `heading-xl` per view (Foundation §4).
- Actions: at most **one primary** `Button` + secondary ghosts in the header.
- Breadcrumb is the canonical deep-nav aid (§9); do not duplicate it in the rail.
- Filters/search are part of the header, not floating over content.

---

## 6. Dashboard Grid

The default composition for the home/overview and analytics views. A responsive
grid of **widgets** that may later become drag-rearranged (drag-ready, not
drag-enabled in v1).

### 6.1 Grid

- `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
  gap-[var(--space-grid-gap)]`.
- Widgets declare a **span** (`col-span-1` … `col-span-2`, `xl:col-span-2`) so
  the layout is deterministic (no CLS when reordering).
- Max content width `var(--width-container)`, centered.

### 6.2 Widget types

| Type | Surface | Example |
|---|---|---|
| **Stat card** | `Card` + big `tabular-nums` metric + delta chip | Evolution XP, streak |
| **Analytics panel** | `Card` + chart (`color.chart-*`) | progress over time |
| **AI panel** | `Card` w/ `ai-assistant-bg` border | Spark recommendation |
| **Knowledge panel** | `Card` w/ domain accent | graph snapshot, discovered concepts |
| **Research panel** | `Card` w/ `sci-ai` accent | cited sources, reading list |
| **List widget** | `Card` w/ `font-title` rows | recent activity, continue learning |

### 6.3 Charts

- Consume `color.chart-1 … chart-12` (Foundation §2.9). Read raw values via
  `getComputedStyle` only for canvas/SVG renderers; never hardcode hex.
- Charts are `aria-hidden` unless accompanied by a data table or `aria-label`
  summary (§12).

### 6.4 Dynamic / drag-ready

- Each widget is a self-contained component with a stable `id` and `col-span`
  metadata, so a future drag layer can reorder without restructuring.
- Do **not** implement drag in v1; design so it can be added (no layout logic
  baked into the page — see §14).

---

## 7. Workspace Layouts

Module canvases rendered inside the Workspace/immersive shell (§1.3). Each module
gets a **large canvas** plus optional **split views**, **resizable** regions, and
**inspector / context** panels. They share the shell; they differ only in the
content composition.

### 7.1 Common module frame

```
┌─ CommandBar ───────────────────────────────────────┐
├─ Sidebar ┬─ [ Toolbar ] ──────────┬─ Context/Inspector ─┤
│          │  CANVAS (main)         │  (module-specific)  │
│          ├─────────────────────────┤                     │
│          │  status/secondary pane  │                     │
├─ BottomDock ───────────────────────────────────────┤
└──────────────────────────────────────────────────────┘
```

- `Toolbar` = `sci-toolbar` (h-36px, `border-b`) holding module tools.
- Canvas = `flex-1 relative overflow-hidden` (module owns panes/zoom).
- Inspector/Context = `sci-context-panel` (right) or `ContextPanel`.

### 7.2 Per-module layout guidance

| Module | Canvas | Split / panes | Inspector / context |
|---|---|---|---|
| **Spark AI** | chat stream (`spark-chat-area`) | composer at bottom; optional citation side-panel | citation/context panel (`ai-citation`) |
| **Knowledge Matrix** | graph canvas (`matrix-canvas`, WebGL/2D, pan/zoom) | HUD overlay (`matrix-hud`); node detail on select | node inspector (`sci-inspector`) |
| **Simulations** | sim stage (`simulation-runner`) | controls left/right (`sim-controls`); output pane | parameter inspector |
| **Learning Paths** | path timeline / chapters (`neural-paths`) | chapter list + content split | progress/notes inspector |
| **Analytics / Evolution** | charts grid (§6) | filters pane | detail drill-down |
| **Research Workspace** | document/reader + sources | split reader ↔ sources | citation/annotation inspector |

### 7.3 Resizable & split rules

- Use CSS `grid-template-columns` with fractional/`minmax()` tracks, animated via
  `transition` on the track var only (no layout-thrash). Resize handles are
  `role="separator" aria-orientation`.
- At most **two** simultaneously resizable splits per module to bound complexity.
- Inspector collapses to a `Sheet`/`Dialog` on `< Tablet`.

---

## 8. Panel System

Reusable region primitive for left/right/bottom/inspector/floating surfaces.
Built on globals.css classes (`.sci-panel`, `.sci-context-panel`, `.sci-inspector`,
`.sci-toolbar`, `.sci-dock`) and `components/workspace/panel.tsx`.

| Panel | Anchor | Class | Collapsible | Resizable |
|---|---|---|---|---|
| Left nav | left edge | `.sci-nav` | ✓ (collapse) | width var |
| Right context | right edge | `.sci-context-panel` | ✓ | width var |
| Bottom dock | bottom edge | `.sci-dock` | ✓ (height var) | height var |
| Inspector | inside context/right | `.sci-inspector` | ✓ (section) | n/a |
| Floating | overlay | `.sci-panel` + `shadow-floating` | ✓ (close) | drag (future) |

### 8.1 Rules

- Panels use **surface-step + 1px border** for separation (Foundation §12), not
  heavy shadow. Floating panels may use `shadow-floating` + `backdrop-blur`.
- Collapsible panels animate `width`/`height` only (`--motion-normal`,
  `--ease-sci`); never `left`/`transform` for layout.
- `aria-expanded` + `aria-controls` on every collapse toggle; `role="region"`
  + `aria-label` on each panel.
- Floating panels trap focus while open (`Dialog`/`Sheet` semantics) and close on
  `Esc` / scrim click.

---

## 9. Navigation Hierarchy

Three tiers, each owned by a distinct region:

| Tier | Region | Mechanism |
|---|---|---|
| **Primary** | Sidebar (`WorkspaceNav`) | flat sectioned list, `aria-current="page"` |
| **Secondary** | In-page sub-nav (settings tabs, module toolbar) | `Tabs`/segmented, `aria-current` |
| **Context** | Context panel / breadcrumb | related entities, drill-downs |

### 9.1 Breadcrumb

- `nav[aria-label="breadcrumb"]` → `ol` → `li` items; separator `aria-hidden`.
- Last item is current page (`aria-current="page"`, not a link).
- Lives in the Page Header (§5). Max 4 crumbs; truncate middle with "…".

### 9.2 Deep / back / quick nav

- **Back:** browser back is primary; modules may add an in-canvas back affordance.
- **Deep nav:** breadcrumb + context panel (no deep trees in the rail — §2.2).
- **Quick nav:** `CommandPalette` (`Cmd/Ctrl+K`) is the universal jump surface;
  entries generated from routes + actions.

### 9.3 Command palette entry

- Trigger: command bar button + `Cmd/Ctrl+K` (global listener).
- Implemented via `components/workspace/command-palette.tsx` (Radix Dialog +
  filtered list). It is the sanctioned entry point for navigation and actions.

---

## 10. Responsive Layouts

Mobile-first (Foundation §15). Breakpoints = Design Tokens §12
(`bp.mobile` base / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536).

| Viewport | Sidebar | Context panel | Dock | Top bar | Content |
|---|---|---|---|---|---|
| **Ultra-wide** (≥1536) | expanded (persist) | open | open | full | `max-w-container` centered |
| **Desktop** (1280–1535) | expanded | open | open | full | `max-w-container` |
| **Laptop** (1024–1279) | expanded | collapsed-by-default | open | full | `max-w-container` |
| **Tablet** (768–1023) | overlay/`Sheet` | hidden | condensed | condensed (More menu) | single/two col |
| **Mobile** (<768) | overlay (hamburger) | hidden | hidden/auto | icon-only cluster | single col, stacked |

### 10.1 Orientation

- **Landscape tablet:** treat as Tablet shell.
- **Portrait phone:** single column, stacked header, bottom-most actions
  reachable within thumb zone (≥44px targets).
- Modules with canvases (Matrix/Sim) switch to a simplified portrait mode
  (controls in a bottom sheet) rather than squishing the canvas.

### 10.2 Rules

- No horizontal scroll on any shell except intentional canvas panes.
- Type scales down one step under 768px (Display XL → Display L, etc.).
- One primary action per view on small screens (Foundation §15).

---

## 11. Empty Layouts

State-driven regions, not routes. Each inherits its parent shell and replaces
only the **content** region (or a widget body). Use Foundation §11 illustration
guidance: minimal line illustration, single accent stroke, centered, `--neutral-400`.

| State | Trigger | Composition |
|---|---|---|
| **No data** | entity exists but empty (e.g. no paths yet) | icon + title (`font-heading-s`) + 1-line help + primary `Button` |
| **No results** | search/filter returned empty | icon + "No results" + clear-filters action |
| **Offline** | network unavailable | icon + status (`font-body-s`) + retry |
| **Loading** | async fetch | determinate progress or `animate-pulse-ring` skeleton; **never** a broken-spinner (Foundation §11) |
| **Error** | fetch/throw | calm line icon + short recovery copy + Reload/Back (no alarming red) |
| **First-time** | new user, zero history | onboarding illustration + primary CTA + skip |

### 11.1 Rules

- Centered, max-width ~`var(--width-modal)` (32rem) for the message block.
- Illustration ≤ 1 per view; accent stroke only.
- Loading skeletons must match the final layout's box (no CLS — §13).
- Provide a recoverable action in every non-loading empty state.

---

## 12. Accessibility

Follows Foundation §14; concretized for layout regions.

### 12.1 Landmarks

- `CommandBar`/`Navbar` → `<header>` (or `role="banner"`).
- `WorkspaceNav` → `<nav aria-label="Primary navigation">`.
- Content → `<main id="main-content">` (exactly one per document).
- `ContextPanel` → `<aside aria-label="Context">`.
- `BottomDock` → `<footer>` or `role="contentinfo"`.
- `error.tsx` → centered `<main>` without duplicating landmarks.

### 12.2 Skip link

- First focusable element in the Platform/Public shell: "Skip to content"
  linking to `#main-content`; visually hidden until focus
  (`focus:not-sr-only`), styled with `bg-card border shadow-floating`.

### 12.3 Focus order & keyboard

- Tab order = visual order: top bar → sidebar → main → context → dock.
- Roving tabindex inside sidebar (§2.6) and tab lists.
- Every interactive element has a visible focus ring
  (`focus-visible:ring-1 ring-primary/40` or `shadow-focus`); outlines never
  removed without replacement.
- `prefers-reduced-motion` disables non-essential motion (global rule in
  globals.css) — layout transitions use `transition` props that the media query
  already neutralizes.

### 12.4 ARIA & screen reader

- `aria-current="page"` on active nav/secondary item.
- `aria-expanded`/`aria-controls` on every collapse/overlay toggle.
- `role="region"` + `aria-label` on each panel; `role="tooltip"` on rail
  tooltips; `role="separator"` on resize handles.
- Charts/`canvas` are `aria-hidden` unless a textual summary or data table is
  provided.
- Icons are `aria-hidden` unless they are the sole label (then `aria-label`).
- Color is never the sole carrier of meaning — pair with icon/label
  (Foundation §14).

### 12.5 Zoom & targets

- Layouts hold at 200% zoom; no fixed-height text containers.
- All controls ≥ 44×44px touch target (tokens `size-button.*`, `size-avatar.*`).

---

## 13. Performance Rules

| Rule | Why | How |
|---|---|---|
| **Minimize CLS** | stable shell | fixed region widths via tokens; skeletons match final boxes (§11); never animate `left`/`margin`/`top` for layout — animate `width`/`height`/`transform`/`opacity` only |
| **No layout thrash** | smooth resize | resizable splits animate the CSS grid track var, not JS-driven reflows |
| **Bound DOM** | fast paint | rail caps recently-visited at 5; grids cap columns at 4 (`2xl`); no infinite nesting (≤3 grid levels, ≤2 resizable splits) |
| **Single shell instance** | no duplicate state | exactly one `WorkspaceProvider` per Platform tree; pages never re-render the shell |
| **Memoize regions** | fewer re-renders | `CommandBar`/`WorkspaceNav`/`ContextPanel`/`BottomDock` are stable; page changes should not remount the shell |
| **Avoid nested wrappers** | lighter DOM | compose with grid/flex on existing regions; do not wrap `main` in extra divs for spacing — use padding tokens directly |
| **Token-driven, not utility-heavy** | consistency + tree-shake | prefer semantic token classes (`bg-card`, `text-muted-foreground`) over arbitrary values |
| **Motion via tokens** | reduced-motion safe | all transitions use `--motion-*` durations + `--ease-*` curves; respect global `prefers-reduced-motion` |

---

## 14. Implementation Guidelines

### 14.1 Stack (authoritative)

- **Next.js 16 App Router** — layouts are `layout.tsx` files per route group;
  the Platform shell lives in `app/(platform)/dashboard/layout.tsx` wrapping
  `WorkspaceLayout`.
- **React 19** — server components by default; only mark `"use client"` the
  interactive shell pieces (`WorkspaceLayout`, `WorkspaceNav`, `CommandBar`,
  `ContextPanel`, `BottomDock`, `CommandPalette`).
- **TypeScript** (strict) — all layout props typed; no `any` in layout code.
- **Tailwind CSS v4** — utility classes only; tokens come from the `@theme`
  bridge in `globals.css`. No inline styles for token values.
- **shadcn/ui + Radix** — `components/ui/*` primitives (`button`, `card`,
  `input`, `select`, `dropdown-menu`, `dialog`, `sheet`, `checkbox`, `label`,
  `form`). Radix primitives back overlays/menus (a11y built-in).
- **Framer Motion** — optional, only for page transitions and panel motion
  where it adds clarity; must honor `prefers-reduced-motion`. Prefer CSS
  transitions (token-driven) for routine layout motion.

### 14.2 Consume, never duplicate

- **Tokens:** import nothing; use token utility classes + CSS vars
  (`var(--nav-expanded-width)`, `var(--space-*)`). Raw hex is forbidden in layout.
- **Components:** build regions from `components/ui/*` + the existing
  `components/workspace/*` + `components/layout/*` (`Navbar`, `Footer`). Do not
  re-implement a sidebar/top-bar/panel from scratch. `Tabs` (Radix) is a
  **planned** addition to `components/ui`; until then, secondary nav uses a
  segmented-control built from `Button`.
- **No duplicated layout logic:** a new module adds a **page** (or a
  context-panel content component), not a new shell. If a genuine new shell is
  needed, extend §1.0's registry and reuse `WorkspaceLayout`/primitives.
- **Command palette** is the single jump surface (§9.3); modules register
  entries, they don't build their own nav.

### 14.3 File / component conventions

- Shell components: `components/workspace/*` (client). Page content: co-located
  under feature folders (`components/dashboard/*`, `components/spark/*`, …).
- Layout state: centralized in `WorkspaceProvider` / `useWorkspace()`; never
  local-copied in a page.
- `cn()` from `@/lib/utils` for class merges.
- Regions use `role`/`aria-*` per §12.

---

## 15. Future Scalability

The layout contract supports every planned module **without structural
redesign** — modules are pages/panels, not shells.

| Future module | Lands in | Consumes |
|---|---|---|
| **Spark AI** | Workspace (immersive) + context panel | `color.ai.*`, `ai-assistant-bg`, command-bar AI entry (§3.1) |
| **Knowledge Matrix** | Workspace canvas + node inspector | `color.graph.*`, `color.domain.*`, `motion.anim.knowledge-graph` |
| **Simulations** | Workspace canvas + controls/inspector | `color.sim.*`, `size.*`, `shadow.md` |
| **Learning Paths** | Platform shell + secondary sub-nav | `color.evo.*`, `space.*`, `font.*` |
| **Evolution / Analytics** | Platform shell + dashboard grid (§6) | `color.evo.*`, `color.chart.*`, `radius.*` |
| **Research Workspace** | Workspace (immersive) + reader/sources split | `layer.*`, `z.*`, `color.surface`, `ai-citation` |
| **New modules** | Add a `WorkspaceNav` section + a route; reuse shell | existing tokens; no shell change |

**Why no redesign is needed:** the shell is region-based and token-sized; modules
only swap the **content** region and optionally toggle the context panel/dock.
Adding a module = one nav section + one route group + pages. The 12-col grid,
panel system, and command palette absorb any new surface.

---

# Part II — Architectural Extensions (Sprint 4, continued)

> These sections extend — but do **not** alter — the core 15 sections above.
> They formalize layout *state*, *routing*, *transitions*, *loading*, *roles*,
> *persistence*, *URL state*, *keyboard*, and the *region model* so the shell
> is a deterministic, contract-driven system. All token/CSS-var references are
> grounded in `globals.css` and [Design Tokens (Sprint 2)](./DESIGN_TOKENS.md).

---

## 16. Layout State Machine

Every shell region is a small finite-state machine. The **visible state** of a
region is derived from (a) the active route, (b) the persisted user preference
(§21), and (c) transient interaction. Regions never block on each other except
where an overlay intentionally captures the context.

### 16.1 Sidebar (`WorkspaceNav`)

| State | Entered when | Binding | Exits to |
|---|---|---|---|
| **Expanded** | default on Desktop/Laptop; user expands | `w-[var(--nav-expanded-width)]`, labels + headers shown | Collapsed / Overlay / Hidden |
| **Collapsed** | `[` toggle, auto-collapse at threshold | `w-[var(--nav-collapsed-width)]`, icon-only + tooltips | Expanded / Floating |
| **Floating** | hover over a Collapsed rail (opt-in) | expands on `:hover`/`focus`, collapses on leave | Collapsed |
| **Overlay** | viewport `< Tablet` | full rail in a `Sheet` (Radix Dialog) + `--overlay` scrim | Hidden (on close) |
| **Hidden** | mobile with overlay closed; or explicit hide | not rendered / `display:none` | Overlay (hamburger) |

State lives in `useWorkspace()` (`navCollapsed`, `toggleNav`); see §2.1 and §2.6.

### 16.2 Top Bar

| State | Entered when | Binding | Notes |
|---|---|---|---|
| **Visible** | default | solid `bg-background/85 backdrop-blur`, `border-b` | Platform `CommandBar` / Marketing `Navbar` |
| **Hidden** | immersive module opts out (e.g. full-canvas Sim) | `display:none` on the bar row | shell still `h-dvh`; content gains the freed row |
| **Compact** | viewport `< Tablet` | right cluster collapses to a `More` `DropdownMenu` | command trigger → icon-only |
| **Transparent** | Marketing `Navbar` at scrollTop | `bg-transparent` → solid after first scroll | only the Public shell uses this variant |

### 16.3 Context Panel (`ContextPanel`)

| State | Entered when | Binding | Notes |
|---|---|---|---|
| **Closed** | default on Tablet; user closes | `width:0`, `aria-hidden`, not focusable | region removed from a11y tree |
| **Open** | user toggles; module requests | `w-[var(--context-panel-width)]`, `aria-expanded="true"` | slides via `transition-[width]` |
| **Pinned** | user pins (persists, §21) | stays Open across route changes within shell | survives navigation |
| **Detached** | future: float as `Sheet`/floating panel | `.sci-panel` + `shadow-floating`, `role="dialog"` | captures focus while open |

### 16.4 Bottom Dock (`BottomDock`)

| State | Entered when | Binding | Notes |
|---|---|---|---|
| **Hidden** | module opts out; `< Tablet` | `display:none` | frees the row |
| **Visible** | default | `h-[var(--bottom-dock-height)]`, `border-t` | condensed on small screens |
| **Expanded** | user expands dock height | taller track via height var | animates `height` only |

### 16.5 Search (Command Palette + in-page search)

| State | Entered when | Binding | Notes |
|---|---|---|---|
| **Closed** | default | palette unmounted; in-page `Input` idle | — |
| **Focused** | `Cmd/Ctrl+K` or input focus | palette opens, input autofocused | `aria-expanded="true"` |
| **Searching** | query non-empty, results pending | loading row / spinner-free pulse | see §19 loading |
| **Results** | matches returned | filtered list, arrow-navigable | `role="listbox"`/`option` |

---

## 17. Route → Layout Mapping

Every route resolves to exactly one **shell** (§1.0). The shell is selected by
the nearest `layout.tsx` in the route tree; pages never choose their own frame.

| Route (URL) | File (route segment) | Shell | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | **Landing** (Public/Marketing) | `Navbar` + hero + `Footer` |
| `/about`, `/features`, `/pricing` | `app/(marketing)/*` | **Public/Marketing** | `Navbar` + `Footer` |
| `/auth/login` | `app/auth/login/page.tsx` | **Authentication** | split, no nav |
| `/auth/register` | `app/auth/register/page.tsx` | **Authentication** | split, no nav |
| `/dashboard` | `app/(platform)/dashboard/page.tsx` | **Platform** (`WorkspaceLayout`) | home/overview |
| `/dashboard/evolution` | `…/evolution/page.tsx` | **Platform** | dashboard grid (§6) |
| `/dashboard/explore` | `…/explore/page.tsx` | **Platform** | explore landing |
| `/dashboard/explore/domains` | `…/explore/domains/page.tsx` | **Platform** | — |
| `/dashboard/explore/trending` | `…/explore/trending/page.tsx` | **Platform** | — |
| `/dashboard/explore/recommendations` | `…/explore/recommendations/page.tsx` | **Platform** | — |
| `/dashboard/explore/[section]` | `…/explore/[section]/page.tsx` | **Platform** | dynamic section |
| `/dashboard/matrix` | `…/matrix/page.tsx` | **Workspace (immersive)** | Knowledge Matrix canvas |
| `/dashboard/neural-paths` | `…/neural-paths/page.tsx` | **Platform** | learning paths |
| `/dashboard/neural-paths/[pathId]` | `…/[pathId]/page.tsx` | **Platform** | path detail |
| `/dashboard/neural-paths/[pathId]/chapter/[chapterId]` | `…/chapter/[chapterId]/page.tsx` | **Platform** | chapter reader |
| `/dashboard/simulations` | `…/simulations/page.tsx` | **Workspace (immersive)** | sim library |
| `/dashboard/simulations/[slug]` | `…/simulations/[slug]/page.tsx` | **Workspace (immersive)** | sim stage |
| `/dashboard/spark` | `…/spark/page.tsx` | **Workspace (immersive)** | Spark AI chat |
| `/dashboard/profile` | `…/profile/page.tsx` | **Platform** | user profile |
| `/dashboard/settings` | `…/settings/page.tsx` | **Platform** + secondary sub-nav | settings sections |
| `/dashboard/admin`¹ | `…/admin/*` (nav-config referenced) | **Platform** (Admin role) | system admin |
| `error` (any group) | `error.tsx` | **Error** | centered, no chrome |
| `not-found` (any group) | `not-found.tsx` | inherits nearest shell, empty content | §11 empty |
| `loading` (any group) | `loading.tsx` | inherits nearest shell | §19 loading |

¹ `/dashboard/admin` is referenced by the nav config (`adminOnly: true`) and is
gated to the Admin role (§20). Confirm the exact segment folder before wiring.

**Rule:** routes inside `app/(platform)/*` all share `WorkspaceLayout`
(persistent shell). Routes in `app/(marketing)/*` and `app/page.tsx` share the
Public/Marketing shell. `app/auth/*` uses the Auth shell. Crossing these groups
is a **full transition** (§18); moving within a group is a **preserved-shell**
navigation.

---

## 18. Layout Transition Rules

Defines what happens to the shell when the route changes.

### 18.1 Preserved-shell navigation (no shell remount)

- **Scope:** any navigation *within* a single route group
  (`(platform)` ↔ `(platform)`, `(marketing)` ↔ `(marketing)`).
- **Behavior:** the shell (`WorkspaceLayout`, `Navbar`) is **not** remounted;
  only `<main>` (the page segment) swaps via React/Next reconciliation.
- **State preserved:** `WorkspaceProvider` state (`navCollapsed`, context-panel
  open, dock), command-palette history, scroll position of regions other than
  `main` (§4.2). The page supplies its own `loading.tsx` (§19).
- **Why:** avoids CLS and re-init of nav/panels; keeps the workspace feeling
  like one continuous app (Foundation §13 motion: page transitions fade, never
  slide full-screen).

### 18.2 Full page transition (shell crosses a boundary)

- **Scope:** Marketing/Public ↔ Auth ↔ Platform; any hard reload; `not-found`
  / `error` boundaries.
- **Behavior:** the previous shell unmounts; the new shell mounts fresh. The
  persistent preferences that are *server-independent* (theme, nav pins) are
  rehydrated from storage (§21); *server-dependent* state (open panels, graph
  camera) is restored only if encoded in the URL (§22).
- **Animation:** a short `250ms` fade + `8px` rise (`--ease-sci`, §13) on the
  incoming content. No layout-shifting slide.

### 18.3 When to reset vs preserve

| Change | Shell | Scroll | Panels/Graph | Command history |
|---|---|---|---|---|
| Within `(platform)` | preserved | `main` resets to top² | preserved | preserved |
| `(marketing)` ↔ `(marketing)` | preserved | top | n/a | preserved |
| Cross-group / reload | fresh | top | URL-encoded or default | cleared |
| `error`/`not-found` | replaced | top | n/a | cleared |

² Unless the destination opts into scroll restoration (e.g. returning to a
reader position via URL state, §22).

---

## 19. Loading Architecture

Layered, each level with its own skeleton that **matches the final layout box**
to prevent CLS (§13). No broken-spinners (Foundation §11) — use
`animate-pulse-ring` or determinate progress.

| Layer | Mechanism | Surface | Rules |
|---|---|---|---|
| **Global** | root `app/loading.tsx` + `CsrfFetchProvider` boundary | full-page under root layout | minimal brand mark + pulse; rare (only top-level suspense) |
| **Page** | `loading.tsx` per route segment (Next Suspense) | replaces `main` content | skeleton mirrors the page's header + grid (§5, §6) |
| **Section** | in-component `<Suspense>` around a slow section | one section of a page | skeleton sized to that section's box |
| **Widget** | per-widget loading state (§11 "Loading") | single `Card` | shimmer of title/metric rows; no layout shift |
| **AI streaming** | React streaming + incremental tokens (Spark) | chat message / explanation | blinking caret (`--ai-stream-cursor`, `1s` linear, see DESIGN_TOKENS §10 Motion); progressive reveal, not per-token layout jumps |
| **Skeleton** | token-driven placeholders | all layers | `bg-muted/40` blocks with `rounded-md`; identical dimensions to real content; disabled under `prefers-reduced-motion` |

**AI streaming note:** the streamed region grows downward only; surrounding
layout is fixed so the caret never pushes the shell (CLS-safe). Confidence
meters (`--ai-confidence`) and citations (`--ai-citation`) resolve on completion.

---

## 20. Permission-aware Layout

Roles gate **navigation items** and **layout regions** — never the shell itself.
All authenticated users share `WorkspaceLayout`; the differences are *which nav
items render* and *which regions are populated*.

| Role | Shell | Nav sections visible | Role-specific regions |
|---|---|---|---|
| **Guest** (unauthenticated) | Auth / Public only | none in app | redirected to `/auth/login` by `middleware.ts`; no Platform shell |
| **Student** (default) | Platform | HOME, LEARNING, LABS, SPARK, ANALYTICS, SYSTEM (non-admin) | standard context panel |
| **Researcher** | Platform | Student + Research entry | Research Workspace module; expanded context panel (citations/sources) |
| **Moderator** | Platform | Student + Moderation entry | moderation queue in context panel / nav |
| **Admin** | Platform | all incl. SYSTEM → Admin | `/dashboard/admin`; system settings; full data visibility |

### 20.1 Nav gating model

Extend the existing `NavItem` shape (see `WorkspaceNav`):

```ts
interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  color?: string;
  shortcut?: string;
  roles?: Role[];   // absent = visible to every authenticated role
}
```

- Items without `roles` render for all authenticated users.
- `roles: ['admin']` (today's `adminOnly: true`) hides the item unless the
  session role includes `admin`.
- Whole sections (e.g. SYSTEM → Admin sub-item) are filtered by the same check.
- **Region gating:** the context panel and dock render role-specific widgets
  (moderation queue, admin stats) only when the role permits — the *region*
  stays mounted; its *contents* are conditional.

### 20.2 Rules

- Never hide the shell by role; hide **items/regions** only.
- Disabled-by-role actions show a locked affordance + tooltip ("Admin only")
  rather than vanishing silently (color-independent, Foundation §14).
- Role is resolved server-side (middleware/session); the client filters the
  nav from the resolved role — no role logic in layout primitives.

---

## 21. Workspace Persistence

UI state that should survive reloads/sessions. Two stores:

- **Local (client-only):** `localStorage`, namespaced `neuron:<scope>:<key>`.
  Instant, no round-trip. Includes purely-personal prefs.
- **URL (shareable):** encoded in `searchParams` (§22). Survives link-sharing
  and back/forward. Includes collaborative/shareable workspace state.

| State | Store | Key / param | Default |
|---|---|---|---|
| Sidebar width/state | Local | `neuron:nav:state` (`expanded`/`collapsed`) | `expanded` |
| Pinned nav items | Local | `neuron:nav:pins` (migrate from legacy `sci-nav-pinned`) | `[]` |
| Open panels (context/dock) | URL + Local fallback | `panel` / `neuron:panel:context` | closed |
| Active tabs (settings/secondary) | URL | `tab` | first |
| Graph position (Matrix camera) | URL | `graph` | home |
| Workspace zoom (canvas modules) | URL + Local | `zoom` / `neuron:ws:zoom` | `1` |
| Last search | Local | `neuron:search:last` | `""` |
| Theme | Local | `neuron:theme` (`dark`/`light`/`hc`) → `<html>` class | `dark` |
| Preferred layout (density) | Local | `neuron:layout:density` (`comfortable`/`compact`) | `comfortable` |

### 21.1 Rules

- **Local keys are namespaced** (`neuron:*`) to avoid collisions; consolidate
  the existing `sci-nav-pinned` into `neuron:nav:pins`.
- **URL state wins** over local when both present (shareable link is explicit).
- **No secrets** in either store (theme, layout, camera only).
- Persistence is **progressive**: a missing/again key falls back to default
  without throwing (the existing `loadPins` already does this).
- High-frequency state (graph drag, zoom pan) is **debounced** before writing
  URL/local to avoid history spam (§22 encoding keeps it compact).

---

## 22. URL-driven Layout State

Workspace state is shareable via `searchParams`. Encodings are compact and
lossless enough to restore the view. All params are **optional** and ignore
unknown keys.

| Param | Applies to | Values | Example |
|---|---|---|---|
| `panel` | context/inspector | `closed` \| `open` \| `pinned` \| `detached:<id>` | `?panel=pinned` |
| `tab` | secondary sub-nav | slug of the active tab | `?tab=appearance` |
| `view` | module canvas | module-defined view slug | `?view=graph` |
| `sidebar` | `WorkspaceNav` | `expanded` \| `collapsed` \| `overlay` | `?sidebar=collapsed` |
| `graph` | Knowledge Matrix | `zoom:<n>,x:<n>,y:<n>` (camera) | `?graph=zoom:1.2,x:10,y:-4` |
| `workspace` | canvas modules | `zoom:<n>` (+ future module state) | `?workspace=zoom:0.8` |

### 22.1 Conventions

- **Encoding:** comma/colon-delimited scalars (no JSON blobs) so links stay
  short and diff-friendly; arrays use repeated keys (`&tag=a&tag=b`).
- **Restoration order:** URL params → local fallback (§21) → default.
- **History:** high-frequency params (`graph`, `workspace`) are written with
  `replace` (not `push`) and debounced; discrete params (`panel`, `tab`,
  `sidebar`, `view`) use `push` so Back returns to the prior state.
- **SSR-safe:** params are read in Server Components where possible; client
  updates use `useRouter().replace` with `scroll: false` to avoid jump.
- **Invalid values** are coerced to default (never throw) — same rule as §21.

---

## 23. Keyboard Navigation Map

Global shortcuts layer on top of the existing `[` sidebar toggle and
`Cmd/Ctrl+K` palette (§2.6, §3.1, §9.3). All bindings are ignored while typing
in `INPUT`/`TEXTAREA`/`SELECT` (existing `WorkspaceNav` pattern), unless the
shortcut is the palette/composer itself.

| Key | Scope | Action |
|---|---|---|
| `Cmd/Ctrl+K` | global | Open Command Palette (§9.3, §16.5) |
| `[` | global (non-input) | Toggle sidebar collapse (§2.6) |
| `Esc` | overlay context | Close topmost layer: Palette → Sheet/Dialog → Context detached → scrim. Never closes the shell. |
| `/` | Platform | Focus in-page search / open palette search |
| `?` | global | Toggle keyboard-shortcut help overlay |
| `g` then `d`/`e`/`s`/`m` | Platform (sequence) | Go to Dashboard / Explore / Spark / Matrix (vim-style quick nav) |
| `j` / `k` | lists/canvas | Move down / up through items (roving, §12.3) |
| `←` / `→` | rail/tabs | Move between nav items / tab stops |
| `Cmd/Ctrl+Enter` | Spark composer | Send message (AI focus, §16.5) |
| `Cmd/Ctrl+J` | Platform | Toggle Context Panel (open/close) |
| `Cmd/Ctrl+[` | global | Back navigation (browser history) |

### 23.1 Rules

- **Single source of truth:** shortcuts are registered once (a `useHotkeys`
  hook or the existing `keydown` listener pattern), not per-component.
- **Escape stack:** overlays close outermost-first; the shell is never
  dismissible by `Esc`.
- **Discoverability:** `?` help overlay lists all active shortcuts for the
  current role (§20).
- **Conflicts:** module-specific binds (e.g. Matrix pan) yield to global ones
  only when no input is focused.
- **Reduced motion:** shortcut-driven UI still animates per §13 (token-driven,
  neutralized under `prefers-reduced-motion`).

---

## 24. Workspace Region Diagram

High-level model of the Platform/Workspace shell (superset of §1.2). Regions are
stacked by `z-*` tokens (§11 of Tokens); the shell is `h-dvh overflow-hidden`,
only `<main>` scrolls.

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOP BAR  CommandBar / Navbar        z-navbar (1100)  · §3, §16.2       │
│          [ palette ] [ AI ] … [🔔][theme][user][⇆ ws]                   │
├──────────┬───────────────────────────────────────┬───────────────────┤
│ SIDEBAR  │  MAIN WORKSPACE  (<main id=main>)      │ CONTEXT PANEL     │
│ Workspace│  ───────────────────────────────────   │ (aside)           │
│ Nav      │  Page Header (§5)                      │ z-sidebar(1100)   │
│ z-sidebar│  ───────────────────────────────────   │ w:[--ctx-width]   │
│ w:[--nav-│  Content / Canvas (§4, §7)             │ Open/Pinned/      │
│ expanded-│  scrollable (overflow-y-auto)          │ Detached (§16.3)  │
│ width]   │  skip-link target → #main-content      │                   │
│ Expanded/│                                        │                   │
│ Collapsed│                                        │                   │
│ /Overlay │                                        │                   │
│ (§16.1)  │                                        │                   │
├──────────┴───────────────────────────────────────┴───────────────────┤
│ BOTTOM DOCK  BottomDock              z-base · §16.4                     │
│              [status] [tools] [zoom]        h:[--bottom-dock-height]   │
└──────────────────────────────────────────────────────────────────────┘
        ▲ overlay layer (z-overlay 1200 / z-modal 1300 / z-toast 1400)
          Sheets, Dialogs, Command Palette, detached Context render here
```

### 24.1 Region contracts

| Region | Element / role | z-index | Scrolls? | Source of state |
|---|---|---|---|---|
| Top Bar | `<header>` / `role=banner` | `z-navbar` (1100) | no | route + role (§20) |
| Sidebar | `<nav aria-label="Primary">` | `z-sidebar` (1100) | internal only | `useWorkspace()` (§16.1, §21) |
| Main Workspace | `<main id="main-content">` | `z-base` (0) | **yes** | page + URL (§22) |
| Context Panel | `<aside aria-label="Context">` | `z-sidebar` (1100) | internal only | `useWorkspace()` (§16.3, §22) |
| Bottom Dock | `<footer>` / `role=contentinfo` | `z-base` (0) | no | module + persistence (§21) |
| Overlay layer | Dialog/Sheet/Palette | `z-overlay`→`z-toast` | per-surface | transient (§16.5, §23) |

- **Landmarks** per §12.1; **skip link** targets `#main-content` (§12.2).
- Only `main` scrolls; the shell is viewport-locked (`h-dvh overflow-hidden`).
- Overlays never alter the shell's box — they float above it (CLS-safe, §13).

---

*End of Neuron UI V2 Layout System (Sprint 4). This document is authoritative;
when code and this layout contract disagree, update the code and note the change
here. Companion to [Design Foundation](./DESIGN_FOUNDATION.md) and
[Design Token System (Sprint 2)](./DESIGN_TOKENS.md).*
