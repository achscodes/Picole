import { AdminStaffManagementClient } from "@/components/admin/AdminStaffManagementClient";
import { listStaffAccounts } from "@/lib/auth";

export default async function AdminStaffManagementPage() {
  const staff = await listStaffAccounts();
  return <AdminStaffManagementClient initialStaff={staff} />;
}
