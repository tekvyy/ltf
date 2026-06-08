"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, Star, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PendingPhoto {
  id: string;
  file: File;
  preview: string;
  title: string;
  is_featured: boolean;
}

interface ProjectPhotoUploadProps {
  maxPhotos?: number;
  maxSizeMB?: number;
  existingPhotoCount?: number;
  onUpload: (photos: PendingPhoto[]) => Promise<void>;
  isUploading?: boolean;
}

const ACCEPTED_FORMATS = ".jpg,.jpeg,.png,.webp";
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProjectPhotoUpload({
  maxPhotos = 10,
  maxSizeMB = 5,
  existingPhotoCount = 0,
  onUpload,
  isUploading = false,
}: ProjectPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = maxPhotos - existingPhotoCount - pendingPhotos.length;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return `${file.name}: Invalid format. Only JPG, PNG, and WebP are allowed.`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `${file.name}: File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    if (fileArray.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more photo(s). Maximum ${maxPhotos} photos per project.`);
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
      setError(validationErrors.join("\n"));
      return;
    }

    const newPhotos: PendingPhoto[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
      title: "",
      is_featured: pendingPhotos.length === 0 && existingPhotoCount === 0 && index === 0,
    }));

    setPendingPhotos((prev) => [...prev, ...newPhotos]);
  }, [remainingSlots, maxPhotos, pendingPhotos.length, existingPhotoCount, maxSizeMB]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  };

  const removePhoto = (id: string) => {
    setPendingPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      // If we removed the featured photo, make the first one featured
      const hadFeatured = prev.find((p) => p.id === id)?.is_featured;
      if (hadFeatured && updated.length > 0 && existingPhotoCount === 0) {
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

  const setFeatured = (id: string) => {
    setPendingPhotos((prev) =>
      prev.map((p) => ({ ...p, is_featured: p.id === id }))
    );
  };

  const handleUpload = async () => {
    if (pendingPhotos.length === 0) return;

    try {
      await onUpload(pendingPhotos);
      // Clear pending photos after successful upload
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPendingPhotos([]);
    } catch {
      // Error handled by parent
    }
  };

  const clearAll = () => {
    pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPendingPhotos([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Project Photos</h3>
          <p className="text-sm text-muted-foreground">
            Upload up to {maxPhotos} photos. The first photo will be the cover photo.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {existingPhotoCount + pendingPhotos.length}/{maxPhotos} photos
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Drop zone */}
      {remainingSlots > 0 && (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-orange-50"
              : "border-border hover:border-border bg-card"
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
            accept={ACCEPTED_FORMATS}
            multiple
            onChange={handleFileChange}
          />
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            <span className="text-primary font-medium">Click to upload</span> or
            drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP (max {maxSizeMB}MB each)
          </p>
        </div>
      )}

      {/* Pending photos grid */}
      {pendingPhotos.length > 0 && (
        <div className="space-y-4">
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
                    {!photo.is_featured && existingPhotoCount === 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-card/90 hover:bg-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeatured(photo.id);
                        }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.id);
                      }}
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

          {/* Upload actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={clearAll}
              disabled={isUploading}
            >
              Clear all
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || pendingPhotos.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload {pendingPhotos.length} photo{pendingPhotos.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
