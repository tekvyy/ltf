"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  PenTool,
} from "lucide-react";
import { LenderProposalCard } from "@/components/dashboard/lender-proposal-card";
import { lenderProposalsService } from "@/lib/api";
import type { LenderLoanProposal, LenderProposalStatus } from "@/lib/types/lender";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type StatusFilter = "all" | LenderProposalStatus;

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<LenderLoanProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  // Sign state
  const [signingId, setSigningId] = useState<number | null>(null);
  const [showSignDialog, setShowSignDialog] = useState<number | null>(null);

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await lenderProposalsService.list({
        status: statusFilter,
        per_page: 15,
      });
      if (response.data?.success) {
        setProposals(response.data.data);
        setMeta(response.data.meta);
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to load proposals");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleSign = async (proposalId: number) => {
    setSigningId(proposalId);
    try {
      const response = await lenderProposalsService.sign(proposalId);
      if (response.data?.success) {
        toast.success("Agreement signed successfully");
        setShowSignDialog(null);
        await fetchProposals();
      } else {
        toast.error(response.data?.message || response.error || "Failed to sign agreement");
      }
    } catch (error) {
      console.error("Error signing agreement:", error);
      toast.error("Failed to sign agreement");
    } finally {
      setSigningId(null);
    }
  };

  // Helper to check if a proposal is in accepted/active state (for signing flow)
  const isAcceptedOrActive = (p: LenderLoanProposal) => {
    return p.status === "accepted_by_developer" ||
           p.status === "signed_by_developer" ||
           p.status === "signed_by_lender" ||
           p.status === "loan_term_fully_executed";
  };

  // Calculate stats from proposals
  const stats = {
    total: meta.total,
    pending: proposals.filter(
      (p) => p.status === "submitted_by_lender" || p.status === "under_review_by_developer"
    ).length,
    accepted: proposals.filter(isAcceptedOrActive).length,
    rejected: proposals.filter((p) => p.status === "rejected_by_developer").length,
  };

  // Group proposals by status for display
  const acceptedProposals = proposals.filter(isAcceptedOrActive);
  const pendingProposals = proposals.filter(
    (p) => p.status === "submitted_by_lender" || p.status === "under_review_by_developer"
  );
  const rejectedProposals = proposals.filter((p) => p.status === "rejected_by_developer");
  const fullyExecutedProposals = proposals.filter((p) => p.status === "loan_term_fully_executed");

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "submitted_by_lender", label: "Pending" },
    { value: "under_review_by_developer", label: "Under Review" },
    { value: "accepted_by_developer", label: "Accepted" },
    { value: "rejected_by_developer", label: "Rejected" },
    { value: "loan_term_fully_executed", label: "Active" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Proposals</h1>
          <p className="text-muted-foreground mt-1">
            Track all your submitted loan proposals
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
        <h1 className="text-2xl font-semibold tracking-tight">My Proposals</h1>
        <p className="text-muted-foreground mt-1">
          Track all your submitted loan proposals
        </p>
      </div>

      {/* Stats Overview */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Proposal Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Submitted</p>
            <p className="text-2xl font-semibold tracking-tight">{stats.total}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-amber-600">Pending Review</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-amber-700">{stats.pending}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600">Accepted</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-green-700">{stats.accepted}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600">Rejected</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-red-700">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter:</span>
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={statusFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(option.value)}
            className={
              statusFilter === option.value
                ? "bg-primary hover:bg-primary/90"
                : ""
            }
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Proposals List */}
      {statusFilter === "all" ? (
        <>
          {/* Accepted Proposals */}
          {acceptedProposals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Accepted ({acceptedProposals.length})
              </h3>
              <div className="space-y-4">
                {acceptedProposals.map((proposal) => (
                  <LenderProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onSign={(id) => setShowSignDialog(id)}
                    isSigning={signingId === proposal.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Proposals */}
          {pendingProposals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-amber-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Review ({pendingProposals.length})
              </h3>
              <div className="space-y-4">
                {pendingProposals.map((proposal) => (
                  <LenderProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Proposals */}
          {rejectedProposals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedProposals.length})
              </h3>
              <div className="space-y-4">
                {rejectedProposals.map((proposal) => (
                  <LenderProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            </div>
          )}

          {/* Fully Executed Loans */}
          {fullyExecutedProposals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-emerald-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Active Loans ({fullyExecutedProposals.length})
              </h3>
              <div className="space-y-4">
                {fullyExecutedProposals.map((proposal) => (
                  <LenderProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Filtered view */
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <LenderProposalCard
              key={proposal.id}
              proposal={proposal}
              onSign={isAcceptedOrActive(proposal) ? (id) => setShowSignDialog(id) : undefined}
              isSigning={signingId === proposal.id}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {proposals.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {statusFilter === "all"
              ? "You haven't submitted any loan proposals yet. Browse the marketplace to find projects and submit your first proposal."
              : `No ${filterOptions.find((f) => f.value === statusFilter)?.label.toLowerCase()} proposals found.`}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-xl border bg-blue-50 border-blue-200 p-6">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          About Your Proposals
        </h3>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Proposals are reviewed by developers within 2-5 business days</li>
          <li>If accepted, you&apos;ll need to sign the loan agreement</li>
          <li>The loan becomes active once both parties sign the agreement</li>
          <li>Rejected proposals show the reason provided by the developer</li>
        </ul>
      </div>

      {/* Sign Agreement Dialog */}
      <Dialog open={!!showSignDialog} onOpenChange={() => setShowSignDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              Sign Loan Agreement
            </DialogTitle>
            <DialogDescription>
              By signing, you agree to the terms and conditions of this loan agreement.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> This is a legally binding agreement. Please ensure you have reviewed all terms before signing.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSignDialog(null)}
              disabled={!!signingId}
            >
              Cancel
            </Button>
            <Button
              onClick={() => showSignDialog && handleSign(showSignDialog)}
              disabled={!!signingId}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {signingId ? (
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
