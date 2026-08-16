import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAFF_ALLOWED_PATHS = [
  "/staff",
  "/staff/pos",
  "/staff/transactions",
  "/staff/products",
  "/staff/availability",
  "/staff/inventory",
];

const RETIRED_CUSTOMER_PATHS = ["/cart", "/checkout", "/order", "/confirmation"];
const RETIRED_ADMIN_PATHS = ["/admin/orders", "/staff/orders"];
const RETIRED_INVENTORY_ROLE_PATHS = ["/inventory"];

function roleHomePath(role: string | undefined) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/login";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("picole_role")?.value;

  if (
    pathname === "/" ||
    RETIRED_CUSTOMER_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ) ||
    RETIRED_ADMIN_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ) ||
    RETIRED_INVENTORY_ROLE_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return NextResponse.redirect(new URL(roleHomePath(role), request.url));
  }

  if (pathname === "/login") {
    if (role === "admin" || role === "staff") {
      return NextResponse.redirect(new URL(roleHomePath(role), request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL(roleHomePath(role), request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/staff")) {
    if (role !== "staff") {
      return NextResponse.redirect(new URL(roleHomePath(role), request.url));
    }
    const isAllowed = STAFF_ALLOWED_PATHS.some(
      (path) =>
        pathname === path ||
        (path !== "/staff" && pathname.startsWith(`${path}/`)),
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/staff/:path*",
    "/inventory/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/order/:path*",
    "/confirmation/:path*",
  ],
};
