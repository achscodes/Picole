import type { CustomerType } from "@/types";

export const PWD_SENIOR_DISCOUNT_RATE = 0.2;

/** Pure, client-safe cart math used for the optimistic checkout preview. The
 * authoritative totals are always recomputed server-side by the
 * `create_pos_order` RPC (see src/lib/actions/orders.ts). */
export function calcDiscount(subtotal: number, customerType: CustomerType) {
  if (customerType === "regular") {
    return { discountRate: 0, discountAmount: 0, total: subtotal };
  }
  const discountAmount = Math.round(subtotal * PWD_SENIOR_DISCOUNT_RATE);
  return {
    discountRate: PWD_SENIOR_DISCOUNT_RATE,
    discountAmount,
    total: subtotal - discountAmount,
  };
}

export function calcExpectedChange(cashReceived: number, total: number) {
  return Math.max(0, cashReceived - total);
}

export function needsDiscountVerification(customerType: CustomerType) {
  return customerType === "pwd" || customerType === "senior";
}
