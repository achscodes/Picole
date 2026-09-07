"use server";

import { getCategoryImage, type FlavorCategoryId } from "@/data/catalog";
import { getCurrentSession } from "@/lib/auth";
import { listProducts, mapProductRow } from "@/lib/product-store";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

async function requireStaff() {
  const session = await getCurrentSession();
  if (!session) throw new Error("You must be signed in to manage products.");
  return session;
}

/** "use server" passthrough so client components can fetch/poll the product
 * catalog directly, without a full page navigation/refresh. */
export async function getProducts() {
  return listProducts();
}

export async function saveProduct(product: Product): Promise<Product> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.categoryId,
      image: product.image,
      available: product.available,
      best_seller: product.bestSeller ?? false,
      is_new: product.isNew ?? false,
      calories_note: product.caloriesNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", product.id)
    .select(
      "id, name, description, price, category_id, image, available, best_seller, is_new, calories_note",
    )
    .single();
  if (error) throw new Error(error.message);
  return mapProductRow(data);
}

export async function createProduct(
  input: Omit<Product, "id"> & { categoryId: FlavorCategoryId },
): Promise<Product> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      price: input.price,
      category_id: input.categoryId,
      image: input.image || getCategoryImage(input.categoryId),
      available: input.available ?? true,
      best_seller: input.bestSeller ?? false,
      is_new: input.isNew ?? false,
      calories_note: input.caloriesNote ?? null,
    })
    .select(
      "id, name, description, price, category_id, image, available, best_seller, is_new, calories_note",
    )
    .single();
  if (error) throw new Error(error.message);
  return mapProductRow(data);
}

/** Soft-delete: keeps the row (and its inventory-movement history) but hides it from listings. */
export async function deleteProduct(id: string): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
