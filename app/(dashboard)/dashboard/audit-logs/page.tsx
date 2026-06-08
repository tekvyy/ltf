"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { AuditLogTable } from "@/components/shared/audit-log-table";
import { AuditLogFilters, type FilterState } from "@/components/shared/audit-log-filters";
import { auditLogsService } from "@/lib/api";
import type { AuditLog } from "@/lib/types";
import { transformAuditLog } from "@/lib/utils/audit-logs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function LenderAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<FilterState>({
        event_type: "all",
        search: "",
        date_range: "30d",
    });

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            // Calculate date range
            let from_date: string | undefined;
            const now = new Date();
            if (filters.date_range === "7d") {
                from_date = new Date(now.setDate(now.getDate() - 7)).toISOString();
            } else if (filters.date_range === "30d") {
                from_date = new Date(now.setDate(now.getDate() - 30)).toISOString();
            } else if (filters.date_range === "90d") {
                from_date = new Date(now.setDate(now.getDate() - 90)).toISOString();
            }

            const response = await auditLogsService.listLenderLogs({
                page: currentPage,
                per_page: 20,
                search: filters.search || undefined,
                from_date,
            });

            if (response.error) {
                toast.error(response.error || "Failed to fetch audit logs");
            } else if (response.data && response.data.success) {
                // Transform backend logs to frontend format
                const paginated = response.data.data;
                const logsData = Array.isArray(paginated?.data) ? paginated.data : [];
                const transformedLogs = logsData.map(transformAuditLog);
                setLogs(transformedLogs);
                setTotalPages(paginated?.last_page || 1);
            } else if (response.data && !response.data.success) {
                toast.error(response.data.message || "Failed to fetch audit logs");
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error);
            toast.error("An error occurred while fetching audit logs");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleRefresh = () => {
        toast.info("Refreshing audit logs...");
        fetchLogs();
    };

const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="space-y-6">
            <DashboardHeader
                title="Audit Logs"
                subtitle="Track all your activity and blockchain transactions"
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    View your complete activity history including KYB approvals, proposals, and XRPL
                    transactions
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <AuditLogFilters onFilterChange={handleFilterChange} />

            {/* Audit Logs Table */}
            <AuditLogTable logs={logs} isLoading={isLoading} network={process.env.NEXT_PUBLIC_XRPL_NETWORK || "testnet"} />

            {/* Pagination */}
            {!isLoading && logs.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className={
                                        currentPage === pageNum
                                            ? "bg-primary hover:bg-primary/90"
                                            : ""
                                    }
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
