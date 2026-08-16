/**
 * P3 Simulation Data Cleanup
 *
 * Audits SimulationRun records and produces a KEEP / ARCHIVE / DELETE /
 * REVIEW plan. DRY RUN BY DEFAULT — nothing is ever written unless the
 * operator explicitly passes --apply together with the destructive flag
 * matching the disposition:
 *
 *   --delete-synthetic   permit deletion of SYNTHETIC_TEST_DATA records
 *   --archive-invalid-ai report AI_MISMATCH records as archive candidates
 *                        (report-only; archive never writes to the DB)
 *
 * Safety rules (spec §9, §11, §12, §13):
 *   - Classification never uses timestamps, user age, or text quality as
 *     evidence; synthetic detection uses hard structural markers only.
 *   - REVIEW records are NEVER deleted by this script, in any mode.
 *   - Deletions additionally require an interactive confirmation prompt
 *     (or --yes for scripted operators).
 *   - ARCHIVE and REVIEW are report-only dispositions: the script performs
 *     no updates, moves, or field renames on those records.
 *
 * Usage:
 *   pnpm tsx scripts/simulation-data-cleanup.ts --dry-run            (default)
 *   pnpm tsx scripts/simulation-data-cleanup.ts --apply --delete-synthetic
 *   pnpm tsx scripts/simulation-data-cleanup.ts --mongo-uri=mongodb://... --db=neuron
 *   pnpm tsx scripts/simulation-data-cleanup.ts --report-out=/tmp/p3-plan.json
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import {
  buildCleanupPlan,
  snapshotClassificationTable,
  type AuditRunInput,
  type CleanupPlan,
} from '../src/lib/simulation/audit';

interface CliFlags {
  apply: boolean;
  deleteSynthetic: boolean;
  archiveInvalidAi: boolean;
  yes: boolean;
  verbose: boolean;
  mongoUri?: string;
  dbName?: string;
  reportOut?: string;
  limit?: number;
}

function parseArgs(argv: string[]): CliFlags {
  const flags: CliFlags = {
    apply: false,
    deleteSynthetic: false,
    archiveInvalidAi: false,
    yes: false,
    verbose: false,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') flags.apply = false;
    else if (arg === '--apply') flags.apply = true;
    else if (arg === '--delete-synthetic') flags.deleteSynthetic = true;
    else if (arg === '--archive-invalid-ai') flags.archiveInvalidAi = true;
    else if (arg === '--yes') flags.yes = true;
    else if (arg === '--verbose') flags.verbose = true;
    else if (arg.startsWith('--mongo-uri=')) flags.mongoUri = arg.slice('--mongo-uri='.length);
    else if (arg.startsWith('--db=')) flags.dbName = arg.slice('--db='.length);
    else if (arg.startsWith('--report-out=')) flags.reportOut = arg.slice('--report-out='.length);
    else if (arg.startsWith('--limit=')) flags.limit = Number(arg.slice('--limit='.length));
    else {
      console.error(`[P3] Unknown flag: ${arg}`);
      process.exit(2);
    }
  }
  return flags;
}

function toAuditInput(doc: Record<string, unknown>): AuditRunInput {
  const ai = doc.aiInterpretation as
    | {
        explanation?: string;
        keyInsights?: string[];
        concepts?: string[];
        recommendedActions?: string[];
        metadata?: Record<string, unknown>;
      }
    | undefined;
  return {
    id: String(doc._id),
    userId: String(doc.userId ?? ''),
    simulationId: String(doc.simulationId ?? ''),
    domain: doc.domain as string | undefined,
    parameters: (doc.parameters ?? {}) as Record<string, unknown>,
    stateSnapshot: (doc.stateSnapshot ?? {}) as Record<string, unknown>,
    ...(ai
      ? {
          aiInterpretation: {
            explanation: ai.explanation,
            keyInsights: ai.keyInsights ?? [],
            concepts: ai.concepts ?? [],
            recommendedActions: ai.recommendedActions ?? [],
            metadata: ai.metadata
              ? {
                  domain: ai.metadata.domain as string | undefined,
                  simulationType: ai.metadata.simulationType as string | undefined,
                  difficulty: ai.metadata.difficulty as string | undefined,
                  aiModel: ai.metadata.aiModel as string | undefined,
                  source: ai.metadata.source as 'ai' | 'deterministic' | undefined,
                  fallbackReason: ai.metadata.fallbackReason as string | undefined,
                }
              : undefined,
          },
        }
      : {}),
    timestamp:
      doc.timestamp instanceof Date
        ? doc.timestamp.toISOString()
        : String(doc.timestamp ?? ''),
  };
}

function askConfirmation(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'DELETE');
    });
  });
}

function printPlan(plan: CleanupPlan, flags: CliFlags): void {
  console.log('\n[P3] Cleanup plan (registry-audited, engine-verified)');
  console.log('─'.repeat(72));
  console.log(
    `KEEP=${plan.summary.KEEP}  ARCHIVE=${plan.summary.ARCHIVE}  DELETE=${plan.summary.DELETE}  REVIEW=${plan.summary.REVIEW}`
  );

  for (const disposition of ['KEEP', 'ARCHIVE', 'DELETE', 'REVIEW'] as const) {
    const entries = plan.entries.filter((e) => {
      if (e.disposition !== disposition) return false;
      if (disposition === 'ARCHIVE') {
        // AI_MISMATCH entries are shown as archive candidates only when the
        // operator requested --archive-invalid-ai (report-only).
        if (e.category === 'AI_MISMATCH' && !flags.archiveInvalidAi) return false;
      }
      return true;
    });
    if (entries.length === 0) continue;
    console.log(`\n${disposition} (${entries.length}):`);
    for (const e of entries) {
      const reason = flags.verbose
        ? `  — ${e.reasons.join('; ') || e.category}`
        : '';
      console.log(`  ${e.id} [${e.category}]${reason}`);
      if (e.category === 'SYNTHETIC_TEST_DATA' && flags.verbose) {
        for (const ev of e.syntheticEvidence) console.log(`      evidence: ${ev}`);
      }
    }
  }
}

async function main(): Promise<void> {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.apply && !flags.deleteSynthetic) {
    console.error(
      '[P3] ABORT: --apply without --delete-synthetic. Destructive operations require an explicit flag matching the disposition.'
    );
    process.exit(2);
  }

  const uri =
    flags.mongoUri ?? process.env.MONGODB_URI ?? 'mongodb://localhost:27017/neuron';
  const dbName = flags.dbName ?? process.env.MONGODB_DB_NAME ?? 'neuron';

  console.log(`[P3] Connecting to ${uri.split('@').pop()} (db: ${dbName}) …`);
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
  const collection = mongoose.connection.db!.collection('simulationruns');

  const query = {};
  const total = await collection.countDocuments(query);
  console.log(`[P3] SimulationRun documents found: ${total}`);

  const snapshotRows = snapshotClassificationTable();
  console.log(
    `[P3] Snapshot expectations: ${snapshotRows.length} registry sims audited ` +
      `(${snapshotRows.filter((r) => r.stateType === 'dynamic').length} dynamic, ` +
      `${snapshotRows.filter((r) => r.stateType === 'parameterized_visualization').length} parameterized, ` +
      `${snapshotRows.filter((r) => r.stateType === 'conceptual').length} conceptual)`
  );

  const docs = flags.limit
    ? await collection.find(query).limit(flags.limit).toArray()
    : await collection.find(query).toArray();

  const inputs: AuditRunInput[] = docs.map((d) => toAuditInput(d));
  const plan = buildCleanupPlan(inputs);

  printPlan(plan, flags);

  if (flags.reportOut) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode: flags.apply ? 'apply' : 'dry-run',
      flags,
      summary: plan.summary,
      entries: plan.entries,
      snapshotExpectations: snapshotRows,
    };
    writeFileSync(flags.reportOut, JSON.stringify(report, null, 2));
    console.log(`\n[P3] Report written to ${flags.reportOut}`);
  }

  const deleteEntries = plan.entries.filter((e) => e.disposition === 'DELETE');
  if (deleteEntries.length === 0) {
    console.log('\n[P3] Nothing to delete. No destructive operation performed.');
  }

  if (!flags.apply) {
    console.log('\n[P3] DRY RUN — no records were modified. Re-run with --apply --delete-synthetic to delete the synthetic records above.');
  } else if (flags.apply && deleteEntries.length > 0) {
    const ids = deleteEntries.map((e) => e.id);
    console.log(
      `\n[P3] APPLY requested: ${ids.length} synthetic record(s) will be deleted.`
    );
    const confirmed = flags.yes || (await askConfirmation('Type DELETE to confirm: '));
    if (!confirmed) {
      console.log('[P3] Confirmation declined — aborting without modifying the database.');
      await mongoose.disconnect();
      process.exit(0);
    }
    const result = await collection.deleteMany({ _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } });
    console.log(`[P3] Deleted ${result.deletedCount} record(s).`);
    console.log('[P3] KEEP/ARCHIVE/REVIEW records were not touched.');
  }

  await mongoose.disconnect();
  console.log('[P3] Done.');
}

main().catch(async (err) => {
  console.error('[P3] Fatal error:', err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});