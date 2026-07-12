# SciOS Workspace UI Redesign — Phase 1 Prompt

## Sprint 1: Layout Foundation & Navigation System

### Objective

Redesign the entire SciOS application shell into a premium, modern, scalable workspace inspired by the usability and craftsmanship of Linear, Vercel, Raycast, Notion, Arc, and Apple Human Interface Guidelines.

This phase **does not redesign individual pages** (Dashboard, Learn, Spark, Simulations, etc.). Instead, it builds the shared layout foundation that every page will use.

The final result should feel like a professional operating system for scientific learning and AI research rather than a traditional web application.

---

# Primary Goals

* Build a completely new App Shell.
* Replace all legacy layout implementations.
* Standardize navigation.
* Improve information hierarchy.
* Create a responsive workspace.
* Fully comply with the SciOS Design Foundation.
* Use semantic Design Tokens only.
* Maintain excellent accessibility and performance.

---

# Design Personality

The workspace should communicate:

* Scientific
* Intelligent
* Minimal
* Premium
* Calm
* Professional
* High-end SaaS

Avoid:

* Glassmorphism overload
* Neon effects
* Cyberpunk aesthetics
* Excessive gradients
* Heavy shadows
* Visual clutter

Every interaction should feel intentional and polished.

---

# Overall Layout Architecture

Design a new application shell with the following hierarchy:

```
AppShell

├── Sidebar
├── Top Navigation
├── Breadcrumb Bar
├── Workspace Container
├── Page Header
├── Main Content
├── Optional Inspector Panel
└── Mobile Navigation
```

This layout must become the shared foundation for every authenticated page.

---

# Sidebar Redesign

Completely redesign the sidebar.

The sidebar should function as the central navigation hub of SciOS.

## Sections

### Workspace

* Dashboard
* Learn
* Knowledge Matrix
* Spark AI
* Simulations
* Research
* Evolution

---

### Productivity

* Notes
* Saved Concepts
* History

---

### Quick Actions

Include compact action buttons such as:

* Ask Spark
* Continue Learning
* Start Simulation

---

### Workspace Status

Display lightweight indicators for:

* AI Status
* Sync Status
* Notifications

---

### User Section

At the bottom include:

* Avatar
* Name
* Rank
* Settings
* Logout

---

# Sidebar Behavior

Support:

* Expanded
* Collapsed (icons only)
* Mobile Drawer
* Keyboard navigation
* Hover tooltips
* Smooth width transition
* Active navigation indicator

Use subtle animations only.

---

# Top Navigation Redesign

Create a premium top navigation.

Include:

## Left

* Breadcrumbs
* Current page title

## Center

Global Search

Display shortcut hint:

```
Ctrl + K
```

The search bar should feel like a command palette launcher.

---

## Right

Workspace Status

Notifications

Theme Toggle

User Menu

---

# Breadcrumb System

Implement a reusable breadcrumb component.

Example

```
Dashboard

Dashboard / Physics

Dashboard / Physics / Quantum Mechanics
```

Use semantic typography.

---

# Workspace Container

Create a reusable container component.

Responsibilities:

* Width constraints
* Responsive padding
* Section spacing
* Scroll behavior

No page should define its own container.

---

# Page Header

Reusable page header component.

Supports:

* Title
* Description
* Action buttons
* Filters
* Tabs

The same component should work across every page.

---

# Navigation Design

Navigation should prioritize clarity.

Active item:

* subtle background
* left accent indicator
* medium font weight

Hover:

* light elevation
* semantic hover color

Focus:

* accessible outline

Disabled:

* reduced opacity

---

# Mobile Navigation

Implement a dedicated mobile experience.

Features:

* Drawer Sidebar
* Sticky Header
* Responsive Search
* Bottom Navigation (optional)

Desktop navigation should never simply shrink.

---

# Responsive Breakpoints

Desktop

1200px+

Tablet

768px–1199px

Mobile

Below 768px

Transitions between layouts should feel seamless.

---

# Motion System

Use a unified animation system.

Hover

```
scale(1.015)

translateY(-2px)
```

Duration

```
180ms
```

Ease

```
ease-out
```

Sidebar collapse should animate smoothly.

Avoid excessive motion.

---

# Icons

Use one icon family only.

Recommended:

* Lucide React

Icons should:

* consistent size
* consistent stroke width
* semantic colors

---

# Typography

Use the project's typography system.

Hierarchy:

Page Title

Section Title

Body

Caption

Numeric values should use tabular figures where appropriate.

---

# Color System

Only semantic tokens.

Examples

```
bg-background

bg-card

bg-muted

border-border

text-foreground

text-muted-foreground

primary

secondary

accent

destructive
```

Domain-specific colors only when representing scientific domains.

---

# Shadows

Use elevation levels instead of arbitrary shadows.

Example

```
Elevation 0

Elevation 1

Elevation 2
```

No glow effects.

---

# Borders

Rounded corners should be consistent.

Suggested:

```
rounded-lg

rounded-xl

rounded-2xl
```

Avoid random radius values.

---

# Accessibility

Support:

* WCAG AA
* Keyboard navigation
* Screen readers
* Focus indicators
* Reduced motion
* High contrast mode

No interaction should depend solely on color.

---

# Performance

Use:

* React Server Components where possible
* Dynamic imports
* Suspense boundaries
* Minimal client-side hydration
* Lazy loading for heavy UI

Avoid unnecessary re-renders.

---

# Code Organization

Organize components under:

```
components/layout/

app-shell.tsx

sidebar/

topbar/

breadcrumbs/

workspace-container/

page-header/

navigation/

mobile-navigation/

theme-toggle/

command-search/

notifications/

user-menu/
```

Each component should have a single responsibility.

---

# Cleanup

Remove:

* Legacy layout wrappers
* Deprecated CSS classes
* Duplicate spacing utilities
* Unused navigation components
* Hardcoded colors
* Inline layout logic

Replace everything with reusable layout primitives.

---

# Deliverables

At the end of this sprint:

* New App Shell
* New Sidebar
* New Top Navigation
* Breadcrumb System
* Workspace Container
* Page Header
* Responsive Navigation
* Mobile Layout
* Theme Toggle
* Command Search Trigger
* User Menu
* Notification Center
* Workspace Status Indicators

No application pages should be redesigned yet.

---

# Acceptance Criteria

The implementation is complete only if:

* Every authenticated page uses the new App Shell.
* Sidebar is fully responsive.
* Top Navigation is reusable.
* Breadcrumbs work correctly.
* Keyboard navigation is functional.
* Light and Dark themes are fully supported.
* Mobile experience is polished.
* All deprecated layout code has been removed.
* Design Tokens are used consistently.
* No visual regressions exist.
* The workspace feels premium, modern, and production-ready.

This sprint establishes the complete visual and architectural foundation for all future SciOS pages.
