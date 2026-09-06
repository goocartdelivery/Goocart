import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { ok, fail } from "../lib/http.js";
import {
  getRecommendations,
  invalidateUserCache,
  isRecCategory,
  normalizeQuery,
  trackEvent,
  trackSearch,
  type RecCategory,
} from "../lib/recommendations.js";

export const recommendationsRouter = Router();

const VALID_EVENTS = new Set(["VIEW_PRODUCT", "VIEW_RESTAURANT", "ADD_TO_CART", "REMOVE_FROM_CART", "PURCHASE", "FAVORITE"]);

// --- Track a user-mirroring event ------------------------------------------
// Fire-and-forget from the client side (the frontend does not await the
// response), but the endpoint itself is synchronous and cheap (one upsert).
// Requires auth so behaviour is always tied to a real user, never a spoofable
// userId from the body.
recommendationsRouter.post("/behavior", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const body: Record<string, unknown> = (req.body ?? {}) as Record<string, unknown>;
    const categoryRaw = String(body.category ?? "").toLowerCase();
    if (!isRecCategory(categoryRaw)) return res.status(400).json(fail("INVALID_CATEGORY", "category must be food, grocery, vegetables or mart."));
    const category: RecCategory = categoryRaw;

    if (body.type === "search") {
      const query = String(body.query ?? "").trim();
      if (!query) return res.status(400).json(fail("INVALID_SEARCH", "query is required for a search event."));
      if (!normalizeQuery(query)) return res.status(400).json(fail("INVALID_SEARCH", "query did not contain usable text."));
      await trackSearch({ category, userId: req.user!._id, query });
      invalidateUserCache(req.user!._id, category);
      return res.json(ok({ recorded: true }));
    }

    const eventType = String(body.type ?? "").toUpperCase();
    if (!VALID_EVENTS.has(eventType)) return res.status(400).json(fail("INVALID_EVENT", `type must be one of SEARCH, ${[...VALID_EVENTS].join(", ")}.`));

    const refTypeRaw = String(body.refType ?? "").toLowerCase();
    if (!["product", "fooditem", "restaurant"].includes(refTypeRaw)) {
      return res.status(400).json(fail("INVALID_REF", "refType must be product, foodItem or restaurant."));
    }
    const refType = refTypeRaw === "fooditem" ? "foodItem" : (refTypeRaw as "product" | "restaurant");
    const refId = body.refId ? String(body.refId) : null;
    if (!refId) return res.status(400).json(fail("INVALID_REF", "refId is required for a behaviour event."));

    await trackEvent({
      category,
      userId: req.user!._id,
      eventType,
      refType,
      refId,
      searchQuery: body.searchQuery ? String(body.searchQuery) : null,
    });
    invalidateUserCache(req.user!._id, category);
    res.json(ok({ recorded: true }));
  } catch (e) {
    res.status(500).json(fail("TRACK_FAILED", e instanceof Error ? e.message : "Could not record behaviour"));
  }
});

// --- Recommended for You ---------------------------------------------------
// Auth is OPTIONAL here: logged-in users get personalised results from their
// own history+behaviour, while guests (or users with no signal yet) receive a
// deterministic popularity fallback so the section is never empty. Tracking
// (POST /behavior) stays auth-gated so behaviour is always tied to a real user.
recommendationsRouter.get("/recommendations", async (req: AuthedRequest, res) => {
  try {
    const categoryRaw = String(req.query.category ?? "food").toLowerCase();
    if (!isRecCategory(categoryRaw)) return res.status(400).json(fail("INVALID_CATEGORY", "category must be food, grocery, vegetables or mart."));
    const category: RecCategory = categoryRaw;
    const result = await getRecommendations(req.user?._id ?? null, category);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || result.items.length));
    res.json(ok({ category, personalized: result.personalized, basedOn: result.basedOn, items: result.items.slice(0, limit) }));
  } catch (e) {
    res.status(500).json(fail("RECOMMENDATIONS_UNAVAILABLE", e instanceof Error ? e.message : "Could not load recommendations"));
  }
});
