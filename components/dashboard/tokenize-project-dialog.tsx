"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Coins, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { useXrplWallet } from "@/lib/xrpl/provider";
import { mptService } from "@/lib/xrpl/mpt-service";
import { walletManager } from "@/lib/xrpl/wallet-manager";
import { useAuth } from "@/components/auth";
import type { LenderProject } from "@/lib/types/lender";

interface TokenizeProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: LenderProject;
}

export function TokenizeProjectDialog({ open, onOpenChange, project }: TokenizeProjectDialogProps) {
    const [tokenAmount, setTokenAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { address, connect } = useXrplWallet();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
            setError("Please enter a valid token amount");
            return;
        }

        if (!address || !user) {
            setError("Wallet not connected");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setTxHash(null);

        try {
            // Load wallet from local storage
            let wallet = walletManager.loadWallet(user.id.toString());

            if (!wallet) {
                throw new Error(`Wallet capability missing. Please try reconnecting your wallet.`);
            }

            // Create metadata for the project
            const metadata = mptService.createProjectMetadata(
                project?.title || "Development Project",
                project?.id || 0,
                tokenAmount
            );

            // Create MPToken issuance
            const result = await mptService.createMPTokenIssuance({
                wallet,
                metadata,
                maximumAmount: tokenAmount,
                assetScale: 0, // No decimal places for simplicity
                transferFee: 0
            });

            if (result.success && result.transactionHash) {
                setTxHash(result.transactionHash);
                console.log("MPToken created successfully:", result);
            } else {
                throw new Error(result.error || "Failed to create MPToken");
            }
        } catch (err) {
            console.error("Error creating MPToken:", err);
            setError(err instanceof Error ? err.message : "Failed to create MPToken");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setTokenAmount("");
        setTxHash(null);
        setError(null);
        onOpenChange(false);
    };

    const explorerUrl = txHash
        ? `https://testnet.xrpl.org/transactions/${txHash}`
        : null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] gap-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        Tokenise Project
                    </DialogTitle>
                    <DialogDescription>
                        Create Multi-Purpose Tokens (MPT) for fractional ownership of your development project.
                    </DialogDescription>
                </DialogHeader>

                {txHash ? (
                    <div className="space-y-4 px-6 py-4">
                        <div className="flex items-center justify-center py-6">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">MPT Created Successfully!</h3>
                            <p className="text-sm text-muted-foreground">
                                Your Multi-Purpose Tokens have been minted to your wallet.
                            </p>
                            <div className="bg-muted p-3 rounded-lg text-xs font-mono break-all mt-4">
                                {txHash}
                            </div>
                            {explorerUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 w-full"
                                    onClick={() => window.open(explorerUrl, '_blank')}
                                >
                                    View on XRPL Explorer
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-0">
                        <div className="space-y-4 px-6 py-2">
                            {project && (
                                <div className="bg-muted/50 border p-3 rounded-lg space-y-1">
                                    <p className="text-sm font-medium">{project.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {project.city}, {project.country}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="tokenAmount">Token Amount</Label>
                                <Input
                                    id="tokenAmount"
                                    type="number"
                                    placeholder="e.g., 1000"
                                    value={tokenAmount}
                                    onChange={(e) => setTokenAmount(e.target.value)}
                                    min="1"
                                    step="1"
                                    disabled={isSubmitting}
                                    required
                                    className="h-10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Number of MPT tokens to mint for this project
                                </p>
                            </div>

                            {error && (
                                <div className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                    {error.includes("reconnecting") && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    await connect();
                                                    setError(null);
                                                } catch (e) {
                                                    console.error("Reconnection failed:", e);
                                                }
                                            }}
                                            className="ml-6 bg-red-100 text-red-700 hover:bg-red-200 w-fit"
                                        >
                                            Reconnect Wallet
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 space-y-1">
                                <p className="text-xs font-medium text-blue-900">About MPT Tokens</p>
                                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                    <li>Tokens represent fractional ownership</li>
                                    <li>Can be transferred and traded on XRPL</li>
                                    <li>Immutable once created</li>
                                    <li>Stored on XRPL testnet</li>
                                </ul>
                            </div>
                        </div>

                        <DialogFooter className="mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !tokenAmount}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create MPT"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
