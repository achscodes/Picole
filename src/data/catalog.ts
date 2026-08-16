import type { Category, CategoryId, Product } from "@/types";

const ASSET_BASE = "/Assets/Assets";

export const BRAND_IMAGES = {
  logo: `${ASSET_BASE}/Picole%20Logo%20PNG.avif`,
  juicy: `${ASSET_BASE}/Strawberry(with%20dalandan).avif`,
  milky: `${ASSET_BASE}/Milky.avif`,
  lite: `${ASSET_BASE}/Lite.avif`,
  premium: `${ASSET_BASE}/Premium.avif`,
  dip: `${ASSET_BASE}/Dip.avif`,
  specialty: `${ASSET_BASE}/Specialty.avif`,
} as const;

export const BRAND = {
  name: "Picolé",
  tagline: "Healthy Ice Pops",
  logo: BRAND_IMAGES.logo,
  currency: "PHP" as const,
  pickupLocation: "Picolé Healthy Ice Pops Stall",
};

/** Flavor lines backed by assets — one board image per line. */
export const FLAVOR_CATEGORY_IDS = [
  "dip",
  "lite",
  "premium",
  "juicy",
  "specialty",
  "milky",
] as const;

export type FlavorCategoryId = (typeof FLAVOR_CATEGORY_IDS)[number];

export const CATEGORIES: Category[] = [
  {
    id: "all",
    name: "All",
    accent: "#1E6FE8",
    benefits: [],
  },
  {
    id: "best-sellers",
    name: "Best Sellers",
    accent: "#F5B942",
    benefits: [],
  },
  {
    id: "dip",
    name: "Dip Pops",
    image: BRAND_IMAGES.dip,
    accent: "#A0724E",
    benefits: ["Calcium", "3g prebiotics", "As low as 135 cal"],
  },
  {
    id: "lite",
    name: "Lite Pops",
    image: BRAND_IMAGES.lite,
    accent: "#F28C28",
    benefits: ["No sugar added", "Diabetic friendly", "As low as 10 cal"],
  },
  {
    id: "premium",
    name: "Premium Pops",
    image: BRAND_IMAGES.premium,
    accent: "#C9A86C",
    benefits: ["Calcium", "Low fat", "Real nuts", "As low as 135 cal"],
  },
  {
    id: "juicy",
    name: "Juicy Pops",
    image: BRAND_IMAGES.juicy,
    accent: "#F08A8A",
    benefits: ["Lactose free", "Low fat", "3g prebiotics", "As low as 48 cal"],
  },
  {
    id: "specialty",
    name: "Specialty Pops",
    image: BRAND_IMAGES.specialty,
    accent: "#A0724E",
    benefits: ["Calcium", "3g prebiotics", "Low fat", "65–135 cal"],
  },
  {
    id: "milky",
    name: "Milky Pops",
    image: BRAND_IMAGES.milky,
    accent: "#8FA86A",
    benefits: ["Calcium", "Low fat", "3g prebiotics", "As low as 65 cal"],
  },
];

function product(
  partial: Omit<Product, "available"> & { available?: boolean },
): Product {
  return { available: true, ...partial };
}

/** Default menu — one product per flavor line (no duplicate flavor boards). */
export const DEFAULT_PRODUCTS: Product[] = [
  product({
    id: "dip-pops",
    name: "Dip Pops",
    description: "Creamy dip pops coated for a richer bite.",
    price: 75,
    categoryId: "dip",
    image: BRAND_IMAGES.dip,
    bestSeller: true,
  }),
  product({
    id: "lite-pops",
    name: "Lite Pops",
    description: "No sugar added — diabetic friendly and as low as 10 cal.",
    price: 45,
    categoryId: "lite",
    image: BRAND_IMAGES.lite,
  }),
  product({
    id: "premium-pops",
    name: "Premium Pops",
    description: "Premium pops with real nuts and indulgent flavor.",
    price: 80,
    categoryId: "premium",
    image: BRAND_IMAGES.premium,
    bestSeller: true,
  }),
  product({
    id: "juicy-pops",
    name: "Juicy Pops",
    description: "Fruit-forward juicy pops — lactose free and refreshing.",
    price: 50,
    categoryId: "juicy",
    image: BRAND_IMAGES.juicy,
    bestSeller: true,
    caloriesNote: "As low as 48 calories",
  }),
  product({
    id: "specialty-pops",
    name: "Specialty Pops",
    description: "Limited specialty flavors with Picolé's signature twist.",
    price: 75,
    categoryId: "specialty",
    image: BRAND_IMAGES.specialty,
  }),
  product({
    id: "milky-pops",
    name: "Milky Pops",
    description: "Creamy milky pops with calcium and prebiotics.",
    price: 65,
    categoryId: "milky",
    image: BRAND_IMAGES.milky,
  }),
];

export function getCategoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function getFlavorCategories() {
  return CATEGORIES.filter((c) =>
    FLAVOR_CATEGORY_IDS.includes(c.id as FlavorCategoryId),
  );
}

export function getCategoryImage(categoryId: FlavorCategoryId) {
  return BRAND_IMAGES[categoryId];
}

export function filterProductsByCategory(
  products: Product[],
  categoryId: CategoryId | string,
) {
  if (categoryId === "all") return products;
  if (categoryId === "best-sellers")
    return products.filter((p) => p.bestSeller);
  return products.filter((p) => p.categoryId === categoryId);
}

/** Matches by product name, description, or flavor category name. */
export function searchProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => {
    if (p.name.toLowerCase().includes(q)) return true;
    if (p.description.toLowerCase().includes(q)) return true;
    const category = getCategoryById(p.categoryId);
    if (category?.name.toLowerCase().includes(q)) return true;
    return false;
  });
}
