"use server";

import { listStaffAccounts } from "@/lib/auth";
import {
  getDashboardStats as fetchDashboardStats,
  getSalesByDay as fetchSalesByDay,
} from "@/lib/dashboard-data";

/** Thin "use server" wrappers so client dashboards can poll live stats
 * directly (setInterval) without a full page navigation/refresh. */
export async function getDashboardStats() {
  return fetchDashboardStats();
}

export async function getSalesByDay(days: number) {
  return fetchSalesByDay(days);
}

export async function getPendingStaffSummary() {
  const pending = await listStaffAccounts("pending");
  return { count: pending.length, preview: pending.slice(0, 5) };
}
