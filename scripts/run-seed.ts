/**
 * Development script to run seeding locally
 */

import 'dotenv/config';
import { seedDatabase } from '../src/database/seed';
import { disconnectDB } from '../src/database/connection';

async function main() {
  console.log('[Script] Triggering database seeding...');
  try {
    await seedDatabase();
    console.log('[Script] ✓ Seeding completed successfully');
  } catch (error) {
    console.error('[Script] ✗ Seeding failed:', error);
  } finally {
    await disconnectDB();
    console.log('[Script] Disconnected from database');
    process.exit(0);
  }
}

main();
