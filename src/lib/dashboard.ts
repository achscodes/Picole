import type { Order } from "@/types";

export function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isWithinDays(iso: string, days: number) {
  const d = new Date(iso);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return d >= cutoff;
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatChartDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatShortTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCompletedOrders(orders: Order[]) {
  return orders.filter((o) => o.orderStatus === "completed");
}

export function sumSales(orders: Order[]) {
  return orders
    .filter((o) => o.orderStatus === "completed")
    .reduce((sum, o) => sum + o.totalAmount, 0);
}

export function filterOrdersByPeriod(
  orders: Order[],
  period: "today" | "week" | "month" | "all",
) {
  if (period === "all") return orders;
  const days = period === "today" ? 1 : period === "week" ? 7 : 30;
  return orders.filter((o) => isWithinDays(o.createdAt, days));
}
