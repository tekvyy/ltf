"use client";

import Link from "next/link";
import {
  FileText,
  Upload,
  ClipboardCheck,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { Project, KybStatus } from "@/lib/types";

interface PendingTask {
  id: string;
  title: string;
  description: string;
  type: "document" | "milestone" | "proposal" | "kyb" | "project";
  priority: "high" | "medium" | "low";
  link: string;
  icon: React.ReactNode;
}

interface PendingTasksWidgetProps {
  projects: Project[];
  kybStatus: KybStatus;
}

export function PendingTasksWidget({ projects, kybStatus }: PendingTasksWidgetProps) {
  const tasks: PendingTask[] = [];

  // KYB related tasks
  if (kybStatus === "not_started") {
    tasks.push({
      id: "kyb-start",
      title: "Complete KYB Verification",
      description: "Start your business verification to unlock all features",
      type: "kyb",
      priority: "high",
      link: "/developer/dashboard/kyb",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    });
  } else if (kybStatus === "pending") {
    tasks.push({
      id: "kyb-pending",
      title: "Submit KYB Documents",
      description: "Upload remaining documents to complete verification",
      type: "kyb",
      priority: "high",
      link: "/developer/dashboard/kyb",
      icon: <Upload className="h-5 w-5 text-orange-500" />,
    });
  } else if (kybStatus === "rejected") {
    tasks.push({
      id: "kyb-rejected",
      title: "Resubmit KYB Documents",
      description: "Your verification was rejected. Please review and resubmit",
      type: "kyb",
      priority: "high",
      link: "/developer/dashboard/kyb",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    });
  }

  // Project related tasks
  projects.forEach((project) => {
    // Draft projects need to be completed
    if (project.status === "draft") {
      tasks.push({
        id: `project-draft-${project.id}`,
        title: `Complete "${project.title}"`,
        description: "Finish project details and upload required documents",
        type: "project",
        priority: "medium",
        link: `/developer/dashboard/projects/${project.id}/edit`,
        icon: <FileText className="h-5 w-5 text-blue-500" />,
      });
    }

    // Projects needing document uploads
    if (
      project.status !== "draft" &&
      project.documents_count !== undefined &&
      project.documents_count < 3
    ) {
      tasks.push({
        id: `docs-${project.id}`,
        title: `Upload documents for "${project.title}"`,
        description: `${3 - project.documents_count} documents still required`,
        type: "document",
        priority: "medium",
        link: `/developer/dashboard/projects/${project.id}?tab=documents`,
        icon: <Upload className="h-5 w-5 text-purple-500" />,
      });
    }

    // Approved projects might need milestone setup
    if (project.status === "approved" || project.status === "funded") {
      tasks.push({
        id: `milestones-${project.id}`,
        title: `Review milestones for "${project.title}"`,
        description: "Track and update project milestones",
        type: "milestone",
        priority: "low",
        link: `/developer/dashboard/projects/${project.id}?tab=milestones`,
        icon: <ClipboardCheck className="h-5 w-5 text-green-500" />,
      });
    }

    // Check for pending proposals
    if (project.status === "approved") {
      tasks.push({
        id: `proposals-${project.id}`,
        title: `Check proposals for "${project.title}"`,
        description: "Review lender proposals for your project",
        type: "proposal",
        priority: "medium",
        link: `/developer/dashboard/projects/${project.id}?tab=proposals`,
        icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
      });
    }
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Take only first 5 tasks
  const displayTasks = tasks.slice(0, 5);

  if (displayTasks.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Pending Tasks</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
          <p className="text-muted-foreground font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground">No pending tasks at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Pending Tasks</h2>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-600">
          {tasks.length} pending
        </span>
      </div>
      <div className="space-y-3">
        {displayTasks.map((task) => (
          <Link
            key={task.id}
            href={task.link}
            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group"
          >
            <div className="flex-shrink-0 mt-0.5">{task.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">{task.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  task.priority === "high"
                    ? "bg-red-100 text-red-600"
                    : task.priority === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {task.priority}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
            </div>
          </Link>
        ))}
      </div>
      {tasks.length > 5 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          +{tasks.length - 5} more tasks
        </p>
      )}
    </div>
  );
}
