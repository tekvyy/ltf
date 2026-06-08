import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { LenderProposalStatus } from "@/lib/types/lender";

export interface Project {
  id: string;
  name: string;
  location: string;
  description: string;
  loanValue: number;
  projectDuration: number;
  coverImageUrl?: string;
}

interface ProjectCardProps {
  project: Project;
  proposalStatus?: LenderProposalStatus | null;
}

export function ProjectCard({ project, proposalStatus }: ProjectCardProps) {
  console.log('project-card',project);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPrice = (value: number) => {
    return `$ ${value.toLocaleString("en-US").replace(/,/g, " ")}`;
  };

  const getStatusBadge = () => {
    if (!proposalStatus) return null;

    switch (proposalStatus) {
      case "accepted_by_developer":
      case "signed_by_developer":
      case "signed_by_lender":
        return (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Accepted
          </div>
        );
      case "loan_term_fully_executed":
        return (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </div>
        );
      case "rejected_by_developer":
        return (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
            <XCircle className="h-3 w-3" />
            Rejected
          </div>
        );
      case "submitted_by_lender":
      case "under_review_by_developer":
        return (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
            <Clock className="h-3 w-3" />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden shadow-none border-none h-full">
      <CardContent className="flex flex-col h-full gap-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {project.coverImageUrl ? (
            <Image
              src={project.coverImageUrl}
              alt={project.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {getStatusBadge()}
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">
              {project.name} | {project.location}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Requested Loan Amount</span>
          <span className="text-sm font-bold text-primary">
            {formatPrice(project.loanValue)}
          </span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Project Duration:</span>
            <span className="font-medium text-primary">
              {project.projectDuration} days
            </span>
          </div>
        </div>

        <Link href={`/dashboard/marketplace/${project.id}`} className="mt-auto">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white text-sm">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
