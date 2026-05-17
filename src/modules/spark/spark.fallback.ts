/**
 * Spark Fallback Cognitive Engine
 * Serves as the Tertiary Layer of the Hybrid Cognitive System.
 * Operates entirely offline using prebuilt rule-based reasoning templates,
 * local concept graph traversal, and MongoDB-seeded knowledge base fallbacks.
 * Fully aligned with strict non-storytelling direct facts, zero inline LaTeX, and no system messages.
 */

import { SparkResponseFormatter, SparkMetadata } from './spark.responseFormatter';
import { IKnowledgeDocument } from '@/database/models/knowledge';

interface GraphNode {
  title: string;
  domain: string;
  adjacent: string[];
  simulations: string[];
  scientificExplanation: string;
  educationalExplanation: string;
  mechanism: string[];
}

const CONCEPT_GRAPH: Record<string, GraphNode> = {
  'quantum entanglement': {
    title: 'Quantum Entanglement',
    domain: 'science',
    adjacent: ['Superposition', 'Quantum Tunneling', 'Spacetime Curvature'],
    simulations: ['Quantum Spin Laboratory', 'Entangled Particle Chamber'],
    scientificExplanation: 'Quantum entanglement is a physical phenomenon where two or more particles share a joint state. Measuring a property of one particle instantly collapses the state of the other particle. The state is represented as a non-separable wave function:\n\nPsi = (1/sqrt(2)) * (|01> - |10>)\n\nThis behavior has been verified experimentally across cosmic distances.',
    educationalExplanation: 'Quantum entanglement is a fundamental physics phenomenon that occurs when two subatomic particles become deeply connected. When they are entangled, measuring the physical state of one particle instantly dictates the state of the other particle, regardless of the physical distance between them.',
    mechanism: [
      'Unified wave function generation',
      'Instantaneous quantum state collapse',
      'Absolute non-local correlation'
    ]
  },
  'neural networks': {
    title: 'Neural Networks',
    domain: 'technology',
    adjacent: ['Machine Learning', 'Deep Learning', 'Perceptrons', 'Backpropagation'],
    simulations: ['Perceptron Simulator', 'Neural Network Visualizer'],
    scientificExplanation: 'An artificial neural network computes a non-linear mapping by passing signals through successive layers of nodes. Weights and biases are optimized by minimizing a cost function via gradient descent:\n\ny = sigma(W * x + b)\n\nError correction uses the chain rule to backpropagate loss values.',
    educationalExplanation: 'An artificial neural network is a computational model inspired by the biological structure of brains. It consists of layers of interconnected nodes that process inputs. By adjusting connection weights based on trial and error, the system learns to recognize complex patterns.',
    mechanism: [
      'Feedforward layered processing',
      'Activation function threshold firing',
      'Backpropagation weight correction'
    ]
  },
  'time dilation': {
    title: 'Time Dilation',
    domain: 'science',
    adjacent: ['Spacetime Curvature', 'Gravity', 'Special Relativity', 'General Relativity'],
    simulations: ['Relativistic Orbit Simulator', 'Spacetime Gravitational Well'],
    scientificExplanation: 'Time dilation is a relativistic difference in the elapsed time measured by two clocks. In special relativity, the velocity dilation is governed by the Lorentz factor:\n\nt\' = t / sqrt(1 - v^2/c^2)\n\nIn general relativity, gravitational time dilation near a massive object is governed by the Schwarzschild metric:\n\nt\' = t * sqrt(1 - 2GM/rc^2)',
    educationalExplanation: 'Time dilation is a difference in the passage of time. According to Einstein, time is not absolute. The faster you move through space, the slower you move through time relative to a stationary observer. Massive objects also warp spacetime, slowing down clocks ticking nearby.',
    mechanism: [
      'Absolute constancy of light velocity',
      'Relative spacetime coordinate stretching',
      'Gravitational well curvature influence'
    ]
  },
  'entropy': {
    title: 'Entropy',
    domain: 'science',
    adjacent: ['Thermodynamics', 'Information Theory', 'Chaos Theory', 'Emergence'],
    simulations: ['Gas Diffusion Chamber', 'Thermodynamics Sandbox'],
    scientificExplanation: 'In statistical mechanics, entropy is defined by Boltzmann\'s equation which represents the logarithmic probability of a system\'s microstate configurations:\n\nS = k_B * ln(Omega)\n\nIn thermodynamics, entropy change is measured by reversible heat transfer divided by temperature:\n\ndS = dQ_rev / T',
    educationalExplanation: 'Entropy is a measure of randomness, disorder, or uncertainty in a system. According to the laws of physics, closed systems naturally progress from neat, orderly states into states of high disorder over time.',
    mechanism: [
      'Microstate probability equilibrium shifting',
      'Spontaneous energy dispersion',
      'Irreversible thermodynamic progression'
    ]
  },
  'philosophy of mind': {
    title: 'Philosophy of Mind',
    domain: 'philosophy',
    adjacent: ['Consciousness', 'Cognitive Science', 'Dualism', 'Physicalism'],
    simulations: ['Turing Test Sandbox', 'Synaptic Fire Map'],
    scientificExplanation: 'Philosophy of mind evaluates the relationship between physical brain processes and subjective experience. It investigates the mind-body problem, comparing physicalist models to substance dualism and emergent functionalism.',
    educationalExplanation: 'Philosophy of mind is the study of the nature of the mind and its relationship to the physical brain. It tackles the mind-body problem: how a physical organ made of biological tissue can give rise to self-awareness and immaterial mental experiences.',
    mechanism: [
      'Immaterial Mind-Body correlation problem',
      'Qualia subjective experience definitions',
      'Physicalism versus Dualism debates'
    ]
  },
  'emergence': {
    title: 'Emergence',
    domain: 'science',
    adjacent: ['Chaos Theory', 'Entropy', 'Systems Dynamics', 'Self-Organization'],
    simulations: ['Boids Swarm Simulation', 'Conways Game of Life Sandbox'],
    scientificExplanation: 'Emergence is modeled by complex systems dynamics where microscopic local interactions scale up to produce macroscopic self-organization. The collective state change is represented as:\n\ndX_t = f(X_t)dt + g(X_t)dW_t\n\nThe macro-state properties cannot be determined from isolated constituents.',
    educationalExplanation: 'Emergence occurs when a complex system exhibits properties or behaviors that its individual parts do not have on their own. In complex environments, simple interactions between individual components can lead to complex global patterns.',
    mechanism: [
      'Simple agents executing local rules',
      'Non-linear collective feedback scaling',
      'Novel macroscopic global pattern emergence'
    ]
  }
};

export class SparkFallback {
  /**
   * Traverse the concept graph to find related nodes
   */
  static getAdjacentConcepts(conceptName: string): string[] {
    const key = conceptName.toLowerCase().trim();
    if (CONCEPT_GRAPH[key]) {
      return CONCEPT_GRAPH[key].adjacent;
    }
    for (const [k, node] of Object.entries(CONCEPT_GRAPH)) {
      if (key.includes(k) || k.includes(key)) {
        return node.adjacent;
      }
    }
    return ['Emergence', 'Chaos Theory', 'Systems Dynamics'];
  }

  /**
   * Generates a fully structured fallback explanation following the strict section contract
   */
  static generateExplanation(
    userMessage: string,
    domain: string,
    mode: 'scientific' | 'educational' | 'cinematic' = 'educational',
    retrievedKnowledge?: IKnowledgeDocument[]
  ): string {
    const query = userMessage.toLowerCase().trim();
    
    // Check if we have a direct match in our rule-based concept graph
    let matchedNode: GraphNode | null = null;
    for (const [key, node] of Object.entries(CONCEPT_GRAPH)) {
      if (query.includes(key) || key.includes(query)) {
        matchedNode = node;
        break;
      }
    }

    let explanationMarkdown = '';
    let metadata: SparkMetadata = {
      domain,
      difficulty: 'intermediate',
      topics: [],
      relatedSimulations: [],
      sparkMode: mode === 'scientific' ? 'scientific' : 'educational'
    };

    if (matchedNode) {
      // Choose explanation string based on mode, ensuring no system messages or cinematic elements
      const mainExplanation = mode === 'scientific' 
        ? matchedNode.scientificExplanation 
        : matchedNode.educationalExplanation;

      explanationMarkdown = `[EXPLANATION]
${mainExplanation}

---

[KEY POINTS]
${matchedNode.mechanism.map(step => `- ${step}`).join('\n')}

---

[CONCEPTS]
- ${matchedNode.title}
${matchedNode.adjacent.map(c => `- ${c}`).join('\n')}

---

[FOLLOW UPS]
- Can you explain how this relates to ${matchedNode.adjacent[0]}?
- What happens if we alter the parameters in the ${matchedNode.simulations[0]}?
- Show me the equations that describe ${matchedNode.title}.`;

      metadata = {
        domain: matchedNode.domain,
        difficulty: 'advanced',
        topics: [matchedNode.title, ...matchedNode.adjacent.slice(0, 2)],
        relatedSimulations: matchedNode.simulations,
        sparkMode: mode === 'scientific' ? 'scientific' : 'educational'
      };
    } else if (retrievedKnowledge && retrievedKnowledge.length > 0) {
      // Dynamic fallback using retrieved knowledge database chunk
      const primaryChunk = retrievedKnowledge[0];
      const adjacentList = primaryChunk.relatedConcepts || ['Emergence', 'Entropy'];
      const simulationsList = primaryChunk.relatedSimulations || ['Boids Swarm Simulation'];

      explanationMarkdown = `[EXPLANATION]
I have retrieved details on ${primaryChunk.title} from the local educational core.

${primaryChunk.explanation}

Here is how this concept manifests in practice:
${primaryChunk.examples.map(ex => `- ${ex}`).join('\n')}

---

[KEY POINTS]
- Fundamental principles of ${primaryChunk.title}.
- Practical manifest models across active study domains.

---

[CONCEPTS]
- ${primaryChunk.title}
${adjacentList.map(c => `- ${c}`).join('\n')}

---

[FOLLOW UPS]
- Can you show me a detailed breakdown of ${primaryChunk.title}?
- How does ${primaryChunk.title} connect to ${adjacentList[0]}?
- What is a beginner-friendly simulation I can run right now?`;

      metadata = {
        domain: primaryChunk.domain,
        difficulty: primaryChunk.difficulty || 'intermediate',
        topics: [primaryChunk.title, ...adjacentList.slice(0, 2)],
        relatedSimulations: simulationsList,
        sparkMode: mode === 'scientific' ? 'scientific' : 'educational'
      };
    } else {
      // General Backup Navigation fallback
      explanationMarkdown = `[EXPLANATION]
When studying ${domain}, we are investigating complex networks of cause, effect, and cooperation. To help you master this, we should explore through the lens of Emergence—where simple individual components cooperate to generate macroscopic behaviors greater than the sum of their parts.

---

[KEY POINTS]
- Complex networks and dynamic systems are governed by clear physical and mathematical constraints.
- Microscopic cooperation scales up to build complex macro patterns.

---

[CONCEPTS]
- Emergence
- Self-Organization
- Systems Dynamics

---

[FOLLOW UPS]
- Can you explain the principles of Emergence?
- What are some simple rules that create complex patterns?
- Show me a list of active simulations in the ${domain} section.`;

      metadata = {
        domain,
        difficulty: 'beginner',
        topics: ['Emergence', 'Self-Organization'],
        relatedSimulations: ['Boids Swarm Simulation', 'Conways Game of Life Sandbox'],
        sparkMode: mode === 'scientific' ? 'scientific' : 'educational'
      };
    }

    return SparkResponseFormatter.formatResponse(explanationMarkdown, metadata);
  }
}
