import { OrderHistoryClient } from "@/components/dashboard/OrderHistoryClient";
import { listOrders } from "@/lib/orders-data";

export default async function AdminOrderHistoryPage() {
  const orders = await listOrders();
  return <OrderHistoryClient initialOrders={orders} />;
}
