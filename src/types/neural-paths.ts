export type PathDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ChapterSummary {
  id: string;
  title: string;
  description: string;
  explanation: string;
  objectives: string[];
  concepts: string[];
  duration: number;
  order: number;
  difficulty: PathDifficulty;
  progress: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
}

export interface NeuralPathItem {
  _id: string;
  slug: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  difficulty: PathDifficulty;
  estimatedTime: number;
  xpReward: number;
  visitsCount: number;
  completionRate: number;
  averageRating: number;
  chapters: ChapterSummary[];
  progress: number;
}

export interface PathDetailDTO extends NeuralPathItem {
  overallCompletion: number;
  chapters: ChapterSummary[];
}
