"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { lenderDrawdownService, lenderProposalsService } from "@/lib/api/lender";
import {
  LenderDrawdownMilestone,
  LenderDrawdownStatistics,
  LenderLoanProposal,
  LenderMilestoneProof,
  UploadPaymentProofData,
} from "@/lib/types/lender";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  AlertCircle,
  Building2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type MilestoneStatus = "pending" | "proof_submitted" | "approved" | "rejected" | "paid";

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

function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

interface PaymentProofInput {
  id: string;
  title: string;
  file: File | null;
}

export default function LenderDrawdownPage() {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<LenderDrawdownMilestone[]>([]);
  const [statistics, setStatistics] = useState<LenderDrawdownStatistics | null>(null);
  const [proposals, setProposals] = useState<LenderLoanProposal[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Dialog states
  const [rejectDialog, setRejectDialog] = useState<LenderDrawdownMilestone | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [paymentDialog, setPaymentDialog] = useState<LenderDrawdownMilestone | null>(null);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProofInput[]>([
    { id: "1", title: "", file: null },
  ]);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [approveLoading, setApproveLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch proposals to get the projects the lender has funded
      const proposalsResponse = await lenderProposalsService.list({
        status: "loan_term_fully_executed",
        per_page: 100,
      });

      if (proposalsResponse.data?.success && proposalsResponse.data.data) {
        setProposals(proposalsResponse.data.data);

        // Fetch milestones for each project
        const allMilestones: LenderDrawdownMilestone[] = [];
        let stats: LenderDrawdownStatistics = {
          total_milestones: 0,
          pending_review: 0,
          approved: 0,
          paid: 0,
          total_amount: "0",
          paid_amount: "0",
          approved_amount: "0",
          pending_amount: "0",
        };

        for (const proposal of proposalsResponse.data.data) {
          const milestonesResponse = await lenderDrawdownService.listMilestones(
            proposal.project.id
          );

          if (milestonesResponse.data?.success && milestonesResponse.data.data) {
            const projectMilestones = milestonesResponse.data.data.map((m) => ({
              ...m,
              project: {
                id: proposal.project.id,
                title: proposal.project.title,
                status: proposal.project.status,
                status_label: proposal.project.status_label,
                developer: proposal.project.developer
                  ? {
                      id: proposal.project.developer.id,
                      company_name: proposal.project.developer.company_name,
                      user: proposal.project.developer.user
                        ? { name: proposal.project.developer.user.name }
                        : undefined,
                    }
                  : undefined,
              },
            }));
            allMilestones.push(...projectMilestones);

            // Aggregate statistics
            if (milestonesResponse.data.statistics) {
              const s = milestonesResponse.data.statistics;
              stats.total_milestones += s.total_milestones || 0;
              stats.pending_review += s.pending_review || 0;
              stats.approved += s.approved || 0;
              stats.paid += s.paid || 0;
              stats.total_amount = String(
                Number(stats.total_amount) + Number(s.total_amount || 0)
              );
              stats.paid_amount = String(
                Number(stats.paid_amount) + Number(s.paid_amount || 0)
              );
              stats.approved_amount = String(
                Number(stats.approved_amount) + Number(s.approved_amount || 0)
              );
              stats.pending_amount = String(
                Number(stats.pending_amount) + Number(s.pending_amount || 0)
              );
            }
          }
        }

        setMilestones(allMilestones);
        setStatistics(stats);
      }
    } catch (error) {
      console.error("Failed to fetch drawdown data:", error);
      toast.error("Failed to load drawdown data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Filter milestones - only show those with proofs submitted or beyond
  const filteredMilestones = milestones
    .filter((m) => m.status !== "pending")
    .filter((milestone) => {
      const projectMatch =
        selectedProject === "all" ||
        milestone.project.id.toString() === selectedProject;
      const statusMatch =
        selectedStatus === "all" || milestone.status === selectedStatus;
      return projectMatch && statusMatch;
    });

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Approve milestone
  const handleApprove = async (milestone: LenderDrawdownMilestone) => {
    setApproveLoading(milestone.id);
    try {
      const response = await lenderDrawdownService.approveMilestone(
        milestone.project.id,
        milestone.id
      );

      if (response.data?.success) {
        toast.success("Milestone approved successfully");
        fetchData();
      } else {
        toast.error(response.data?.message || "Failed to approve milestone");
      }
    } catch (error) {
      console.error("Failed to approve milestone:", error);
      toast.error("Failed to approve milestone");
    } finally {
      setApproveLoading(null);
    }
  };

  // Reject milestone
  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setRejectLoading(true);
    try {
      const response = await lenderDrawdownService.rejectMilestone(
        rejectDialog.project.id,
        rejectDialog.id,
        rejectReason
      );

      if (response.data?.success) {
        toast.success("Milestone rejected");
        setRejectDialog(null);
        setRejectReason("");
        fetchData();
      } else {
        toast.error(response.data?.message || "Failed to reject milestone");
      }
    } catch (error) {
      console.error("Failed to reject milestone:", error);
      toast.error("Failed to reject milestone");
    } finally {
      setRejectLoading(false);
    }
  };

  // Upload payment proof
  const handleUploadPayment = async () => {
    if (!paymentDialog) return;

    const validProofs = paymentProofs.filter((p) => p.title.trim() && p.file);
    if (validProofs.length === 0) {
      toast.error("Please add at least one payment proof with title and file");
      return;
    }

    setPaymentLoading(true);
    try {
      const proofsData: UploadPaymentProofData[] = validProofs.map((p) => ({
        title: p.title,
        file: p.file!,
      }));

      const response = await lenderDrawdownService.uploadPaymentProof(
        paymentDialog.project.id,
        paymentDialog.id,
        proofsData,
        paymentReference || undefined
      );

      if (response.data?.success) {
        toast.success("Payment proof uploaded successfully");
        setPaymentDialog(null);
        setPaymentProofs([{ id: "1", title: "", file: null }]);
        setPaymentReference("");
        fetchData();
      } else {
        toast.error(response.data?.message || "Failed to upload payment proof");
      }
    } catch (error) {
      console.error("Failed to upload payment proof:", error);
      toast.error("Failed to upload payment proof");
    } finally {
      setPaymentLoading(false);
    }
  };

  const addPaymentProof = () => {
    setPaymentProofs([
      ...paymentProofs,
      { id: Date.now().toString(), title: "", file: null },
    ]);
  };

  const removePaymentProof = (id: string) => {
    if (paymentProofs.length > 1) {
      setPaymentProofs(paymentProofs.filter((p) => p.id !== id));
    }
  };

  const updatePaymentProof = (
    id: string,
    field: "title" | "file",
    value: string | File | null
  ) => {
    setPaymentProofs(
      paymentProofs.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  // Get unique projects for filter
  const uniqueProjects = Array.from(
    new Map(
      milestones.map((m) => [m.project.id, { id: m.project.id, title: m.project.title }])
    ).values()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Progress Payments</h1>
        <p className="text-muted-foreground mt-1">
          Review milestone invoices and confirm payments
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Review
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-amber-600">
                    {statistics.pending_review}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {formatCurrency(statistics.pending_amount)} awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Approved
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-green-600">
                    {statistics.approved}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {formatCurrency(statistics.approved_amount)} pending payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="text-2xl font-semibold tracking-tight text-emerald-600">
                    {statistics.paid}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {formatCurrency(statistics.paid_amount)} disbursed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatCurrency(statistics.total_amount)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {statistics.total_milestones} total milestones
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1 block">
                Project
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1 block">
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="proof_submitted">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Drawdowns ({filteredMilestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No invoices found
              </h3>
              <p className="text-muted-foreground">
                {milestones.length === 0
                  ? "No milestone invoices have been submitted yet."
                  : "No invoices match your current filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMilestones.map((milestone) => {
                    const rowKey = `${milestone.project.id}-${milestone.id}`;
                    return (
                      <Fragment key={rowKey}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => toggleRow(rowKey)}
                        >
                          <TableCell>
                            {expandedRows.has(rowKey) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {milestone.project.title}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="text-muted-foreground text-sm">
                                #{milestone.sequence}
                              </span>{" "}
                              {milestone.title}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {milestone.project.developer?.company_name ||
                              milestone.project.developer?.user?.name ||
                              "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(milestone.amount)}
                          </TableCell>
                          <TableCell>
                            <MilestoneStatusBadge status={milestone.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(milestone.proof_submitted_at)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {milestone.status === "proof_submitted" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprove(milestone)}
                                    disabled={approveLoading === milestone.id}
                                  >
                                    {approveLoading === milestone.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setRejectDialog(milestone)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {milestone.status === "approved" && (
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90"
                                  onClick={() => setPaymentDialog(milestone)}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Payment
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Row */}
                        {expandedRows.has(rowKey) && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted p-4">
                              <div className="space-y-4">
                                {/* Description */}
                                {milestone.description && (
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground">
                                      Description
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {milestone.description}
                                    </p>
                                  </div>
                                )}

                                {/* Submitted Proofs */}
                                <div>
                                  <h4 className="text-sm font-medium text-foreground mb-2">
                                    Submitted Proofs
                                  </h4>
                                  {(() => {
                                    const developerProofs =
                                      milestone.milestone_proofs && milestone.milestone_proofs.length > 0
                                        ? milestone.milestone_proofs
                                        : milestone.proofs?.filter((p) => !p.is_payment_proof) || [];
                                    return developerProofs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {developerProofs.map((proof: LenderMilestoneProof) => (
                                        <div
                                          key={proof.id}
                                          className="flex items-center justify-between p-3 bg-card border rounded-lg"
                                        >
                                          <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                              <p className="font-medium text-sm">
                                                {proof.title}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {proof.proof_type_label} •{" "}
                                                {formatFileSize(proof.file_size)}
                                              </p>
                                            </div>
                                          </div>
                                          <a
                                            href={proof.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-sm flex items-center gap-1"
                                          >
                                            <Download className="h-4 w-4" />
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground text-sm">
                                      No proofs available
                                    </p>
                                  );
                                  })()}
                                </div>

                                {/* Rejection Reason */}
                                {milestone.status === "rejected" &&
                                  milestone.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div>
                                          <h4 className="text-sm font-medium text-red-800">
                                            Rejection Reason
                                          </h4>
                                          <p className="text-sm text-red-700 mt-1">
                                            {milestone.rejection_reason}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* Payment Info */}
                                {milestone.status === "paid" && (
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                                      <div className="flex-1">
                                        <h4 className="text-sm font-medium text-emerald-800">
                                          Payment Confirmed
                                        </h4>
                                        <p className="text-sm text-emerald-700 mt-1">
                                          Paid on {formatDate(milestone.paid_at)}
                                          {milestone.payment_reference && (
                                            <> • Ref: {milestone.payment_reference}</>
                                          )}
                                        </p>

                                        {/* Payment Proofs */}
                                        {(() => {
                                          const paymentProofsList =
                                            milestone.payment_proofs && milestone.payment_proofs.length > 0
                                              ? milestone.payment_proofs
                                              : milestone.proofs?.filter((p) => p.is_payment_proof) || [];
                                          return paymentProofsList.length > 0 && (
                                          <div className="mt-3 space-y-2">
                                            {paymentProofsList.map((proof: LenderMilestoneProof) => (
                                              <div
                                                key={proof.id}
                                                className="flex items-center justify-between p-2 bg-card/50 rounded"
                                              >
                                                <span className="text-sm">
                                                  {proof.title}
                                                </span>
                                                <a
                                                  href={proof.file_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-emerald-700 hover:underline text-sm flex items-center gap-1"
                                                >
                                                  <Download className="h-4 w-4" />
                                                  Download
                                                </a>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Dates */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Due Date:</span>
                                    <span className="ml-2 font-medium">
                                      {formatDate(milestone.due_date)}
                                    </span>
                                  </div>
                                  {milestone.approved_at && (
                                    <div>
                                      <span className="text-muted-foreground">Approved:</span>
                                      <span className="ml-2 font-medium">
                                        {formatDate(milestone.approved_at)}
                                      </span>
                                    </div>
                                  )}
                                  {milestone.paid_at && (
                                    <div>
                                      <span className="text-muted-foreground">Paid:</span>
                                      <span className="ml-2 font-medium">
                                        {formatDate(milestone.paid_at)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Milestone Invoice</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this milestone. The developer
              will be able to address your concerns and resubmit.
            </DialogDescription>
          </DialogHeader>

          {rejectDialog && (
            <div className="space-y-4 px-6 py-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{rejectDialog.project.title}</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(rejectDialog.amount)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Milestone #{rejectDialog.sequence}: {rejectDialog.title}
                </p>
              </div>

              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this milestone is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLoading || !rejectReason.trim()}
            >
              {rejectLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Payment Proof Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Payment Proof</DialogTitle>
            <DialogDescription>
              Upload proof of payment for this milestone. You can add multiple
              documents (e.g., bank transfer receipt, confirmation email).
            </DialogDescription>
          </DialogHeader>

          {paymentDialog && (
            <div className="space-y-4 py-4 px-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{paymentDialog.project.title}</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(paymentDialog.amount)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Milestone #{paymentDialog.sequence}: {paymentDialog.title}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Payment Proofs *</Label>
                {paymentProofs.map((proof, index) => (
                  <div key={proof.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Document {index + 1}
                      </span>
                      {paymentProofs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePaymentProof(proof.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Document title (e.g., Bank Transfer Receipt)"
                      value={proof.title}
                      onChange={(e) =>
                        updatePaymentProof(proof.id, "title", e.target.value)
                      }
                    />
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        updatePaymentProof(
                          proof.id,
                          "file",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPaymentProof}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Document
                </Button>
              </div>

              <div>
                <Label htmlFor="payment-reference">
                  Payment Reference (Optional)
                </Label>
                <Input
                  id="payment-reference"
                  placeholder="Transaction ID or reference number"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleUploadPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
