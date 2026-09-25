import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { LineChart } from "@/components/dashboard/LineChart";
import {
  getBestSellers,
  getOrdersByDay,
  getPaymentBreakdown,
  getSalesByDay,
} from "@/lib/dashboard-data";
import { sumSales } from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";
import { listOrders } from "@/lib/orders-data";

export async function ReportsClient() {
  const results = await Promise.allSettled([
    listOrders(),
    getSalesByDay(14),
    getOrdersByDay(14),
    getBestSellers(5),
    getPaymentBreakdown(),
  ]);

  const [ordersResult, salesByDayResult, ordersByDayResult, bestSellersResult, paymentsResult] = results;
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const salesByDay = salesByDayResult.status === "fulfilled" ? salesByDayResult.value : [];
  const ordersByDay = ordersByDayResult.status === "fulfilled" ? ordersByDayResult.value : [];
  const bestSellers = bestSellersResult.status === "fulfilled" ? bestSellersResult.value : [];
  const payments = paymentsResult.status === "fulfilled"
    ? paymentsResult.value
    : { cash: 0, ewallet: 0, total: 0 };
  const hasDataError = results.some((result) => result.status === "rejected");

  const completed = orders.filter((o) => o.orderStatus === "completed");
  const totalSales = sumSales(completed);
  const avgOrder = completed.length ? totalSales / completed.length : 0;
  const salesChart = salesByDay.map((d) => ({ label: d.label, value: d.amount }));
  const ordersChart = ordersByDay.map((d) => ({ label: d.label, value: d.count }));

  const paymentTotal = payments.cash + payments.ewallet || 1;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Basic performance overview."
      />
      {hasDataError && (
        <p className="mb-6 rounded-xl border border-[var(--brand-orange)]/30 bg-[var(--brand-orange)]/10 px-4 py-3 text-sm text-[var(--ink)]">
          Some analytics data is temporarily unavailable. Available results are shown below.
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Sales" value={formatPeso(totalSales)} />
        <StatCard label="Total Orders" value={completed.length} />
        <StatCard label="Average Order Value" value={formatPeso(avgOrder)} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-card bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Sales over time
          </h2>
          <div className="mt-4">
            <LineChart
              data={salesChart}
              height={192}
              valueFormat="peso"
            />
          </div>
        </div>

        <div className="rounded-card bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Orders over time
          </h2>
          <div className="mt-4">
            <LineChart data={ordersChart} height={192} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card bg-white p-5 shadow-card">
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

        <div className="rounded-card bg-white p-5 shadow-card">
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
