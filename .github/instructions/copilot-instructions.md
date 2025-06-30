---
applyTo: "**"
---

# GuataApp - Monorepo Project Instructions

This is a Bun-based monorepo with the following architecture:

# Backend (apps/api)

- **Framework**: Hono.js for API routes
- **Database**: Prisma ORM with SQLite (development)
- **Runtime**: Bun
- **Port**: 3000

### API Structure

- Main entry: `apps/api/src/index.ts`
- Database schema: `apps/api/prisma/schema.prisma`
- Environment: `apps/api/.env`

### Database

- Always run `bun run db:generate` after schema changes
- Use `bun run db:migrate:dev` for development schema updates
- Use `bun run db:migrate:prod` for production migrations

### API Development

- Use Hono's middleware for CORS, logging, etc.
- Follow RESTful conventions for API routes
- Include proper error handling and status codes
- Use Prisma for database operations

---

# Frontend (apps/web)

- **Framework**: Astro
- **Components**: Svelte 5 (with runes)
- **Styling**: Pure CSS
- **Interactivity**: Alpine.js for reactive components
- **Animations**: GSAP for advanced animations
- **Port**: 4321 (default Astro)

### Frontend Structure

- Main page: `apps/web/src/pages/index.astro`
- Svelte components (Client components): `apps/web/src/components/*.svelte`
- Astro components (Server components): `apps/web/src/components/*.astro`

### Frontend Development

- Use Astro for static content and routing
- Use Svelte components for interactive features
- Use Alpine.js for simple reactive behaviors
- Use GSAP for complex animations
- Use Tailwind for styling with utility classes

---

# Development Guidelines

## Code Style

- Use TypeScript throughout the project
- Follow modern JavaScript/TypeScript patterns
- Use Svelte 5 runes syntax ($state, $derived, $effect)
- Prefer composition over inheritance
- Use semantic HTML and accessibility best practices

## Build & Deploy

- Development: `bun run dev` (runs both API and web)
- Build: `bun run build` (builds both projects)
- API only: `bun run dev:api` or `bun run build:api`
- Web only: `bun run dev:web` or `bun run build:web`

When suggesting code changes, always consider the full-stack context and ensure API/frontend integration works properly.
