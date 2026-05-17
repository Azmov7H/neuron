import { ExploreActivity } from '@/database/models/explore-activity';
import mongoose from 'mongoose';

// Static seed data to replace frontend mocks while maintaining a basic integration
const SEED_DOMAINS = [
  { name: "Physics", theme: "Reality & Matter", iconName: "Atom", gradient: "from-blue-600/20 to-transparent", glow: "group-hover:shadow-blue-500/20" },
  { name: "AI", theme: "Intelligence", iconName: "Brain", gradient: "from-purple-600/20 to-transparent", glow: "group-hover:shadow-purple-500/20" },
  { name: "Biology", theme: "Life Systems", iconName: "Leaf", gradient: "from-emerald-600/20 to-transparent", glow: "group-hover:shadow-emerald-500/20" },
  { name: "Space", theme: "Cosmos", iconName: "Orbit", gradient: "from-cyan-600/20 to-transparent", glow: "group-hover:shadow-cyan-500/20" },
  { name: "Mathematics", theme: "Structure", iconName: "Pi", gradient: "from-rose-600/20 to-transparent", glow: "group-hover:shadow-rose-500/20" },
  { name: "Consciousness", theme: "Mind", iconName: "Eye", gradient: "from-amber-600/20 to-transparent", glow: "group-hover:shadow-amber-500/20" },
  { name: "Philosophy", theme: "Meaning", iconName: "Scale", gradient: "from-indigo-600/20 to-transparent", glow: "group-hover:shadow-indigo-500/20" },
  { name: "Future Tech", theme: "Civilization", iconName: "Cpu", gradient: "from-teal-600/20 to-transparent", glow: "group-hover:shadow-teal-500/20" },
];

const SEED_CONCEPTS = [
  "Entropy", "Neural Networks", "Dark Matter", "Emergence", "Quantum Tunneling", 
  "Blockchains", "Epigenetics", "String Theory", "Teleology", "Superposition"
];

const SEED_RECOMMENDATIONS = [
  { title: "The Nature of Computation", desc: "Bridge between physics and computer science.", type: "Concept" },
  { title: "Neural Darwinism", desc: "How neuronal groups evolve through selection.", type: "Theory" },
  { title: "Quantum Biology", desc: "Quantum effects in biological processes.", type: "Domain" },
];

export class ExploreService {
  static async getDomains() {
    return SEED_DOMAINS;
  }

  static async getConcepts() {
    return SEED_CONCEPTS; // Could be paginated/filtered in real scenario
  }

  static async getTrendingConcepts() {
    // In a fully dynamic system, this would aggregate ExploreActivity targetIds where action = 'view_concept'
    // For now, we return the seeded list.
    return SEED_CONCEPTS;
  }

  static async getRecommendations(userId: string) {
    // Fetch user recent activity to potentially alter recommendations
    const recentActivity = await ExploreActivity.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // If no real AI engine, return the static seeds as personalized fallback
    return SEED_RECOMMENDATIONS.map(rec => ({
      ...rec,
      // Just a simple tweak based on activity presence
      desc: recentActivity.length > 0 ? `${rec.desc} (Based on your history)` : rec.desc
    }));
  }

  static async logActivity(userId: string, action: string, targetId: string, metadata?: any) {
    const activity = await ExploreActivity.create({
      userId: new mongoose.Types.ObjectId(userId),
      action,
      targetId,
      metadata
    });
    return activity;
  }

  static async getNavigationConfig() {
    return {
      sections: [
        {
          id: "domains",
          title: "Domains of Knowledge",
          description: "Explore fundamental reality and mind.",
          icon: "Atom",
          route: "/dashboard/explore/domains",
          type: "domain",
          isActive: true
        },
        {
          id: "trending",
          title: "Trending Concepts",
          description: "Current trending neural concepts.",
          icon: "TrendingUp",
          route: "/dashboard/explore/trending",
          type: "concept",
          isActive: true
        },
        {
          id: "recommendations",
          title: "Recommended For You",
          description: "Personalized exploration paths.",
          icon: "Sparkles",
          route: "/dashboard/explore/recommendations",
          type: "tool",
          isActive: true
        },
        {
          id: "featured",
          title: "Featured Neural Paths",
          description: "Curated learning journeys.",
          icon: "Route",
          route: "/dashboard/explore/featured",
          type: "path",
          isActive: true
        },
        {
          id: "connections",
          title: "Knowledge Connections",
          description: "Discover how concepts link together.",
          icon: "Network",
          route: "/dashboard/explore/connections",
          type: "tool",
          isActive: true
        },
      ]
    };
  }
}

