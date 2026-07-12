import type { IRecommendation } from "@/types";

export interface ExploreDomain {
  name: string;
  theme: string;
  iconName: string;
  gradient: string;
  glow: string;
  pathCount: number;
}

export type ExploreActivityAction =
  | "view_domain"
  | "view_concept"
  | "view_recommendation";

export interface ExploreActivityDTO {
  _id: string;
  action: ExploreActivityAction;
  targetId: string;
  createdAt: string;
}

export type { IRecommendation };
