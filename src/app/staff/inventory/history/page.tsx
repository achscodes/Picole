import { InventoryHistoryClient } from "@/components/inventory/InventoryHistoryClient";
import { listMovements } from "@/lib/inventory-data";
import { listProducts } from "@/lib/product-store";

export default async function StaffInventoryHistoryPage() {
  const [movements, products] = await Promise.all([listMovements(), listProducts()]);
  return <InventoryHistoryClient initialMovements={movements} initialProducts={products} />;
}
