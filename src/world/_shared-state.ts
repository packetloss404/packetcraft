import { randomUUID } from "node:crypto";
import {
  createPersistenceLayer,
  type AccountRecord,
  type AvatarAppearanceRecord,
  type AvatarPositionRecord,
  type InventoryItemRecord,
  type ParcelRecord,
  type RegionObjectRecord,
  type RegionRecord,
  type TeleportLandingPointRecord,
  type FriendRecord,
  type GroupRecord,
  type GroupMemberRecord,
  type CurrencyTransactionRecord,
  type OfflineMessageRecord,
  type AvatarProfileRecord,
  type BanRecord,
  type RegionNoticeRecord,
  type RegionObjectPermissionRecord,
  type ObjectScriptRecord,
  type AssetRecord,
  type MarketListingRecord,
  type TradeOfferRecord,
  type PriceHistoryRecord,
  type StorefrontRecord,
  type StorefrontRatingRecord,
  type CommissionRecord,
  type PlayerProgressRecord,
  type PetRecord,
  type PhotoRecord,
  type HomeRecord,
  type HomeRatingRecord,
  type HomeFavoriteRecord,
  type HomeVisitorCountRecord
} from "../data/persistence.js";
import type { ChatHistoryEntry, ObjectGroupContract } from "../contracts.js";

// ── Re-export persistence types as domain aliases ───────────────────────────

export type RegionSummary = RegionRecord;
export type Account = AccountRecord;
export type InventoryItem = InventoryItemRecord;
export type AvatarAppearance = AvatarAppearanceRecord;
export type Parcel = ParcelRecord;
export type RegionObject = RegionObjectRecord;
export type TeleportPoint = TeleportLandingPointRecord;
export type Friend = FriendRecord;
export type Group = GroupRecord;
export type GroupMember = GroupMemberRecord;
export type CurrencyTransaction = CurrencyTransactionRecord;
export type OfflineMessage = OfflineMessageRecord;
export type AvatarProfile = AvatarProfileRecord;
export type Ban = BanRecord;
export type RegionNotice = RegionNoticeRecord;
export type ObjectPermissions = RegionObjectPermissionRecord;
export type ObjectScript = ObjectScriptRecord;
export type Asset = AssetRecord;
export type MarketListingPersisted = MarketListingRecord;
export type TradeOfferPersisted = TradeOfferRecord;
export type PriceHistoryPersisted = PriceHistoryRecord;
export type StorefrontPersisted = StorefrontRecord;
export type StorefrontRatingPersisted = StorefrontRatingRecord;
export type CommissionPersisted = CommissionRecord;
export type PlayerProgressPersisted = PlayerProgressRecord;
export type PetPersisted = PetRecord;
export type PhotoPersisted = PhotoRecord;
export type HomePersisted = HomeRecord;
export type HomeRatingPersisted = HomeRatingRecord;
export type HomeFavoritePersisted = HomeFavoriteRecord;
export type HomeVisitorCountPersisted = HomeVisitorCountRecord;

export type BuildPermission = {
  allowed: boolean;
  parcel: Parcel | null;
  reason?: string;
};

export type Session = {
  token: string;
  accountId: string;
  avatarId: string;
  displayName: string;
  regionId: string;
  role: "resident" | "admin";
  expiresAt: number;
};

export type AvatarState = {
  avatarId: string;
  accountId: string;
  displayName: string;
  appearance: AvatarAppearance;
  x: number;
  y: number;
  z: number;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  actorAccountId: string;
  actorDisplayName: string;
  action: string;
  targetType: string;
  targetId: string;
  regionId: string | null;
  details: string;
  createdAt: string;
};

// ── Shared mutable state ────────────────────────────────────────────────────

export let persistence = await createPersistenceLayer();
export let regions: RegionSummary[] = [];
export const sessions = new Map<string, Session>();
export const avatarsByRegion = new Map<string, Map<string, AvatarState>>();
export const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export const CHAT_HISTORY_MAX = 50;
export const chatHistoryByRegion = new Map<string, ChatHistoryEntry[]>();
export const objectGroups = new Map<string, ObjectGroupContract>();

export function setPersistence(p: Awaited<ReturnType<typeof createPersistenceLayer>>) {
  persistence = p;
}

export function setRegions(r: RegionSummary[]) {
  regions = r;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

export function getSession(token: string): Session | undefined {
  const session = sessions.get(token);

  if (!session) {
    return undefined;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    avatarsByRegion.get(session.regionId)?.delete(session.avatarId);
    return undefined;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, session);
  return session;
}

export function isAdminSession(session: Session | undefined) {
  return session?.role === "admin";
}

export function getRegionPopulation(regionId: string): AvatarState[] {
  return [...(avatarsByRegion.get(regionId)?.values() ?? [])];
}

export function applyEquippedWearables(appearance: AvatarAppearance, inventory: InventoryItem[]): AvatarAppearance {
  const outfit = inventory.find((item) => item.slot === "outfit" && item.equipped && item.appearanceKey)?.appearanceKey;
  const accessory = inventory.find((item) => item.slot === "accessory" && item.equipped && item.appearanceKey)?.appearanceKey;

  return {
    ...appearance,
    outfit: outfit ?? appearance.outfit,
    accessory: accessory ?? appearance.accessory
  };
}

export function pointInParcel(parcel: Parcel, x: number, z: number) {
  return x >= parcel.minX && x <= parcel.maxX && z >= parcel.minZ && z <= parcel.maxZ;
}

export async function getBuildPermission(session: Session, x: number, z: number): Promise<BuildPermission> {
  const parcels = await persistence.listParcels(session.regionId);
  const parcel = parcels.find((entry) => pointInParcel(entry, x, z)) ?? null;

  if (!parcel) {
    return {
      allowed: false,
      parcel: null,
      reason: "builds must be placed inside a parcel"
    };
  }

  if (parcel.tier === "public") {
    return { allowed: true, parcel };
  }

  if (parcel.ownerAccountId === session.accountId) {
    return { allowed: true, parcel };
  }

  if (parcel.collaboratorAccountIds.includes(session.accountId)) {
    return { allowed: true, parcel };
  }

  if (!parcel.ownerAccountId) {
    return {
      allowed: false,
      parcel,
      reason: "claim this parcel before building here"
    };
  }

  return {
    allowed: false,
    parcel,
    reason: `parcel owned by ${parcel.ownerDisplayName ?? "another resident"}`
  };
}

/**
 * Check build permission using accountId + regionId directly (for Paper plugin calls).
 * Same logic as getBuildPermission but doesn't require a session.
 */
export async function checkBuildPermissionByAccount(accountId: string, regionId: string, x: number, z: number): Promise<BuildPermission> {
  const parcels = await persistence.listParcels(regionId);
  const parcel = parcels.find((entry) => pointInParcel(entry, x, z)) ?? null;

  if (!parcel) {
    return { allowed: false, parcel: null, reason: "builds must be placed inside a parcel" };
  }

  if (parcel.tier === "public") {
    return { allowed: true, parcel };
  }

  if (parcel.ownerAccountId === accountId) {
    return { allowed: true, parcel };
  }

  if (parcel.collaboratorAccountIds.includes(accountId)) {
    return { allowed: true, parcel };
  }

  if (!parcel.ownerAccountId) {
    return { allowed: false, parcel, reason: "claim this parcel before building here" };
  }

  return { allowed: false, parcel, reason: `parcel owned by ${parcel.ownerDisplayName ?? "another resident"}` };
}

export function getChatHistoryBuffer(regionId: string): ChatHistoryEntry[] {
  let buffer = chatHistoryByRegion.get(regionId);
  if (!buffer) {
    buffer = [];
    chatHistoryByRegion.set(regionId, buffer);
  }
  return buffer;
}

export function pushChatHistory(regionId: string, entry: ChatHistoryEntry): void {
  const buffer = getChatHistoryBuffer(regionId);
  buffer.push(entry);
  if (buffer.length > CHAT_HISTORY_MAX) {
    buffer.shift();
  }
}

export async function appendAuditLog(token: string, action: string, targetType: string, targetId: string, details: string, regionId: string | null) {
  const session = getSession(token);

  if (!session) {
    return;
  }

  await persistence.appendAuditLog({
    id: randomUUID(),
    actorAccountId: session.accountId,
    actorDisplayName: session.displayName,
    action,
    targetType,
    targetId,
    regionId,
    details,
    createdAt: new Date().toISOString()
  });
}
