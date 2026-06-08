"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Building2, AlertCircle, Loader2 } from "lucide-react";
import { DeveloperHeader } from "@/components/developer/developer-header";
import { ProjectCard } from "@/components/developer/project-card";
import { ProjectStatus } from "@/components/developer/project-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { developerProfileService, projectsService } from "@/lib/api/developer";
import { Project, DeveloperProfile } from "@/lib/types/developer";
import { toast } from "sonner";

const statusFilters: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All Projects" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "funded", label: "Funded" },
  { value: "completed", label: "Completed" },
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const isKybApproved = profile?.kyb_status === "approved";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch profile first to check KYB status
      const profileResponse = await developerProfileService.getProfile();
      if (profileResponse.data?.success) {
        setProfile(profileResponse.data.data);

        // Only fetch projects if KYB is approved
        if (profileResponse.data.data.kyb_status === "approved") {
          const projectsResponse = await projectsService.list({
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: searchQuery || undefined,
          });
          if (projectsResponse.data?.success) {
            setProjects(projectsResponse.data.data);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isKybApproved) {
        fetchData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isKybApproved, fetchData]);

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await projectsService.delete(id);
      if (response.data?.success) {
        toast.success("Project deleted successfully");
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error(response.data?.message || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(null);
    }
  };

  // Loading state
  if (isLoading && !profile) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Projects" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // KYB not approved state
  if (!isKybApproved) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Projects" />
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Complete KYB Verification</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You need to complete your business verification before you can create and submit projects.
          </p>
          <Link href="/developer/dashboard/kyb">
            <Button className="bg-primary hover:bg-primary/90">
              Start KYB Verification
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Map project to card props
  const mapProjectToCardProps = (project: Project) => ({
    id: project.id,
    title: project.title,
    type: project.project_type.replace("_", " "),
    location: [project.city, project.country].filter(Boolean).join(", ") || "Location not set",
    fundingGoal: project.loan_amount,
    status: project.status,
    createdAt: project.created_at,
    imageUrl: project.cover_photo_url ?? undefined,
    vrTourLink: project.vr_tour_link,
    liveCameraLink: project.live_camera_link,
    onDelete: project.status === "draft" ? handleDeleteProject : undefined,
  });

  return (
    <div className="space-y-6">
      <DeveloperHeader title="Projects" />

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
            className="px-4 py-2 border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        {/* Create Button */}
        <Link href="/developer/dashboard/projects/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      {/* Loading indicator for filtering */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="relative">
              {isDeleting === project.id && (
                <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10 rounded-xl">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              <ProjectCard {...mapProjectToCardProps(project)} />
            </div>
          ))}
        </div>
      ) : !isLoading && searchQuery || statusFilter !== "all" ? (
        // No results from filter
        <div className="rounded-xl border bg-card p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No projects found</h2>
          <p className="text-muted-foreground mb-4">
            No projects match your search criteria. Try adjusting your filters.
          </p>
          <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
            Clear Filters
          </Button>
        </div>
      ) : !isLoading ? (
        // Empty state - no projects at all
        <div className="rounded-xl border bg-card p-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven&apos;t created any projects yet. Create your first project to start the funding process.
          </p>
          <Link href="/developer/dashboard/projects/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </Link>
        </div>
      ) : null}

      {/* Stats Summary */}
      {!isLoading && projects.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Project Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50">
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {projects.filter((p) => p.status === "submitted" || p.status === "under_review").length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-50">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter((p) => ["approved", "funded", "completed"].includes(p.status)).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50">
              <p className="text-sm text-muted-foreground">Total Loan Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                ${projects.reduce((sum, p) => sum + p.loan_amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
