import { ConfirmationClient } from "@/components/customer/ConfirmationClient";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConfirmationClient orderId={id} />;
}
