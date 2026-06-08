import { Wallet, FileText, CheckCircle2 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  hint?: string;
}

function StatCard({ title, value, icon, accent = false, hint }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-elevated transition-shadow hover:shadow-elevated-lg">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span
          className={
            "flex h-9 w-9 items-center justify-center rounded-lg " +
            (accent ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")
          }
        >
          {icon}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span
          className={
            "tnum text-3xl font-semibold tracking-tight " +
            (accent ? "text-primary" : "text-foreground")
          }
        >
          {value}
        </span>
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {accent && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/60 to-primary/0" />
      )}
    </div>
  );
}

interface StatsCardsProps {
  totalBalance: number;
  submittedBids: number;
  approvedLoans: number;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function StatsCards({
  totalBalance,
  submittedBids,
  approvedLoans,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total balance"
        value={usd(totalBalance)}
        icon={<Wallet className="h-[18px] w-[18px]" />}
        hint="Across active loans"
      />
      <StatCard
        title="Submitted bids"
        value={submittedBids}
        icon={<FileText className="h-[18px] w-[18px]" />}
        hint="Awaiting developer review"
      />
      <StatCard
        title="Approved loans"
        value={approvedLoans}
        icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
        accent
        hint="Funded & executed"
      />
    </div>
  );
}
