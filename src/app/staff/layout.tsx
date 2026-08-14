import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell role="staff">{children}</DashboardShell>;
}
