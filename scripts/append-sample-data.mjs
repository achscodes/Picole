// One-off/dev utility: appends another 14-day batch of realistic sample POS
// data (orders, order items, inventory movements) on top of whatever is
// already in the database. Unlike scripts/seed-sample-data.mjs, this never
// deletes existing rows - it starts stock counters from the current
// inventory levels and layers new orders/movements on top.
//
// Usage:
//   node --env-file=.env.local scripts/append-sample-data.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - pass --env-file=.env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- generation (mirrors src/lib/seed.ts::generateDemoData, but seeded
// from real current stock instead of a random 40-70 baseline) ----

const HISTORY_DAYS = 14;
const STAFF_NAMES = ["Maria Santos", "Juan Dela Cruz", "Angela Reyes", "Mark Villanueva"];
const PICKUP_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Liza",
  "Miguel", "Sofia", "Andres", "Carmen", "Paolo", "Grace", "Ramon", "Ella",
  "Kevin", "Nadine", "Ferdie", "Trisha",
];
const BILL_DENOMINATIONS = [20, 50, 100, 200, 500, 1000];
const PWD_SENIOR_DISCOUNT_RATE = 0.2;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function calcDiscount(subtotal, customerType) {
  if (customerType === "regular") return { discountRate: 0, discountAmount: 0, total: subtotal };
  const discountAmount = Math.round(subtotal * PWD_SENIOR_DISCOUNT_RATE);
  return { discountRate: PWD_SENIOR_DISCOUNT_RATE, discountAmount, total: subtotal - discountAmount };
}
function calcExpectedChange(cashReceived, total) {
  return Math.max(0, cashReceived - total);
}
function weightedProductPool(products) {
  const pool = [];
  for (const p of products) {
    pool.push(p.id);
    if (p.best_seller) pool.push(p.id, p.id);
  }
  return pool;
}
function randomCartItems(pool, productById) {
  const chosen = new Map();
  const itemCount = randInt(1, 3);
  for (let i = 0; i < itemCount; i++) {
    const productId = pick(pool);
    chosen.set(productId, (chosen.get(productId) ?? 0) + randInt(1, 3));
  }
  return Array.from(chosen.entries())
    .map(([productId, quantity]) => {
      const product = productById.get(productId);
      if (!product) return null;
      return { productId: product.id, name: product.name, quantity, unitPrice: product.price, subtotal: product.price * quantity };
    })
    .filter(Boolean);
}
function randomCustomerType() {
  const r = Math.random();
  if (r < 0.08) return "pwd";
  if (r < 0.16) return "senior";
  return "regular";
}
function randomPaymentMethod() {
  return Math.random() < 0.6 ? "cash" : "ewallet";
}
function roundUpToBill(amount) {
  for (const bill of BILL_DENOMINATIONS) {
    if (bill >= amount) return bill;
  }
  return Math.ceil(amount / 100) * 100 + 100;
}
function ordersForDay(dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
  return isWeekend ? randInt(8, 15) : randInt(4, 9);
}

function generateDemoData(products, startingStock) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const pool = weightedProductPool(products);
  const now = new Date();

  const stock = { ...startingStock };
  const lastUpdatedAt = {};

  const movements = [];
  const orders = [];

  function recordMovement(productId, movementType, delta, reason, at, orderId) {
    const previousStock = stock[productId];
    const newStock = Math.max(0, previousStock + delta);
    stock[productId] = newStock;
    const createdAt = at.toISOString();
    lastUpdatedAt[productId] = createdAt;
    movements.push({
      productId, userName: pick(STAFF_NAMES), movementType,
      quantity: newStock - previousStock, previousStock, newStock, reason, orderId, createdAt,
    });
  }

  for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    day.setHours(0, 0, 0, 0);
    const isToday = dayOffset === 0;

    if (day.getDay() === 1) {
      const restockTime = new Date(day);
      restockTime.setHours(7, 30, 0, 0);
      for (const p of products) {
        if (Math.random() < 0.7) recordMovement(p.id, "added", randInt(20, 40), "Weekly restock", restockTime);
      }
    }

    if (Math.random() < 0.15) {
      const product = pick(products);
      const wasteTime = new Date(day);
      wasteTime.setHours(randInt(9, 18), randInt(0, 59), 0, 0);
      recordMovement(product.id, Math.random() < 0.5 ? "damaged" : "expired", -randInt(1, 4),
        Math.random() < 0.5 ? "Freezer malfunction" : "Past shelf life", wasteTime);
    }

    const count = ordersForDay(day.getDay());
    for (let i = 0; i < count; i++) {
      const hour = isToday ? randInt(8, Math.max(8, now.getHours())) : randInt(8, 20);
      const orderTime = new Date(day);
      orderTime.setHours(hour, randInt(0, 59), randInt(0, 59), 0);
      if (orderTime > now) continue;

      const items = randomCartItems(pool, productById);
      if (items.length === 0) continue;

      const subtotalBeforeDiscount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const customerType = randomCustomerType();
      const { discountRate, discountAmount, total } = calcDiscount(subtotalBeforeDiscount, customerType);
      const paymentMethod = randomPaymentMethod();
      const cashReceived = paymentMethod === "cash" ? roundUpToBill(total) : undefined;

      const orderId = crypto.randomUUID();
      const iso = orderTime.toISOString();

      orders.push({
        id: orderId, items, totalAmount: total, paymentMethod,
        paymentStatus: "verified", orderStatus: "completed",
        pickupName: Math.random() < 0.7 ? pick(PICKUP_NAMES) : undefined,
        cashReceived,
        expectedChange: cashReceived != null ? calcExpectedChange(cashReceived, total) : undefined,
        ewalletProvider: paymentMethod === "ewallet" ? pick(["GCash", "Maya"]) : undefined,
        customerType, subtotalBeforeDiscount,
        discountStatus: customerType === "regular" ? "none" : "verified",
        discountIdNumber: customerType === "regular" ? undefined : `${customerType.toUpperCase()}-${randInt(1000, 9999)}`,
        discountRate: discountRate || undefined,
        discountAmount: discountAmount || undefined,
        createdAt: iso, updatedAt: iso,
      });

      for (const item of items) {
        recordMovement(item.productId, "sale", -item.quantity, "POS Sale", orderTime, orderId);
      }
    }
  }

  const nowIso = now.toISOString();
  const inventoryMap = {};
  for (const p of products) {
    inventoryMap[p.id] = { productId: p.id, stock: stock[p.id], updatedAt: lastUpdatedAt[p.id] ?? nowIso };
  }

  return { orders, inventoryMap, movements };
}

// ---- write path (mirrors src/lib/actions/settings.ts::seedDemoData, minus
// the delete step - this only ever adds rows) ----

const { data: products, error: productsError } = await supabase
  .from("products")
  .select("id, name, price, best_seller")
  .is("deleted_at", null);
if (productsError) throw productsError;
if (!products.length) {
  console.error("No products found - run the migrations first.");
  process.exit(1);
}

const { data: inventoryRows, error: inventoryError } = await supabase
  .from("inventory")
  .select("product_id, stock");
if (inventoryError) throw inventoryError;

const startingStock = {};
for (const row of inventoryRows) startingStock[row.product_id] = row.stock;
for (const p of products) if (startingStock[p.id] == null) startingStock[p.id] = 50;

const { orders, inventoryMap, movements } = generateDemoData(products, startingStock);

console.log(`Generated ${orders.length} additional orders and ${movements.length} additional inventory movements. Writing (no existing rows are deleted)...`);

const chronological = [...orders].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

for (const order of chronological) {
  const { error } = await supabase.from("orders").insert({
    id: order.id,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    pickup_name: order.pickupName ?? null,
    cash_received: order.cashReceived ?? null,
    expected_change: order.expectedChange ?? null,
    ewallet_provider: order.ewalletProvider ?? null,
    customer_type: order.customerType ?? "regular",
    subtotal_before_discount: order.subtotalBeforeDiscount ?? null,
    discount_rate: order.discountRate ?? null,
    discount_amount: order.discountAmount ?? null,
    discount_status: order.discountStatus ?? "none",
    discount_id_number: order.discountIdNumber ?? null,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  });
  if (error) throw error;

  if (order.items.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      order.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      })),
    );
    if (itemsError) throw itemsError;
  }
}

for (const item of Object.values(inventoryMap)) {
  const { error } = await supabase
    .from("inventory")
    .update({ stock: item.stock, updated_at: item.updatedAt })
    .eq("product_id", item.productId);
  if (error) throw error;
}

if (movements.length > 0) {
  const { error } = await supabase.from("inventory_movements").insert(
    movements.map((m) => ({
      product_id: m.productId,
      user_id: null,
      user_name: m.userName,
      movement_type: m.movementType,
      quantity: m.quantity,
      previous_stock: m.previousStock,
      new_stock: m.newStock,
      reason: m.reason,
      order_id: m.orderId ?? null,
      created_at: m.createdAt,
    })),
  );
  if (error) throw error;
}

console.log("Done.");
