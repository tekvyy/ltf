"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Loader2,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { DeveloperHeader } from "@/components/developer/developer-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { projectsService, projectPhotosService } from "@/lib/api/developer";
import { Project, ProjectType, UpdateProjectRequest, ProjectPhoto, UploadProjectPhotoData } from "@/lib/types/developer";
import { toast } from "sonner";
import { ProjectPhotoUpload, PendingPhoto } from "@/components/developer/project-photo-upload";
import { ProjectPhotoGallery } from "@/components/developer/project-photo-gallery";

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed-Use" },
  { value: "industrial", label: "Industrial" },
  { value: "land", label: "Land" },
];

interface ProjectFormData {
  title: string;
  projectType: ProjectType | "";
  description: string;
  vrTourLink: string;
  liveCameraLink: string;
  address: string;
  city: string;
  country: string;
  loanAmount: string;
  minInvestment: string;
  currency: string;
  constructionStartDate: string;
  constructionEndDate: string;
}

type ProjectFormErrors = {
  [K in keyof ProjectFormData]?: string;
};

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    projectType: "",
    description: "",
    vrTourLink: "",
    liveCameraLink: "",
    address: "",
    city: "",
    country: "",
    loanAmount: "",
    minInvestment: "",
    currency: "USD",
    constructionStartDate: "",
    constructionEndDate: "",
  });
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

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
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const response = await projectsService.get(projectId);
        if (response.data?.success) {
          const p = response.data.data;
          setProject(p);

          // Check if project can be edited
          if (p.status !== "draft" && p.status !== "rejected" && p.status !== "submitted") {
            toast.error("This project cannot be edited");
            router.push(`/developer/dashboard/projects/${projectId}`);
            return;
          }

          // Populate form data
          setFormData({
            title: p.title,
            projectType: p.project_type,
            description: p.description || "",
            vrTourLink: p.vr_tour_link || "",
            liveCameraLink: p.live_camera_link || "",
            address: p.address || "",
            city: p.city || "",
            country: p.country || "",
            loanAmount: p.loan_amount.toString(),
            minInvestment: p.min_investment.toString(),
            currency: p.currency || "USD",
            constructionStartDate: p.construction_start_date || "",
            constructionEndDate: p.construction_end_date || "",
          });

          // Fetch photos
          fetchPhotos();
        } else {
          toast.error("Failed to load project");
          router.push("/developer/dashboard/projects");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Failed to load project");
        router.push("/developer/dashboard/projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router, fetchPhotos]);

  const updateFormData = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ProjectFormErrors = {};

    if (!formData.title.trim()) newErrors.title = "Project title is required";
    if (!formData.projectType) newErrors.projectType = "Project type is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.loanAmount) newErrors.loanAmount = "Loan amount is required";
    if (!formData.minInvestment) newErrors.minInvestment = "Minimum investment is required";
    if (!formData.currency) newErrors.currency = "Currency is required";
    if (!formData.constructionStartDate) newErrors.constructionStartDate = "Construction start date is required";
    if (!formData.constructionEndDate) newErrors.constructionEndDate = "Construction end date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSetFeatured = async (photoId: number) => {
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

  const handleUpdateTitle = async (photoId: number, title: string) => {
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateProjectRequest = {
        title: formData.title,
        description: formData.description,
        project_type: formData.projectType as ProjectType,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        loan_amount: parseFloat(formData.loanAmount),
        min_investment: parseFloat(formData.minInvestment),
        currency: formData.currency,
        construction_start_date: formData.constructionStartDate,
        construction_end_date: formData.constructionEndDate,
        ...(formData.vrTourLink ? { vr_tour_link: formData.vrTourLink } : {}),
        ...(formData.liveCameraLink ? { live_camera_link: formData.liveCameraLink } : {}),
      };

      const response = await projectsService.update(projectId, updateData);
      if (response.data?.success) {
        toast.success("Project updated successfully");
        router.push(`/developer/dashboard/projects/${projectId}`);
      } else {
        toast.error(response.data?.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Edit Project" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Edit Project" />
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
      <DeveloperHeader title="Edit Project" />

      {/* Back Link */}
      <Link
        href={`/developer/dashboard/projects/${projectId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Project Details
      </Link>

      {/* Rejection Notice */}
      {project.status === "rejected" && project.rejection_reason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Project Rejected</h3>
              <p className="text-sm text-red-700 mt-1">{project.rejection_reason}</p>
              <p className="text-sm text-red-600 mt-2">
                Please address the issues and resubmit your project.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Basic Information
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Update the basic details about your project.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Sunset Heights Residential Complex"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="projectType">Project Type *</Label>
              <select
                id="projectType"
                value={formData.projectType}
                onChange={(e) => updateFormData("projectType", e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary",
                  errors.projectType ? "border-red-500" : "border-input"
                )}
              >
                <option value="">Select project type</option>
                {projectTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.projectType && (
                <p className="text-sm text-red-500 mt-1">{errors.projectType}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of your project..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                className={cn(
                  "min-h-[120px]",
                  errors.description ? "border-red-500" : ""
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="vrTourLink">VR Tour Link</Label>
              <Input
                id="vrTourLink"
                type="url"
                placeholder="e.g., https://example.com/vr-tour"
                value={formData.vrTourLink}
                onChange={(e) => updateFormData("vrTourLink", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="liveCameraLink">Live Camera Link</Label>
              <Input
                id="liveCameraLink"
                type="url"
                placeholder="e.g., https://example.com/live-camera"
                value={formData.liveCameraLink}
                onChange={(e) => updateFormData("liveCameraLink", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Project Photos */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Project Photos
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Add photos to showcase your project. The cover photo will be displayed prominently.
          </p>

          <div className="space-y-6">
            {/* Existing photos */}
            {photos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Current Photos ({photos.length}/10)
                </h3>
                <ProjectPhotoGallery
                  photos={photos}
                  isEditable={true}
                  onSetFeatured={handleSetFeatured}
                  onUpdateTitle={handleUpdateTitle}
                  onDelete={handleDeletePhoto}
                />
              </div>
            )}

            {/* Upload new photos */}
            {photos.length < 10 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Add More Photos
                </h3>
                <ProjectPhotoUpload
                  maxPhotos={10}
                  existingPhotoCount={photos.length}
                  onUpload={handleUploadPhotos}
                  isUploading={isUploadingPhotos}
                />
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Project Location
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Where is your project located?
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g., Sydney"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  placeholder="e.g., Australia"
                  value={formData.country}
                  onChange={(e) => updateFormData("country", e.target.value)}
                  className={errors.country ? "border-red-500" : ""}
                />
                {errors.country && (
                  <p className="text-sm text-red-500 mt-1">{errors.country}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Details
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Update the financial information for your project.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="loanAmount">Loan Amount *</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  placeholder="e.g., 5000000"
                  value={formData.loanAmount}
                  onChange={(e) => updateFormData("loanAmount", e.target.value)}
                  className={errors.loanAmount ? "border-red-500" : ""}
                />
                {errors.loanAmount && (
                  <p className="text-sm text-red-500 mt-1">{errors.loanAmount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="minInvestment">Minimum Investment *</Label>
                <Input
                  id="minInvestment"
                  type="number"
                  placeholder="e.g., 1000"
                  value={formData.minInvestment}
                  onChange={(e) => updateFormData("minInvestment", e.target.value)}
                  className={errors.minInvestment ? "border-red-500" : ""}
                />
                {errors.minInvestment && (
                  <p className="text-sm text-red-500 mt-1">{errors.minInvestment}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => updateFormData("currency", e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.currency ? "border-red-500" : "border-input"
                  )}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
                {errors.currency && (
                  <p className="text-sm text-red-500 mt-1">{errors.currency}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="constructionStartDate">Construction Start Date *</Label>
                <Input
                  id="constructionStartDate"
                  type="date"
                  value={formData.constructionStartDate}
                  onChange={(e) => updateFormData("constructionStartDate", e.target.value)}
                  className={errors.constructionStartDate ? "border-red-500" : ""}
                />
                {errors.constructionStartDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.constructionStartDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="constructionEndDate">Construction End Date *</Label>
                <Input
                  id="constructionEndDate"
                  type="date"
                  value={formData.constructionEndDate}
                  onChange={(e) => updateFormData("constructionEndDate", e.target.value)}
                  className={errors.constructionEndDate ? "border-red-500" : ""}
                />
                {errors.constructionEndDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.constructionEndDate}</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Construction Timeline:</strong> Provide accurate start and end dates for your construction project.
                This helps lenders understand the project duration and plan their investment accordingly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Link href={`/developer/dashboard/projects/${projectId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
