# PacketCraft Changelog

All notable changes to this project are documented in this file.

---

## 2026-06-02 -- Retire Godot native client; revert to Paper + Fabric over the REST sidecar

### Removed
- Deleted the Godot native client at `native-client/godot/`
- Removed the experimental "live world" path (voxel/world-sync over `/ws/regions/` and
  `/api/regions/.../chunks`) that the Godot client targeted

### Changed
- Reaffirmed the client architecture as a Minecraft **Paper plugin** (server-side:
  economy, parcels, protection, commands) plus a **Fabric mod** (client GUI screens),
  both consuming the **Fastify + PostgreSQL REST sidecar** as the single source of truth
- Rewrote `README.md` to drop Godot/voxel/MMORPG framing and describe what actually runs;
  visuals are now Minecraft + an optional Iris shader pack

### Rationale
The Godot "live world" (voxel rendering and world-sync over `/ws/regions/` and
`/api/regions/.../chunks`) was stubbed on both client and server and never functional.
The backend, by contrast, is client-agnostic REST and was already fully consumed by the
Paper plugin and Fabric mod. Retiring the Godot client removes a non-working, high-cost
path and returns the project to its proven Minecraft-Java stack.

### Follow-ups
See `dev/REVERT-FOLLOWUPS.md` for tracked gaps (Tier-2/3 UI coverage, `object_scripts`
runtime decision, persistence for in-memory services, and shader-pack visuals).

---

## 2026-03-26 -- Reorganize dev/ directory and create next-gen sprint plan

### Changed
- Reorganized `dev/` directory into `archive/`, `deferred/`, and `nextgen/` subdirectories
- Moved historical review, audit, and refactor docs to `dev/archive/`
- Moved obsolete Rev3 Godot GUI sprint plans (sprint-01 through sprint-10) to `dev/archive/`
- Moved deferred feature specs (mobile, creator tools, radio, seasonal, voice, storefronts) to `dev/deferred/`
- Moved active system specs (social, economy, marketplace, guilds, achievements, events, pets, homes, admin, photography) to `dev/nextgen/`
- Deleted stale files: `dev/dev/README.md`, `dev/rev3/PROJECT.md`
- Cleaned up empty directories: `dev/dev/`, `dev/rev3/`

### Added
- `dev/archive/README.md` -- index of archived documents
- `dev/deferred/README.md` -- index of deferred feature docs
- `dev/deferred/deferred-features.md` -- comprehensive restoration guide for 8 removed features
- `dev/nextgen/PROJECT.md` -- master plan for 6 next-gen sprints
- `dev/nextgen/sprint-00-bug-squash.md` -- fix Fabric API URLs, VaultProvider blocking, BasePacketScreen, achievement toast, SidecarClient DELETE
- `dev/nextgen/sprint-01-test-harden.md` -- test coverage for 8 sidecar systems, input validation hardening
- `dev/nextgen/sprint-02-wire-core.md` -- Paper commands for homes/admin/guilds, Fabric screens, events push
- `dev/nextgen/sprint-03-commerce-events.md` -- marketplace flow, event creation, parcel upgrades, social actions
- `dev/nextgen/sprint-04-pets-photos.md` -- pet system, photography, achievement filters, economy name resolution
- `dev/nextgen/sprint-05-launch-prep.md` -- security pass, Docker setup, load testing, docs refresh, integration checklist
- `CHANGELOG.md` -- this file

---

## 2026-03-26 -- Migrate from Spigot to Paper 1.21.1

### Changed
- Replaced Spigot dependency with Paper API 1.21.1 in `paper-plugin/`
- Updated all documentation references from Spigot to Paper
- Overhauled docs and branding

**Commits:** `2efcd30`, `24a37cc`

---

## 2026-03-25 -- Add test server setup

### Added
- Test server configuration in `test-server/`
- `.gitignore` rules for build and runtime artifacts
- Local CLI permission updates

**Commits:** `d46fabd`, `6d4ce7a`

---

## 2026-03-25 -- Pivot to Paper + Fabric + Fastify sidecar architecture

### Changed
- Complete architecture pivot from Godot native client to Minecraft-based stack
- Paper plugin handles server-side MC integration (auth, parcels, chat, economy)
- Fabric client mod provides GUI screens (economy, social, marketplace, achievements, events)
- Fastify sidecar remains the single source of truth for all business logic
- Removed Godot native client dependency

### Added
- `paper-plugin/` -- Java Paper plugin with auth, commands, Vault economy, parcel protection
- `fabric-mod/` -- Java Fabric mod with 5 GUI screens, keybinds, HUD elements
- SidecarClient (Paper) and SidecarApi (Fabric) for HTTP communication with sidecar

**Commit:** `78937e2`

---

## 2026-03-24 -- Fix Godot type and shadowing warnings

### Fixed
- Type inference errors on `HTTPRequest.request()` calls
- Label variable shadowing in `avatar_manager.gd`, `voice_indicator.gd`, `combat_hud.gd`
- Unused parameter warnings across Godot scripts

**Commits:** `217099e`, `9c774dc`, `f90fac1`, `461dc13`, `189996b`

---

## 2026-03-24 -- Rev3 Godot GUI completeness sprint

### Added
- 15 GUI panels for the Godot client (social, economy, marketplace, guilds, achievements, events, pets, homes, photos, radio, seasonal, voice, creator, storefronts, admin)
- Panel framework and tab system
- Viewport fix for responsive window resizing
- 10 sprint planning documents

### Changed
- Rewrote README to reflect full feature set

**Commits:** `7a012ae`, `6be9d38`

---

## 2026-03-23 -- Fix WebSocket and wire Tier 3 modules

### Fixed
- WebSocket protocol mismatches between client and server
- Wired all Tier 3 client modules to backend endpoints

**Commit:** `1607768`

---

## 2026-03-23 -- Add documentation and reorganize planning

### Added
- Game manual, developer manual, and website
- Moved planning docs to `dev/` directory

### Changed
- Pruned Godot prototypes and split session flow
- Audited codebase and tightened client boundaries

**Commits:** `a3cd41d`, `c83a789`, `a1c44a7`

---

## 2026-03-22 -- Tier 3-5 features

### Added
- **Tier 5:** Voxel engine, RPG combat system, enemies, block shop
- **Tier 4:** Mobile client, creator tools, federation, NPCs, VR support
- **Tier 3:** Scripting, interactive objects, voice chat, pets, photography, media, seasonal events

**Commits:** `45256cd`, `d3c0e28`, `704cf8c`

---

## 2026-03-21 -- Tier 1-2 features

### Added
- 20+ systems across server and client: economy, marketplace, guilds, achievements, events, homes, social, parcels, presence, emotes, and more

### Changed
- Renamed project to VibeLife

**Commits:** `ffd2ee2`, `1e8e298`

---

## 2026-03-20 -- Platform features and moderation

### Added
- 20 new features: teleportation, friends, groups, currency, profiles, scripts, assets, moderation
- Region sequencing and parcel collaborators
- Shared runtime checks and asset sync
- Account auth and moderation tools
- Audit history

### Fixed
- Critical runtime issues
- Auth hardening

**Commits:** `0bc4501`, `5cf0a43`, `297712f`, `3861428`, `d883487`, `ca9c2de`, `d9d4ca1`

---

## 2026-03-19 -- Roadmap and parcel sync

### Added
- 10-step project roadmap
- Parcel ownership sync across native and debug clients
- Parcel claims, saved profiles, export presets

**Commits:** `6676665`, `08da755`, `05cee72`, `7dc6bb7`, `f58172b`

---

## 2026-03-18 -- Native client development

### Added
- Native axis handles and inventory actions
- HUD polish and gizmo feedback
- Parcel editing and animation hooks
- Build tools and avatar scenes
- Asset loading and UI panels
- Godot native client scaffold

**Commits:** `03b1db0`, `0caaba2`, `f497b2e`, `fe3e5f0`, `7041d49`, `61a9b05`

---

## 2026-03-17 -- Project foundation

### Added
- 3D client loaded from local assets
- Scene and glTF asset pipeline
- In-world object building tools
- Animated avatars and live object sync
- Avatar customization and gizmo editing
- Wearable equipment and build snapping
- Prefab building workflow
- Real-time 3D world client foundation

**Commits:** `52c221f`, `87b9ede`, `7ac8214`, `e077245`, `ed4c004`, `35adfd9`, `427abc9`, `b8525a5`
