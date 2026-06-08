"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ConnectWallet } from "@/components/dashboard/connect-wallet";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { LoansChart } from "@/components/dashboard/loans-chart";
import { PortfolioTable } from "@/components/dashboard/portfolio-table";
import { ProjectCard, Project as CardProject } from "@/components/dashboard/project-card";
import { TokenizeProjectDialog } from "@/components/dashboard/tokenize-project-dialog";
import { Separator } from "@/components/ui/separator";
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
    <div className="space-y-6">
      <DashboardHeader title="Lender Dashboard" subtitle="Superfund" />

      <ConnectWallet />

      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-5">
          {/* Tokenise Project Button */}
          {stats.approvedLoans > 0 && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Tokenise Your Projects
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create Multi-Purpose Tokens for fractional ownership and secondary markets
                  </p>
                </div>
                <Button
                  onClick={() => setShowTokenizeDialog(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Coins className="mr-2 h-4 w-4" />
                  Tokenise Project
                </Button>
              </div>
            </div>
          )}

          {/* Stats Card */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Loans value</h2>
            <StatsCards
              totalBalance={stats.totalBalance}
              submittedBids={stats.submittedBids}
              approvedLoans={stats.approvedLoans}
            />
          </div>
          {/* Loan Chart */}
          <div className="">
            <LoansChart data={chartData} />
          </div>
          {/* Portfolio Table */}
          <div className="space-y-2">
            {/*<h2 className="text-lg font-semibold">Portfolio summary</h2>*/}
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
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Latest Project</h2>
          {isLoading ? (
            <div className="rounded-xl border bg-card p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : latestProject ? (
            <ProjectCard project={latestProject} />
          ) : (
            <div className="rounded-xl border bg-card p-8 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No projects available yet</p>
              <Link href="/dashboard/marketplace">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Browse Marketplace
                </Button>
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
