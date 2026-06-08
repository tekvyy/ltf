"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Calendar,
  Percent,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  MapPin,
  User,
  AlertCircle,
  Download,
  Eye,
  PenTool,
  Loader2,
  Circle,
} from "lucide-react";
import {
  LenderLoanProposal,
  lenderSecurityPackageLabels,
  lenderProposalStatusConfig,
  LenderSecurityPackageType,
} from "@/lib/types/lender";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LenderProposalCardProps {
  proposal: LenderLoanProposal;
  onSign?: (proposalId: number) => void;
  isSigning?: boolean;
}

// Default status config for unknown statuses
const defaultStatusConfig = { label: 'Unknown', color: 'text-foreground', bgColor: 'bg-muted' };

export function LenderProposalCard({ proposal, onSign, isSigning = false }: LenderProposalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = lenderProposalStatusConfig[proposal.status] || defaultStatusConfig;

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

  const isExpiringSoon = () => {
    const expiryDate = new Date(proposal.bid_expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const project = proposal.project;
  const developer = project?.developer;

  // Check if proposal is in accepted/active state (for signing flow)
  const isAccepted = proposal.status === "accepted_by_developer" ||
                     proposal.status === "signed_by_developer" ||
                     proposal.status === "signed_by_lender" ||
                     proposal.status === "loan_term_fully_executed";
  const isRejected = proposal.status === "rejected_by_developer";
  const isFullyExecuted = proposal.status === "loan_term_fully_executed";

  // Check if lender can sign (accepted/developer signed and not yet signed by lender, not fully executed)
  const canSign = (proposal.status === "accepted_by_developer" || proposal.status === "signed_by_developer") &&
                  !proposal.lender_signed_at;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md",
        isAccepted && "border-green-200",
        isRejected && "border-red-200",
        isFullyExecuted && "border-emerald-300"
      )}
    >
      {/* Header with Project Info */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Project Image */}
          <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {project?.cover_photo_url ? (
              <Image
                src={project.cover_photo_url}
                alt={project.title}
                width={10}
                height={10}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Project & Developer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {project?.title || "Project"}
                </h3>
                {project?.city && project?.country && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.city}, {project.country}
                  </p>
                )}
                {developer?.company_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                    {developer.company_name}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                    statusConfig.bgColor,
                    statusConfig.color
                  )}
                >
                  {isAccepted && (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {isRejected && (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {(proposal.status === "submitted_by_lender" || proposal.status === "under_review_by_developer") && (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  {proposal.status_label || statusConfig.label}
                </div>
              </div>
            </div>

            {/* Submission Date */}
            <p className="text-xs text-muted-foreground mt-2">
              Submitted {formatDate(proposal.created_at)}
            </p>
          </div>
        </div>

        {/* Expiring Soon Warning */}
        {isExpiringSoon() && (proposal.status === "submitted_by_lender" || proposal.status === "under_review_by_developer") && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              This proposal expires on {formatDate(proposal.bid_expiry_date)}
            </p>
          </div>
        )}

        {/* Your Proposal Details */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
            Your Proposal
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount Offered</p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(proposal.loan_amount_offered, proposal.currency)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Percent className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Interest Rate</p>
              </div>
              <p className="text-sm font-bold">{proposal.interest_rate}% p.a.</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Max LTV</p>
              </div>
              <p className="text-sm font-bold">{proposal.max_ltv_accepted}%</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Maturity</p>
              </div>
              <p className="text-sm font-bold">
                {formatDate(proposal.loan_maturity_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        {isRejected && proposal.rejection_reason && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-medium text-red-800 mb-1">
              Rejection Reason
            </p>
            <p className="text-sm text-red-700">{proposal.rejection_reason}</p>
          </div>
        )}

        {/* Contract Section for Accepted Proposals */}
        {isAccepted && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs font-medium text-green-800 mb-3 uppercase tracking-wide flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Agreement Signing Status
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lender Contract */}
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  proposal.lender_signed_at
                    ? "bg-green-100 border-green-200"
                    : "bg-card border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {proposal.lender_signed_at ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <span className="text-sm font-medium">Your Signature</span>
                </div>
                {proposal.lender_signed_at ? (
                  <p className="text-xs text-green-700">
                    Signed {formatDate(proposal.lender_signed_at)}
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing...
                          </>
                        ) : (
                          <>
                            <PenTool className="mr-2 h-4 w-4" />
                            Sign Agreement
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Developer Contract */}
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  proposal.developer_signed_at
                    ? "bg-green-100 border-green-200"
                    : "bg-muted border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {proposal.developer_signed_at ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <span className="text-sm font-medium">Developer&apos;s Signature</span>
                </div>
                {proposal.developer_signed_at ? (
                  <p className="text-xs text-green-700">
                    Signed {formatDate(proposal.developer_signed_at)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Waiting for developer</p>
                )}
              </div>
            </div>

            {/* Contract Complete */}
            {proposal.lender_signed_at && proposal.developer_signed_at && (
              <div className="mt-4 p-3 bg-green-200 rounded-lg flex items-center gap-2">
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
            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Project Type</p>
                <p className="text-sm font-medium">
                  {project?.project_type_label || project?.project_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Requested Loan</p>
                <p className="text-sm font-medium">
                  {project
                    ? formatCurrency(project.loan_amount, proposal.currency)
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Security Package */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Security Package</p>
              <div className="flex flex-wrap gap-2">
                {proposal.security_packages.map((pkg) => (
                  <span
                    key={pkg}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium text-foreground"
                  >
                    {lenderSecurityPackageLabels[pkg as LenderSecurityPackageType] || pkg}
                  </span>
                ))}
              </div>
            </div>

            {/* Bid Expiry */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bid Expiry Date</p>
              <p className="text-sm font-medium">
                {formatDate(proposal.bid_expiry_date)}
              </p>
            </div>

            {/* Conditions */}
            {proposal.additional_conditions && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Conditions</p>
                <p className="text-sm text-foreground">
                  {proposal.additional_conditions}
                </p>
              </div>
            )}

            {/* Uploaded Documents */}
            {proposal.documents && proposal.documents.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Supporting Documents ({proposal.documents_count})
                </p>
                <div className="space-y-2">
                  {proposal.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted transition-colors group"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type_label} • {doc.file_size_formatted || `${(doc.file_size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="View document"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={doc.file_url}
                          download={doc.file_name}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - View Project Link */}
      <div className="px-4 sm:px-5 py-3 bg-muted border-t border-border flex justify-end">
        <Link
          href={`/dashboard/marketplace/${project?.id}`}
          className="text-sm text-primary hover:text-primary/90 font-medium inline-flex items-center gap-1"
        >
          View Project
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
