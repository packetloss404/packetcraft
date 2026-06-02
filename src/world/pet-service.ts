import { randomUUID } from "node:crypto";
import { getSession } from "./store.js";
import { persistence } from "./_shared-state.js";
import type { PetRecord } from "../data/persistence.js";

// --- Types ---

export type PetSpecies = "cat" | "dog" | "bird" | "bunny" | "fox" | "dragon" | "slime" | "owl";
export type PetRarity = "common" | "uncommon" | "rare" | "legendary";
export type PetTrick = "sit" | "roll_over" | "dance" | "jump" | "spin" | "wave" | "play_dead" | "fetch";
export type PetAccessory = "none" | "bow" | "hat" | "scarf" | "collar" | "wings" | "crown";
export type PetAnimation = "idle" | "walk" | "run" | "sit" | "trick" | "sleep" | "eat" | "play";

export type Pet = {
  id: string;
  ownerAccountId: string;
  name: string;
  species: PetSpecies;
  rarity: PetRarity;
  color: string;
  accentColor: string;
  accessory: PetAccessory;
  happiness: number;
  energy: number;
  tricks: PetTrick[];
  level: number;
  xp: number;
  adoptedAt: string;
  lastFedAt: string;
  lastPlayedAt: string;
};

export type PetState = {
  petId: string;
  regionId: string;
  x: number;
  y: number;
  z: number;
  animation: PetAnimation;
  followingOwner: boolean;
  targetX: number;
  targetZ: number;
};

// --- In-memory storage ---

const pets = new Map<string, Pet>();
const petsByOwner = new Map<string, Set<string>>();
// Live presence/session state — intentionally kept in-memory (not durable): which
// pet is summoned, its transient position/animation, and per-region presence sets.
const activePets = new Map<string, string>(); // accountId -> petId
const petStates = new Map<string, PetState>(); // petId -> PetState
const petStatesByRegion = new Map<string, Set<string>>(); // regionId -> Set<petId>

// ── Persistence mapping (write-through cache) ───────────────────────────────

function toPetRecord(p: Pet): PetRecord {
  return {
    id: p.id,
    ownerAccountId: p.ownerAccountId,
    name: p.name,
    species: p.species,
    rarity: p.rarity,
    color: p.color,
    accentColor: p.accentColor,
    accessory: p.accessory,
    happiness: p.happiness,
    energy: p.energy,
    tricks: [...p.tricks],
    level: p.level,
    xp: p.xp,
    adoptedAt: p.adoptedAt,
    lastFedAt: p.lastFedAt,
    lastPlayedAt: p.lastPlayedAt
  };
}

function fromPetRecord(r: PetRecord): Pet {
  return {
    id: r.id,
    ownerAccountId: r.ownerAccountId,
    name: r.name,
    species: r.species as PetSpecies,
    rarity: r.rarity as PetRarity,
    color: r.color,
    accentColor: r.accentColor,
    accessory: r.accessory as PetAccessory,
    happiness: r.happiness,
    energy: r.energy,
    tricks: r.tricks.map((t) => t as PetTrick),
    level: r.level,
    xp: r.xp,
    adoptedAt: r.adoptedAt,
    lastFedAt: r.lastFedAt,
    lastPlayedAt: r.lastPlayedAt
  };
}

function persistPet(p: Pet): void {
  void persistence.savePet(toPetRecord(p));
}

// Hydrate cache from persistence. Called by initializeWorldStore() AFTER the
// canonical persistence layer is set, so durable data survives restarts.
export async function hydratePets(): Promise<void> {
  for (const record of await persistence.listAllPets()) {
    const pet = fromPetRecord(record);
    pets.set(pet.id, pet);
    getOwnerPets(pet.ownerAccountId).add(pet.id);
  }
}

// --- Constants ---

const ALL_SPECIES: PetSpecies[] = ["cat", "dog", "bird", "bunny", "fox", "dragon", "slime", "owl"];
const ALL_TRICKS: PetTrick[] = ["sit", "roll_over", "dance", "jump", "spin", "wave", "play_dead", "fetch"];
const FEED_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const XP_PER_PLAY = 15;
const XP_PER_FEED = 5;
const XP_PER_TRICK = 10;
const TRICK_LEARN_CHANCE = 0.2;

const LEVEL_THRESHOLDS: number[] = [];
for (let i = 0; i < 20; i++) {
  LEVEL_THRESHOLDS.push((i + 1) * 100);
}

const PALETTE = [
  "#f5a623", "#d0021b", "#7ed321", "#4a90d9", "#9013fe",
  "#f8e71c", "#50e3c2", "#b8e986", "#ff6b6b", "#c49b6c",
  "#8b572a", "#e8e8e8", "#ff9ff3", "#48dbfb", "#feca57"
];

// --- Helpers ---

function rollRarity(): PetRarity {
  const roll = Math.random() * 100;
  if (roll < 1) return "legendary";
  if (roll < 5) return "rare";
  if (roll < 20) return "uncommon";
  return "common";
}

function randomColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

function getOwnerPets(accountId: string): Set<string> {
  let set = petsByOwner.get(accountId);
  if (!set) {
    set = new Set();
    petsByOwner.set(accountId, set);
  }
  return set;
}

function getRegionPetSet(regionId: string): Set<string> {
  let set = petStatesByRegion.get(regionId);
  if (!set) {
    set = new Set();
    petStatesByRegion.set(regionId, set);
  }
  return set;
}

// --- Public API ---

export function adoptPet(token: string, name: string, species: PetSpecies): Pet | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  if (!ALL_SPECIES.includes(species)) return undefined;

  const trimmed = (name ?? "").trim().slice(0, 24);
  if (!trimmed) return undefined;

  const pet: Pet = {
    id: randomUUID(),
    ownerAccountId: session.accountId,
    name: trimmed,
    species,
    rarity: rollRarity(),
    color: randomColor(),
    accentColor: randomColor(),
    accessory: "none",
    happiness: 50,
    energy: 80,
    tricks: [],
    level: 1,
    xp: 0,
    adoptedAt: new Date().toISOString(),
    lastFedAt: new Date(0).toISOString(),
    lastPlayedAt: new Date(0).toISOString()
  };

  pets.set(pet.id, pet);
  getOwnerPets(session.accountId).add(pet.id);
  persistPet(pet);

  return pet;
}

export function listPets(token: string): Pet[] {
  const session = getSession(token);
  if (!session) return [];

  const ids = getOwnerPets(session.accountId);
  const result: Pet[] = [];
  for (const id of ids) {
    const pet = pets.get(id);
    if (pet) result.push(pet);
  }
  return result;
}

export function getActivePet(token: string): { pet: Pet; state: PetState } | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const petId = activePets.get(session.accountId);
  if (!petId) return undefined;

  const pet = pets.get(petId);
  const state = petStates.get(petId);
  if (!pet || !state) return undefined;

  return { pet, state };
}

export function summonPet(token: string, petId: string): { pet: Pet; state: PetState } | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const pet = pets.get(petId);
  if (!pet || pet.ownerAccountId !== session.accountId) return undefined;

  // Dismiss existing active pet first
  const currentActive = activePets.get(session.accountId);
  if (currentActive) {
    const oldState = petStates.get(currentActive);
    if (oldState) {
      getRegionPetSet(oldState.regionId).delete(currentActive);
    }
    petStates.delete(currentActive);
  }

  const state: PetState = {
    petId: pet.id,
    regionId: session.regionId,
    x: 0,
    y: 0,
    z: 0,
    animation: "idle",
    followingOwner: true,
    targetX: 0,
    targetZ: 0
  };

  activePets.set(session.accountId, pet.id);
  petStates.set(pet.id, state);
  getRegionPetSet(session.regionId).add(pet.id);

  return { pet, state };
}

export function dismissPet(token: string): { petId: string; regionId: string } | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const petId = activePets.get(session.accountId);
  if (!petId) return undefined;

  const state = petStates.get(petId);
  const regionId = state?.regionId ?? session.regionId;

  activePets.delete(session.accountId);
  petStates.delete(petId);
  getRegionPetSet(regionId).delete(petId);

  return { petId, regionId };
}

export function feedPet(token: string, petId: string): { pet: Pet; message: string } | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const pet = pets.get(petId);
  if (!pet || pet.ownerAccountId !== session.accountId) return undefined;

  const now = Date.now();
  const lastFed = new Date(pet.lastFedAt).getTime();
  if (now - lastFed < FEED_COOLDOWN_MS) {
    const remaining = Math.ceil((FEED_COOLDOWN_MS - (now - lastFed)) / 1000);
    return { pet, message: `Pet was recently fed. Wait ${remaining}s.` };
  }

  pet.happiness = Math.min(100, pet.happiness + 15);
  pet.energy = Math.min(100, pet.energy + 20);
  pet.xp += XP_PER_FEED;
  pet.lastFedAt = new Date().toISOString();

  levelUpCheck(pet);
  persistPet(pet);

  return { pet, message: `${pet.name} happily munches away!` };
}

export function playWithPet(token: string, petId: string): { pet: Pet; message: string; learnedTrick?: PetTrick } | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const pet = pets.get(petId);
  if (!pet || pet.ownerAccountId !== session.accountId) return undefined;

  if (pet.energy < 10) {
    return { pet, message: `${pet.name} is too tired to play. Feed them first!` };
  }

  pet.happiness = Math.min(100, pet.happiness + 10);
  pet.energy = Math.max(0, pet.energy - 15);
  pet.xp += XP_PER_PLAY;
  pet.lastPlayedAt = new Date().toISOString();

  let learnedTrick: PetTrick | undefined;

  // Chance to learn a new trick
  if (Math.random() < TRICK_LEARN_CHANCE) {
    const unknownTricks = ALL_TRICKS.filter((t) => !pet.tricks.includes(t));
    if (unknownTricks.length > 0) {
      learnedTrick = unknownTricks[Math.floor(Math.random() * unknownTricks.length)];
      pet.tricks.push(learnedTrick);
    }
  }

  levelUpCheck(pet);
  persistPet(pet);

  const msg = learnedTrick
    ? `${pet.name} learned a new trick: ${learnedTrick}!`
    : `${pet.name} plays enthusiastically!`;

  return { pet, message: msg, learnedTrick };
}

export function petPet(token: string, petId: string): { pet: Pet; message: string } | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const pet = pets.get(petId);
  if (!pet || pet.ownerAccountId !== session.accountId) return undefined;

  pet.happiness = Math.min(100, pet.happiness + 3);
  persistPet(pet);

  return { pet, message: `${pet.name} purrs contentedly.` };
}

export function renamePet(token: string, petId: string, newName: string): Pet | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const pet = pets.get(petId);
  if (!pet || pet.ownerAccountId !== session.accountId) return undefined;

  const trimmed = (newName ?? "").trim().slice(0, 24);
  if (!trimmed) return undefined;

  pet.name = trimmed;
  persistPet(pet);
  return pet;
}

export function customizePet(
  token: string,
  petId: string,
  color?: string,
  accentColor?: string,
  accessory?: PetAccessory
): Pet | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const pet = pets.get(petId);
  if (!pet || pet.ownerAccountId !== session.accountId) return undefined;

  if (color !== undefined) pet.color = color;
  if (accentColor !== undefined) pet.accentColor = accentColor;
  if (accessory !== undefined) pet.accessory = accessory;
  persistPet(pet);

  return pet;
}

export function performTrick(
  token: string,
  petId: string,
  trick: PetTrick
): { pet: Pet; state?: PetState; message: string } | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const pet = pets.get(petId);
  if (!pet || pet.ownerAccountId !== session.accountId) return undefined;

  if (!pet.tricks.includes(trick)) {
    return { pet, message: `${pet.name} doesn't know how to ${trick} yet.` };
  }

  if (pet.energy < 5) {
    return { pet, message: `${pet.name} is too tired to perform tricks.` };
  }

  pet.energy = Math.max(0, pet.energy - 5);
  pet.xp += XP_PER_TRICK;

  levelUpCheck(pet);
  persistPet(pet);

  const state = petStates.get(petId);
  if (state) {
    state.animation = "trick";
  }

  return { pet, state, message: `${pet.name} performs ${trick}!` };
}

export function updatePetPosition(
  accountId: string,
  regionId: string,
  ownerX: number,
  ownerZ: number
): PetState | undefined {
  const petId = activePets.get(accountId);
  if (!petId) return undefined;

  const state = petStates.get(petId);
  if (!state) return undefined;

  // If pet changed regions, update tracking
  if (state.regionId !== regionId) {
    getRegionPetSet(state.regionId).delete(petId);
    state.regionId = regionId;
    getRegionPetSet(regionId).add(petId);
  }

  // AI follow logic: move toward owner with slight offset
  const offsetX = 1.5;
  const offsetZ = 1.5;
  state.targetX = ownerX + offsetX;
  state.targetZ = ownerZ + offsetZ;

  // Lerp toward target
  const dx = state.targetX - state.x;
  const dz = state.targetZ - state.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist > 0.3) {
    const speed = Math.min(dist, 0.6);
    state.x += (dx / dist) * speed;
    state.z += (dz / dist) * speed;
    state.animation = dist > 3 ? "run" : "walk";
    state.followingOwner = true;
  } else {
    state.animation = "idle";
  }

  state.y = 0;

  return state;
}

export function getPetStates(regionId: string): { pet: Pet; state: PetState }[] {
  const petIds = petStatesByRegion.get(regionId);
  if (!petIds) return [];

  const result: { pet: Pet; state: PetState }[] = [];
  for (const petId of petIds) {
    const pet = pets.get(petId);
    const state = petStates.get(petId);
    if (pet && state) {
      result.push({ pet, state });
    }
  }
  return result;
}

export function levelUpCheck(pet: Pet): boolean {
  if (pet.level >= 20) return false;

  const threshold = LEVEL_THRESHOLDS[pet.level - 1];
  if (pet.xp < threshold) return false;

  pet.xp -= threshold;
  pet.level += 1;

  // Grant a new trick on level up if possible
  const unknownTricks = ALL_TRICKS.filter((t) => !pet.tricks.includes(t));
  if (unknownTricks.length > 0) {
    const newTrick = unknownTricks[Math.floor(Math.random() * unknownTricks.length)];
    pet.tricks.push(newTrick);
  }

  return true;
}
