"use client";

import { LineChart } from "@/components/dashboard/LineChart";
import { getSalesByDay } from "@/lib/dashboard";

export function SalesTrendCard({ days = 7 }: { days?: number }) {
  const salesChart = getSalesByDay(days).map((d) => ({
    label: d.label,
    value: d.amount,
  }));

  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <h2 className="font-display text-base font-bold text-[var(--ink)]">
        Sales — last {days} days
      </h2>
      <div className="mt-4">
        <LineChart
          data={salesChart}
          height={192}
          valueFormatter={(v) =>
            v >= 1000 ? `₱${Math.round(v / 100) / 10}k` : `₱${v}`
          }
        />
      </div>
    </div>
  );
}
