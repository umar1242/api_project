# Telegram Bot Network — Unified API System

A modular monolith backend powering 6 Telegram bots (Admin, Cert, Registrar, Main, Homework, Material) through a single unified REST API core.

## Architecture

```
apps/
  api/          ← NestJS API core (single source of truth for all bots)
  admin-bot/    ← (Stage 1+)
  cert-bot/     ← (Stage 4+)
  registrar-bot/← (Stage 2+)
  main-bot/     ← (Stage 3+)
  homework-bot/ ← (Stage 5+)
  material-bot/ ← (Stage 6+)
```

## Quick Start (Development)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd bot-network

# 2. Create your local environment file
cp .env.example .env
# Edit .env — fill in your Telegram bot tokens and a strong SERVICE_TOKEN

# 3. Start all services (API + PostgreSQL + Redis)
docker compose up

# 4. In a new terminal, run initial database migration
docker compose exec api npx prisma migrate dev

# 5. Verify everything is running
curl http://localhost:3000/health
# Expected: {"status":"ok","db":"connected","redis":"connected"}

# 6. View auto-generated API docs
open http://localhost:3000/api/docs
```

## Development Commands

```bash
# Start with hot reload
docker compose up

# View logs
docker compose logs -f api

# Open a shell in the API container
docker compose exec api sh

# Run tests
docker compose exec api npm run test

# Run linter
docker compose exec api npm run lint

# Create a new Prisma migration
docker compose exec api npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (DB GUI)
docker compose exec api npx prisma studio
```

## Production Deployment

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose exec api npx prisma migrate deploy
```

## Environment Variables

See `.env.example` for a full list of required variables.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Bot Library | grammY (added per bot in later stages) |
| Mini App Frontend | React + TypeScript (added in Stage 2+) |

## Development Stages

See [`project_plan.md`](./project_plan.md) for the full roadmap.
