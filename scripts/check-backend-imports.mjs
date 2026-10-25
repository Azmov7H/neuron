#!/usr/bin/env node
/**
 * Guards the frontend/backend import boundary.
 *
 * Frontend code must not import backend modules, backend-only libraries, or server-only
 * configuration. The legacy route handlers under `app/api` are excluded because they are backend
 * code that still lives in this repository until T21.
 *
 * Existing coupling at T01 is recorded in `scripts/backend-import-baseline.json`. The check fails
 * on any *new* violation and warns about baseline entries that are no longer needed. Once T16
 * lands, the baseline becomes empty and this check becomes blocking.
 *
 * Usage:
 *   node scripts/check-backend-imports.mjs
 *   node scripts/check-backend-imports.mjs --update
 *   node scripts/check-backend-imports.mjs --strict   # stale baseline entries also fail
 *   node scripts/check-backend-imports.mjs --json
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const BASELINE_PATH = resolve(SCRIPT_DIR, 'backend-import-baseline.json');

const SCAN_ROOTS = [
  'app',
  'components',
  'hooks',
  'lib',
  'src/lib/api',
  'src/lib/simulation',
  'src/types',
  'middleware.ts',
];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);
const EXCLUDED_PATHS = ['app/api'];

const BACKEND_MODULE_PREFIXES = [
  '@/cache',
  '@/config/env',
  '@/core',
  '@/database',
  '@/lib/ai',
  '@/lib/auth',
  '@/lib/logger',
  '@/lib/monitoring',
  '@/lib/redis',
  '@/lib/security',
  '@/lib/utils/response',
  '@/middleware/auth',
  '@/modules',
  '@/validations',
];

const BACKEND_PACKAGES = new Set([
  'bcrypt',
  'bcryptjs',
  'jsonwebtoken',
  'mongoose',
  'next-auth',
  'openai',
  'redis',
]);

const IMPORT_PATTERNS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function parseArgs(argv) {
  const options = { update: false, strict: false, json: false };
  for (const arg of argv) {
    if (arg === '--update') options.update = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/check-backend-imports.mjs [--update] [--strict] [--json]',
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return options;
}

function toPosix(value) {
  return value.split(sep).join('/');
}

function isExcluded(relativePath) {
  return EXCLUDED_PATHS.some(
    (prefix) => relativePath === prefix || relativePath.startsWith(`${prefix}/`),
  );
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;

    const fullPath = resolve(directory, entry.name);
    const relativePath = toPosix(relative(ROOT, fullPath));

    if (isExcluded(relativePath)) continue;

    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectFiles() {
  const files = new Set();

  for (const entry of SCAN_ROOTS) {
    const fullPath = resolve(ROOT, entry);
    if (!existsSync(fullPath)) continue;

    const rootEntry = statSync(fullPath);
    if (rootEntry.isDirectory()) {
      walk(fullPath, []).forEach((file) => files.add(file));
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      files.add(fullPath);
    }
  }

  return [...files].sort();
}

function isBackendSpecifier(specifier) {
  if (BACKEND_PACKAGES.has(specifier)) return true;

  return BACKEND_MODULE_PREFIXES.some(
    (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
  );
}

function collectImports(source) {
  const specifiers = new Set();

  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }

  return [...specifiers].sort();
}

function findViolations(files) {
  const violations = [];

  for (const file of files) {
    const relativePath = toPosix(relative(ROOT, file));
    for (const specifier of collectImports(readFileSync(file, 'utf8'))) {
      if (isBackendSpecifier(specifier)) {
        violations.push({ file: relativePath, specifier });
      }
    }
  }

  return violations.sort(
    (left, right) =>
      left.file.localeCompare(right.file) || left.specifier.localeCompare(right.specifier),
  );
}

function key(violation) {
  return `${violation.file}\u0000${violation.specifier}`;
}

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) return [];
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  return Array.isArray(baseline.violations) ? baseline.violations : [];
}

function writeBaseline(violations) {
  const payload = {
    generatedAt: new Date().toISOString(),
    note:
      'Existing frontend → backend coupling recorded at T01. New entries fail the boundary check. ' +
      'Remove entries as modules move to neuron-back; an empty list is required by T16.',
    scanRoots: SCAN_ROOTS,
    violations,
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function formatViolation(violation) {
  return `${violation.file} -> ${violation.specifier}`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = collectFiles();
  const violations = findViolations(files);

  if (options.update) {
    writeBaseline(violations);
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ updated: true, violations }, null, 2)}\n`);
    } else {
      console.log(
        `Boundary baseline updated: ${violations.length} known coupling(s) in ` +
          `${toPosix(relative(ROOT, BASELINE_PATH))}`,
      );
    }
    return;
  }

  const baseline = readBaseline();
  const baselineKeys = new Set(baseline.map(key));
  const currentKeys = new Set(violations.map(key));
  const newViolations = violations.filter((violation) => !baselineKeys.has(key(violation)));
  const staleViolations = baseline.filter((violation) => !currentKeys.has(key(violation)));

  if (options.json) {
    process.stdout.write(
      `${JSON.stringify(
        { scannedFiles: files.length, baseline: baseline.length, newViolations, staleViolations },
        null,
        2,
      )}\n`,
    );
  } else {
    console.log('Backend import boundary (warn mode)');
    console.log(`  Scanned: ${files.length} file(s) in ${SCAN_ROOTS.length} root(s)`);
    console.log(`  Baseline: ${baseline.length} known coupling(s)`);
    console.log(`  Found: ${violations.length}`);
    console.log(`  New: ${newViolations.length}`);

    if (newViolations.length > 0) {
      console.error('\nNew backend imports (release-blocking at T16):');
      for (const violation of newViolations) {
        console.error(`  ${formatViolation(violation)}`);
      }
      console.error('\nMove the import behind an API call, or record an approved temporary');
      console.error('coupling with --update and a review note.');
    }

    if (staleViolations.length > 0) {
      console.warn('\nStale baseline entries (the import is gone; run --update to shrink it):');
      for (const violation of staleViolations) {
        console.warn(`  ${formatViolation(violation)}`);
      }
    }
  }

  if (newViolations.length > 0) {
    process.exit(1);
  }
  if (options.strict && staleViolations.length > 0) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
