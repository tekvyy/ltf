"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { navigationConfig } from "@/config/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth";

function NavGroup({
  items,
  onItemClick,
}: {
  items: (typeof navigationConfig)[0]["items"];
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-foreground/[0.04] hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all",
                isActive ? "opacity-100" : "opacity-0"
              )}
            />
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-sidebar-foreground/70 group-hover:text-foreground"
              )}
            />
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}

function UserProfile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = (user?.name || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-card/60 px-3 py-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
        {initials}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {user?.name || "User"}
        </span>
        <span className="truncate text-xs capitalize text-muted-foreground">
          {user?.type || "Lender"}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground cursor-pointer"
        aria-label="Log out"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function SidebarInner() {
  return (
    <>
      <div className="px-2 pb-6 pt-1">
        <Logo showText />
      </div>

      <div className="px-1 pb-2">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Menu
        </p>
        <nav>
          <NavGroup items={navigationConfig[0].items} />
        </nav>
      </div>

      <div className="mt-auto px-1">
        <div className="border-t border-sidebar-border pt-2">
          <NavGroup items={navigationConfig[1].items} />
        </div>
        <div className="mt-3">
          <UserProfile />
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
      <SidebarInner />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-64 flex-col border-sidebar-border bg-sidebar px-3 py-5"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div onClick={() => setOpen(false)} className="contents">
          <SidebarInner />
        </div>
      </SheetContent>
    </Sheet>
  );
}
