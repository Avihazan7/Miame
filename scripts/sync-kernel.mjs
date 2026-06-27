#!/usr/bin/env node
// scripts/sync-kernel.mjs — refresh the vendored @ulease/core kernel.
//
// The kernel's single source of truth is the ulease-core repo. Vercel cannot clone
// that private repo at build time, so we vendor its BUILT output (dist) under
// vendor/ulease-core and depend on it via `file:`. This script re-syncs that vendored
// copy from a local kernel checkout so it never drifts from source.
//
// Usage:
//   node scripts/sync-kernel.mjs [path-to-ulease-core]   (default: ../ulease-core)
// The kernel checkout must have a built dist/ (run `npm run build` there first).

import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const src = resolve(process.argv[2] ?? '../ulease-core');
const distSrc = join(src, 'dist');
const vendor = resolve('vendor/ulease-core');

if (!existsSync(distSrc)) {
  console.error(`✗ no built dist at ${distSrc} — run "npm run build" in the kernel repo first`);
  process.exit(1);
}

rmSync(join(vendor, 'dist'), { recursive: true, force: true });
cpSync(distSrc, join(vendor, 'dist'), { recursive: true });

// Stamp the source commit for provenance / drift auditing.
let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: src }).toString().trim();
} catch {
  /* not a git checkout — leave as unknown */
}
const pkgPath = join(vendor, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.uleaseKernel = { vendoredFrom: 'Avihazan7/ulease-core', commit };
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`✓ vendored @ulease/core dist from ${src} (commit ${commit})`);
