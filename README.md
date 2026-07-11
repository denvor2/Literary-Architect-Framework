# Literary Studio

**An AI-powered IDE for writers.**

Literary Studio pairs writers with a team of specialist AI Experts (Professional Roles) — Line
Editor, Developmental Editor, Style Editor, Continuity Checker, Fact Checker, and Research
Assistant — that work with a manuscript the way a human editorial team would.

## Vision

Writing is a craft, and craft benefits from expertise, not just generation. Literary Studio
exists to give every writer access to a full editorial team — available on demand, working
directly with the manuscript rather than in a side conversation.

Fiction is the first domain we're building for, because it's the richest testing ground for
developing editorial Experts — but the Expert system is designed to generalize across novels,
screenplays, non-fiction, articles, and technical documentation. See
[ADR-0002](docs/adr/ADR-0002-expert-contract-vision.md).

## Why Literary Studio?

Most AI writing tools are a chat box next to a blank page: general-purpose, stateless, and
disconnected from the manuscript's structure. Literary Studio is an **IDE, not a chatbot** —
Experts operate directly on the manuscript, hold context across the whole project, and are
each scoped to one editorial responsibility rather than "do anything."

## Design Principles

- AI augments the author, never replaces them.
- Architecture before features.
- Experts are modular.
- Evolutionary architecture — contracts are discovered from working examples, not designed
  upfront.
- Human review remains central.
- Security by design.

## Status

The Studio App (`apps/studio/`) is a working MVP with multi-book workspace, book/chapter/scene
editing, persistence (PostgreSQL + localStorage fallback), and four live AI Experts (Line Editor,
Critic, Reader, Co-author). See [docs/reports/](docs/reports/) for sprint-by-sprint progress and
[docs/project/PROJECT_STATE.md](docs/project/PROJECT_STATE.md) for the current snapshot.

## Roadmap

Three phases — see [docs/vision/roadmap.md](docs/vision/roadmap.md) for the full breakdown:
**MVP** (local, single-user, first working Expert) → **Persistence & Orchestration** (accounts,
database, cloud sync, AI orchestration layer) → **Platform** (multi-user, plugin architecture,
publishing pipeline, story knowledge graph).

## Development & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp apps/studio/.env.example apps/studio/.env.local
# Edit .env.local and add ANTHROPIC_API_KEY

# Start dev server
npm run dev -w studio

# Access: http://localhost:3000
```

### Docker Compose (Local Testing & Production)

**Development** (with hot-reload):

```bash
docker-compose up
# Access: http://localhost:3000
```

**Production** (HTTPS with Nginx reverse proxy):

```bash
# Set up environment
cp apps/studio/.env.example apps/studio/.env.local
# Edit .env.local and add ANTHROPIC_API_KEY

# Deploy
docker-compose -f docker-compose.prod.yml up -d
# Access: https://localhost/ (self-signed cert, or use your own)
```

### Environment Variables

All environment variables are documented in `apps/studio/.env.example`:

**Required:**

- `ANTHROPIC_API_KEY` — AI Expert API key (get one at https://console.anthropic.com/)
- `DATABASE_URL` — PostgreSQL connection string (optional for local dev with localStorage)

**Optional:**

- `NODE_ENV` — `development` or `production` (default: production in Docker)
- `PORT` — Server port (default: 3000)
- `HOSTNAME` — Bind address (default: 0.0.0.0)
- `RATE_LIMIT_ENABLED` — Enable rate limiting (default: true)
- `RATE_LIMIT_REQUESTS_PER_WINDOW` — Max requests per IP per window (default: 10)
- `RATE_LIMIT_WINDOW_MS` — Rate limit window in ms (default: 900000 = 15 min)

Copy `.env.example` to `.env.local` and fill in real values. Never commit `.env.local`.

### Production Deployment Checklist

For detailed production setup with HTTPS, certificate management, backups, and troubleshooting:

See [docs/project/DEPLOYMENT.md](docs/project/DEPLOYMENT.md) — includes:

- Environment configuration for production
- HTTPS/TLS setup (self-signed or Let's Encrypt)
- Database backup and restore procedures
- Health checks and monitoring
- Firewall and security configuration
- Docker Compose production configuration

## Repository layout

This repository holds the whole Literary Studio ecosystem, not just the Studio App:

- `apps/studio/` — the Studio App (Next.js)
- `framework/` — the Expert/workflow/memory system powering the AI features
- `prompts/` — prompt templates used by the Framework
- `docs/` — architecture decisions (`adr/`), vision, sprint reports, and project docs
  (`project/`)
- `templates/`, `examples/`, `tests/`, `assets/` — supporting material

See [ADR-0001](docs/adr/ADR-0001-repository-structure.md) for why the app lives under `apps/`.

## Contributing

Active early-stage development with a small, fixed team. No external contribution process yet.
