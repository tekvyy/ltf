"use client";

import { useState, useEffect } from "react";
import { useXrplWallet } from "@/lib/xrpl/provider";
import { mptService } from "@/lib/xrpl/mpt-service";
import { Coins, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface MPTIssuance {
    id: string;
    sequence: number;
    maxAmount: string;
    outstandingAmount: string;
    assetScale: number;
    transferFee: number;
    metadata: any;
    flags: number;
}

export function MyTokens() {
    const { address } = useXrplWallet();
    const [issuances, setIssuances] = useState<MPTIssuance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchIssuances() {
            if (!address) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await mptService.getMPTokenIssuances(address);
                setIssuances(data);
            } catch (err) {
                console.error("Error fetching MPT issuances:", err);
                setError("Failed to load tokens");
            } finally {
                setIsLoading(false);
            }
        }

        fetchIssuances();
    }, [address]);

    const getExplorerUrl = (issuanceId: string) => {
        const network = process.env.NEXT_PUBLIC_XRPL_NETWORK || 'testnet';
        if (network === 'testnet') {
            return `https://testnet.xrpl.org/ledger/${issuanceId}`;
        }
        return `https://livenet.xrpl.org/ledger/${issuanceId}`;
    };

    if (!address) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    My Tokens
                </h2>
            </div>

            <Separator className="my-4" />

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            ) : issuances.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Coins className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">No tokens issued yet</p>
                    <p className="text-xs text-muted-foreground">
                        Create your first MPT from the dashboard
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {issuances.map((issuance) => (
                        <div
                            key={issuance.id}
                            className="border rounded-lg p-4 hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-base">
                                            {issuance.metadata?.ticker || issuance.metadata?.t || 'LIBELIT'}
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                            Active
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-3">
                                        {issuance.metadata?.name || issuance.metadata?.n || 'Development Token'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Max Supply:</span>
                                            <p className="font-medium text-foreground">
                                                {parseInt(issuance.maxAmount).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Outstanding:</span>
                                            <p className="font-medium text-foreground">
                                                {parseInt(issuance.outstandingAmount || '0').toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Asset Class:</span>
                                            <p className="font-medium text-foreground uppercase">
                                                {issuance.metadata?.asset_class || issuance.metadata?.ac || 'RWA'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Transfer Fee:</span>
                                            <p className="font-medium text-foreground">
                                                {issuance.transferFee / 1000}%
                                            </p>
                                        </div>
                                    </div>

                                    {issuance.metadata?.desc || issuance.metadata?.d ? (
                                        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                                            {issuance.metadata.desc || issuance.metadata.d}
                                        </p>
                                    ) : null}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-4"
                                    onClick={() => window.open(getExplorerUrl(issuance.id), '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Issuance ID:</span>
                                    <code className="text-muted-foreground font-mono text-[10px]">
                                        {issuance.id.substring(0, 16)}...
                                    </code>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
