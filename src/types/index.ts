export type PaymentMethod = "cash" | "ewallet";
export type CustomerType = "regular" | "pwd" | "senior";
export type DiscountStatus = "none" | "pending" | "verified";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type CategoryId =
  | "all"
  | "best-sellers"
  | "dip"
  | "lite"
  | "premium"
  | "juicy"
  | "specialty"
  | "milky";

export interface Category {
  id: CategoryId;
  name: string;
  image?: string;
  /** Reserved for a future per-category accent treatment; not yet rendered anywhere. */
  accent: string;
  benefits: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: Exclude<CategoryId, "all" | "best-sellers">;
  image: string;
  available: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
  caloriesNote?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "verified";
  orderStatus: OrderStatus;
  pickupName?: string;
  cashReceived?: number;
  expectedChange?: number;
  ewalletProvider?: string;
  customerType?: CustomerType;
  subtotalBeforeDiscount?: number;
  discountRate?: number;
  discountAmount?: number;
  discountStatus?: DiscountStatus;
  discountIdNumber?: string;
  createdAt: string;
  updatedAt: string;
}
