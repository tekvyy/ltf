"use client";

import { useState } from "react";
import type { AuditEventType } from "@/lib/types/audit-logs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface AuditLogFiltersProps {
    onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
    event_type: AuditEventType | "all";
    search: string;
    date_range: "7d" | "30d" | "90d" | "all";
}

const dateRanges = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All time" },
];

export function AuditLogFilters({ onFilterChange }: AuditLogFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        event_type: "all",
        search: "",
        date_range: "30d",
    });

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleReset = () => {
        const resetFilters: FilterState = {
            event_type: "all",
            search: "",
            date_range: "all",
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    const hasActiveFilters =
        filters.search !== "" ||
        filters.date_range !== "all";

    return (
        <div className="rounded-xl border bg-card p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range Filter */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Time Period
                    </label>
                    <select
                        value={filters.date_range}
                        onChange={(e) => handleFilterChange("date_range", e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        {dateRanges.map((range) => (
                            <option key={range.value} value={range.value}>
                                {range.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search Filter */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Search
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by description or transaction hash..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {filters.search && (
                            <button
                                onClick={() => handleFilterChange("search", "")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="text-sm"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Reset Filters
                    </Button>
                </div>
            )}
        </div>
    );
}
