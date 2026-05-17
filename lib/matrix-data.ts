// lib/matrix-data.ts
export interface MatrixNode {
  id: string;
  title: string;
  domain: "Physics" | "AI" | "Biology" | "Space" | "Mathematics" | "Consciousness";
  position: [number, number, number];
  description: string;
  connections: string[];
  layer: 1 | 2 | 3;
  parentId: string | null;
  importance: number; // 1 (highest/core) to 3 (deepest)
  activationFrequency: number; // 0.1 to 1.0 (dictates baseline pulsing brightness)
  connectionStrengths?: Record<string, number>; // maps targetNodeId to strength (1 to 3)
}

export interface MatrixEdge {
  source: string;
  target: string;
  strength: number; // 1 to 3 (dictates line width)
}

export const domainColors: Record<MatrixNode["domain"], string> = {
  Physics: "#3b82f6", // Neon Blue
  AI: "#a855f7", // Neon Purple
  Biology: "#10b981", // Neon Emerald
  Space: "#06b6d4", // Neon Cyan
  Mathematics: "#f43f5e", // Neon Rose
  Consciousness: "#f59e0b", // Neon Amber
};

export const nodes: MatrixNode[] = [
  // ==========================================
  // LAYER 1: CORE NODES (CENTER KNOWLEDGE)
  // ==========================================
  {
    id: "quantum-mechanics",
    title: "Quantum Mechanics",
    domain: "Physics",
    position: [-4, 2, -1],
    description: "The fundamental theory describing nature at the atomic and subatomic levels, questioning classical determinism.",
    connections: ["information-theory", "consciousness", "entropy", "relativity"],
    layer: 1,
    parentId: null,
    importance: 1,
    activationFrequency: 1.0,
    connectionStrengths: { "information-theory": 3, "consciousness": 2, "entropy": 2, "relativity": 3 }
  },
  {
    id: "neural-networks",
    title: "Neural Networks",
    domain: "AI",
    position: [4, 2, 1],
    description: "Computational models inspired by biological brain structures, designed to recognize patterns and map non-linear functions.",
    connections: ["deep-learning", "consciousness", "information-theory", "reinforcement-learning"],
    layer: 1,
    parentId: null,
    importance: 1,
    activationFrequency: 0.95,
    connectionStrengths: { "deep-learning": 3, "consciousness": 2, "information-theory": 2, "reinforcement-learning": 3 }
  },
  {
    id: "dna",
    title: "DNA Structure",
    domain: "Biology",
    position: [-4, -2, 1],
    description: "The double-helix molecular carrier of genetic blueprints that directs cellular life, replication, and biological inheritance.",
    connections: ["evolution", "information-theory", "neural-systems"],
    layer: 1,
    parentId: null,
    importance: 1,
    activationFrequency: 0.9,
    connectionStrengths: { "evolution": 3, "information-theory": 2, "neural-systems": 2 }
  },
  {
    id: "spacetime",
    title: "Spacetime",
    domain: "Space",
    position: [4, -2, -1],
    description: "The four-dimensional physical continuum fusing the three dimensions of space and one dimension of time.",
    connections: ["black-holes", "quantum-mechanics", "cosmology", "relativity"],
    layer: 1,
    parentId: null,
    importance: 1,
    activationFrequency: 0.95,
    connectionStrengths: { "black-holes": 3, "quantum-mechanics": 2, "cosmology": 2, "relativity": 3 }
  },
  {
    id: "information-theory",
    title: "Information Theory",
    domain: "Mathematics",
    position: [0, 5, -2],
    description: "The mathematical study of quantification, transmission, and entropy of information, linking biology, computing, and physics.",
    connections: ["quantum-mechanics", "neural-networks", "dna", "entropy", "probability", "topology"],
    layer: 1,
    parentId: null,
    importance: 1,
    activationFrequency: 1.0,
    connectionStrengths: { "quantum-mechanics": 3, "neural-networks": 2, "dna": 2, "entropy": 3, "probability": 2, "topology": 1 }
  },
  {
    id: "consciousness",
    title: "Consciousness",
    domain: "Consciousness",
    position: [0, -5, 2],
    description: "The subjective state of self-awareness and qualia, standing as one of the ultimate frontiers of scientific and philosophical inquiry.",
    connections: ["neural-systems", "quantum-mechanics", "neural-networks", "emergence", "perception"],
    layer: 1,
    parentId: null,
    importance: 1,
    activationFrequency: 0.9,
    connectionStrengths: { "neural-systems": 3, "quantum-mechanics": 2, "neural-networks": 2, "emergence": 3, "perception": 2 }
  },

  // ==========================================
  // LAYER 2: RELATED NODES (EXPANDABLE LAYER)
  // ==========================================
  {
    id: "entropy",
    title: "Entropy",
    domain: "Physics",
    position: [-7, 3.5, 1],
    description: "A measure of molecular disorder, randomness, or uncertainty within a closed physical system, defining the flow of time.",
    connections: ["quantum-mechanics", "time-arrows", "information-theory"],
    layer: 2,
    parentId: "quantum-mechanics",
    importance: 2,
    activationFrequency: 0.75,
    connectionStrengths: { "quantum-mechanics": 2, "time-arrows": 3, "information-theory": 3 }
  },
  {
    id: "deep-learning",
    title: "Deep Learning",
    domain: "AI",
    position: [7, 3.5, -1],
    description: "A subset of machine learning using multi-layered artificial neural networks to feature-engineer and solve highly complex tasks.",
    connections: ["neural-networks", "pattern-recognition"],
    layer: 2,
    parentId: "neural-networks",
    importance: 2,
    activationFrequency: 0.8,
    connectionStrengths: { "neural-networks": 3, "pattern-recognition": 3 }
  },
  {
    id: "evolution",
    title: "Evolution",
    domain: "Biology",
    position: [-7, -3.5, 3],
    description: "The gradual adaptation of biological species across generations driven by natural selection, mutation, and genetic drift.",
    connections: ["dna", "emergence"],
    layer: 2,
    parentId: "dna",
    importance: 2,
    activationFrequency: 0.7,
    connectionStrengths: { "dna": 3, "emergence": 2 }
  },
  {
    id: "black-holes",
    title: "Black Holes",
    domain: "Space",
    position: [7, -3.5, -3],
    description: "Extremely dense regions of spacetime where gravitational collapse creates an event horizon from which nothing, not even light, escapes.",
    connections: ["spacetime", "cosmology"],
    layer: 2,
    parentId: "spacetime",
    importance: 2,
    activationFrequency: 0.8,
    connectionStrengths: { "spacetime": 3, "cosmology": 2 }
  },
  {
    id: "probability",
    title: "Probability & Stochastics",
    domain: "Mathematics",
    position: [-2, 8, -4],
    description: "The mathematical framework analyzing uncertainty, randomness, and statistical likelihood in complex systems.",
    connections: ["information-theory"],
    layer: 2,
    parentId: "information-theory",
    importance: 2,
    activationFrequency: 0.7,
    connectionStrengths: { "information-theory": 2 }
  },
  {
    id: "emergence",
    title: "Emergence",
    domain: "Consciousness",
    position: [2, -8, 3],
    description: "The phenomenon where complex, novel properties and macro-scale patterns arise spontaneously from simple micro-interactions.",
    connections: ["consciousness", "evolution"],
    layer: 2,
    parentId: "consciousness",
    importance: 2,
    activationFrequency: 0.75,
    connectionStrengths: { "consciousness": 3, "evolution": 2 }
  },

  // ==========================================
  // LAYER 3: DEEP KNOWLEDGE LAYER (DEEP ORBITS)
  // ==========================================
  {
    id: "relativity",
    title: "General Relativity",
    domain: "Physics",
    position: [-10, 4.5, -3],
    description: "Einstein's elegant geometric theory of gravitation, modeling gravity as the physical warping of spacetime curvature.",
    connections: ["quantum-mechanics", "spacetime"],
    layer: 3,
    parentId: "entropy",
    importance: 3,
    activationFrequency: 0.45,
    connectionStrengths: { "quantum-mechanics": 3, "spacetime": 3 }
  },
  {
    id: "reinforcement-learning",
    title: "Reinforcement Learning",
    domain: "AI",
    position: [10, 4.5, 3],
    description: "Goal-oriented model training where agents learn optimal behavioral policies by maximizing cumulative scalar rewards.",
    connections: ["neural-networks"],
    layer: 3,
    parentId: "deep-learning",
    importance: 3,
    activationFrequency: 0.5,
    connectionStrengths: { "neural-networks": 3 }
  },
  {
    id: "neural-systems",
    title: "Neural Systems",
    domain: "Biology",
    position: [-10, -4.5, -1],
    description: "Biological networks of interconnected synapses, neurons, and sensory systems that govern cognition and actions.",
    connections: ["dna", "consciousness"],
    layer: 3,
    parentId: "evolution",
    importance: 3,
    activationFrequency: 0.4,
    connectionStrengths: { "dna": 2, "consciousness": 3 }
  },
  {
    id: "cosmology",
    title: "Cosmology",
    domain: "Space",
    position: [10, -4.5, 1],
    description: "The astrophysical study of the universe's origin, expansion, macro-structure, and eventual entropic heat death.",
    connections: ["spacetime", "black-holes"],
    layer: 3,
    parentId: "black-holes",
    importance: 3,
    activationFrequency: 0.5,
    connectionStrengths: { "spacetime": 2, "black-holes": 2 }
  },
  {
    id: "topology",
    title: "Topology & Manifolds",
    domain: "Mathematics",
    position: [2, 8, -5],
    description: "The structural study of shapes, boundaries, and spatial properties preserved entirely through continuous deformations.",
    connections: ["information-theory"],
    layer: 3,
    parentId: "probability",
    importance: 3,
    activationFrequency: 0.4,
    connectionStrengths: { "information-theory": 1 }
  },
  {
    id: "perception",
    title: "Perception & Qualia",
    domain: "Consciousness",
    position: [-2, -8, 4],
    description: "The neural and psychological filters through which external sensory inputs are reconstructed into subjective experiences.",
    connections: ["consciousness"],
    layer: 3,
    parentId: "emergence",
    importance: 3,
    activationFrequency: 0.4,
    connectionStrengths: { "consciousness": 2 }
  },

  // ==========================================
  // CROSS-LAYER SEMANTIC CONNECTORS
  // ==========================================
  {
    id: "time-arrows",
    title: "Arrow of Time",
    domain: "Physics",
    position: [-4, 0, 2],
    description: "The unidirectional, thermodynamic asymmetry of time, locking the past and expanding spatial entropic microstates.",
    connections: ["entropy", "spacetime"],
    layer: 3,
    parentId: "entropy",
    importance: 3,
    activationFrequency: 0.5,
    connectionStrengths: { "entropy": 3, "spacetime": 2 }
  },
  {
    id: "pattern-recognition",
    title: "Pattern Recognition",
    domain: "AI",
    position: [5, 0, -2],
    description: "The systematic mathematical detection and classification of repeated structural regularities within noisy datasets.",
    connections: ["deep-learning", "perception"],
    layer: 3,
    parentId: "deep-learning",
    importance: 3,
    activationFrequency: 0.5,
    connectionStrengths: { "deep-learning": 3, "perception": 2 }
  }
];

export const edges: MatrixEdge[] = [
  // Build and deduplicate semantic links from connections
  ...nodes.reduce((acc, node) => {
    node.connections.forEach(targetId => {
      // Find strength from node definition if available
      const strength = node.connectionStrengths?.[targetId] || 
                       nodes.find(n => n.id === targetId)?.connectionStrengths?.[node.id] || 1;
      
      const edge = { source: node.id, target: targetId, strength };
      const reverseExists = acc.find(
        e => (e.source === edge.source && e.target === edge.target) || 
             (e.source === edge.target && e.target === edge.source)
      );
      if (!reverseExists) {
        acc.push(edge);
      }
    });
    return acc;
  }, [] as MatrixEdge[])
];