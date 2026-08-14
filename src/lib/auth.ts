import type { Session, StaffAccount, StaffStatus } from "@/types/auth";

const STAFF_KEY = "picole.staff.v1";
const SESSION_KEY = "picole.session.v1";

const DEMO_ADMIN = {
  id: "admin-demo",
  email: "admin@picole.com",
  password: "admin123",
  name: "Admin",
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function readStaff(): StaffAccount[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    return raw ? (JSON.parse(raw) as StaffAccount[]) : [];
  } catch {
    return [];
  }
}

function writeStaff(staff: StaffAccount[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

export function getSession(): Session | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setSession(session: Session | null) {
  if (!canUseStorage()) return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function login(
  email: string,
  password: string,
): { ok: true; session: Session } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();

  if (
    normalized === DEMO_ADMIN.email &&
    password === DEMO_ADMIN.password
  ) {
    const session: Session = {
      userId: DEMO_ADMIN.id,
      email: DEMO_ADMIN.email,
      role: "admin",
      name: DEMO_ADMIN.name,
    };
    setSession(session);
    return { ok: true, session };
  }

  const staff = readStaff().find((s) => s.email === normalized);
  if (!staff || staff.password !== password) {
    return { ok: false, error: "Invalid email or password." };
  }
  if (staff.status === "pending") {
    return {
      ok: false,
      error: "Your account is pending admin approval.",
    };
  }
  if (staff.status === "rejected") {
    return { ok: false, error: "Your account was not approved." };
  }

  const session: Session = {
    userId: staff.id,
    email: staff.email,
    role: "staff",
    name: staff.name,
  };
  setSession(session);
  return { ok: true, session };
}

export function registerStaff(
  email: string,
  password: string,
  name: string,
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password || !name.trim()) {
    return { ok: false, error: "All fields are required." };
  }
  if (normalized === DEMO_ADMIN.email) {
    return { ok: false, error: "This email is already registered." };
  }

  const staff = readStaff();
  if (staff.some((s) => s.email === normalized)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  staff.push({
    id: crypto.randomUUID(),
    email: normalized,
    password,
    name: name.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  writeStaff(staff);
  return { ok: true };
}

export function logout() {
  setSession(null);
}

export function listStaffAccounts(status?: StaffStatus) {
  const staff = readStaff().sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  return status ? staff.filter((s) => s.status === status) : staff;
}

export function updateStaffStatus(id: string, status: StaffStatus) {
  const staff = readStaff();
  const idx = staff.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  staff[idx] = { ...staff[idx], status };
  writeStaff(staff);
  return staff[idx];
}

export function deleteStaffAccount(id: string) {
  writeStaff(readStaff().filter((s) => s.id !== id));
}
