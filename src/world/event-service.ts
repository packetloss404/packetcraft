import { randomUUID } from "node:crypto";
import { getSession, type Session } from "./store.js";
import { persistence } from "./_shared-state.js";
import type { EventRecord } from "../data/persistence.js";

export type GameEventType =
  | "build_competition"
  | "dance_party"
  | "grand_opening"
  | "workshop"
  | "meetup"
  | "concert"
  | "market_day"
  | "exploration";

export type GameEvent = {
  id: string;
  name: string;
  description: string;
  creatorAccountId: string;
  creatorDisplayName: string;
  regionId: string;
  parcelId?: string;
  eventType: GameEventType;
  startTime: string;
  endTime: string;
  recurring: null | "daily" | "weekly" | "monthly";
  rsvps: string[];
  maxAttendees?: number;
  prizes?: string;
  createdAt: string;
};

const events = new Map<string, GameEvent>();
// Live-only transition bookkeeping — recomputable from event start/end times
// and recent attendance; intentionally kept in-memory (not durable).
const endedEventAttendance = new Map<string, number>();
const startedEventIds = new Set<string>();
const endedEventIds = new Set<string>();

// ── Persistence mapping (write-through cache) ───────────────────────────────

function toEventRecord(e: GameEvent): EventRecord {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    creatorAccountId: e.creatorAccountId,
    creatorDisplayName: e.creatorDisplayName,
    regionId: e.regionId,
    parcelId: e.parcelId ?? null,
    eventType: e.eventType,
    startTime: e.startTime,
    endTime: e.endTime,
    recurring: e.recurring,
    rsvps: [...e.rsvps],
    maxAttendees: e.maxAttendees ?? null,
    prizes: e.prizes ?? null,
    createdAt: e.createdAt,
  };
}

function fromEventRecord(r: EventRecord): GameEvent {
  const e: GameEvent = {
    id: r.id,
    name: r.name,
    description: r.description,
    creatorAccountId: r.creatorAccountId,
    creatorDisplayName: r.creatorDisplayName,
    regionId: r.regionId,
    eventType: r.eventType as GameEventType,
    startTime: r.startTime,
    endTime: r.endTime,
    recurring: r.recurring,
    rsvps: [...r.rsvps],
    createdAt: r.createdAt,
  };
  if (r.parcelId !== null) e.parcelId = r.parcelId;
  if (r.maxAttendees !== null) e.maxAttendees = r.maxAttendees;
  if (r.prizes !== null) e.prizes = r.prizes;
  return e;
}

function persistEvent(e: GameEvent): void {
  void persistence.saveEvent(toEventRecord(e));
}

// Hydrate cache from persistence. Called by initializeWorldStore() AFTER the
// canonical persistence layer is set, so scheduled/durable events survive
// restarts. Live countdown/transition state is recomputed on demand by
// checkEventTransitions().
export async function hydrateEvents(): Promise<void> {
  for (const record of await persistence.listAllEvents()) {
    const event = fromEventRecord(record);
    events.set(event.id, event);
  }
}

export function createEvent(
  token: string,
  eventData: {
    name: string;
    description: string;
    regionId: string;
    parcelId?: string;
    eventType: GameEventType;
    startTime: string;
    endTime: string;
    recurring?: null | "daily" | "weekly" | "monthly";
    maxAttendees?: number;
    prizes?: string;
  }
): GameEvent | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const event: GameEvent = {
    id: randomUUID(),
    name: eventData.name,
    description: eventData.description,
    creatorAccountId: session.accountId,
    creatorDisplayName: session.displayName,
    regionId: eventData.regionId,
    parcelId: eventData.parcelId,
    eventType: eventData.eventType,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    recurring: eventData.recurring ?? null,
    rsvps: [session.accountId],
    maxAttendees: eventData.maxAttendees,
    prizes: eventData.prizes,
    createdAt: new Date().toISOString(),
  };

  events.set(event.id, event);
  persistEvent(event);
  return event;
}

export function listEvents(regionId?: string, upcoming?: boolean): GameEvent[] {
  const now = new Date().toISOString();
  let result = [...events.values()];

  if (regionId) {
    result = result.filter((e) => e.regionId === regionId);
  }

  if (upcoming) {
    result = result.filter((e) => e.endTime > now);
  }

  result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return result;
}

export function getEvent(eventId: string): GameEvent | undefined {
  return events.get(eventId);
}

export function rsvpEvent(token: string, eventId: string): GameEvent | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const event = events.get(eventId);
  if (!event) return undefined;

  const index = event.rsvps.indexOf(session.accountId);
  if (index >= 0) {
    event.rsvps.splice(index, 1);
  } else {
    if (event.maxAttendees && event.rsvps.length >= event.maxAttendees) {
      return undefined;
    }
    event.rsvps.push(session.accountId);
  }

  events.set(eventId, event);
  persistEvent(event);
  return event;
}

export function cancelEvent(token: string, eventId: string): boolean {
  const session = getSession(token);
  if (!session) return false;

  const event = events.get(eventId);
  if (!event) return false;

  if (event.creatorAccountId !== session.accountId && session.role !== "admin") {
    return false;
  }

  events.delete(eventId);
  void persistence.deleteEvent(eventId);
  return true;
}

export function listUpcomingEvents(limit: number = 10): GameEvent[] {
  const now = new Date().toISOString();
  return [...events.values()]
    .filter((e) => e.endTime > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, limit);
}

export function getEventAttendees(eventId: string): string[] {
  const event = events.get(eventId);
  if (!event) return [];
  return [...event.rsvps];
}

export type EventStarted = {
  eventId: string;
  event: GameEvent;
  regionId: string;
};

export type EventEnded = {
  eventId: string;
  regionId: string;
};

export function checkEventTransitions(): { started: EventStarted[]; ended: EventEnded[] } {
  const now = new Date().toISOString();
  const started: EventStarted[] = [];
  const ended: EventEnded[] = [];

  for (const event of events.values()) {
    if (event.startTime <= now && !startedEventIds.has(event.id) && event.endTime > now) {
      startedEventIds.add(event.id);
      started.push({ eventId: event.id, event, regionId: event.regionId });
    }

    if (event.endTime <= now && !endedEventIds.has(event.id)) {
      endedEventIds.add(event.id);
      endedEventAttendance.set(event.id, event.rsvps.length);
      ended.push({ eventId: event.id, regionId: event.regionId });
    }
  }

  return { started, ended };
}

export type LeaderboardEntry = {
  creatorAccountId: string;
  creatorDisplayName: string;
  eventsCreated: number;
};

export type AttendanceEntry = {
  eventId: string;
  eventName: string;
  attendanceCount: number;
};

export function getEventLeaderboard(): {
  topCreators: LeaderboardEntry[];
  mostAttended: AttendanceEntry[];
} {
  const creatorMap = new Map<string, LeaderboardEntry>();

  for (const event of events.values()) {
    const existing = creatorMap.get(event.creatorAccountId);
    if (existing) {
      existing.eventsCreated += 1;
    } else {
      creatorMap.set(event.creatorAccountId, {
        creatorAccountId: event.creatorAccountId,
        creatorDisplayName: event.creatorDisplayName,
        eventsCreated: 1,
      });
    }
  }

  const topCreators = [...creatorMap.values()]
    .sort((a, b) => b.eventsCreated - a.eventsCreated)
    .slice(0, 10);

  const attendanceEntries: AttendanceEntry[] = [];

  for (const event of events.values()) {
    const endedCount = endedEventAttendance.get(event.id);
    attendanceEntries.push({
      eventId: event.id,
      eventName: event.name,
      attendanceCount: endedCount ?? event.rsvps.length,
    });
  }

  const mostAttended = attendanceEntries
    .sort((a, b) => b.attendanceCount - a.attendanceCount)
    .slice(0, 10);

  return { topCreators, mostAttended };
}
