# Revert Follow-ups — Retiring the Godot Native Client

**Date:** 2026-06-02

On 2026-06-02 the project retired the Godot native client (`native-client/godot/`, now
deleted) and reverted to its Minecraft-Java path: a **Paper plugin** (server-side) plus a
**Fabric mod** (client GUI), both consuming the existing **Fastify + PostgreSQL REST sidecar**
as the single source of truth.

The Godot "live world" — voxel rendering and world-sync over `/ws/regions/` and
`/api/regions/.../chunks` — was stubbed on both client and server and never functional. The
backend is client-agnostic REST and was already consumed by the Paper plugin and Fabric mod, so
the revert removes a non-working path rather than working functionality.

This document tracks the work still open after the revert.

---

## 1. Tier-2/3 UI coverage (Fabric + Paper)

Several services previously had a GUI only in the retired Godot client. They are still backed by
sidecar REST endpoints but currently have no in-game surface on the Minecraft stack. Each needs a
Fabric screen and/or Paper command to be reachable again.

- **Marketplace** — beyond the basic browse/buy flow already in `MarketplaceScreen`
- **Achievements** — categories/challenges/leaderboard surfaces missing from the current screen
- **Guilds** — roles, treasury, emblems, alliances, parcel assignment
- **Pets** — adopt/summon/interact/customize
- **Photos** — in-game photography, filters, galleries
- **Voice** — voice channels, spatial audio controls

**Done when:** each service has a Fabric screen (and/or Paper command) wired to its existing
sidecar endpoints, with a keybind registered where appropriate.

---

## 2. Decide the fate of `object_scripts`

`object_scripts` are stored as inert text. There is no interpreter for them anywhere — not in
the sidecar, the Paper plugin, or the Fabric mod. The feature does nothing today.

**Decision needed — pick one:**

- **Implement a server-side runtime.** Add a sandboxed interpreter in the sidecar (Lua or a
  constrained DSL), define the trigger/event model, and document the scripting API. This is a
  substantial new subsystem.
- **Cut the feature.** Remove the storage and any references, and note it in the deferred-features
  guide so it can be revived later from git history.

**Done when:** scripts either execute through a documented runtime, or the inert storage and its
references are removed.

---

## 3. Add persistence to in-memory-only services

The following services live only in in-memory Maps and lose all state on restart. They should be
migrated onto the existing dual-mode persistence layer (`src/data/persistence.ts`, in-memory by
default, PostgreSQL when `DATABASE_URL` is set).

- Marketplace
- Guilds
- Pets
- Photos
- Voice

**Done when:** each service reads/writes through `persistence`, with PostgreSQL-backed storage
exercised under tests, and survives a sidecar restart.

---

## 4. Visuals via Minecraft + Iris shader pack

The Godot client carried bespoke shaders for lighting/water/atmosphere. The replacement is the
standard Minecraft Java renderer plus an [Iris](https://irisshaders.dev/) shader pack.

- Recommend/pin a specific Iris-compatible shader pack that approximates the retired look
- Document install steps alongside the Fabric mod in the player/deployment guides
- Confirm the Fabric mod is compatible with Iris (no conflicting mixins/render hooks)

**Done when:** a recommended shader pack is documented and verified to run with the Fabric mod.
