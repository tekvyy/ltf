"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Building2, Calendar, User, MapPin, FileText, CheckCircle2, Circle, ChevronLeft, ChevronRight, ArrowRight, X, XCircle, Loader2, ExternalLink, BadgeCheck, Mail, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanProposalModal, LoanProposalFormData } from "@/components/dashboard/loan-proposal-modal";
import { DocumentAISummary } from "@/components/shared/document-ai-summary";
import { lenderProjectsService, lenderProposalsService } from "@/lib/api";
import type { LenderProject, LenderLoanProposal, LenderSecurityPackageType } from "@/lib/types/lender";
import { toast } from "sonner";

// Hardcoded data for fields not available in API
const hardcodedData = {
  ltv: "60%",
  loanType: "Construction",
  loanMaturity: "30 Oct 2024", // Fallback if not calculated
  locationDescription: "This development is strategically located with easy access to public transportation, schools, shopping centers, and recreational facilities. The neighborhood is known for its family-friendly atmosphere and growing community.",
};

// Helper function to format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  // Project state
  const [project, setProject] = useState<LenderProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for each section
  const aboutRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const documentsRef = useRef<HTMLDivElement>(null);
  const milestonesRef = useRef<HTMLDivElement>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState("about");

  // Gallery state
  const [aboutImageIndex, setAboutImageIndex] = useState(0);
  const [showVRTour, setShowVRTour] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [showLoanProposalModal, setShowLoanProposalModal] = useState(false);
  const [proposalSubmitted, setProposalSubmitted] = useState(false);

  // Progress Gallery state (uses same photos as about section)
  const [progressImageIndex, setProgressImageIndex] = useState(0);

  // Proposal state
  const [proposal, setProposal] = useState<LenderLoanProposal | null>(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(true);

  // AI Summary state - tracks which document ID is showing summary
  const [showAISummaryFor, setShowAISummaryFor] = useState<number | null>(null);

  // Fetch project data (includes documents, milestones, photos inline)
  const fetchProject = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await lenderProjectsService.get(projectId);
      if (response.data?.success) {
        setProject(response.data.data);
      } else {
        setError("Project not found");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  // Fetch existing proposal on page load
  const fetchProposal = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingProposal(true);
    try {
      // Fetch all proposals and find if one exists for this project
      const response = await lenderProposalsService.list({ status: "all", per_page: 100 });
      if (response.data?.success && response.data.data) {
        const existingProposal = response.data.data.find(
          (p) => p.project.id === projectId
        );
        if (existingProposal) {
          setProposal(existingProposal);
          setProposalSubmitted(true);
        }
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
    } finally {
      setIsLoadingProposal(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  // Gallery images from project's inline photos or fallback
  const projectPhotos = project?.photos || [];
  const aboutGalleryImages = projectPhotos.length > 0
    ? projectPhotos.map((photo) => ({
      id: photo.id,
      title: photo.title || "Project image",
      src: photo.file_url,
    }))
    : [
      { id: 1, title: "Front view", src: "/images/house.png" },
      { id: 2, title: "Side view", src: "/images/house.png" },
      { id: 3, title: "Interior", src: "/images/house.png" },
    ];

  const nextAboutImage = () => {
    setAboutImageIndex((prev) => (prev + 1) % aboutGalleryImages.length);
  };

  const prevAboutImage = () => {
    setAboutImageIndex((prev) => (prev - 1 + aboutGalleryImages.length) % aboutGalleryImages.length);
  };

  const nextProgressImage = () => {
    setProgressImageIndex((prev) => (prev + 1) % aboutGalleryImages.length);
  };

  const prevProgressImage = () => {
    setProgressImageIndex((prev) => (prev - 1 + aboutGalleryImages.length) % aboutGalleryImages.length);
  };

  const handleLoanProposalSubmit = async (data: LoanProposalFormData) => {
    if (!project) return;
    try {
      const response = await lenderProposalsService.create({
        project_id: project.id,
        loan_amount_offered: parseFloat(data.amountOffered),
        currency: data.currency,
        interest_rate: parseFloat(data.interestRate),
        loan_maturity_date: data.maturityDate,
        security_packages: data.securityPackage as LenderSecurityPackageType[],
        max_ltv_accepted: parseFloat(data.maxLTV),
        bid_expiry_date: data.bidExpiry,
        additional_conditions: data.conditions || undefined,
        loan_term_agreement: data.documents?.[0], // First document as loan term agreement
      });

      if (response.data?.success) {
        setProposal(response.data.data);
        setProposalSubmitted(true);
        toast.success(response.data.message || "Loan proposal submitted successfully");
      } else if (response.error) {
        // Display validation errors if available
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            messages.forEach((message: string) => {
              toast.error(message);
            });
          });
        } else {
          toast.error(response.error);
        }
      }
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast.error("Failed to submit proposal");
    }
  };

  const tabs = [
    { id: "about", label: "About project", ref: aboutRef },
    { id: "team", label: "Developer Details", ref: teamRef },
    { id: "gallery", label: "Project gallery", ref: galleryRef },
    { id: "location", label: "Location", ref: locationRef },
    { id: "documents", label: "Documentation", ref: documentsRef },
    { id: "milestones", label: "Milestones", ref: milestonesRef },
  ];

  const scrollToSection = (tabId: string, ref: React.RefObject<HTMLDivElement | null>) => {
    setActiveTab(tabId);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/marketplace"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-semibold">Project Details</h1>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-destructive/40" />
          <p className="mb-4 text-destructive">{error || "Project not found"}</p>
          <Button onClick={() => router.push("/dashboard/marketplace")} variant="outline">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  // Derived values from project
  const location = [project.city, project.country].filter(Boolean).join(", ") || "Location not set";
  const fullAddress = [project.address, project.city, project.country].filter(Boolean).join(", ") || location;
  const heroImage = project.cover_photo_url || (project.photos?.[0]?.file_url) || "/images/house.png";

  return (
    <div className="w-full">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/marketplace"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-semibold">Project Details</h1>
        </div>

        {/* Hero */}
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-elevated">
          <div className="relative aspect-[16/9] w-full bg-muted">
            <Image
              src={heroImage}
              alt={project.title}
              fill
              className="object-cover"
              unoptimized
            />
            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

            {/* Reference chip */}
            <div className="absolute left-4 top-4">
              <span className="rounded-md bg-black/40 px-2.5 py-1 font-mono text-xs font-medium text-white backdrop-blur-sm">
                {project.uuid?.slice(0, 8).toUpperCase() || `PRJ-${project.id}`}
              </span>
            </div>

            {/* Title */}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {project.title}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="h-4 w-4" />
                {location}
              </p>
            </div>
          </div>

          {/* Stats + CTA */}
          <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Loan amount</p>
                <p className="tnum mt-1 text-lg font-semibold text-primary">${project.loan_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Project type</p>
                <p className="mt-1 text-lg font-semibold">{project.project_type_label}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Construction start</p>
                <p className="mt-1 text-sm font-medium">{formatDate(project.construction_start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Construction finish</p>
                <p className="mt-1 text-sm font-medium">{formatDate(project.construction_end_date)}</p>
              </div>
            </div>

            {/* CTA Button or Status */}
            <div className="shrink-0">
              {isLoadingProposal ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (proposal?.status === "accepted_by_developer" || proposal?.status === "signed_by_developer" || proposal?.status === "signed_by_lender" || proposal?.status === "loan_term_fully_executed") ? (
                <Link href="/dashboard/proposals" className="flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/12 px-4 py-2 transition-colors hover:bg-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Proposal Accepted</span>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                </Link>
              ) : proposal?.status === "rejected_by_developer" ? (
                <Link href="/dashboard/proposals" className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 transition-colors hover:bg-destructive/15">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Proposal Rejected</span>
                  <ExternalLink className="h-3.5 w-3.5 text-destructive" />
                </Link>
              ) : proposalSubmitted ? (
                <Link href="/dashboard/proposals" className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-400/15 px-4 py-2 transition-colors hover:bg-amber-400/25">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-amber-700">Submitted for Review</span>
                  <ExternalLink className="h-3.5 w-3.5 text-amber-600" />
                </Link>
              ) : (
                <Button
                  onClick={() => setShowLoanProposalModal(true)}
                  size="lg"
                  className="h-11 whitespace-nowrap rounded-full px-7 text-sm font-medium"
                >
                  Submit Loan Offer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation - Sticky */}
        <div className="sticky top-0 z-10 -mx-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md">
          <nav className="flex gap-6 overflow-x-auto sm:justify-center sm:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id, tab.ref)}
                className={`whitespace-nowrap border-b-2 py-3.5 text-sm font-medium transition-colors cursor-pointer ${activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* All Sections */}
      <div className="space-y-12 max-w-5xl mx-auto p-4">
        {/* About Project Section */}
        <div ref={aboutRef} className="scroll-mt-20">
          <h3 className="text-lg font-semibold mb-6">About project</h3>
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-card shadow-elevated lg:grid-cols-2">
            {/* Left - Image Carousel */}
            <div className="space-y-3">
              {/* Main Image with Navigation */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={aboutGalleryImages[aboutImageIndex]?.src || "/images/house.png"}
                  alt={aboutGalleryImages[aboutImageIndex]?.title || "Project image"}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {aboutGalleryImages.length > 1 && (
                  <>
                    {/* Navigation Arrows */}
                    <button
                      onClick={prevAboutImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5 text-foreground" />
                    </button>
                    <button
                      onClick={nextAboutImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5 text-foreground" />
                    </button>
                  </>
                )}
              </div>

              {/* Picture Title & Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground p-2">{aboutGalleryImages[aboutImageIndex]?.title}</p>
                <div className="flex items-center gap-2">
                  {/* Pagination dots */}
                  {aboutGalleryImages.length > 1 && (
                    <div className="flex items-center gap-1">
                      {aboutGalleryImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setAboutImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${index === aboutImageIndex ? "bg-foreground" : "bg-muted"
                            }`}
                        />
                      ))}
                    </div>
                  )}
                  {/* Fullscreen button */}
                  {/*<button className="ml-2 p-1 hover:bg-muted rounded transition-colors">*/}
                  {/*  <Maximize2 className="h-4 w-4 text-muted-foreground" />*/}
                  {/*</button>*/}
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="space-y-4 p-6">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {project.description ? (
                  <p className="whitespace-pre-wrap">{project.description}</p>
                ) : (
                  <p>No description available for this project.</p>
                )}
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Project Type</p>
                  <p className="text-sm font-medium capitalize">{project.project_type_label || project.project_type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min Investment</p>
                  <p className="text-sm font-medium">${Number(project.min_investment).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-sm font-medium">{project.currency}</p>
                </div>
                {project.amount_raised !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Raised</p>
                    <p className="text-sm font-medium text-emerald-600">${project.amount_raised.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {(project.vr_tour_link || project.live_camera_link) && (
                <div className="flex gap-3 pt-4">
                  {project.vr_tour_link && (
                    <Button
                      variant="outline"
                      className="rounded-full px-5 cursor-pointer"
                      onClick={() => setShowVRTour(true)}
                    >
                      VR tour
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  {project.live_camera_link && (
                    <Button
                      variant="outline"
                      className="rounded-full px-5 cursor-pointer"
                      onClick={() => setShowLiveCamera(true)}
                    >
                      Live camera
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Developer Details Section */}
        <div ref={teamRef} className="scroll-mt-20">
          <h3 className="text-lg font-semibold mb-4">Developer Details</h3>
          <div className="rounded-xl border border-border/70 bg-card p-6 shadow-elevated">
            {project.developer ? (
              <div className="flex items-start gap-4">
                {/* Developer Avatar */}
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {project.developer.user?.avatar ? (
                    <Image
                      src={project.developer.user.avatar}
                      alt={project.developer.user.name || "Developer"}
                      width={64}
                      height={64}
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Developer Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">
                      {project.developer.company_name || project.developer.user?.name || "Developer"}
                    </h4>
                    {project.developer.kyb_status === "approved" && (
                      <div className="flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-500/12 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  {project.developer.user?.name && project.developer.company_name && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Contact: {project.developer.user.name}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {project.developer.user?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{project.developer.user.email}</span>
                      </div>
                    )}
                    {project.developer.user?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{project.developer.user.phone}</span>
                      </div>
                    )}
                  </div>

                  {project.developer.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>{project.developer.address}</span>
                    </div>
                  )}

                  {project.developer.company_registration_number && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Registration No: {project.developer.company_registration_number}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <User className="h-12 w-12 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm">Developer information not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Gallery Section */}
        <div ref={galleryRef} className="scroll-mt-20">
          <h3 className="text-lg font-semibold mb-4">Project gallery</h3>

          {/* Gallery Container */}
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-elevated">
            {/* Main Image with Navigation */}
            <div className="relative aspect-[16/9] w-full bg-muted">
              <Image
                src={aboutGalleryImages[progressImageIndex]?.src || "/images/house.png"}
                alt={aboutGalleryImages[progressImageIndex]?.title || "Project image"}
                fill
                className="object-cover"
                unoptimized
              />

              {aboutGalleryImages.length > 1 && (
                <>
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevProgressImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors shadow-md cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6 text-foreground" />
                  </button>
                  <button
                    onClick={nextProgressImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors shadow-md cursor-pointer"
                  >
                    <ChevronRight className="h-6 w-6 text-foreground" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Bar - Title & Pagination */}
            <div className="flex items-center justify-between p-3 border-t border-border">
              {/* Picture Title */}
              <p className="text-sm text-muted-foreground">
                {aboutGalleryImages[progressImageIndex]?.title}
              </p>

              {/* Pagination */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {progressImageIndex + 1}/{aboutGalleryImages.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div ref={locationRef} className="scroll-mt-20">
          <h3 className="text-lg font-semibold mb-4">Location</h3>
          <div className="space-y-4 rounded-xl border border-border/70 bg-card p-6 shadow-elevated">
            {/* Address */}
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">{fullAddress}</p>
            </div>

            {/* Two Maps Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Map - Google Maps (Detailed View) */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <iframe
                  className="absolute inset-0 w-full h-full border-none"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(fullAddress)}&zoom=16`}
                />
              </div>

              {/* Right Map - OpenStreetMap (Overview) */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <iframe
                  className="absolute inset-0 w-full h-full border-none"
                  loading="lazy"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=16.99%2C51.09%2C17.05%2C51.12&layer=mapnik&marker=51.107%2C17.019"
                />
              </div>
            </div>

            {/* Description and Button Row */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {hardcodedData.locationDescription}
              </p>

              {/* About location button */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Button variant="outline" className="rounded-full px-5 cursor-pointer">
                  About location
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Documentation Section */}
        <div ref={documentsRef} className="scroll-mt-20">
          <h3 className="text-lg font-semibold mb-4">Documentation</h3>
          <div className="rounded-xl border border-border/70 bg-card p-6 shadow-elevated">
            <h4 className="text-sm font-medium text-foreground mb-4">Project documents ({project.documents?.length || 0})</h4>
            {project.documents && project.documents.length > 0 ? (
              <div className="space-y-3">
                {project.documents.map((doc) => (
                  <div key={doc.id} className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                      {doc.verification_status === "approved" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      ) : doc.verification_status === "rejected" ? (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/60 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.document_type_label}</p>
                        <p className="text-xs text-muted-foreground">{doc.file_size_formatted}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAISummaryFor(showAISummaryFor === doc.id ? null : doc.id)}
                          className={`text-xs gap-1.5 ${showAISummaryFor === doc.id
                              ? "bg-violet-100 border-violet-300 text-violet-700"
                              : "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700"
                            }`}
                        >
                          <Sparkles className="h-3 w-3" />
                          AI Review
                        </Button>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* AI Summary Panel */}
                    {showAISummaryFor === doc.id && (
                      <DocumentAISummary
                        fileUrl={doc.file_url}
                        documentType={doc.document_type_label}
                        documentName={doc.document_type_label}
                        className="ml-8"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm">No documents available for this project yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Milestones Section */}
        <div ref={milestonesRef} className="scroll-mt-20">
          <h3 className="text-lg font-semibold mb-4">Project Milestones {project.milestones_count > 0 && `(${project.milestones_count})`}</h3>
          <div className="rounded-xl border border-border/70 bg-card p-6 shadow-elevated">
            {project.milestones && project.milestones.length > 0 ? (
              <div className="space-y-4">
                {project.milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {milestone.sequence || index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${milestone.status === "paid" ? "border-emerald-600/20 bg-emerald-500/12 text-emerald-700" :
                            milestone.status === "approved" ? "border-sky-500/20 bg-sky-500/12 text-sky-700" :
                              milestone.status === "proof_submitted" ? "border-amber-500/25 bg-amber-400/15 text-amber-700" :
                                "border-border bg-muted text-muted-foreground"
                          }`}>
                          {milestone.status_label}
                        </span>
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>${Number(milestone.amount).toLocaleString()} ({milestone.percentage}%)</span>
                        {milestone.due_date && (
                          <span>Due: {formatDate(milestone.due_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm">No milestones available for this project yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VR Tour Modal */}
      {showVRTour && project.vr_tour_link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative bg-card rounded-xl overflow-hidden max-w-4xl w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">VR Tour - 3D Walkthrough</h3>
              <button
                onClick={() => setShowVRTour(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {/* Iframe Content */}
            <div className="aspect-[4/3]">
              <iframe
                className="w-full h-full border-none"
                scrolling="no"
                allowFullScreen
                allow="gyroscope; accelerometer; xr-spatial-tracking; vr;"
                src={project.vr_tour_link}
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {showLiveCamera && project.live_camera_link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative bg-card rounded-xl overflow-hidden max-w-4xl w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Live Camera</h3>
              <button
                onClick={() => setShowLiveCamera(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {/* Iframe Content */}
            <div className="aspect-video">
              <iframe
                className="w-full h-full border-none"
                allowFullScreen
                src={project.live_camera_link}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loan Proposal Modal */}
      <LoanProposalModal
        open={showLoanProposalModal}
        onOpenChange={setShowLoanProposalModal}
        projectId={project.id.toString()}
        projectName={project.title}
        projectImage={heroImage}
        loanValue={project.loan_amount}
        onSubmit={handleLoanProposalSubmit}
      />
    </div>
  );
}
