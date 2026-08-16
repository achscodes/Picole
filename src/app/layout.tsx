import type { Metadata, Viewport } from "next";
import { Nunito, Outfit } from "next/font/google";
import "./globals.css";

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Picolé Healthy Ice Pops | Staff Portal",
  description:
    "Internal point-of-sale and business management system for Picolé Healthy Ice Pops staff.",
  applicationName: "Picolé POS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3D9168",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
