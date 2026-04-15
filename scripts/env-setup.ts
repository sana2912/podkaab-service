#!/usr/bin/env bun
/**
 * env-setup.ts
 *
 * Initialises .env.development / .env.production from
 * .env.example when they don't exist yet.
 *
 * Usage:
 *   bun run scripts/env-setup.ts
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

const envFiles = [".env.development", ".env.production"] as const;

const example = resolve(root, ".env.example");

if (!existsSync(example)) {
  console.error("❌  .env.example not found — cannot bootstrap env files.");
  process.exit(1);
}

let created = 0;

for (const file of envFiles) {
  const target = resolve(root, file);
  if (existsSync(target)) {
    console.info(`⏭   ${file} already exists — skipping`);
    continue;
  }

  copyFileSync(example, target);
  console.info(`✅  Created ${file} from .env.example`);
  created++;
}

if (created > 0) {
  console.info(`
Next steps:
  1. Open each .env.<environment> file and fill in real values.
  2. Encrypt them:
       bun run env:encrypt:dev
       bun run env:encrypt:prod
  3. Commit the encrypted files — private keys stay in .env.keys (gitignored).
  4. For CI/CD, store the DOTENV_PRIVATE_KEY_<ENV> secrets in your pipeline.
`);
} else {
  console.info("All env files already exist.");
}

// ── Warn if any env file is not yet encrypted ─────────────────────────────
for (const file of envFiles) {
  const target = resolve(root, file);
  if (!existsSync(target)) continue;

  const content = readFileSync(target, "utf8");
  const hasEncryptedValue = content.includes("encrypted:");

  if (!hasEncryptedValue) {
    console.warn(`⚠️   ${file} contains plaintext values — remember to encrypt before committing.`);
  } else {
    console.info(`🔒  ${file} is encrypted ✓`);
  }
}
