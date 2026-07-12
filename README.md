# Neuron

A gamified, AI-assisted learning platform (the "SciOS" workspace). Built on Next.js 16 App Router with a shared layout shell — sidebar, top bar, command palette, and bottom dock — wired to authenticated API routes.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, `tw-animate-css`, shadcn/ui + Radix UI primitives
- **Icons:** `lucide-react`
- **State:** `zustand` (workspace/shell state), React context for the workspace provider
- **Data:** MongoDB via `mongoose`, Redis, JWT auth over an httpOnly session cookie
- **Package manager:** pnpm

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (platform)/            # Authenticated app shell + pages
  api/
    navigation/          # GET sidebar nav config (role-aware)
    notifications/       # GET user notifications (recommendations + activity)
    dock/                # GET recent simulation runs for the bottom dock
    dashboard/summary/   # GET aggregated dashboard data
    users/profile/       # GET current user
    knowledge/search/    # GET live knowledge search (command palette)
components/
  workspace/             # Shell: sidebar, top bar, command palette, bottom dock, page header
  dashboard/             # Dashboard widgets (e.g. NeuralWelcome)
src/
  middleware/auth.ts     # verifyAccessToken, getAuthContext, requireAuth
  lib/utils/response.ts  # ApiResponseHandler (success/error envelope)
  database/models/       # Mongoose models (user, neural-path, simulation-run, ...)
md/                      # Design specs (Layout.md, DESIGN_TOKENS.md)
```

## Layout System

The authenticated shell is defined in `app/(platform)/layout.tsx`, which resolves the session role server-side and passes it to `WorkspaceLayout`. Client shell components:

- **`workspace-nav`** — left sidebar. Fetches `/api/navigation` (`credentials: "include"`) and renders role-filtered sections with a left-accent active indicator; falls back to a static config on failure.
- **`command-bar`** — top bar. Shows the search trigger (⌘K), Spark AI status, notifications center (`/api/notifications`), and a user menu (`/api/users/profile`).
- **`command-palette`** — ⌘K palette. Static commands plus debounced live knowledge search against `/api/knowledge/search`.
- **`bottom-dock`** — bottom dock of recent processes. Fetches `/api/dock` and layers results into shared `dockItems` state.
- **`page-header`** — responsive breadcrumbs + title + actions, used by dashboard pages.

## Authentication & API Envelope

- Auth uses the `neuron_session` httpOnly cookie → `verifyAccessToken` → `payload.role`. Client `fetch` calls must use `credentials: "include"`.
- Server route handlers wrap logic with `requireAuth` + `withErrorHandling`.
- Responses follow the envelope from `ApiResponseHandler`: `{ success, data?, error?, message?, statusCode }`.

## Deployment

Deployed on Vercel, which builds the `rd/ui-02/layout-foundation` branch. Vercel runs `pnpm install --frozen-lockfile`, so the lockfile must stay in sync with `package.json`.

> **Lockfile note:** `package.json` declares `pnpm.overrides` (react/react-dom pinned to 19.1.0). The `pnpm-lock.yaml` `overrides` block must match, or the frozen install fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Regenerate with `pnpm install --lockfile-only` if the overrides change.

For full Next.js deployment details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
