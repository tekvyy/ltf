"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Send,
  Eye,
  Building2,
  Sparkles,
} from "lucide-react";
import type { Project } from "@/lib/types";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: "created" | "submitted" | "approved" | "rejected" | "funded" | "review" | "completed";
  projectId: number;
  projectTitle: string;
}

interface RecentActivityFeedProps {
  projects: Project[];
}

export function RecentActivityFeed({ projects }: RecentActivityFeedProps) {
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    projects.forEach((project) => {
      // Project created
      items.push({
        id: `created-${project.id}`,
        title: "Project Created",
        description: `"${project.title}" was created`,
        timestamp: new Date(project.created_at),
        type: "created",
        projectId: project.id,
        projectTitle: project.title,
      });

      // Project submitted
      if (project.submitted_at) {
        items.push({
          id: `submitted-${project.id}`,
          title: "Project Submitted",
          description: `"${project.title}" submitted for review`,
          timestamp: new Date(project.submitted_at),
          type: "submitted",
          projectId: project.id,
          projectTitle: project.title,
        });
      }

      // Project approved
      if (project.approved_at) {
        items.push({
          id: `approved-${project.id}`,
          title: "Project Approved",
          description: `"${project.title}" has been approved`,
          timestamp: new Date(project.approved_at),
          type: "approved",
          projectId: project.id,
          projectTitle: project.title,
        });
      }

      // Project funded
      if (project.funded_at) {
        items.push({
          id: `funded-${project.id}`,
          title: "Project Funded",
          description: `"${project.title}" has been fully funded`,
          timestamp: new Date(project.funded_at),
          type: "funded",
          projectId: project.id,
          projectTitle: project.title,
        });
      }

      // Project rejected
      if (project.status === "rejected" && project.rejection_reason) {
        items.push({
          id: `rejected-${project.id}`,
          title: "Project Rejected",
          description: `"${project.title}" requires attention`,
          timestamp: new Date(project.updated_at),
          type: "rejected",
          projectId: project.id,
          projectTitle: project.title,
        });
      }

      // Under review
      if (project.status === "under_review") {
        items.push({
          id: `review-${project.id}`,
          title: "Under Review",
          description: `"${project.title}" is being reviewed`,
          timestamp: new Date(project.updated_at),
          type: "review",
          projectId: project.id,
          projectTitle: project.title,
        });
      }

      // Completed
      if (project.status === "completed") {
        items.push({
          id: `completed-${project.id}`,
          title: "Project Completed",
          description: `"${project.title}" has been completed`,
          timestamp: new Date(project.updated_at),
          type: "completed",
          projectId: project.id,
          projectTitle: project.title,
        });
      }
    });

    // Sort by timestamp descending (most recent first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return items.slice(0, 8);
  }, [projects]);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case "created":
        return <Building2 className={`${iconClass} text-blue-500`} />;
      case "submitted":
        return <Send className={`${iconClass} text-indigo-500`} />;
      case "approved":
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case "rejected":
        return <XCircle className={`${iconClass} text-red-500`} />;
      case "funded":
        return <DollarSign className={`${iconClass} text-emerald-500`} />;
      case "review":
        return <Eye className={`${iconClass} text-yellow-500`} />;
      case "completed":
        return <Sparkles className={`${iconClass} text-purple-500`} />;
      default:
        return <FileText className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "created":
        return "bg-blue-100 border-blue-200";
      case "submitted":
        return "bg-indigo-100 border-indigo-200";
      case "approved":
        return "bg-green-100 border-green-200";
      case "rejected":
        return "bg-red-100 border-red-200";
      case "funded":
        return "bg-emerald-100 border-emerald-200";
      case "review":
        return "bg-yellow-100 border-yellow-200";
      case "completed":
        return "bg-purple-100 border-purple-200";
      default:
        return "bg-muted border-border";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    }
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <p className="text-muted-foreground font-medium">No activity yet</p>
          <p className="text-sm text-muted-foreground">
            Your project activities will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <Link
          href="/developer/dashboard/projects"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-muted" />

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <Link
              key={activity.id}
              href={`/developer/dashboard/projects/${activity.projectId}`}
              className="relative flex items-start gap-4 group"
            >
              {/* Timeline dot */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${getActivityColor(
                  activity.type
                )} transition-transform group-hover:scale-110`}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    {activity.title}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {activity.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
