import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { MenuClient } from "@/components/customer/MenuClient";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-[var(--cream)]">
      <CustomerHeader active="menu" />
      <MenuClient />
    </div>
  );
}
