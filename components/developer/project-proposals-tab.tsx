"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Loader2, CheckCircle2, XCircle, AlertCircle, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProposalCard } from "./proposal-card";
import { projectProposalsService } from "@/lib/api";
import { DeveloperProjectProposal } from "@/lib/types/developer";
import { toast } from "sonner";

interface ProjectProposalsTabProps {
  projectId: string;
}

export function ProjectProposalsTab({ projectId }: ProjectProposalsTabProps) {
  const [proposals, setProposals] = useState<DeveloperProjectProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProposals, setTotalProposals] = useState(0);

  // Accept/Reject/Sign state
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<number | null>(null);
  const [showSignDialog, setShowSignDialog] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await projectProposalsService.list(parseInt(projectId), {
        status: "all",
        per_page: 50,
      });
      if (response.data?.success) {
        setProposals(response.data.data);
        setTotalProposals(response.data.meta?.total || response.data.data.length);
      } else if (response.error) {
        toast.error("Failed to load proposals");
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to load proposals");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleAccept = async (proposalId: number) => {
    setAcceptingId(proposalId);
    try {
      const response = await projectProposalsService.accept(proposalId);
      if (response.data?.success) {
        toast.success("Proposal accepted successfully");
        setShowAcceptDialog(null);
        await fetchProposals();
      } else {
        toast.error(response.data?.message || response.error || "Failed to accept proposal");
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error("Failed to accept proposal");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (proposalId: number) => {
    setRejectingId(proposalId);
    try {
      const response = await projectProposalsService.reject(
        proposalId,
        rejectReason || undefined
      );
      if (response.data?.success) {
        toast.success("Proposal rejected");
        setShowRejectDialog(null);
        setRejectReason("");
        await fetchProposals();
      } else {
        toast.error(response.data?.message || response.error || "Failed to reject proposal");
      }
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error("Failed to reject proposal");
    } finally {
      setRejectingId(null);
    }
  };

  const handleSign = async (proposalId: number) => {
    setSigningId(proposalId);
    try {
      const response = await projectProposalsService.sign(proposalId);
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
  const isAcceptedOrActive = (p: DeveloperProjectProposal) => {
    return p.status === "accepted_by_developer" ||
           p.status === "signed_by_developer" ||
           p.status === "signed_by_lender" ||
           p.status === "loan_term_fully_executed";
  };

  // Calculate stats from proposals
  const stats = {
    total: totalProposals,
    pending: proposals.filter((p) => p.status === "submitted_by_lender" || p.status === "under_review_by_developer").length,
    accepted: proposals.filter(isAcceptedOrActive).length,
    rejected: proposals.filter((p) => p.status === "rejected_by_developer").length,
  };

  // Group proposals by status
  const acceptedProposals = proposals.filter(isAcceptedOrActive);
  const pendingProposals = proposals.filter(
    (p) => p.status === "submitted_by_lender" || p.status === "under_review_by_developer"
  );
  const rejectedProposals = proposals.filter((p) => p.status === "rejected_by_developer");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Loan Proposals
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-600">Pending Review</p>
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Accepted</p>
            <p className="text-2xl font-bold text-green-700">{stats.accepted}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Accepted Proposals */}
      {acceptedProposals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-green-600 mb-3 uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Accepted ({acceptedProposals.length})
          </h3>
          <div className="space-y-4">
            {acceptedProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onSign={() => setShowSignDialog(proposal.id)}
                isSigning={signingId === proposal.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Proposals */}
      {pendingProposals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Pending Review ({pendingProposals.length})
          </h3>
          <div className="space-y-4">
            {pendingProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onAccept={() => setShowAcceptDialog(proposal.id)}
                onReject={() => setShowRejectDialog(proposal.id)}
                isAccepting={acceptingId === proposal.id}
                isRejecting={rejectingId === proposal.id}
              />
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
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {proposals.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Once your project is approved and listed in the marketplace, lenders will be able to
            submit loan proposals. You&apos;ll see them here.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-xl border bg-blue-50 border-blue-200 p-6">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          About Loan Proposals
        </h3>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Review each proposal carefully before making a decision</li>
          <li>Compare interest rates, LTV, and security packages</li>
          <li>Accepting a proposal will automatically reject all others</li>
          <li>After acceptance, both parties need to sign the agreement</li>
        </ul>
      </div>

      {/* Accept Confirmation Dialog */}
      <Dialog open={!!showAcceptDialog} onOpenChange={() => setShowAcceptDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Accept Proposal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this proposal? This action will:
            </DialogDescription>
          </DialogHeader>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 my-4 px-6">
            <li>Accept the selected proposal</li>
            <li>Automatically reject all other pending proposals</li>
            <li>Notify the lender about acceptance</li>
            <li>Move to the agreement signing phase</li>
          </ul>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(null)}
              disabled={!!acceptingId}
            >
              Cancel
            </Button>
            <Button
              onClick={() => showAcceptDialog && handleAccept(showAcceptDialog)}
              disabled={!!acceptingId}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {acceptingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Yes, Accept Proposal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={() => setShowRejectDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Proposal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this proposal? The lender will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 px-5">
            <Label htmlFor="rejectReason">Reason for rejection (optional)</Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide feedback to the lender..."
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(null);
                setRejectReason("");
              }}
              disabled={!!rejectingId}
            >
              Cancel
            </Button>
            <Button
              onClick={() => showRejectDialog && handleReject(showRejectDialog)}
              disabled={!!rejectingId}
              variant="destructive"
            >
              {rejectingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Proposal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
