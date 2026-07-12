/**
 * GET /api/navigation
 * Returns the authenticated app-shell navigation config (sidebar).
 * Icons are referenced by lucide icon name; the client resolves them
 * against a local registry so the config can be served as plain data.
 */

import { NextRequest } from "next/server";
import { getAuthContext, withErrorHandling, requireAuth } from "@/middleware/auth";
import { ApiResponseHandler } from "@/lib/utils/response";
import type { Role } from "@/types";

export interface NavItemDTO {
  id: string;
  label: string;
  icon: string;
  href: string;
  color?: string;
  shortcut?: string;
  /** Roles permitted to see this item. Omitted = visible to everyone. */
  roles?: Role[];
}

export interface NavSectionDTO {
  id: string;
  title: string;
  items: NavItemDTO[];
}

const SECTIONS: NavSectionDTO[] = [
  {
    id: "home",
    title: "HOME",
    items: [{ id: "home", label: "Home", icon: "Home", href: "/dashboard" }],
  },
  {
    id: "learning",
    title: "LEARNING",
    items: [
      {
        id: "neural-paths",
        label: "Neural Paths",
        icon: "Route",
        href: "/dashboard/neural-paths",
        color: "text-purple-400",
      },
      {
        id: "explore",
        label: "Explore",
        icon: "Compass",
        href: "/dashboard/explore",
        color: "text-cyan-400",
      },
    ],
  },
  {
    id: "labs",
    title: "LABS",
    items: [
      {
        id: "physics",
        label: "Physics",
        icon: "Atom",
        href: "/dashboard/simulations",
        color: "text-blue-400",
      },
      {
        id: "biology",
        label: "Biology",
        icon: "Leaf",
        href: "/dashboard/simulations",
        color: "text-green-400",
      },
      {
        id: "chemistry",
        label: "Chemistry",
        icon: "FlaskConical",
        href: "/dashboard/simulations",
        color: "text-yellow-400",
      },
      {
        id: "mathematics",
        label: "Mathematics",
        icon: "Pi",
        href: "/dashboard/explore",
        color: "text-purple-400",
      },
      {
        id: "ai",
        label: "AI",
        icon: "Brain",
        href: "/dashboard/explore",
        color: "text-indigo-400",
      },
      {
        id: "anatomy",
        label: "Human Anatomy",
        icon: "Dna",
        href: "/dashboard/simulations/anatomy-3d",
        color: "text-red-400",
      },
      {
        id: "astronomy",
        label: "Astronomy",
        icon: "Telescope",
        href: "/dashboard/explore",
        color: "text-cyan-400",
      },
      {
        id: "technology",
        label: "Technology",
        icon: "Cpu",
        href: "/dashboard/explore",
        color: "text-orange-400",
      },
    ],
  },
  {
    id: "spark",
    title: "SPARK",
    items: [
      {
        id: "spark",
        label: "Conversations",
        icon: "Zap",
        href: "/dashboard/spark",
        color: "text-amber-400",
      },
      {
        id: "matrix",
        label: "Knowledge Matrix",
        icon: "LayoutGrid",
        href: "/dashboard/matrix",
        color: "text-indigo-400",
      },
      {
        id: "simulations",
        label: "Simulations",
        icon: "MonitorPlay",
        href: "/dashboard/simulations",
        color: "text-blue-400",
      },
    ],
  },
  {
    id: "analytics",
    title: "ANALYTICS",
    items: [
      {
        id: "evolution",
        label: "Evolution",
        icon: "TrendingUp",
        href: "/dashboard/evolution",
        color: "text-emerald-400",
      },
      {
        id: "achievements",
        label: "Achievements",
        icon: "Trophy",
        href: "/dashboard/achievements",
        color: "text-amber-400",
      },
    ],
  },
  {
    id: "system",
    title: "SYSTEM",
    items: [
      { id: "profile", label: "Profile", icon: "User", href: "/dashboard/profile" },
      { id: "settings", label: "Settings", icon: "Settings", href: "/dashboard/settings" },
      {
        id: "admin",
        label: "Admin",
        icon: "Shield",
        href: "/dashboard/admin",
        roles: ["admin"],
      },
    ],
  },
];

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  return ApiResponseHandler.success({ sections: SECTIONS });
}

export const GET = withErrorHandling(requireAuth(handler));
