"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { LenderDocumentUploadCard, LenderDocumentStatus } from "@/components/dashboard/lender-document-upload-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { lenderProfileService, lenderKybService } from "@/lib/api";
import type { LenderProfile, LenderDocument, KybStatus, LenderKybDocumentType } from "@/lib/types/lender";

interface KybDocument {
  id: number | null;
  type: LenderKybDocumentType;
  title: string;
  description: string;
  required: boolean;
  status: LenderDocumentStatus;
  fileName?: string;
  fileUrl?: string;
  rejectionReason?: string;
}

// Document type configurations for lenders
const documentConfigs: Array<{
  type: LenderKybDocumentType;
  title: string;
  description: string;
  required: boolean;
}> = [
  {
    type: "kyb_lender_certificate_of_incorporation",
    title: "Certificate of Incorporation",
    description: "Official certificate proving your business is legally registered",
    required: true,
  },
  {
    type: "kyb_lender_business_license",
    title: "Business/Financial Services License",
    description: "Valid license to operate as a financial institution or lender",
    required: true,
  },
  {
    type: "kyb_lender_beneficial_ownership",
    title: "Beneficial Ownership Declaration",
    description: "Declaration of ultimate beneficial owners (UBO) with ownership details",
    required: true,
  },
  {
    type: "kyb_lender_tax_certificate",
    title: "Tax Identification Certificate",
    description: "Tax registration certificate or TIN documentation",
    required: true,
  },
  {
    type: "kyb_lender_address_proof",
    title: "Proof of Business Address",
    description: "Utility bill or official letter showing your business address (within last 3 months)",
    required: true,
  },
];

const statusSteps = [
  { key: "not_started", label: "Upload Documents" },
  { key: "pending", label: "Submit for Review" },
  { key: "under_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
];

export default function LenderKybVerificationPage() {
  const [profile, setProfile] = useState<LenderProfile | null>(null);
  const [documents, setDocuments] = useState<KybDocument[]>([]);
  const [stagedFiles, setStagedFiles] = useState<Map<LenderKybDocumentType, File>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile and documents
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile
      const profileResponse = await lenderProfileService.getProfile();
      if (profileResponse.error) {
        setError(profileResponse.error);
        return;
      }
      if (profileResponse.data?.data) {
        setProfile(profileResponse.data.data);
      }

      // Fetch KYB documents
      const docsResponse = await lenderKybService.getDocuments();
      if (docsResponse.data?.data) {
        const uploadedDocs = docsResponse.data.data;

        // Map document configs with uploaded documents
        const mappedDocs = documentConfigs.map((config) => {
          const uploadedDoc = uploadedDocs.find(
            (d: LenderDocument) => d.document_type === config.type
          );

          if (uploadedDoc) {
            return {
              id: uploadedDoc.id,
              type: config.type,
              title: config.title,
              description: config.description,
              required: config.required,
              status: mapVerificationStatus(uploadedDoc.verification_status),
              fileName: uploadedDoc.file_name,
              fileUrl: uploadedDoc.file_url,
              rejectionReason: uploadedDoc.rejection_reason || undefined,
            };
          }

          return {
            id: null,
            type: config.type,
            title: config.title,
            description: config.description,
            required: config.required,
            status: "not_uploaded" as LenderDocumentStatus,
          };
        });

        setDocuments(mappedDocs);
      } else {
        // Initialize with empty documents if no documents fetched
        setDocuments(
          documentConfigs.map((config) => ({
            id: null,
            type: config.type,
            title: config.title,
            description: config.description,
            required: config.required,
            status: "not_uploaded" as LenderDocumentStatus,
          }))
        );
      }
    } catch (err) {
      setError("Failed to load KYB data");
    } finally {
      setIsLoading(false);
    }
  }

  function mapVerificationStatus(status: string): LenderDocumentStatus {
    switch (status) {
      case "approved":
        return "verified";
      case "rejected":
        return "rejected";
      default:
        return "uploaded";
    }
  }

  // Count documents that are either uploaded to server or staged locally
  const uploadedCount = documents.filter(
    (d) => d.status === "uploaded" || d.status === "verified"
  ).length;
  const stagedCount = stagedFiles.size;
  const readyCount = uploadedCount + stagedCount;

  const requiredCount = documents.filter((d) => d.required).length;
  const allRequiredReady = documents
    .filter((d) => d.required)
    .every((d) => d.status === "uploaded" || d.status === "verified" || stagedFiles.has(d.type));
  const progressPercentage = documents.length > 0 ? (readyCount / documents.length) * 100 : 0;

  // Determine effective KYB status based on both profile status AND actual documents
  const profileKybStatus = profile?.kyb_status || "not_started";
  const hasUploadedDocuments = uploadedCount > 0;

  // If admin has approved, always trust the approved status
  // If profile says pending/under_review but no documents exist, treat as not_started
  const kybStatus: KybStatus =
    profileKybStatus === "approved"
      ? "approved"
      : profileKybStatus === "rejected"
      ? "rejected"
      : (profileKybStatus === "pending" || profileKybStatus === "under_review") && !hasUploadedDocuments
      ? "not_started"
      : profileKybStatus;

  // Get document status including staged files
  const getDocumentStatus = (doc: KybDocument): LenderDocumentStatus => {
    if (stagedFiles.has(doc.type)) {
      return "staged";
    }
    return doc.status;
  };

  // Get file name for display (staged or uploaded)
  const getFileName = (doc: KybDocument): string | undefined => {
    const stagedFile = stagedFiles.get(doc.type);
    if (stagedFile) {
      return stagedFile.name;
    }
    return doc.fileName;
  };

  // Stage file locally instead of uploading immediately
  const handleUpload = (docType: LenderKybDocumentType, file: File) => {
    setStagedFiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(docType, file);
      return newMap;
    });
  };

  // Remove file - either from staged files or from server
  const handleRemove = async (docType: LenderKybDocumentType) => {
    // Check if it's a staged file
    if (stagedFiles.has(docType)) {
      setStagedFiles((prev) => {
        const newMap = new Map(prev);
        newMap.delete(docType);
        return newMap;
      });
      return;
    }

    // Otherwise, delete from server
    const doc = documents.find((d) => d.type === docType);
    if (!doc?.id) return;

    try {
      const response = await lenderKybService.deleteDocument(doc.id);

      if (response.error) {
        setError(response.error);
        return;
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.type === docType
            ? { ...d, id: null, status: "not_uploaded" as LenderDocumentStatus, fileName: undefined }
            : d
        )
      );
    } catch (err) {
      setError("Failed to delete document");
    }
  };

  const handleSubmit = async () => {
    if (!allRequiredReady) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Upload all staged documents in a single batch request
      if (stagedFiles.size > 0) {
        const documentsToUpload = Array.from(stagedFiles.entries()).map(([docType, file]) => {
          const config = documentConfigs.find((c) => c.type === docType);
          return {
            document_type: docType,
            title: config?.title || docType,
            file,
          };
        });

        const uploadResponse = await lenderKybService.uploadDocuments({
          documents: documentsToUpload,
        });

        if (uploadResponse.error) {
          setError(uploadResponse.error);
          return;
        }

        // Clear staged files after successful upload
        setStagedFiles(new Map());
      }

      // Step 2: Submit KYB for review
      const response = await lenderKybService.submit();

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data?.success) {
        // Refresh data to get updated status
        await fetchData();
      } else if (response.data?.missing_documents) {
        setError(
          `Missing documents: ${response.data.missing_documents
            .map((d) => d.label)
            .join(", ")}`
        );
      }
    } catch (err) {
      setError("Failed to submit KYB");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentStepIndex = () => {
    const index = statusSteps.findIndex((s) => s.key === kybStatus);
    return index >= 0 ? index : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="KYB Verification" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="KYB Verification" />

      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 text-xs mt-1 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Verification Status</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your business verification to start investing in projects
            </p>
          </div>
          {kybStatus === "approved" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </span>
          )}
          {kybStatus === "under_review" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Under Review
            </span>
          )}
          {kybStatus === "pending" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Pending Review
            </span>
          )}
          {kybStatus === "rejected" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              Rejected
            </span>
          )}
        </div>

        {/* Rejection Reason */}
        {kybStatus === "rejected" && profile?.kyb_rejection_reason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Rejection Reason:</strong> {profile.kyb_rejection_reason}
            </p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="relative">
          <div className="flex justify-between mb-2">
            {statusSteps.map((step, index) => {
              const currentIndex = getCurrentStepIndex();
              // When approved, all steps including the last one should be green
              const isCompleted = kybStatus === "approved"
                ? index <= currentIndex
                : index < currentIndex;
              const isCurrent = kybStatus !== "approved" && index === currentIndex;

              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center flex-1 ${
                    index < statusSteps.length - 1 ? "relative" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10 ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      isCompleted
                        ? "text-emerald-600 font-medium"
                        : isCurrent
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 mx-16 h-0.5 bg-border" />
          <div
            className={`absolute top-4 left-0 h-0.5 -z-0 mx-16 transition-all ${
              kybStatus === "approved" ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{
              width: kybStatus === "approved"
                ? "100%"
                : `${(getCurrentStepIndex() / (statusSteps.length - 1)) * 100}%`,
              maxWidth: "calc(100% - 8rem)",
            }}
          />
        </div>
      </div>

      {/* Document Upload Section */}
      {(kybStatus === "not_started" || kybStatus === "rejected") && (
        <>
          {/* Progress Summary */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Documents</h2>
              <span className="text-sm text-muted-foreground">
                {readyCount} of {documents.length} ready
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {allRequiredReady
                ? "All required documents ready. Click submit to upload and verify."
                : `Select all required documents (${requiredCount - readyCount} remaining) to submit for verification.`}
            </p>
          </div>

          {/* Document Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <LenderDocumentUploadCard
                key={doc.type}
                title={doc.title}
                description={doc.description}
                required={doc.required}
                status={getDocumentStatus(doc)}
                fileName={getFileName(doc)}
                rejectionReason={doc.rejectionReason}
                onUpload={(file) => handleUpload(doc.type, file)}
                onRemove={() => handleRemove(doc.type)}
              />
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!allRequiredReady || isSubmitting}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {stagedFiles.size > 0 ? "Uploading & Submitting..." : "Submitting..."}
                </>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        </>
      )}

      {/* Pending/Under Review State */}
      {(kybStatus === "pending" || kybStatus === "under_review") && (
        <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
          <Clock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {kybStatus === "pending" ? "Documents Submitted" : "Under Review"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {kybStatus === "pending"
              ? "Your documents have been submitted successfully. Our team will review them shortly."
              : "Our team is currently reviewing your documents. This usually takes 1-2 business days."}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            You will be notified once the review is complete.
          </p>
        </div>
      )}

      {/* Approved State */}
      {kybStatus === "approved" && (
        <div className="rounded-xl border bg-green-50 border-green-200 p-8 shadow-sm text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-green-800">
            Business Verified
          </h2>
          <p className="text-green-700 max-w-md mx-auto mb-6">
            Congratulations! Your business has been verified. You can now start investing in projects.
          </p>
          <Link href="/dashboard/marketplace">
            <Button className="bg-primary hover:bg-primary/90">
              Browse Projects
            </Button>
          </Link>
        </div>
      )}

      {/* Submitted Documents List */}
      {(kybStatus === "pending" || kybStatus === "under_review" || kybStatus === "approved") && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Submitted Documents</h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.type}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {doc.status === "verified" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : doc.status === "rejected" ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, "_blank")}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      doc.status === "verified"
                        ? "bg-green-100 text-green-700"
                        : doc.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {doc.status === "verified"
                      ? "Verified"
                      : doc.status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
