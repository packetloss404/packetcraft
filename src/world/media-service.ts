import { randomUUID } from "node:crypto";
import { getSession } from "./store.js";
import { persistence } from "./_shared-state.js";
import type { MediaItemRecord } from "../data/persistence.js";

// --- Types ---

export type MediaType = "photo_frame" | "video_screen" | "projection" | "billboard" | "slideshow";

export type PhotoFrameConfig = {
  photoId: string;
  frameStyle: "wood" | "metal" | "ornate" | "minimal" | "none";
  size: "small" | "medium" | "large";
};

export type VideoScreenConfig = {
  url: string;
  autoplay: boolean;
  loop: boolean;
  volume: number;
};

export type BillboardConfig = {
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
};

export type SlideshowConfig = {
  photoIds: string[];
  intervalSeconds: number;
  transition: "fade" | "slide" | "none";
};

export type ProjectionConfig = Record<string, unknown>;

export type MediaObject = {
  id: string;
  objectId: string;
  mediaType: MediaType;
  config: Record<string, unknown>;
  regionId: string;
  ownerAccountId: string;
  createdAt: string;
};

// --- In-memory store (write-through cache, keyed by objectId) ---

const mediaObjects = new Map<string, MediaObject>();

// ── Persistence mapping (write-through cache) ───────────────────────────────

function toMediaRecord(m: MediaObject): MediaItemRecord {
  return {
    id: m.id,
    objectId: m.objectId,
    mediaType: m.mediaType,
    config: { ...m.config },
    regionId: m.regionId,
    ownerAccountId: m.ownerAccountId,
    createdAt: m.createdAt,
  };
}

function fromMediaRecord(r: MediaItemRecord): MediaObject {
  return {
    id: r.id,
    objectId: r.objectId,
    mediaType: r.mediaType as MediaType,
    config: { ...r.config },
    regionId: r.regionId,
    ownerAccountId: r.ownerAccountId,
    createdAt: r.createdAt,
  };
}

function persistMedia(m: MediaObject): void {
  void persistence.saveMediaItem(toMediaRecord(m));
}

// Hydrate cache from persistence. Called by initializeWorldStore() AFTER the
// canonical persistence layer is set, so durable user media survives restarts.
export async function hydrateMedia(): Promise<void> {
  for (const record of await persistence.listAllMediaItems()) {
    const media = fromMediaRecord(record);
    mediaObjects.set(media.objectId, media);
  }
}

// --- Validation ---

const FRAME_STYLES = ["wood", "metal", "ornate", "minimal", "none"];
const SIZES = ["small", "medium", "large"];
const TRANSITIONS = ["fade", "slide", "none"];

export function validateMediaConfig(mediaType: MediaType, config: Record<string, unknown>): { valid: boolean; reason?: string } {
  switch (mediaType) {
    case "photo_frame": {
      if (typeof config.photoId !== "string" || !config.photoId) {
        return { valid: false, reason: "photoId is required" };
      }
      if (!FRAME_STYLES.includes(config.frameStyle as string)) {
        return { valid: false, reason: `frameStyle must be one of: ${FRAME_STYLES.join(", ")}` };
      }
      if (!SIZES.includes(config.size as string)) {
        return { valid: false, reason: `size must be one of: ${SIZES.join(", ")}` };
      }
      return { valid: true };
    }
    case "video_screen": {
      if (typeof config.url !== "string" || !config.url) {
        return { valid: false, reason: "url is required" };
      }
      if (typeof config.autoplay !== "boolean") {
        return { valid: false, reason: "autoplay must be a boolean" };
      }
      if (typeof config.loop !== "boolean") {
        return { valid: false, reason: "loop must be a boolean" };
      }
      if (typeof config.volume !== "number" || config.volume < 0 || config.volume > 1) {
        return { valid: false, reason: "volume must be a number between 0 and 1" };
      }
      return { valid: true };
    }
    case "billboard": {
      if (typeof config.text !== "string" || !config.text) {
        return { valid: false, reason: "text is required" };
      }
      if (typeof config.backgroundColor !== "string") {
        return { valid: false, reason: "backgroundColor is required" };
      }
      if (typeof config.textColor !== "string") {
        return { valid: false, reason: "textColor is required" };
      }
      if (typeof config.fontSize !== "number" || config.fontSize <= 0) {
        return { valid: false, reason: "fontSize must be a positive number" };
      }
      return { valid: true };
    }
    case "slideshow": {
      if (!Array.isArray(config.photoIds) || config.photoIds.length === 0) {
        return { valid: false, reason: "photoIds must be a non-empty array" };
      }
      for (const id of config.photoIds) {
        if (typeof id !== "string") {
          return { valid: false, reason: "each photoId must be a string" };
        }
      }
      if (typeof config.intervalSeconds !== "number" || config.intervalSeconds <= 0) {
        return { valid: false, reason: "intervalSeconds must be a positive number" };
      }
      if (!TRANSITIONS.includes(config.transition as string)) {
        return { valid: false, reason: `transition must be one of: ${TRANSITIONS.join(", ")}` };
      }
      return { valid: true };
    }
    case "projection": {
      return { valid: true };
    }
    default:
      return { valid: false, reason: `unknown media type: ${mediaType}` };
  }
}

// --- Service functions ---

export async function createMediaObject(
  token: string,
  objectId: string,
  mediaType: MediaType,
  config: Record<string, unknown>
): Promise<MediaObject | undefined> {
  const session = getSession(token);
  if (!session) return undefined;

  const validation = validateMediaConfig(mediaType, config);
  if (!validation.valid) return undefined;

  // Only one media attachment per object
  for (const media of mediaObjects.values()) {
    if (media.objectId === objectId) return undefined;
  }

  const media: MediaObject = {
    id: randomUUID(),
    objectId,
    mediaType,
    config,
    regionId: session.regionId,
    ownerAccountId: session.accountId,
    createdAt: new Date().toISOString(),
  };

  mediaObjects.set(objectId, media);
  persistMedia(media);
  return media;
}

export async function updateMediaConfig(
  token: string,
  objectId: string,
  config: Record<string, unknown>
): Promise<MediaObject | undefined> {
  const session = getSession(token);
  if (!session) return undefined;

  const media = mediaObjects.get(objectId);
  if (!media) return undefined;
  if (media.ownerAccountId !== session.accountId) return undefined;

  const validation = validateMediaConfig(media.mediaType, config);
  if (!validation.valid) return undefined;

  const updated: MediaObject = { ...media, config };
  mediaObjects.set(objectId, updated);
  persistMedia(updated);
  return updated;
}

export async function removeMediaObject(
  token: string,
  objectId: string
): Promise<boolean> {
  const session = getSession(token);
  if (!session) return false;

  const media = mediaObjects.get(objectId);
  if (!media) return false;
  if (media.ownerAccountId !== session.accountId) return false;

  mediaObjects.delete(objectId);
  void persistence.deleteMediaItem(objectId);
  return true;
}

export async function getMediaObject(objectId: string): Promise<MediaObject | undefined> {
  return mediaObjects.get(objectId);
}

export async function listMediaObjects(regionId: string): Promise<MediaObject[]> {
  const result: MediaObject[] = [];
  for (const media of mediaObjects.values()) {
    if (media.regionId === regionId) {
      result.push(media);
    }
  }
  return result;
}
