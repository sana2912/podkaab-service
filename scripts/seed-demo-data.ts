#!/usr/bin/env bun
/**
 * Quick script to re-run the seed.
 * Run: bun run scripts/seed-demo-data.ts
 */
import { spawn } from "bun";

const proc = spawn(["bun", "run", "packages/db/prisma/seed.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env },
});

const code = await proc.exited;
process.exit(code);
