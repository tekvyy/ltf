"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Briefcase,
  Loader2,
  Eye,
  Building2,
  MapPin,
  Calendar,
  Percent,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { lenderProposalsService } from "@/lib/api";
import type { LenderLoanProposal, LenderProposalStatus } from "@/lib/types/lender";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Status badge configuration with icons
const statusConfig: Record<
  LenderProposalStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  submitted_by_lender: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  under_review_by_developer: {
    label: "Under Review",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Eye,
  },
  accepted_by_developer: {
    label: "Accepted",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  rejected_by_developer: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  signed_by_developer: {
    label: "Developer Signed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: FileText,
  },
  signed_by_lender: {
    label: "Lender Signed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: FileText,
  },
  loan_term_fully_executed: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
};

// Format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Status Badge Component
function StatusBadge({ status }: { status: LenderProposalStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// Mobile Deal Card Component
function DealCard({
  proposal,
  onView,
}: {
  proposal: LenderLoanProposal;
  onView: () => void;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        {/* Project Image */}
        <div className="w-24 h-full min-h-[140px] bg-muted flex-shrink-0 relative">
          {proposal.project.cover_photo_url ? (
            <Image
              src={proposal.project.cover_photo_url}
              alt={proposal.project.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground/60" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {proposal.project.title}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {proposal.project.country || "Location N/A"}
              </p>
            </div>
            <StatusBadge status={proposal.status} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Asset Type</p>
              <p className="font-medium capitalize">
                {proposal.project.project_type_label ||
                  proposal.project.project_type.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Loan Amount</p>
              <p className="font-semibold text-primary">
                {formatCurrency(proposal.loan_amount_offered, proposal.currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Interest Rate</p>
              <p className="font-medium">{proposal.interest_rate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Maturity</p>
              <p className="font-medium">{formatDate(proposal.loan_maturity_date)}</p>
            </div>
          </div>

          {/* View Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            className="mt-3 w-full text-primary hover:text-primary/90 hover:bg-orange-50"
          >
            View Project
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function DealsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<LenderLoanProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await lenderProposalsService.list({
        per_page: 50,
      });
      if (response.data?.success) {
        setProposals(response.data.data);
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleViewProject = (projectId: number) => {
    router.push(`/dashboard/marketplace/${projectId}`);
  };

  // Filter proposals
  const filteredProposals = proposals.filter((p) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending")
      return (
        p.status === "submitted_by_lender" ||
        p.status === "under_review_by_developer"
      );
    if (statusFilter === "accepted")
      return (
        p.status === "accepted_by_developer" ||
        p.status === "signed_by_developer" ||
        p.status === "signed_by_lender"
      );
    if (statusFilter === "active") return p.status === "loan_term_fully_executed";
    if (statusFilter === "rejected") return p.status === "rejected_by_developer";
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Deals</h1>
          <p className="text-muted-foreground mt-1">
            Projects you&apos;ve submitted proposals for
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Deals</h1>
        <p className="text-muted-foreground mt-1">
          Projects you&apos;ve submitted proposals for
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Filter by Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Deals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deals</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="active">Active Loans</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deals Table/Cards */}
      {filteredProposals.length > 0 ? (
        <>
          {/* Desktop Table - Hidden on mobile */}
          <Card className="hidden lg:block">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Your Deals ({filteredProposals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/80 hover:bg-muted/80">
                      <TableHead className="font-semibold text-foreground pl-6">
                        Project
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Asset Type
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Location
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Loan Amount
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          Rate
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Maturity
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-right pr-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((proposal) => (
                      <TableRow
                        key={proposal.id}
                        className="hover:bg-orange-50/50 transition-colors cursor-pointer group"
                        onClick={() => handleViewProject(proposal.project.id)}
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                              {proposal.project.cover_photo_url ? (
                                <Image
                                  src={proposal.project.cover_photo_url}
                                  alt={proposal.project.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-muted-foreground/60" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {proposal.project.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {formatDate(proposal.created_at)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-foreground capitalize">
                            {proposal.project.project_type_label ||
                              proposal.project.project_type.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {proposal.project.country || "—"}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            {formatCurrency(
                              proposal.loan_amount_offered,
                              proposal.currency
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {proposal.interest_rate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(proposal.loan_maturity_date)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={proposal.status} />
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProject(proposal.project.id);
                            }}
                            className="text-primary hover:text-primary/90 hover:bg-orange-100"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards - Hidden on desktop */}
          <div className="lg:hidden space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Your Deals ({filteredProposals.length})
            </h3>
            {filteredProposals.map((proposal) => (
              <DealCard
                key={proposal.id}
                proposal={proposal}
                onView={() => handleViewProject(proposal.project.id)}
              />
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <Card className="p-12 text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Deals Found
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {statusFilter === "all"
              ? "You haven't submitted any proposals yet. Browse the marketplace to find projects and start making deals."
              : "No deals match the selected filter."}
          </p>
          {statusFilter === "all" && (
            <Button
              onClick={() => router.push("/dashboard/marketplace")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
