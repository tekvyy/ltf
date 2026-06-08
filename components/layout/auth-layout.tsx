import Image from "next/image";
import { CredelitMark } from "@/components/shared/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc: string;
}

const proofPoints = [
  "On-chain transparency for every drawdown",
  "Institutional-grade KYB & compliance",
  "Fractional ownership via tokenized debt",
];

export function AuthLayout({ children, imageSrc }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        {children}
      </div>

      {/* Right side - Branded image panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Brand-toned scrim */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.28_0.06_40/0.92)] via-[oklch(0.3_0.05_40/0.55)] to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-[0.15] mix-blend-overlay" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <CredelitMark width={30} height={30} className="text-white" />
            <span className="text-xl font-semibold tracking-tight">Credelit</span>
          </div>

          <div className="max-w-md space-y-6">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Real-estate debt,
              <br />
              transparently financed.
            </h2>
            <ul className="space-y-3">
              {proofPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">
                    ✓
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Credelit. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
