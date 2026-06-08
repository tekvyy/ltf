"use client";

import { DeveloperMobileSidebar } from "@/components/layout/developer-sidebar";

interface DeveloperHeaderProps {
  title: string;
}

export function DeveloperHeader({ title }: DeveloperHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <DeveloperMobileSidebar />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      </div>
    </header>
  );
}
