import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MikroTik Hotspot Management System",
  description: "Comprehensive hotspot management system for MikroTik routers with user management, voucher generation, and session monitoring.",
  keywords: ["MikroTik", "Hotspot", "Management", "WiFi", "Router", "Network"],
  authors: [{ name: "Hotspot Management Team" }],
  openGraph: {
    title: "MikroTik Hotspot Management System",
    description: "Comprehensive hotspot management system for MikroTik routers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MikroTik Hotspot Management System",
    description: "Comprehensive hotspot management system for MikroTik routers",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
