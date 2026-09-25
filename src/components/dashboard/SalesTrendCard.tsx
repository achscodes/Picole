"use client";

import { useCallback } from "react";
import { LineChart } from "@/components/dashboard/LineChart";
import { LastUpdatedNote } from "@/components/ui/LastUpdatedNote";
import { getSalesByDay } from "@/lib/actions/dashboard";
import { usePolledAction } from "@/hooks/usePolledAction";

const EMPTY_CHART: Array<{ label: string; value: number }> = [];

export function SalesTrendCard({ days = 7 }: { days?: number }) {
  const fetchChart = useCallback(async () => {
    const data = await getSalesByDay(days);
    return data.map((d) => ({ label: d.label, value: d.amount }));
  }, [days]);

  const { data: salesChart, isStale, lastUpdatedAt } = usePolledAction(fetchChart, {
    cacheKey: `sales-trend-${days}`,
    initialData: EMPTY_CHART,
  });

  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          Sales — last {days} days
        </h2>
        <LastUpdatedNote lastUpdatedAt={lastUpdatedAt} isStale={isStale} />
      </div>
      <div className="mt-4">
        <LineChart
          data={salesChart}
          height={192}
          valueFormat="peso"
        />
      </div>
    </div>
  );
}
