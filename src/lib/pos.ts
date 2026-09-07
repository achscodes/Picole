import type { CartItem, CustomerType, Order, PaymentMethod, Product } from "@/types";
import { createOrder } from "@/lib/actions/orders";

export function isProductAvailable(product: Product, stock?: number): boolean {
  if (!product.available) return false;
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

export function completePosSale(input: PosSaleInput): Promise<Order> {
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
