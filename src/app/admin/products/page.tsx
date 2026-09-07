import { StaffProductsClient } from "@/components/staff/StaffProductsClient";
import { listProducts } from "@/lib/product-store";

export default async function AdminProductsPage() {
  const products = await listProducts();
  return <StaffProductsClient initialProducts={products} />;
}
