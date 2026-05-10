// lib/mock-data.ts
export type ChapterStatus = "completed" | "active" | "locked";

export interface Chapter {
  id: string;
  title: string;
  status: ChapterStatus;
  xp: number;
}

export interface PathData {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  duration: string;
  xp: number;
  progress: number;
  image: string;
  description: string;
  chapters: Chapter[];
}

export const pathsData: PathData[] = [
  {
    slug: "architecture-of-intelligence",
    title: "The Architecture of Intelligence",
    category: "AI",
    difficulty: "Advanced",
    duration: "12 Hours",
    xp: 4500,
    progress: 74,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80",
    description: "From biological neural networks to synthetic architectures. Traverse the thin line between code and cognition.",
    chapters: [
      { id: "ch-1", title: "Emergence", status: "completed", xp: 500 },
      { id: "ch-2", title: "Neural Systems", status: "completed", xp: 500 },
      { id: "ch-3", title: "Learning Algorithms", status: "completed", xp: 500 },
      { id: "ch-4", title: "Consciousness", status: "active", xp: 500 },
      { id: "ch-5", title: "Artificial Minds", status: "locked", xp: 500 },
    ]
  },
  {
    slug: "quantum-entanglement",
    title: "Quantum Entanglement & Spacetime",
    category: "Physics",
    difficulty: "Intermediate",
    duration: "8 Hours",
    xp: 3200,
    progress: 0,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    description: "Unravel the mysterious connection between particles that defies the boundaries of space and time.",
    chapters: [
      { id: "qe-1", title: "Superposition", status: "locked", xp: 400 },
      { id: "qe-2", title: "Non-Locality", status: "locked", xp: 400 },
      { id: "qe-3", title: "ER=EPR", status: "locked", xp: 400 },
    ]
  },
  {
    slug: "evolution-of-cosmology",
    title: "The Evolution of Cosmology",
    category: "Space",
    difficulty: "Beginner",
    duration: "6 Hours",
    xp: 2400,
    progress: 100,
    image: "https://images.unsplash.com/photo-1462332420958-a05d1e002413?ixlib=rb-4.0.3&auto=format&fit=crop&w=1371&q=80",
    description: "A journey from ancient star maps to the discovery of dark matter and the expanding universe.",
    chapters: [
      { id: "ec-1", title: "The Celestial Sphere", status: "completed", xp: 300 },
      { id: "ec-2", title: "Relativity", status: "completed", xp: 300 },
    ]
  }
];

export const categories = ["All", "Physics", "AI", "Space", "Consciousness", "Philosophy"];