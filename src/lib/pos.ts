import type { CartItem, CustomerType, Order, PaymentMethod, Product } from "@/types";
import { submitPosSale } from "@/lib/actions/orders";
import { calcDiscount } from "@/lib/orders";
import { classifyThrown } from "@/lib/offline/classify-error";
import { enqueueSale, getActiveSession } from "@/lib/offline/sync-engine";
import type { PendingSaleSnapshotItem } from "@/lib/offline/types";

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

export type PosSaleOutcome =
  | { status: "confirmed"; order: Order }
  | { status: "queued"; clientOrderId: string };

/**
 * Always mints a clientOrderId so a slow-connection double-tap of "Complete
 * Sale" can never create a duplicate order - create_pos_order recognizes
 * the replay and returns the existing order instead (see
 * supabase/migrations/0009_pos_order_idempotency.sql). If the request can't
 * reach the server at all, the sale is queued locally instead of failing
 * outright - see src/lib/offline/sync-engine.ts. A server-confirmed
 * rejection (bad input, expired session, no stock) is never queued - the
 * cashier needs to see and act on that immediately.
 */
export async function completePosSale(
  input: PosSaleInput,
  getProduct: (productId: string) => Product | undefined,
): Promise<PosSaleOutcome> {
  const clientOrderId = crypto.randomUUID();
  const rpcInput = {
    cart: input.cart,
    paymentMethod: input.paymentMethod,
    pickupName: input.pickupName,
    cashReceived: input.cashReceived,
    customerType: input.customerType,
    discountIdNumber: input.discountIdNumber,
    ewalletProvider: input.paymentMethod === "ewallet" ? "GCash" : undefined,
    clientOrderId,
  };

  let result;
  try {
    result = await submitPosSale(rpcInput);
  } catch (err) {
    if (classifyThrown(err) !== "network") throw err;

    const session = getActiveSession();
    if (!session) throw err;

    const snapshotItems: PendingSaleSnapshotItem[] = input.cart.map((item) => {
      const product = getProduct(item.productId);
      return {
        productId: item.productId,
        name: product?.name ?? item.productId,
        unitPrice: product?.price ?? 0,
        quantity: item.quantity,
      };
    });
    const subtotal = snapshotItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const { total } = calcDiscount(subtotal, input.customerType ?? "regular");

    const queuedClientOrderId = await enqueueSale({
      input: rpcInput,
      session,
      clientSnapshot: { subtotal, total, items: snapshotItems },
    });
    return { status: "queued", clientOrderId: queuedClientOrderId };
  }

  if (result.ok) return { status: "confirmed", order: result.order };
  throw new Error(result.message);
}
