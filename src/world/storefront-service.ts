import { randomUUID } from "node:crypto";
import { getSession } from "./store.js";
import { persistence } from "./_shared-state.js";

export type Storefront = {
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

export type Commission = {
  id: string;
  clientAccountId: string;
  clientDisplayName: string;
  builderAccountId: string;
  builderDisplayName: string;
  description: string;
  budget: number;
  status: "open" | "accepted" | "in_progress" | "delivered" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string;
};

type StorefrontRating = {
  accountId: string;
  storefrontAccountId: string;
  rating: number;
};

type TrendingSale = {
  itemId: string;
  itemName: string;
  sellerAccountId: string;
  amount: number;
  soldAt: number;
};

const storefronts = new Map<string, Storefront>();
const commissions = new Map<string, Commission>();
const ratings = new Map<string, StorefrontRating[]>();
// Ephemeral 24h rolling window used only for trending computation — not durable.
const trendingSales: TrendingSale[] = [];

const TRENDING_WINDOW_MS = 24 * 60 * 60 * 1000;

// ── Persistence (write-through cache) ───────────────────────────────────────

function persistStorefront(sf: Storefront): void {
  void persistence.saveStorefront({ ...sf });
}

function persistCommission(c: Commission): void {
  void persistence.saveCommission({ ...c, completedAt: c.completedAt ?? null });
}

function persistRating(r: StorefrontRating): void {
  void persistence.saveStorefrontRating({ ...r });
}

// Hydrate caches from persistence. Called by initializeWorldStore() AFTER the
// canonical persistence layer is set, so durable data survives restarts.
export async function hydrateStorefronts(): Promise<void> {
  for (const record of await persistence.listAllStorefronts()) {
    storefronts.set(record.id, { ...record });
  }
  for (const record of await persistence.listAllCommissions()) {
    commissions.set(record.id, { ...record, completedAt: record.completedAt ?? undefined });
  }
  for (const record of await persistence.listAllStorefrontRatings()) {
    const list = ratings.get(record.storefrontAccountId) ?? [];
    list.push({ accountId: record.accountId, storefrontAccountId: record.storefrontAccountId, rating: record.rating });
    ratings.set(record.storefrontAccountId, list);
  }
}

export function createStorefront(
  token: string,
  shopName: string,
  description: string,
  bannerColor: string
): Storefront | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  // One storefront per account
  for (const sf of storefronts.values()) {
    if (sf.accountId === session.accountId) return undefined;
  }

  const storefront: Storefront = {
    id: randomUUID(),
    accountId: session.accountId,
    displayName: session.displayName,
    shopName: shopName.slice(0, 64),
    description: description.slice(0, 500),
    bannerColor: bannerColor.slice(0, 7),
    featured: false,
    totalSales: 0,
    totalRevenue: 0,
    rating: 0,
    createdAt: new Date().toISOString(),
  };

  storefronts.set(storefront.id, storefront);
  persistStorefront(storefront);
  return storefront;
}

export function getStorefront(accountId: string): Storefront | undefined {
  for (const sf of storefronts.values()) {
    if (sf.accountId === accountId) return sf;
  }
  return undefined;
}

export function updateStorefront(
  token: string,
  updates: { shopName?: string; description?: string; bannerColor?: string }
): Storefront | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  for (const sf of storefronts.values()) {
    if (sf.accountId === session.accountId) {
      if (updates.shopName !== undefined) sf.shopName = updates.shopName.slice(0, 64);
      if (updates.description !== undefined) sf.description = updates.description.slice(0, 500);
      if (updates.bannerColor !== undefined) sf.bannerColor = updates.bannerColor.slice(0, 7);
      persistStorefront(sf);
      return sf;
    }
  }

  return undefined;
}

export function listStorefronts(sort?: string): Storefront[] {
  const all = [...storefronts.values()];

  switch (sort) {
    case "sales":
      return all.sort((a, b) => b.totalSales - a.totalSales);
    case "revenue":
      return all.sort((a, b) => b.totalRevenue - a.totalRevenue);
    case "rating":
      return all.sort((a, b) => b.rating - a.rating);
    default:
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function recordSale(
  accountId: string,
  amount: number,
  itemId?: string,
  itemName?: string
): void {
  for (const sf of storefronts.values()) {
    if (sf.accountId === accountId) {
      sf.totalSales += 1;
      sf.totalRevenue += amount;
      persistStorefront(sf);
      break;
    }
  }

  trendingSales.push({
    itemId: itemId ?? randomUUID(),
    itemName: itemName ?? "Unknown Item",
    sellerAccountId: accountId,
    amount,
    soldAt: Date.now(),
  });
}

export function rateStorefront(
  token: string,
  accountId: string,
  rating: number
): Storefront | undefined {
  const session = getSession(token);
  if (!session) return undefined;
  if (session.accountId === accountId) return undefined;
  if (rating < 1 || rating > 5) return undefined;

  const clamped = Math.round(rating);

  let storefrontRatings = ratings.get(accountId);
  if (!storefrontRatings) {
    storefrontRatings = [];
    ratings.set(accountId, storefrontRatings);
  }

  const existing = storefrontRatings.find((r) => r.accountId === session.accountId);
  let ratingEntry: StorefrontRating;
  if (existing) {
    existing.rating = clamped;
    ratingEntry = existing;
  } else {
    ratingEntry = {
      accountId: session.accountId,
      storefrontAccountId: accountId,
      rating: clamped,
    };
    storefrontRatings.push(ratingEntry);
  }
  persistRating(ratingEntry);

  // Recalculate average
  const avg =
    storefrontRatings.reduce((sum, r) => sum + r.rating, 0) / storefrontRatings.length;

  for (const sf of storefronts.values()) {
    if (sf.accountId === accountId) {
      sf.rating = Math.round(avg * 100) / 100;
      persistStorefront(sf);
      return sf;
    }
  }

  return undefined;
}

export function getTrendingItems(limit: number = 10): {
  itemId: string;
  itemName: string;
  sellerAccountId: string;
  saleCount: number;
  totalAmount: number;
}[] {
  const cutoff = Date.now() - TRENDING_WINDOW_MS;

  // Prune old sales
  while (trendingSales.length > 0 && trendingSales[0].soldAt < cutoff) {
    trendingSales.shift();
  }

  const recentSales = trendingSales.filter((s) => s.soldAt >= cutoff);

  // Aggregate by itemId
  const aggregated = new Map<
    string,
    { itemId: string; itemName: string; sellerAccountId: string; saleCount: number; totalAmount: number }
  >();

  for (const sale of recentSales) {
    const entry = aggregated.get(sale.itemId);
    if (entry) {
      entry.saleCount += 1;
      entry.totalAmount += sale.amount;
    } else {
      aggregated.set(sale.itemId, {
        itemId: sale.itemId,
        itemName: sale.itemName,
        sellerAccountId: sale.sellerAccountId,
        saleCount: 1,
        totalAmount: sale.amount,
      });
    }
  }

  return [...aggregated.values()]
    .sort((a, b) => b.saleCount - a.saleCount)
    .slice(0, Math.max(1, Math.min(50, limit)));
}

export function createCommission(
  token: string,
  builderAccountId: string,
  description: string,
  budget: number
): Commission | undefined {
  const session = getSession(token);
  if (!session) return undefined;
  if (session.accountId === builderAccountId) return undefined;
  if (budget <= 0) return undefined;

  const commission: Commission = {
    id: randomUUID(),
    clientAccountId: session.accountId,
    clientDisplayName: session.displayName,
    builderAccountId,
    builderDisplayName: "",
    description: description.slice(0, 500),
    budget,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  commissions.set(commission.id, commission);
  persistCommission(commission);
  return commission;
}

export function acceptCommission(token: string, commissionId: string): Commission | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const commission = commissions.get(commissionId);
  if (!commission) return undefined;
  if (commission.builderAccountId !== session.accountId) return undefined;
  if (commission.status !== "open") return undefined;

  commission.status = "accepted";
  commission.builderDisplayName = session.displayName;
  persistCommission(commission);
  return commission;
}

export function updateCommissionStatus(
  token: string,
  commissionId: string,
  status: Commission["status"]
): Commission | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const commission = commissions.get(commissionId);
  if (!commission) return undefined;

  // Only builder can update status to in_progress or delivered
  if (commission.builderAccountId !== session.accountId) return undefined;

  const validTransitions: Record<string, string[]> = {
    accepted: ["in_progress", "cancelled"],
    in_progress: ["delivered", "cancelled"],
  };

  const allowed = validTransitions[commission.status];
  if (!allowed || !allowed.includes(status)) return undefined;

  commission.status = status;
  persistCommission(commission);
  return commission;
}

export function completeCommission(token: string, commissionId: string): Commission | undefined {
  const session = getSession(token);
  if (!session) return undefined;

  const commission = commissions.get(commissionId);
  if (!commission) return undefined;

  // Only client can complete (approve delivery)
  if (commission.clientAccountId !== session.accountId) return undefined;
  if (commission.status !== "delivered") return undefined;

  commission.status = "completed";
  commission.completedAt = new Date().toISOString();
  persistCommission(commission);

  // Record sale for the builder's storefront
  recordSale(commission.builderAccountId, commission.budget, commissionId, `Commission: ${commission.description.slice(0, 50)}`);

  return commission;
}

export function listCommissions(token: string): Commission[] {
  const session = getSession(token);
  if (!session) return [];

  return [...commissions.values()].filter(
    (c) => c.clientAccountId === session.accountId || c.builderAccountId === session.accountId
  );
}
