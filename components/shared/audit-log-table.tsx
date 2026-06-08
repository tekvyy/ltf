"use client";

import { Fragment, useState } from "react";
import type { AuditLog } from "@/lib/types/audit-logs";
import {
    formatEventType,
    formatTimestamp,
    getRelativeTime,
    getEventCategoryColor,
    getEventIcon,
    truncateHash,
    getXrplExplorerUrl,
} from "@/lib/utils/audit-logs";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface AuditLogTableProps {
    logs: AuditLog[];
    isLoading?: boolean;
    network?: string;
}

export function AuditLogTable({ logs, isLoading = false, network = "testnet" }: AuditLogTableProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleCopyHash = (hash: string) => {
        navigator.clipboard.writeText(hash);
        toast.success("Transaction hash copied to clipboard");
    };

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    if (isLoading) {
        return (
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Transaction
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3].map((i) => (
                                <tr key={i} className="border-b">
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-muted rounded animate-pulse w-32" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-6 bg-muted rounded animate-pulse w-24" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-muted rounded animate-pulse w-48" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-muted rounded animate-pulse w-32" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="rounded-xl border bg-card p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                        <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">No audit logs yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Your activity will be tracked and displayed here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Event
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Transaction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {logs.map((log) => {
                            const Icon = getEventIcon(log.event_type);
                            const isExpanded = expandedRow === log.id;

                            return (
                                <Fragment key={log.id}>
                                    <tr className="hover:bg-muted transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{formatTimestamp(log.occurred_at)}</div>
                                            <div className="text-xs text-muted-foreground">{getRelativeTime(log.occurred_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEventCategoryColor(
                                                        log.event_category
                                                    )}`}
                                                >
                                                    {formatEventType(log.event_type)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-foreground">{log.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.xrpl_txn_hash ? (
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {truncateHash(log.xrpl_txn_hash)}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyHash(log.xrpl_txn_hash!)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            window.open(getXrplExplorerUrl(log.xrpl_txn_hash!, network), "_blank")
                                                        }
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleRow(log.id)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                    {isExpanded && log.metadata && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 bg-muted">
                                                <div className="text-sm">
                                                    <div className="font-medium text-foreground mb-2">Additional Details:</div>
                                                    <pre className="bg-card p-3 rounded border text-xs overflow-auto">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
                {logs.map((log) => {
                    const Icon = getEventIcon(log.event_type);
                    const isExpanded = expandedRow === log.id;

                    return (
                        <div key={log.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEventCategoryColor(
                                            log.event_category
                                        )}`}
                                    >
                                        {formatEventType(log.event_type)}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">{getRelativeTime(log.occurred_at)}</span>
                            </div>
                            <p className="text-sm text-foreground mb-2">{log.description}</p>
                            <div className="text-xs text-muted-foreground mb-2">{formatTimestamp(log.occurred_at)}</div>
                            {log.xrpl_txn_hash && (
                                <div className="flex items-center gap-2 mb-2">
                                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                        {truncateHash(log.xrpl_txn_hash)}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyHash(log.xrpl_txn_hash!)}
                                        className="h-7 w-7 p-0"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            window.open(getXrplExplorerUrl(log.xrpl_txn_hash!, network), "_blank")
                                        }
                                        className="h-7 w-7 p-0"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleRow(log.id)}
                                        className="w-full text-xs"
                                    >
                                        {isExpanded ? "Hide" : "Show"} Details
                                        {isExpanded ? (
                                            <ChevronUp className="h-3 w-3 ml-1" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3 ml-1" />
                                        )}
                                    </Button>
                                    {isExpanded && (
                                        <pre className="mt-2 bg-muted p-2 rounded border text-xs overflow-auto">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
