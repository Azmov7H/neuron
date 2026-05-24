/**
 * Unified Adaptive Learning Service (Facade Pattern)
 */

import { KnowledgeEngineService } from '../knowledge/service';
import { MasteryEstimator } from './mastery/estimator';
import { CognitiveProfiler } from './profiling/profiler';
import { DifficultyGovernor, ExplanationDepth, SimulationParameters } from './difficulty/governor';
import { ProgressionAnalyzer } from './analytics/analyzer';
import { DynamicProgressionManager, ProgressionGuideline } from './progression/manager';
import {
  ConceptMastery,
  CognitiveProfile,
  LearningAnalytics,
  InteractionLog,
  SimulationActivity,
  SparkMessageLog
} from './types';

export class AdaptiveLearningService {
  private static instance: AdaptiveLearningService | null = null;

  // In-memory repositories for demonstration & fast response (can be backed by MongoDB)
  private masteryStore: Map<string, Map<string, ConceptMastery>> = new Map(); // userId -> conceptId -> mastery
  private profileStore: Map<string, CognitiveProfile> = new Map(); // userId -> profile
  private logsStore: Map<string, InteractionLog[]> = new Map(); // userId -> logs
  private simLogsStore: Map<string, SimulationActivity[]> = new Map(); // userId -> simLogs
  private sparkLogsStore: Map<string, SparkMessageLog[]> = new Map(); // userId -> sparkLogs

  private constructor() {}

  /**
   * Singleton accessor
   */
  public static getInstance(): AdaptiveLearningService {
    if (!this.instance) {
      this.instance = new AdaptiveLearningService();
    }
    return this.instance;
  }

  /**
   * Register a new user interaction and trigger incremental updates
   */
  public async registerInteraction(userId: string, log: InteractionLog): Promise<void> {
    // 1. Store interaction log
    if (!this.logsStore.has(userId)) {
      this.logsStore.set(userId, []);
    }
    this.logsStore.get(userId)!.push(log);

    // 2. Map conceptId to domain dynamically using KnowledgeEngineService
    const domainMapping: Record<string, string> = {};
    const knowledgeGraph = KnowledgeEngineService.getInstance().getGraph();
    const allConcepts = knowledgeGraph.getNodes();
    for (const c of allConcepts) {
      domainMapping[c.id] = c.domain;
    }

    // 3. Update specific concept mastery
    if (!this.masteryStore.has(userId)) {
      this.masteryStore.set(userId, new Map());
    }
    const userMasteries = this.masteryStore.get(userId)!;
    const currentMastery = userMasteries.get(log.conceptId) || null;

    const userSimLogs = this.simLogsStore.get(userId) || [];
    const userSparkLogs = this.sparkLogsStore.get(userId) || [];

    const updatedMastery = MasteryEstimator.estimateMastery(
      log.conceptId,
      currentMastery,
      [log],
      userSimLogs.filter((s) => s.simulationId === log.conceptId),
      userSparkLogs.filter((s) => s.conceptId === log.conceptId)
    );

    userMasteries.set(log.conceptId, updatedMastery);

    // 4. Update overall Cognitive Profile
    const currentProfile = this.profileStore.get(userId) || null;
    const allMasteries = Array.from(userMasteries.values());

    const updatedProfile = CognitiveProfiler.updateProfile(
      userId,
      currentProfile,
      this.logsStore.get(userId)!,
      userSimLogs,
      userSparkLogs,
      allMasteries,
      domainMapping
    );

    this.profileStore.set(userId, updatedProfile);
  }

  /**
   * Register a simulation action run
   */
  public async registerSimulationRun(userId: string, activity: SimulationActivity): Promise<void> {
    if (!this.simLogsStore.has(userId)) {
      this.simLogsStore.set(userId, []);
    }
    this.simLogsStore.get(userId)!.push(activity);

    // Also register as standard interaction
    const domain = KnowledgeEngineService.getInstance().getGraph().getNode(activity.simulationId)?.domain || 'Physics';
    await this.registerInteraction(userId, {
      type: 'simulation_run',
      conceptId: activity.simulationId,
      domain,
      xpEarned: activity.successRate >= 0.7 ? 150 : 50,
      timestamp: activity.timestamp,
      meta: { successRate: activity.successRate }
    });
  }

  /**
   * Register a Spark AI message
   */
  public async registerSparkMessage(userId: string, log: SparkMessageLog): Promise<void> {
    if (!this.sparkLogsStore.has(userId)) {
      this.sparkLogsStore.set(userId, []);
    }
    this.sparkLogsStore.get(userId)!.push(log);

    if (log.conceptId) {
      await this.registerInteraction(userId, {
        type: 'spark_chat',
        conceptId: log.conceptId,
        domain: log.domain,
        xpEarned: 25,
        timestamp: log.timestamp,
        meta: { askedClarification: log.askedClarification }
      });
    }
  }

  /**
   * Retrieves the cognitive profile of the user
   */
  public async getCognitiveProfile(userId: string): Promise<CognitiveProfile> {
    const profile = this.profileStore.get(userId);
    if (profile) return profile;

    // Default Profile
    return {
      userId,
      strengths: [],
      weaknesses: [],
      preferredDomains: [],
      learningStyle: 'visual',
      totalXP: 0,
      streak: 0,
      lastUpdated: Date.now()
    };
  }

  /**
   * Retrieves the concept mastery record for a user
   */
  public async getConceptMastery(userId: string, conceptId: string): Promise<ConceptMastery> {
    const userMasteries = this.masteryStore.get(userId);
    const mastery = userMasteries?.get(conceptId);
    if (mastery) return mastery;

    // Default empty mastery
    return {
      conceptId,
      familiarity: 0.0,
      masteryScore: 0.0,
      confusionProbability: 0.0,
      revisitPriority: 0.0,
      lastInteractionTimestamp: Date.now()
    };
  }

  /**
   * Retrieves the full list of concept masteries for a user
   */
  public async getAllMasteries(userId: string): Promise<ConceptMastery[]> {
    const userMasteries = this.masteryStore.get(userId);
    return userMasteries ? Array.from(userMasteries.values()) : [];
  }

  /**
   * Retrieves high-level study analytics for a user
   */
  public async getLearningAnalytics(userId: string): Promise<LearningAnalytics> {
    const logs = this.logsStore.get(userId) || [];
    const profile = await this.getCognitiveProfile(userId);
    return ProgressionAnalyzer.calculateAnalytics(logs, profile.streak);
  }

  /**
   * Retrieves dynamic progression/display settings for Knowledge Matrix
   */
  public async getMatrixGuidelines(userId: string): Promise<ProgressionGuideline> {
    const analytics = await this.getLearningAnalytics(userId);
    const masteries = await this.getAllMasteries(userId);
    return DynamicProgressionManager.getProgressionGuidelines(analytics, masteries);
  }

  /**
   * Resolves customized Spark AI explanation depth
   */
  public async getSparkExplanationDepth(userId: string, conceptId: string): Promise<ExplanationDepth> {
    const mastery = await this.getConceptMastery(userId, conceptId);
    return DifficultyGovernor.getExplanationDepth(mastery);
  }

  /**
   * Resolves dynamic simulation configurations to prevent cognitive overload
   */
  public async getSimulationParameters(userId: string, conceptId: string): Promise<SimulationParameters> {
    const mastery = await this.getConceptMastery(userId, conceptId);
    return DifficultyGovernor.getSimulationParameters(mastery);
  }
}
