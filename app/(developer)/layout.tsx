import { DeveloperSidebar } from "@/components/layout/developer-sidebar";

interface DeveloperLayoutProps {
  children: React.ReactNode;
}

export default function DeveloperLayout({ children }: DeveloperLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <DeveloperSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
