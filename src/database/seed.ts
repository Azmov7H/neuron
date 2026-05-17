/**
 * Database Seeding Helper
 * Initialize MongoDB with sample users, neural paths, and educational knowledge base chunks
 */

import { connectDB } from '@/database/connection';
import { User } from '@/database/models/user';
import { NeuralPath } from '@/database/models/neural-path';
import { Knowledge } from '@/database/models/knowledge';
import { Chapter } from '@/types';

/**
 * Seed database with sample data
 * Run once during development setup
 */
export async function seedDatabase() {
  try {
    await connectDB();

    console.log('[Seed] Starting database seeding...');

    // 1. Seed Knowledge Base (structured educational chunks)
    // Clear existing to ensure the schema updates (with relatedSimulations) are seeded properly
    await Knowledge.deleteMany({});
    
    const sampleKnowledge = [
      {
        title: 'Quantum Entanglement',
        domain: 'science',
        explanation: 'Quantum entanglement is a physical phenomenon that occurs when a pair or group of particles is generated, interact, or share spatial proximity in a way such that the quantum state of each particle cannot be described independently of the state of the others, even when the particles are separated by a large distance. Einstein famously called this "spooky action at a distance." It is a fundamental principle of quantum mechanics and is crucial for developing technologies like quantum computing and quantum cryptography.',
        tags: ['physics', 'quantum mechanics', 'quantum entanglement'],
        relatedConcepts: ['Superposition', 'Quantum Tunneling', 'Spacetime Curvature'],
        relatedSimulations: ['Quantum Spin Laboratory', 'Entangled Particle Chamber'],
        difficulty: 'advanced' as const,
        examples: [
          'Bell test experiments proving non-local correlations that defy classical physics.',
          'Quantum teleportation protocols using entangled photon pairs to transmit information states.'
        ]
      },
      {
        title: 'Neural Networks',
        domain: 'technology',
        explanation: 'A neural network (also known as an Artificial Neural Network or ANN) is a computational model inspired by the biological structure and functioning of human brains. It consists of layers of interconnected nodes (neurons): an input layer, one or more hidden layers, and an output layer. Neurons process incoming information by applying weights and biases, passing the result through an activation function, and sending signals forward. They learn and adapt by adjusting these weights using algorithms like backpropagation and gradient descent.',
        tags: ['ai', 'machine learning', 'neural networks', 'deep learning'],
        relatedConcepts: ['Machine Learning', 'Deep Learning', 'Perceptrons', 'Backpropagation'],
        relatedSimulations: ['Perceptron Simulator', 'Neural Network Visualizer'],
        difficulty: 'intermediate' as const,
        examples: [
          'Convolutional Neural Networks (CNNs) classifying images of galaxies.',
          'Large Language Models (LLMs) predicting the next most logical token in a sentence.'
        ]
      },
      {
        title: 'Time Dilation',
        domain: 'science',
        explanation: 'Time dilation is a difference in the elapsed time measured by two clocks, either due to a relative velocity between them (special relativity) or a difference in gravitational potential between their locations (general relativity). According to Einstein, time is not absolute but relative. The faster an object moves through space, the slower it moves through time relative to a stationary observer. Similarly, massive gravitational fields warp spacetime itself, slowing the passage of time nearby.',
        tags: ['physics', 'relativity', 'time dilation', 'gravity'],
        relatedConcepts: ['Spacetime Curvature', 'Gravity', 'Special Relativity', 'General Relativity'],
        relatedSimulations: ['Relativistic Orbit Simulator', 'Spacetime Gravitational Well'],
        difficulty: 'intermediate' as const,
        examples: [
          'Atomic clocks on GPS satellites ticking slightly faster than those on Earth due to weaker gravity and high speed.',
          'Astronauts on the International Space Station aging slightly slower than people on the ground.'
        ]
      },
      {
        title: 'Entropy',
        domain: 'science',
        explanation: 'In thermodynamics, entropy is a scientific concept and physical property that is commonly associated with a state of disorder, randomness, or uncertainty. According to the Second Law of Thermodynamics, the total entropy of an isolated system always increases over time, meaning systems naturally progress from states of order to states of high disorder. In information theory, entropy represents the measure of uncertainty or surprise associated with a random variable or data source.',
        tags: ['science', 'thermodynamics', 'entropy', 'disorder'],
        relatedConcepts: ['Thermodynamics', 'Information Theory', 'Chaos Theory', 'Emergence'],
        relatedSimulations: ['Gas Diffusion Chamber', 'Thermodynamics Sandbox'],
        difficulty: 'intermediate' as const,
        examples: [
          'An ice cube melting in a glass of warm water, dispersing heat and increasing disorder.',
          'A drop of ink spreading uniformly in a beaker of water, never spontaneously reassembling.'
        ]
      },
      {
        title: 'Philosophy of Mind',
        domain: 'philosophy',
        explanation: 'Philosophy of mind is a branch of philosophy that studies the ontology and nature of the mind, mental events, mental functions, mental properties, consciousness, and their relationship to the physical body, particularly the brain. A central issue is the mind-body problem: how an immaterial mind can interact with, influence, or arise from a material physical brain. Major perspectives include dualism (mind and body are distinct) and physicalism/materialism (mental states are brain states).',
        tags: ['philosophy', 'consciousness', 'mind', 'cognition'],
        relatedConcepts: ['Consciousness', 'Cognitive Science', 'Dualism', 'Physicalism'],
        relatedSimulations: ['Turing Test Sandbox', 'Synaptic Fire Map'],
        difficulty: 'advanced' as const,
        examples: [
          "René Descartes' cogito, ergo sum ('I think, therefore I am') argument for substance dualism.",
          'The "Hard Problem of Consciousness" (David Chalmers) explaining subjective qualitative experience (qualia).'
        ]
      },
      {
        title: 'Emergence',
        domain: 'science',
        explanation: 'Emergence occurs when an entity or system is observed to have properties its parts do not have on their own, properties or behaviors which emerge only when the parts interact in a wider whole. In complex systems, simple interactions between individual components can lead to complex global patterns that are unpredictable from analyzing the parts alone. It is summarized by the phrase "the whole is greater than the sum of its parts." Plays a vital role in biological systems, physics, and neural pathways.',
        tags: ['science', 'complexity', 'emergence', 'systems'],
        relatedConcepts: ['Chaos Theory', 'Entropy', 'Systems Dynamics', 'Self-Organization'],
        relatedSimulations: ['Boids Swarm Simulation', 'Conways Game of Life Sandbox'],
        difficulty: 'intermediate' as const,
        examples: [
          'Water molecules (hydrogen and oxygen gases individually) exhibiting wetness as a collective liquid.',
          'Individual ants executing basic chemical rules that lead to a highly organized, complex ant colony.'
        ]
      }
    ];

    await Knowledge.insertMany(sampleKnowledge);
    console.log(`[Seed] Seeded ${sampleKnowledge.length} knowledge base concepts with simulations`);

    // 2. Check if user/paths data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] User data already exists, skipping user and neural paths seed');
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
        explanation: 'Dummy explanation',
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
        explanation: 'Dummy explanation',
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
        explanation: 'Dummy explanation',
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
    await Knowledge.deleteMany({});

    console.log('[Clear] ✓ Database cleared');
  } catch (error) {
    console.error('[Clear] Error during clear:', error);
    throw error;
  }
}
