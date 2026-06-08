"use client";

import { useState } from "react";
import { Star, Trash2, Pencil, Check, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProjectPhoto } from "@/lib/types/developer";

interface ProjectPhotoGalleryProps {
  photos: ProjectPhoto[];
  isEditable?: boolean;
  onSetFeatured?: (photoId: number) => Promise<void>;
  onUpdateTitle?: (photoId: number, title: string) => Promise<void>;
  onDelete?: (photoId: number) => Promise<void>;
}

export function ProjectPhotoGallery({
  photos,
  isEditable = false,
  onSetFeatured,
  onUpdateTitle,
  onDelete,
}: ProjectPhotoGalleryProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"featured" | "delete" | "title" | null>(null);

  const handleStartEdit = (photo: ProjectPhoto) => {
    setEditingId(photo.id);
    setEditingTitle(photo.title || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleSaveTitle = async (photoId: number) => {
    if (!onUpdateTitle) return;
    setLoadingId(photoId);
    setActionType("title");
    try {
      await onUpdateTitle(photoId, editingTitle);
      setEditingId(null);
      setEditingTitle("");
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  };

  const handleSetFeatured = async (photoId: number) => {
    if (!onSetFeatured) return;
    setLoadingId(photoId);
    setActionType("featured");
    try {
      await onSetFeatured(photoId);
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!onDelete) return;
    if (!confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }
    setLoadingId(photoId);
    setActionType("delete");
    try {
      await onDelete(photoId);
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-xl border-2 border-dashed border-border">
        <ImageIcon className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-muted-foreground">No photos uploaded yet</p>
      </div>
    );
  }

  // Sort photos: featured first, then by sort_order
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return a.sort_order - b.sort_order;
  });

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedPhotos.map((photo) => (
          <div
            key={photo.id}
            className={cn(
              "relative rounded-lg border-2 overflow-hidden bg-muted group",
              photo.is_featured ? "border-primary" : "border-border"
            )}
          >
            {/* Image */}
            <div className="aspect-square relative">
              <img
                src={photo.file_url}
                alt={photo.title || "Project photo"}
                className="w-full h-full object-cover"
              />

              {/* Featured badge */}
              {photo.is_featured && (
                <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Cover
                </div>
              )}

              {/* Loading overlay */}
              {loadingId === photo.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}

              {/* Actions overlay - only show when editable and not loading */}
              {isEditable && loadingId !== photo.id && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!photo.is_featured && onSetFeatured && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-card/90 hover:bg-card"
                        onClick={() => handleSetFeatured(photo.id)}
                        title="Set as cover photo"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    {onUpdateTitle && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-card/90 hover:bg-card"
                        onClick={() => handleStartEdit(photo)}
                        title="Edit title"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-card/90 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(photo.id)}
                        title="Delete photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Title section */}
            <div className="p-2">
              {editingId === photo.id ? (
                <div className="flex gap-1">
                  <Input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Enter title"
                    className="text-sm h-8 flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSaveTitle(photo.id)}
                    disabled={loadingId === photo.id}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCancelEdit}
                    disabled={loadingId === photo.id}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-foreground truncate">
                  {photo.title || (
                    <span className="text-muted-foreground italic">No title</span>
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
