# ClearGov

ClearGov is a TypeScript full-stack prototype for evidence-based public service decisions. The solution contains a Next.js web app, a Fastify API, shared contracts, and a deterministic decision engine.

## Overview

- Applicant flow: choose a service, provide facts, upload evidence, assess, review the explainable decision result.
- Reviewer flow: review applications that need human action.
- Decision engine: deterministic scenario evaluation with versioned conditions and explainable next actions.
- Security posture: request IDs, sanitized responses, and explicit audit-oriented design.

## Prerequisites

- Node.js LTS
- pnpm 10+
- Docker Desktop for optional local scanning and Supabase emulation
- Supabase CLI when using local services

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Project scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm security:scan
pnpm db:migrate
pnpm db:seed
```

## Demo values

- Applicant flow: /services and /apply/scholarship_assistance/start
- Reviewer login: /reviewer/login
- Demo credentials are local-only and not production defaults.

## Notes

This prototype intentionally uses a deterministic rules engine and a demo workflow, not a production database or external AI pipeline. It is designed to be extended safely with real Supabase and review orchestration.
