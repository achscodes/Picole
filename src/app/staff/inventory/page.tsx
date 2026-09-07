import { InventoryManagementClient } from "@/components/inventory/InventoryManagementClient";
import { listInventory } from "@/lib/inventory-data";
import { listProducts } from "@/lib/product-store";

export default async function StaffInventoryPage() {
  const [products, items] = await Promise.all([listProducts(), listInventory()]);
  return (
    <InventoryManagementClient
      historyHref="/staff/inventory/history"
      initialProducts={products}
      initialItems={items}
    />
  );
}
