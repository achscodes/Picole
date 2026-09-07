import { InventoryManagementClient } from "@/components/inventory/InventoryManagementClient";
import { listInventory } from "@/lib/inventory-data";
import { listProducts } from "@/lib/product-store";

export default async function AdminInventoryPage() {
  const [products, items] = await Promise.all([listProducts(), listInventory()]);
  return (
    <InventoryManagementClient
      historyHref="/admin/inventory/history"
      initialProducts={products}
      initialItems={items}
    />
  );
}
