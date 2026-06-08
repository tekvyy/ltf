import { Wallet, FileText, CheckCircle2 } from "lucide-react";

interface Metric {
  title: string;
  value: string;
  icon: React.ReactNode;
  hint: string;
  accent?: boolean;
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
  const metrics: Metric[] = [
    {
      title: "Total balance",
      value: usd(totalBalance),
      icon: <Wallet className="h-[18px] w-[18px]" />,
      hint: "Across active loans",
      accent: true,
    },
    {
      title: "Submitted bids",
      value: String(submittedBids),
      icon: <FileText className="h-[18px] w-[18px]" />,
      hint: "Awaiting developer review",
    },
    {
      title: "Approved loans",
      value: String(approvedLoans),
      icon: <CheckCircle2 className="h-[18px] w-[18px]" />,
      hint: "Funded & executed",
    },
  ];

  return (
    <div className="grain relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-elevated">
      {/* Atmosphere */}
      <div className="glow-coral pointer-events-none absolute inset-x-0 top-0 h-40" />

      <div className="relative grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {metrics.map((m) => (
          <div key={m.title} className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{m.title}</span>
              <span
                className={
                  "flex h-9 w-9 items-center justify-center rounded-lg " +
                  (m.accent ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")
                }
              >
                {m.icon}
              </span>
            </div>
            <div>
              <p
                className={
                  "text-display tnum text-4xl font-semibold leading-none " +
                  (m.accent ? "text-primary" : "text-foreground")
                }
              >
                {m.value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{m.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
