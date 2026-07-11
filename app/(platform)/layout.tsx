import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { Role } from "@/types";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

const SESSION_COOKIE = "neuron_session";

/**
 * Resolve the current session role server-side from the auth cookie.
 * Returns null when unauthenticated or the token is invalid — the shell
 * then renders permissively (every nav item visible) until a role is known.
 */
async function resolveRole(): Promise<Role | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAccessToken(token);
  return payload?.role ?? null;
}

/**
 * Platform shell — the authenticated application surface (dashboard, settings,
 * and any other route grouped under `(platform)`). Wraps every page in the
 * workspace layout so the command bar, sidebar, context panel, and dock are
 * shared consistently.
 */
export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const role = await resolveRole();
  return <WorkspaceLayout role={role}>{children}</WorkspaceLayout>;
}
