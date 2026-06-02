import { getSession, type Session } from "./store.js";
import { persistence } from "./_shared-state.js";

// ── Types ──────────────────────────────────────────────────────────────────

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: "explorer" | "builder" | "social" | "collector";
  icon: string;
  xpReward: number;
  requirement: { type: string; count: number };
};

export type PlayerProgress = {
  accountId: string;
  xp: number;
  level: number;
  title: string;
  unlockedAchievements: string[];
  stats: {
    regionsVisited: string[];
    objectsPlaced: number;
    chatMessages: number;
    friendsMade: number;
    eventsAttended: number;
    itemsCollected: number;
    totalPlayTime: number;
    blocksPlaced: number;
    blocksBroken: number;
  };
  dailyChallenges: DailyChallenge[];
  weeklyChallenges: WeeklyChallenge[];
};

export type DailyChallenge = {
  id: string;
  description: string;
  requirement: { type: string; count: number };
  progress: number;
  completed: boolean;
  xpReward: number;
  expiresAt: string;
};

export type WeeklyChallenge = {
  id: string;
  description: string;
  requirement: { type: string; count: number };
  progress: number;
  completed: boolean;
  xpReward: number;
  expiresAt: string;
};

// ── Predefined Achievements (20+) ─────────────────────────────────────────

const ACHIEVEMENTS: Achievement[] = [
  // Explorer
  { id: "explorer_first_steps", name: "First Steps", description: "Visit your first region", category: "explorer", icon: "compass", xpReward: 25, requirement: { type: "regions_visited", count: 1 } },
  { id: "explorer_wanderer", name: "Wanderer", description: "Visit 3 different regions", category: "explorer", icon: "map", xpReward: 75, requirement: { type: "regions_visited", count: 3 } },
  { id: "explorer_cartographer", name: "Cartographer", description: "Visit 6 different regions", category: "explorer", icon: "globe", xpReward: 200, requirement: { type: "regions_visited", count: 6 } },
  { id: "explorer_teleporter", name: "Frequent Flyer", description: "Teleport 10 times", category: "explorer", icon: "zap", xpReward: 100, requirement: { type: "teleports", count: 10 } },
  { id: "explorer_marathon", name: "Marathon Runner", description: "Walk 1000 distance units", category: "explorer", icon: "footprints", xpReward: 150, requirement: { type: "distance_walked", count: 1000 } },

  // Builder
  { id: "builder_first_build", name: "First Build", description: "Place your first object", category: "builder", icon: "hammer", xpReward: 25, requirement: { type: "objects_placed", count: 1 } },
  { id: "builder_handyman", name: "Handyman", description: "Place 10 objects", category: "builder", icon: "wrench", xpReward: 75, requirement: { type: "objects_placed", count: 10 } },
  { id: "builder_architect", name: "Architect", description: "Place 50 objects", category: "builder", icon: "building", xpReward: 200, requirement: { type: "objects_placed", count: 50 } },
  { id: "builder_master", name: "Master Builder", description: "Place 100 objects", category: "builder", icon: "castle", xpReward: 500, requirement: { type: "objects_placed", count: 100 } },
  { id: "builder_blueprint", name: "Blueprint Creator", description: "Create 1 blueprint", category: "builder", icon: "scroll", xpReward: 100, requirement: { type: "blueprints_created", count: 1 } },
  { id: "builder_variety", name: "Variety Builder", description: "Use all 6 asset types", category: "builder", icon: "palette", xpReward: 150, requirement: { type: "unique_assets_used", count: 6 } },

  // Social
  { id: "social_hello", name: "Hello World", description: "Send 10 chat messages", category: "social", icon: "speech", xpReward: 25, requirement: { type: "chat_messages", count: 10 } },
  { id: "social_chatterbox", name: "Chatterbox", description: "Send 50 chat messages", category: "social", icon: "megaphone", xpReward: 75, requirement: { type: "chat_messages", count: 50 } },
  { id: "social_orator", name: "Orator", description: "Send 100 chat messages", category: "social", icon: "microphone", xpReward: 150, requirement: { type: "chat_messages", count: 100 } },
  { id: "social_first_friend", name: "First Friend", description: "Make 1 friend", category: "social", icon: "handshake", xpReward: 50, requirement: { type: "friends_made", count: 1 } },
  { id: "social_popular", name: "Popular", description: "Make 5 friends", category: "social", icon: "users", xpReward: 150, requirement: { type: "friends_made", count: 5 } },
  { id: "social_celebrity", name: "Celebrity", description: "Make 10 friends", category: "social", icon: "star", xpReward: 300, requirement: { type: "friends_made", count: 10 } },
  { id: "social_partygoer", name: "Partygoer", description: "Attend 1 event", category: "social", icon: "party", xpReward: 50, requirement: { type: "events_attended", count: 1 } },
  { id: "social_regular", name: "Regular", description: "Attend 5 events", category: "social", icon: "calendar", xpReward: 200, requirement: { type: "events_attended", count: 5 } },

  // Collector
  { id: "collector_starter", name: "Starter Collection", description: "Own 5 items", category: "collector", icon: "bag", xpReward: 50, requirement: { type: "items_collected", count: 5 } },
  { id: "collector_hoarder", name: "Hoarder", description: "Own 10 items", category: "collector", icon: "chest", xpReward: 100, requirement: { type: "items_collected", count: 10 } },
  { id: "collector_curator", name: "Curator", description: "Own 20 items", category: "collector", icon: "museum", xpReward: 250, requirement: { type: "items_collected", count: 20 } },
  { id: "collector_bronze", name: "Bronze Earner", description: "Earn 100 currency", category: "collector", icon: "coin_bronze", xpReward: 50, requirement: { type: "currency_earned", count: 100 } },
  { id: "collector_silver", name: "Silver Earner", description: "Earn 500 currency", category: "collector", icon: "coin_silver", xpReward: 150, requirement: { type: "currency_earned", count: 500 } },
  { id: "collector_gold", name: "Gold Earner", description: "Earn 1000 currency", category: "collector", icon: "coin_gold", xpReward: 400, requirement: { type: "currency_earned", count: 1000 } },

  // Builder (block)
  { id: "builder_block_placer", name: "Block Builder", description: "Place 100 blocks", category: "builder", icon: "cube", xpReward: 100, requirement: { type: "blocks_placed", count: 100 } },
  { id: "builder_block_breaker", name: "Master Miner", description: "Break 500 blocks", category: "builder", icon: "pickaxe", xpReward: 200, requirement: { type: "blocks_broken", count: 500 } },
];

// ── Level System ───────────────────────────────────────────────────────────

function xpForLevel(level: number): number {
  // level 1: 0, level 2: 100, level 3: 300, level 4: 600, level 5: 1000 ...
  // Each level N requires 100*N more XP than the previous
  // Total XP for level N = sum(100*i for i in 1..N-1) = 100 * (N-1)*N/2
  if (level <= 1) return 0;
  return 100 * ((level - 1) * level) / 2;
}

function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

// ── Title System ───────────────────────────────────────────────────────────

type TitleEntry = { title: string; level?: number; achievementCategory?: string; achievementCount?: number };

const TITLE_DEFINITIONS: TitleEntry[] = [
  { title: "Newcomer", level: 1 },
  { title: "Resident", level: 3 },
  { title: "Contributor", level: 5 },
  { title: "Veteran", level: 8 },
  { title: "Champion", level: 12 },
  { title: "Legend", level: 15 },
  { title: "Master Builder", achievementCategory: "builder", achievementCount: 4 },
  { title: "Social Butterfly", achievementCategory: "social", achievementCount: 5 },
  { title: "Explorer", achievementCategory: "explorer", achievementCount: 3 },
];

// ── Daily/Weekly Challenge Templates ───────────────────────────────────────

const DAILY_CHALLENGE_TEMPLATES = [
  { description: "Send 5 chat messages", requirement: { type: "chat_messages", count: 5 }, xpReward: 30 },
  { description: "Place 3 objects", requirement: { type: "objects_placed", count: 3 }, xpReward: 40 },
  { description: "Visit 2 regions", requirement: { type: "regions_visited", count: 2 }, xpReward: 35 },
  { description: "Walk 200 distance units", requirement: { type: "distance_walked", count: 200 }, xpReward: 25 },
  { description: "Send 10 chat messages", requirement: { type: "chat_messages", count: 10 }, xpReward: 50 },
  { description: "Place 5 objects", requirement: { type: "objects_placed", count: 5 }, xpReward: 60 },
  { description: "Make a new friend", requirement: { type: "friends_made", count: 1 }, xpReward: 45 },
  { description: "Teleport to another region", requirement: { type: "teleports", count: 1 }, xpReward: 20 },
];

const WEEKLY_CHALLENGE_TEMPLATES = [
  { description: "Send 50 chat messages this week", requirement: { type: "chat_messages", count: 50 }, xpReward: 150 },
  { description: "Place 20 objects this week", requirement: { type: "objects_placed", count: 20 }, xpReward: 200 },
  { description: "Visit 4 regions this week", requirement: { type: "regions_visited", count: 4 }, xpReward: 175 },
  { description: "Make 3 friends this week", requirement: { type: "friends_made", count: 3 }, xpReward: 200 },
  { description: "Walk 500 distance units this week", requirement: { type: "distance_walked", count: 500 }, xpReward: 125 },
];

// ── In-Memory Storage ──────────────────────────────────────────────────────

const playerProgressMap = new Map<string, PlayerProgress>();

// ── Persistence (write-through cache) ───────────────────────────────────────
// The full PlayerProgress object is stored as a JSON blob so the nested stats,
// unlocked achievements, and challenge state all survive restarts.

function persistProgress(progress: PlayerProgress): void {
  void persistence.savePlayerProgress({ accountId: progress.accountId, data: progress });
}

// Hydrate cache from persistence. Called by initializeWorldStore() AFTER the
// canonical persistence layer is set, so durable data survives restarts.
export async function hydrateAchievements(): Promise<void> {
  for (const record of await persistence.listAllPlayerProgress()) {
    playerProgressMap.set(record.accountId, record.data as PlayerProgress);
  }
}

function getOrCreateProgress(accountId: string): PlayerProgress {
  let progress = playerProgressMap.get(accountId);
  if (!progress) {
    progress = {
      accountId,
      xp: 0,
      level: 1,
      title: "Newcomer",
      unlockedAchievements: [],
      stats: {
        regionsVisited: [],
        objectsPlaced: 0,
        chatMessages: 0,
        friendsMade: 0,
        eventsAttended: 0,
        itemsCollected: 0,
        totalPlayTime: 0,
        blocksPlaced: 0,
        blocksBroken: 0,
      },
      dailyChallenges: [],
      weeklyChallenges: [],
    };
    playerProgressMap.set(accountId, progress);
    persistProgress(progress);
  }
  return progress;
}

function getStatValue(progress: PlayerProgress, statType: string): number {
  switch (statType) {
    case "regions_visited": return progress.stats.regionsVisited.length;
    case "objects_placed": return progress.stats.objectsPlaced;
    case "chat_messages": return progress.stats.chatMessages;
    case "friends_made": return progress.stats.friendsMade;
    case "events_attended": return progress.stats.eventsAttended;
    case "items_collected": return progress.stats.itemsCollected;
    case "teleports": return progress.stats.regionsVisited.length; // approximation
    case "distance_walked": return progress.stats.totalPlayTime; // approximation
    case "currency_earned": return 0; // tracked externally
    case "blueprints_created": return 0;
    case "unique_assets_used": return 0;
    case "blocks_placed": return progress.stats.blocksPlaced;
    case "blocks_broken": return progress.stats.blocksBroken;
    default: return 0;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export function getPlayerProgress(token: string): PlayerProgress | undefined {
  const session = getSession(token);
  if (!session) return undefined;
  const progress = getOrCreateProgress(session.accountId);
  // Ensure daily/weekly challenges exist
  if (progress.dailyChallenges.length === 0) {
    generateDailyChallenges(session.accountId);
  }
  if (progress.weeklyChallenges.length === 0) {
    generateWeeklyChallenges(session.accountId);
  }
  return progress;
}

export function checkAndAwardAchievements(accountId: string): Achievement[] {
  const progress = getOrCreateProgress(accountId);
  const newlyAwarded: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (progress.unlockedAchievements.includes(achievement.id)) continue;

    const currentValue = getStatValue(progress, achievement.requirement.type);
    if (currentValue >= achievement.requirement.count) {
      progress.unlockedAchievements.push(achievement.id);
      progress.xp += achievement.xpReward;
      newlyAwarded.push(achievement);
    }
  }

  // Recalculate level
  progress.level = levelForXp(progress.xp);

  // Update title if a higher level title is available (only auto-upgrade level-based titles)
  const levelTitles = TITLE_DEFINITIONS.filter((t) => t.level !== undefined && t.level! <= progress.level);
  if (levelTitles.length > 0) {
    const best = levelTitles.reduce((a, b) => ((a.level ?? 0) > (b.level ?? 0) ? a : b));
    // Only auto-set if player hasn't chosen a special title
    const isCurrentLevelTitle = TITLE_DEFINITIONS.some((t) => t.level !== undefined && t.title === progress.title);
    if (isCurrentLevelTitle || progress.title === "Newcomer") {
      progress.title = best.title;
    }
  }

  persistProgress(progress);
  return newlyAwarded;
}

export function incrementStat(accountId: string, statName: string, amount: number = 1): Achievement[] {
  const progress = getOrCreateProgress(accountId);

  switch (statName) {
    case "objectsPlaced": progress.stats.objectsPlaced += amount; break;
    case "chatMessages": progress.stats.chatMessages += amount; break;
    case "friendsMade": progress.stats.friendsMade += amount; break;
    case "eventsAttended": progress.stats.eventsAttended += amount; break;
    case "itemsCollected": progress.stats.itemsCollected += amount; break;
    case "totalPlayTime": progress.stats.totalPlayTime += amount; break;
    case "blocksPlaced": progress.stats.blocksPlaced += amount; break;
    case "blocksBroken": progress.stats.blocksBroken += amount; break;
  }

  // Update challenge progress
  const statTypeMap: Record<string, string> = {
    objectsPlaced: "objects_placed",
    chatMessages: "chat_messages",
    friendsMade: "friends_made",
    eventsAttended: "events_attended",
    itemsCollected: "items_collected",
    totalPlayTime: "distance_walked",
    blocksPlaced: "blocks_placed",
    blocksBroken: "blocks_broken",
  };

  const challengeType = statTypeMap[statName];
  if (challengeType) {
    for (const challenge of [...progress.dailyChallenges, ...progress.weeklyChallenges]) {
      if (challenge.completed) continue;
      if (challenge.requirement.type === challengeType) {
        challenge.progress += amount;
        if (challenge.progress >= challenge.requirement.count) {
          challenge.completed = true;
          progress.xp += challenge.xpReward;
          progress.level = levelForXp(progress.xp);
        }
      }
    }
  }

  return checkAndAwardAchievements(accountId);
}

export function visitRegion(accountId: string, regionId: string): Achievement[] {
  const progress = getOrCreateProgress(accountId);

  if (!progress.stats.regionsVisited.includes(regionId)) {
    progress.stats.regionsVisited.push(regionId);
  }

  // Update challenge progress for region visits
  for (const challenge of [...progress.dailyChallenges, ...progress.weeklyChallenges]) {
    if (challenge.completed) continue;
    if (challenge.requirement.type === "regions_visited") {
      challenge.progress = progress.stats.regionsVisited.length;
      if (challenge.progress >= challenge.requirement.count) {
        challenge.completed = true;
        progress.xp += challenge.xpReward;
        progress.level = levelForXp(progress.xp);
      }
    }
    if (challenge.requirement.type === "teleports") {
      challenge.progress += 1;
      if (challenge.progress >= challenge.requirement.count) {
        challenge.completed = true;
        progress.xp += challenge.xpReward;
        progress.level = levelForXp(progress.xp);
      }
    }
  }

  return checkAndAwardAchievements(accountId);
}

export function generateDailyChallenges(accountId: string): DailyChallenge[] {
  const progress = getOrCreateProgress(accountId);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setUTCHours(23, 59, 59, 999);

  // Check if current dailies are still valid
  if (progress.dailyChallenges.length > 0 && progress.dailyChallenges[0].expiresAt > now.toISOString()) {
    return progress.dailyChallenges;
  }

  // Pick 3 random templates
  const shuffled = [...DAILY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  progress.dailyChallenges = selected.map((template, index) => ({
    id: `daily_${now.toISOString().slice(0, 10)}_${index}`,
    description: template.description,
    requirement: { ...template.requirement },
    progress: 0,
    completed: false,
    xpReward: template.xpReward,
    expiresAt: expiresAt.toISOString(),
  }));

  persistProgress(progress);
  return progress.dailyChallenges;
}

export function generateWeeklyChallenges(accountId: string): WeeklyChallenge[] {
  const progress = getOrCreateProgress(accountId);
  const now = new Date();
  const expiresAt = new Date(now);
  // Set to end of current week (Sunday)
  const daysUntilSunday = 7 - expiresAt.getUTCDay();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + daysUntilSunday);
  expiresAt.setUTCHours(23, 59, 59, 999);

  // Check if current weeklies are still valid
  if (progress.weeklyChallenges.length > 0 && progress.weeklyChallenges[0].expiresAt > now.toISOString()) {
    return progress.weeklyChallenges;
  }

  // Pick 2 random templates
  const shuffled = [...WEEKLY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 2);

  progress.weeklyChallenges = selected.map((template, index) => ({
    id: `weekly_${now.toISOString().slice(0, 10)}_${index}`,
    description: template.description,
    requirement: { ...template.requirement },
    progress: 0,
    completed: false,
    xpReward: template.xpReward,
    expiresAt: expiresAt.toISOString(),
  }));

  persistProgress(progress);
  return progress.weeklyChallenges;
}

export function getLeaderboard(category?: string, limit: number = 10): { accountId: string; xp: number; level: number; title: string }[] {
  const entries = [...playerProgressMap.values()];

  const filtered = category
    ? entries.filter((p) => {
        const categoryAchievements = ACHIEVEMENTS.filter((a) => a.category === category).map((a) => a.id);
        return p.unlockedAchievements.some((id) => categoryAchievements.includes(id));
      })
    : entries;

  return filtered
    .sort((a, b) => b.xp - a.xp)
    .slice(0, Math.min(limit, 50))
    .map((p) => ({
      accountId: p.accountId,
      xp: p.xp,
      level: p.level,
      title: p.title,
    }));
}

export function getAvailableTitles(accountId: string): string[] {
  const progress = getOrCreateProgress(accountId);
  const titles: string[] = [];

  for (const def of TITLE_DEFINITIONS) {
    if (def.level !== undefined && def.level <= progress.level) {
      titles.push(def.title);
    }
    if (def.achievementCategory && def.achievementCount) {
      const categoryAchievements = progress.unlockedAchievements.filter((id) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        return ach && ach.category === def.achievementCategory;
      });
      if (categoryAchievements.length >= def.achievementCount) {
        titles.push(def.title);
      }
    }
  }

  return titles;
}

export function setTitle(token: string, title: string): boolean {
  const session = getSession(token);
  if (!session) return false;

  const available = getAvailableTitles(session.accountId);
  if (!available.includes(title)) return false;

  const progress = getOrCreateProgress(session.accountId);
  progress.title = title;
  persistProgress(progress);
  return true;
}

export function listAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}

// ── Hooks (to be called from other services) ───────────────────────────────
// These are convenience functions meant to be called from existing action
// handlers. They wrap incrementStat / visitRegion so callers don't need to
// import multiple functions.

/**
 * Call when an object is placed.
 * Hook location: POST /api/regions/:regionId/objects handler in server.ts
 */
export function onObjectPlaced(accountId: string): Achievement[] {
  return incrementStat(accountId, "objectsPlaced");
}

/**
 * Call when a chat message is sent.
 * Hook location: WebSocket "chat" command handler in server.ts
 */
export function onChatMessage(accountId: string): Achievement[] {
  return incrementStat(accountId, "chatMessages");
}

/**
 * Call when a friend is added.
 * Hook location: POST /api/friends handler in server.ts
 */
export function onFriendAdded(accountId: string): Achievement[] {
  return incrementStat(accountId, "friendsMade");
}

/**
 * Call when a region is joined/teleported to.
 * Hook location: POST /api/avatar/teleport and WebSocket connection handlers in server.ts
 */
export function onRegionVisited(accountId: string, regionId: string): Achievement[] {
  return visitRegion(accountId, regionId);
}

export function onBlockPlaced(accountId: string): Achievement[] {
  return incrementStat(accountId, "blocksPlaced");
}

export function onBlockBroken(accountId: string): Achievement[] {
  return incrementStat(accountId, "blocksBroken");
}
