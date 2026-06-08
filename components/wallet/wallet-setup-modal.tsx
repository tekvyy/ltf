"use client";

import { useState } from "react";
import { useXrplWallet } from "@/lib/xrpl";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

interface WalletSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (address: string) => void;
}

export function WalletSetupModal({ isOpen, onClose, onSuccess }: WalletSetupModalProps) {
  const { connect, isConnecting } = useXrplWallet();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetup = async () => {
    setError(null);
    setSuccess(false);

    try {
      const address = await connect();

      if (address) {
        setSuccess(true);
        setConnectedAddress(address);
        onSuccess?.(address);
        // Auto close after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError("Failed to create wallet. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during setup. Please ensure your device supports passkeys.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Fingerprint className="h-8 w-8 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Set Up Your XRPL Wallet
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            Create a secure wallet using your device&apos;s biometrics (Face ID, Touch ID, or fingerprint).
            Your private key is stored securely on this device.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success message */}
          {success && connectedAddress && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Wallet created successfully!
              </div>
              <div className="font-mono text-xs break-all">{connectedAddress}</div>
            </div>
          )}

          {/* Features list */}
          <div className="text-left mb-6 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Secured by your device biometrics</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Non-custodial - only you have access</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Device-bound security</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSetup}
              disabled={isConnecting || success}
              className="w-full bg-primary hover:bg-primary/90 py-6"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Wallet & Funding...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Wallet Created
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Create Wallet with Passkey
                </>
              )}
            </Button>

            {!success && (
              <Button variant="ghost" onClick={onClose} className="w-full">
                Maybe Later
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
