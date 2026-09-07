import { DEFAULT_PRODUCTS } from "@/data/catalog";
import { calcDiscount, calcExpectedChange } from "@/lib/orders";
import type {
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
} from "@/lib/inventory";
import type { CustomerType, Order, OrderItem, PaymentMethod } from "@/types";

const HISTORY_DAYS = 14;
const STAFF_NAMES = ["Maria Santos", "Juan Dela Cruz", "Angela Reyes", "Mark Villanueva"];
const PICKUP_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Liza",
  "Miguel", "Sofia", "Andres", "Carmen", "Paolo", "Grace", "Ramon", "Ella",
  "Kevin", "Nadine", "Ferdie", "Trisha",
];
const BILL_DENOMINATIONS = [20, 50, 100, 200, 500, 1000];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/** Best sellers show up ~3x more often than the rest of the menu. */
function weightedProductPool() {
  const pool: string[] = [];
  for (const p of DEFAULT_PRODUCTS) {
    pool.push(p.id);
    if (p.bestSeller) pool.push(p.id, p.id);
  }
  return pool;
}

function randomCartItems(pool: string[]): OrderItem[] {
  const chosen = new Map<string, number>();
  const itemCount = randInt(1, 3);
  for (let i = 0; i < itemCount; i++) {
    const productId = pick(pool);
    chosen.set(productId, (chosen.get(productId) ?? 0) + randInt(1, 3));
  }
  return Array.from(chosen.entries())
    .map(([productId, quantity]) => {
      const product = DEFAULT_PRODUCTS.find((p) => p.id === productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
      };
    })
    .filter((x): x is OrderItem => Boolean(x));
}

function randomCustomerType(): CustomerType {
  const r = Math.random();
  if (r < 0.08) return "pwd";
  if (r < 0.16) return "senior";
  return "regular";
}

function randomPaymentMethod(): PaymentMethod {
  return Math.random() < 0.6 ? "cash" : "ewallet";
}

function roundUpToBill(amount: number) {
  for (const bill of BILL_DENOMINATIONS) {
    if (bill >= amount) return bill;
  }
  return Math.ceil(amount / 100) * 100 + 100;
}

/** Fri–Sun run busier than midweek. */
function ordersForDay(dayOfWeek: number) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
  return isWeekend ? randInt(8, 15) : randInt(4, 9);
}

interface GeneratedData {
  orders: Order[];
  inventoryMap: Record<string, InventoryItem>;
  movements: InventoryMovement[];
}

export function generateDemoData(): GeneratedData {
  const pool = weightedProductPool();
  const now = new Date();

  const stock: Record<string, number> = {};
  const lastUpdatedAt: Record<string, string> = {};
  for (const p of DEFAULT_PRODUCTS) stock[p.id] = randInt(40, 70);

  const movements: InventoryMovement[] = [];
  const orders: Order[] = [];
  let orderCounter = 1000;

  function recordMovement(
    productId: string,
    movementType: InventoryMovementType,
    delta: number,
    reason: string,
    at: Date,
    orderId?: string,
  ) {
    const previousStock = stock[productId];
    const newStock = Math.max(0, previousStock + delta);
    stock[productId] = newStock;
    const createdAt = at.toISOString();
    lastUpdatedAt[productId] = createdAt;
    movements.push({
      id: crypto.randomUUID(),
      productId,
      userId: "seed",
      userName: pick(STAFF_NAMES),
      movementType,
      quantity: newStock - previousStock,
      previousStock,
      newStock,
      reason,
      orderId,
      createdAt,
    });
  }

  for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    day.setHours(0, 0, 0, 0);
    const isToday = dayOffset === 0;

    // Weekly restock, most Mondays.
    if (day.getDay() === 1) {
      const restockTime = new Date(day);
      restockTime.setHours(7, 30, 0, 0);
      for (const p of DEFAULT_PRODUCTS) {
        if (Math.random() < 0.7) {
          recordMovement(p.id, "added", randInt(20, 40), "Weekly restock", restockTime);
        }
      }
    }

    // Occasional spoilage/damage, a few times a month.
    if (Math.random() < 0.15) {
      const product = pick(DEFAULT_PRODUCTS);
      const wasteTime = new Date(day);
      wasteTime.setHours(randInt(9, 18), randInt(0, 59), 0, 0);
      recordMovement(
        product.id,
        Math.random() < 0.5 ? "damaged" : "expired",
        -randInt(1, 4),
        Math.random() < 0.5 ? "Freezer malfunction" : "Past shelf life",
        wasteTime,
      );
    }

    const count = ordersForDay(day.getDay());
    for (let i = 0; i < count; i++) {
      const hour = isToday ? randInt(8, Math.max(8, now.getHours())) : randInt(8, 20);
      const orderTime = new Date(day);
      orderTime.setHours(hour, randInt(0, 59), randInt(0, 59), 0);
      if (orderTime > now) continue;

      const items = randomCartItems(pool);
      if (items.length === 0) continue;

      const subtotalBeforeDiscount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const customerType = randomCustomerType();
      const { discountRate, discountAmount, total } = calcDiscount(
        subtotalBeforeDiscount,
        customerType,
      );
      const paymentMethod = randomPaymentMethod();
      const cashReceived = paymentMethod === "cash" ? roundUpToBill(total) : undefined;

      orderCounter += 1;
      const orderId = crypto.randomUUID();
      const iso = orderTime.toISOString();

      orders.push({
        id: orderId,
        orderNumber: `PCL-${orderCounter}`,
        items,
        totalAmount: total,
        paymentMethod,
        paymentStatus: "verified",
        orderStatus: "completed",
        pickupName: Math.random() < 0.7 ? pick(PICKUP_NAMES) : undefined,
        cashReceived,
        expectedChange:
          cashReceived != null ? calcExpectedChange(cashReceived, total) : undefined,
        ewalletProvider: paymentMethod === "ewallet" ? pick(["GCash", "Maya"]) : undefined,
        customerType,
        subtotalBeforeDiscount,
        discountStatus: customerType === "regular" ? "none" : "verified",
        discountIdNumber:
          customerType === "regular"
            ? undefined
            : `${customerType.toUpperCase()}-${randInt(1000, 9999)}`,
        discountRate: discountRate || undefined,
        discountAmount: discountAmount || undefined,
        createdAt: iso,
        updatedAt: iso,
      });

      for (const item of items) {
        recordMovement(item.productId, "sale", -item.quantity, "POS Sale", orderTime, orderId);
      }
    }
  }

  const nowIso = now.toISOString();
  const inventoryMap: Record<string, InventoryItem> = {};
  for (const p of DEFAULT_PRODUCTS) {
    inventoryMap[p.id] = {
      productId: p.id,
      stock: stock[p.id],
      alertAt: 10,
      updatedAt: lastUpdatedAt[p.id] ?? nowIso,
    };
  }

  orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  movements.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return { orders, inventoryMap, movements };
}
