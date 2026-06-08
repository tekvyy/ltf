"use client";

import { useState } from "react";
import { useXrplWallet } from "@/lib/xrpl";
import { WalletSetupModal } from "./wallet-setup-modal";
import { WalletConnected } from "./wallet-connected";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Fingerprint, Loader2 } from "lucide-react";

export function MyWallet() {
  const { isConnected, isInitialized } = useXrplWallet();
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">My Wallet</h2>
        <Separator className="my-4" />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show connected wallet
  if (isConnected) {
    return <WalletConnected />;
  }

  // Show setup prompt
  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">My Wallet</h2>
        <Separator className="my-4" />
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Fingerprint className="h-8 w-8 text-primary" />
          </div>
          <p className="text-foreground mb-2 font-medium">No wallet connected</p>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
            Create a secure XRPL wallet using your device&apos;s biometrics. No seed phrases required.
          </p>
          <Button
            onClick={() => setShowSetupModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-6 rounded-full"
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            Set Up Passkey Wallet
          </Button>
        </div>
      </div>

      <WalletSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />
    </>
  );
}
