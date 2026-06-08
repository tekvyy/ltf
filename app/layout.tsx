import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider, AuthGuard } from "@/components/auth";
import { XrplWalletProvider } from "@/lib/xrpl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Distinctive optical serif used for display headings and large monetary figures.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Credelit — Real-estate debt, tokenized",
  description:
    "Credelit connects developers and lenders for transparent, on-chain real-estate financing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        <AuthProvider>
          <XrplWalletProvider>
            <AuthGuard>{children}</AuthGuard>
          </XrplWalletProvider>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
