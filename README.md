# PacketCraft

A social gameplay layer for Minecraft (Java Edition). A Fastify/TypeScript sidecar holds all
the business logic and data (the source of truth) for social features, economy, parcels,
marketplace, achievements, and events. A Paper server plugin bridges Minecraft events to that
sidecar, and a Fabric client mod provides the in-game GUI screens. There is no separate game
client — players use the standard Minecraft Java client, and visuals are handled by Minecraft
itself plus an optional Iris shader pack.

## Architecture

```
┌─────────────┐     Plugin Messages     ┌───────────────┐
│  Fabric Mod  │◄──────────────────────►│  Paper Plugin  │
│  (Client UI) │                        │  (MC Server)   │
└──────┬───────┘                        └──────┬─────────┘
       │ HTTP (direct)                         │ HTTP (localhost)
       │                                       │
       └──────────►┌──────────────┐◄───────────┘
                   │   Fastify    │
                   │  (Sidecar)   │───► PostgreSQL
                   │  :3000       │
                   └──────────────┘
```

- **Paper Plugin** (Java 21) — Thin bridge: intercepts MC events, calls sidecar REST API, forwards notifications to Fabric mod via plugin message channel
- **Fastify Sidecar** (TypeScript) — All business logic: social, economy, marketplace, achievements, events, parcels, and more
- **Fabric Mod** (Java 21) — Custom GUI screens, HUD overlays, keybinds. Calls sidecar HTTP directly for UI data

## Features

### Social
- Friends list, friend requests, blocking, and presence status
- Real-time chat persistence and achievement tracking
- Guilds with roles, treasury, emblems, alliances, and parcel assignment
- Avatar profiles with bios, titles, and play-time stats
- Offline messages and activity feeds

### Economy
- Currency system (Vibes) with balance tracking and transaction history
- Vault API integration — any Vault-compatible plugin works with PacketCraft currency
- In-game commands: `/balance`, `/pay <player> <amount>`
- Fabric GUI for full economy management (V key)

### Marketplace
- Fixed-price and auction listings
- Peer-to-peer trading with offer/accept/decline flow
- Storefronts, commissions, and trending items
- In-game `/market` command + full Fabric GUI (M key)

### Parcels & Building
- Parcel-based land ownership with build permissions and collaborators
- Server-side block protection (cached parcel checks + sidecar fallback)
- In-game commands: `/parcel info|claim|release|list`
- Periodic parcel sync from sidecar (source of truth)

### Achievements & Progression
- 5 achievement categories (Explorer, Builder, Social, Collector, Warrior)
- Automatic stat tracking from MC events (block place/break, mob kills, world changes)
- Daily and weekly challenges with XP rewards
- Leaderboards, unlockable titles
- Toast notifications via Fabric mod (J key for full GUI)

### Events & Seasonal
- Player-created events with types, RSVP, and scheduling
- 4 seasons with themed content, 7 holidays with collectibles
- Seasonal achievements and leaderboards
- Fabric GUI (K key)

### Additional Features
- Pets (8 species, adopt/summon/interact/customize)
- In-game photography with filters and galleries
- Home system with privacy, ratings, and doorbell notifications
- Radio stations with genre labels and track skipping
- Voice chat channels with spatial audio
- NPC dialogue trees and quests
- Creator tools platform
- Mobile companion API
- Federation/multi-server support

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Game Server | Paper 1.21.11 |
| Client Mod | Fabric (Minecraft 1.21.11) |
| Sidecar | TypeScript, Fastify 5, Node.js 20+ |
| Persistence | PostgreSQL (production) / In-memory (dev) |
| Auth | MC UUID auto-linking on join |
| Build | Gradle 8.12 (Java 21), npm (TypeScript) |

## Project Structure

```
src/                              # Fastify sidecar
  server.ts                       — Route registration, event system
  routes/                         — 33 Fastify route plugins
  world/                          — 35+ service modules
    store.ts                      — Barrel re-exports
    _shared-state.ts              — Sessions, regions, permissions
  data/
    persistence.ts                — Dual-mode persistence layer

paper-plugin/                     # Paper server plugin (Java 21, Paper API)
  src/main/java/com/packetcraft/paper/
    PacketCraftPlugin.java           — Main entry, registers all listeners/commands
    bridge/SidecarClient.java     — Async HTTP client for sidecar
    auth/LoginListener.java       — MC UUID → PacketCraft account linking
    parcels/ParcelManager.java    — Parcel cache + sync
    parcels/ParcelListener.java   — Block protection via parcel permissions
    economy/VaultProvider.java    — Vault Economy backed by sidecar
    achievements/AchievementHook.java — MC events → achievement stat tracking
    chat/ChatListener.java        — Chat persistence + achievement hooks
    commands/                     — /parcel, /friends, /market, /balance, /pay
    messaging/                    — Plugin channel for Fabric mod

fabric-mod/                       # Fabric client mod (Java 21)
  src/main/java/com/packetcraft/fabric/
    PacketCraftClient.java           — Mod entry, session management
    network/SidecarApi.java       — Async HTTP client for sidecar
    network/PluginChannelHandler.java — Server → client notifications
    screen/                       — EconomyScreen, SocialScreen, MarketplaceScreen,
                                    AchievementsScreen, EventsScreen
    hud/AchievementToast.java     — Achievement unlock notifications
    keybind/KeybindManager.java   — V/N/M/J/K keybinds

docs/                             # Documentation site
  index.html                      — Landing page
  plugin.html                     — Player guide
  deploy.html                     — Server admin deployment guide
  manual/                         — Full game manual
  devmanual/                      — Developer manual
```

## Keybinds (Fabric Mod)

| Key | Screen |
|-----|--------|
| V | Economy (balance, send, transactions) |
| N | Social (friends, groups, messages) |
| M | Marketplace (browse, buy, sell, trades) |
| J | Achievements (progress, challenges, leaderboard) |
| K | Events (calendar, RSVP) |

## Quick Start

### Prerequisites
- Java 21
- Node.js 20+
- Paper 1.21.11
- PostgreSQL (recommended for production)

### Build & Run

```bash
# Sidecar
npm install
DATABASE_URL=postgres://packetcraft:packetcraft@127.0.0.1:5432/packetcraft npm run dev

# Paper plugin
cd paper-plugin
./gradlew shadowJar
cp build/libs/packetcraft-paper-*.jar ../paper-server/plugins/

# Fabric mod
cd fabric-mod
./gradlew build
# Output: build/libs/packetcraft-*.jar → player's mods/ folder

# Start Paper
cd paper-server
java -Xms1G -Xmx2G -jar paper.jar --nogui
```

### Configuration

**Plugin config** (`plugins/PacketCraft/config.yml`):
```yaml
sidecar:
  url: "http://localhost:3000"
  api-key: "change-me-in-production"
  timeout-ms: 5000
channel: "packetcraft:main"
regions:
  world: "aurora-docks"
  world_nether: "nether-realm"
  world_the_end: "end-realm"
```

**Sidecar environment**:
```bash
PORT=3000                    # Sidecar port
DATABASE_URL=postgres://...  # Omit for in-memory mode
CORS_ORIGINS=http://...      # Allowed origins
ADMIN_BOOTSTRAP_TOKEN=...    # Bootstrap admin access
```

## Auth Flow

1. Player joins MC server
2. Plugin calls `POST /api/auth/mc-login` with MC UUID + username
3. Sidecar creates or finds linked account, returns session token
4. Token sent to Fabric mod via `packetcraft:main` plugin message channel
5. Fabric mod uses token for all direct sidecar API calls

## Development

```bash
npm run dev          # Sidecar with hot reload
npm run build        # TypeScript compilation
npm run test         # Vitest test suite
npm run check        # Build + test + validation
npx vitest run src/__tests__/auth.test.ts  # Single test file
```

### Optional Server Plugins
- **Vault** — Economy integration with other plugins
- **WorldGuard** — Optional parcel-to-WG region sync

## Visuals

PacketCraft does not ship its own renderer. The world is rendered by the Minecraft Java client.
For enhanced lighting, water, and atmosphere, run an [Iris](https://irisshaders.dev/) shader pack
alongside the Fabric mod — this replaces the bespoke shader work that the retired Godot client
used to provide.

## Follow-ups / known gaps

These are tracked in more detail in [dev/REVERT-FOLLOWUPS.md](dev/REVERT-FOLLOWUPS.md):

- **Tier-2/3 UI coverage** — Several services (marketplace beyond basics, achievements, guilds,
  pets, photos, voice) previously had GUI only in the retired Godot client. They need Fabric
  screens and/or Paper commands to be reachable in-game again.
- **`object_scripts`** — Stored as inert text; no interpreter exists on client or server. Decide
  whether to implement a server-side runtime (Lua/DSL) or cut the feature.
- **Persistence** — Marketplace, guilds, pets, photos, and voice are in-memory only. Add
  PostgreSQL-backed persistence through the existing `src/data/persistence.ts` layer.
- **Visuals** — Standardize on Minecraft + an Iris shader pack to approximate the look the Godot
  shaders provided.

## Documentation

- [Plugin Guide](docs/plugin.html) — Player-facing feature guide
- [Deployment Guide](docs/deploy.html) — Server admin setup
- [Game Manual](docs/manual/) — Complete game manual
- [Developer Manual](docs/devmanual/) — Technical documentation
- [Revert Follow-ups](dev/REVERT-FOLLOWUPS.md) — Open work after retiring the Godot client

## License

Open source. See repository for details.
