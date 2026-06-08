"use client";

import { useState } from "react";
import { Building2, Calendar, Percent, Shield, Clock, ChevronDown, ChevronUp, FileText, Eye, Download, PenTool, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DeveloperProjectProposal,
  developerSecurityPackageLabels,
  developerProposalStatusConfig,
} from "@/lib/types/developer";
import { cn } from "@/lib/utils";

// Default status config for unknown statuses
const defaultStatusConfig = { label: 'Unknown', color: 'text-foreground', bgColor: 'bg-muted' };

interface ProposalCardProps {
  proposal: DeveloperProjectProposal;
  onAccept?: (proposalId: number) => void;
  onReject?: (proposalId: number) => void;
  onSign?: (proposalId: number) => void;
  onViewDetails?: (proposalId: number) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  isSigning?: boolean;
}

export function ProposalCard({
  proposal,
  onAccept,
  onReject,
  onSign,
  onViewDetails,
  isAccepting = false,
  isRejecting = false,
  isSigning = false,
}: ProposalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = developerProposalStatusConfig[proposal.status] || defaultStatusConfig;

  // Check if proposal is in accepted/active state (for signing flow)
  const isAccepted = proposal.status === "accepted_by_developer" ||
                     proposal.status === "signed_by_developer" ||
                     proposal.status === "signed_by_lender" ||
                     proposal.status === "loan_term_fully_executed";
  const isActionable = proposal.status === "submitted_by_lender" || proposal.status === "under_review_by_developer";
  const isRejected = proposal.status === "rejected_by_developer";
  const isExpired = new Date(proposal.bid_expiry_date) < new Date();

  // Get lender name from nested object
  const lenderName = proposal.lender?.user?.name || proposal.lender?.company_name || "Unknown Lender";

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const daysUntilExpiry = () => {
    const now = new Date();
    const expiry = new Date(proposal.bid_expiry_date);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewDocument = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownloadDocument = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md",
        isAccepted && "border-green-200 bg-green-50/30",
        isRejected && "border-red-200 bg-red-50/30"
      )}
    >
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Lender Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{lenderName}</h3>
              <p className="text-xs text-muted-foreground">
                Submitted {formatDate(proposal.created_at)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium self-start",
              statusConfig.bgColor,
              statusConfig.color
            )}
          >
            {isExpired && isActionable ? "Expired" : statusConfig.label}
          </div>
        </div>

        {/* Key Stats - Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Amount */}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Amount Offered</p>
            <p className="text-sm sm:text-base font-bold text-primary">
              {formatCurrency(proposal.loan_amount_offered, proposal.currency)}
            </p>
          </div>

          {/* Interest Rate */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <Percent className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Interest Rate</p>
            </div>
            <p className="text-sm sm:text-base font-bold">{proposal.interest_rate}% p.a.</p>
          </div>

          {/* Max LTV */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Max LTV</p>
            </div>
            <p className="text-sm sm:text-base font-bold">{proposal.max_ltv_accepted}%</p>
          </div>

          {/* Maturity */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Maturity</p>
            </div>
            <p className="text-sm sm:text-base font-bold">{formatDate(proposal.loan_maturity_date)}</p>
          </div>
        </div>

        {/* Expiry Warning */}
        {isActionable && !isExpired && daysUntilExpiry() <= 7 && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">
              Expires in {daysUntilExpiry()} day{daysUntilExpiry() !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Agreement Signing Status - For Accepted Proposals */}
        {isAccepted && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2 text-sm">
              <PenTool className="h-4 w-4" />
              Agreement Signing Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Developer Signature */}
              <div className={cn(
                "p-3 rounded-lg border",
                proposal.developer_signed_at
                  ? "bg-green-100 border-green-300"
                  : "bg-card border-border"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {proposal.developer_signed_at ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <span className="text-sm font-medium">Your Signature</span>
                </div>
                {proposal.developer_signed_at ? (
                  <p className="text-xs text-green-700">
                    Signed on {formatDate(proposal.developer_signed_at)}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">You need to sign the agreement</p>
                    {onSign && (
                      <Button
                        size="sm"
                        onClick={() => onSign(proposal.id)}
                        disabled={isSigning}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {isSigning ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Signing...
                          </>
                        ) : (
                          <>
                            <PenTool className="mr-2 h-3 w-3" />
                            Sign Agreement
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Lender Signature */}
              <div className={cn(
                "p-3 rounded-lg border",
                proposal.lender_signed_at
                  ? "bg-green-100 border-green-300"
                  : "bg-card border-border"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {proposal.lender_signed_at ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <span className="text-sm font-medium">Lender&apos;s Signature</span>
                </div>
                {proposal.lender_signed_at ? (
                  <p className="text-xs text-green-700">
                    Signed on {formatDate(proposal.lender_signed_at)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Waiting for lender to sign</p>
                )}
              </div>
            </div>

            {/* Both Signed Message */}
            {proposal.developer_signed_at && proposal.lender_signed_at && (
              <div className="mt-3 p-3 bg-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
                <span className="text-sm font-medium text-green-800">
                  Agreement fully executed! Loan is now active.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              View details
            </>
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            {/* Security Package */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Security Package</p>
              <div className="flex flex-wrap gap-2">
                {proposal.security_packages.map((pkg) => (
                  <span
                    key={pkg}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium text-foreground"
                  >
                    {developerSecurityPackageLabels[pkg]}
                  </span>
                ))}
              </div>
            </div>

            {/* Bid Expiry */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bid Expiry Date</p>
              <p className="text-sm font-medium">
                {formatDate(proposal.bid_expiry_date)}
                {isExpired && (
                  <span className="ml-2 text-red-500 text-xs">(Expired)</span>
                )}
              </p>
            </div>

            {/* Conditions */}
            {proposal.additional_conditions && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Additional Conditions</p>
                <p className="text-sm text-foreground">{proposal.additional_conditions}</p>
              </div>
            )}

            {/* Supporting Documents */}
            {proposal.documents && proposal.documents.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Supporting Documents</p>
                <div className="space-y-2">
                  {proposal.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_size_formatted}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDocument(doc.file_url)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                          title="View document"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                          title="Download document"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {isRejected && proposal.rejection_reason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700">{proposal.rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - For Pending Proposals */}
      {isActionable && !isExpired && (
        <div className="px-4 sm:px-5 py-3 bg-muted border-t border-border flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject?.(proposal.id)}
            disabled={isRejecting || isAccepting}
            className="rounded-full order-2 sm:order-1"
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            size="sm"
            onClick={() => onAccept?.(proposal.id)}
            disabled={isAccepting || isRejecting}
            className="bg-primary hover:bg-primary/90 text-white rounded-full order-1 sm:order-2"
          >
            {isAccepting ? "Accepting..." : "Accept Proposal"}
          </Button>
        </div>
      )}
    </div>
  );
}
