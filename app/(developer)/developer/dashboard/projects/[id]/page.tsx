"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  Percent,
  Clock,
  Edit,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2,
  Milestone,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Image,
  FileCheck,
  X,
} from "lucide-react";
import { DeveloperHeader } from "@/components/developer/developer-header";
import { ProjectStatusBadge } from "@/components/developer/project-status-badge";
import { MilestoneStatusBadge } from "@/components/developer/milestone-status-badge";
import { ProjectProposalsTab } from "@/components/developer/project-proposals-tab";
import { DocumentUploadCard, DocumentStatus } from "@/components/developer/document-upload-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { projectsService, projectDocumentsService, milestonesService, projectPhotosService } from "@/lib/api/developer";
import {
  Project,
  Document,
  DocumentType,
  DocumentChecklistItem,
  ProjectMilestone,
  MilestoneStatistics,
  CreateMilestoneData,
  MilestoneProof,
  MilestoneProofType,
  ProjectPhoto,
  UploadProjectPhotoData,
} from "@/lib/types/developer";
import { toast } from "sonner";
import { ProjectPhotoUpload, PendingPhoto } from "@/components/developer/project-photo-upload";
import { ProjectPhotoGallery } from "@/components/developer/project-photo-gallery";

// Map document type to display info
const documentTypeInfo: Record<string, { title: string; description: string }> = {
  loan_drawings: {
    title: "Architectural Drawings",
    description: "Complete architectural and engineering plans for the project",
  },
  loan_cost_calculation: {
    title: "Cost Calculation",
    description: "Detailed budget breakdown and cost estimates",
  },
  loan_photos: {
    title: "Site Photos",
    description: "Current photos of the property/site",
  },
  loan_land_title: {
    title: "Land Title",
    description: "Proof of land ownership or control",
  },
  loan_bank_statement: {
    title: "Bank Statement",
    description: "Recent bank statements showing available funds",
  },
  loan_revenue_evidence: {
    title: "Revenue Evidence",
    description: "Evidence of business revenue and track record",
  },
};

// Map verification status to document status
const mapVerificationToDocStatus = (
  verificationStatus: string | undefined
): DocumentStatus => {
  if (!verificationStatus) return "not_uploaded";
  switch (verificationStatus) {
    case "approved":
      return "verified";
    case "rejected":
      return "rejected";
    case "pending":
    default:
      return "uploaded";
  }
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [activeTab, setActiveTab] = useState<"overview" | "photos" | "documents" | "milestones" | "proposals">("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [checklist, setChecklist] = useState<DocumentChecklistItem[]>([]);
  const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Milestone state
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [milestoneStats, setMilestoneStats] = useState<MilestoneStatistics | null>(null);
  const [editingMilestones, setEditingMilestones] = useState<CreateMilestoneData[]>([]);
  const [isEditingMilestones, setIsEditingMilestones] = useState(false);
  const [isSavingMilestones, setIsSavingMilestones] = useState(false);

  // Proof management state
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<number | null>(null);
  const [milestoneProofs, setMilestoneProofs] = useState<Record<number, MilestoneProof[]>>({});
  const [loadingProofs, setLoadingProofs] = useState<number | null>(null);
  const [completingMilestone, setCompletingMilestone] = useState<number | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState<number | null>(null);
  const [proofsList, setProofsList] = useState<{
    proof_type: MilestoneProofType;
    title: string;
    description: string;
    file: File | null;
  }[]>([{ proof_type: "photo", title: "", description: "", file: null }]);

  const fetchProject = useCallback(async () => {
    try {
      const response = await projectsService.get(projectId);
      if (response.data?.success) {
        setProject(response.data.data);
      } else {
        toast.error("Failed to load project");
        router.push("/developer/dashboard/projects");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
      router.push("/developer/dashboard/projects");
    }
  }, [projectId, router]);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await projectDocumentsService.list(projectId);
      if (response.data?.success) {
        setDocuments(response.data.data.documents);
        setChecklist(response.data.data.document_checklist);
        setAllRequiredUploaded(response.data.data.all_required_uploaded);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  }, [projectId]);

  const fetchMilestones = useCallback(async () => {
    try {
      const response = await milestonesService.list(projectId);
      if (response.data?.success) {
        setMilestones(response.data.data.milestones);
        setMilestoneStats(response.data.data.statistics);
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  }, [projectId]);

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await projectPhotosService.list(projectId);
      if (response.data?.success) {
        setPhotos(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  }, [projectId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProject(), fetchDocuments(), fetchMilestones(), fetchPhotos()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchProject, fetchDocuments, fetchMilestones, fetchPhotos]);

  const canEdit = project?.status === "draft" || project?.status === "rejected" || project?.status === "submitted";
  const canSubmit = project?.status === "draft";

  // Get document for a checklist item
  const getDocumentForType = (type: DocumentType): Document | undefined => {
    return documents.find((d) => d.document_type === type);
  };

  // Calculate progress
  const uploadedCount = checklist.filter((item) => item.uploaded).length;
  const progressPercentage = checklist.length > 0
    ? (uploadedCount / checklist.length) * 100
    : 0;
  const requiredRemaining = checklist.filter((item) => item.required && !item.uploaded).length;

  const handleUpload = async (docType: DocumentType, file: File) => {
    setUploadingDocType(docType);
    try {
      const response = await projectDocumentsService.upload(projectId, {
        document_type: docType,
        title: documentTypeInfo[docType]?.title || docType,
        file,
      });
      if (response.data?.success) {
        toast.success("Document uploaded successfully");
        await fetchDocuments();
      } else {
        toast.error(response.data?.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleRemove = async (docId: number) => {
    if (!confirm("Are you sure you want to remove this document?")) return;

    setDeletingDocId(docId);
    try {
      const response = await projectDocumentsService.delete(projectId, docId);
      if (response.data?.success) {
        toast.success("Document removed");
        await fetchDocuments();
      } else {
        toast.error(response.data?.message || "Failed to remove document");
      }
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error("Failed to remove document");
    } finally {
      setDeletingDocId(null);
    }
  };

  // Photo handlers
  const handleUploadPhotos = async (pendingPhotos: PendingPhoto[]) => {
    setIsUploadingPhotos(true);
    try {
      const photosToUpload: UploadProjectPhotoData[] = pendingPhotos.map((p) => ({
        file: p.file,
        title: p.title || undefined,
        is_featured: p.is_featured,
      }));

      const response = await projectPhotosService.upload(projectId, photosToUpload);
      if (response.data?.success) {
        toast.success(`${pendingPhotos.length} photo(s) uploaded`);
        fetchPhotos();
      } else {
        toast.error(response.data?.message || "Failed to upload photos");
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      throw error;
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleSetPhotoFeatured = async (photoId: number) => {
    try {
      const response = await projectPhotosService.update(projectId, photoId, { is_featured: true });
      if (response.data?.success) {
        toast.success("Cover photo updated");
        fetchPhotos();
      } else {
        toast.error("Failed to update cover photo");
      }
    } catch (error) {
      console.error("Error updating photo:", error);
      toast.error("Failed to update cover photo");
    }
  };

  const handleUpdatePhotoTitle = async (photoId: number, title: string) => {
    try {
      const response = await projectPhotosService.update(projectId, photoId, { title });
      if (response.data?.success) {
        toast.success("Photo title updated");
        fetchPhotos();
      } else {
        toast.error("Failed to update title");
      }
    } catch (error) {
      console.error("Error updating photo:", error);
      toast.error("Failed to update title");
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const response = await projectPhotosService.delete(projectId, photoId);
      if (response.data?.success) {
        toast.success("Photo deleted");
        fetchPhotos();
      } else {
        toast.error("Failed to delete photo");
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    }
  };

  const handleSubmitForReview = async () => {
    if (!allRequiredUploaded) {
      toast.error("Please upload all required documents first");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await projectsService.submit(projectId);
      if (response.data?.success) {
        toast.success("Project submitted for review");
        await fetchProject();
      } else {
        if (response.data?.missing_documents) {
          const missing = response.data.missing_documents.map((d) => d.label).join(", ");
          toast.error(`Missing documents: ${missing}`);
        } else {
          toast.error(response.data?.message || "Failed to submit project");
        }
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error("Failed to submit project");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Milestone management functions
  const startEditingMilestones = () => {
    if (milestones.length > 0) {
      setEditingMilestones(
        milestones.map((m) => ({
          title: m.title,
          description: m.description || "",
          amount: m.amount,
          due_date: m.due_date || "",
        }))
      );
    } else {
      setEditingMilestones([{ title: "", description: "", amount: 0, due_date: "" }]);
    }
    setIsEditingMilestones(true);
  };

  const cancelEditingMilestones = () => {
    setEditingMilestones([]);
    setIsEditingMilestones(false);
  };

  const addMilestone = () => {
    setEditingMilestones([
      ...editingMilestones,
      { title: "", description: "", amount: 0, due_date: "" },
    ]);
  };

  const removeMilestone = (index: number) => {
    setEditingMilestones(editingMilestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof CreateMilestoneData, value: string | number) => {
    const updated = [...editingMilestones];
    updated[index] = { ...updated[index], [field]: value };
    setEditingMilestones(updated);
  };

  const calculateMilestoneTotal = () => {
    return editingMilestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  };

  const saveMilestones = async () => {
    // Validate
    const emptyTitles = editingMilestones.some((m) => !m.title.trim());
    if (emptyTitles) {
      toast.error("All milestones must have a title");
      return;
    }

    const zeroAmounts = editingMilestones.some((m) => !m.amount || m.amount <= 0);
    if (zeroAmounts) {
      toast.error("All milestones must have an amount greater than 0");
      return;
    }

    const total = calculateMilestoneTotal();
    const loanAmount = project?.loan_amount || 0;
    if (Math.abs(total - loanAmount) > 0.01) {
      toast.error(`Total milestone amounts ($${total.toLocaleString()}) must equal loan amount ($${loanAmount.toLocaleString()})`);
      return;
    }

    setIsSavingMilestones(true);
    try {
      const response = await milestonesService.save(projectId, editingMilestones);
      if (response.data?.success) {
        toast.success("Milestones saved successfully");
        setIsEditingMilestones(false);
        await fetchMilestones();
      } else {
        toast.error(response.data?.message || "Failed to save milestones");
      }
    } catch (error) {
      console.error("Error saving milestones:", error);
      toast.error("Failed to save milestones");
    } finally {
      setIsSavingMilestones(false);
    }
  };

  // Proof management functions
  const fetchProofs = async (milestoneId: number) => {
    setLoadingProofs(milestoneId);
    try {
      const response = await milestonesService.listProofs(projectId, milestoneId);
      if (response.data?.success) {
        setMilestoneProofs((prev) => ({
          ...prev,
          [milestoneId]: response.data!.data.proofs,
        }));
      }
    } catch (error) {
      console.error("Error fetching proofs:", error);
    } finally {
      setLoadingProofs(null);
    }
  };

  const toggleMilestoneExpand = async (milestoneId: number) => {
    if (expandedMilestoneId === milestoneId) {
      setExpandedMilestoneId(null);
    } else {
      setExpandedMilestoneId(milestoneId);
      if (!milestoneProofs[milestoneId]) {
        await fetchProofs(milestoneId);
      }
    }
  };

  const resetCompleteDialog = () => {
    setProofsList([{ proof_type: "photo", title: "", description: "", file: null }]);
    setShowCompleteDialog(null);
  };

  const addProofToList = () => {
    setProofsList([...proofsList, { proof_type: "photo", title: "", description: "", file: null }]);
  };

  const removeProofFromList = (index: number) => {
    if (proofsList.length > 1) {
      setProofsList(proofsList.filter((_, i) => i !== index));
    }
  };

  const updateProofInList = (index: number, field: string, value: string | File | null) => {
    const updated = [...proofsList];
    updated[index] = { ...updated[index], [field]: value };
    setProofsList(updated);
  };

  const handleCompleteMilestone = async (milestoneId: number) => {
    // Validate all proofs have title and file
    const invalidProofs = proofsList.some((p) => !p.title || !p.file);
    if (invalidProofs) {
      toast.error("All proofs must have a title and file");
      return;
    }

    setCompletingMilestone(milestoneId);
    try {
      const proofsToUpload = proofsList.map((p) => ({
        proof_type: p.proof_type,
        title: p.title,
        description: p.description || undefined,
        file: p.file!,
      }));

      const response = await milestonesService.complete(projectId, milestoneId, proofsToUpload);
      if (response.data?.success) {
        toast.success("Milestone completed and submitted for review");
        resetCompleteDialog();
        await fetchMilestones();
      } else {
        toast.error(response.data?.message || "Failed to complete milestone");
      }
    } catch (error) {
      console.error("Error completing milestone:", error);
      toast.error("Failed to complete milestone");
    } finally {
      setCompletingMilestone(null);
    }
  };

  const proofTypeOptions: { value: MilestoneProofType; label: string }[] = [
    { value: "photo", label: "Photo" },
    { value: "invoice", label: "Invoice" },
    { value: "inspection_report", label: "Inspection Report" },
    { value: "bank_statement", label: "Bank Statement" },
    { value: "other", label: "Other Document" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Project Details" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Project Details" />
        <div className="rounded-xl border bg-card p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Project not found</h2>
          <Link href="/developer/dashboard/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeveloperHeader title="Project Details" />

      {/* Back Link */}
      <Link
        href="/developer/dashboard/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Projects
      </Link>

      {/* Project Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ProjectStatusBadge status={project.status} />
              <span className="text-sm text-muted-foreground capitalize">
                {project.project_type.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {[project.address, project.city, project.country]
                  .filter(Boolean)
                  .join(", ") || "Location not set"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {canEdit && (
              <Link href={`/developer/dashboard/projects/${project.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {project.status === "rejected" && project.rejection_reason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Project Rejected</h3>
              <p className="text-sm text-red-700 mt-1">{project.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "photos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Photos
            {photos.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                {photos.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("milestones")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "milestones"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Milestones
            {milestones.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                {milestones.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "documents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Loan Documents
            {requiredRemaining > 0 && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {requiredRemaining} required
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("proposals")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "proposals"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Loan Proposals
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">About This Project</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* VR Tour & Live Camera Links */}
            {(project.vr_tour_link || project.live_camera_link) && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <dl className="space-y-4">
                  {project.vr_tour_link && (
                    <div>
                      <dt className="text-sm text-muted-foreground">VR Tour</dt>
                      <dd className="font-medium text-sm break-all">{project.vr_tour_link}</dd>
                    </div>
                  )}
                  {project.live_camera_link && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Live Camera</dt>
                      <dd className="font-medium text-sm break-all">{project.live_camera_link}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Location Details */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Address</dt>
                  <dd className="font-medium">{project.address || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">City</dt>
                  <dd className="font-medium">{project.city || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Country</dt>
                  <dd className="font-medium">{project.country || "-"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financial Details
              </h2>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Loan Amount</dt>
                  <dd className="font-semibold">${project.loan_amount.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Min Investment</dt>
                  <dd className="font-medium">${project.min_investment.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd className="font-medium">{project.currency}</dd>
                </div>
                {project.construction_start_date && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Construction Start
                    </dt>
                    <dd className="font-medium">
                      {new Date(project.construction_start_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {project.construction_end_date && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Construction End
                    </dt>
                    <dd className="font-medium">
                      {new Date(project.construction_end_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Project Info */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Project Info
              </h2>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </dd>
                </div>
                {project.submitted_at && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd className="font-medium">
                      {new Date(project.submitted_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {project.approved_at && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Approved</dt>
                    <dd className="font-medium">
                      {new Date(project.approved_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <ProjectStatusBadge status={project.status} />
                  </dd>
                </div>
              </dl>
            </div>

            {/* Submit for Review CTA */}
            {canSubmit && (
              <div className="rounded-xl border bg-amber-50 border-amber-200 p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Ready to Submit?</h3>
                    <p className="text-sm text-amber-700 mt-1 mb-4">
                      Upload all required loan documents to submit this project for review.
                    </p>
                    <Button
                      onClick={() => setActiveTab("documents")}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "photos" && (
        <div className="space-y-6">
          {/* Photos Header */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Project Photos
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Showcase your project with photos. The cover photo will be displayed prominently.
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {photos.length}/10 photos
              </span>
            </div>

            {/* Cover Photo */}
            {photos.some((p) => p.is_featured) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Cover Photo</h3>
                <div className="relative aspect-video max-w-2xl rounded-xl overflow-hidden border-2 border-primary">
                  <img
                    src={photos.find((p) => p.is_featured)?.file_url}
                    alt="Cover photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Existing Photos Gallery */}
          {photos.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">All Photos</h3>
              <ProjectPhotoGallery
                photos={photos}
                isEditable={canEdit}
                onSetFeatured={canEdit ? handleSetPhotoFeatured : undefined}
                onUpdateTitle={canEdit ? handleUpdatePhotoTitle : undefined}
                onDelete={canEdit ? handleDeletePhoto : undefined}
              />
            </div>
          )}

          {/* Upload New Photos */}
          {canEdit && photos.length < 10 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Upload New Photos</h3>
              <ProjectPhotoUpload
                maxPhotos={10}
                existingPhotoCount={photos.length}
                onUpload={handleUploadPhotos}
                isUploading={isUploadingPhotos}
              />
            </div>
          )}

          {/* Empty State */}
          {photos.length === 0 && (
            <div className="rounded-xl border bg-card p-12 text-center">
              <Image className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Photos Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add photos to showcase your project to potential lenders.
              </p>
              {canEdit && (
                <p className="text-sm text-muted-foreground">
                  Use the upload section above to add photos.
                </p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-6">
            <h3 className="font-medium text-blue-800 mb-2">Photo Tips</h3>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>High-quality photos help attract more investor interest</li>
              <li>Include exterior views, interior shots, and site plans</li>
              <li>The cover photo will be displayed on the project listing</li>
              <li>Maximum 10 photos, 5MB each (JPG, PNG, WebP)</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-6">
          {/* Milestone Stats */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Milestone className="h-5 w-5 text-primary" />
                  Project Milestones
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Define payment milestones for your project. Total must equal the funding goal.
                </p>
              </div>
              {canEdit && !isEditingMilestones && (
                <Button
                  onClick={startEditingMilestones}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {milestones.length > 0 ? "Edit Milestones" : "Add Milestones"}
                </Button>
              )}
            </div>

            {milestoneStats && (
              <>
                {/* Progress Bar */}
                {milestoneStats.total_milestones > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <span className="text-sm font-medium">{milestoneStats.progress_percentage}%</span>
                    </div>
                    <Progress value={milestoneStats.progress_percentage} className="h-3" />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Milestones</p>
                    <p className="text-lg font-semibold">{milestoneStats.total_milestones}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-lg font-semibold text-green-600">{milestoneStats.completed_milestones}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Amount</p>
                    <p className="text-lg font-semibold text-green-600">${milestoneStats.paid_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loan Amount</p>
                    <p className="text-lg font-semibold">${milestoneStats.loan_amount.toLocaleString()}</p>
                  </div>
                </div>
              </>
            )}

            {milestoneStats && !milestoneStats.allocation_complete && milestones.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-700">
                  Milestone total (${milestoneStats.total_amount.toLocaleString()}) does not match loan amount (${milestoneStats.loan_amount.toLocaleString()})
                </p>
              </div>
            )}
          </div>

          {/* Editing Mode */}
          {isEditingMilestones ? (
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Edit Milestones</h3>
                <div className="text-sm">
                  <span className={calculateMilestoneTotal() === project?.loan_amount ? "text-green-600" : "text-amber-600"}>
                    Total: ${calculateMilestoneTotal().toLocaleString()}
                  </span>
                  <span className="text-muted-foreground mx-2">/</span>
                  <span className="text-muted-foreground">Loan: ${project?.loan_amount.toLocaleString()}</span>
                </div>
              </div>

              {editingMilestones.map((milestone, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Milestone {index + 1}</span>
                    </div>
                    {editingMilestones.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${index}`}>Title *</Label>
                      <Input
                        id={`title-${index}`}
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, "title", e.target.value)}
                        placeholder="e.g., Foundation Complete"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`amount-${index}`}>Amount ($) *</Label>
                        <Input
                          id={`amount-${index}`}
                          type="number"
                          value={milestone.amount || ""}
                          onChange={(e) => updateMilestone(index, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`due_date-${index}`}>Due Date</Label>
                        <Input
                          id={`due_date-${index}`}
                          type="date"
                          value={milestone.due_date || ""}
                          onChange={(e) => updateMilestone(index, "due_date", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={milestone.description || ""}
                      onChange={(e) => updateMilestone(index, "description", e.target.value)}
                      placeholder="Describe what will be completed in this milestone..."
                      className="h-20"
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addMilestone}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={cancelEditingMilestones}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={saveMilestones}
                  disabled={isSavingMilestones}
                >
                  {isSavingMilestones ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Milestones"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Milestone List */}
              {milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map((milestone, index) => {
                    const isExpanded = expandedMilestoneId === milestone.id;
                    const proofs = milestoneProofs[milestone.id] || [];
                    const isLoadingThisProofs = loadingProofs === milestone.id;

                    return (
                      <div
                        key={milestone.id}
                        className="rounded-xl border bg-card shadow-sm overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${
                                milestone.status === "paid" || milestone.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : milestone.status === "proof_submitted"
                                  ? "bg-amber-100 text-amber-700"
                                  : milestone.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {milestone.status === "paid" || milestone.status === "approved" ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-semibold">{milestone.title}</h3>
                                  <MilestoneStatusBadge status={milestone.status} />
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Amount:</span>{" "}
                                    <span className="font-medium">${milestone.amount.toLocaleString()}</span>
                                    <span className="text-muted-foreground ml-1">({milestone.percentage}%)</span>
                                  </div>
                                  {milestone.due_date && (
                                    <div>
                                      <span className="text-muted-foreground">Due:</span>{" "}
                                      <span className="font-medium">
                                        {new Date(milestone.due_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {milestone.proofs_count !== undefined && milestone.proofs_count > 0 && (
                                    <div className="text-blue-600">
                                      <FileCheck className="inline h-4 w-4 mr-1" />
                                      {milestone.proofs_count} proof(s)
                                    </div>
                                  )}
                                  {milestone.paid_at && (
                                    <div className="text-green-600">
                                      <CheckCircle2 className="inline h-4 w-4 mr-1" />
                                      Paid on {new Date(milestone.paid_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                {milestone.rejection_reason && (
                                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                    <p className="text-sm text-red-700">
                                      <strong>Rejection reason:</strong> {milestone.rejection_reason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 ml-4">
                              {milestone.can_complete && (
                                <Button
                                  size="sm"
                                  onClick={() => setShowCompleteDialog(milestone.id)}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Complete Milestone
                                </Button>
                              )}
                              {milestone.proofs_count !== undefined && milestone.proofs_count > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleMilestoneExpand(milestone.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {isExpanded ? "Hide" : "View"} Proofs
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Complete Milestone Dialog */}
                        {showCompleteDialog === milestone.id && (
                          <div className="border-t bg-muted p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-medium">Complete Milestone</h4>
                                <p className="text-sm text-muted-foreground">Upload proof(s) of completion to mark this milestone as done</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetCompleteDialog}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Proofs List */}
                            <div className="space-y-4">
                              {proofsList.map((proof, idx) => (
                                <div key={idx} className="p-4 bg-card border rounded-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-muted-foreground">Proof {idx + 1}</span>
                                    {proofsList.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeProofFromList(idx)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Proof Type *</Label>
                                      <select
                                        value={proof.proof_type}
                                        onChange={(e) => updateProofInList(idx, "proof_type", e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md text-sm bg-card"
                                      >
                                        {proofTypeOptions.map((opt) => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <Label>Title *</Label>
                                      <Input
                                        value={proof.title}
                                        onChange={(e) => updateProofInList(idx, "title", e.target.value)}
                                        placeholder="e.g., Foundation inspection report"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <Label>Description</Label>
                                    <Textarea
                                      value={proof.description}
                                      onChange={(e) => updateProofInList(idx, "description", e.target.value)}
                                      placeholder="Additional details..."
                                      className="h-16"
                                    />
                                  </div>
                                  <div className="mt-3">
                                    <Label>File *</Label>
                                    <Input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      onChange={(e) => updateProofInList(idx, "file", e.target.files?.[0] || null)}
                                    />
                                    {proof.file && (
                                      <p className="text-xs text-green-600 mt-1">Selected: {proof.file.name}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add More Button */}
                            <Button
                              variant="outline"
                              onClick={addProofToList}
                              className="w-full mt-4 border-dashed"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Another Proof
                            </Button>

                            {/* Submit Button */}
                            <div className="mt-6 flex justify-end gap-3">
                              <Button variant="outline" onClick={resetCompleteDialog}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleCompleteMilestone(milestone.id)}
                                disabled={completingMilestone === milestone.id}
                                className="bg-primary hover:bg-primary/90"
                              >
                                {completingMilestone === milestone.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Complete & Submit for Review
                                  </>
                                )}
                              </Button>
                            </div>

                            <p className="text-xs text-muted-foreground mt-4">
                              PDF, JPG, PNG, DOC, DOCX files accepted (max 10MB each)
                            </p>
                          </div>
                        )}

                        {/* Proofs List */}
                        {isExpanded && (
                          <div className="border-t bg-muted p-6">
                            <h4 className="font-medium mb-4">Submitted Proofs</h4>
                            {isLoadingThisProofs ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : proofs.length > 0 ? (
                              <div className="space-y-3">
                                {proofs.map((proof) => (
                                  <div
                                    key={proof.id}
                                    className="flex items-center justify-between p-4 bg-card rounded-lg border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-muted rounded">
                                        <Image className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{proof.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {proof.proof_type_label} • {proof.file_name}
                                        </p>
                                        {proof.description && (
                                          <p className="text-xs text-muted-foreground mt-1">{proof.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    <a
                                      href={proof.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      View
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No proofs submitted yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border bg-card p-12 text-center">
                  <Milestone className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Milestones Defined</h3>
                  <p className="text-muted-foreground mb-4">
                    Define payment milestones to track project progress and receive payments.
                  </p>
                  {canEdit && (
                    <Button onClick={startEditingMilestones} className="bg-primary hover:bg-primary/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Milestones
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Info Box */}
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-6">
            <h3 className="font-medium text-blue-800 mb-2">About Milestones</h3>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Milestones define the payment schedule for your project</li>
              <li>Total milestone amounts must equal your funding goal</li>
              <li>You&apos;ll need to submit proof of completion for each milestone</li>
              <li>Payments are released after milestone approval</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* Document Progress */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Loan Application Documents</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload the required documents to submit your project for review
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {uploadedCount} of {checklist.length} uploaded
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />

            {allRequiredUploaded ? (
              <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-700">
                  All required documents uploaded. You can now submit your project for review.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-4">
                {requiredRemaining} required documents remaining
              </p>
            )}
          </div>

          {/* Document Upload Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {checklist.map((item) => {
              const doc = getDocumentForType(item.type);
              const info = documentTypeInfo[item.type] || { title: item.label, description: "" };
              const isUploading = uploadingDocType === item.type;
              const isDeleting = doc && deletingDocId === doc.id;

              let status: DocumentStatus = "not_uploaded";
              if (isUploading) {
                status = "uploading";
              } else if (doc) {
                status = mapVerificationToDocStatus(doc.verification_status);
              }

              return (
                <div key={item.type} className="relative">
                  {isDeleting && (
                    <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10 rounded-xl">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <DocumentUploadCard
                    title={info.title}
                    description={info.description}
                    required={item.required}
                    status={status}
                    fileName={doc?.file_name}
                    rejectionReason={doc?.rejection_reason || undefined}
                    acceptedFormats={item.type === "loan_photos" ? "JPG, PNG" : "PDF, JPG, PNG"}
                    onUpload={(file) => handleUpload(item.type, file)}
                    onRemove={() => doc && handleRemove(doc.id)}
                  />
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          {canSubmit && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSubmitForReview}
                disabled={!allRequiredUploaded || isSubmitting}
                className="bg-primary hover:bg-primary/90 disabled:bg-muted"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Project for Review
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-6">
            <h3 className="font-medium text-blue-800 mb-2">What happens after submission?</h3>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Your project and documents will be reviewed by our team</li>
              <li>Review typically takes 2-3 business days</li>
              <li>You&apos;ll be notified once the review is complete</li>
              <li>If approved, your project will be listed for lender funding</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === "proposals" && (
        <ProjectProposalsTab projectId={String(projectId)} />
      )}
    </div>
  );
}
