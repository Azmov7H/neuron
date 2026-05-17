/**
 * Standalone Integration Test: Spark Fallback Cognitive Engine
 * Verifies Tertiary Fallback explanations, metadata parsing, XP rewards, and Discovery logging.
 */

import 'dotenv/config';
import { connectDB, disconnectDB } from '../src/database/connection';
import { User } from '../src/database/models/user';
import { SparkSession } from '../src/database/models/spark-session';
import { Discovery } from '../src/database/models/discovery';
import { SparkService } from '../src/modules/spark/spark.service';
import { SparkResponseFormatter } from '../src/modules/spark/spark.responseFormatter';
import { SparkFallback } from '../src/modules/spark/spark.fallback';

async function runTest() {
  console.log('[Test] Initiating Spark Fallback System Integration Test...');
  await connectDB();

  try {
    // 1. Fetch or create a test user
    let user = await User.findOne({});
    if (!user) {
      console.log('[Test] Creating a mock student profile...');
      user = await User.create({
        username: 'spark_test_student',
        email: 'student_test@example.com',
        password: 'MockSecurePassword123'
      });
    }
    const userId = user._id.toString();
    console.log(`[Test] Student Profile Loaded: @${user.username} (Level ${user.domains?.[0]?.level || 0}, XP: ${user.totalXP})`);

    // 2. Create Spark Session
    console.log('[Test] Creating new Spark AI conversation session...');
    const session = await SparkService.createSession(userId, 'science');
    const sessionId = session._id.toString();
    console.log(`[Test] Spark Session established: ${sessionId}`);

    // 3. Trigger Fallback Generator (Simulated AI failure)
    const testQuery = 'Explain quantum entanglement to a beginner';
    console.log(`[Test] Sending query: "${testQuery}" (Triggering Fallback Cognitive Engine...)`);
    
    const fallbackText = await SparkService.generateLocalFallback(sessionId, userId, testQuery);

    console.log('\n======================================');
    console.log('--- STREAM FALLBACK EXPLANATION OUTPUT ---');
    console.log('======================================');
    console.log(fallbackText);
    console.log('======================================\n');

    // 4. Verify Output Structures
    console.log('[Test] Verifying explanation structural integrity...');
    if (!fallbackText.includes('[Educational Stream Recalibrated]')) {
      throw new Error('Fallback warning indicator missing!');
    }
    if (!fallbackText.includes('### Deep Dive: Quantum Entanglement')) {
      throw new Error('Concept explanation layer missing!');
    }
    if (!fallbackText.includes('[METADATA]')) {
      throw new Error('JSON Metadata envelope tag missing!');
    }
    console.log('[Test] ✓ Structured Explanation Layer validated');

    // 5. Post-process Fallback response (Parse metadata, log Discoveries, and award XP)
    console.log('[Test] Executing background post-processing services...');
    const result = await SparkService.saveAssistantResponse(sessionId, userId, fallbackText);

    console.log('\n======================================');
    console.log('--- PARSED AND PROCESSED RESULTS ---');
    console.log('======================================');
    console.log('Clean Content Length:', result.cleanResponse.length);
    console.log('Concepts Discussed:', result.concepts);
    console.log('Related Simulations:', result.simulations);
    console.log('Follow-ups Suggestions:', result.followUps);
    console.log('Added XP:', result.addedXp);
    console.log('Is Rank Up:', result.isRankUp);
    console.log('======================================\n');

    // 6. Assert assertions
    if (result.addedXp !== 15) {
      throw new Error(`Expected exactly 15 XP reward, got: ${result.addedXp}`);
    }
    console.log('[Test] ✓ Evolution XP addition validated');

    if (result.simulations.length === 0 || !result.simulations.includes('Entangled Particle Chamber')) {
      throw new Error('Simulation relationships are missing or invalid!');
    }
    console.log('[Test] ✓ Simulation relationships validated');

    // 7. Verify Discovery logs
    console.log('[Test] Verifying Discovery logs in the database Explore System...');
    const discoveries = await Discovery.find({ userId });
    console.log(`[Test] Total discoveries logged for user: ${discoveries.length}`);
    
    const entanglementLogged = discoveries.some(d => d.concept.toLowerCase() === 'quantum entanglement');
    if (!entanglementLogged) {
      throw new Error('Quantum Entanglement concept was not registered in user discoveries!');
    }
    console.log('[Test] ✓ Discovery logs successfully validated');

    console.log('\n🎉 [Test] Spark Hybrid Fallback System Integration Test: SUCCESS!');

  } catch (error: any) {
    console.error('\n❌ [Test] Test failed:', error.message || error);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('[Test] Disconnected from database');
    process.exit(0);
  }
}

runTest();
