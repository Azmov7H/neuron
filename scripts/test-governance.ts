/**
 * Standalone Integration Test: Spark Response Governance & Strict Formatting System
 * Verifies strict sections, divider conforms, auto-mode switches (scientific vs educational),
 * and dynamic bullet-point parsing for dynamic frontend bubble elements.
 */

import 'dotenv/config';
import { connectDB, disconnectDB } from '../src/database/connection';
import { User } from '../src/database/models/user';
import { SparkSession } from '../src/database/models/spark-session';
import { SparkService } from '../src/modules/spark/spark.service';
import { SparkResponseFormatter } from '../src/modules/spark/spark.responseFormatter';

async function runGovernanceTest() {
  console.log('[Governance Test] Starting Response Control & Formatting Validation...');
  await connectDB();

  try {
    // 1. Setup mock user
    let user = await User.findOne({});
    if (!user) {
      user = await User.create({
        username: 'spark_governed_student',
        email: 'governed_student@example.com',
        password: 'MockSecurePassword123'
      });
    }
    const userId = user._id.toString();

    // 2. Establish Spark Session
    const session = await SparkService.createSession(userId, 'science');
    const sessionId = session._id.toString();
    console.log(`[Governance Test] Spark Session established: ${sessionId}`);

    // 3. Test Case A: Scientific Mode Auto-Detection & Conformity
    const scientificQuery = 'Give me a scientific explanation of time dilation and its physics equation';
    console.log(`\n[Governance Test] Test Case A: sending query -> "${scientificQuery}"`);
    
    // Auto-detect check
    const modeA = SparkService.detectResponseMode(scientificQuery);
    console.log(`[Governance Test] Auto-Detected Mode: ${modeA}`);
    if (modeA !== 'scientific') {
      throw new Error('Scientific mode auto-detection failed!');
    }
    console.log('[Governance Test] ✓ Scientific mode auto-detection verified');

    // Fallback generation check
    const fallbackTextA = await SparkService.generateLocalFallback(sessionId, userId, scientificQuery);
    
    console.log('\n======================================');
    console.log('--- TEST CASE A: SCIENTIFIC FALLBACK ---');
    console.log('======================================');
    console.log(fallbackTextA);
    console.log('======================================\n');

    // Confirm section blocks and divider formatting rules
    console.log('[Governance Test] Verifying divider and block structure rules...');
    const sectionsA = fallbackTextA.split('---');
    if (sectionsA.length !== 5) {
      throw new Error(`Expected exactly 5 sections separated by "---", got: ${sectionsA.length}`);
    }
    console.log('[Governance Test] ✓ Exactly 5 sections separated by "---" verified');

    if (!fallbackTextA.includes('[EXPLANATION]') ||
        !fallbackTextA.includes('[KEY POINTS]') ||
        !fallbackTextA.includes('[CONCEPTS]') ||
        !fallbackTextA.includes('[FOLLOW UPS]') ||
        !fallbackTextA.includes('[METADATA]')) {
      throw new Error('One of the mandatory uppercase blocks is missing!');
    }
    console.log('[Governance Test] ✓ All 5 mandatory uppercase section tags verified');

    // Confirm scientific precision inside explanation (LaTeX formula)
    if (!fallbackTextA.includes('Lorentz factor') || !fallbackTextA.includes(' Schwarzschild')) {
      throw new Error('Scientific explanation has poor precision or missing physics formulas!');
    }
    console.log('[Governance Test] ✓ Scientific formula presence verified');

    // 4. Test Case B: Dynamic Bullet-Point & Concept Parsing
    console.log('[Governance Test] Test Case B: Executing bullet point parsing and DB save...');
    const result = await SparkService.saveAssistantResponse(sessionId, userId, fallbackTextA);

    console.log('\n======================================');
    console.log('--- PARSED AND PROCESSED RESULTS ---');
    console.log('======================================');
    console.log('Clean Text Length:', result.cleanResponse.length);
    console.log('Parsed Concepts List:', result.concepts);
    console.log('Parsed Simulations List:', result.simulations);
    console.log('Parsed Follow-up Bubbles:', result.followUps);
    console.log('Added XP:', result.addedXp);
    console.log('======================================\n');

    // Assert bullet points parsing accuracy
    if (result.followUps.length < 2 || result.followUps[0].startsWith('-') || result.followUps[0].startsWith('1.')) {
      throw new Error('Follow-ups were not cleanly parsed from Markdown bullets!');
    }
    console.log('[Governance Test] ✓ Bullet-point follow-ups successfully stripped and parsed');

    if (result.concepts.length === 0 || result.concepts[0].title !== 'Time Dilation') {
      throw new Error('Concepts were not cleanly parsed from the [CONCEPTS] section!');
    }
    console.log('[Governance Test] ✓ Concepts successfully stripped and parsed from Markdown');

    console.log('\n🎉 [Governance Test] Spark Response Governance Integration Test: SUCCESS!');

  } catch (error: any) {
    console.error('\n❌ [Governance Test] Test failed:', error.message || error);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('[Governance Test] Disconnected from database');
    process.exit(0);
  }
}

runGovernanceTest();
