"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, AlertCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentAISummaryProps {
  fileUrl: string;
  documentType?: string;
  documentName?: string;
  className?: string;
}

interface SummaryState {
  loading: boolean;
  error: string | null;
  summary: string | null;
}

export function DocumentAISummary({
  fileUrl,
  documentType,
  documentName,
  className,
}: DocumentAISummaryProps) {
  const [state, setState] = useState<SummaryState>({
    loading: false,
    error: null,
    summary: null,
  });
  const [isExpanded, setIsExpanded] = useState(true);

  const analyzeDocument = async () => {
    setState({ loading: true, error: null, summary: null });

    try {
      // Send the file URL to our API route (server fetches the file to avoid CORS)
      const response = await fetch("/api/analyze-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl,
          documentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze document");
      }

      setState({ loading: false, error: null, summary: data.summary });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to analyze document",
        summary: null,
      });
    }
  };

  const resetSummary = () => {
    setState({ loading: false, error: null, summary: null });
  };

  // Initial state - show analyze button
  if (!state.loading && !state.summary && !state.error) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={analyzeDocument}
        className={cn(
          "gap-2 text-xs bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 hover:border-violet-300 text-violet-700",
          className
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Summary
      </Button>
    );
  }

  // Loading state
  if (state.loading) {
    return (
      <div className={cn("rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-violet-600 animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-900">Analyzing document...</p>
            <p className="text-xs text-violet-600">AI is reviewing {documentName || "the document"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className={cn("rounded-lg border border-red-200 bg-red-50 p-4", className)}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-900">Analysis failed</p>
            <p className="text-xs text-red-600 mt-0.5">{state.error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSummary}
            className="flex-shrink-0 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeDocument}
          className="mt-3 text-xs border-red-200 text-red-700 hover:bg-red-100"
        >
          Try again
        </Button>
      </div>
    );
  }

  // Success state - show summary
  return (
    <div className={cn("rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 overflow-hidden", className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-violet-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-900">AI Summary</p>
            {documentName && (
              <p className="text-xs text-violet-600 truncate max-w-[200px]">{documentName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              resetSummary();
            }}
            className="h-7 w-7 p-0 text-violet-500 hover:text-violet-700 hover:bg-violet-100"
          >
            <X className="h-4 w-4" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-violet-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-violet-500" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="bg-card/70 backdrop-blur-sm rounded-lg p-3 border border-violet-100">
            <div className="prose prose-sm prose-violet max-w-none">
              {state.summary?.split("\n").map((line, index) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;

                // Check if it's a bullet point
                if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*") || trimmedLine.startsWith("•")) {
                  return (
                    <div key={index} className="flex items-start gap-2 py-0.5">
                      <span className="text-violet-400 mt-1.5">•</span>
                      <span className="text-sm text-foreground">{trimmedLine.slice(1).trim()}</span>
                    </div>
                  );
                }

                // Check if it's a numbered point
                if (/^\d+\./.test(trimmedLine)) {
                  return (
                    <p key={index} className="text-sm text-foreground font-medium py-1">
                      {trimmedLine}
                    </p>
                  );
                }

                // Regular text
                return (
                  <p key={index} className="text-sm text-foreground py-0.5">
                    {trimmedLine}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-violet-100">
            <div className="flex items-center gap-1.5 text-xs text-violet-500">
              <FileText className="h-3 w-3" />
              <span>Powered by Gemini AI</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeDocument}
              className="h-6 text-xs text-violet-600 hover:text-violet-800 hover:bg-violet-100 px-2"
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
