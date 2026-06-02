import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

export type RegionBiome = {
  fogColor: string;
  fogDensity: number;
  ambientColor: string;
  ambientEnergy: number;
  sunColor: string;
  sunEnergy: number;
  skyTint: string;
  terrainColors: { grass: string; dirt: string; sand: string; stone: string };
  particleType: string;
  weatherType: string;
  musicGenre: string;
};

export type RegionRecord = {
  id: string;
  name: string;
  capacity: number;
  terrain: string;
  mood: string;
  themeColor: string;
  biome: RegionBiome;
};

export type AccountRecord = {
  id: string;
  displayName: string;
  kind: "guest" | "registered";
  role: "resident" | "admin";
  createdAt: string;
  mcUuid?: string;
};

export type AccountAuthRecord = AccountRecord & {
  passwordHash: string | null;
};

export type AuditLogRecord = {
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

export type TeleportLandingPointRecord = {
  id: string;
  accountId: string;
  regionId: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  createdAt: string;
};

export type FriendRecord = {
  id: string;
  accountId: string;
  friendAccountId: string;
  friendDisplayName: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: string;
};

export type GroupRecord = {
  id: string;
  name: string;
  description: string;
  founderAccountId: string;
  createdAt: string;
};

export type GroupMemberRecord = {
  groupId: string;
  accountId: string;
  displayName: string;
  role: "member" | "officer" | "owner";
  joinedAt: string;
};

export type CurrencyTransactionRecord = {
  id: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  amount: number;
  type: "gift" | "purchase" | "sale" | "bonus" | "region_tax" | "loot" | "death_penalty";
  description: string;
  createdAt: string;
};

export type OfflineMessageRecord = {
  id: string;
  fromAccountId: string;
  fromDisplayName: string;
  toAccountId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type AvatarProfileRecord = {
  accountId: string;
  bio: string;
  imageUrl: string | null;
  worldVisits: number;
  totalTime: number;
  createdAt: string;
  updatedAt: string;
};

export type BanRecord = {
  id: string;
  accountId: string;
  bannedBy: string;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
};

export type RegionNoticeRecord = {
  id: string;
  regionId: string;
  parcelId: string | null;
  message: string;
  createdBy: string;
  createdAt: string;
};

export type RegionObjectPermissionRecord = {
  objectId: string;
  allowCopy: boolean;
  allowModify: boolean;
  allowTransfer: boolean;
};

export type ObjectScriptRecord = {
  id: string;
  objectId: string;
  scriptName: string;
  scriptCode: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssetRecord = {
  id: string;
  accountId: string;
  name: string;
  description: string;
  assetType: string;
  url: string;
  thumbnailUrl: string | null;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type MarketListingRecord = {
  id: string;
  sellerAccountId: string;
  sellerDisplayName: string;
  itemId: string;
  itemName: string;
  itemKind: string;
  price: number;
  listingType: "fixed" | "auction";
  currentBid: number | null;
  currentBidder: string | null;
  currentBidderName: string | null;
  minBid: number | null;
  auctionEndTime: string | null;
  createdAt: string;
  status: "active" | "sold" | "expired" | "cancelled";
};

export type TradeOfferRecord = {
  id: string;
  fromAccountId: string;
  fromDisplayName: string;
  toAccountId: string;
  toDisplayName: string;
  offeredItems: string[];
  offeredCurrency: number;
  requestedItems: string[];
  requestedCurrency: number;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
};

export type PriceHistoryRecord = {
  id: string;
  itemName: string;
  price: number;
  soldAt: string;
};

export type StorefrontRecord = {
  id: string;
  accountId: string;
  displayName: string;
  shopName: string;
  description: string;
  bannerColor: string;
  featured: boolean;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  createdAt: string;
};

export type StorefrontRatingRecord = {
  accountId: string;
  storefrontAccountId: string;
  rating: number;
};

export type CommissionRecord = {
  id: string;
  clientAccountId: string;
  clientDisplayName: string;
  builderAccountId: string;
  builderDisplayName: string;
  description: string;
  budget: number;
  status: "open" | "accepted" | "in_progress" | "delivered" | "completed" | "cancelled";
  createdAt: string;
  completedAt: string | null;
};

export type PlayerProgressRecord = {
  accountId: string;
  data: unknown;
};

export type AvatarAppearanceRecord = {
  accountId: string;
  bodyColor: string;
  accentColor: string;
  headColor: string;
  hairColor: string;
  outfit: string;
  accessory: string;
  updatedAt: string;
};

export type InventoryItemRecord = {
  id: string;
  accountId: string;
  name: string;
  kind: string;
  slot: string | null;
  appearanceKey: string | null;
  equipped: boolean;
  rarity: string;
  createdAt: string;
};

export type AvatarPositionRecord = {
  accountId: string;
  regionId: string;
  x: number;
  y: number;
  z: number;
  updatedAt: string;
};

export type ParcelRecord = {
  id: string;
  regionId: string;
  name: string;
  ownerAccountId: string | null;
  ownerDisplayName: string | null;
  collaboratorAccountIds: string[];
  collaboratorDisplayNames: string[];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  tier: string;
};

async function mapParcelCollaborators(pool: pg.Pool, parcelId: string) {
  const result = await pool.query<{ account_id: string; display_name: string }>(
    `
      SELECT parcel_collaborators.account_id, accounts.display_name
      FROM parcel_collaborators
      JOIN accounts ON accounts.id = parcel_collaborators.account_id
      WHERE parcel_collaborators.parcel_id = $1
      ORDER BY accounts.display_name ASC
    `,
    [parcelId]
  );

  return {
    collaboratorAccountIds: result.rows.map((row) => row.account_id),
    collaboratorDisplayNames: result.rows.map((row) => row.display_name)
  };
}

export type RegionObjectRecord = {
  id: string;
  regionId: string;
  ownerAccountId: string;
  ownerDisplayName: string | null;
  asset: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
  createdAt: string;
  updatedAt: string;
};

export type PersistenceLayer = {
  mode: "memory" | "postgres";
  listRegions(): Promise<RegionRecord[]>;
  getOrCreateGuestAccount(displayName: string): Promise<{ account: AccountRecord; isNew: boolean }>;
  registerAccount(displayName: string, passwordHash: string, role: "resident" | "admin"): Promise<{ account: AccountRecord; isNew: boolean }>;
  authenticateAccount(displayName: string): Promise<AccountAuthRecord | undefined>;
  getAccountByMcUuid(mcUuid: string): Promise<AccountRecord | undefined>;
  getOrCreateMcAccount(mcUuid: string, mcUsername: string): Promise<{ account: AccountRecord; isNew: boolean }>;
  linkMcUuid(accountId: string, mcUuid: string): Promise<boolean>;
  getInventory(accountId: string): Promise<InventoryItemRecord[]>;
  equipInventoryItem(accountId: string, itemId: string): Promise<InventoryItemRecord[]>;
  getAvatarAppearance(accountId: string): Promise<AvatarAppearanceRecord>;
  saveAvatarAppearance(appearance: AvatarAppearanceRecord): Promise<AvatarAppearanceRecord>;
  getAvatarPosition(accountId: string, regionId: string): Promise<AvatarPositionRecord | undefined>;
  saveAvatarPosition(position: AvatarPositionRecord): Promise<void>;
  listParcels(regionId: string): Promise<ParcelRecord[]>;
  claimParcel(parcelId: string, accountId: string): Promise<ParcelRecord | undefined>;
  releaseParcel(parcelId: string, accountId: string): Promise<ParcelRecord | undefined>;
  reassignParcel(parcelId: string, ownerAccountId: string | null): Promise<ParcelRecord | undefined>;
  addParcelCollaborator(parcelId: string, ownerAccountId: string, collaboratorAccountId: string): Promise<ParcelRecord | undefined>;
  removeParcelCollaborator(parcelId: string, ownerAccountId: string, collaboratorAccountId: string): Promise<ParcelRecord | undefined>;
  listRegionObjects(regionId: string): Promise<RegionObjectRecord[]>;
  createRegionObject(object: Omit<RegionObjectRecord, "ownerDisplayName">): Promise<RegionObjectRecord>;
  updateRegionObject(objectId: string, ownerAccountId: string, updates: Pick<RegionObjectRecord, "x" | "y" | "z" | "rotationY" | "scale" | "updatedAt">): Promise<RegionObjectRecord | undefined>;
  deleteRegionObject(objectId: string, ownerAccountId: string): Promise<boolean>;
  adminDeleteRegionObject(objectId: string): Promise<boolean>;
  appendAuditLog(entry: AuditLogRecord): Promise<void>;
  listAuditLogs(limit: number): Promise<AuditLogRecord[]>;
  listTeleportPoints(accountId: string): Promise<TeleportLandingPointRecord[]>;
  createTeleportPoint(point: Omit<TeleportLandingPointRecord, "id" | "createdAt">): Promise<TeleportLandingPointRecord>;
  deleteTeleportPoint(pointId: string, accountId: string): Promise<boolean>;
  listFriends(accountId: string): Promise<FriendRecord[]>;
  addFriend(friend: Omit<FriendRecord, "id" | "createdAt">): Promise<FriendRecord>;
  removeFriend(accountId: string, friendAccountId: string): Promise<boolean>;
  blockAccount(accountId: string, blockedAccountId: string): Promise<FriendRecord>;
  unblockAccount(accountId: string, blockedAccountId: string): Promise<boolean>;
  listGroups(accountId: string): Promise<GroupRecord[]>;
  createGroup(group: Omit<GroupRecord, "id" | "createdAt">): Promise<GroupRecord>;
  getGroupMembers(groupId: string): Promise<GroupMemberRecord[]>;
  addGroupMember(member: GroupMemberRecord): Promise<void>;
  removeGroupMember(groupId: string, accountId: string): Promise<boolean>;
  updateGroupMemberRole(groupId: string, accountId: string, role: "member" | "officer" | "owner"): Promise<void>;
  getCurrencyBalance(accountId: string): Promise<number>;
  addCurrency(transaction: Omit<CurrencyTransactionRecord, "id" | "createdAt">): Promise<number>;
  listCurrencyTransactions(accountId: string, limit: number): Promise<CurrencyTransactionRecord[]>;
  sendOfflineMessage(message: Omit<OfflineMessageRecord, "id" | "createdAt">): Promise<OfflineMessageRecord>;
  listOfflineMessages(accountId: string, limit: number): Promise<OfflineMessageRecord[]>;
  markOfflineMessageRead(messageId: string, accountId: string): Promise<boolean>;
  getAvatarProfile(accountId: string): Promise<AvatarProfileRecord | undefined>;
  saveAvatarProfile(profile: AvatarProfileRecord): Promise<AvatarProfileRecord>;
  banAccount(ban: Omit<BanRecord, "id" | "createdAt">): Promise<BanRecord>;
  unbanAccount(accountId: string): Promise<boolean>;
  getActiveBan(accountId: string): Promise<BanRecord | undefined>;
  listRegionNotices(regionId: string): Promise<RegionNoticeRecord[]>;
  createRegionNotice(notice: Omit<RegionNoticeRecord, "id" | "createdAt">): Promise<RegionNoticeRecord>;
  deleteRegionNotice(noticeId: string, regionId: string): Promise<boolean>;
  getObjectPermissions(objectId: string): Promise<RegionObjectPermissionRecord | undefined>;
  saveObjectPermissions(perms: RegionObjectPermissionRecord): Promise<void>;
  listObjectScripts(objectId: string): Promise<ObjectScriptRecord[]>;
  createObjectScript(script: Omit<ObjectScriptRecord, "id" | "createdAt" | "updatedAt">): Promise<ObjectScriptRecord>;
  updateObjectScript(scriptId: string, accountId: string, scriptCode: string, enabled: boolean): Promise<ObjectScriptRecord | undefined>;
  deleteObjectScript(scriptId: string, accountId: string): Promise<boolean>;
  listAssets(accountId: string): Promise<AssetRecord[]>;
  createAsset(asset: Omit<AssetRecord, "id" | "createdAt" | "updatedAt">): Promise<AssetRecord>;
  deleteAsset(assetId: string, accountId: string): Promise<boolean>;
  // Marketplace
  listAllMarketListings(): Promise<MarketListingRecord[]>;
  saveMarketListing(listing: MarketListingRecord): Promise<void>;
  listAllTradeOffers(): Promise<TradeOfferRecord[]>;
  saveTradeOffer(trade: TradeOfferRecord): Promise<void>;
  listAllPriceHistory(): Promise<PriceHistoryRecord[]>;
  appendPriceHistory(entry: Omit<PriceHistoryRecord, "id">): Promise<PriceHistoryRecord>;
  // Storefronts
  listAllStorefronts(): Promise<StorefrontRecord[]>;
  saveStorefront(storefront: StorefrontRecord): Promise<void>;
  listAllStorefrontRatings(): Promise<StorefrontRatingRecord[]>;
  saveStorefrontRating(rating: StorefrontRatingRecord): Promise<void>;
  listAllCommissions(): Promise<CommissionRecord[]>;
  saveCommission(commission: CommissionRecord): Promise<void>;
  // Achievements / player progress
  listAllPlayerProgress(): Promise<PlayerProgressRecord[]>;
  savePlayerProgress(progress: PlayerProgressRecord): Promise<void>;
};

const seededRegions: RegionRecord[] = [
  {
    id: "aurora-docks",
    name: "Aurora Docks",
    capacity: 80,
    terrain: "floating harbor",
    mood: "social",
    themeColor: "#66ffd1",
    biome: {
      fogColor: "#ff8844",
      fogDensity: 0.008,
      ambientColor: "#ffcc88",
      ambientEnergy: 0.6,
      sunColor: "#ffaa55",
      sunEnergy: 1.2,
      skyTint: "#ff9966",
      terrainColors: { grass: "#8ba86a", dirt: "#a07850", sand: "#d4b078", stone: "#7a7068" },
      particleType: "fireflies",
      weatherType: "clear",
      musicGenre: "lo-fi chill"
    }
  },
  {
    id: "glass-garden",
    name: "Glass Garden",
    capacity: 50,
    terrain: "botanical sky dome",
    mood: "relaxed",
    themeColor: "#ffb36a",
    biome: {
      fogColor: "#aaccaa",
      fogDensity: 0.02,
      ambientColor: "#88cc88",
      ambientEnergy: 0.8,
      sunColor: "#ffffee",
      sunEnergy: 0.9,
      skyTint: "#cceecc",
      terrainColors: { grass: "#4da060", dirt: "#6b5040", sand: "#b8a878", stone: "#607860" },
      particleType: "leaves",
      weatherType: "foggy",
      musicGenre: "ambient nature"
    }
  },
  {
    id: "neon-district",
    name: "Neon District",
    capacity: 100,
    terrain: "urban grid",
    mood: "energetic",
    themeColor: "#ee44ff",
    biome: {
      fogColor: "#1a0a2e",
      fogDensity: 0.015,
      ambientColor: "#9944cc",
      ambientEnergy: 0.4,
      sunColor: "#cc88ff",
      sunEnergy: 0.3,
      skyTint: "#2a1040",
      terrainColors: { grass: "#2a2040", dirt: "#1a1028", sand: "#3a2850", stone: "#0e0818" },
      particleType: "rain",
      weatherType: "rainy",
      musicGenre: "synthwave"
    }
  },
  {
    id: "cloud-summit",
    name: "Cloud Summit",
    capacity: 60,
    terrain: "mountain peak",
    mood: "adventurous",
    themeColor: "#88ccff",
    biome: {
      fogColor: "#c8d8ee",
      fogDensity: 0.025,
      ambientColor: "#aabbdd",
      ambientEnergy: 0.7,
      sunColor: "#eeeeff",
      sunEnergy: 1.4,
      skyTint: "#aaccff",
      terrainColors: { grass: "#6a8870", dirt: "#8a7860", sand: "#c0b898", stone: "#8898a8" },
      particleType: "dust",
      weatherType: "windy",
      musicGenre: "orchestral"
    }
  },
  {
    id: "cozy-village",
    name: "Cozy Village",
    capacity: 40,
    terrain: "autumn town",
    mood: "cozy",
    themeColor: "#ffaa44",
    biome: {
      fogColor: "#dda866",
      fogDensity: 0.012,
      ambientColor: "#ddaa77",
      ambientEnergy: 0.65,
      sunColor: "#ffcc88",
      sunEnergy: 1.0,
      skyTint: "#eebb88",
      terrainColors: { grass: "#aa8844", dirt: "#886040", sand: "#ccaa70", stone: "#887768" },
      particleType: "leaves",
      weatherType: "clear",
      musicGenre: "acoustic folk"
    }
  },
  {
    id: "zen-retreat",
    name: "Zen Retreat",
    capacity: 30,
    terrain: "japanese garden",
    mood: "peaceful",
    themeColor: "#ffbbcc",
    biome: {
      fogColor: "#eeddee",
      fogDensity: 0.01,
      ambientColor: "#ddccdd",
      ambientEnergy: 0.75,
      sunColor: "#fff5ee",
      sunEnergy: 1.1,
      skyTint: "#eeddee",
      terrainColors: { grass: "#6a9a60", dirt: "#7a6050", sand: "#d8c8a0", stone: "#9a9088" },
      particleType: "cherry_blossoms",
      weatherType: "clear",
      musicGenre: "zen ambient"
    }
  }
];

const seededParcels: Omit<ParcelRecord, "ownerDisplayName">[] = [
  {
    id: "aurora-landing",
    regionId: "aurora-docks",
    name: "Landing Strip",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -10,
    maxX: 10,
    minZ: -10,
    maxZ: 10,
    tier: "public"
  },
  {
    id: "aurora-east-pier",
    regionId: "aurora-docks",
    name: "East Pier",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: 10,
    maxX: 28,
    minZ: -16,
    maxZ: 12,
    tier: "homestead"
  },
  {
    id: "glass-orchard",
    regionId: "glass-garden",
    name: "Orchard Ring",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -18,
    maxX: 4,
    minZ: -12,
    maxZ: 16,
    tier: "homestead"
  },
  {
    id: "glass-overlook",
    regionId: "glass-garden",
    name: "Sky Overlook",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: 4,
    maxX: 22,
    minZ: -18,
    maxZ: 10,
    tier: "premium"
  },
  {
    id: "neon-central",
    regionId: "neon-district",
    name: "Central Plaza",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -12,
    maxX: 12,
    minZ: -12,
    maxZ: 12,
    tier: "public"
  },
  {
    id: "neon-alley",
    regionId: "neon-district",
    name: "Neon Alley",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: 12,
    maxX: 26,
    minZ: -20,
    maxZ: 8,
    tier: "homestead"
  },
  {
    id: "cloud-peak",
    regionId: "cloud-summit",
    name: "Summit Peak",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -10,
    maxX: 10,
    minZ: -10,
    maxZ: 10,
    tier: "public"
  },
  {
    id: "cloud-ridge",
    regionId: "cloud-summit",
    name: "Wind Ridge",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -24,
    maxX: -6,
    minZ: -16,
    maxZ: 14,
    tier: "homestead"
  },
  {
    id: "village-square",
    regionId: "cozy-village",
    name: "Village Square",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -8,
    maxX: 8,
    minZ: -8,
    maxZ: 8,
    tier: "public"
  },
  {
    id: "village-cottage-row",
    regionId: "cozy-village",
    name: "Cottage Row",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: 8,
    maxX: 24,
    minZ: -14,
    maxZ: 14,
    tier: "homestead"
  },
  {
    id: "zen-pond",
    regionId: "zen-retreat",
    name: "Koi Pond Garden",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -10,
    maxX: 10,
    minZ: -10,
    maxZ: 10,
    tier: "public"
  },
  {
    id: "zen-grove",
    regionId: "zen-retreat",
    name: "Cherry Blossom Grove",
    ownerAccountId: null,
    collaboratorAccountIds: [],
    collaboratorDisplayNames: [],
    minX: -22,
    maxX: -4,
    minZ: -16,
    maxZ: 12,
    tier: "homestead"
  }
];

const starterInventory = [
  { name: "Voyager Coat", kind: "wearable", slot: "outfit", appearanceKey: "voyager", equipped: true, rarity: "common" },
  { name: "Pilot Jacket", kind: "wearable", slot: "outfit", appearanceKey: "pilot", equipped: false, rarity: "uncommon" },
  { name: "Formal Sash", kind: "wearable", slot: "outfit", appearanceKey: "formal", equipped: false, rarity: "rare" },
  { name: "Visor", kind: "wearable", slot: "accessory", appearanceKey: "visor", equipped: false, rarity: "common" },
  { name: "Cape", kind: "wearable", slot: "accessory", appearanceKey: "cape", equipped: false, rarity: "uncommon" },
  { name: "Utility Pack", kind: "wearable", slot: "accessory", appearanceKey: "pack", equipped: false, rarity: "common" },
  { name: "Starter Flight Band", kind: "wearable", slot: null, appearanceKey: null, equipped: false, rarity: "common" },
  { name: "Parcel Builder Wand", kind: "tool", slot: null, appearanceKey: null, equipped: false, rarity: "uncommon" },
  { name: "Welcome Drone Companion", kind: "pet", slot: null, appearanceKey: null, equipped: false, rarity: "rare" }
];

function createDefaultAppearance(accountId: string): AvatarAppearanceRecord {
  return {
    accountId,
    bodyColor: "#8cd8ff",
    accentColor: "#17323f",
    headColor: "#f2c7a8",
    hairColor: "#1b1d27",
    outfit: "voyager",
    accessory: "none",
    updatedAt: new Date().toISOString()
  };
}

function normalizeDisplayName(displayName: string) {
  return displayName.trim().toLowerCase().replace(/\s+/g, " ");
}

function createStarterPosition(accountId: string, regionId: string): AvatarPositionRecord {
  return {
    accountId,
    regionId,
    x: Number((Math.random() * 32 - 16).toFixed(2)),
    y: 0,
    z: Number((Math.random() * 32 - 16).toFixed(2)),
    updatedAt: new Date().toISOString()
  };
}

function createMemoryPersistence(): PersistenceLayer {
  const accountsById = new Map<string, AccountRecord>();
  const accountIdsByName = new Map<string, string>();
  const accountIdsByMcUuid = new Map<string, string>();
  const passwordHashesById = new Map<string, string | null>();
  const inventory = new Map<string, InventoryItemRecord[]>();
  const appearances = new Map<string, AvatarAppearanceRecord>();
  const positions = new Map<string, AvatarPositionRecord>();
  const parcels = new Map<string, ParcelRecord>(
    seededParcels.map((parcel) => [parcel.id, { ...parcel, ownerDisplayName: null, collaboratorAccountIds: [], collaboratorDisplayNames: [] }])
  );
  const regionObjects = new Map<string, RegionObjectRecord>();
  const auditLogs: AuditLogRecord[] = [];
  const teleportPoints = new Map<string, TeleportLandingPointRecord>();
  const friends = new Map<string, FriendRecord>();
  const groups = new Map<string, GroupRecord>();
  const groupMembers = new Map<string, GroupMemberRecord[]>();
  const currencyBalances = new Map<string, number>();
  const currencyTransactions: CurrencyTransactionRecord[] = [];
  const offlineMessages = new Map<string, OfflineMessageRecord[]>();
  const profiles = new Map<string, AvatarProfileRecord>();
  const bans = new Map<string, BanRecord>();
  const regionNotices = new Map<string, RegionNoticeRecord[]>();
  const objectPermissions = new Map<string, RegionObjectPermissionRecord>();
  const objectScripts = new Map<string, ObjectScriptRecord>();
  const assets = new Map<string, AssetRecord>();
  const marketListings = new Map<string, MarketListingRecord>();
  const tradeOffers = new Map<string, TradeOfferRecord>();
  const priceHistory: PriceHistoryRecord[] = [];
  const storefronts = new Map<string, StorefrontRecord>();
  const storefrontRatings = new Map<string, StorefrontRatingRecord>();
  const commissions = new Map<string, CommissionRecord>();
  const playerProgress = new Map<string, PlayerProgressRecord>();
  const ratingKey = (accountId: string, storefrontAccountId: string) => `${accountId}::${storefrontAccountId}`;
  return {
    mode: "memory",
    async listRegions() {
      return seededRegions;
    },
    async getOrCreateGuestAccount(displayName) {
      const key = normalizeDisplayName(displayName);
      const existingId = accountIdsByName.get(key);

      if (existingId) {
        return { account: accountsById.get(existingId) as AccountRecord, isNew: false };
      }

      const account: AccountRecord = {
        id: randomUUID(),
        displayName,
        kind: "guest",
        role: "resident",
        createdAt: new Date().toISOString()
      };

      accountsById.set(account.id, account);
      accountIdsByName.set(key, account.id);
      passwordHashesById.set(account.id, null);
      inventory.set(
        account.id,
        starterInventory.map((item) => ({
          id: randomUUID(),
          accountId: account.id,
          name: item.name,
          kind: item.kind,
          slot: item.slot,
          appearanceKey: item.appearanceKey,
          equipped: item.equipped,
          rarity: item.rarity,
          createdAt: new Date().toISOString()
        }))
      );
      appearances.set(account.id, createDefaultAppearance(account.id));

      return { account, isNew: true };
    },
    async registerAccount(displayName, passwordHash, role) {
      const key = normalizeDisplayName(displayName);
      const existingId = accountIdsByName.get(key);

      if (existingId) {
        return { account: accountsById.get(existingId) as AccountRecord, isNew: false };
      }

      const account: AccountRecord = {
        id: randomUUID(),
        displayName,
        kind: "registered",
        role,
        createdAt: new Date().toISOString()
      };

      accountsById.set(account.id, account);
      accountIdsByName.set(key, account.id);
      passwordHashesById.set(account.id, passwordHash);
      inventory.set(
        account.id,
        starterInventory.map((item) => ({
          id: randomUUID(),
          accountId: account.id,
          name: item.name,
          kind: item.kind,
          slot: item.slot,
          appearanceKey: item.appearanceKey,
          equipped: item.equipped,
          rarity: item.rarity,
          createdAt: new Date().toISOString()
        }))
      );
      appearances.set(account.id, createDefaultAppearance(account.id));

      return { account, isNew: true };
    },
    async authenticateAccount(displayName) {
      const key = normalizeDisplayName(displayName);
      const existingId = accountIdsByName.get(key);

      if (!existingId) {
        return undefined;
      }

      const account = accountsById.get(existingId);
      return account?.kind === "registered"
        ? { ...account, passwordHash: passwordHashesById.get(existingId) ?? null }
        : undefined;
    },
    async getAccountByMcUuid(mcUuid) {
      const accountId = accountIdsByMcUuid.get(mcUuid);
      return accountId ? accountsById.get(accountId) : undefined;
    },
    async getOrCreateMcAccount(mcUuid, mcUsername) {
      const existingId = accountIdsByMcUuid.get(mcUuid);
      if (existingId) {
        return { account: accountsById.get(existingId) as AccountRecord, isNew: false };
      }

      const account: AccountRecord = {
        id: randomUUID(),
        displayName: mcUsername,
        kind: "registered",
        role: "resident",
        createdAt: new Date().toISOString(),
        mcUuid
      };

      accountsById.set(account.id, account);
      accountIdsByName.set(normalizeDisplayName(mcUsername), account.id);
      accountIdsByMcUuid.set(mcUuid, account.id);
      passwordHashesById.set(account.id, null);
      inventory.set(
        account.id,
        starterInventory.map((item) => ({
          id: randomUUID(),
          accountId: account.id,
          name: item.name,
          kind: item.kind,
          slot: item.slot,
          appearanceKey: item.appearanceKey,
          equipped: item.equipped,
          rarity: item.rarity,
          createdAt: new Date().toISOString()
        }))
      );
      appearances.set(account.id, createDefaultAppearance(account.id));

      return { account, isNew: true };
    },
    async linkMcUuid(accountId, mcUuid) {
      const account = accountsById.get(accountId);
      if (!account) return false;

      // Remove old mapping if this UUID was linked elsewhere
      for (const [uuid, id] of accountIdsByMcUuid) {
        if (id === accountId) { accountIdsByMcUuid.delete(uuid); break; }
      }

      account.mcUuid = mcUuid;
      accountIdsByMcUuid.set(mcUuid, accountId);
      return true;
    },
    async getInventory(accountId) {
      return inventory.get(accountId) ?? [];
    },
    async equipInventoryItem(accountId, itemId) {
      const items = inventory.get(accountId) ?? [];
      const target = items.find((item) => item.id === itemId);

      if (!target || !target.slot) {
        return items;
      }

      const nextItems = items.map((item) => {
        if (item.slot !== target.slot) {
          return item;
        }

        return {
          ...item,
          equipped: item.id === itemId
        };
      });

      inventory.set(accountId, nextItems);
      return nextItems;
    },
    async getAvatarAppearance(accountId) {
      if (!appearances.has(accountId)) {
        appearances.set(accountId, createDefaultAppearance(accountId));
      }

      return appearances.get(accountId) as AvatarAppearanceRecord;
    },
    async saveAvatarAppearance(appearance) {
      appearances.set(appearance.accountId, appearance);
      return appearance;
    },
    async getAvatarPosition(accountId, regionId) {
      return positions.get(`${accountId}:${regionId}`);
    },
    async saveAvatarPosition(position) {
      positions.set(`${position.accountId}:${position.regionId}`, position);
    },
    async listParcels(regionId) {
      return [...parcels.values()].filter((parcel) => parcel.regionId === regionId);
    },
    async claimParcel(parcelId, accountId) {
      const parcel = parcels.get(parcelId);
      const account = accountsById.get(accountId);

      if (!parcel || !account || (parcel.ownerAccountId && parcel.ownerAccountId !== accountId)) {
        return undefined;
      }

      const updatedParcel: ParcelRecord = {
        ...parcel,
        ownerAccountId: accountId,
        ownerDisplayName: account.displayName,
        collaboratorAccountIds: [],
        collaboratorDisplayNames: []
      };

      parcels.set(parcelId, updatedParcel);
      return updatedParcel;
    },
    async releaseParcel(parcelId, accountId) {
      const parcel = parcels.get(parcelId);

      if (!parcel || parcel.ownerAccountId !== accountId) {
        return undefined;
      }

      const updatedParcel: ParcelRecord = {
        ...parcel,
        ownerAccountId: null,
        ownerDisplayName: null,
        collaboratorAccountIds: [],
        collaboratorDisplayNames: []
      };

      parcels.set(parcelId, updatedParcel);
      return updatedParcel;
    },
    async reassignParcel(parcelId, ownerAccountId) {
      const parcel = parcels.get(parcelId);

      if (!parcel) {
        return undefined;
      }

      const owner = ownerAccountId ? accountsById.get(ownerAccountId) : null;
      const updatedParcel: ParcelRecord = {
        ...parcel,
        ownerAccountId,
        ownerDisplayName: owner?.displayName ?? null,
        collaboratorAccountIds: [],
        collaboratorDisplayNames: []
      };

      parcels.set(parcelId, updatedParcel);
      return updatedParcel;
    },
    async addParcelCollaborator(parcelId, ownerAccountId, collaboratorAccountId) {
      const parcel = parcels.get(parcelId);
      const collaborator = accountsById.get(collaboratorAccountId);

      if (!parcel || parcel.ownerAccountId !== ownerAccountId || !collaborator) {
        return undefined;
      }

      const ids = [...new Set([...parcel.collaboratorAccountIds, collaboratorAccountId])];
      const names = ids.map((id) => accountsById.get(id)?.displayName).filter(Boolean) as string[];
      const updatedParcel: ParcelRecord = { ...parcel, collaboratorAccountIds: ids, collaboratorDisplayNames: names };
      parcels.set(parcelId, updatedParcel);
      return updatedParcel;
    },
    async removeParcelCollaborator(parcelId, ownerAccountId, collaboratorAccountId) {
      const parcel = parcels.get(parcelId);

      if (!parcel || parcel.ownerAccountId !== ownerAccountId) {
        return undefined;
      }

      const ids = parcel.collaboratorAccountIds.filter((id) => id !== collaboratorAccountId);
      const names = ids.map((id) => accountsById.get(id)?.displayName).filter(Boolean) as string[];
      const updatedParcel: ParcelRecord = { ...parcel, collaboratorAccountIds: ids, collaboratorDisplayNames: names };
      parcels.set(parcelId, updatedParcel);
      return updatedParcel;
    },
    async listRegionObjects(regionId) {
      return [...regionObjects.values()].filter((item) => item.regionId === regionId);
    },
    async createRegionObject(object) {
      const owner = accountsById.get(object.ownerAccountId);
      const record: RegionObjectRecord = {
        ...object,
        ownerDisplayName: owner?.displayName ?? null
      };
      regionObjects.set(record.id, record);
      return record;
    },
    async updateRegionObject(objectId, ownerAccountId, updates) {
      const current = regionObjects.get(objectId);
      if (!current || current.ownerAccountId !== ownerAccountId) {
        return undefined;
      }

      const next = { ...current, ...updates };
      regionObjects.set(objectId, next);
      return next;
    },
    async deleteRegionObject(objectId, ownerAccountId) {
      const current = regionObjects.get(objectId);
      if (!current || current.ownerAccountId !== ownerAccountId) {
        return false;
      }

      regionObjects.delete(objectId);
      return true;
    },
    async adminDeleteRegionObject(objectId) {
      return regionObjects.delete(objectId);
    },
    async appendAuditLog(entry) {
      auditLogs.unshift(entry);
    },
    async listAuditLogs(limit) {
      return auditLogs.slice(0, limit);
    },
    async listTeleportPoints(accountId) {
      return [...teleportPoints.values()].filter((p) => p.accountId === accountId);
    },
    async createTeleportPoint(point) {
      const record: TeleportLandingPointRecord = {
        id: randomUUID(),
        ...point,
        createdAt: new Date().toISOString()
      };
      teleportPoints.set(record.id, record);
      return record;
    },
    async deleteTeleportPoint(pointId, accountId) {
      const point = teleportPoints.get(pointId);
      if (!point || point.accountId !== accountId) return false;
      return teleportPoints.delete(pointId);
    },
    async listFriends(accountId) {
      return [...friends.values()].filter((f) => f.accountId === accountId);
    },
    async addFriend(friend) {
      const record: FriendRecord = {
        id: randomUUID(),
        ...friend,
        createdAt: new Date().toISOString()
      };
      friends.set(record.id, record);
      return record;
    },
    async removeFriend(accountId, friendAccountId) {
      const entry = [...friends.values()].find((f) => f.accountId === accountId && f.friendAccountId === friendAccountId);
      if (!entry) return false;
      return friends.delete(entry.id);
    },
    async blockAccount(accountId, blockedAccountId) {
      const blocked = accountsById.get(blockedAccountId);
      const record: FriendRecord = {
        id: randomUUID(),
        accountId,
        friendAccountId: blockedAccountId,
        friendDisplayName: blocked?.displayName ?? "Unknown",
        status: "blocked",
        createdAt: new Date().toISOString()
      };
      friends.set(record.id, record);
      return record;
    },
    async unblockAccount(accountId, blockedAccountId) {
      const entry = [...friends.values()].find((f) => f.accountId === accountId && f.friendAccountId === blockedAccountId && f.status === "blocked");
      if (!entry) return false;
      return friends.delete(entry.id);
    },
    async listGroups(accountId) {
      const memberGroups = [...groupMembers.entries()].filter(([, members]) => members.some((m) => m.accountId === accountId));
      return memberGroups.map(([groupId]) => groups.get(groupId)).filter(Boolean) as GroupRecord[];
    },
    async createGroup(group) {
      const record: GroupRecord = {
        id: randomUUID(),
        ...group,
        createdAt: new Date().toISOString()
      };
      groups.set(record.id, record);
      groupMembers.set(record.id, [{
        groupId: record.id,
        accountId: group.founderAccountId,
        displayName: accountsById.get(group.founderAccountId)?.displayName ?? "Unknown",
        role: "owner",
        joinedAt: new Date().toISOString()
      }]);
      return record;
    },
    async getGroupMembers(groupId) {
      return groupMembers.get(groupId) ?? [];
    },
    async addGroupMember(member) {
      const existing = groupMembers.get(member.groupId) ?? [];
      if (existing.some((m) => m.accountId === member.accountId)) return;
      existing.push(member);
      groupMembers.set(member.groupId, existing);
    },
    async removeGroupMember(groupId, accountId) {
      const existing = groupMembers.get(groupId) ?? [];
      const filtered = existing.filter((m) => m.accountId !== accountId);
      if (filtered.length === existing.length) return false;
      groupMembers.set(groupId, filtered);
      return true;
    },
    async updateGroupMemberRole(groupId, accountId, role) {
      const existing = groupMembers.get(groupId) ?? [];
      const member = existing.find((m) => m.accountId === accountId);
      if (member) member.role = role;
    },
    async getCurrencyBalance(accountId) {
      return currencyBalances.get(accountId) ?? 1000;
    },
    async addCurrency(transaction) {
      const record: CurrencyTransactionRecord = {
        id: randomUUID(),
        ...transaction,
        createdAt: new Date().toISOString()
      };
      currencyTransactions.unshift(record);
      const fromBalance = currencyBalances.get(transaction.fromAccountId ?? "") ?? 1000;
      const toBalance = currencyBalances.get(transaction.toAccountId ?? "") ?? 1000;
      if (transaction.fromAccountId) currencyBalances.set(transaction.fromAccountId, fromBalance - transaction.amount);
      if (transaction.toAccountId) currencyBalances.set(transaction.toAccountId, toBalance + transaction.amount);
      return currencyBalances.get(transaction.toAccountId ?? "") ?? 1000;
    },
    async listCurrencyTransactions(accountId, limit) {
      return currencyTransactions.filter((t) => t.fromAccountId === accountId || t.toAccountId === accountId).slice(0, limit);
    },
    async sendOfflineMessage(message) {
      const record: OfflineMessageRecord = {
        id: randomUUID(),
        ...message,
        createdAt: new Date().toISOString()
      };
      const existing = offlineMessages.get(message.toAccountId) ?? [];
      existing.unshift(record);
      offlineMessages.set(message.toAccountId, existing);
      return record;
    },
    async listOfflineMessages(accountId, limit) {
      return (offlineMessages.get(accountId) ?? []).slice(0, limit);
    },
    async markOfflineMessageRead(messageId, accountId) {
      const messages = offlineMessages.get(accountId) ?? [];
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return false;
      msg.read = true;
      return true;
    },
    async getAvatarProfile(accountId) {
      return profiles.get(accountId);
    },
    async saveAvatarProfile(profile) {
      profiles.set(profile.accountId, profile);
      return profile;
    },
    async banAccount(ban) {
      const record: BanRecord = {
        id: randomUUID(),
        ...ban,
        createdAt: new Date().toISOString()
      };
      bans.set(ban.accountId, record);
      return record;
    },
    async unbanAccount(accountId) {
      return bans.delete(accountId);
    },
    async getActiveBan(accountId) {
      const ban = bans.get(accountId);
      if (!ban) return undefined;
      if (ban.expiresAt && new Date(ban.expiresAt) < new Date()) {
        bans.delete(accountId);
        return undefined;
      }
      return ban;
    },
    async listRegionNotices(regionId) {
      return regionNotices.get(regionId) ?? [];
    },
    async createRegionNotice(notice) {
      const record: RegionNoticeRecord = {
        id: randomUUID(),
        ...notice,
        createdAt: new Date().toISOString()
      };
      const existing = regionNotices.get(notice.regionId) ?? [];
      existing.unshift(record);
      regionNotices.set(notice.regionId, existing);
      return record;
    },
    async deleteRegionNotice(noticeId, regionId) {
      const existing = regionNotices.get(regionId) ?? [];
      const filtered = existing.filter((n) => n.id !== noticeId);
      if (filtered.length === existing.length) return false;
      regionNotices.set(regionId, filtered);
      return true;
    },
    async getObjectPermissions(objectId) {
      return objectPermissions.get(objectId);
    },
    async saveObjectPermissions(perms) {
      objectPermissions.set(perms.objectId, perms);
    },
    async listObjectScripts(objectId) {
      return [...objectScripts.values()].filter((s) => s.objectId === objectId);
    },
    async createObjectScript(script) {
      const record: ObjectScriptRecord = {
        id: randomUUID(),
        ...script,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      objectScripts.set(record.id, record);
      return record;
    },
    async updateObjectScript(scriptId, accountId, scriptCode, enabled) {
      const script = objectScripts.get(scriptId);
      if (!script) return undefined;
      const objects = [...regionObjects.values()];
      const obj = objects.find((o) => o.id === script.objectId);
      if (!obj || obj.ownerAccountId !== accountId) return undefined;
      script.scriptCode = scriptCode;
      script.enabled = enabled;
      script.updatedAt = new Date().toISOString();
      objectScripts.set(scriptId, script);
      return script;
    },
    async deleteObjectScript(scriptId, accountId) {
      const script = objectScripts.get(scriptId);
      if (!script) return false;
      const objects = [...regionObjects.values()];
      const obj = objects.find((o) => o.id === script.objectId);
      if (!obj || obj.ownerAccountId !== accountId) return false;
      return objectScripts.delete(scriptId);
    },
    async listAssets(accountId) {
      return [...assets.values()].filter((a) => a.accountId === accountId);
    },
    async createAsset(asset) {
      const record: AssetRecord = {
        id: randomUUID(),
        ...asset,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      assets.set(record.id, record);
      return record;
    },
    async deleteAsset(assetId, accountId) {
      const asset = assets.get(assetId);
      if (!asset || asset.accountId !== accountId) return false;
      return assets.delete(assetId);
    },
    async listAllMarketListings() {
      return [...marketListings.values()];
    },
    async saveMarketListing(listing) {
      marketListings.set(listing.id, { ...listing });
    },
    async listAllTradeOffers() {
      return [...tradeOffers.values()];
    },
    async saveTradeOffer(trade) {
      tradeOffers.set(trade.id, { ...trade });
    },
    async listAllPriceHistory() {
      return priceHistory.map((entry) => ({ ...entry }));
    },
    async appendPriceHistory(entry) {
      const record: PriceHistoryRecord = { id: randomUUID(), ...entry };
      priceHistory.push(record);
      return record;
    },
    async listAllStorefronts() {
      return [...storefronts.values()];
    },
    async saveStorefront(storefront) {
      storefronts.set(storefront.id, { ...storefront });
    },
    async listAllStorefrontRatings() {
      return [...storefrontRatings.values()];
    },
    async saveStorefrontRating(rating) {
      storefrontRatings.set(ratingKey(rating.accountId, rating.storefrontAccountId), { ...rating });
    },
    async listAllCommissions() {
      return [...commissions.values()];
    },
    async saveCommission(commission) {
      commissions.set(commission.id, { ...commission });
    },
    async listAllPlayerProgress() {
      return [...playerProgress.values()].map((p) => ({ ...p }));
    },
    async savePlayerProgress(progress) {
      playerProgress.set(progress.accountId, { ...progress });
    },
  };
}

async function createPostgresPersistence(databaseUrl: string): Promise<PersistenceLayer> {
  const pool = new Pool({ connectionString: databaseUrl });

  const readInventory = async (accountId: string): Promise<InventoryItemRecord[]> => {
    const result = await pool.query<{
      id: string;
      account_id: string;
      name: string;
      kind: string;
      slot: string | null;
      appearance_key: string | null;
      equipped: boolean;
      rarity: string;
      created_at: string;
    }>(
      "SELECT id, account_id, name, kind, slot, appearance_key, equipped, rarity, created_at FROM inventory_items WHERE account_id = $1 ORDER BY created_at ASC",
      [accountId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      kind: row.kind,
      slot: row.slot,
      appearanceKey: row.appearance_key,
      equipped: row.equipped,
      rarity: row.rarity,
      createdAt: row.created_at
    }));
  };

  const readParcelById = async (parcelId: string): Promise<ParcelRecord | undefined> => {
    const result = await pool.query<{
      id: string;
      region_id: string;
      name: string;
      owner_account_id: string | null;
      owner_display_name: string | null;
      min_x: number;
      max_x: number;
      min_z: number;
      max_z: number;
      tier: string;
    }>(
      `
        SELECT parcels.id, parcels.region_id, parcels.name, parcels.owner_account_id,
          accounts.display_name AS owner_display_name, parcels.min_x, parcels.max_x,
          parcels.min_z, parcels.max_z, parcels.tier
        FROM parcels
        LEFT JOIN accounts ON accounts.id = parcels.owner_account_id
        WHERE parcels.id = $1
        LIMIT 1
      `,
      [parcelId]
    );

    const row = result.rows[0];
    if (!row) return undefined;

    return {
      id: row.id,
      regionId: row.region_id,
      name: row.name,
      ownerAccountId: row.owner_account_id,
      ownerDisplayName: row.owner_display_name,
      ...(await mapParcelCollaborators(pool, row.id)),
      minX: row.min_x,
      maxX: row.max_x,
      minZ: row.min_z,
      maxZ: row.max_z,
      tier: row.tier
    };
  };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      terrain TEXT NOT NULL,
      mood TEXT NOT NULL,
      theme_color TEXT NOT NULL,
      biome JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY,
      display_name TEXT NOT NULL,
      display_name_key TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'resident',
      password_hash TEXT,
      mc_uuid TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);
  await pool.query("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'resident'");
  await pool.query("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_hash TEXT");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY,
      actor_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      actor_display_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      region_id TEXT,
      details TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      slot TEXT,
      appearance_key TEXT,
      equipped BOOLEAN NOT NULL DEFAULT FALSE,
      rarity TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query("ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS slot TEXT");
  await pool.query("ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS appearance_key TEXT");
  await pool.query("ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS equipped BOOLEAN NOT NULL DEFAULT FALSE");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS avatar_appearances (
      account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
      body_color TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      head_color TEXT NOT NULL,
      hair_color TEXT NOT NULL,
      outfit TEXT NOT NULL,
      accessory TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS avatar_positions (
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      x DOUBLE PRECISION NOT NULL,
      y DOUBLE PRECISION NOT NULL,
      z DOUBLE PRECISION NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (account_id, region_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parcels (
      id TEXT PRIMARY KEY,
      region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      owner_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
      min_x DOUBLE PRECISION NOT NULL,
      max_x DOUBLE PRECISION NOT NULL,
      min_z DOUBLE PRECISION NOT NULL,
      max_z DOUBLE PRECISION NOT NULL,
      tier TEXT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parcel_collaborators (
      parcel_id TEXT NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      PRIMARY KEY (parcel_id, account_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS region_objects (
      id UUID PRIMARY KEY,
      region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      owner_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      asset TEXT NOT NULL,
      x DOUBLE PRECISION NOT NULL,
      y DOUBLE PRECISION NOT NULL,
      z DOUBLE PRECISION NOT NULL,
      rotation_y DOUBLE PRECISION NOT NULL,
      scale DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teleport_points (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      region_id TEXT NOT NULL,
      name TEXT NOT NULL,
      x DOUBLE PRECISION NOT NULL,
      y DOUBLE PRECISION NOT NULL,
      z DOUBLE PRECISION NOT NULL,
      rotation_y DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS friends (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      friend_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      friend_display_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL,
      UNIQUE(account_id, friend_account_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      founder_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (group_id, account_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS currency_balances (
      account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 1000
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS currency_transactions (
      id UUID PRIMARY KEY,
      from_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
      to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offline_messages (
      id UUID PRIMARY KEY,
      from_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      from_display_name TEXT NOT NULL,
      to_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS avatar_profiles (
      account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
      bio TEXT NOT NULL DEFAULT '',
      image_url TEXT,
      world_visits INTEGER NOT NULL DEFAULT 0,
      total_time INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bans (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      banned_by UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS region_notices (
      id UUID PRIMARY KEY,
      region_id TEXT NOT NULL,
      parcel_id TEXT,
      message TEXT NOT NULL,
      created_by UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS object_permissions (
      object_id UUID PRIMARY KEY REFERENCES region_objects(id) ON DELETE CASCADE,
      allow_copy BOOLEAN NOT NULL DEFAULT TRUE,
      allow_modify BOOLEAN NOT NULL DEFAULT TRUE,
      allow_transfer BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS object_scripts (
      id UUID PRIMARY KEY,
      object_id UUID NOT NULL REFERENCES region_objects(id) ON DELETE CASCADE,
      script_name TEXT NOT NULL,
      script_code TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS assets (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      asset_type TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      price INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS market_listings (
      id UUID PRIMARY KEY,
      seller_account_id UUID NOT NULL,
      seller_display_name TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_kind TEXT NOT NULL,
      price INTEGER NOT NULL,
      listing_type TEXT NOT NULL,
      current_bid INTEGER,
      current_bidder UUID,
      current_bidder_name TEXT,
      min_bid INTEGER,
      auction_end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trade_offers (
      id UUID PRIMARY KEY,
      from_account_id UUID NOT NULL,
      from_display_name TEXT NOT NULL,
      to_account_id UUID NOT NULL,
      to_display_name TEXT NOT NULL DEFAULT '',
      offered_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      offered_currency INTEGER NOT NULL DEFAULT 0,
      requested_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      requested_currency INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_history (
      id UUID PRIMARY KEY,
      item_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      sold_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS storefronts (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL,
      display_name TEXT NOT NULL,
      shop_name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      banner_color TEXT NOT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      total_sales INTEGER NOT NULL DEFAULT 0,
      total_revenue INTEGER NOT NULL DEFAULT 0,
      rating DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS storefront_ratings (
      account_id UUID NOT NULL,
      storefront_account_id UUID NOT NULL,
      rating INTEGER NOT NULL,
      PRIMARY KEY (account_id, storefront_account_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commissions (
      id UUID PRIMARY KEY,
      client_account_id UUID NOT NULL,
      client_display_name TEXT NOT NULL,
      builder_account_id UUID NOT NULL,
      builder_display_name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      budget INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_progress (
      account_id UUID PRIMARY KEY,
      data JSONB NOT NULL
    )
  `);

  for (const region of seededRegions) {
    await pool.query(
      `
        INSERT INTO regions (id, name, capacity, terrain, mood, theme_color, biome)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          capacity = EXCLUDED.capacity,
          terrain = EXCLUDED.terrain,
          mood = EXCLUDED.mood,
          theme_color = EXCLUDED.theme_color,
          biome = EXCLUDED.biome
      `,
      [region.id, region.name, region.capacity, region.terrain, region.mood, region.themeColor, JSON.stringify(region.biome)]
    );
  }

  for (const parcel of seededParcels) {
    await pool.query(
      `
        INSERT INTO parcels (id, region_id, name, owner_account_id, min_x, max_x, min_z, max_z, tier)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          region_id = EXCLUDED.region_id,
          name = EXCLUDED.name,
          min_x = EXCLUDED.min_x,
          max_x = EXCLUDED.max_x,
          min_z = EXCLUDED.min_z,
          max_z = EXCLUDED.max_z,
          tier = EXCLUDED.tier
      `,
      [
        parcel.id,
        parcel.regionId,
        parcel.name,
        parcel.ownerAccountId,
        parcel.minX,
        parcel.maxX,
        parcel.minZ,
        parcel.maxZ,
        parcel.tier
      ]
    );
  }

  return {
    mode: "postgres",
    async listRegions() {
      const result = await pool.query<{
        id: string;
        name: string;
        capacity: number;
        terrain: string;
        mood: string;
        theme_color: string;
        biome: string;
      }>("SELECT id, name, capacity, terrain, mood, theme_color, biome FROM regions ORDER BY name ASC");

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        capacity: row.capacity,
        terrain: row.terrain,
        mood: row.mood,
        themeColor: row.theme_color,
        biome: typeof row.biome === "string" ? JSON.parse(row.biome) : row.biome
      }));
    },
    async getOrCreateGuestAccount(displayName) {
      const displayNameKey = normalizeDisplayName(displayName);
      const existing = await pool.query<{
        id: string;
        display_name: string;
        kind: "guest";
        role: "resident" | "admin";
        created_at: string;
      }>(
        "SELECT id, display_name, kind, role, created_at FROM accounts WHERE display_name_key = $1 LIMIT 1",
        [displayNameKey]
      );

      if (existing.rows[0]) {
        return {
          account: {
            id: existing.rows[0].id,
            displayName: existing.rows[0].display_name,
            kind: existing.rows[0].kind,
            role: existing.rows[0].role,
            createdAt: existing.rows[0].created_at
          },
          isNew: false
        };
      }

      const account: AccountRecord = {
        id: randomUUID(),
        displayName,
        kind: "guest",
        role: "resident",
        createdAt: new Date().toISOString()
      };

      await pool.query(
        "INSERT INTO accounts (id, display_name, display_name_key, kind, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [account.id, account.displayName, displayNameKey, account.kind, account.role, null, account.createdAt]
      );

      for (const item of starterInventory) {
        await pool.query(
          "INSERT INTO inventory_items (id, account_id, name, kind, rarity, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [randomUUID(), account.id, item.name, item.kind, item.rarity, new Date().toISOString()]
        );
      }

      for (const item of starterInventory) {
        await pool.query(
          "UPDATE inventory_items SET slot = $3, appearance_key = $4, equipped = $5 WHERE account_id = $1 AND name = $2",
          [account.id, item.name, item.slot, item.appearanceKey, item.equipped]
        );
      }

      const appearance = createDefaultAppearance(account.id);
      await pool.query(
        "INSERT INTO avatar_appearances (account_id, body_color, accent_color, head_color, hair_color, outfit, accessory, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [appearance.accountId, appearance.bodyColor, appearance.accentColor, appearance.headColor, appearance.hairColor, appearance.outfit, appearance.accessory, appearance.updatedAt]
      );

      return { account, isNew: true };
    },
    async registerAccount(displayName, passwordHash, role) {
      const displayNameKey = normalizeDisplayName(displayName);
      const existing = await pool.query<{ id: string; display_name: string; kind: "guest" | "registered"; role: "resident" | "admin"; created_at: string }>(
        "SELECT id, display_name, kind, role, created_at FROM accounts WHERE display_name_key = $1 LIMIT 1",
        [displayNameKey]
      );

      if (existing.rows[0]) {
        return {
          account: {
            id: existing.rows[0].id,
            displayName: existing.rows[0].display_name,
            kind: existing.rows[0].kind,
            role: existing.rows[0].role,
            createdAt: existing.rows[0].created_at
          },
          isNew: false
        };
      }

      const account: AccountRecord = {
        id: randomUUID(),
        displayName,
        kind: "registered",
        role,
        createdAt: new Date().toISOString()
      };

      await pool.query(
        "INSERT INTO accounts (id, display_name, display_name_key, kind, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [account.id, account.displayName, displayNameKey, account.kind, account.role, passwordHash, account.createdAt]
      );

      for (const item of starterInventory) {
        await pool.query(
          "INSERT INTO inventory_items (id, account_id, name, kind, rarity, created_at, slot, appearance_key, equipped) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [randomUUID(), account.id, item.name, item.kind, item.rarity, new Date().toISOString(), item.slot, item.appearanceKey, item.equipped]
        );
      }

      const appearance = createDefaultAppearance(account.id);
      await pool.query(
        "INSERT INTO avatar_appearances (account_id, body_color, accent_color, head_color, hair_color, outfit, accessory, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [appearance.accountId, appearance.bodyColor, appearance.accentColor, appearance.headColor, appearance.hairColor, appearance.outfit, appearance.accessory, appearance.updatedAt]
      );

      return { account, isNew: true };
    },
    async authenticateAccount(displayName) {
      const displayNameKey = normalizeDisplayName(displayName);
      const result = await pool.query<{
        id: string;
        display_name: string;
        kind: "guest" | "registered";
        role: "resident" | "admin";
        password_hash: string | null;
        created_at: string;
      }>(
        "SELECT id, display_name, kind, role, password_hash, created_at FROM accounts WHERE display_name_key = $1 LIMIT 1",
        [displayNameKey]
      );

      const row = result.rows[0];
      if (!row || row.kind !== "registered") {
        return undefined;
      }

      return {
        id: row.id,
        displayName: row.display_name,
        kind: row.kind,
        role: row.role,
        passwordHash: row.password_hash,
        createdAt: row.created_at
      };
    },
    async getAccountByMcUuid(mcUuid) {
      const result = await pool.query<{
        id: string;
        display_name: string;
        kind: "guest" | "registered";
        role: "resident" | "admin";
        created_at: string;
        mc_uuid: string | null;
      }>(
        "SELECT id, display_name, kind, role, created_at, mc_uuid FROM accounts WHERE mc_uuid = $1 LIMIT 1",
        [mcUuid]
      );

      const row = result.rows[0];
      if (!row) return undefined;

      return {
        id: row.id,
        displayName: row.display_name,
        kind: row.kind,
        role: row.role,
        createdAt: row.created_at,
        mcUuid: row.mc_uuid ?? undefined
      };
    },
    async getOrCreateMcAccount(mcUuid, mcUsername) {
      const existing = await pool.query<{
        id: string;
        display_name: string;
        kind: "guest" | "registered";
        role: "resident" | "admin";
        created_at: string;
      }>(
        "SELECT id, display_name, kind, role, created_at FROM accounts WHERE mc_uuid = $1 LIMIT 1",
        [mcUuid]
      );

      if (existing.rows[0]) {
        return {
          account: {
            id: existing.rows[0].id,
            displayName: existing.rows[0].display_name,
            kind: existing.rows[0].kind,
            role: existing.rows[0].role,
            createdAt: existing.rows[0].created_at,
            mcUuid
          },
          isNew: false
        };
      }

      const account: AccountRecord = {
        id: randomUUID(),
        displayName: mcUsername,
        kind: "registered",
        role: "resident",
        createdAt: new Date().toISOString(),
        mcUuid
      };

      const displayNameKey = normalizeDisplayName(mcUsername);
      await pool.query(
        "INSERT INTO accounts (id, display_name, display_name_key, kind, role, password_hash, mc_uuid, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [account.id, account.displayName, displayNameKey, account.kind, account.role, null, mcUuid, account.createdAt]
      );

      for (const item of starterInventory) {
        await pool.query(
          "INSERT INTO inventory_items (id, account_id, name, kind, rarity, created_at, slot, appearance_key, equipped) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [randomUUID(), account.id, item.name, item.kind, item.rarity, new Date().toISOString(), item.slot, item.appearanceKey, item.equipped]
        );
      }

      const appearance = createDefaultAppearance(account.id);
      await pool.query(
        "INSERT INTO avatar_appearances (account_id, body_color, accent_color, head_color, hair_color, outfit, accessory, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [appearance.accountId, appearance.bodyColor, appearance.accentColor, appearance.headColor, appearance.hairColor, appearance.outfit, appearance.accessory, appearance.updatedAt]
      );

      return { account, isNew: true };
    },
    async linkMcUuid(accountId, mcUuid) {
      const result = await pool.query(
        "UPDATE accounts SET mc_uuid = $1 WHERE id = $2",
        [mcUuid, accountId]
      );
      return (result.rowCount ?? 0) > 0;
    },
    async getInventory(accountId) {
      return readInventory(accountId);
    },
    async equipInventoryItem(accountId, itemId) {
      const selected = await pool.query<{ id: string; slot: string | null }>(
        "SELECT id, slot FROM inventory_items WHERE account_id = $1 AND id = $2 LIMIT 1",
        [accountId, itemId]
      );

      const target = selected.rows[0];

      if (!target?.slot) {
        return readInventory(accountId);
      }

      await pool.query("UPDATE inventory_items SET equipped = FALSE WHERE account_id = $1 AND slot = $2", [accountId, target.slot]);
      await pool.query("UPDATE inventory_items SET equipped = TRUE WHERE account_id = $1 AND id = $2", [accountId, itemId]);

      return readInventory(accountId);
    },
    async getAvatarAppearance(accountId) {
      const result = await pool.query<{
        account_id: string;
        body_color: string;
        accent_color: string;
        head_color: string;
        hair_color: string;
        outfit: string;
        accessory: string;
        updated_at: string;
      }>(
        "SELECT account_id, body_color, accent_color, head_color, hair_color, outfit, accessory, updated_at FROM avatar_appearances WHERE account_id = $1 LIMIT 1",
        [accountId]
      );

      const row = result.rows[0];

      if (!row) {
        const appearance = createDefaultAppearance(accountId);
        await pool.query(
          "INSERT INTO avatar_appearances (account_id, body_color, accent_color, head_color, hair_color, outfit, accessory, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [appearance.accountId, appearance.bodyColor, appearance.accentColor, appearance.headColor, appearance.hairColor, appearance.outfit, appearance.accessory, appearance.updatedAt]
        );
        return appearance;
      }

      return {
        accountId: row.account_id,
        bodyColor: row.body_color,
        accentColor: row.accent_color,
        headColor: row.head_color,
        hairColor: row.hair_color,
        outfit: row.outfit,
        accessory: row.accessory,
        updatedAt: row.updated_at
      };
    },
    async saveAvatarAppearance(appearance) {
      await pool.query(
        `
          INSERT INTO avatar_appearances (account_id, body_color, accent_color, head_color, hair_color, outfit, accessory, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (account_id) DO UPDATE SET
            body_color = EXCLUDED.body_color,
            accent_color = EXCLUDED.accent_color,
            head_color = EXCLUDED.head_color,
            hair_color = EXCLUDED.hair_color,
            outfit = EXCLUDED.outfit,
            accessory = EXCLUDED.accessory,
            updated_at = EXCLUDED.updated_at
        `,
        [appearance.accountId, appearance.bodyColor, appearance.accentColor, appearance.headColor, appearance.hairColor, appearance.outfit, appearance.accessory, appearance.updatedAt]
      );

      return appearance;
    },
    async getAvatarPosition(accountId, regionId) {
      const result = await pool.query<{
        account_id: string;
        region_id: string;
        x: number;
        y: number;
        z: number;
        updated_at: string;
      }>(
        "SELECT account_id, region_id, x, y, z, updated_at FROM avatar_positions WHERE account_id = $1 AND region_id = $2 LIMIT 1",
        [accountId, regionId]
      );

      const row = result.rows[0];

      if (!row) {
        return undefined;
      }

      return {
        accountId: row.account_id,
        regionId: row.region_id,
        x: row.x,
        y: row.y,
        z: row.z,
        updatedAt: row.updated_at
      };
    },
    async saveAvatarPosition(position) {
      await pool.query(
        `
          INSERT INTO avatar_positions (account_id, region_id, x, y, z, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (account_id, region_id) DO UPDATE SET
            x = EXCLUDED.x,
            y = EXCLUDED.y,
            z = EXCLUDED.z,
            updated_at = EXCLUDED.updated_at
        `,
        [position.accountId, position.regionId, position.x, position.y, position.z, position.updatedAt]
      );
    },
    async listParcels(regionId) {
      const result = await pool.query<{
        id: string;
        region_id: string;
        name: string;
        owner_account_id: string | null;
        owner_display_name: string | null;
        min_x: number;
        max_x: number;
        min_z: number;
        max_z: number;
        tier: string;
      }>(
        `
          SELECT
            parcels.id,
            parcels.region_id,
            parcels.name,
            parcels.owner_account_id,
            accounts.display_name AS owner_display_name,
            parcels.min_x,
            parcels.max_x,
            parcels.min_z,
            parcels.max_z,
            parcels.tier
          FROM parcels
          LEFT JOIN accounts ON accounts.id = parcels.owner_account_id
          WHERE parcels.region_id = $1
          ORDER BY parcels.name ASC
        `,
        [regionId]
      );

      return Promise.all(result.rows.map(async (row) => ({
        id: row.id,
        regionId: row.region_id,
        name: row.name,
        ownerAccountId: row.owner_account_id,
        ownerDisplayName: row.owner_display_name,
        ...(await mapParcelCollaborators(pool, row.id)),
        minX: row.min_x,
        maxX: row.max_x,
        minZ: row.min_z,
        maxZ: row.max_z,
        tier: row.tier
      })));
    },
    async claimParcel(parcelId, accountId) {
      const result = await pool.query<{
        id: string;
        region_id: string;
        name: string;
        owner_account_id: string | null;
        owner_display_name: string | null;
        min_x: number;
        max_x: number;
        min_z: number;
        max_z: number;
        tier: string;
      }>(
        `
          UPDATE parcels
          SET owner_account_id = $2
          WHERE id = $1 AND (owner_account_id IS NULL OR owner_account_id = $2)
          RETURNING
            id,
            region_id,
            name,
            owner_account_id,
            (SELECT display_name FROM accounts WHERE accounts.id = $2) AS owner_display_name,
            min_x,
            max_x,
            min_z,
            max_z,
            tier
        `,
        [parcelId, accountId]
      );

      const row = result.rows[0];

      if (!row) {
        return undefined;
      }

      return {
        id: row.id,
        regionId: row.region_id,
        name: row.name,
        ownerAccountId: row.owner_account_id,
        ownerDisplayName: row.owner_display_name,
        ...(await mapParcelCollaborators(pool, row.id)),
        minX: row.min_x,
        maxX: row.max_x,
        minZ: row.min_z,
        maxZ: row.max_z,
        tier: row.tier
      };
    },
    async addParcelCollaborator(parcelId, ownerAccountId, collaboratorAccountId) {
      const parcel = await pool.query<{ owner_account_id: string | null }>("SELECT owner_account_id FROM parcels WHERE id = $1 LIMIT 1", [parcelId]);
      if (!parcel.rows[0] || parcel.rows[0].owner_account_id !== ownerAccountId) {
        return undefined;
      }

      await pool.query(
        "INSERT INTO parcel_collaborators (parcel_id, account_id) VALUES ($1, $2) ON CONFLICT (parcel_id, account_id) DO NOTHING",
        [parcelId, collaboratorAccountId]
      );

      return readParcelById(parcelId);
    },
    async removeParcelCollaborator(parcelId, ownerAccountId, collaboratorAccountId) {
      const parcel = await pool.query<{ owner_account_id: string | null; region_id: string }>("SELECT owner_account_id, region_id FROM parcels WHERE id = $1 LIMIT 1", [parcelId]);
      if (!parcel.rows[0] || parcel.rows[0].owner_account_id !== ownerAccountId) {
        return undefined;
      }

      await pool.query("DELETE FROM parcel_collaborators WHERE parcel_id = $1 AND account_id = $2", [parcelId, collaboratorAccountId]);
      return readParcelById(parcelId);
    },
    async reassignParcel(parcelId, ownerAccountId) {
      const result = await pool.query<{
        id: string;
        region_id: string;
        name: string;
        owner_account_id: string | null;
        owner_display_name: string | null;
        min_x: number;
        max_x: number;
        min_z: number;
        max_z: number;
        tier: string;
      }>(
        `
          UPDATE parcels
          SET owner_account_id = $2
          WHERE id = $1
          RETURNING
            id,
            region_id,
            name,
            owner_account_id,
            (SELECT display_name FROM accounts WHERE accounts.id = $2) AS owner_display_name,
            min_x,
            max_x,
            min_z,
            max_z,
            tier
        `,
        [parcelId, ownerAccountId]
      );

      const row = result.rows[0];
      if (!row) return undefined;

      return {
        id: row.id,
        regionId: row.region_id,
        name: row.name,
        ownerAccountId: row.owner_account_id,
        ownerDisplayName: row.owner_display_name,
        ...(await mapParcelCollaborators(pool, row.id)),
        minX: row.min_x,
        maxX: row.max_x,
        minZ: row.min_z,
        maxZ: row.max_z,
        tier: row.tier
      };
    },
    async releaseParcel(parcelId, accountId) {
      const result = await pool.query<{
        id: string;
        region_id: string;
        name: string;
        owner_account_id: string | null;
        owner_display_name: string | null;
        min_x: number;
        max_x: number;
        min_z: number;
        max_z: number;
        tier: string;
      }>(
        `
          UPDATE parcels
          SET owner_account_id = NULL
          WHERE id = $1 AND owner_account_id = $2
          RETURNING
            id,
            region_id,
            name,
            owner_account_id,
            NULL::text AS owner_display_name,
            min_x,
            max_x,
            min_z,
            max_z,
            tier
        `,
        [parcelId, accountId]
      );

      const row = result.rows[0];

      if (!row) {
        return undefined;
      }

      return {
        id: row.id,
        regionId: row.region_id,
        name: row.name,
        ownerAccountId: row.owner_account_id,
        ownerDisplayName: row.owner_display_name,
        ...(await mapParcelCollaborators(pool, row.id)),
        minX: row.min_x,
        maxX: row.max_x,
        minZ: row.min_z,
        maxZ: row.max_z,
        tier: row.tier
      };
    },
    async listRegionObjects(regionId) {
      const result = await pool.query<{
        id: string;
        region_id: string;
        owner_account_id: string;
        owner_display_name: string | null;
        asset: string;
        x: number;
        y: number;
        z: number;
        rotation_y: number;
        scale: number;
        created_at: string;
        updated_at: string;
      }>(
        `
          SELECT region_objects.id, region_objects.region_id, region_objects.owner_account_id,
            accounts.display_name AS owner_display_name, region_objects.asset, region_objects.x,
            region_objects.y, region_objects.z, region_objects.rotation_y, region_objects.scale,
            region_objects.created_at, region_objects.updated_at
          FROM region_objects
          JOIN accounts ON accounts.id = region_objects.owner_account_id
          WHERE region_objects.region_id = $1
          ORDER BY region_objects.created_at ASC
        `,
        [regionId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        regionId: row.region_id,
        ownerAccountId: row.owner_account_id,
        ownerDisplayName: row.owner_display_name,
        asset: row.asset,
        x: row.x,
        y: row.y,
        z: row.z,
        rotationY: row.rotation_y,
        scale: row.scale,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    },
    async createRegionObject(object) {
      await pool.query(
        `
          INSERT INTO region_objects (id, region_id, owner_account_id, asset, x, y, z, rotation_y, scale, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [object.id, object.regionId, object.ownerAccountId, object.asset, object.x, object.y, object.z, object.rotationY, object.scale, object.createdAt, object.updatedAt]
      );

      const owner = await pool.query<{ display_name: string }>("SELECT display_name FROM accounts WHERE id = $1", [object.ownerAccountId]);

      return {
        ...object,
        ownerDisplayName: owner.rows[0]?.display_name ?? null
      };
    },
    async updateRegionObject(objectId, ownerAccountId, updates) {
      const result = await pool.query<{
        id: string;
        region_id: string;
        owner_account_id: string;
        owner_display_name: string | null;
        asset: string;
        x: number;
        y: number;
        z: number;
        rotation_y: number;
        scale: number;
        created_at: string;
        updated_at: string;
      }>(
        `
          UPDATE region_objects
          SET x = $3, y = $4, z = $5, rotation_y = $6, scale = $7, updated_at = $8
          WHERE id = $1 AND owner_account_id = $2
          RETURNING id, region_id, owner_account_id,
            (SELECT display_name FROM accounts WHERE id = owner_account_id) AS owner_display_name,
            asset, x, y, z, rotation_y, scale, created_at, updated_at
        `,
        [objectId, ownerAccountId, updates.x, updates.y, updates.z, updates.rotationY, updates.scale, updates.updatedAt]
      );

      const row = result.rows[0];
      if (!row) {
        return undefined;
      }

      return {
        id: row.id,
        regionId: row.region_id,
        ownerAccountId: row.owner_account_id,
        ownerDisplayName: row.owner_display_name,
        asset: row.asset,
        x: row.x,
        y: row.y,
        z: row.z,
        rotationY: row.rotation_y,
        scale: row.scale,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    },
    async deleteRegionObject(objectId, ownerAccountId) {
      const result = await pool.query("DELETE FROM region_objects WHERE id = $1 AND owner_account_id = $2", [objectId, ownerAccountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async adminDeleteRegionObject(objectId) {
      const result = await pool.query("DELETE FROM region_objects WHERE id = $1", [objectId]);
      return (result.rowCount ?? 0) > 0;
    },
    async appendAuditLog(entry) {
      await pool.query(
        "INSERT INTO audit_logs (id, actor_account_id, actor_display_name, action, target_type, target_id, region_id, details, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [entry.id, entry.actorAccountId, entry.actorDisplayName, entry.action, entry.targetType, entry.targetId, entry.regionId, entry.details, entry.createdAt]
      );
    },
    async listAuditLogs(limit) {
      const result = await pool.query<{
        id: string;
        actor_account_id: string;
        actor_display_name: string;
        action: string;
        target_type: string;
        target_id: string;
        region_id: string | null;
        details: string;
        created_at: string;
      }>(
        "SELECT id, actor_account_id, actor_display_name, action, target_type, target_id, region_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1",
        [limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        actorAccountId: row.actor_account_id,
        actorDisplayName: row.actor_display_name,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        regionId: row.region_id,
        details: row.details,
        createdAt: row.created_at
      }));
    },
    async listTeleportPoints(accountId) {
      const result = await pool.query("SELECT id, account_id, region_id, name, x, y, z, rotation_y, created_at FROM teleport_points WHERE account_id = $1 ORDER BY created_at DESC", [accountId]);
      return result.rows.map((row) => ({
        id: row.id,
        accountId: row.account_id,
        regionId: row.region_id,
        name: row.name,
        x: row.x,
        y: row.y,
        z: row.z,
        rotationY: row.rotation_y,
        createdAt: row.created_at
      }));
    },
    async createTeleportPoint(point) {
      const id = randomUUID();
      await pool.query("INSERT INTO teleport_points (id, account_id, region_id, name, x, y, z, rotation_y, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [id, point.accountId, point.regionId, point.name, point.x, point.y, point.z, point.rotationY, new Date().toISOString()]);
      return { id, ...point, createdAt: new Date().toISOString() };
    },
    async deleteTeleportPoint(pointId, accountId) {
      const result = await pool.query("DELETE FROM teleport_points WHERE id = $1 AND account_id = $2", [pointId, accountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async listFriends(accountId) {
      const result = await pool.query("SELECT id, account_id, friend_account_id, friend_display_name, status, created_at FROM friends WHERE account_id = $1", [accountId]);
      return result.rows.map((row) => ({
        id: row.id,
        accountId: row.account_id,
        friendAccountId: row.friend_account_id,
        friendDisplayName: row.friend_display_name,
        status: row.status,
        createdAt: row.created_at
      }));
    },
    async addFriend(friend) {
      const id = randomUUID();
      await pool.query("INSERT INTO friends (id, account_id, friend_account_id, friend_display_name, status, created_at) VALUES ($1,$2,$3,$4,$5,$6)", [id, friend.accountId, friend.friendAccountId, friend.friendDisplayName, friend.status, new Date().toISOString()]);
      return { id, ...friend, createdAt: new Date().toISOString() };
    },
    async removeFriend(accountId, friendAccountId) {
      const result = await pool.query("DELETE FROM friends WHERE account_id = $1 AND friend_account_id = $2", [accountId, friendAccountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async blockAccount(accountId, blockedAccountId) {
      const blocked = await pool.query<{ display_name: string }>("SELECT display_name FROM accounts WHERE id = $1", [blockedAccountId]);
      const id = randomUUID();
      await pool.query("INSERT INTO friends (id, account_id, friend_account_id, friend_display_name, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (account_id, friend_account_id) DO UPDATE SET status = 'blocked'", [id, accountId, blockedAccountId, blocked.rows[0]?.display_name ?? "Unknown", "blocked", new Date().toISOString()]);
      return { id, accountId, friendAccountId: blockedAccountId, friendDisplayName: blocked.rows[0]?.display_name ?? "Unknown", status: "blocked", createdAt: new Date().toISOString() };
    },
    async unblockAccount(accountId, blockedAccountId) {
      const result = await pool.query("DELETE FROM friends WHERE account_id = $1 AND friend_account_id = $2 AND status = 'blocked'", [accountId, blockedAccountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async listGroups(accountId) {
      const result = await pool.query("SELECT g.id, g.name, g.description, g.founder_account_id, g.created_at FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.account_id = $1", [accountId]);
      return result.rows.map((row) => ({ id: row.id, name: row.name, description: row.description, founderAccountId: row.founder_account_id, createdAt: row.created_at }));
    },
    async createGroup(group) {
      const id = randomUUID();
      await pool.query("INSERT INTO groups (id, name, description, founder_account_id, created_at) VALUES ($1,$2,$3,$4,$5)", [id, group.name, group.description, group.founderAccountId, new Date().toISOString()]);
      const founderName = (await pool.query<{ display_name: string }>("SELECT display_name FROM accounts WHERE id = $1", [group.founderAccountId])).rows[0]?.display_name ?? "Unknown";
      await pool.query("INSERT INTO group_members (group_id, account_id, display_name, role, joined_at) VALUES ($1,$2,$3,$4,$5)", [id, group.founderAccountId, founderName, "owner", new Date().toISOString()]);
      return { id, ...group, createdAt: new Date().toISOString() };
    },
    async getGroupMembers(groupId) {
      const result = await pool.query("SELECT group_id, account_id, display_name, role, joined_at FROM group_members WHERE group_id = $1", [groupId]);
      return result.rows.map((row) => ({ groupId: row.group_id, accountId: row.account_id, displayName: row.display_name, role: row.role, joinedAt: row.joined_at }));
    },
    async addGroupMember(member) {
      await pool.query("INSERT INTO group_members (group_id, account_id, display_name, role, joined_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING", [member.groupId, member.accountId, member.displayName, member.role, member.joinedAt]);
    },
    async removeGroupMember(groupId, accountId) {
      const result = await pool.query("DELETE FROM group_members WHERE group_id = $1 AND account_id = $2", [groupId, accountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async updateGroupMemberRole(groupId, accountId, role) {
      await pool.query("UPDATE group_members SET role = $3 WHERE group_id = $1 AND account_id = $2", [groupId, accountId, role]);
    },
    async getCurrencyBalance(accountId) {
      const result = await pool.query<{ balance: number }>("SELECT balance FROM currency_balances WHERE account_id = $1", [accountId]);
      return result.rows[0]?.balance ?? 1000;
    },
    async addCurrency(transaction) {
      const id = randomUUID();
      await pool.query("INSERT INTO currency_transactions (id, from_account_id, to_account_id, amount, type, description, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [id, transaction.fromAccountId, transaction.toAccountId, transaction.amount, transaction.type, transaction.description, new Date().toISOString()]);
      if (transaction.fromAccountId) await pool.query("UPDATE currency_balances SET balance = balance - $2 WHERE account_id = $1", [transaction.fromAccountId, transaction.amount]);
      if (transaction.toAccountId) await pool.query("INSERT INTO currency_balances (account_id, balance) VALUES ($1, $2) ON CONFLICT (account_id) DO UPDATE SET balance = balance + $2", [transaction.toAccountId, transaction.amount]);
      const result = await pool.query<{ balance: number }>("SELECT balance FROM currency_balances WHERE account_id = $1", [transaction.toAccountId]);
      return result.rows[0]?.balance ?? 1000;
    },
    async listCurrencyTransactions(accountId, limit) {
      const result = await pool.query("SELECT id, from_account_id, to_account_id, amount, type, description, created_at FROM currency_transactions WHERE from_account_id = $1 OR to_account_id = $1 ORDER BY created_at DESC LIMIT $2", [accountId, limit]);
      return result.rows.map((row) => ({ id: row.id, fromAccountId: row.from_account_id, toAccountId: row.to_account_id, amount: row.amount, type: row.type, description: row.description, createdAt: row.created_at }));
    },
    async sendOfflineMessage(message) {
      const id = randomUUID();
      await pool.query("INSERT INTO offline_messages (id, from_account_id, from_display_name, to_account_id, message, read, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [id, message.fromAccountId, message.fromDisplayName, message.toAccountId, message.message, false, new Date().toISOString()]);
      return { id, ...message, read: false, createdAt: new Date().toISOString() };
    },
    async listOfflineMessages(accountId, limit) {
      const result = await pool.query("SELECT id, from_account_id, from_display_name, to_account_id, message, read, created_at FROM offline_messages WHERE to_account_id = $1 ORDER BY created_at DESC LIMIT $2", [accountId, limit]);
      return result.rows.map((row) => ({ id: row.id, fromAccountId: row.from_account_id, fromDisplayName: row.from_display_name, toAccountId: row.to_account_id, message: row.message, read: row.read, createdAt: row.created_at }));
    },
    async markOfflineMessageRead(messageId, accountId) {
      const result = await pool.query("UPDATE offline_messages SET read = TRUE WHERE id = $1 AND to_account_id = $2", [messageId, accountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async getAvatarProfile(accountId) {
      const result = await pool.query("SELECT account_id, bio, image_url, world_visits, total_time, created_at, updated_at FROM avatar_profiles WHERE account_id = $1", [accountId]);
      const row = result.rows[0];
      if (!row) return undefined;
      return { accountId: row.account_id, bio: row.bio, imageUrl: row.image_url, worldVisits: row.world_visits, totalTime: row.total_time, createdAt: row.created_at, updatedAt: row.updated_at };
    },
    async saveAvatarProfile(profile) {
      await pool.query("INSERT INTO avatar_profiles (account_id, bio, image_url, world_visits, total_time, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (account_id) DO UPDATE SET bio = $2, image_url = $3, world_visits = $4, total_time = $5, updated_at = $7", [profile.accountId, profile.bio, profile.imageUrl, profile.worldVisits, profile.totalTime, profile.createdAt, new Date().toISOString()]);
      return profile;
    },
    async banAccount(ban) {
      const id = randomUUID();
      await pool.query("INSERT INTO bans (id, account_id, banned_by, reason, expires_at, created_at) VALUES ($1,$2,$3,$4,$5,$6)", [id, ban.accountId, ban.bannedBy, ban.reason, ban.expiresAt, new Date().toISOString()]);
      return { id, ...ban, createdAt: new Date().toISOString() };
    },
    async unbanAccount(accountId) {
      const result = await pool.query("DELETE FROM bans WHERE account_id = $1", [accountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async getActiveBan(accountId) {
      const result = await pool.query("SELECT id, account_id, banned_by, reason, expires_at, created_at FROM bans WHERE account_id = $1 AND (expires_at IS NULL OR expires_at > NOW())", [accountId]);
      const row = result.rows[0];
      if (!row) return undefined;
      return { id: row.id, accountId: row.account_id, bannedBy: row.banned_by, reason: row.reason, expiresAt: row.expires_at, createdAt: row.created_at };
    },
    async listRegionNotices(regionId) {
      const result = await pool.query("SELECT id, region_id, parcel_id, message, created_by, created_at FROM region_notices WHERE region_id = $1 ORDER BY created_at DESC", [regionId]);
      return result.rows.map((row) => ({ id: row.id, regionId: row.region_id, parcelId: row.parcel_id, message: row.message, createdBy: row.created_by, createdAt: row.created_at }));
    },
    async createRegionNotice(notice) {
      const id = randomUUID();
      await pool.query("INSERT INTO region_notices (id, region_id, parcel_id, message, created_by, created_at) VALUES ($1,$2,$3,$4,$5,$6)", [id, notice.regionId, notice.parcelId, notice.message, notice.createdBy, new Date().toISOString()]);
      return { id, ...notice, createdAt: new Date().toISOString() };
    },
    async deleteRegionNotice(noticeId, regionId) {
      const result = await pool.query("DELETE FROM region_notices WHERE id = $1 AND region_id = $2", [noticeId, regionId]);
      return (result.rowCount ?? 0) > 0;
    },
    async getObjectPermissions(objectId) {
      const result = await pool.query("SELECT object_id, allow_copy, allow_modify, allow_transfer FROM object_permissions WHERE object_id = $1", [objectId]);
      const row = result.rows[0];
      if (!row) return undefined;
      return { objectId: row.object_id, allowCopy: row.allow_copy, allowModify: row.allow_modify, allowTransfer: row.allow_transfer };
    },
    async saveObjectPermissions(perms) {
      await pool.query("INSERT INTO object_permissions (object_id, allow_copy, allow_modify, allow_transfer) VALUES ($1,$2,$3,$4) ON CONFLICT (object_id) DO UPDATE SET allow_copy = $2, allow_modify = $3, allow_transfer = $4", [perms.objectId, perms.allowCopy, perms.allowModify, perms.allowTransfer]);
    },
    async listObjectScripts(objectId) {
      const result = await pool.query("SELECT id, object_id, script_name, script_code, enabled, created_at, updated_at FROM object_scripts WHERE object_id = $1", [objectId]);
      return result.rows.map((row) => ({ id: row.id, objectId: row.object_id, scriptName: row.script_name, scriptCode: row.script_code, enabled: row.enabled, createdAt: row.created_at, updatedAt: row.updated_at }));
    },
    async createObjectScript(script) {
      const id = randomUUID();
      await pool.query("INSERT INTO object_scripts (id, object_id, script_name, script_code, enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [id, script.objectId, script.scriptName, script.scriptCode, script.enabled, new Date().toISOString(), new Date().toISOString()]);
      return { id, ...script, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    },
    async updateObjectScript(scriptId, accountId, scriptCode, enabled) {
      const scriptResult = await pool.query<{ object_id: string }>("SELECT object_id FROM object_scripts WHERE id = $1", [scriptId]);
      if (!scriptResult.rows[0]) return undefined;
      const objResult = await pool.query<{ owner_account_id: string }>("SELECT owner_account_id FROM region_objects WHERE id = $1", [scriptResult.rows[0].object_id]);
      if (!objResult.rows[0] || objResult.rows[0].owner_account_id !== accountId) return undefined;
      await pool.query("UPDATE object_scripts SET script_code = $2, enabled = $3, updated_at = $4 WHERE id = $1", [scriptId, scriptCode, enabled, new Date().toISOString()]);
      const result = await pool.query("SELECT id, object_id, script_name, script_code, enabled, created_at, updated_at FROM object_scripts WHERE id = $1", [scriptId]);
      const row = result.rows[0];
      return { id: row.id, objectId: row.object_id, scriptName: row.script_name, scriptCode: row.script_code, enabled: row.enabled, createdAt: row.created_at, updatedAt: row.updated_at };
    },
    async deleteObjectScript(scriptId, accountId) {
      const scriptResult = await pool.query<{ object_id: string }>("SELECT object_id FROM object_scripts WHERE id = $1", [scriptId]);
      if (!scriptResult.rows[0]) return false;
      const objResult = await pool.query<{ owner_account_id: string }>("SELECT owner_account_id FROM region_objects WHERE id = $1", [scriptResult.rows[0].object_id]);
      if (!objResult.rows[0] || objResult.rows[0].owner_account_id !== accountId) return false;
      const result = await pool.query("DELETE FROM object_scripts WHERE id = $1", [scriptId]);
      return (result.rowCount ?? 0) > 0;
    },
    async listAssets(accountId) {
      const result = await pool.query("SELECT id, account_id, name, description, asset_type, url, thumbnail_url, price, created_at, updated_at FROM assets WHERE account_id = $1 ORDER BY created_at DESC", [accountId]);
      return result.rows.map((row) => ({ id: row.id, accountId: row.account_id, name: row.name, description: row.description, assetType: row.asset_type, url: row.url, thumbnailUrl: row.thumbnail_url, price: row.price, createdAt: row.created_at, updatedAt: row.updated_at }));
    },
    async createAsset(asset) {
      const id = randomUUID();
      await pool.query("INSERT INTO assets (id, account_id, name, description, asset_type, url, thumbnail_url, price, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [id, asset.accountId, asset.name, asset.description, asset.assetType, asset.url, asset.thumbnailUrl, asset.price, new Date().toISOString(), new Date().toISOString()]);
      return { id, ...asset, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    },
    async deleteAsset(assetId, accountId) {
      const result = await pool.query("DELETE FROM assets WHERE id = $1 AND account_id = $2", [assetId, accountId]);
      return (result.rowCount ?? 0) > 0;
    },
    async listAllMarketListings() {
      const result = await pool.query("SELECT id, seller_account_id, seller_display_name, item_id, item_name, item_kind, price, listing_type, current_bid, current_bidder, current_bidder_name, min_bid, auction_end_time, created_at, status FROM market_listings");
      return result.rows.map((row) => ({
        id: row.id,
        sellerAccountId: row.seller_account_id,
        sellerDisplayName: row.seller_display_name,
        itemId: row.item_id,
        itemName: row.item_name,
        itemKind: row.item_kind,
        price: row.price,
        listingType: row.listing_type,
        currentBid: row.current_bid,
        currentBidder: row.current_bidder,
        currentBidderName: row.current_bidder_name,
        minBid: row.min_bid,
        auctionEndTime: row.auction_end_time ? new Date(row.auction_end_time).toISOString() : null,
        createdAt: new Date(row.created_at).toISOString(),
        status: row.status
      }));
    },
    async saveMarketListing(listing) {
      await pool.query(
        `INSERT INTO market_listings (id, seller_account_id, seller_display_name, item_id, item_name, item_kind, price, listing_type, current_bid, current_bidder, current_bidder_name, min_bid, auction_end_time, created_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET
           current_bid = EXCLUDED.current_bid,
           current_bidder = EXCLUDED.current_bidder,
           current_bidder_name = EXCLUDED.current_bidder_name,
           min_bid = EXCLUDED.min_bid,
           auction_end_time = EXCLUDED.auction_end_time,
           status = EXCLUDED.status`,
        [
          listing.id, listing.sellerAccountId, listing.sellerDisplayName, listing.itemId, listing.itemName,
          listing.itemKind, listing.price, listing.listingType, listing.currentBid, listing.currentBidder,
          listing.currentBidderName, listing.minBid, listing.auctionEndTime, listing.createdAt, listing.status
        ]
      );
    },
    async listAllTradeOffers() {
      const result = await pool.query("SELECT id, from_account_id, from_display_name, to_account_id, to_display_name, offered_items, offered_currency, requested_items, requested_currency, status, created_at FROM trade_offers");
      return result.rows.map((row) => ({
        id: row.id,
        fromAccountId: row.from_account_id,
        fromDisplayName: row.from_display_name,
        toAccountId: row.to_account_id,
        toDisplayName: row.to_display_name,
        offeredItems: row.offered_items,
        offeredCurrency: row.offered_currency,
        requestedItems: row.requested_items,
        requestedCurrency: row.requested_currency,
        status: row.status,
        createdAt: new Date(row.created_at).toISOString()
      }));
    },
    async saveTradeOffer(trade) {
      await pool.query(
        `INSERT INTO trade_offers (id, from_account_id, from_display_name, to_account_id, to_display_name, offered_items, offered_currency, requested_items, requested_currency, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           to_display_name = EXCLUDED.to_display_name,
           status = EXCLUDED.status`,
        [
          trade.id, trade.fromAccountId, trade.fromDisplayName, trade.toAccountId, trade.toDisplayName,
          JSON.stringify(trade.offeredItems), trade.offeredCurrency, JSON.stringify(trade.requestedItems),
          trade.requestedCurrency, trade.status, trade.createdAt
        ]
      );
    },
    async listAllPriceHistory() {
      const result = await pool.query("SELECT id, item_name, price, sold_at FROM price_history");
      return result.rows.map((row) => ({
        id: row.id,
        itemName: row.item_name,
        price: row.price,
        soldAt: new Date(row.sold_at).toISOString()
      }));
    },
    async appendPriceHistory(entry) {
      const id = randomUUID();
      await pool.query("INSERT INTO price_history (id, item_name, price, sold_at) VALUES ($1,$2,$3,$4)", [id, entry.itemName, entry.price, entry.soldAt]);
      return { id, ...entry };
    },
    async listAllStorefronts() {
      const result = await pool.query("SELECT id, account_id, display_name, shop_name, description, banner_color, featured, total_sales, total_revenue, rating, created_at FROM storefronts");
      return result.rows.map((row) => ({
        id: row.id,
        accountId: row.account_id,
        displayName: row.display_name,
        shopName: row.shop_name,
        description: row.description,
        bannerColor: row.banner_color,
        featured: row.featured,
        totalSales: row.total_sales,
        totalRevenue: row.total_revenue,
        rating: row.rating,
        createdAt: new Date(row.created_at).toISOString()
      }));
    },
    async saveStorefront(storefront) {
      await pool.query(
        `INSERT INTO storefronts (id, account_id, display_name, shop_name, description, banner_color, featured, total_sales, total_revenue, rating, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           shop_name = EXCLUDED.shop_name,
           description = EXCLUDED.description,
           banner_color = EXCLUDED.banner_color,
           featured = EXCLUDED.featured,
           total_sales = EXCLUDED.total_sales,
           total_revenue = EXCLUDED.total_revenue,
           rating = EXCLUDED.rating`,
        [
          storefront.id, storefront.accountId, storefront.displayName, storefront.shopName, storefront.description,
          storefront.bannerColor, storefront.featured, storefront.totalSales, storefront.totalRevenue,
          storefront.rating, storefront.createdAt
        ]
      );
    },
    async listAllStorefrontRatings() {
      const result = await pool.query("SELECT account_id, storefront_account_id, rating FROM storefront_ratings");
      return result.rows.map((row) => ({
        accountId: row.account_id,
        storefrontAccountId: row.storefront_account_id,
        rating: row.rating
      }));
    },
    async saveStorefrontRating(rating) {
      await pool.query(
        `INSERT INTO storefront_ratings (account_id, storefront_account_id, rating)
         VALUES ($1,$2,$3)
         ON CONFLICT (account_id, storefront_account_id) DO UPDATE SET rating = EXCLUDED.rating`,
        [rating.accountId, rating.storefrontAccountId, rating.rating]
      );
    },
    async listAllCommissions() {
      const result = await pool.query("SELECT id, client_account_id, client_display_name, builder_account_id, builder_display_name, description, budget, status, created_at, completed_at FROM commissions");
      return result.rows.map((row) => ({
        id: row.id,
        clientAccountId: row.client_account_id,
        clientDisplayName: row.client_display_name,
        builderAccountId: row.builder_account_id,
        builderDisplayName: row.builder_display_name,
        description: row.description,
        budget: row.budget,
        status: row.status,
        createdAt: new Date(row.created_at).toISOString(),
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null
      }));
    },
    async saveCommission(commission) {
      await pool.query(
        `INSERT INTO commissions (id, client_account_id, client_display_name, builder_account_id, builder_display_name, description, budget, status, created_at, completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           builder_display_name = EXCLUDED.builder_display_name,
           status = EXCLUDED.status,
           completed_at = EXCLUDED.completed_at`,
        [
          commission.id, commission.clientAccountId, commission.clientDisplayName, commission.builderAccountId,
          commission.builderDisplayName, commission.description, commission.budget, commission.status,
          commission.createdAt, commission.completedAt
        ]
      );
    },
    async listAllPlayerProgress() {
      const result = await pool.query("SELECT account_id, data FROM player_progress");
      return result.rows.map((row) => ({ accountId: row.account_id, data: row.data }));
    },
    async savePlayerProgress(progress) {
      await pool.query(
        `INSERT INTO player_progress (account_id, data) VALUES ($1,$2)
         ON CONFLICT (account_id) DO UPDATE SET data = EXCLUDED.data`,
        [progress.accountId, JSON.stringify(progress.data)]
      );
    },
  };
}

export async function createPersistenceLayer(): Promise<PersistenceLayer> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return createMemoryPersistence();
  }

  try {
    return await createPostgresPersistence(databaseUrl);
  } catch (error) {
    console.warn("Postgres bootstrap failed, using memory mode instead.", error);
    return createMemoryPersistence();
  }
}
