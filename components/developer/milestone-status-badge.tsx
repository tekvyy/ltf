"use client";

import { cn } from "@/lib/utils";
import { MilestoneStatus } from "@/lib/types/developer";

interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  className?: string;
}

const statusConfig: Record<MilestoneStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-muted text-foreground",
  },
  proof_submitted: {
    label: "Awaiting Review",
    className: "bg-amber-100 text-amber-700",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-700",
  },
};

export function MilestoneStatusBadge({ status, className }: MilestoneStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
