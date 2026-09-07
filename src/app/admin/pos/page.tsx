import { PosClient } from "@/components/pos/PosClient";
import { listProducts } from "@/lib/product-store";

export default async function AdminPosPage() {
  const products = await listProducts();
  return <PosClient initialProducts={products} />;
}
