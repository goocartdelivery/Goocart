import { Order } from "../models.js";
import { CANCELLED_STATUSES } from "./orderState.js";

// --- Business rules (single source of truth for Dashboard + Analytics) -----
// "Today" uses the Indian business day (Asia/Kolkata, UTC+05:30, no DST).
// Revenue counts only successfully delivered orders, using the order's own
// stored statusHistory entry for DELIVERED (falling back to createdAt for
// legacy rows without one) so an order created yesterday but delivered today
// is reported on the day it actually earned the money.
// ---------------------------------------------------------------------------

export const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const COMPLETED_STATUSES = ["DELIVERED"] as const;
export const ACTIVE_STATUSES = [
  "VENDOR_ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "DELIVERY_PARTNER_ASSIGNED",
  "GOING_TO_VENDOR",
  "ARRIVED_AT_VENDOR",
  "PICKED_UP",
  "ON_THE_WAY",
  "ARRIVED",
] as const;

const ALL_CANCELLED = [...CANCELLED_STATUSES];
const ALL_ACTIVE = [...ACTIVE_STATUSES];
const ALL_COMPLETED = [...COMPLETED_STATUSES];

/** Midnight today (start of the Indian business day) as a UTC instant. */
export function startOfBusinessDay(now: Date = new Date(), offsetMs: number = INDIA_OFFSET_MS): Date {
  const shifted = new Date(now.getTime() + offsetMs);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - offsetMs);
}

/** Midnight on the 1st of the current Indian business month. */
export function startOfBusinessMonth(now: Date = new Date(), offsetMs: number = INDIA_OFFSET_MS): Date {
  const shifted = new Date(now.getTime() + offsetMs);
  shifted.setUTCDate(1);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - offsetMs);
}

/** "2026-09-11" in the Indian business day for a given UTC Date. */
export function istDateString(date: Date): string {
  return new Date(date.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10);
}

// Counts are bucketed by createdAt (when the vendor received the order);
// revenue is bucketed by the DELIVERED timestamp so completions land on the
// day they happened.
const COUNTS_GROUP: Record<string, any> = {
  _id: null,
  orders: { $sum: 1 },
  pending: { $sum: { $cond: [{ $eq: ["$status", "PLACED"] }, 1, 0] } },
  active: { $sum: { $cond: [{ $in: ["$status", ALL_ACTIVE] }, 1, 0] } },
  completed: { $sum: { $cond: [{ $in: ["$status", ALL_COMPLETED] }, 1, 0] } },
  rejected: { $sum: { $cond: [{ $eq: ["$status", "VENDOR_REJECTED"] }, 1, 0] } },
  cancelled: { $sum: { $cond: [{ $in: ["$status", ALL_CANCELLED] }, 1, 0] } },
};

const REVENUE_GROUP: Record<string, any> = {
  _id: null,
  revenue: { $sum: { $ifNull: ["$bill.total", 0] } },
};

function zeroCounts() {
  return { orders: 0, pending: 0, active: 0, completed: 0, rejected: 0, cancelled: 0 };
}

function first(group: any[] | undefined, fallback: Record<string, number>): Record<string, number> {
  return (group?.[0] ?? { ...fallback }) as Record<string, number>;
}

export type VendorStats = {
  today: Record<string, number>;
  month: Record<string, number>;
  lifetime: Record<string, number>;
  series: { date: string; orders: number; revenue: number }[];
  topItems: { name: string; variant: string | null; quantity: number; revenue: number }[];
};

export async function computeVendorStats(restaurantId: unknown, now: Date = new Date()): Promise<VendorStats> {
  const startToday = startOfBusinessDay(now);
  const startMonth = startOfBusinessMonth(now);

  const [facet]: any[] = await Order.aggregate([
    { $match: { restaurantId } },
    {
      $addFields: {
        deliveredAt: {
          $let: {
            vars: {
              d: { $filter: { input: { $ifNull: ["$statusHistory", []] }, as: "h", cond: { $eq: ["$$h.status", "DELIVERED"] } } },
            },
            in: { $arrayElemAt: ["$$d.at", 0] },
          },
        },
        createdDayIST: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
      },
    },
    {
      $addFields: {
        revenueDate: { $ifNull: ["$deliveredAt", "$createdAt"] },
        revenueDayIST: {
          $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$deliveredAt", "$createdAt"] }, timezone: "Asia/Kolkata" },
        },
      },
    },
    {
      $facet: {
        lifetime: [{ $group: COUNTS_GROUP }],
        todayCounts: [{ $match: { createdAt: { $gte: startToday } } }, { $group: COUNTS_GROUP }],
        monthCounts: [{ $match: { createdAt: { $gte: startMonth } } }, { $group: COUNTS_GROUP }],
        todayRevenue: [{ $match: { status: { $in: ALL_COMPLETED }, revenueDate: { $gte: startToday } } }, { $group: REVENUE_GROUP }],
        monthRevenue: [{ $match: { status: { $in: ALL_COMPLETED }, revenueDate: { $gte: startMonth } } }, { $group: REVENUE_GROUP }],
        lifetimeRevenue: [{ $match: { status: { $in: ALL_COMPLETED } } }, { $group: REVENUE_GROUP }],
        seriesOrders: [{ $match: { createdAt: { $gte: startMonth } } }, { $group: { _id: "$createdDayIST", orders: { $sum: 1 } } }],
        seriesRevenue: [
          { $match: { status: { $in: ALL_COMPLETED }, revenueDate: { $gte: startMonth } } },
          { $group: { _id: "$revenueDayIST", revenue: { $sum: { $ifNull: ["$bill.total", 0] } } } },
        ],
        topItems: [
          { $match: { status: { $nin: ALL_CANCELLED } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: { name: "$items.name", variant: "$items.variant.name" },
              quantity: { $sum: { $ifNull: ["$items.quantity", 0] } },
              revenue: { $sum: { $ifNull: ["$items.lineTotal", 0] } },
            },
          },
          { $sort: { revenue: -1, quantity: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  const lifetime = first(facet?.lifetime, zeroCounts());
  const todayCounts = first(facet?.todayCounts, zeroCounts());
  const monthCounts = first(facet?.monthCounts, zeroCounts());
  const todayRevenue = first(facet?.todayRevenue, { revenue: 0 });
  const monthRevenue = first(facet?.monthRevenue, { revenue: 0 });
  const lifetimeRevenue = first(facet?.lifetimeRevenue, { revenue: 0 });

  // Merge the per-day series into a contiguous IST month (today included,
  // missing days as zero) so the chart never invents dates or drops gaps.
  const ordersByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  for (const row of facet?.seriesOrders ?? []) ordersByDay[row._id] = row.orders as number;
  for (const row of facet?.seriesRevenue ?? []) revenueByDay[row._id] = row.revenue as number;

  const series: { date: string; orders: number; revenue: number }[] = [];
  const cursor = new Date(startMonth.getTime());
  const today = startOfBusinessDay(now).getTime();
  while (cursor.getTime() <= today) {
    const date = istDateString(cursor);
    series.push({ date, orders: ordersByDay[date] ?? 0, revenue: Math.round(revenueByDay[date] ?? 0) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const topItems = (facet?.topItems ?? []).map((row: any) => ({
    name: row._id?.name ?? "Item",
    variant: row._id?.variant ?? null,
    quantity: row.quantity as number,
    revenue: row.revenue as number,
  }));

  return {
    today: { ...todayCounts, revenue: Math.round(todayRevenue.revenue ?? 0) },
    month: { ...monthCounts, revenue: Math.round(monthRevenue.revenue ?? 0) },
    lifetime: { ...lifetime, revenue: Math.round(lifetimeRevenue.revenue ?? 0) },
    series,
    topItems,
  };
}