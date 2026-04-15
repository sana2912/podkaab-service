# Podkaap Backend — Engineering TODO

> Legend: 🔴 Critical · 🟡 Important · 🟢 Nice-to-have · ✅ Done
_
---

## ✅ Already Done

- [x] Monorepo scaffold (Bun workspaces — api, worker, packages)
- [x] Prisma schema — MongoDB Atlas
- [x] All 10 API modules (series, episodes, hooks, progress, continue-watching, reactions, feed, analytics, media, health)
- [x] Feed engine (candidate → ranking → diversity)
- [x] BullMQ + DragonflyDB job queue (`packages/queue`)
- [x] Background worker (process-video, thumbnail, waveform, transcode)
- [x] dotenvx encrypted env (development / staging / production)
- [x] Biome formatter + linter
- [x] Ultracite / ESLint (type-aware rules)
- [x] Husky pre-commit (lint-staged + commit-msg conventional commits)
- [x] docker-compose.yml (DragonflyDB local)

---

## 🔴 Code Quality — Critical

### Testing

- [ ] Install Bun test runner config (`bunfig.toml`)
- [ ] Write unit tests — feed ranking logic (`feed-ranking.service.test.ts`)
- [ ] Write unit tests — pagination helper (`pagination.test.ts`)
- [ ] Write unit tests — feed diversity pass (`feed-diversity.service.test.ts`)
- [ ] Write integration tests — series, episodes, progress endpoints (test DB)
- [ ] Write integration tests — analytics event tracking
- [ ] Set coverage threshold ≥ 70% (fail CI below)
- [ ] Add `test` + `test:coverage` scripts to `package.json`
- [ ] Add test DB env to `.env.development` (`TEST_DATABASE_URL`)

### Secret Scanning

- [ ] Install `gitleaks` (brew / choco / binary)
- [ ] Add `.gitleaks.toml` config
- [ ] Add `gitleaks detect` step to `.husky/pre-commit`
- [ ] Add gitleaks scan to GitHub Actions CI

### Pre-commit Hardening

- [ ] Add `tsc --noEmit` typecheck to pre-commit (after lint-staged)
- [ ] Add `bun test --bail` (fast fail) to pre-commit for changed files

---

## 🔴 CI/CD Pipeline

> See full pipeline design in **CI/CD Pipeline** section below.

### feat → dev PR

- [ ] Create `.github/workflows/ci-feat-dev.yml`
- [ ] Step: `bun install`
- [ ] Step: `biome check` + `eslint`
- [ ] Step: `tsc --noEmit`
- [ ] Step: `bun test --coverage`
- [ ] Step: SonarCloud quality gate (block merge if fail)
- [ ] Step: Sentry GitHub App check (new issues / regressions)
- [ ] Step: gitleaks secret scan

### dev → staging (on merge)

- [ ] Create `.github/workflows/deploy-staging.yml`
- [ ] Step: all CI checks above (reuse)
- [ ] Step: Build Docker image — api (`Dockerfile.api`)
- [ ] Step: Build Docker image — worker (`Dockerfile.worker`)
- [ ] Step: Push images to Docker Hub with tags: `staging-<sha>` + `staging-latest`
- [ ] Step: Update `docker-compose.staging.yml` with new image SHA tag
- [ ] Step: Commit updated compose file back to repo
- [ ] Step: Trigger Render deploy hook via `curl -X POST $RENDER_DEPLOY_HOOK_URL`

### staging → production (manual approval)

- [ ] Create `.github/workflows/deploy-production.yml`
- [ ] Require manual approval (GitHub Environment protection rules)
- [ ] Push `production-<sha>` + `production-latest` tags to Docker Hub
- [ ] Update `docker-compose.production.yml`
- [ ] Trigger Render production deploy hook

---

## 🔴 Docker & Containerisation

- [ ] Write `Dockerfile.api` (multi-stage: deps → build → runtime)
- [ ] Write `Dockerfile.worker` (multi-stage)
- [ ] Write `docker-compose.staging.yml` (api + worker + dragonfly)
- [ ] Write `docker-compose.production.yml`
- [ ] Add `.dockerignore`
- [ ] Test local image build: `docker build -f Dockerfile.api .`

---

## 🟡 Observability & Error Tracking

### Sentry

- [ ] Create Sentry project (Bun / Node platform)
- [ ] Install `@sentry/bun` in `apps/api`
- [ ] Initialise Sentry in `apps/api/src/server.ts` (before routes)
- [ ] Add Sentry error handler in `apps/api/src/app.ts`
- [ ] Install `@sentry/node` in `apps/worker`
- [ ] Add `SENTRY_DSN` to all `.env.*` files + dotenvx
- [ ] Add Sentry GitHub App to repo (auto-comment on PRs with new issues)
- [ ] Configure source maps upload in build step

### Structured Logging

- [ ] Replace `console.info` in logger plugin with `pino`
- [ ] Add `pino-pretty` for dev, JSON output for staging/prod
- [ ] Add `requestId` to every log line (Elysia `derive`)
- [ ] Add `LOG_LEVEL` to env files

### Health Check Enhancement

- [ ] Add DragonflyDB ping to `GET /health`
- [ ] Add BullMQ queue depth stats to health response
- [ ] Add uptime + memory usage to health response

---

## 🟡 Security

### Rate Limiting

- [ ] Install `@elysiajs/rate-limit`
- [ ] Configure rate limit plugin using DragonflyDB store
- [ ] Apply global limit: 200 req/min per IP
- [ ] Apply stricter limit on `/api/v1/analytics/events`: 500 events/min per user
- [ ] Apply stricter limit on `/api/v1/feed`: 60 req/min per user

### API Hardening

- [ ] Add `@elysiajs/cors` with whitelist per environment
- [ ] Add security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Validate all `@db.ObjectId` params are valid 24-char hex before hitting DB
- [ ] Add request size limit (prevent large payload abuse)

### Dependency Audit

- [ ] Run `bun audit` — fix any high/critical vulnerabilities
- [ ] Enable Renovate Bot (auto-PRs for dependency updates)
- [ ] Add `bun audit` to CI pipeline (fail on critical)

---

## 🟡 SonarCloud / Code Quality Gate

- [ ] Create SonarCloud account → link GitHub repo
- [ ] Add `sonar-project.properties` to root
- [ ] Configure quality gate: coverage ≥ 70%, duplication < 3%, no blocker issues
- [ ] Add `SONAR_TOKEN` to GitHub Actions secrets
- [ ] Block PR merge if quality gate fails

---

## 🟢 Developer Experience

- [ ] Add `.github/pull_request_template.md`
- [ ] Add `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] Add `.github/ISSUE_TEMPLATE/feature_request.md`
- [ ] Add `CONTRIBUTING.md`
- [ ] Add Renovate config (`renovate.json`)
- [ ] Setup `@changesets/cli` for version management (if publishing packages)

---

## Infra Setup Checklist

> See **Infra Setup** section below.

---

---

# 🏗️ CI/CD Pipeline Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Developer                                                       │
│  feat/xyz ──► PR to dev                                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions: ci-feat-dev.yml                                │
│                                                                  │
│  1. bun install                                                  │
│  2. biome check + eslint (Ultracite)                            │
│  3. tsc --noEmit                                                 │
│  4. bun test --coverage                                          │
│  5. gitleaks secret scan                                         │
│  6. SonarCloud scan → quality gate (blocks merge if fail)       │
│  7. Sentry GitHub App → comment new issues on PR                │
│                                                                  │
│  ✅ All pass → PR can be merged to dev                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ merge
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  dev branch                                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │ PR dev → staging
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions: deploy-staging.yml                             │
│                                                                  │
│  1. [same CI checks as above]                                   │
│  2. SonarCloud quality gate                                      │
│  3. Sentry release + sourcemaps upload                          │
│                                                                  │
│  4. docker build -f Dockerfile.api   → podkaap/api:staging-<sha>│
│     docker build -f Dockerfile.worker→ podkaap/worker:staging-<sha>│
│  5. docker push → Docker Hub                                    │
│                                                                  │
│  6. Update docker-compose.staging.yml image tags with <sha>     │
│  7. git commit + push compose file back to repo                 │
│                                                                  │
│  8. curl -X POST $RENDER_STAGING_DEPLOY_HOOK                    │
│     → Render pulls staging-<sha> from Docker Hub               │
│     → Render runs new containers                                │
│                                                                  │
│  ✅ Deploy complete → staging.podkaap.com live                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ manual approval required
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions: deploy-production.yml                          │
│  (GitHub Environment: production — requires reviewer approval)  │
│                                                                  │
│  1. docker tag staging-<sha> → production-<sha>                 │
│  2. docker push → Docker Hub                                    │
│  3. Update docker-compose.production.yml                        │
│  4. curl -X POST $RENDER_PRODUCTION_DEPLOY_HOOK                 │
│  5. Sentry mark release as deployed to production               │
└─────────────────────────────────────────────────────────────────┘
```

---

---

# 🏗️ Infra Setup Checklist

## 1. GitHub Repository

- [ ] Create GitHub repo: `podkaap-backend`
- [ ] Push initial code
- [ ] Create branches: `main` · `staging` · `dev`
- [ ] Set branch protection rules:
  - `main` — require PR + 1 reviewer + all checks pass
  - `staging` — require PR + all checks pass
  - `dev` — require PR + CI pass
- [ ] Create GitHub Environments:
  - `staging` — no approval required
  - `production` — require 1 reviewer approval

## 2. GitHub Actions Secrets

Add these in repo Settings → Secrets → Actions:

```
DOCKER_HUB_USERNAME
DOCKER_HUB_TOKEN            # Docker Hub access token (not password)
SONAR_TOKEN                 # SonarCloud project token
SENTRY_AUTH_TOKEN           # Sentry internal integration token
SENTRY_ORG                  # e.g. "podkaap"
SENTRY_PROJECT              # e.g. "backend"
RENDER_STAGING_DEPLOY_HOOK  # Render webhook URL for staging
RENDER_PROD_DEPLOY_HOOK     # Render webhook URL for production
DOTENV_PRIVATE_KEY_STAGING      # from .env.keys
DOTENV_PRIVATE_KEY_PRODUCTION   # from .env.keys
```

## 3. Docker Hub

- [ ] Create Docker Hub account / organisation: `podkaap`
- [ ] Create repositories:
  - `podkaap/api`
  - `podkaap/worker`
- [ ] Create access token (read/write) → add to GitHub secrets

## 4. MongoDB Atlas

- [ ] Create organisation + project
- [ ] Create cluster: `podkaap-staging` (M10 shared)
- [ ] Create cluster: `podkaap-production` (M10+ dedicated)
- [ ] Create DB users per environment (separate credentials)
- [ ] Whitelist IPs:
  - `0.0.0.0/0` for Render (or Render static IPs if available)
- [ ] Get connection strings → add to `.env.staging` / `.env.production`
- [ ] Enable Atlas backups (production)

## 5. DragonflyDB (Managed)

- [ ] Choose provider:
  - **Option A**: Upstash Redis (free tier, serverless, Redis-compatible) ← easiest
  - **Option B**: Self-host on Render as a private service
  - **Option C**: Railway DragonflyDB service
- [ ] Create staging instance → get `rediss://` URL
- [ ] Create production instance → get `rediss://` URL
- [ ] Add URLs to `.env.staging` / `.env.production`

## 6. Render (Hosting)

- [ ] Create Render account
- [ ] Create services:
  - `podkaap-api-staging` — Docker image: `podkaap/api:staging-latest`
  - `podkaap-worker-staging` — Docker image: `podkaap/worker:staging-latest`
  - `podkaap-api-production` — Docker image: `podkaap/api:production-latest`
  - `podkaap-worker-production` — Docker image: `podkaap/worker:production-latest`
- [ ] For each service:
  - Set image to Docker Hub private repo
  - Add Docker Hub credentials
  - Set environment variables (use Render env groups)
  - Enable auto-deploy OFF (deploy only via webhook)
- [ ] Copy Deploy Hook URLs → add to GitHub secrets
- [ ] Create Render environment groups:
  - `podkaap-staging-env`
  - `podkaap-production-env`

## 7. SonarCloud

- [ ] Sign up at sonarcloud.io with GitHub
- [ ] Create organisation: `podkaap`
- [ ] Import repo → auto-detect TypeScript
- [ ] Set quality gate:
  - Coverage on new code ≥ 70%
  - Duplicated lines < 3%
  - No blocker / critical issues
- [ ] Get `SONAR_TOKEN` → add to GitHub secrets
- [ ] Add `sonar-project.properties` to repo root
- [ ] Enable GitHub PR decoration (auto-comment analysis results)

## 8. Sentry

- [ ] Create Sentry account / organisation: `podkaap`
- [ ] Create project: `podkaap-backend` (Node.js platform)
- [ ] Get DSN → add to all `.env.*`
- [ ] Get Auth Token → add to GitHub secrets
- [ ] Install Sentry GitHub App on repo:
  - Auto-comment on PRs when commits introduce new issues
  - Link Sentry issues to GitHub commits
- [ ] Configure environments in Sentry: `development`, `staging`, `production`
- [ ] Set up release tracking (sourcemaps + release name = git SHA)

## 9. Cloudinary (Storage)

- [ ] Create Cloudinary account
- [ ] Create upload presets for video + image
- [ ] Get credentials → add to `.env.staging` / `.env.production`
- [ ] Enable auto-backup / transformation

## 10. Domain & SSL

- [ ] Register domain (e.g. `podkaap.com`)
- [ ] Add subdomain:
  - `api.staging.podkaap.com` → Render staging service
  - `api.podkaap.com` → Render production service
- [ ] Render handles SSL automatically (Let's Encrypt)

---

---

# 📦 Dockerfile Design (to implement)

```dockerfile
# Dockerfile.api (multi-stage)
FROM oven/bun:1 AS deps       # install dependencies
FROM oven/bun:1 AS build      # bun build
FROM oven/bun:1 AS runtime    # minimal final image

# Dockerfile.worker (same pattern)
```

**Image tagging strategy:**

```
podkaap/api:staging-a1b2c3d        ← staging build, commit sha
podkaap/api:staging-latest         ← always points to latest staging
podkaap/api:production-a1b2c3d     ← production build
podkaap/api:production-latest      ← always points to latest production
```

---

---

# 📋 GitHub Actions Files to Create

```
.github/
├── workflows/
│   ├── ci-feat-dev.yml          # feat → dev PR checks
│   ├── deploy-staging.yml       # dev → staging deploy
│   └── deploy-production.yml    # staging → main deploy (manual)
├── pull_request_template.md
└── ISSUE_TEMPLATE/
    ├── bug_report.md
    └── feature_request.md
```

อย่าลืมเปลี่ยน infra เป็น ci(codeQL(github),sonarQubeCloud,linter)
image registry (GitHub Container Registry)
