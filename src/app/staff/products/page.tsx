import { StaffProductsClient } from "@/components/staff/StaffProductsClient";
import { listProducts } from "@/lib/product-store";

export default async function StaffProductsPage() {
  const products = await listProducts();
  return <StaffProductsClient initialProducts={products} />;
}
