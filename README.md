# guataapp

# GuataApp - Bun Monorepo

A modern full-stack application built with Bun, featuring a powerful API and a dynamic frontend.

## 🏗️ Architecture

### Backend (API)

- **Runtime**: Bun
- **Framework**: Hono.js - Fast, lightweight web framework
- **Database**: Prisma ORM with SQLite (development)
- **Port**: 3000

### Frontend (Web)

- **Framework**: Astro - Modern static site builder
- **Components**: Svelte 5 with runes - Reactive components
- **Styling**: Tailwind CSS - Utility-first CSS framework
- **Interactivity**: Alpine.js - Lightweight reactive framework
- **Animations**: GSAP - Professional animations library
- **Port**: 4321

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)

### Installation

```bash
# Install dependencies
bun install

# Install API dependencies
cd apps/api && bun install

# Install Web dependencies
cd apps/web && bun install
```

### Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push
```

### Development

```bash
# Start both API and Web in development mode
bun run dev

# Or start individually:
bun run dev:api    # API only (http://localhost:3000)
bun run dev:web    # Web only (http://localhost:4321)
```

## 📁 Project Structure

```
GuataApp/
├── apps/
│   ├── api/                 # Hono.js API
│   │   ├── src/
│   │   │   └── index.ts     # API entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   └── .env             # Environment variables
│   └── web/                 # Astro frontend
│       ├── src/
│       │   ├── components/  # Svelte & Astro components
│       │   └── pages/       # Astro pages
│       └── astro.config.mjs # Astro configuration
├── packages/                # Shared packages (future)
└── package.json            # Root workspace config
```

## 🛠️ Available Scripts

### Root Level

- `bun run dev` - Start both API and web in development
- `bun run build` - Build both projects for production
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Prisma Studio

### API Scripts

- `bun run dev:api` - Start API development server
- `bun run build:api` - Build API for production

### Web Scripts

- `bun run dev:web` - Start web development server
- `bun run build:web` - Build web for production

## 🎨 Technology Highlights

### Svelte 5 with Runes

Uses the latest Svelte 5 features including:

- `$state()` - Reactive state management
- `$derived()` - Computed values
- `$effect()` - Side effects

### GSAP Animations

Professional-grade animations for enhanced user experience.

### Alpine.js Integration

Lightweight reactive components for simple interactivity.

### Prisma Database

Type-safe database access with automatic schema generation.

### Hono.js API

Ultra-fast web framework with excellent TypeScript support.

## 🔧 Configuration

### Environment Variables

Create `.env` files in:

- `apps/api/.env` - API configuration
- `apps/web/.env` - Web configuration (if needed)

### Database

The project uses SQLite for development. Update `apps/api/prisma/schema.prisma` to change the database provider.

## 📝 Development Guidelines

1. **API Development**: Add routes in `apps/api/src/index.ts`
2. **Component Creation**: Use Svelte for interactive components, Astro for static
3. **Styling**: Use Tailwind CSS utility classes
4. **Animations**: Use GSAP for complex animations, Alpine.js for simple interactions
5. **Database**: Always run `bun run db:generate` after schema changes

## 🚀 Deployment

### API Deployment

```bash
cd apps/api
bun run build
bun run start
```

### Web Deployment

```bash
cd apps/web
bun run build
# Deploy the dist/ folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
