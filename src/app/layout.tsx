import type { Metadata, Viewport } from "next";
import { Nunito, Outfit } from "next/font/google";
import { Providers } from "@/components/Providers";
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
  title: "Picolé Healthy Ice Pops | Order",
  description:
    "Scan, browse, and order Picolé Healthy Ice Pops for stall pickup.",
  applicationName: "Picolé Order",
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
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
