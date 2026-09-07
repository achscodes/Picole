import { OrderHistoryClient } from "@/components/dashboard/OrderHistoryClient";
import { listOrders } from "@/lib/orders-data";

export default async function StaffOrderHistoryPage() {
  const orders = await listOrders();
  return <OrderHistoryClient initialOrders={orders} />;
}
