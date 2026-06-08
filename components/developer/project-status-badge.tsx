"use client";

import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/lib/types/developer";

// Re-export for backwards compatibility
export type { ProjectStatus };

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-foreground",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-700",
  },
  under_review: {
    label: "Under Review",
    className: "bg-yellow-100 text-yellow-700",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
  funded: {
    label: "Funded",
    className: "bg-purple-100 text-purple-700",
  },
  completed: {
    label: "Completed",
    className: "bg-teal-100 text-teal-700",
  },
};

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || status,
    className: "bg-muted text-foreground",
  };

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
