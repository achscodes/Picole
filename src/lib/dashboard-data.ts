import "server-only";

import {
  formatChartDate,
  getCompletedOrders,
  isToday,
  isWithinDays,
  sumSales,
} from "@/lib/dashboard";
import { listOrders } from "@/lib/orders-data";
import { listProducts } from "@/lib/product-store";

export async function getDashboardStats() {
  const orders = await listOrders();
  const completed = getCompletedOrders(orders);
  const todayCompleted = completed.filter((o) => isToday(o.createdAt));
  const todaySales = sumSales(todayCompleted);

  const products = await listProducts();
  const productsAvailable = products.filter((p) => p.available).length;

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

export async function getSalesByDay(days: number) {
  const orders = (await listOrders()).filter(
    (o) => o.orderStatus === "completed" && isWithinDays(o.createdAt, days),
  );

  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
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

export async function getOrdersByDay(days: number) {
  const orders = (await listOrders()).filter(
    (o) => o.orderStatus === "completed" && isWithinDays(o.createdAt, days),
  );

  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
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

export async function getBestSellers(limit = 5) {
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);

  const counts = new Map<string, number>();
  for (const order of orders) {
    if (order.orderStatus !== "completed") continue;
    for (const item of order.items) {
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + item.quantity);
    }
  }

  return Array.from(counts.entries())
    .map(([productId, sold]) => {
      const product = products.find((p) => p.id === productId);
      return { productId, name: product?.name ?? productId, sold };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);
}

export async function getPaymentBreakdown() {
  const orders = (await listOrders()).filter((o) => o.orderStatus === "completed");
  const cash = orders.filter((o) => o.paymentMethod === "cash").length;
  const ewallet = orders.filter((o) => o.paymentMethod === "ewallet").length;
  return { cash, ewallet, total: orders.length };
}
