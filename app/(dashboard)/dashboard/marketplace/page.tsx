"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ProjectCard, Project as CardProject } from "@/components/dashboard/project-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, AlertCircle, Loader2, Building2 } from "lucide-react";
import { lenderProfileService, lenderProjectsService, lenderProposalsService } from "@/lib/api";
import type { LenderProfile, KybStatus, LenderProject, LenderProposalStatus } from "@/lib/types/lender";
import Link from "next/link";
import { toast } from "sonner";

// Helper function to calculate loan duration in days from construction dates
function calculateLoanDuration(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 365; // Default to 1 year
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 365;
}

// Helper function to map LenderProject to ProjectCard's interface
function mapToCardProject(project: LenderProject): CardProject {
  const location = [project.city, project.country].filter(Boolean).join(", ") || "Location not set";
  const projectDuration = calculateLoanDuration(project.construction_start_date, project.construction_end_date);

  // Calculate price as min_investment, or 12.5% of loan_amount as fallback
  const minInvestment = typeof project.min_investment === 'string'
    ? parseFloat(project.min_investment)
    : project.min_investment;

  // Use cover_photo_url, or first photo from inline photos array
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

function KybBlockedMessage({ kybStatus }: { kybStatus: KybStatus }) {
  const getMessage = () => {
    switch (kybStatus) {
      case "not_started":
        return {
          title: "Complete KYB Verification",
          description: "You need to complete your business verification before you can browse and invest in projects.",
          buttonText: "Start Verification",
        };
      case "pending":
        return {
          title: "KYB Verification Pending",
          description: "Your documents have been submitted and are awaiting review. You'll be able to access the marketplace once verified.",
          buttonText: "View Status",
        };
      case "under_review":
        return {
          title: "KYB Under Review",
          description: "Our team is currently reviewing your documents. This usually takes 1-2 business days.",
          buttonText: "View Status",
        };
      case "rejected":
        return {
          title: "KYB Verification Rejected",
          description: "Your verification was rejected. Please review the feedback and resubmit your documents.",
          buttonText: "Resubmit Documents",
        };
      default:
        return {
          title: "Verification Required",
          description: "Please complete your business verification to access the marketplace.",
          buttonText: "Start Verification",
        };
    }
  };

  const message = getMessage();

  return (
    <div className="space-y-6">
      <DashboardHeader title="Marketplace" subtitle="Browse investment opportunities" />

      <div className="rounded-xl border bg-card p-8 shadow-sm text-center max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{message.title}</h2>
        <p className="text-muted-foreground mb-6">{message.description}</p>
        <Link href="/dashboard/kyb">
          <Button className="bg-primary hover:bg-primary/90">
            {message.buttonText}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [proposalStatuses, setProposalStatuses] = useState<Record<string, LenderProposalStatus>>({});
  const [profile, setProfile] = useState<LenderProfile | null>(null);
  const [projects, setProjects] = useState<LenderProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);

  // Fetch lender profile to check KYB status
  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const response = await lenderProfileService.getProfile();
        if (response.data?.data) {
          setProfile(response.data.data);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Fetch projects from API
  const fetchProjects = useCallback(async (search?: string) => {
    setIsLoadingProjects(true);
    try {
      const response = await lenderProjectsService.list({
        search: search || undefined,
        status: "listed",
        per_page: 50,
      });
      if (response.data?.success) {
        setProjects(response.data.data);
        setTotalProjects(response.data.meta?.total || response.data.data.length);
      } else if (response.error) {
        toast.error("Failed to load projects");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Failed to load projects");
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Fetch projects when KYB is approved
  useEffect(() => {
    if (profile?.kyb_status === "approved") {
      fetchProjects();
    }
  }, [profile?.kyb_status, fetchProjects]);

  // Debounced search
  useEffect(() => {
    if (profile?.kyb_status !== "approved") return;

    const timer = setTimeout(() => {
      fetchProjects(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, profile?.kyb_status, fetchProjects]);

  // Fetch proposal statuses for all projects
  const fetchProposalStatuses = useCallback(async () => {
    try {
      const response = await lenderProposalsService.list({ status: "all", per_page: 100 });
      if (response.data?.success) {
        const statuses: Record<string, LenderProposalStatus> = {};
        response.data.data.forEach((proposal) => {
          statuses[proposal.project.id.toString()] = proposal.status;
        });
        setProposalStatuses(statuses);
      }
    } catch (error) {
      console.error("Error fetching proposal statuses:", error);
    }
  }, []);

  useEffect(() => {
    if (profile?.kyb_status === "approved") {
      fetchProposalStatuses();
    }
  }, [fetchProposalStatuses, profile?.kyb_status]);

  // Map projects to card format
  const cardProjects = projects.map(mapToCardProject);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Marketplace" subtitle="Browse investment opportunities" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Marketplace" subtitle="Browse investment opportunities" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // KYB not approved - show blocked message
  const kybStatus = profile?.kyb_status || "not_started";
  if (kybStatus !== "approved") {
    return <KybBlockedMessage kybStatus={kybStatus} />;
  }

  // KYB approved - show marketplace
  return (
    <div className="space-y-6">
      <DashboardHeader title="Marketplace" subtitle="Browse investment opportunities" />

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoadingProjects ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading projects...
            </span>
          ) : (
            `Showing ${cardProjects.length} of ${totalProjects} projects`
          )}
        </p>
      </div>

      {/* Projects Grid */}
      {isLoadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : cardProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardProjects.map((project) => (
            <div key={project.id} className="bg-card rounded-xl border p-4 shadow-sm">
              <ProjectCard
                project={project}
                proposalStatus={proposalStatuses[project.id] || null}
              />
            </div>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Search className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <p className="text-muted-foreground">No projects found matching your search.</p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="text-primary mt-2"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Building2 className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects available</h3>
          <p className="text-muted-foreground">
            There are no investment opportunities available at the moment. Check back later.
          </p>
        </div>
      )}
    </div>
  );
}
