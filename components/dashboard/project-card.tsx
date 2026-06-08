import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, XCircle, Clock, MapPin, ArrowRight } from "lucide-react";
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
  const formatPrice = (value: number) =>
    `$${value.toLocaleString("en-US")}`;

  const getStatusBadge = () => {
    if (!proposalStatus) return null;

    const base =
      "absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm";

    switch (proposalStatus) {
      case "accepted_by_developer":
      case "signed_by_developer":
      case "signed_by_lender":
        return (
          <div className={`${base} bg-emerald-600/90`}>
            <CheckCircle2 className="h-3 w-3" />
            Accepted
          </div>
        );
      case "loan_term_fully_executed":
        return (
          <div className={`${base} bg-emerald-700/90`}>
            <CheckCircle2 className="h-3 w-3" />
            Active
          </div>
        );
      case "rejected_by_developer":
        return (
          <div className={`${base} bg-destructive/90`}>
            <XCircle className="h-3 w-3" />
            Rejected
          </div>
        );
      case "submitted_by_lender":
      case "under_review_by_developer":
        return (
          <div className={`${base} bg-amber-500/90`}>
            <Clock className="h-3 w-3" />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated-lg">
      {/* Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {project.coverImageUrl ? (
          <Image
            src={project.coverImageUrl}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {getStatusBadge()}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-1 font-semibold leading-snug">{project.name}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.location}</span>
          </p>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-auto space-y-3 pt-1">
          <div className="flex items-center justify-between rounded-lg bg-muted/70 px-3 py-2">
            <div>
              <p className="text-[11px] text-muted-foreground">Loan amount</p>
              <p className="tnum text-sm font-semibold text-primary">
                {formatPrice(project.loanValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Duration</p>
              <p className="tnum text-sm font-medium">{project.projectDuration} days</p>
            </div>
          </div>

          <Link href={`/dashboard/marketplace/${project.id}`} className="block">
            <Button className="w-full">
              View details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
