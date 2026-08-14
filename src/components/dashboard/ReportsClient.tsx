"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  getBestSellers,
  getOrdersByDay,
  getPaymentBreakdown,
  getSalesByDay,
  sumSales,
} from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";
import { listOrders } from "@/lib/orders";

export function ReportsClient() {
  const orders = useMemo(() => listOrders(), []);
  const completed = orders.filter((o) => o.orderStatus === "completed");
  const totalSales = sumSales(completed);
  const avgOrder = completed.length ? totalSales / completed.length : 0;
  const salesChart = getSalesByDay(14);
  const ordersChart = getOrdersByDay(14);
  const bestSellers = getBestSellers(5);
  const payments = getPaymentBreakdown();

  const maxSales = Math.max(...salesChart.map((d) => d.amount), 1);
  const maxOrders = Math.max(...ordersChart.map((d) => d.count), 1);
  const paymentTotal = payments.cash + payments.ewallet || 1;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Basic performance overview."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Sales" value={formatPeso(totalSales)} />
        <StatCard label="Total Orders" value={completed.length} />
        <StatCard label="Average Order Value" value={formatPeso(avgOrder)} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Sales over time
          </h2>
          <div className="mt-6 flex h-44 items-end gap-1">
            {salesChart.map((day) => (
              <div
                key={day.date}
                className="flex-1 rounded-t bg-[var(--brand-green)]/70"
                style={{
                  height: `${Math.max(4, (day.amount / maxSales) * 100)}%`,
                }}
                title={`${day.label}: ${formatPeso(day.amount)}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Orders over time
          </h2>
          <div className="mt-6 flex h-44 items-end gap-1">
            {ordersChart.map((day) => (
              <div
                key={day.date}
                className="flex-1 rounded-t bg-[#F5B942]"
                style={{
                  height: `${Math.max(4, (day.count / maxOrders) * 100)}%`,
                }}
                title={`${day.label}: ${day.count}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Best-selling products
          </h2>
          <ol className="mt-4 space-y-3">
            {bestSellers.length === 0 ? (
              <li className="text-sm text-[var(--ink-muted)]">No data yet.</li>
            ) : (
              bestSellers.map((item, i) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--ink)]">
                    {i + 1}. {item.name}
                  </span>
                  <span className="text-[var(--ink-muted)]">
                    {item.sold} sold
                  </span>
                </li>
              ))
            )}
          </ol>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Payment method distribution
          </h2>
          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Cash</span>
                <span>{payments.cash}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--cream-strong)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-green)]"
                  style={{ width: `${(payments.cash / paymentTotal) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>E-Wallet</span>
                <span>{payments.ewallet}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--cream-strong)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-green-dark)]"
                  style={{
                    width: `${(payments.ewallet / paymentTotal) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
