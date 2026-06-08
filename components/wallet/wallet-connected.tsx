"use client";

import { useState, useEffect } from "react";
import { useXrplWallet } from "@/lib/xrpl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { XRPL_NETWORK } from "@/lib/xrpl";

export function WalletConnected() {
  const { address, walletData, getBalance, disconnect, fundWallet } = useXrplWallet();
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const bal = await getBalance();
      // Balance is already in XRP
      const xrpBalance = parseFloat(bal).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
      setBalance(xrpBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance("0");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExplorerUrl = () => {
    const baseUrl =
      XRPL_NETWORK === "mainnet"
        ? "https://livenet.xrpl.org"
        : XRPL_NETWORK === "testnet"
          ? "https://testnet.xrpl.org"
          : "https://devnet.xrpl.org";
    return `${baseUrl}/accounts/${address}`;
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  if (!address) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Wallet</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Connected
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-card/10 rounded-full flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{walletData?.label || "Primary Wallet"}</p>
            <p className="text-xs text-muted-foreground">
              XRPL {XRPL_NETWORK.charAt(0).toUpperCase() + XRPL_NETWORK.slice(1)}
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">Balance</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">{balance} XRP</p>
            <button
              onClick={fetchBalance}
              disabled={isLoadingBalance}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBalance ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm font-mono">{formatAddress(address)}</code>
            <div className="flex gap-1">
              <button
                onClick={copyAddress}
                className="p-1.5 hover:bg-card/10 rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-card/10 rounded transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" disabled>
          Receive
        </Button>
        <Button variant="outline" className="flex-1" disabled>
          Send
        </Button>
        {XRPL_NETWORK !== "mainnet" && (
          <Button
            variant="secondary"
            className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
            disabled={isLoadingBalance}
            onClick={async () => {
              setIsLoadingBalance(true);
              try {
                await fundWallet();
                // Wait a moment for the transaction to settle
                await new Promise(resolve => setTimeout(resolve, 2000));
                await fetchBalance();
              } catch (error) {
                console.error("Failed to fund wallet:", error);
                // Still try to fetch balance in case it partially succeeded
                await fetchBalance();
              } finally {
                setIsLoadingBalance(false);
              }
            }}
          >
            {isLoadingBalance ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Funding...
              </>
            ) : (
              "Fund (Testnet)"
            )}
          </Button>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-muted-foreground text-center">
        {XRPL_NETWORK !== "mainnet" && (
          <>
            This is a {XRPL_NETWORK} wallet. Funds are not real XRP.
            <br />
            <span className="text-blue-600">Fund button is for Testnet/Devnet only.</span>
          </>
        )}
      </p>
    </div>
  );
}
