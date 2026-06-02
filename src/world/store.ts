// ── Barrel re-export ────────────────────────────────────────────────────────
// This file re-exports every public symbol from the domain service modules so
// that existing `import … from "./store.js"` lines elsewhere keep working.

import { createPersistenceLayer } from "../data/persistence.js";
import {
  setPersistence,
  setRegions,
  avatarsByRegion,
  persistence,
  regions
} from "./_shared-state.js";
import { hydrateMarketplace } from "./marketplace-service.js";
import { hydrateStorefronts } from "./storefront-service.js";
import { hydrateAchievements } from "./achievement-service.js";
import { hydratePets } from "./pet-service.js";
import { hydratePhotos } from "./photo-service.js";
import { hydrateHomes } from "./home-service.js";
import { hydrateHomeRatings } from "./home-rating-service.js";

// ── Shared types & helpers (re-exported from _shared-state) ─────────────────
export type {
  RegionSummary,
  Account,
  InventoryItem,
  AvatarAppearance,
  Parcel,
  RegionObject,
  TeleportPoint,
  Friend,
  Group,
  GroupMember,
  CurrencyTransaction,
  OfflineMessage,
  AvatarProfile,
  Ban,
  RegionNotice,
  ObjectPermissions,
  ObjectScript,
  Asset,
  BuildPermission,
  Session,
  AvatarState,
  AuditLog
} from "./_shared-state.js";

export {
  getSession,
  getRegionPopulation,
  appendAuditLog
} from "./_shared-state.js";

// ── Auth ────────────────────────────────────────────────────────────────────
export {
  createGuestSession,
  registerSession,
  loginSession,
  createMcSession,
  linkMcAccount,
  removeAvatar
} from "./auth-service.js";

// ── Avatar ──────────────────────────────────────────────────────────────────
export {
  moveAvatar,
  updateAvatarAppearance,
  equipInventoryItem,
  teleportToRegion,
  listTeleportPoints,
  createTeleportPoint,
  deleteTeleportPoint
} from "./avatar-service.js";

// ── Parcel ──────────────────────────────────────────────────────────────────
export {
  listParcels,
  claimParcel,
  releaseParcel,
  addParcelCollaborator,
  removeParcelCollaborator,
  transferParcel
} from "./parcel-service.js";

// ── Object ──────────────────────────────────────────────────────────────────
export {
  listRegionObjects,
  createRegionObject,
  updateRegionObject,
  deleteRegionObject,
  getObjectPermissions,
  saveObjectPermissions,
  handleGroupObjects,
  handleUngroupObjects,
  handleDuplicateGroup,
  snapPositionToGrid,
  listObjectScripts,
  createObjectScript,
  updateObjectScript,
  deleteObjectScript
} from "./object-service.js";

// ── Social ──────────────────────────────────────────────────────────────────
export {
  listFriends,
  addFriend,
  removeFriend,
  blockAccount,
  unblockAccount,
  listGroups,
  createGroup,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  sendOfflineMessage,
  listOfflineMessages,
  markMessageRead,
  getAvatarProfile,
  saveAvatarProfile
} from "./social-service.js";

// ── Economy ─────────────────────────────────────────────────────────────────
export {
  getCurrencyBalance,
  sendCurrency,
  listCurrencyTransactions,
  listAssets,
  createAsset,
  deleteAsset,
  getBalanceByAccount,
  hasBalanceByAccount,
  serverTransfer
} from "./economy-service.js";

// ── Admin ───────────────────────────────────────────────────────────────────
export {
  adminAssignParcel,
  adminDeleteRegionObject,
  listAuditLogs,
  banAccount,
  unbanAccount,
  getActiveBan,
  listRegionNotices,
  createRegionNotice,
  deleteRegionNotice
} from "./admin-service.js";

// ── Emote ───────────────────────────────────────────────────────────────────
export {
  EMOTE_LIST,
  getEmoteList,
  handleEmote
} from "./emote-service.js";

// ── Chat ────────────────────────────────────────────────────────────────────
export {
  handleChatMessage,
  getChatHistory,
  handleWhisper
} from "./chat-service.js";

// ── Blueprint ──────────────────────────────────────────────────────────────
export type { Blueprint } from "./blueprint-service.js";
export {
  createBlueprint,
  listBlueprints,
  getBlueprint,
  deleteBlueprint,
  placeBlueprint,
  groupMoveObjects,
  groupDeleteObjects,
  duplicateObjects
} from "./blueprint-service.js";

// ── Initialization & metadata ───────────────────────────────────────────────

export async function initializeWorldStore() {
  setPersistence(await createPersistenceLayer());
  setRegions(await persistence.listRegions());

  for (const region of regions) {
    if (!avatarsByRegion.has(region.id)) {
      avatarsByRegion.set(region.id, new Map());
    }
  }

  // Hydrate durable in-memory service caches from the now-canonical persistence.
  await hydrateMarketplace();
  await hydrateStorefronts();
  await hydrateAchievements();
  await hydratePets();
  await hydratePhotos();
  await hydrateHomes();
  await hydrateHomeRatings();
}

export function listRegions() {
  return regions;
}

export function getPersistenceMode() {
  return persistence.mode;
}

// ── Home Service ──────────────────────────────────────────────────────────
export {
  setHome,
  getHome,
  clearHome,
  teleportHome,
  setHomePrivacy,
  getHomePrivacy,
  getHomeByAccountId,
  checkHomeAccess,
  findHomeParcelOwner,
  shouldRingDoorbell,
  type HomeData,
  type HomePrivacy
} from "./home-service.js";

// ── Home Ratings ──────────────────────────────────────────────────────────
export {
  rateHome,
  favoriteHome,
  getHomeRatings,
  getHomeVisitorCount,
  incrementVisitorCount,
  getFavoriteHomes,
  getFeaturedHomes,
  getShowcaseHomes,
} from "./home-rating-service.js";
export type { HomeRating, HomeRatingsSummary, FeaturedHome } from "./home-rating-service.js";

// ── Marketplace ───────────────────────────────────────────────────────────
import { getSession as _getSession } from "./_shared-state.js";
import { getCurrencyBalance as _getCurrencyBalance, sendCurrency as _sendCurrency } from "./economy-service.js";
import {
  initMarketplace,
  createListing as _createListing,
  listMarketplace as _listMarketplace,
  buyListing as _buyListing,
  placeBid as _placeBid,
  cancelListing as _cancelListing,
  getListingHistory as _getListingHistory,
  getPriceHistory as _getPriceHistory,
  createTradeOffer as _createTradeOffer,
  acceptTrade as _acceptTrade,
  declineTrade as _declineTrade,
  listTradeOffers as _listTradeOffers,
} from "./marketplace-service.js";
export type { MarketListing, TradeOffer } from "./marketplace-service.js";

initMarketplace({
  getSession: _getSession,
  getCurrencyBalance: _getCurrencyBalance,
  sendCurrency: _sendCurrency,
  getInventory: async (accountId: string) => persistence.getInventory(accountId),
});

export const createListing = _createListing;
export const listMarketplace = _listMarketplace;
export const buyListing = _buyListing;
export const placeBid = _placeBid;
export const cancelListing = _cancelListing;
export const getListingHistory = _getListingHistory;
export const getPriceHistory = _getPriceHistory;
export const createTradeOffer = _createTradeOffer;
export const acceptTrade = _acceptTrade;
export const declineTrade = _declineTrade;
export const listTradeOffers = _listTradeOffers;

// ── Storefront ────────────────────────────────────────────────────────────
export {
  createStorefront,
  getStorefront,
  updateStorefront,
  listStorefronts,
  recordSale,
  rateStorefront,
  getTrendingItems,
  createCommission,
  acceptCommission,
  updateCommissionStatus,
  completeCommission,
  listCommissions,
} from "./storefront-service.js";
export type { Storefront, Commission } from "./storefront-service.js";

// ── Achievements ──────────────────────────────────────────────────────────
export {
  getPlayerProgress,
  checkAndAwardAchievements,
  incrementStat,
  visitRegion as achievementVisitRegion,
  generateDailyChallenges,
  generateWeeklyChallenges,
  getLeaderboard,
  getAvailableTitles,
  setTitle,
  listAllAchievements,
  onObjectPlaced,
  onChatMessage,
  onFriendAdded,
  onRegionVisited,
  onBlockPlaced,
  onBlockBroken,
} from "./achievement-service.js";

// ── Voice Chat ────────────────────────────────────────────────────────────
export {
  joinVoiceChannel,
  leaveVoiceChannel,
  setVoiceMuted,
  setVoiceDeafened,
  updateVoicePosition,
  getVoiceParticipants,
  calculateSpatialVolume,
  getICEServers,
  cleanupVoiceForAccount,
} from "./voice-service.js";
export type { VoiceParticipant, VoiceChannel, ICEServer } from "./voice-service.js";

// ── Voice Indicators ──────────────────────────────────────────────────────
export {
  setSpeaking,
  getSpeakingAvatars,
  removeAccountFromVoice,
  clearRegionVoice,
} from "./voice-indicator-service.js";
export type { SpeakingState } from "./voice-indicator-service.js";

// ── Pets ──────────────────────────────────────────────────────────────────
export {
  adoptPet,
  listPets as listUserPets,
  getActivePet,
  summonPet,
  dismissPet,
  feedPet,
  playWithPet,
  petPet,
  renamePet,
  customizePet,
  performTrick,
  updatePetPosition,
  getPetStates,
  levelUpCheck,
} from "./pet-service.js";
export type {
  Pet,
  PetState,
  PetSpecies,
  PetRarity,
  PetTrick,
  PetAccessory,
  PetAnimation,
} from "./pet-service.js";

// ── Photography ──────────────────────────────────────────────────────────
export {
  takePhoto,
  listPhotos,
  getPhoto,
  deletePhoto,
  likePhoto,
  commentOnPhoto,
  getPhotoFeed,
  getPlayerGallery,
  getFeaturedPhotos,
} from "./photo-service.js";
export type { Photo, PhotoFilter, PhotoComment } from "./photo-service.js";

// ── Placeable Media ──────────────────────────────────────────────────────
export {
  validateMediaConfig,
  createMediaObject,
  updateMediaConfig,
  removeMediaObject,
  getMediaObject,
  listMediaObjects,
} from "./media-service.js";
export type {
  MediaType,
  MediaObject,
  PhotoFrameConfig,
  VideoScreenConfig,
  BillboardConfig,
  SlideshowConfig,
} from "./media-service.js";

// ── Build Permission ──────────────────────────────────────────────────
export { checkBuildPermissionByAccount } from "./_shared-state.js";
