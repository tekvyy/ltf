"use client";

import { useRef, useState } from "react";
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LenderDocumentStatus = "not_uploaded" | "staged" | "uploading" | "uploaded" | "verified" | "rejected";

interface LenderDocumentUploadCardProps {
  title: string;
  description: string;
  required?: boolean;
  status: LenderDocumentStatus;
  fileName?: string;
  acceptedFormats?: string;
  maxSize?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  rejectionReason?: string;
}

const statusConfig = {
  not_uploaded: {
    borderColor: "border-border",
    bgColor: "bg-card",
  },
  staged: {
    borderColor: "border-orange-200",
    bgColor: "bg-orange-50",
  },
  uploading: {
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
  },
  uploaded: {
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
  },
  verified: {
    borderColor: "border-green-200",
    bgColor: "bg-green-50",
  },
  rejected: {
    borderColor: "border-red-200",
    bgColor: "bg-red-50",
  },
};

export function LenderDocumentUploadCard({
  title,
  description,
  required = false,
  status,
  fileName,
  acceptedFormats = "PDF, JPG, PNG",
  maxSize = "10MB",
  onUpload,
  onRemove,
  rejectionReason,
}: LenderDocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const config = statusConfig[status];

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed p-6 transition-colors",
        config.borderColor,
        config.bgColor,
        isDragging && "border-primary bg-orange-50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {status === "verified" && (
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        )}
        {status === "rejected" && (
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        )}
      </div>

      {status === "rejected" && rejectionReason && (
        <div className="mb-4 p-3 bg-red-100 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Rejected:</strong> {rejectionReason}
          </p>
        </div>
      )}

      {status === "not_uploaded" || status === "rejected" ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-orange-50" : "border-border hover:border-border"
          )}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            <span className="text-primary font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptedFormats} (max {maxSize})
          </p>
        </div>
      ) : status === "uploading" ? (
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium">Uploading...</p>
          </div>
        </div>
      ) : status === "staged" ? (
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-orange-200">
          <File className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-orange-600">Ready to upload</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <File className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {status === "verified" ? "Verified" : "Pending verification"}
            </p>
          </div>
          {status !== "verified" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
