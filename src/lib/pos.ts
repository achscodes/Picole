import type { CartItem, CustomerType, Order, PaymentMethod, Product } from "@/types";
import {
  createOrder,
  needsDiscountVerification,
  updateOrderStatus,
  verifyOrderDiscount,
} from "@/lib/orders";

export function isProductAvailable(
  product: Product,
  overrides: Record<string, boolean>,
): boolean {
  if (product.id in overrides) return overrides[product.id];
  return product.available;
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
  const order = createOrder({
    cart: input.cart,
    paymentMethod: input.paymentMethod,
    pickupName: input.pickupName,
    cashReceived: input.cashReceived,
    customerType: input.customerType,
    ewalletProvider: input.paymentMethod === "ewallet" ? "GCash" : undefined,
  });

  const customerType = input.customerType ?? "regular";
  if (needsDiscountVerification(customerType)) {
    const result = verifyOrderDiscount(order.id, input.discountIdNumber ?? "");
    if (!result.ok) {
      throw new Error(result.error);
    }
  }

  const finalized = updateOrderStatus(order.id, "completed");
  if (!finalized) {
    throw new Error("Could not finalize the sale.");
  }
  return finalized;
}
