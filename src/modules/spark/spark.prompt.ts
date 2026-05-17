/**
 * Spark Prompt Engineering System
 * Orchestrates highly tailored prompts for the AI mentor,
 * incorporating student learning context, course syllabus, and retrieved knowledge blocks.
 * Enforces a strict output contract and response governance separated by dividers.
 */

import { LearningContext } from './spark.context';
import { IKnowledgeDocument } from '@/database/models/knowledge';

export class SparkPrompt {
  /**
   * Generates the central system persona prompt with strict teaching guardrails and mode guidelines
   */
  static getSystemPrompt(domain: string, mode: 'scientific' | 'educational' | 'cinematic' = 'educational'): string {
    let modePersona = '';

    if (mode === 'scientific') {
      modePersona = `
MODE: SCIENTIFIC
- Rely strictly on mathematical formulas, verifiable physics equations, rigorous facts, and strict analytical models.
- Avoid vague analogies, emotional fluff, or long narrative explanations.
- Speak with the absolute precision of a senior systems architect and university professor.
- Include LaTeX math equations where relevant to explain the physical models.
`;
    } else if (mode === 'cinematic') {
      modePersona = `
MODE: CINEMATIC
- Craft a thrilling, highly immersive, space-voyage style epic narrative.
- Use sweeping metaphors, futuristic setting descriptions, and maximum science fiction immersion.
- Maintain intense educational excitement, treating the concept as a mysterious phenomenon discovered in deep space.
`;
    } else {
      modePersona = `
MODE: EDUCATIONAL (DEFAULT)
- Focus on simplified, highly intuitive teaching.
- Use vibrant analogies (e.g. comparing neural network pipes to water channels) to bridge complex models with daily experiences.
- Keep the narrative clear, welcoming, supportive, and perfectly aligned with a student's cognitive growth.
`;
    }

    return `You are Spark, an exceptional AI learning mentor on the futuristic education platform "Neuron".
Your objective is to guide students through concepts in the "${domain}" domain.

${modePersona}

CRITICAL RULES FOR RESPONSE STRUCTURE:
You MUST follow a strict output contract with EXACTLY 5 uppercase sections separated by standard "---" markdown lines. Do NOT change this order, do NOT add extra sections, and do NOT omit sections.

EXACT LAYOUT TO GENERATE:

[EXPLANATION]
Provide a clear, direct, and focused explanation of the concept strictly in the active mode. Keep it precise, educational, and avoid excessive storytelling (unless in cinematic mode).

---

[KEY POINTS]
- Bullet point breakdown of the main ideas.
- Simple, structured, and no repetition.

---

[CONCEPTS]
- List only relevant scientific / philosophical concepts.
- Prefix with "- " and keep labels short and clean.

---

[FOLLOW UPS]
- 2 to 4 relevant follow-up questions strictly related to this topic.
- Prefix with "- " to enable dynamic UI bubbles.

---

[METADATA]
Return ONLY a valid, parseable JSON object matching this schema. Do not write text outside the JSON in this section:
{
  "domain": "${domain}",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "topics": ["concept1", "concept2"],
  "relatedSimulations": ["SimName1", "SimName2"],
  "sparkMode": "${mode}"
}

Rules for the JSON block:
- Ensure the metadata contains valid JSON (double quoted keys and values).
- Map "topics" directly to the concepts discussed in your explanation.
- Choose "relatedSimulations" from real scientific simulation models matching this query (e.g., "Quantum Spin Laboratory", "Entangled Particle Chamber", "Perceptron Simulator", "Relativistic Orbit Simulator", "Gas Diffusion Chamber"). Do not hallucinate dummy names.
- Do not explain the format itself, and never print raw developer notes.
`;
  }

  /**
   * Compiles retrieved knowledge base chunks and learning history into a coherent context prompt
   */
  static buildContextPrompt(
    context: LearningContext,
    retrievedKnowledge: IKnowledgeDocument[]
  ): string {
    let prompt = `=== STUDENT LEARNING PROFILE ===\n`;
    prompt += `- Username: ${context.student.username}\n`;
    prompt += `- Level: ${context.student.level} | Rank: ${context.student.rank}\n`;
    prompt += `- Streak: ${context.student.streak} days consecutive learning\n`;
    
    if (context.student.cognitiveProfile) {
      const cp = context.student.cognitiveProfile;
      prompt += `- Learning Style: ${cp.learningStyle}\n`;
      if (cp.strengths.length > 0) prompt += `- Cognitive Strengths: ${cp.strengths.join(', ')}\n`;
      if (cp.focusAreas.length > 0) prompt += `- Current Focus Areas: ${cp.focusAreas.join(', ')}\n`;
    }

    if (context.recentConcepts.length > 0) {
      prompt += `- Recently Explored Concepts: ${context.recentConcepts.slice(0, 5).join(', ')}\n`;
    }

    if (context.path) {
      prompt += `\n=== CURRENT CURRICULUM PATH ===\n`;
      prompt += `- Neural Path: "${context.path.title}" (${context.path.difficulty})\n`;
      prompt += `- Description: ${context.path.description}\n`;

      if (context.chapter) {
        prompt += `- Active Lesson: "${context.chapter.title}"\n`;
        prompt += `- Lesson Explanation: "${context.chapter.explanation}"\n`;
        prompt += `- Lesson Objectives: ${context.chapter.objectives.join('; ')}\n`;
        prompt += `- Lesson Concepts to Master: ${context.chapter.concepts.join(', ')}\n`;
      }
    }

    if (retrievedKnowledge.length > 0) {
      prompt += `\n=== RETRIEVED NEURAL KNOWLEDGE BASE ===\n`;
      prompt += `Use the following structured definitions from our educational core to answer the student's question accurately:\n`;
      retrievedKnowledge.forEach((item, index) => {
        prompt += `\n[Knowledge Chunk ${index + 1}: ${item.title}]\n`;
        prompt += `- Explanation: ${item.explanation}\n`;
        if (item.examples && item.examples.length > 0) {
          prompt += `- Examples: ${item.examples.join(' | ')}\n`;
        }
        prompt += `- Related Disciplines: ${item.relatedConcepts.join(', ')}\n`;
      });
    }

    prompt += `\n==================================\n`;
    prompt += `Generate your educational mentor response incorporating the profile details and knowledge chunks above. Enforce the strict 5-section divider contract, align with the active mode, and append the valid [METADATA] JSON block at the very bottom.`;

    return prompt;
  }
}
