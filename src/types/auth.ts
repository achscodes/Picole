export type UserRole = "admin" | "staff";

export type StaffStatus = "pending" | "approved" | "rejected";

export interface StaffAccount {
  id: string;
  email: string;
  name: string;
  role: "staff";
  status: StaffStatus;
  createdAt: string;
}

export interface Session {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}
