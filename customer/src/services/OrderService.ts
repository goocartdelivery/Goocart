import { restaurantService } from "@/services/RestaurantService";
import { serviceOrderService, ServiceOrder } from "@/services/ServiceOrderService";
import { cartLineId } from "@/store/useCartStore";
import { storeProductRef } from "@/store/useStoreCartStore";
import { CartLineItem, FoodOrder, StoreProductRef } from "@/types";

export type ReorderResult = {
  items: CartLineItem[];
  unavailable: string[];
  priceChanged: boolean;
};

// Rebuilds cart lines from a past order against the LIVE catalog, so a reorder
// always uses today's prices and availability — never the historical values
// stored on the original order. Order creation itself lives on the server
// (see useOrderStore / POST /api/v1/orders).
export async function checkReorderAvailability(order: FoodOrder): Promise<ReorderResult> {
  const data = await restaurantService.getRestaurantWithMenu(order.restaurantId);
  if (!data) return { items: [], unavailable: order.items.map((i) => i.name), priceChanged: false };

  const items: CartLineItem[] = [];
  const unavailable: string[] = [];
  let priceChanged = false;

  for (const line of order.items) {
    const current = data.items.find((i) => i.id === line.foodItemId);
    if (!current || !current.available) {
      unavailable.push(line.name);
      continue;
    }

    const variantPrice = line.selectedVariant
      ? current.variants?.find((v) => v.id === line.selectedVariant!.id)?.price ?? current.price
      : current.price;
    const addonsPrice = line.selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = variantPrice + addonsPrice;
    if (unitPrice !== line.unitPrice) priceChanged = true;

    items.push({
      ...line,
      lineId: cartLineId(line.foodItemId, line.selectedVariant?.id, line.selectedAddons.map((a) => a.id)),
      imageUrl: current.imageUrl,
      unitPrice,
      lineTotal: Math.round(unitPrice * line.quantity),
    });
  }

  return { items, unavailable, priceChanged };
}

export type StoreReorderResult = {
  items: StoreProductRef[];
  unavailable: string[];
  priceChanged: boolean;
};

// Rebuilds store-cart products from a past service order against the LIVE
// catalog (one products fetch per distinct store service in the order), so a
// reorder uses today's prices + stock — never historical values.
export async function checkServiceReorderAvailability(order: ServiceOrder): Promise<StoreReorderResult> {
  const details = (order.details ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(details.items) ? (details.items as { productId?: string; name?: string; service?: string; quantity?: number; unitPrice?: number }[]) : [];
  const unavailable: string[] = [];
  let priceChanged = false;

  // Distinct service keys across the order's items (GROCERY / VEGETABLES / MART).
  const serviceKeys = [...new Set(rawItems.map((i) => (i.service ?? "").trim().toUpperCase()).filter((k) => ["GROCERY", "VEGETABLES", "MART"].includes(k)))];

  const catalog: { productId: string; name: string; service: string; price: number; stock: number }[] = [];
  try {
    const byService = await Promise.all(serviceKeys.map((key) => serviceOrderService.products(key)));
    byService.forEach((rows) =>
      rows.forEach((p) => catalog.push({ productId: p.id, name: p.name, service: normalizeServiceKey(p.service), price: p.price, stock: p.stock })),
    );
  } catch {
    // If the catalog is unreachable, treat every line as unavailable rather
    // than blindly recreating a stale order.
    return { items: [], unavailable: rawItems.map((i) => i.name ?? "Item"), priceChanged: false };
  }

  const items: StoreProductRef[] = [];
  for (const line of rawItems) {
    const current = catalog.find((p) => p.productId === line.productId);
    if (!current || current.stock <= 0) {
      unavailable.push(line.name ?? "Item");
      continue;
    }
    if (current.price !== line.unitPrice) priceChanged = true;
    items.push(storeProductRef({ id: current.productId, service: current.service, name: current.name, price: current.price }));
  }

  return { items, unavailable, priceChanged };
}

function normalizeServiceKey(service: string): string {
  const key = service.trim().toUpperCase();
  if (key === "GROCERY" || key === "GRO") return "Grocery";
  if (key === "VEGETABLES" || key === "VEGETABLE" || key === "VEG") return "Vegetables";
  if (key === "MART") return "Mart";
  return service;
}
