import {
  FoodItem,
  Product,
  RecSettings,
  Restaurant,
  UserBehaviorEvent,
  UserSearchHistory,
} from "../models.js";

// --- Personalization engine ------------------------------------------------
// Deterministic, data-driven "Recommended for You" scoring across Food,
// Grocery, Vegetables and Mart. Nothing here is randomised or a stale
// "popular-only" list: every personalised score is derived from the user's own
// persisted search history and behaviour events (view / add-to-cart / purchase
// / favourite), weighted by recency, isolated per category, and filtered to
// currently available items only.

export type RecCategory = "food" | "grocery" | "vegetables" | "mart";

const CATEGORY_SERVICE: Record<Exclude<RecCategory, "food">, string> = {
  grocery: "Grocery",
  vegetables: "Vegetables",
  mart: "Mart",
};

// Weight per behaviour type. Purchase is the strongest signal (the user paid
// for it), then add-to-cart, favourite, then a passive view.
const EVENT_WEIGHT: Record<string, number> = {
  VIEW_PRODUCT: 0.6,
  VIEW_RESTAURANT: 0.6,
  ADD_TO_CART: 1.5,
  REMOVE_FROM_CART: 0.2,
  PURCHASE: 2.5,
  FAVORITE: 1.2,
};

// "Because:" labels mapped to the signal that dominated the score for an item.
const REASON_ORDER: [string, string][] = [
  ["purchase", "Based on your orders"],
  ["addToCart", "From your cart"],
  ["favorite", "From your favourites"],
  ["view", "Similar to what you viewed"],
  ["search", "Based on your searches"],
  ["popular", "Popular near you"],
];

export function isRecCategory(value: string): value is RecCategory {
  return value === "food" || value === "grocery" || value === "vegetables" || value === "mart";
}

// Normalisation used both when persisting search history and when scoring:
// lowercase, punctuation/hyphens to spaces, collapsed whitespace. Plurals are
// deliberately NOT stripped — matching below uses token/substring overlap, so
// "burgers" still matches "burger" without lossy stemming.
export function normalizeQuery(raw: string): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

function tokenize(text: string): string[] {
  return normalizeQuery(text).split(" ").filter((t) => t.length >= 2);
}

// Recency decay: more recent behaviour counts more. Half-life tuned via
// admin settings (default 14 days).
function decayAgeMs(lastAt: Date | string | number, halfLifeDays: number): number {
  const ageMs = Date.now() - new Date(lastAt).getTime();
  return Math.exp(-ageMs / (halfLifeDays * 24 * 60 * 60 * 1000));
}

// --- Persistence (tracking) -------------------------------------------------

export type TrackSearchInput = { category: RecCategory; userId: unknown; query: string };
export type TrackEventInput = {
  category: RecCategory;
  userId: unknown;
  eventType: string;
  refType: "product" | "foodItem" | "restaurant" | null;
  refId?: string | null;
  searchQuery?: string | null;
};

/** Aggregated upsert: one row per user+category+normalized query / ref. */
export async function trackSearch({ category, userId, query }: TrackSearchInput): Promise<void> {
  const norm = normalizeQuery(query);
  if (!norm) return;
  await UserSearchHistory.updateOne(
    { userId, category, normalizedQuery: norm },
    {
      $set: { searchQuery: String(query).trim(), lastSearchedAt: new Date() },
      $inc: { searchCount: 1 },
      $setOnInsert: { firstSearchedAt: new Date() },
    },
    { upsert: true },
  );
}

export async function trackEvent({ category, userId, eventType, refType, refId, searchQuery }: TrackEventInput): Promise<void> {
  const filter: Record<string, unknown> = { userId, category, eventType, refType, refId: refId ?? null };
  const update: Record<string, unknown> = {
    $set: { lastAt: new Date() },
    $inc: { count: 1 },
  };
  const setOnInsert: Record<string, unknown> = {};
  if (searchQuery) {
    const norm = normalizeQuery(searchQuery);
    if (norm) {
      setOnInsert.searchQuery = searchQuery;
      setOnInsert.normalizedQuery = norm;
    }
  }
  if (Object.keys(setOnInsert).length) update.$setOnInsert = setOnInsert;
  await UserBehaviorEvent.updateOne(filter, update, { upsert: true });
}

// --- Cache ------------------------------------------------------------------
// Small in-memory cache keyed by userId:category. Tracked writes bust the
// relevant entries so results never grow stale. Falls back to recompute.
const cache = new Map<string, { at: number; value: unknown }>();
export function invalidateUserCache(userId: unknown, category?: RecCategory): void {
  const base = String(userId);
  for (const key of cache.keys()) {
    if (category ? key === `${base}:${category}` : key.startsWith(`${base}:`)) cache.delete(key);
  }
}

// --- Settings ---------------------------------------------------------------

type RecSettingsShape = {
  enabled: boolean;
  count: number;
  fallbackCount: number;
  cacheSeconds: number;
  minSignal: number;
  weights: {
    search: number;
    view: number;
    addToCart: number;
    purchase: number;
    favorite: number;
    recencyHalfLifeDays: number;
  };
};

const DEFAULT_SETTINGS: RecSettingsShape = {
  enabled: true,
  count: 10,
  fallbackCount: 6,
  cacheSeconds: 300,
  minSignal: 1,
  weights: { search: 1, view: 0.6, addToCart: 1.5, purchase: 2.5, favorite: 1.2, recencyHalfLifeDays: 14 },
};

export async function getRecSettings(): Promise<RecSettingsShape> {
  try {
    const doc: any = await RecSettings.findById("recommendations").lean();
    if (!doc) return DEFAULT_SETTINGS;
    return {
      enabled: doc.enabled ?? DEFAULT_SETTINGS.enabled,
      count: doc.count ?? DEFAULT_SETTINGS.count,
      fallbackCount: doc.fallbackCount ?? DEFAULT_SETTINGS.fallbackCount,
      cacheSeconds: doc.cacheSeconds ?? DEFAULT_SETTINGS.cacheSeconds,
      minSignal: doc.minSignal ?? DEFAULT_SETTINGS.minSignal,
      weights: { ...DEFAULT_SETTINGS.weights, ...(doc.weights ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// --- Scoring ----------------------------------------------------------------

type PreferenceModel = {
  // token -> weighted score (derived from search history + search-tagged events)
  tokens: Map<string, number>;
  // refKey (`product:<id>` | `foodItem:<id>` | `restaurant:<id>`) -> weighted score
  refs: Map<string, { weight: number; eventType: string }>;
  totalSignal: number;
};

async function buildPreference(userId: unknown, category: RecCategory, halfLifeDays: number): Promise<PreferenceModel> {
  const tokens = new Map<string, number>();
  const refs = new Map<string, { weight: number; eventType: string }>();
  let totalSignal = 0;
  const now = Date.now();

  const [searches, events] = await Promise.all([
    UserSearchHistory.find({ userId, category }).lean(),
    UserBehaviorEvent.find({ userId, category }).lean(),
  ]);

  // Search history: use lastSearchedAt for recency, weighted by frequency.
  for (const s of searches as any[]) {
    const ageDays = (now - new Date(s.lastSearchedAt).getTime()) / 86400_000;
    // Ignore searches older than ~3 half-lives to avoid stale long-tail noise.
    if (ageDays > halfLifeDays * 3) continue;
    const w = (s.searchCount ?? 1) * decayAgeMs(s.lastSearchedAt, halfLifeDays);
    for (const tok of tokenize(s.normalizedQuery || s.searchQuery || "")) {
      tokens.set(tok, (tokens.get(tok) ?? 0) + w);
    }
    totalSignal += w;
  }

  // Behaviour events referencing actual entities.
  if (events.length) {
    for (const e of events as any[]) {
      const ew = EVENT_WEIGHT[e.eventType];
      if (ew === undefined) continue;
      const w = (e.count ?? 1) * ew * decayAgeMs(e.lastAt, halfLifeDays);
      if (e.refId) {
        const key = `${e.refType}:${e.refId}`;
        const existing = refs.get(key);
        if (!existing || existing.weight < w) refs.set(key, { weight: w, eventType: e.eventType });
      }
      if (e.normalizedQuery) {
        for (const tok of tokenize(e.normalizedQuery)) {
          tokens.set(tok, (tokens.get(tok) ?? 0) + w);
        }
      }
      totalSignal += w;
    }
  }

  return { tokens, refs, totalSignal };
}

// Lightweight popularity baseline so ties in personalised scores resolve to
// better-rated / best-selling items and so fallback lists are "popular" but
// deterministic (rating + bestseller, never random).
function popularSortKey(rating: number, extra: number): number {
  return (rating ?? 0) * 10 + extra;
}

export type RecommendationItem = {
  id: string;
  category: RecCategory;
  name: string;
  description?: string;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  rating: number | null;
  veg?: boolean | null;
  // Food only
  restaurantId?: string;
  restaurantName?: string;
  // Store only
  service?: string;
  vendorName?: string;
  eta?: string;
  reason: string;
};

type RecOutput = { personalized: boolean; basedOn: string[]; items: RecommendationItem[] };

function reasonFor(refs: PreferenceModel["refs"], matchedRef: { eventType: string } | null, usedSearchTokens: boolean): string {
  const byReason = new Map<string, number>();
  if (matchedRef) {
    const event = matchedRef.eventType;
    if (event === "PURCHASE") byReason.set("purchase", 1);
    else if (event === "ADD_TO_CART") byReason.set("addToCart", 1);
    else if (event === "FAVORITE") byReason.set("favorite", 1);
    else byReason.set("view", 1);
  }
  if (usedSearchTokens) byReason.set("search", (byReason.get("search") ?? 0) + 1);
  if (byReason.size === 0) return "Popular near you";
  for (const [key, label] of REASON_ORDER) {
    if (byReason.has(key)) return label;
  }
  return "Popular near you";
}

async function recommendProducts(userId: unknown, category: Exclude<RecCategory, "food">, settings: RecSettingsShape): Promise<RecOutput> {
  const service = CATEGORY_SERVICE[category];
  const pref = await buildPreference(userId, category, settings.weights.recencyHalfLifeDays);
  const personalized = settings.minSignal === 0 || pref.totalSignal >= settings.minSignal;

  const products: any[] = await Product.find({ service, stock: { $gt: 0 } }).lean();

  const scored = products.map((p) => {
    const key = `product:${p._id}`;
    const directRef = pref.refs.get(key);
    let score = 0;
    const usedSearchTokens = new Set<string>();
    if (directRef) score += directRef.weight;
    const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
    for (const [tok, w] of pref.tokens) {
      if (hay.includes(tok)) {
        score += w * settings.weights.search;
        usedSearchTokens.add(tok);
      }
    }
    score += (p.rating ?? 0) / 5;
    return { p, score, directRef, usedSearch: usedSearchTokens.size > 0 };
  });

  const sorted = personalized ? scored.sort((a, b) => b.score - a.score) : scored.slice().sort((a, b) => popularSortKey(b.p.rating, 0) - popularSortKey(a.p.rating, 0));

  const items: RecommendationItem[] = sorted.slice(0, personalized ? settings.count : settings.fallbackCount).map(({ p, directRef, usedSearch }) => ({
    id: String(p._id),
    category,
    name: p.name,
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? null,
    price: p.price,
    originalPrice: null,
    discountPercent: 0,
    rating: p.rating ?? null,
    service: p.service,
    vendorName: p.vendorName ?? "",
    eta: p.eta ?? null,
    reason: reasonFor(pref.refs, directRef ?? null, usedSearch),
  }));

  return {
    personalized,
    basedOn: buildBasedOn(pref.tokens),
    items,
  };
}

async function recommendFood(userId: unknown, settings: RecSettingsShape): Promise<RecOutput> {
  const pref = await buildPreference(userId, "food", settings.weights.recencyHalfLifeDays);
  const personalized = settings.minSignal === 0 || pref.totalSignal >= settings.minSignal;

  const [items, restaurants] = await Promise.all([
    FoodItem.find({ available: true }).lean(),
    Restaurant.find({ status: "ACTIVE" }).lean(),
  ]);
  const restaurantById = new Map(restaurants.map((r: any) => [String(r._id), r]));

  const scored = items
    .filter((i: any) => restaurantById.has(String(i.restaurantId)))
    .map((i: any) => {
      const r = restaurantById.get(String(i.restaurantId));
      const directRef = pref.refs.get(`foodItem:${i._id}`) ?? pref.refs.get(`restaurant:${String(i.restaurantId)}`);
      let score = 0;
      if (directRef) score += directRef.weight;
      const hay = `${i.name} ${i.description ?? ""} ${r?.name ?? ""} ${(r?.cuisines ?? []).join(" ")}`.toLowerCase();
      let usedSearchTokens = false;
      for (const [tok, w] of pref.tokens) {
        if (hay.includes(tok)) {
          score += w * settings.weights.search;
          usedSearchTokens = true;
        }
      }
      score += (i.rating ?? 0) / 5 + (i.bestseller ? 0.6 : 0);
      return { i, r, score, directRef, usedSearch: usedSearchTokens };
    });

  const sorted = personalized
    ? scored.sort((a, b) => b.score - a.score)
    : scored.slice().sort((a, b) => popularSortKey(b.i.rating, b.i.bestseller ? 1 : 0) - popularSortKey(a.i.rating, a.i.bestseller ? 1 : 0));

  const itemsOut: RecommendationItem[] = sorted.slice(0, settings.count).map(({ i, r, directRef, usedSearch }) => ({
    id: String(i._id),
    category: "food",
    name: i.name,
    description: i.description ?? "",
    imageUrl: i.imageUrl ?? null,
    price: i.price,
    originalPrice: i.discountPercent ? Math.round(i.price / (1 - i.discountPercent / 100)) : null,
    discountPercent: i.discountPercent || 0,
    rating: i.rating ?? null,
    veg: i.veg,
    restaurantId: String(i.restaurantId),
    restaurantName: r?.name ?? "",
    reason: reasonFor(pref.refs, directRef ?? null, usedSearch),
  }));

  return {
    personalized,
    basedOn: buildBasedOn(pref.tokens),
    items: itemsOut,
  };
}

function buildBasedOn(tokens: Map<string, number>): string[] {
  return [...tokens.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
}

export async function getRecommendations(userId: unknown, category: RecCategory): Promise<RecOutput> {
  const settings = await getRecSettings();
  const empty: RecOutput = { personalized: false, basedOn: [], items: [] };
  if (!settings.enabled) return empty;

  if (!isRecCategory(category)) return empty;

  const cacheKey = `${String(userId)}:${category}`;
  const cached = cache.get(cacheKey);
  if (cached && settings.cacheSeconds > 0 && Date.now() - cached.at < settings.cacheSeconds * 1000) {
    return cached.value as RecOutput;
  }

  const result = category === "food" ? await recommendFood(userId, settings) : await recommendProducts(userId, category, settings);
  if (settings.cacheSeconds > 0) cache.set(cacheKey, { at: Date.now(), value: result });
  return result;
}

/** Admin can force warm/cold behaviour; also used by tests to bypass cache. */
export function clearRecommendationCache(): void {
  cache.clear();
}

// --- Admin helpers ----------------------------------------------------------
export async function updateRecSettings(patch: Partial<RecSettingsShape>): Promise<RecSettingsShape> {
  const current = await getRecSettings();
  const merged: RecSettingsShape = { ...current, ...patch, weights: { ...current.weights, ...(patch.weights ?? {}) } };
  await RecSettings.findByIdAndUpdate("recommendations", { $set: merged }, { upsert: true });
  cache.clear();
  return merged;
}
