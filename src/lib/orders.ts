import type {
  CartItem,
  CustomerType,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "@/types";
import { getProductById } from "@/lib/product-store";
import { deductStockForSale, getInventoryItem } from "@/lib/inventory";

const ORDERS_KEY = "picole.orders.v1";
const AVAILABILITY_KEY = "picole.availability.v1";

export const PWD_SENIOR_DISCOUNT_RATE = 0.2;

function canUseStorage() {
  return typeof window !== "undefined";
}

function readOrders(): Order[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getAvailabilityOverrides(): Record<string, boolean> {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(AVAILABILITY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function setProductAvailability(productId: string, available: boolean) {
  const map = getAvailabilityOverrides();
  map[productId] = available;
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(map));
}

export function buildOrderItems(cart: CartItem[]): OrderItem[] {
  return cart
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: product.price * item.quantity,
      };
    })
    .filter((x): x is OrderItem => Boolean(x));
}

export function calcCartSubtotal(cart: CartItem[]) {
  return buildOrderItems(cart).reduce((sum, item) => sum + item.subtotal, 0);
}

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

export function calcCartTotal(
  cart: CartItem[],
  customerType: CustomerType = "regular",
) {
  const subtotal = calcCartSubtotal(cart);
  return calcDiscount(subtotal, customerType).total;
}

export function calcExpectedChange(cashReceived: number, total: number) {
  return Math.max(0, cashReceived - total);
}

function nextOrderNumber(existing: Order[]) {
  const max = existing.reduce((acc, order) => {
    const n = Number(order.orderNumber.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 1000);
  return `PCL-${max + 1}`;
}

function assertStockAvailable(cart: CartItem[]) {
  for (const item of cart) {
    const product = getProductById(item.productId);
    if (!product) {
      throw new Error("A product in your cart is no longer available.");
    }
    const inv = getInventoryItem(item.productId);
    if (inv && inv.stock < item.quantity) {
      throw new Error(
        `Not enough stock for ${product.name}. Only ${inv.stock} left.`,
      );
    }
  }
}

export function needsDiscountVerification(customerType: CustomerType) {
  return customerType === "pwd" || customerType === "senior";
}

export interface CreateOrderInput {
  cart: CartItem[];
  paymentMethod: PaymentMethod;
  pickupName?: string;
  cashReceived?: number;
  ewalletProvider?: string;
  customerType?: CustomerType;
  discountIdNumber?: string;
}

/**
 * Creates a POS sale. Every check below (stock, cash, discount ID) runs before
 * anything is written to storage or deducted from inventory, and the order is
 * persisted already "completed" in one step — so a failed sale can never leave
 * a stock deduction or an orphaned pending order behind.
 */
export function createOrder(input: CreateOrderInput): Order {
  const items = buildOrderItems(input.cart);
  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  assertStockAvailable(input.cart);

  const customerType = input.customerType ?? "regular";
  const subtotalBeforeDiscount = items.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  const pendingDiscount = needsDiscountVerification(customerType);

  if (pendingDiscount && input.paymentMethod !== "cash") {
    throw new Error(
      "PWD and Senior Citizen orders must pay with cash so staff can verify ID first.",
    );
  }

  let discountIdNumber: string | undefined;
  if (pendingDiscount) {
    discountIdNumber = input.discountIdNumber?.trim();
    if (!discountIdNumber) {
      throw new Error("Please enter the customer's ID number.");
    }
  }

  const { discountRate, discountAmount, total: discountedTotal } = calcDiscount(
    subtotalBeforeDiscount,
    customerType,
  );
  const totalAmount = discountedTotal;

  // Cashiers collect cash against the full pre-discount total — the discount
  // is only confirmed once the ID above checks out, and change is calculated
  // against the discounted total below.
  const cashCheckTotal = pendingDiscount ? subtotalBeforeDiscount : totalAmount;
  if (input.paymentMethod === "cash") {
    const cash = input.cashReceived ?? cashCheckTotal;
    if (cash < cashCheckTotal) {
      throw new Error(
        "The cash amount entered is less than your order total. Please enter a sufficient amount.",
      );
    }
  }

  const now = new Date().toISOString();
  const existing = readOrders();
  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: nextOrderNumber(existing),
    items,
    totalAmount,
    paymentMethod: input.paymentMethod,
    paymentStatus: "verified",
    orderStatus: "completed",
    pickupName: input.pickupName?.trim() || undefined,
    cashReceived:
      input.paymentMethod === "cash"
        ? (input.cashReceived ?? cashCheckTotal)
        : undefined,
    expectedChange:
      input.paymentMethod === "cash"
        ? calcExpectedChange(input.cashReceived ?? cashCheckTotal, totalAmount)
        : undefined,
    ewalletProvider:
      input.paymentMethod === "ewallet"
        ? (input.ewalletProvider ?? "GCash")
        : undefined,
    customerType,
    subtotalBeforeDiscount,
    discountStatus: pendingDiscount ? "verified" : "none",
    discountIdNumber,
    discountRate: discountRate || undefined,
    discountAmount: discountAmount || undefined,
    createdAt: now,
    updatedAt: now,
  };

  // Deduct stock and record the sale movement last, once the order is
  // otherwise guaranteed to persist — never before a sale actually completes.
  deductStockForSale(
    items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    order.id,
  );

  writeOrders([order, ...existing]);
  return order;
}

export function listOrders() {
  return readOrders().sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export function getOrderById(id: string) {
  return readOrders().find((o) => o.id === id || o.orderNumber === id);
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  orders[idx] = {
    ...orders[idx],
    orderStatus: status,
    updatedAt: new Date().toISOString(),
    paymentStatus:
      status === "confirmed" ||
      status === "preparing" ||
      status === "ready" ||
      status === "completed"
        ? "verified"
        : orders[idx].paymentStatus,
  };
  writeOrders(orders);
  return orders[idx];
}

export function verifyOrderDiscount(
  id: string,
  idNumber: string,
): { ok: true; order: Order } | { ok: false; error: string } {
  const trimmedId = idNumber.trim();
  if (!trimmedId) {
    return { ok: false, error: "Please enter the customer's ID number." };
  }

  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) {
    return { ok: false, error: "Order not found." };
  }

  const order = orders[idx];
  if (order.discountStatus !== "pending") {
    return { ok: false, error: "This order has no pending discount to verify." };
  }

  const subtotal =
    order.subtotalBeforeDiscount ??
    order.totalAmount + (order.discountAmount ?? 0);
  const customerType = order.customerType ?? "regular";
  const { discountRate, discountAmount, total } = calcDiscount(
    subtotal,
    customerType,
  );

  orders[idx] = {
    ...order,
    discountStatus: "verified",
    discountIdNumber: trimmedId,
    discountRate,
    discountAmount,
    totalAmount: total,
    expectedChange:
      order.cashReceived != null
        ? calcExpectedChange(order.cashReceived, total)
        : order.expectedChange,
    updatedAt: new Date().toISOString(),
  };

  writeOrders(orders);
  return { ok: true, order: orders[idx] };
}

export function resetDemoOrders() {
  writeOrders([]);
}