import { getSession, listParcels, listFriends, type Session, type Parcel } from "./store.js";
import { persistence } from "./_shared-state.js";
import type { HomeRecord } from "../data/persistence.js";

export type HomePrivacy = "public" | "friends" | "private";

export type HomeData = {
  accountId: string;
  parcelId: string;
  privacy: HomePrivacy;
  setAt: string;
};

const homes = new Map<string, HomeData>();

// Doorbell cooldown: key = `${visitorAccountId}:${homeOwnerAccountId}`, value = timestamp.
// Transient rate-limit state only — intentionally kept in-memory (not durable).
const doorbellCooldowns = new Map<string, number>();
const DOORBELL_COOLDOWN_MS = 60_000;

// ── Persistence mapping (write-through cache) ───────────────────────────────

function persistHome(h: HomeData): void {
  const record: HomeRecord = { ...h };
  void persistence.saveHome(record);
}

// Hydrate cache from persistence. Called by initializeWorldStore() AFTER the
// canonical persistence layer is set, so durable data survives restarts.
export async function hydrateHomes(): Promise<void> {
  for (const record of await persistence.listAllHomes()) {
    homes.set(record.accountId, { ...record });
  }
}

export async function setHome(token: string, parcelId: string): Promise<HomeData | undefined> {
  const session = getSession(token);
  if (!session) return undefined;

  const parcels = await listParcels(session.regionId);
  const parcel = parcels.find((p) => p.id === parcelId);
  if (!parcel) return undefined;

  // Must own the parcel
  if (parcel.ownerAccountId !== session.accountId) return undefined;

  const home: HomeData = {
    accountId: session.accountId,
    parcelId,
    privacy: homes.get(session.accountId)?.privacy ?? "public",
    setAt: new Date().toISOString()
  };

  homes.set(session.accountId, home);
  persistHome(home);
  return home;
}

export function getHome(token: string): HomeData | undefined {
  const session = getSession(token);
  if (!session) return undefined;
  return homes.get(session.accountId);
}

export function clearHome(token: string): boolean {
  const session = getSession(token);
  if (!session) return false;
  const deleted = homes.delete(session.accountId);
  if (deleted) void persistence.deleteHome(session.accountId);
  return deleted;
}

export async function teleportHome(token: string): Promise<{ parcel: Parcel; regionId: string } | undefined> {
  const session = getSession(token);
  if (!session) return undefined;

  const home = homes.get(session.accountId);
  if (!home) return undefined;

  // Find the parcel across all regions to get its center
  const parcels = await listParcels(session.regionId);
  const parcel = parcels.find((p) => p.id === home.parcelId);
  if (!parcel) return undefined;

  return { parcel, regionId: parcel.regionId };
}

export function setHomePrivacy(token: string, privacy: HomePrivacy): HomeData | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const home = homes.get(session.accountId);
  if (!home) return undefined;

  home.privacy = privacy;
  homes.set(session.accountId, home);
  persistHome(home);
  return home;
}

export function getHomePrivacy(accountId: string): HomePrivacy {
  const home = homes.get(accountId);
  return home?.privacy ?? "public";
}

export function getHomeByAccountId(accountId: string): HomeData | undefined {
  return homes.get(accountId);
}

/**
 * Check if a visitor is allowed to enter a home parcel.
 * Returns { allowed, reason }.
 */
export async function checkHomeAccess(
  visitorAccountId: string,
  homeOwnerAccountId: string,
  visitorToken: string
): Promise<{ allowed: boolean; reason?: string }> {
  const home = homes.get(homeOwnerAccountId);
  if (!home) return { allowed: true };

  const privacy = home.privacy;

  if (privacy === "public") return { allowed: true };

  if (privacy === "private") {
    if (visitorAccountId === homeOwnerAccountId) return { allowed: true };
    return { allowed: false, reason: "This home is private." };
  }

  if (privacy === "friends") {
    if (visitorAccountId === homeOwnerAccountId) return { allowed: true };
    // Check if visitor is on the owner's friend list
    // We need to find a session for the owner... instead look up friends by iterating homes
    // Use the visitor's token to check if they are friends with the owner
    const friends = await listFriends(visitorToken);
    const isFriend = friends.some(
      (f) => f.friendAccountId === homeOwnerAccountId && f.status === "accepted"
    );
    if (isFriend) return { allowed: true };
    return { allowed: false, reason: "Only friends can visit this home." };
  }

  return { allowed: true };
}

/**
 * Find if a position falls inside a home parcel and return the owner info.
 */
export function findHomeParcelOwner(parcels: Parcel[], x: number, z: number): { ownerAccountId: string; parcelName: string } | undefined {
  for (const [accountId, home] of homes.entries()) {
    const parcel = parcels.find((p) => p.id === home.parcelId);
    if (!parcel) continue;
    if (x >= parcel.minX && x <= parcel.maxX && z >= parcel.minZ && z <= parcel.maxZ) {
      return { ownerAccountId: accountId, parcelName: parcel.name };
    }
  }
  return undefined;
}

/**
 * Check if a doorbell should ring (cooldown tracking).
 * Returns true if the doorbell should fire, false if still in cooldown.
 */
export function shouldRingDoorbell(visitorAccountId: string, homeOwnerAccountId: string): boolean {
  if (visitorAccountId === homeOwnerAccountId) return false;

  const key = `${visitorAccountId}:${homeOwnerAccountId}`;
  const lastRing = doorbellCooldowns.get(key) ?? 0;
  const now = Date.now();

  if (now - lastRing < DOORBELL_COOLDOWN_MS) return false;

  doorbellCooldowns.set(key, now);
  return true;
}
