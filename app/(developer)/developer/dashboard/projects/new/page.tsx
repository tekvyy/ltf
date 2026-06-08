"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  MapPin,
  DollarSign,
  FileCheck,
  Loader2,
  ImageIcon,
  Star,
  X,
  Calendar,
} from "lucide-react";
import { DeveloperHeader } from "@/components/developer/developer-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { projectsService, projectPhotosService } from "@/lib/api/developer";
import { ProjectType, CreateProjectRequest, UploadProjectPhotoData } from "@/lib/types/developer";
import { toast } from "sonner";

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed-Use" },
  { value: "industrial", label: "Industrial" },
  { value: "land", label: "Land" },
];

const steps = [
  { id: 1, title: "Basic Info", icon: Building2 },
  { id: 2, title: "Photos", icon: ImageIcon },
  { id: 3, title: "Location", icon: MapPin },
  { id: 4, title: "Financials", icon: DollarSign },
  { id: 5, title: "Review", icon: FileCheck },
];

interface PendingPhoto {
  id: string;
  file: File;
  preview: string;
  title: string;
  is_featured: boolean;
}

const ACCEPTED_FORMATS = ".jpg,.jpeg,.png,.webp";
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_PHOTOS = 10;

interface ProjectFormData {
  // Step 1: Basic Info
  title: string;
  projectType: ProjectType | "";
  description: string;
  vrTourLink: string;
  liveCameraLink: string;
  // Step 2: Location
  address: string;
  city: string;
  country: string;
  // Step 3: Financials
  loanAmount: string;
  minInvestment: string;
  currency: string;
  constructionStartDate: string;
  constructionEndDate: string;
}

type ProjectFormErrors = {
  [K in keyof ProjectFormData]?: string;
};

const initialFormData: ProjectFormData = {
  title: "",
  projectType: "",
  description: "",
  vrTourLink: "",
  liveCameraLink: "",
  address: "",
  city: "",
  country: "United Kingdom",
  loanAmount: "",
  minInvestment: "",
  currency: "USD",
  constructionStartDate: "",
  constructionEndDate: "",
};

export default function CreateProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateFormData = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Photo handling functions
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return `${file.name}: Invalid format. Only JPG, PNG, and WebP are allowed.`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `${file.name}: File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const addPhotos = (files: FileList | File[]) => {
    setPhotoError(null);
    const fileArray = Array.from(files);
    const remainingSlots = MAX_PHOTOS - pendingPhotos.length;

    if (fileArray.length > remainingSlots) {
      setPhotoError(`You can only add ${remainingSlots} more photo(s). Maximum ${MAX_PHOTOS} photos per project.`);
      return;
    }

    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      setPhotoError(validationErrors.join("\n"));
      return;
    }

    const newPhotos: PendingPhoto[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
      title: "",
      is_featured: pendingPhotos.length === 0 && index === 0,
    }));

    setPendingPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPendingPhotos((prev) => {
      const photoToRemove = prev.find((p) => p.id === id);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      const updated = prev.filter((p) => p.id !== id);
      // If we removed the featured photo, make the first one featured
      if (photoToRemove?.is_featured && updated.length > 0) {
        updated[0].is_featured = true;
      }
      return updated;
    });
  };

  const updatePhotoTitle = (id: string, title: string) => {
    setPendingPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title } : p))
    );
  };

  const setPhotoFeatured = (id: string) => {
    setPendingPhotos((prev) =>
      prev.map((p) => ({ ...p, is_featured: p.id === id }))
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addPhotos(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addPhotos(files);
    }
    // Reset input
    e.target.value = "";
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ProjectFormErrors = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = "Project title is required";
      if (!formData.projectType) newErrors.projectType = "Project type is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
    } else if (step === 2) {
      // Photos step - optional, no validation required
    } else if (step === 3) {
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.country.trim()) newErrors.country = "Country is required";
    } else if (step === 4) {
      if (!formData.loanAmount) newErrors.loanAmount = "Loan amount is required";
      if (!formData.minInvestment) newErrors.minInvestment = "Minimum investment is required";
      if (!formData.currency) newErrors.currency = "Currency is required";
      if (!formData.constructionStartDate) newErrors.constructionStartDate = "Construction start date is required";
      if (!formData.constructionEndDate) newErrors.constructionEndDate = "Construction end date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const buildProjectRequest = (): CreateProjectRequest => {
    return {
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
  };

  const uploadPendingPhotos = async (projectId: number) => {
    if (pendingPhotos.length === 0) return;

    const photosToUpload: UploadProjectPhotoData[] = pendingPhotos.map((p) => ({
      file: p.file,
      title: p.title || undefined,
      is_featured: p.is_featured,
    }));

    try {
      const response = await projectPhotosService.upload(projectId, photosToUpload);
      if (response.data?.success) {
        toast.success(`${pendingPhotos.length} photo(s) uploaded`);
      } else {
        toast.error("Some photos failed to upload");
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    }

    // Cleanup previews
    pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const response = await projectsService.create(buildProjectRequest());
      if (response.data?.success) {
        const projectId = response.data.data.id;

        // Upload photos if any
        if (pendingPhotos.length > 0) {
          await uploadPendingPhotos(projectId);
        }

        toast.success("Project saved as draft");
        router.push("/developer/dashboard/projects");
      } else {
        toast.error(response.data?.message || "Failed to save project");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await projectsService.create(buildProjectRequest());
      if (response.data?.success) {
        const projectId = response.data.data.id;

        // Upload photos if any
        if (pendingPhotos.length > 0) {
          await uploadPendingPhotos(projectId);
        }

        toast.success("Project created successfully");
        // Navigate to project details page to upload documents
        router.push(`/developer/dashboard/projects/${projectId}`);
      } else {
        toast.error(response.data?.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DeveloperHeader title="Create New Project" />

      {/* Back Link */}
      <Link
        href="/developer/dashboard/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Projects
      </Link>

      {/* Progress Steps */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center flex-1",
                  index < steps.length - 1 && "relative"
                )}
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-1/2 w-full h-0.5",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={cn(
                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isCompleted
                      ? "bg-primary text-white"
                      : isCurrent
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "text-xs mt-2 text-center",
                    isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Basic Information</h2>
              <p className="text-sm text-muted-foreground">
                Provide the basic details about your project.
              </p>
            </div>

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
        )}

        {/* Step 2: Photos */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Project Photos</h2>
              <p className="text-sm text-muted-foreground">
                Upload photos of your project. The first photo will be used as the cover image.
              </p>
            </div>

            {/* Photo error */}
            {photoError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 whitespace-pre-line">{photoError}</p>
              </div>
            )}

            {/* Drop zone */}
            {pendingPhotos.length < MAX_PHOTOS && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-orange-50"
                    : "border-border hover:border-border bg-card"
                )}
                onClick={() => document.getElementById("photo-input")?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="photo-input"
                  type="file"
                  className="hidden"
                  accept={ACCEPTED_FORMATS}
                  multiple
                  onChange={handleFileSelect}
                />
                <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="text-primary font-medium">Click to upload</span> or
                  drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP (max {MAX_SIZE_MB}MB each) - Up to {MAX_PHOTOS} photos
                </p>
              </div>
            )}

            {/* Photos grid */}
            {pendingPhotos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {pendingPhotos.length}/{MAX_PHOTOS} photos selected
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
                      setPendingPhotos([]);
                    }}
                  >
                    Clear all
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pendingPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "relative rounded-lg border-2 overflow-hidden bg-muted",
                        photo.is_featured ? "border-primary" : "border-border"
                      )}
                    >
                      {/* Image preview */}
                      <div className="aspect-square relative">
                        <img
                          src={photo.preview}
                          alt={photo.title || "Photo preview"}
                          className="w-full h-full object-cover"
                        />

                        {/* Featured badge */}
                        {photo.is_featured && (
                          <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Cover
                          </div>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {!photo.is_featured && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7 bg-card/90 hover:bg-card"
                              onClick={() => setPhotoFeatured(photo.id)}
                              title="Set as cover photo"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 bg-card/90 hover:bg-red-50 hover:text-red-600"
                            onClick={() => removePhoto(photo.id)}
                            title="Remove photo"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Title input */}
                      <div className="p-2">
                        <Input
                          type="text"
                          placeholder="Add title (optional)"
                          value={photo.title}
                          onChange={(e) => updatePhotoTitle(photo.id, e.target.value)}
                          className="text-sm h-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> High-quality photos help attract more investors.
                Include exterior views, interior shots, and site plans if available.
                Photos will be uploaded when you save the project.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Project Location</h2>
              <p className="text-sm text-muted-foreground">
                Where is your project located?
              </p>
            </div>

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
        )}

        {/* Step 4: Financials */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Financial Details</h2>
              <p className="text-sm text-muted-foreground">
                Provide the financial information for your project.
              </p>
            </div>

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
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Review Your Project</h2>
              <p className="text-sm text-muted-foreground">
                Please review all the information before saving.
              </p>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Basic Information
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit
                  </Button>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Title</dt>
                    <dd className="font-medium">{formData.title}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium capitalize">{formData.projectType.replace("_", " ")}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Description</dt>
                    <dd className="font-medium">{formData.description}</dd>
                  </div>
                  {formData.vrTourLink && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">VR Tour Link</dt>
                      <dd className="font-medium">{formData.vrTourLink}</dd>
                    </div>
                  )}
                  {formData.liveCameraLink && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Live Camera Link</dt>
                      <dd className="font-medium">{formData.liveCameraLink}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Photos */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Project Photos
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(2)}
                  >
                    Edit
                  </Button>
                </div>
                {pendingPhotos.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {pendingPhotos.slice(0, 4).map((photo) => (
                      <div
                        key={photo.id}
                        className={cn(
                          "relative w-16 h-16 rounded-lg overflow-hidden",
                          photo.is_featured && "ring-2 ring-primary"
                        )}
                      >
                        <img
                          src={photo.preview}
                          alt={photo.title || "Photo"}
                          className="w-full h-full object-cover"
                        />
                        {photo.is_featured && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-[8px] text-center py-0.5">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                    {pendingPhotos.length > 4 && (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                        +{pendingPhotos.length - 4}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No photos added (optional)</p>
                )}
              </div>

              {/* Location */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(3)}
                  >
                    Edit
                  </Button>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="font-medium">{formData.address}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">City</dt>
                    <dd className="font-medium">{formData.city}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Country</dt>
                    <dd className="font-medium">{formData.country}</dd>
                  </div>
                </dl>
              </div>

              {/* Financials */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Financial Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(4)}
                  >
                    Edit
                  </Button>
                </div>
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Loan Amount</dt>
                    <dd className="font-medium">
                      {formData.currency} {Number(formData.loanAmount).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Min Investment</dt>
                    <dd className="font-medium">
                      {formData.currency} {Number(formData.minInvestment).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Currency</dt>
                    <dd className="font-medium">{formData.currency}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Construction Start</dt>
                    <dd className="font-medium">
                      {formData.constructionStartDate
                        ? new Date(formData.constructionStartDate).toLocaleDateString()
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Construction End</dt>
                    <dd className="font-medium">
                      {formData.constructionEndDate
                        ? new Date(formData.constructionEndDate).toLocaleDateString()
                        : "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Next Steps Info */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2">What happens next?</h3>
                <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                  <li>Your project will be saved as a draft</li>
                  <li>Upload the required loan application documents</li>
                  <li>Submit your project for review</li>
                  <li>Our team will review and approve your project</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>
        <div className="flex gap-4">
          {currentStep === steps.length ? (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft"
                )}
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Save & Continue to Documents"
                )}
              </Button>
            </>
          ) : (
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleNext}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
