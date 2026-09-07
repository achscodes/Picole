import "server-only";

import { filterProductsByCategory } from "@/data/catalog";
import { createClient } from "@/lib/supabase/server";
import type { CategoryId, Product } from "@/types";

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: Product["categoryId"];
  image: string;
  available: boolean;
  best_seller: boolean;
  is_new: boolean;
  calories_note: string | null;
};

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    categoryId: row.category_id,
    image: row.image,
    available: row.available,
    bestSeller: row.best_seller,
    isNew: row.is_new,
    caloriesNote: row.calories_note ?? undefined,
  };
}

const PRODUCT_COLUMNS =
  "id, name, description, price, category_id, image, available, best_seller, is_new, calories_note";

export async function listProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProductRow);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProductRow(data) : undefined;
}

export async function filterProducts(categoryId: CategoryId | string) {
  return filterProductsByCategory(await listProducts(), categoryId);
}
