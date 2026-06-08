"use client";

import { MobileSidebar } from "@/components/layout/sidebar";

interface WalletHeaderProps {
  title: string;
}

export function WalletHeader({ title }: WalletHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <MobileSidebar />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
    </header>
  );
}
