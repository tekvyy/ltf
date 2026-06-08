"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, File, X, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface LoanProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectImage: string;
  loanValue: number;
  onSubmit?: (data: LoanProposalFormData) => void;
}

export interface LoanProposalFormData {
  amountOffered: string;
  currency: string;
  interestRate: string;
  maturityDate: string;
  securityPackage: string[];
  maxLTV: string;
  bidExpiry: string;
  conditions: string;
  documents: File[];
}

const securityPackageOptions = [
  { id: "mortgage", label: "Mortgage" },
  { id: "spv_charge", label: "SPV Charge" },
  { id: "guarantees", label: "Guarantees" },
];

export function LoanProposalModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectImage,
  loanValue,
  onSubmit,
}: LoanProposalModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<LoanProposalFormData, "documents" | "securityPackage">>({
    amountOffered: "",
    currency: "USD",
    interestRate: "",
    maturityDate: "",
    maxLTV: "",
    bidExpiry: "",
    conditions: "",
  });
  const [securityPackage, setSecurityPackage] = useState<string[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityPackageChange = (optionId: string, checked: boolean) => {
    setSecurityPackage((prev) =>
      checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)
    );
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setDocuments((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setDocuments((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const resetForm = () => {
    setFormData({
      amountOffered: "",
      currency: "USD",
      interestRate: "",
      maturityDate: "",
      maxLTV: "",
      bidExpiry: "",
      conditions: "",
    });
    setSecurityPackage([]);
    setDocuments([]);
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Integrate with API
      onSubmit?.({ ...formData, securityPackage, documents });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit loan proposal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const isFormValid =
    formData.amountOffered &&
    formData.interestRate &&
    formData.maturityDate &&
    securityPackage.length > 0 &&
    formData.maxLTV &&
    formData.bidExpiry &&
    documents.length > 0; // Loan term agreement is required

  // Success State
  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Proposal Submitted!
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your loan proposal for <span className="font-medium">{projectName}</span> has been submitted successfully and is now under review by the developer.
            </p>
            <div className="w-full p-4 bg-muted rounded-lg mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Submitted for Review
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Project ID</span>
                <span className="font-medium">{projectId}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Amount Offered</span>
                <span className="font-medium">${Number(formData.amountOffered).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-medium">{formData.interestRate}%</span>
              </div>
            </div>
            <Button
              onClick={handleClose}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Proposal</DialogTitle>
        </DialogHeader>

        {/* Project Info Card */}
        <div className="mx-6 flex items-center gap-4 p-3 rounded-lg bg-muted border border-border">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={projectImage}
              alt={projectName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{projectName}</p>
            <div className="mt-1">
              <p className="text-xs text-muted-foreground">Requested Loan Amount</p>
              <p className="text-base font-bold text-primary">
                ${loanValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6">
          {/* Amount Offered with Currency */}
          <div className="space-y-2">
            <Label htmlFor="amountOffered">Amount Offered</Label>
            <div className="flex gap-2">
              <Input
                id="amountOffered"
                name="amountOffered"
                type="number"
                min="0"
                placeholder="e.g., 1,500,000"
                value={formData.amountOffered}
                onChange={handleInputChange}
                className="flex-1"
                required
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (% per annum)</Label>
            <Input
              id="interestRate"
              name="interestRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 8.5"
              value={formData.interestRate}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Maturity Date */}
          <div className="space-y-2">
            <Label htmlFor="maturityDate">Maturity Date</Label>
            <Input
              id="maturityDate"
              name="maturityDate"
              type="date"
              value={formData.maturityDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Security Package - Multi-checkbox */}
          <div className="space-y-2">
            <Label>Security Package</Label>
            <div className="grid grid-cols-2 gap-2">
              {securityPackageOptions.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`security-${option.id}`}
                    checked={securityPackage.includes(option.id)}
                    onCheckedChange={(checked) =>
                      handleSecurityPackageChange(option.id, checked === true)
                    }
                  />
                  <label
                    htmlFor={`security-${option.id}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Max LTV */}
          <div className="space-y-2">
            <Label htmlFor="maxLTV">Max LTV Accepted (%)</Label>
            <Input
              id="maxLTV"
              name="maxLTV"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="e.g., 60"
              value={formData.maxLTV}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Bid Expiry */}
          <div className="space-y-2">
            <Label htmlFor="bidExpiry">Bid Expiry Date</Label>
            <Input
              id="bidExpiry"
              name="bidExpiry"
              type="date"
              value={formData.bidExpiry}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <p className="text-xs text-muted-foreground">
              This offer will expire on the selected date if not accepted
            </p>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>
              Loan Term Agreement <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload the loan term agreement document (PDF or image file)
            </p>
            {errors.loan_term_agreement && (
              <p className="text-xs text-red-600 font-medium">
                {errors.loan_term_agreement}
              </p>
            )}

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-orange-50"
                  : "border-border hover:border-border"
              )}
              onClick={handleFileClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileChange}
              />
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, DOCX, JPG, PNG (max 10MB each)
              </p>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2 mt-3">
                {documents.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 p-2 bg-muted rounded-lg border"
                  >
                    <File className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            <Label htmlFor="conditions">
              Additional Conditions <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="conditions"
              name="conditions"
              placeholder="Enter any additional terms or conditions for this loan proposal..."
              value={formData.conditions}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

        </form>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white rounded-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
