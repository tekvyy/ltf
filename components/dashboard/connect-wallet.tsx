"use client";

import { useState } from "react";
import { useXrplWallet } from "@/lib/xrpl";
import { useAuth } from "@/components/auth";
import { WalletSetupModal } from "@/components/wallet/wallet-setup-modal";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle, Wallet } from "lucide-react";

export function ConnectWallet() {
  const { isConnected, address, isInitialized } = useXrplWallet();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const { user } = useAuth(); // Get user to determine dashboard path

  // Don't show anything while loading
  if (!isInitialized) {
    return null;
  }

  const walletPath = user?.type === "developer" ? "/developer/dashboard/wallet" : "/dashboard/wallet";

  // Show connected state
  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-green-800">Wallet Connected</h2>
            <p className="text-sm text-green-600 font-mono">
              {address.slice(0, 8)}...{address.slice(-8)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-green-300 text-green-700 hover:bg-green-100 shrink-0 px-6 rounded-full"
          onClick={() => window.location.href = walletPath}
        >
          <Wallet className="mr-2 h-4 w-4" />
          View Wallet
        </Button>
      </div>
    );
  }

  // Show connect prompt
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Set up your XRPL wallet</h2>
            <p className="text-sm text-muted-foreground">
              Create a secure wallet with passkeys to manage your investments.
            </p>
          </div>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-white shrink-0 px-6 rounded-full"
          onClick={() => setShowSetupModal(true)}
        >
          <Fingerprint className="mr-2 h-4 w-4" />
          Set Up Wallet
        </Button>
      </div>

      <WalletSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />
    </>
  );
}
