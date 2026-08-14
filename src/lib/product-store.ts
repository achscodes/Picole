import {
  DEFAULT_PRODUCTS,
  filterProductsByCategory,
  getCategoryImage,
  type FlavorCategoryId,
} from "@/data/catalog";
import type { CategoryId, Product } from "@/types";

const STORE_KEY = "picole.products.v1";

type ProductPatch = Partial<Omit<Product, "id">> & { deleted?: boolean };

type ProductStore = {
  patches: Record<string, ProductPatch>;
  custom: Product[];
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function readStore(): ProductStore {
  if (!canUseStorage()) return { patches: {}, custom: [] };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as ProductStore) : { patches: {}, custom: [] };
  } catch {
    return { patches: {}, custom: [] };
  }
}

function writeStore(store: ProductStore) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function mergeProduct(base: Product, patch?: ProductPatch): Product | null {
  if (patch?.deleted) return null;
  if (!patch) return base;
  return { ...base, ...patch, id: base.id };
}

export function listProducts(): Product[] {
  const store = readStore();
  const defaults = DEFAULT_PRODUCTS.map((p) =>
    mergeProduct(p, store.patches[p.id]),
  ).filter((p): p is Product => Boolean(p));
  const custom = store.custom
    .map((p) => mergeProduct(p, store.patches[p.id]))
    .filter((p): p is Product => Boolean(p));
  return [...defaults, ...custom];
}

export function getProductById(id: string) {
  return listProducts().find((p) => p.id === id);
}

export function filterProducts(categoryId: CategoryId | string) {
  return filterProductsByCategory(listProducts(), categoryId);
}

export function saveProduct(product: Product) {
  const store = readStore();
  const isDefault = DEFAULT_PRODUCTS.some((p) => p.id === product.id);
  const { id, ...rest } = product;

  if (isDefault) {
    store.patches[id] = { ...store.patches[id], ...rest, deleted: false };
  } else {
    const idx = store.custom.findIndex((p) => p.id === id);
    const next = { ...product };
    if (idx >= 0) {
      store.custom[idx] = next;
    } else {
      store.custom.push(next);
    }
    delete store.patches[id]?.deleted;
  }

  writeStore(store);
  return product;
}

export function createProduct(
  input: Omit<Product, "id"> & { categoryId: FlavorCategoryId },
) {
  const product: Product = {
    ...input,
    id: crypto.randomUUID(),
    image: input.image || getCategoryImage(input.categoryId),
    available: input.available ?? true,
  };
  const store = readStore();
  store.custom.push(product);
  writeStore(store);
  return product;
}

export function deleteProduct(id: string) {
  const store = readStore();
  if (DEFAULT_PRODUCTS.some((p) => p.id === id)) {
    store.patches[id] = { ...store.patches[id], deleted: true };
  } else {
    store.custom = store.custom.filter((p) => p.id !== id);
    delete store.patches[id];
  }
  writeStore(store);
}

export function resetProductStore() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORE_KEY);
}

export async function readImageAttachment(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
