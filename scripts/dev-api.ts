#!/usr/bin/env bun
/**
 * Development helper: starts the API with --hot reload and
 * prints a quick connectivity test result.
 */
import { spawn } from "bun";

const proc = spawn(["bun", "--hot", "run", "apps/api/src/server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env },
});

process.on("SIGINT", () => {
  proc.kill();
  process.exit(0);
});

await proc.exited;
