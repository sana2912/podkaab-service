#!/usr/bin/env bun
import { spawn } from "bun";

const proc = spawn(["bun", "--hot", "run", "apps/worker/src/worker.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env },
});

process.on("SIGINT", () => {
  proc.kill();
  process.exit(0);
});

await proc.exited;
