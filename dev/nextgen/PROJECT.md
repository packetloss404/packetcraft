# PacketCraft -- Next-Gen Sprint Plan

## Architecture

PacketCraft is a social gameplay layer for Minecraft with three components:
- **Fastify Sidecar** (`src/`) -- TypeScript HTTP server, all business logic and persistence
- **Paper Plugin** (`paper-plugin/`) -- Java plugin bridging the MC server to the sidecar via HTTP
- **Fabric Client Mod** (`fabric-mod/`) -- Java client mod providing GUI screens, communicates directly with the sidecar

## Current State (2026-03-26)

The sidecar has 33 route files covering auth, social, economy, marketplace, parcels,
achievements, events, guilds, homes, pets, photos, and more. The Paper plugin handles
auth, chat, parcels, economy (Vault), and basic commands. The Fabric mod has 5 screens
(Economy, Social, Marketplace, Achievements, Events) plus HUD elements.

Test coverage exists for auth, chat, objects, and social. Many systems have route
endpoints but no Paper commands or Fabric screens yet.

## Sprint Schedule

| Sprint | Name | Duration | Focus |
|--------|------|----------|-------|
| 0 | Bug Squash | 3 days | Fix known bugs across all three components |
| 1 | Test & Harden | 1 week | Test coverage for all core sidecar systems |
| 2 | Wire Core | 1 week | Paper commands + Fabric screens for homes, guilds, admin |
| 3 | Commerce & Events | 1 week | Complete marketplace flow, events, parcel upgrades, social |
| 4 | Pets & Photos | 1 week | Pet system, photography, achievement filters, economy fixes |
| 5 | Launch Prep | 1 week | Security, Docker, load testing, docs, integration tests |

## Sprint Details

- [Sprint 0: Bug Squash](sprint-00-bug-squash.md)
- [Sprint 1: Test & Harden](sprint-01-test-harden.md)
- [Sprint 2: Wire Core](sprint-02-wire-core.md)
- [Sprint 3: Commerce & Events](sprint-03-commerce-events.md)
- [Sprint 4: Pets & Photos](sprint-04-pets-photos.md)
- [Sprint 5: Launch Prep](sprint-05-launch-prep.md)

## Spec Files

System specs carried forward from rev3, stored alongside this plan:
- social.md, economy.md, marketplace.md, guilds.md
- achievements.md, events.md, pets.md, homes.md
- admin.md, photography.md

Feature planning docs:
- parcel-tier-upgrades.md, region-workers.md
- traffic-analytics.md, voice-chat.md

## Principles

1. **Paper, not Spigot.** The server runs Paper 1.21.1. Use Paper API where it diverges from Spigot.
2. **Sidecar owns all state.** Paper and Fabric are thin clients. No business logic in Java.
3. **Test before ship.** Every sidecar route must have vitest coverage before the feature is considered done.
4. **Ship incrementally.** Each sprint produces a deployable build. No sprint depends on unfinished work from a later sprint.
5. **PacketCraft branding.** All user-facing strings, docs, and configs use "PacketCraft" (not VibeLife).
