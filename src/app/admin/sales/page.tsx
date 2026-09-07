import { SalesClient } from "@/components/dashboard/SalesClient";
import { listOrders } from "@/lib/orders-data";
import { listProducts } from "@/lib/product-store";

export default async function AdminSalesPage() {
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);
  return <SalesClient initialOrders={orders} initialProducts={products} />;
}
