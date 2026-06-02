import { randomUUID } from "node:crypto";
import { getSession } from "./store.js";
import { persistence } from "./_shared-state.js";
import type { PhotoRecord } from "../data/persistence.js";

// --- Types ---

export type PhotoFilter =
  | "none"
  | "vintage"
  | "noir"
  | "warm"
  | "cool"
  | "dreamy"
  | "pixel"
  | "posterize";

export type PhotoComment = {
  id: string;
  accountId: string;
  displayName: string;
  text: string;
  createdAt: string;
};

export type Photo = {
  id: string;
  accountId: string;
  displayName: string;
  regionId: string;
  title: string;
  description: string;
  filter: PhotoFilter;
  width: number;
  height: number;
  thumbnailData: string; // base64, max 50KB
  position: { x: number; y: number; z: number };
  cameraRotation: { x: number; y: number };
  likes: string[];
  comments: PhotoComment[];
  visibility: "public" | "friends" | "private";
  createdAt: string;
};

// --- In-memory store ---

const photos = new Map<string, Photo>();

const MAX_THUMBNAIL_BYTES = 50 * 1024;

// ── Persistence mapping (write-through cache) ───────────────────────────────

function toPhotoRecord(p: Photo): PhotoRecord {
  return {
    id: p.id,
    accountId: p.accountId,
    displayName: p.displayName,
    regionId: p.regionId,
    title: p.title,
    description: p.description,
    filter: p.filter,
    width: p.width,
    height: p.height,
    thumbnailData: p.thumbnailData,
    position: { ...p.position },
    cameraRotation: { ...p.cameraRotation },
    likes: [...p.likes],
    comments: p.comments.map((c) => ({ ...c })),
    visibility: p.visibility,
    createdAt: p.createdAt
  };
}

function fromPhotoRecord(r: PhotoRecord): Photo {
  return {
    id: r.id,
    accountId: r.accountId,
    displayName: r.displayName,
    regionId: r.regionId,
    title: r.title,
    description: r.description,
    filter: r.filter as PhotoFilter,
    width: r.width,
    height: r.height,
    thumbnailData: r.thumbnailData,
    position: { ...r.position },
    cameraRotation: { ...r.cameraRotation },
    likes: [...r.likes],
    comments: r.comments.map((c) => ({ ...c })),
    visibility: r.visibility,
    createdAt: r.createdAt
  };
}

function persistPhoto(p: Photo): void {
  void persistence.savePhoto(toPhotoRecord(p));
}

// Hydrate cache from persistence. Called by initializeWorldStore() AFTER the
// canonical persistence layer is set, so durable data survives restarts.
export async function hydratePhotos(): Promise<void> {
  for (const record of await persistence.listAllPhotos()) {
    photos.set(record.id, fromPhotoRecord(record));
  }
}

// --- Service functions ---

export function takePhoto(
  token: string,
  regionId: string,
  title: string,
  thumbnailData: string,
  filter: PhotoFilter,
  position: { x: number; y: number; z: number },
  cameraRotation: { x: number; y: number }
): Photo | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  // Validate thumbnail size (base64 is ~4/3 of binary size)
  const estimatedBytes = Math.ceil(thumbnailData.length * 0.75);
  if (estimatedBytes > MAX_THUMBNAIL_BYTES) return undefined;

  const photo: Photo = {
    id: randomUUID(),
    accountId: session.accountId,
    displayName: session.displayName,
    regionId,
    title: title.slice(0, 128),
    description: "",
    filter,
    width: 0,
    height: 0,
    thumbnailData,
    position,
    cameraRotation,
    likes: [],
    comments: [],
    visibility: "public",
    createdAt: new Date().toISOString(),
  };

  photos.set(photo.id, photo);
  persistPhoto(photo);
  return photo;
}

export function listPhotos(
  accountId?: string,
  regionId?: string,
  limit = 20,
  offset = 0
): Photo[] {
  let results = [...photos.values()];

  if (accountId) {
    results = results.filter((p) => p.accountId === accountId);
  }

  if (regionId) {
    results = results.filter((p) => p.regionId === regionId);
  }

  // Only show public photos when browsing (no auth filter)
  results = results.filter((p) => p.visibility === "public");

  results.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return results.slice(offset, offset + Math.min(limit, 100));
}

export function getPhoto(photoId: string): Photo | undefined {
  return photos.get(photoId);
}

export function deletePhoto(token: string, photoId: string): boolean {
  const session = getSession(token);
  if (!session) return false;

  const photo = photos.get(photoId);
  if (!photo) return false;

  // Only owner or admin can delete
  if (photo.accountId !== session.accountId && session.role !== "admin") {
    return false;
  }

  photos.delete(photoId);
  void persistence.deletePhoto(photoId);
  return true;
}

export function likePhoto(
  token: string,
  photoId: string
): Photo | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const photo = photos.get(photoId);
  if (!photo) return undefined;

  const idx = photo.likes.indexOf(session.accountId);
  if (idx >= 0) {
    // Unlike (toggle)
    photo.likes.splice(idx, 1);
  } else {
    photo.likes.push(session.accountId);
  }

  persistPhoto(photo);
  return photo;
}

export function commentOnPhoto(
  token: string,
  photoId: string,
  text: string
): Photo | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const photo = photos.get(photoId);
  if (!photo) return undefined;

  const comment: PhotoComment = {
    id: randomUUID(),
    accountId: session.accountId,
    displayName: session.displayName,
    text: text.slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  photo.comments.push(comment);
  persistPhoto(photo);
  return photo;
}

export function getPhotoFeed(limit = 20): Photo[] {
  const results = [...photos.values()].filter(
    (p) => p.visibility === "public"
  );

  // Sort by most recent first
  results.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return results.slice(0, Math.min(limit, 100));
}

export function getPlayerGallery(
  accountId: string,
  limit = 20,
  offset = 0
): Photo[] {
  const results = [...photos.values()]
    .filter((p) => p.accountId === accountId && p.visibility === "public")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return results.slice(offset, offset + Math.min(limit, 100));
}

export function getFeaturedPhotos(limit = 10): Photo[] {
  const results = [...photos.values()].filter(
    (p) => p.visibility === "public"
  );

  // Sort by most likes, then by recent
  results.sort((a, b) => {
    const likeDiff = b.likes.length - a.likes.length;
    if (likeDiff !== 0) return likeDiff;
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  return results.slice(0, Math.min(limit, 50));
}
