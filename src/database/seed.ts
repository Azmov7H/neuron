/**
 * Database Seeding Helper
 * Initialize MongoDB with sample data
 */

import { connectDB } from '@/database/connection';
import { User } from '@/database/models/user';
import { NeuralPath } from '@/database/models/neural-path';
import { Chapter } from '@/types';

/**
 * Seed database with sample data
 * Run once during development setup
 */
export async function seedDatabase() {
  try {
    await connectDB();

    console.log('[Seed] Starting database seeding...');

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Data already exists, skipping seed');
      return;
    }

    // Create sample users
    const sampleUsers = [
      {
        username: 'alex_explorer',
        email: 'alex@example.com',
        password: 'SecurePass123',
      },
      {
        username: 'jordan_scholar',
        email: 'jordan@example.com',
        password: 'SecurePass123',
      },
      {
        username: 'casey_sage',
        email: 'casey@example.com',
        password: 'SecurePass123',
      },
    ];

    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`[Seed] Created ${createdUsers.length} users`);

    // Create sample neural paths
    const chapters: Chapter[] = [
      {
        id: 'ch-1',
        title: 'Foundations',
        description: 'Learn the basics',
        objectives: ['Understand core concepts', 'Build foundational knowledge'],
        duration: 45,
        resources: ['video-1', 'article-1'],
        concepts: ['basics', 'intro'],
        difficulty: 'beginner',
        order: 1,
      },
      {
        id: 'ch-2',
        title: 'Intermediate Concepts',
        description: 'Dive deeper',
        objectives: ['Apply concepts', 'Solve problems'],
        duration: 60,
        resources: ['video-2', 'interactive-1'],
        concepts: ['application', 'patterns'],
        difficulty: 'intermediate',
        order: 2,
      },
      {
        id: 'ch-3',
        title: 'Advanced Topics',
        description: 'Master the subject',
        objectives: ['Synthesize knowledge', 'Create solutions'],
        duration: 90,
        resources: ['case-study-1', 'project-1'],
        concepts: ['synthesis', 'mastery'],
        difficulty: 'advanced',
        order: 3,
      },
    ];

    const samplePaths = [
      {
        slug: 'quantum-mechanics-basics',
        title: 'Quantum Mechanics Fundamentals',
        description: 'Explore the quantum world and understand particles at subatomic levels',
        domain: 'science',
        category: 'Physics',
        difficulty: 'beginner' as const,
        estimatedTime: 180,
        chapters,
        prerequisites: [],
        xpReward: 500,
        difficulty_multiplier: 1,
      },
      {
        slug: 'machine-learning-intro',
        title: 'Introduction to Machine Learning',
        description: 'Learn algorithms and techniques that power modern AI systems',
        domain: 'technology',
        category: 'AI/ML',
        difficulty: 'intermediate' as const,
        estimatedTime: 240,
        chapters,
        prerequisites: [],
        xpReward: 750,
        difficulty_multiplier: 1.5,
      },
      {
        slug: 'philosophy-of-mind',
        title: 'Philosophy of Mind',
        description: 'Investigate consciousness, intentionality, and mental states',
        domain: 'philosophy',
        category: 'Philosophy',
        difficulty: 'advanced' as const,
        estimatedTime: 300,
        chapters,
        prerequisites: [],
        xpReward: 1000,
        difficulty_multiplier: 2,
      },
    ];

    const createdPaths = await NeuralPath.insertMany(samplePaths);
    console.log(`[Seed] Created ${createdPaths.length} neural paths`);

    console.log('[Seed] ✓ Database seeding completed successfully');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    throw error;
  }
}

/**
 * Clear database (use with caution!)
 */
export async function clearDatabase() {
  try {
    await connectDB();

    console.log('[Clear] Starting database clear...');

    // Clear all collections
    await User.deleteMany({});
    await NeuralPath.deleteMany({});

    console.log('[Clear] ✓ Database cleared');
  } catch (error) {
    console.error('[Clear] Error during clear:', error);
    throw error;
  }
}
