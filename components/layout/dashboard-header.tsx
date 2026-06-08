"use client";

import { MobileSidebar } from "./sidebar";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <MobileSidebar />
        <div>
          <h1 className="text-display text-[30px] font-semibold leading-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
