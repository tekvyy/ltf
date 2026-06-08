"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ConnectWallet } from "@/components/dashboard/connect-wallet";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { LoansChart } from "@/components/dashboard/loans-chart";
import { PortfolioTable } from "@/components/dashboard/portfolio-table";
import { ProjectCard, Project as CardProject } from "@/components/dashboard/project-card";
import { TokenizeProjectDialog } from "@/components/dashboard/tokenize-project-dialog";
import { lenderProjectsService, lenderProposalsService } from "@/lib/api";
import type { LenderProject, LenderLoanProposal } from "@/lib/types/lender";
import { Building2, Loader2, Coins } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Helper to generate chart data from approved proposals
function generateChartData(proposals: LenderLoanProposal[]): { date: string; value: number }[] {
  const approvedStatuses = [
    "accepted_by_developer",
    "signed_by_developer",
    "signed_by_lender",
    "loan_term_fully_executed",
  ];

  const approvedProposals = proposals.filter((p) =>
    approvedStatuses.includes(p.status)
  );

  // Get last 6 months
  const months: { date: string; value: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const month = d.getMonth();

    // Sum loan amounts for proposals accepted in this month
    const monthTotal = approvedProposals
      .filter((p) => {
        const acceptedDate = new Date(p.accepted_at || p.created_at);
        return acceptedDate.getFullYear() === year && acceptedDate.getMonth() === month;
      })
      .reduce((sum, p) => sum + p.loan_amount_offered, 0);

    months.push({ date: monthName, value: monthTotal });
  }

  return months;
}

// Helper to map LenderProject to CardProject
function mapToCardProject(project: LenderProject): CardProject {
  const location = [project.city, project.country].filter(Boolean).join(", ") || "Location not set";
  const startDate = project.construction_start_date ? new Date(project.construction_start_date) : new Date();
  const endDate = project.construction_end_date ? new Date(project.construction_end_date) : new Date();
  const projectDuration = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 365;
  const imageUrl = project.cover_photo_url || (project.photos?.[0]?.file_url);

  return {
    id: project.id.toString(),
    name: project.title,
    location,
    description: project.description || "No description available",
    loanValue: project.loan_amount,
    projectDuration,
    coverImageUrl: imageUrl || undefined,
  };
}

export default function DashboardPage() {
  const [latestProject, setLatestProject] = useState<CardProject | null>(null);
  const [latestProjectData, setLatestProjectData] = useState<LenderProject | null>(null);
  const [stats, setStats] = useState({ totalBalance: 0, submittedBids: 0, approvedLoans: 0 });
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [loanProposals, setLoanProposals] = useState<LenderLoanProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTokenizeDialog, setShowTokenizeDialog] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch latest project from marketplace
      const projectsResponse = await lenderProjectsService.list({ per_page: 1 });
      if (projectsResponse.data?.success && projectsResponse.data.data.length > 0) {
        const project = projectsResponse.data.data[0];
        setLatestProject(mapToCardProject(project));
        setLatestProjectData(project);
      }

      // Fetch proposals to calculate stats
      const proposalsResponse = await lenderProposalsService.list({ status: "all", per_page: 100 });
      if (proposalsResponse.data?.success) {
        const proposals = proposalsResponse.data.data;
        setLoanProposals(proposals);
        const submittedBids = proposals.filter(p =>
          p.status === "submitted_by_lender" || p.status === "under_review_by_developer"
        ).length;
        const approvedLoans = proposals.filter(p =>
          p.status === "accepted_by_developer" ||
          p.status === "signed_by_developer" ||
          p.status === "signed_by_lender" ||
          p.status === "loan_term_fully_executed"
        ).length;
        const totalBalance = proposals
          .filter(p =>
            p.status === "accepted_by_developer" ||
            p.status === "signed_by_developer" ||
            p.status === "signed_by_lender" ||
            p.status === "loan_term_fully_executed"
          )
          .reduce((sum, p) => sum + p.loan_amount_offered, 0);

        setStats({ totalBalance, submittedBids, approvedLoans });

        // Generate chart data from proposals
        setChartData(generateChartData(proposals));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-7">
      <div className="animate-reveal flex flex-wrap items-end justify-between gap-4">
        <DashboardHeader title="Lender Dashboard" subtitle="Superfund · Lender workspace" />
      </div>

      <div className="animate-reveal delay-1">
        <ConnectWallet />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Tokenise Project Button */}
          {stats.approvedLoans > 0 && (
            <div className="grain animate-reveal delay-2 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/12 to-primary/[0.04] p-5">
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Coins className="h-5 w-5 text-primary" />
                    Tokenise your projects
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create Multi-Purpose Tokens for fractional ownership and secondary markets
                  </p>
                </div>
                <Button onClick={() => setShowTokenizeDialog(true)} className="shrink-0">
                  <Coins className="h-4 w-4" />
                  Tokenise Project
                </Button>
              </div>
            </div>
          )}

          {/* Metric band */}
          <div className="animate-reveal delay-2 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Loans value
            </h2>
            <StatsCards
              totalBalance={stats.totalBalance}
              submittedBids={stats.submittedBids}
              approvedLoans={stats.approvedLoans}
            />
          </div>

          {/* Loan Chart */}
          <div className="animate-reveal delay-3">
            <LoansChart data={chartData} />
          </div>

          {/* Portfolio Table */}
          <div className="animate-reveal delay-4">
            <PortfolioTable projects={loanProposals.filter(p =>
              ["accepted_by_developer", "signed_by_developer", "signed_by_lender", "loan_term_fully_executed"].includes(p.status)
            ).map(p => ({
              id: p.project.id.toString(),
              name: p.project.title,
              noOfTokens: 1,
              tokenValue: p.loan_amount_offered,
              totalValue: p.loan_amount_offered,
              fulfilment: Math.round((p.project.amount_raised / p.project.loan_amount) * 100) || 0
            }))} />
          </div>
        </div>

        <div className="animate-reveal delay-3 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Latest project
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-8 shadow-elevated">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : latestProject ? (
            <ProjectCard project={latestProject} />
          ) : (
            <div className="bg-dots rounded-2xl border border-border/70 bg-card p-10 text-center shadow-elevated">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="mb-4 text-sm text-muted-foreground">No projects available yet</p>
              <Link href="/dashboard/marketplace">
                <Button size="sm">Browse Marketplace</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <TokenizeProjectDialog
        open={showTokenizeDialog}
        onOpenChange={setShowTokenizeDialog}
        project={latestProjectData || undefined}
      />
    </div>
  );
}
