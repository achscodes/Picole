import type { CartItem, CustomerType, Order, PaymentMethod, Product } from "@/types";
import { createOrder } from "@/lib/orders";

export function isProductAvailable(
  product: Product,
  overrides: Record<string, boolean>,
  stock?: number,
): boolean {
  const manuallyAvailable =
    product.id in overrides ? overrides[product.id] : product.available;
  if (!manuallyAvailable) return false;
  if (stock !== undefined && stock <= 0) return false;
  return true;
}

export interface PosSaleInput {
  cart: CartItem[];
  paymentMethod: PaymentMethod;
  pickupName?: string;
  cashReceived?: number;
  customerType?: CustomerType;
  discountIdNumber?: string;
}

export function completePosSale(input: PosSaleInput): Order {
  return createOrder({
    cart: input.cart,
    paymentMethod: input.paymentMethod,
    pickupName: input.pickupName,
    cashReceived: input.cashReceived,
    customerType: input.customerType,
    discountIdNumber: input.discountIdNumber,
    ewalletProvider: input.paymentMethod === "ewallet" ? "GCash" : undefined,
  });
}
