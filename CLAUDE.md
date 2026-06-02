# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PacketCraft is a social gameplay layer for Minecraft with three components:
- **TypeScript Sidecar** (`src/`) — Fastify HTTP server handling all business logic, persistence, and API
- **Paper Plugin** (`paper-plugin/`) — Java plugin bridging Minecraft server to sidecar via HTTP
- **Fabric Client Mod** (`fabric-mod/`) — Java client mod providing UI overlays, communicates directly with sidecar

Communication flow: Player joins MC → Plugin calls sidecar `/api/auth/mc-login` → sidecar returns session token → Plugin sends token to client via plugin messaging channel → Fabric mod uses token for all subsequent API calls.

## Build & Development Commands

### TypeScript Sidecar (root directory)
```bash
npm run dev           # Hot-reload dev server (tsx watch)
npm run build         # TypeScript compilation to dist/
npm run test          # Run all tests (vitest run)
npm run check         # Build + test + asset validation (scripts/check.mjs)
npx vitest run src/__tests__/auth.test.ts  # Run a single test file
npm start             # Run compiled output (dist/server.js)
```

### Paper Plugin (`paper-plugin/`)
```bash
./gradlew shadowJar   # Build plugin JAR (output: build/libs/packetcraft-*.jar)
```

### Fabric Mod (`fabric-mod/`)
```bash
./gradlew build        # Build mod JAR via Fabric Loom (output: build/libs/packetcraft-*.jar)
```

Both Java projects require **Java 21** and use the Gradle wrapper (gradlew).

## Architecture

### Sidecar Structure
- `src/server.ts` — Fastify app setup, middleware (CORS, rate-limit, static), route registration
- `src/routes/` — 33 Fastify route plugins (one per feature domain: auth, social, economy, etc.)
- `src/world/` — 35+ domain service modules containing all business logic
- `src/world/store.ts` — Barrel re-export of all services; existing imports use this
- `src/world/_shared-state.ts` — In-memory Maps for sessions, avatars, regions, chat history; shared across services
- `src/data/persistence.ts` — Persistence abstraction layer (in-memory default, PostgreSQL via `DATABASE_URL` env var)

### Key Patterns
- **Dual persistence**: All data flows through `persistence` layer which switches between in-memory Maps and PostgreSQL based on `DATABASE_URL` presence
- **Session auth**: Token-based, 8-hour TTL. Routes use `requireAuth`/`requireAdmin` middleware from auth-service
- **Three auth modes**: guest (no password), register (creates account), login (existing account)
- **Tests**: Vitest tests in `src/__tests__/`. Use `resetWorldStore()` and `createTestSession()` helpers from `src/__tests__/helpers.ts` to reset in-memory state between tests

### Environment Variables
- `PORT` — Server port (default 3000)
- `DATABASE_URL` — PostgreSQL connection string (omit for in-memory mode)
- `CORS_ORIGINS` — Allowed origins
- `ADMIN_BOOTSTRAP_TOKEN` — Bootstrap admin access

### Java Components
- Plugin config: `paper-server/plugins/PacketCraft/config.yml` (sidecar URL, API key, region mappings)
- Plugin syncs parcel permissions every 5 minutes and caches them locally for block protection
- Both Java projects use Java 21 toolchain, Gson for JSON
