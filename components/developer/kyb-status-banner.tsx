"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type KybStatus = "not_started" | "pending" | "under_review" | "approved" | "rejected";

interface KybStatusBannerProps {
  status: KybStatus;
  rejectionReason?: string;
}

const statusConfig = {
  not_started: {
    icon: AlertCircle,
    title: "Complete Your Business Verification",
    description: "You need to complete KYB (Know Your Business) verification before you can submit projects.",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconColor: "text-amber-500",
    showCta: true,
    ctaText: "Start Verification",
  },
  pending: {
    icon: Clock,
    title: "KYB Documents Submitted",
    description: "Your documents have been submitted and are waiting to be reviewed. This usually takes 1-2 business days.",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    showCta: false,
    ctaText: "",
  },
  under_review: {
    icon: Clock,
    title: "KYB Under Review",
    description: "Our team is currently reviewing your business documents. You'll be notified once the review is complete.",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    showCta: false,
    ctaText: "",
  },
  approved: {
    icon: CheckCircle2,
    title: "Business Verified",
    description: "Your business has been verified. You can now submit projects for funding.",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-500",
    showCta: true,
    ctaText: "Create Project",
  },
  rejected: {
    icon: XCircle,
    title: "Verification Rejected",
    description: "Your KYB verification was not approved.",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
    showCta: true,
    ctaText: "Resubmit Documents",
  },
};

export function KybStatusBanner({ status, rejectionReason }: KybStatusBannerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // Don't show banner if approved (or show a minimal success message)
  if (status === "approved") {
    return null;
  }

  return (
    <div
      className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 md:p-6`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{config.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {status === "rejected" && rejectionReason
              ? `${config.description} Reason: ${rejectionReason}`
              : config.description}
          </p>
        </div>
        {config.showCta && (
          <div className="flex-shrink-0">
            {(status === "not_started" || status === "rejected") && (
              <Link href="/developer/dashboard/kyb">
                <Button className="bg-primary hover:bg-primary/90">
                  {config.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
