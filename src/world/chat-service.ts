import type { ChatChannel, ChatHistoryEntry } from "../contracts.js";
import {
  sessions,
  persistence,
  chatHistoryByRegion,
  CHAT_HISTORY_MAX,
  pushChatHistory,
  getChatHistoryBuffer,
  type Session
} from "./_shared-state.js";

// Hydrate the rolling per-region chat history cache from persistence. Called by
// initializeWorldStore() AFTER the canonical persistence layer is set. The
// persistence layer already keeps at most CHAT_HISTORY_MAX rows per region, but
// we defensively re-apply the cap here. Live/transient relay state (typing
// indicators, whisper routing) is intentionally not persisted.
export async function hydrateChat(): Promise<void> {
  const byRegion = new Map<string, ChatHistoryEntry[]>();
  for (const record of await persistence.listAllChatHistory()) {
    let buffer = byRegion.get(record.regionId);
    if (!buffer) {
      buffer = [];
      byRegion.set(record.regionId, buffer);
    }
    buffer.push({
      avatarId: record.avatarId,
      displayName: record.displayName,
      message: record.message,
      channel: record.channel as ChatChannel,
      createdAt: record.createdAt
    });
  }
  for (const [regionId, buffer] of byRegion) {
    // listAllChatHistory returns rows ordered oldest→newest per region; keep the
    // most recent CHAT_HISTORY_MAX to match the in-memory cap.
    const trimmed = buffer.slice(-CHAT_HISTORY_MAX);
    chatHistoryByRegion.set(regionId, trimmed);
  }
}

export function handleChatMessage(session: Session, message: string): ChatHistoryEntry {
  const entry: ChatHistoryEntry = {
    avatarId: session.avatarId,
    displayName: session.displayName,
    message: message.slice(0, 180),
    channel: "region",
    createdAt: new Date().toISOString()
  };
  pushChatHistory(session.regionId, entry);
  return entry;
}

export function getChatHistory(regionId: string): ChatHistoryEntry[] {
  return [...getChatHistoryBuffer(regionId)];
}

export function handleWhisper(session: Session, targetDisplayName: string, message: string): {
  fromSession: Session;
  toSession: Session;
  message: string;
} | undefined {
  let targetSession: Session | undefined;
  for (const s of sessions.values()) {
    if (s.displayName.toLowerCase() === targetDisplayName.toLowerCase() && s.regionId === session.regionId) {
      targetSession = s;
      break;
    }
  }

  if (!targetSession) {
    return undefined;
  }

  return {
    fromSession: session,
    toSession: targetSession,
    message: message.slice(0, 180)
  };
}
