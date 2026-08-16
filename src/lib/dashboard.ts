import { listProducts } from "@/lib/product-store";
import { getAvailabilityOverrides, listOrders } from "@/lib/orders";
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

export function getDashboardStats() {
  const orders = listOrders();
  const completed = getCompletedOrders(orders);
  const todayCompleted = completed.filter((o) => isToday(o.createdAt));
  const todaySales = sumSales(todayCompleted);

  const products = listProducts();
  const availability = getAvailabilityOverrides();
  const productsAvailable = products.filter(
    (p) => availability[p.id] ?? p.available,
  ).length;

  return {
    todaySales,
    todayTransactions: todayCompleted.length,
    averageSale: todayCompleted.length
      ? Math.round(todaySales / todayCompleted.length)
      : 0,
    productsAvailable,
    productsSoldOut: products.length - productsAvailable,
    recentTransactions: completed.slice(0, 5),
  };
}

export function getSalesByDay(days: number) {
  const orders = listOrders().filter(
    (o) => o.orderStatus === "completed" && isWithinDays(o.createdAt, days),
  );

  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }

  for (const order of orders) {
    const key = order.createdAt.slice(0, 10);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + order.totalAmount);
    }
  }

  return Array.from(map.entries()).map(([date, amount]) => ({
    date,
    label: formatChartDate(date),
    amount,
  }));
}

export function getOrdersByDay(days: number) {
  const orders = listOrders().filter(
    (o) => o.orderStatus === "completed" && isWithinDays(o.createdAt, days),
  );

  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }

  for (const order of orders) {
    const key = order.createdAt.slice(0, 10);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  return Array.from(map.entries()).map(([date, count]) => ({
    date,
    label: formatChartDate(date),
    count,
  }));
}

export function getBestSellers(limit = 5) {
  const counts = new Map<string, number>();
  for (const order of listOrders()) {
    if (order.orderStatus !== "completed") continue;
    for (const item of order.items) {
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + item.quantity);
    }
  }

  return Array.from(counts.entries())
    .map(([productId, sold]) => {
      const product = listProducts().find((p) => p.id === productId);
      return { productId, name: product?.name ?? productId, sold };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);
}

export function getPaymentBreakdown() {
  const orders = listOrders().filter((o) => o.orderStatus === "completed");
  const cash = orders.filter((o) => o.paymentMethod === "cash").length;
  const ewallet = orders.filter((o) => o.paymentMethod === "ewallet").length;
  return { cash, ewallet, total: orders.length };
}

export function filterOrdersByPeriod(
  orders: Order[],
  period: "today" | "week" | "month" | "all",
) {
  if (period === "all") return orders;
  const days = period === "today" ? 1 : period === "week" ? 7 : 30;
  return orders.filter((o) => isWithinDays(o.createdAt, days));
}
