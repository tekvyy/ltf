"use client";

import { WalletHeader } from "@/components/wallet/wallet-header";
import { MyWallet } from "@/components/wallet/my-wallet";
import { MyTokens } from "@/components/wallet/my-tokens";
import { TransactionsHistory } from "@/components/wallet/transactions-history";

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <WalletHeader title="Wallet" />

      {/* My Wallet Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <MyWallet />
      </div>

      {/* My Tokens Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <MyTokens />
      </div>

      {/* Transactions History */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <TransactionsHistory transactions={[]} />
      </div>
    </div>
  );
}
