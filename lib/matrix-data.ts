// lib/matrix-data.ts
export interface MatrixNode {
  id: string;
  title: string;
  domain: "Physics" | "AI" | "Biology" | "Space" | "Mathematics" | "Consciousness";
  position: [number, number, number];
  description: string;
  connections: string[];
}

export interface MatrixEdge {
  source: string;
  target: string;
}

export const domainColors: Record<MatrixNode["domain"], string> = {
  Physics: "#3b82f6",
  AI: "#8b5cf6",
  Biology: "#10b981",
  Space: "#06b6d4",
  Mathematics: "#f43f5e",
  Consciousness: "#f59e0b",
};

export const nodes: MatrixNode[] = [
  // Physics Cluster (Top Left)
  { id: "quantum-mechanics", title: "Quantum Mechanics", domain: "Physics", position: [-8, 4, -2], description: "The fundamental theory describing nature at the atomic and subatomic levels.", connections: ["information-theory", "consciousness", "entropy"] },
  { id: "entropy", title: "Entropy", domain: "Physics", position: [-6, 5, 0], description: "The measure of disorder or randomness in a closed system.", connections: ["quantum-mechanics", "time-arrows"] },
  { id: "relativity", title: "Relativity", domain: "Physics", position: [-9, 3, -4], description: "Einstein's theory describing gravity as the curvature of spacetime.", connections: ["quantum-mechanics", "black-holes"] },
  
  // AI Cluster (Top Right)
  { id: "neural-networks", title: "Neural Networks", domain: "AI", position: [7, 5, 1], description: "Computing systems inspired by biological neural networks.", connections: ["deep-learning", "consciousness", "information-theory"] },
  { id: "deep-learning", title: "Deep Learning", domain: "AI", position: [9, 4, -1], description: "Subset of ML based on artificial neural networks with multiple layers.", connections: ["neural-networks", "pattern-recognition"] },
  { id: "reinforcement-learning", title: "Reinforcement Learning", domain: "AI", position: [8, 6, -3], description: "Training models by rewarding desired behaviors.", connections: ["neural-networks", "evolution"] },
  
  // Biology Cluster (Bottom Left)
  { id: "dna", title: "DNA", domain: "Biology", position: [-7, -4, 3], description: "The molecule carrying genetic instructions for development.", connections: ["evolution", "information-theory"] },
  { id: "evolution", title: "Evolution", domain: "Biology", position: [-5, -5, 1], description: "Change in heritable characteristics of biological populations over time.", connections: ["dna", "reinforcement-learning", "entropy"] },
  { id: "neural-systems", title: "Neural Systems", domain: "Biology", position: [-8, -3, -1], description: "The network of neural cells in the brain and body.", connections: ["neural-networks", "consciousness"] },
  
  // Space Cluster (Bottom Right)
  { id: "black-holes", title: "Black Holes", domain: "Space", position: [6, -5, 2], description: "Regions of spacetime where gravity is so strong nothing can escape.", connections: ["relativity", "entropy", "spacetime"] },
  { id: "spacetime", title: "Spacetime", domain: "Space", position: [8, -4, 0], description: "The mathematical model that fuses the three dimensions of space and the one dimension of time.", connections: ["black-holes", "quantum-mechanics"] },
  { id: "cosmology", title: "Cosmology", domain: "Space", position: [7, -6, -2], description: "The study of the universe's origin, evolution, and eventual fate.", connections: ["spacetime", "entropy"] },

  // Mathematics Cluster (Center Top)
  { id: "information-theory", title: "Information Theory", domain: "Mathematics", position: [0, 8, -3], description: "The mathematical study of the quantification, storage, and communication of information.", connections: ["quantum-mechanics", "neural-networks", "dna", "entropy"] },
  { id: "topology", title: "Topology", domain: "Mathematics", position: [2, 7, -5], description: "The mathematical study of the properties preserved through deformations.", connections: ["spacetime", "neural-networks"] },
  { id: "probability", title: "Probability", domain: "Mathematics", position: [-2, 7, -4], description: "The measure of the likelihood that an event will occur.", connections: ["quantum-mechanics", "reinforcement-learning"] },

  // Consciousness Cluster (Center Bottom)
  { id: "consciousness", title: "Consciousness", domain: "Consciousness", position: [0, -7, 4], description: "The state of being awake and aware of one's surroundings.", connections: ["neural-systems", "quantum-mechanics", "neural-networks"] },
  { id: "emergence", title: "Emergence", domain: "Consciousness", position: [2, -8, 2], description: "Complex patterns arising from simple interactions.", connections: ["consciousness", "neural-networks", "evolution"] },
  { id: "perception", title: "Perception", domain: "Consciousness", position: [-2, -8, 3], description: "The organization, identification, and interpretation of sensory information.", connections: ["consciousness", "neural-systems"] },
  
  // Connectors
  { id: "time-arrows", title: "Arrow of Time", domain: "Physics", position: [-4, 2, 2], description: "The concept of time having a direction, moving from past to future.", connections: ["entropy", "spacetime"] },
  { id: "pattern-recognition", title: "Pattern Recognition", domain: "AI", position: [5, 2, -2], description: "The automated recognition of patterns and regularities in data.", connections: ["deep-learning", "perception"] }
];

export const edges: MatrixEdge[] = [
  // Generate edges from connections
  ...nodes.reduce((acc, node) => {
    node.connections.forEach(targetId => {
      const edge = { source: node.id, target: targetId };
      const reverseEdge = { source: targetId, target: node.id };
      if (!acc.find(e => (e.source === edge.source && e.target === edge.target) || (e.source === reverseEdge.source && e.target === reverseEdge.target))) {
        acc.push(edge);
      }
    });
    return acc;
  }, [] as MatrixEdge[])
];