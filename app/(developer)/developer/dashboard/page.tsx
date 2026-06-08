"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, DollarSign, Clock, Plus, ArrowRight, Loader2 } from "lucide-react";
import { DeveloperHeader } from "@/components/developer/developer-header";
import { KybStatusBanner } from "@/components/developer/kyb-status-banner";
import { FundingProgressChart } from "@/components/developer/funding-progress-chart";
import { RecentActivityFeed } from "@/components/developer/recent-activity-feed";
import { ConnectWallet } from "@/components/dashboard/connect-wallet";
import { Button } from "@/components/ui/button";
import { developerProfileService, projectsService } from "@/lib/api";
import type { DeveloperProfile, Project, KybStatus } from "@/lib/types";

export default function DeveloperDashboardPage() {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch profile
        const profileResponse = await developerProfileService.getProfile();
        if (profileResponse.error) {
          setError(profileResponse.error);
          return;
        }
        if (profileResponse.data?.data) {
          setProfile(profileResponse.data.data);
        }

        // Fetch projects if KYB is approved
        if (profileResponse.data?.data?.kyb_status === "approved") {
          // Fetch all projects for chart data
          const allProjectsResponse = await projectsService.list({ per_page: 100 });
          if (allProjectsResponse.data?.data) {
            setAllProjects(allProjectsResponse.data.data);
            // Use first 5 for recent projects display
            setRecentProjects(allProjectsResponse.data.data.slice(0, 5));
          }
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Developer Dashboard" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Developer Dashboard" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const kybStatus: KybStatus = profile?.kyb_status || "not_started";
  const isKybApproved = kybStatus === "approved";

  // Calculate stats from all projects
  const stats = {
    activeProjects: allProjects.filter(
      (p) => !["draft", "rejected", "completed"].includes(p.status)
    ).length,
    totalFunding: allProjects.reduce((sum, p) => sum + (p.amount_raised || 0), 0),
    pendingRequests: allProjects.filter(
      (p) => p.status === "submitted" || p.status === "under_review"
    ).length,
  };

  return (
    <div className="space-y-6">
      <DeveloperHeader title="Developer Dashboard" />

      {/* Wallet Connection */}
      <ConnectWallet />

      {/* KYB Status Banner */}
      <KybStatusBanner
        status={kybStatus}
        rejectionReason={profile?.kyb_rejection_reason || undefined}
      />

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">{stats.activeProjects}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Funding</p>
              <p className="text-2xl font-bold">${stats.totalFunding.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold text-primary">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {isKybApproved && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/developer/dashboard/projects/new">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create New Project
              </Button>
            </Link>
            <Link href="/developer/dashboard/projects">
              <Button variant="outline">
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Funding Progress Chart - Only show when KYB approved */}
      {isKybApproved && (
        <FundingProgressChart projects={allProjects} />
      )}

      {/* Recent Activity Feed */}
      <RecentActivityFeed projects={recentProjects} />

      {/* Recent Projects */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          {recentProjects.length > 0 && (
            <Link href="/developer/dashboard/projects" className="text-sm text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
        {recentProjects.length > 0 ? (
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/developer/dashboard/projects/${project.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${project.loan_amount.toLocaleString()} loan
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(project.status)}`}>
                  {formatStatus(project.status)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {isKybApproved
                ? "No projects yet. Create your first project to get started."
                : "Complete your KYB verification to start creating projects."}
            </p>
            {isKybApproved ? (
              <Link href="/developer/dashboard/projects/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </Link>
            ) : (
              <Link href="/developer/dashboard/kyb">
                <Button className="bg-primary hover:bg-primary/90">
                  Start KYB Verification
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

function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-blue-100 text-blue-600",
    under_review: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
    funded: "bg-purple-100 text-purple-600",
    completed: "bg-emerald-100 text-emerald-600",
  };
  return styles[status] || "bg-muted text-muted-foreground";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
