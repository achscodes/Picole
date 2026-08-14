import { OrderStatusClient } from "@/components/customer/OrderStatusClient";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderStatusClient orderId={id} />;
}
